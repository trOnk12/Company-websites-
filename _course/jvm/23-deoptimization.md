---
title: What happens when C2's guess turns out wrong?
short: Deoptimization, back to the interpreter
summary: Puzzles 20 and 21 showed C2 compiling from what a method has done so far. Load a subclass that overrides a method C2 already inlined, take a branch the profile never saw, and read in HotSpot's own log how it throws compiled code away and carries on.
takeaway: C2 compiles on assumptions: no loaded class overrides this method (class hierarchy analysis), this branch is never taken, this call only meets these classes. When one breaks, HotSpot deoptimizes: it retires the compiled code, moves any running call back to the interpreter, and recompiles later with the new facts. That's why Kotlin's final-by-default buys little speed: an open method with no override loaded is compiled just like a final one.
---

## The problem

Puzzle 21 inlined Counter.next into use behind a class check, with a "plan B" if the check fails. And puzzle 11 said a class is loaded only when first needed. Put the two together:

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

(This was a separate run, so the compile number is 36, not 37.) Loading Loud is the witness that breaks the assumption, and HotSpot reacts with **deoptimization**: it retires the compiled code, so no new call can enter it, and moves any call that is running in it back to the interpreter. The wiki defines it as "changing an optimized stack frame to an unoptimized one", and "throwing away code with invalid optimistic optimizations". A running call is converted on the spot: HotSpot rebuilds the interpreter's frame, local slots and operand stack (puzzle 1) from the compiled code's state, and the method continues from the same bytecode instruction. The same log shows one, for main's loop, which C1 had compiled with the same kind of assumption:

```text
<deoptimized thread='1575' reason='constraint' pc='0x00007f0f3480df98' compile_id='37' compile_kind='osr' compiler='c1' level='3'>
<jvms bci='95' method='HotKt main ([Ljava/lang/String;)V' bytes='167' count='1' backedge_count='200000' iicount='1'/>
```

After that the method is back at level 0, counting again (puzzle 20's red arrow). Here use was recompiled at level 4 within a millisecond, now from a profile that has met Loud.

### Two more broken assumptions

Class loading is one trigger. The others come from the profile. C2 doesn't compile code for cases the profile never saw; it compiles an **uncommon trap** there instead: a spot that deoptimizes the method if it's ever reached. The wiki: "The compiler may stub out an untaken branch and deoptimize if it is ever taken." This program calls label 500,000 times with positive scores, then once with -5:

```kotlin
fun label(score: Int): Int = if (score < 0) -1 else score * 2
```

```text
only positive scores: 49999500000
276    9       4       BranchKt::label (12 bytes)   made not entrant
one negative score: 49999499999
```

and LogCompilation names the reason:

```text
<uncommon_trap thread='2905' reason='unstable_if' action='reinterpret' debug_id='0' compile_id='9' compiler='c2' level='4' stamp='0.279'>
<jvms bci='1' method='BranchKt label (I)I' bytes='12' count='202868' iicount='202868'/>
```

unstable_if is HotSpot's name for "a branch predicted always false was taken" (its source's comment). Puzzle 21's plan B is the third. Change Hot.kt so that main creates one Loud before phase 1 and never passes it: now CHA can't prove anything, so C2 inlines Counter's body behind a class check, from a type profile that has only met Counter. In phase 2 the first Loud fails the check:

```text
<uncommon_trap thread='11627' reason='class_check' action='maybe_recompile' debug_id='0' compile_id='36' compiler='c2' level='4' stamp='0.041'>
<jvms bci='8' method='HotKt use (LCounter;)I' bytes='12' count='294460' iicount='294460'/>
```

class_check is "saw unexpected object class", at offset 8, the `invokevirtual` of next. In two of three runs the log showed these traps; in the third, use had not reached C2 before phase 2, so there was nothing to deoptimize.

| Assumption C2 made | Based on | What breaks it |
| --- | --- | --- |
| this open method has one version | the loaded classes (CHA) | loading a class that overrides it |
| this branch is never taken | the method profile | taking it: an uncommon trap |
| this call meets only class X | the type profile | another class arriving |

### Is deoptimization a problem?

Once, no: in the runs above it cost well under a millisecond, and the method was recompiled. The wiki: "A method may in principle be deoptimized dozens of times." It becomes a problem when it repeats: code that keeps switching cases can cycle between compiled and interpreted, and a benchmark that takes a path for the first time while being timed measures the deoptimization (puzzle 24). HotSpot counts traps of one kind at one spot; the PerBytecodeTrapLimit option, 4 by default, limits the traps "of one kind" at one bytecode offset, so a spot that keeps failing stops being compiled on that assumption.

### So does final matter?

Puzzle 10 left a question: does Kotlin's final-by-default make code faster? Now the answer is complete. A final method never needs CHA: it can't be overridden, so C2 calls or inlines it directly with no dependency. An open method that no loaded class overrides gets exactly the same compiled code through CHA, plus a dependency that costs nothing until an override is loaded. When one is, the call is deoptimized once and recompiled from the type profile: still inlined behind a class check if one or two classes reach it, a method-table lookup if more (puzzle 21). So choose final or open for design, as puzzle 10 said; the speed difference is one deoptimization at most.

### The edges

- *Android.* ART's JIT also compiles on assumptions and deoptimizes; dex2oat's ahead-of-time code can't count on a profile from this run, which is one reason ART keeps a JIT (puzzle 18).
- *Made not entrant has two meanings.* Replaced by a newer version (puzzle 20), or retired because an assumption broke. LogCompilation tells them apart; PrintCompilation does not.
- *Loading plugins late* (puzzle 14) can deoptimize hot code across the program, because new classes can override methods that CHA had proved unique.

