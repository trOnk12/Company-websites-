---
title: What happens when a new class breaks C2's proof?
short: Class hierarchy analysis and deoptimization
summary: Puzzle 21 inlined an open method's body. Load a subclass that overrides a method C2 already inlined without any check, and read in HotSpot's own log how it throws the compiled code away, moves a running call back to the interpreter, and carries on.
takeaway: Class hierarchy analysis lets C2 treat an open method like a final one while no loaded class overrides it, and records that assumption. Loading an override breaks it: HotSpot deoptimizes, retiring the compiled code and moving any running call back to the interpreter, then recompiles. So Kotlin's final-by-default buys little speed: an open method with no override loaded is compiled just like a final one.
---

## The problem

Puzzle 21 inlined Counter.next into use behind a class check, when other classes were loaded. And puzzle 11 said a class is loaded only when first needed. Put the two together:

```kotlin
open class Counter {
    open fun next(v: Int) = v + 1
}

class Loud : Counter() {
    override fun next(v: Int) = v + 10
}

fun use(c: Counter) = c.next(1)

fun main(args: Array<String>) {
    var sum = 0
    val plain = Counter()
    repeat(200_000) { sum += use(plain) }
    println("phase 1 done: $sum")
    if (args.isNotEmpty()) {
        val loud = Loud()
        repeat(200_000) { sum += use(loud) }
        println("phase 2 done: $sum")
    }
}
```

During phase 1, Loud is not loaded: nothing has needed it yet. So when C2 compiles use, Counter.next has no override anywhere in the running program. Then phase 2 creates a Loud. The compiled use is still there; what happens to it?

```text
$ java -XX:+PrintCompilation -cp out:kotlin-stdlib.jar HotKt x | grep -E "HotKt::use|Loud::next|phase"
36   34       3       HotKt::use (12 bytes)
37   37       4       HotKt::use (12 bytes)
37   34       3       HotKt::use (12 bytes)   made not entrant
phase 1 done: 400000
39   37       4       HotKt::use (12 bytes)   made not entrant
39   40       4       HotKt::use (12 bytes)
39   41       3       Loud::next (5 bytes)
40   43       4       Loud::next (5 bytes)
40   41       3       Loud::next (5 bytes)   made not entrant
phase 2 done: 2600000
```

(Filtered with grep; a second run showed the same order, with use's level 4 code retired at 39 ms and recompiled in the same millisecond.) The level 4 use, compile 37, was retired just after phase 1, and a new level 4 use, compile 40, appeared. Puzzle 20's made not entrant meant "replaced by a better version". This time nothing better had arrived first. Why was compile 37 thrown away?

## See it

```diagram deopt
```

## See it

```diagram deopt
```

## The building block

When C2 compiled use in phase 1, it checked the classes loaded so far: Counter.next had no override. **Class hierarchy analysis** (CHA) is this check: proving from the loaded classes that an open method has exactly one version. With that proof, C2 treated c.next(1) like a call to a final method and inlined Counter's body with no class check at all. The OpenJDK wiki: virtual calls "are often demoted to "special" invocations, if the class hierarchy permits it. A dependency is registered in case further class loading spoils things."

That registered dependency is visible in the LogCompilation log, a detailed log file of every compiler event (diagnostic, so it also needs UnlockDiagnosticVMOptions). In C2's compile of use:

```text
<dependency type='unique_concrete_method_4' ctxk='1389' x='1395' x2='1389' x3='1395'/>
<call method='1395' count='15982' prof_factor='1.000000' inline='1'/>
<inline_success reason='inline (hot)'/>
```

The numbers are ids the log defines elsewhere: 1389 is Counter, 1395 is Counter.next. "Unique concrete method": Counter.next is the only version. Then Loud is loaded, and the log continues:

```text
<dependency_failed type='unique_concrete_method_4' ctxk='Counter' x='Counter next (I)I' x2='Counter' x3='Counter next (I)I' witness='Loud' stamp='0.043'/>
<make_not_entrant thread='1575' compile_id='36' compiler='c2' level='4' stamp='0.043'/>
```

(This was a separate run: here use's level 4 code is compile 36, and compile 37 is main's loop, below.) Loading Loud is the witness that breaks the assumption, and HotSpot reacts with **deoptimization**: it retires the compiled code, so no new call can enter it, and moves any call that is running in it back to the interpreter. The wiki defines it as "changing an optimized stack frame to an unoptimized one", and "throwing away code with invalid optimistic optimizations". A running call is converted on the spot: HotSpot rebuilds the interpreter's frame, local slots and operand stack (puzzle 1) from the compiled code's state, and the method continues from the same bytecode instruction. The same log shows one, for main's loop, which C1 had compiled with a related assumption (leaf_type: Counter has no subclass):

```text
<deoptimized thread='1575' reason='constraint' pc='0x00007f0f3480df98' compile_id='37' compile_kind='osr' compiler='c1' level='3'>
<jvms bci='95' method='HotKt main ([Ljava/lang/String;)V' bytes='167' count='1' backedge_count='200000' iicount='1'/>
```

jvms is the spot where the call continues: bci, the bytecode offset, 95 in main. After that the method is back at level 0, counting again (puzzle 20's red arrow). Here use was recompiled at level 4 within a millisecond, now from a profile that has met Loud.

Deoptimization once is cheap: in these runs it cost well under a millisecond, and the method was recompiled. The wiki: "A method may in principle be deoptimized dozens of times." Class loading is not the only thing that breaks C2's assumptions; puzzle 24 shows the ones that come from the profile.



### So does final matter?

Puzzle 10 left a question: does Kotlin's final-by-default make code faster? Now the answer is complete. A final method never needs CHA: it can't be overridden, so C2 calls or inlines it directly with no dependency. An open method that no loaded class overrides gets exactly the same compiled code through CHA, plus a dependency that costs nothing until an override is loaded. When one is, the call is deoptimized once (above) and recompiled from the type profile: still inlined behind a class check if one or two classes reach it, a method-table lookup if more (puzzle 21). So choose final or open for design, as puzzle 10 said; the speed difference is one deoptimization at most.

### The edges

- *Android.* ART's JIT also compiles on assumptions and deoptimizes; dex2oat's ahead-of-time code can't count on a profile from this run, which is one reason ART keeps a JIT (puzzle 18).
- *Made not entrant has two meanings.* Replaced by a newer version (puzzle 20), or retired because an assumption broke. On JDK 21 only LogCompilation tells them apart; from JDK 25, PrintCompilation adds the reason: made not entrant: not used (replaced), marked for deoptimization (a dependency failed), or the reason puzzle 24 explains.
- *No more made zombie.* Articles written before 2023 show a second line, made zombie, when retired code was freed. JDK 20 removed that state (JDK-8290025, "Remove the Sweeper"); on JDK 21 the last line you see for retired code is made not entrant.
- *Loading plugins late* (puzzle 14) can deoptimize hot code across the program, because new classes can override methods that CHA had proved unique.

## The analogy

The polished sheet for "refund at whatever branch" was written when only one branch existed, so it says "do branch A's refund", with a note in the office register: "valid only while A is the only branch". The day branch B opens, the register flags the sheet, it's pulled from every desk, and a clerk halfway through it carries on from the same line with the manual. A new sheet is written once the tallies include B.

## Run it yourself

Save the program above as Hot.kt, then:

```sh
kotlinc Hot.kt -d out
java -XX:+PrintCompilation -cp out:kotlinc/lib/kotlin-stdlib.jar HotKt x | grep -E "HotKt::use|phase"
java -XX:+UnlockDiagnosticVMOptions -XX:+LogCompilation -XX:LogFile=hot.log \
     -cp out:kotlinc/lib/kotlin-stdlib.jar HotKt x
grep -E "dependency_failed|make_not_entrant|deoptimized" hot.log
```

Replace kotlinc/lib with the lib folder of your kotlinc. Run HotKt once without the x and predict which made not entrant line disappears.

## Check yourself

- Phase 2 creates a Loud but never passes it to use; it keeps passing Counter objects. Does use's level 4 code survive?::*No: loading Loud fails the recorded assumption, whatever use is passed||Yes: use never meets a Loud, so nothing it assumed is wrong >> The assumption was about the loaded classes, and loading Loud breaks it. >> s4||Yes, but only until the garbage collector next runs >> Deoptimization happens when the dependency fails, at class loading, not when the collector runs. >> the-building-block::CHA's assumption is about what is loaded.
- Why does HotSpot move a running call back to the interpreter instead of letting it finish in the old compiled code?::*The old code can be wrong now: it runs Counter's body for a Loud||Compiled code can't run while a class is being loaded >> Other compiled code keeps running; only code that depends on the broken assumption is affected. >> s4||The interpreter is faster for a call that is already running >> The interpreter is slower; it is used because it follows the bytecode, which is always correct. >> the-building-block::Code built on a false assumption gives wrong results.
- Your app's hot method calls an open Kotlin method that no class overrides. A colleague proposes marking the class final for speed. What's the honest answer?::*CHA already gives the same code, and final only rules out one later deoptimization||It removes a method-table lookup from every call >> With no override loaded, C2 already calls or inlines it directly. >> the-building-block||It makes javap show `invokestatic` instead of `invokevirtual` >> Puzzle 10: final doesn't change the caller's bytecode. >> the-building-block::Decide open or final for design.

## Sources

- [OpenJDK wiki: HotSpot performance techniques](https://wiki.openjdk.org/display/HotSpot/PerformanceTechniques) ("Deoptimization is the process of changing an optimized stack frame to an unoptimized one. With respect to compiled methods, it is also the process of throwing away code with invalid optimistic optimizations, and replacing it by less-optimized, more robust code. A method may in principle be deoptimized dozens of times."; "If a class is loaded that invalidates an earlier class hierarchy analysis, any affected method activations, in any thread, are forced to a safepoint and deoptimized."; "Such indirect deoptimization is mediated by the dependency system. If the compiler makes an unchecked assumption, it must register a checkable dependency."; "Virtual (and interface) invocations are often demoted to "special" invocations, if the class hierarchy permits it. A dependency is registered in case further class loading spoils things."; "Depending on the profile, a failure of the optimistic check will either deoptimize or run through a (slow) vtable/itable call.")
- [OpenJDK source, dependencies.hpp, jdk-21+35](https://github.com/openjdk/jdk/blob/jdk-21%2B35/src/hotspot/share/code/dependencies.hpp#L38-L47) (lines 38–47: "Dependencies represent assertions (approximate invariants) within the runtime system, e.g. class hierarchy changes. An example is an assertion that a given method is not overridden"; "Compiled code which relies on such assertions must be discarded if they are overturned by changes in the runtime system."; "The benefit, of course, is performing optimistic optimizations (!) on the object code.")
- [OpenJDK source, deoptimization.hpp, jdk-21+35](https://github.com/openjdk/jdk/blob/jdk-21%2B35/src/hotspot/share/runtime/deoptimization.hpp#L108) (line 108: "Reason_constraint, // arbitrary runtime constraint violated")
- [OpenJDK source, nmethod.cpp, jdk-25+36](https://github.com/openjdk/jdk/blob/jdk-25%2B36/src/hotspot/share/code/nmethod.cpp#L1989) (line 1989: ss.print("made not entrant: %s", reason)); the reasons: [nmethod.hpp line 637](https://github.com/openjdk/jdk/blob/jdk-25%2B36/src/hotspot/share/code/nmethod.hpp#L637) (make_not_entrant("not used")), [codeCache.cpp line 1364](https://github.com/openjdk/jdk/blob/jdk-25%2B36/src/hotspot/share/code/codeCache.cpp#L1364) (make_not_entrant("marked for deoptimization")), [deoptimization.cpp line 2458](https://github.com/openjdk/jdk/blob/jdk-25%2B36/src/hotspot/share/runtime/deoptimization.cpp#L2458) (make_not_entrant("uncommon trap"))
- [JDK-8290025: Remove the Sweeper](https://bugs.openjdk.org/browse/JDK-8290025) (Fix Version: 20; "This removes the notion of is_zombie(), is_unloaded() and hence is_alive() from the JVM.")
- [The java command (JDK 21)](https://docs.oracle.com/en/java/javase/21/docs/specs/man/java.html) (-XX:CompileCommand: "it's also possible to use the method name format produced by the -XX:+PrintCompilation and -XX:+LogCompilation options")
- The PrintCompilation outputs (two runs, plus two runs of a version whose phase 2 creates a Loud but keeps passing Counter: use was still retired and recompiled) and the LogCompilation log (one run) were produced in this session with kotlinc 2.2.21 and OpenJDK 21.0.12.