## The analogy

The polished sheet for "refund at whatever branch" was written when only one branch existed, so it says "do branch A's refund", with a note in the office register: "valid only while A is the only branch". The day branch B opens, the register flags the sheet, it's pulled from every desk, and a clerk halfway through it carries on from the same line with the manual. A new sheet is written once the tallies include B.

## Run it yourself

Save the program above as Hot.kt and Branch.kt with this main:

```kotlin
fun main() {
    var sum = 0L
    repeat(5) {
        for (i in 0 until 100_000) sum += label(i)
        Thread.sleep(50)
    }
    println("only positive scores: $sum")
    sum += label(-5)
    println("one negative score: $sum")
}
```

```sh
kotlinc Hot.kt -d out
java -XX:+PrintCompilation -cp out:kotlinc/lib/kotlin-stdlib.jar HotKt x | grep -E "HotKt::use|phase"
java -XX:+UnlockDiagnosticVMOptions -XX:+LogCompilation -XX:LogFile=hot.log \
     -cp out:kotlinc/lib/kotlin-stdlib.jar HotKt x
grep -E "dependency_failed|make_not_entrant|deoptimized" hot.log
```

Run HotKt once without the x and predict which made not entrant line disappears.

## Check yourself

- In Hot.kt, main creates a Loud before phase 1 but passes only Counter objects until phase 2. When phase 2 starts, what happens to use's level 4 code?::*A class check fails for the first Loud, and use deoptimizes||No deoptimization: CHA never proved next unique, so nothing can break >> C2 still assumed something, from the type profile: only Counter. That check fails for Loud. >> the-building-block||A deoptimization when Loud is created, before phase 1 >> use hasn't been compiled yet when Loud is loaded at the start. >> s4::The assumption moved from the loaded classes to the profile.
- Why does HotSpot move a running call back to the interpreter instead of letting it finish in the old compiled code?::*The old code can be wrong now: it runs Counter's body for a Loud||Compiled code can't run while a class is being loaded >> Other compiled code keeps running; only code that depends on the broken assumption is affected. >> s4||The interpreter is faster for a call that is already running >> The interpreter is slower; it is used because it follows the bytecode, which is always correct. >> the-building-block::Code built on a false assumption gives wrong results.
- Your app's hot method calls an open Kotlin method that no class overrides. A colleague proposes marking the class final for speed. What's the honest answer?::*CHA already gives the same code, and final only rules out one later deoptimization||It removes a method-table lookup from every call >> With no override loaded, C2 already calls or inlines it directly. >> the-building-block||It makes javap show `invokestatic` instead of `invokevirtual` >> Puzzle 10: final doesn't change the caller's bytecode. >> the-building-block::Decide open or final for design.

## Sources

- [OpenJDK wiki: HotSpot performance techniques](https://wiki.openjdk.org/display/HotSpot/PerformanceTechniques) ("Deoptimization is the process of changing an optimized stack frame to an unoptimized one. With respect to compiled methods, it is also the process of throwing away code with invalid optimistic optimizations, and replacing it by less-optimized, more robust code. A method may in principle be deoptimized dozens of times."; "The compiler may stub out an untaken branch and deoptimize if it is ever taken."; "If a call site or cast encounters an unexpected type, the compiler deoptimizes."; "If a class is loaded that invalidates an earlier class hierarchy analysis, any affected method activations, in any thread, are forced to a safepoint and deoptimized."; "Such indirect deoptimization is mediated by the dependency system. If the compiler makes an unchecked assumption, it must register a checkable dependency."; "Virtual (and interface) invocations are often demoted to "special" invocations, if the class hierarchy permits it. A dependency is registered in case further class loading spoils things."; "Depending on the profile, a failure of the optimistic check will either deoptimize or run through a (slow) vtable/itable call.")
- [OpenJDK source, dependencies.hpp, jdk-21+35](https://github.com/openjdk/jdk/blob/jdk-21%2B35/src/hotspot/share/code/dependencies.hpp#L38-L47) (lines 38–47: "Dependencies represent assertions (approximate invariants) within the runtime system, e.g. class hierarchy changes. An example is an assertion that a given method is not overridden"; "Compiled code which relies on such assertions must be discarded if they are overturned by changes in the runtime system."; "The benefit, of course, is performing optimistic optimizations (!) on the object code.")
- [OpenJDK source, deoptimization.hpp, jdk-21+35](https://github.com/openjdk/jdk/blob/jdk-21%2B35/src/hotspot/share/runtime/deoptimization.hpp#L89-L147) (line 89: "Reason_class_check, // saw unexpected object class (@bci)"; line 108: "Reason_constraint, // arbitrary runtime constraint violated"; line 117: "Reason_unstable_if, // a branch predicted always false was taken"; line 147: "Action_reinterpret, // invalidate the nmethod, reset IC, maybe recompile")
- [OpenJDK source, globals.hpp, jdk-21+35](https://github.com/openjdk/jdk/blob/jdk-21%2B35/src/hotspot/share/runtime/globals.hpp#L1376-L1378) (line 1376: PerBytecodeTrapLimit 4, "Limit on traps (of one kind) at a particular BCI")
- [The java command (JDK 21)](https://docs.oracle.com/en/java/javase/21/docs/specs/man/java.html) (-XX:CompileCommand: "it's also possible to use the method name format produced by the -XX:+PrintCompilation and -XX:+LogCompilation options")
- The PrintCompilation outputs (two runs of each program) and the LogCompilation logs (one run of each program, three of the version that creates a Loud first) were produced in this session with kotlinc 2.2.21 and OpenJDK 21.0.12.
