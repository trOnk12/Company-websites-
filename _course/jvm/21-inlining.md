---
title: Why does C2 copy small methods into their callers?
short: Inlining, the optimization the others depend on
summary: Puzzle 20 left batch's loop compiled at level 4. See what C2 did with the score call inside it, and what it does with puzzle 10's open next(), where the code to run depends on the receiver's class.
takeaway: Inlining copies a called method's body into the caller's compiled code, so the call, its frame and its method-table lookup disappear and C2 can optimize both together. For an open method, C2 uses the type profile: if a call site met one or two receiver classes it inlines their bodies behind a class check; if it met more, the call is megamorphic and keeps the method-table lookup.
---

## The problem

Puzzle 20 showed batch's loop reaching level 4. Every turn of that loop calls score, and puzzle 1 said what a call costs: a new frame, the arguments copied into it, a jump, and a return. For a method whose whole job is visits * 2 + stars, that's more work than the arithmetic. Did C2 keep paying it?

HotSpot can print what its compilers decided about each call inside a method, with the diagnostic option PrintInlining. Diagnostic options need UnlockDiagnosticVMOptions first, and the CompileCommand option limits the printing to one method:

```text
$ java -XX:+UnlockDiagnosticVMOptions -XX:CompileCommand=quiet \
       -XX:CompileCommand=option,Score::batch,PrintInlining Score
                              @ 14   Score::score (8 bytes)   inline
                              @ 14   Score::score (8 bytes)   inline
                              @ 14   Score::score (8 bytes)   inline (hot)
                              @ 14   Score::score (8 bytes)   inline (hot)
```

The batch lines were removed from the output. batch was compiled four times (by C1 and C2, each once by on-stack replacement and once whole), and every time the call at offset 14, the `invokestatic` of score, says inline.

## See it

```diagram inlining
```

## The building block

**Inlining** is a compiler copying a called method's body into the caller's compiled code. After it, the compiled batch contains sum += i * 2 + stars directly: no call, no frame for score, no return. Compiled score still exists for other callers; batch just doesn't use it.

The saved call is the small win. The big one is what the OpenJDK wiki calls the compiler's "horizon": C2 optimizes one compiled method at a time, and after inlining, score's work is part of batch's, so C2 can optimize the loop "as a whole" (the wiki's words). Puzzle 22's work on new objects works only on inlined code, and puzzle 23 shows C2 inlining on assumptions. That's why inlining is called the optimization every other one depends on.

C2 inlines a method only if it's small: by default at most 35 bytes of bytecode for a call site that runs rarely compared with its caller (the MaxInlineSize option) and 325 for one that runs often (FreqInlineSize, on x86-64). score is 8 bytes. For a method that's too big, the same output says too big or hot method too big (C2), or C1's own too-large message (its exact words are in the sources), instead of inline.

### What about an open method?

score is static, so the call can only ever reach one method. Puzzle 10's use is harder:

```kotlin
open class Counter {
    open fun next(v: Int) = v + 1
}
class Loud : Counter() {
    override fun next(v: Int) = v + 10
}
class Quiet : Counter() {
    override fun next(v: Int) = v
}

fun use(c: Counter) = c.next(1)
```

c.next(1) is an `invokevirtual`, and which body runs depends on the receiver's class (puzzle 10). Which body should C2 copy? It looks at the **type profile**: the part of use's method profile (puzzle 20) where level 3 code counted the receiver classes this call site met. Mixed.kt runs use 300,000 times with 1, 2 or 3 of the classes, all three loaded in every run:

```text
$ java … -XX:CompileCommand=option,MixedKt::use,PrintInlining MixedKt 1
                              @ 8   Counter::next (4 bytes)   inline (hot)
                               \-> TypeProfile (5686/5686 counts) = Counter
$ java … MixedKt 2
                              @ 8   Loud::next (5 bytes)   inline (hot)
                              @ 8   Counter::next (4 bytes)   inline (hot)
                               \-> TypeProfile (11433/22867 counts) = Counter
                               \-> TypeProfile (11434/22867 counts) = Loud
$ java … MixedKt 3
                              @ 8   Counter::next (4 bytes)   virtual call
```

Only C2's lines for the call at offset 8 are shown; the full output also has C1's lines and the inlined Kotlin null check at offset 3 (`checkNotNullParameter`, puzzle 8). The three cases:

| Receiver classes the call met | Name | What C2 compiles |
| --- | --- | --- |
| 1 | **monomorphic** | that class's body, inlined behind a check "is c exactly a Counter?" |
| 2 | **bimorphic** | both bodies, each behind its own class check |
| 3 or more, none dominant | **megamorphic** | no inlining: the method-table lookup of puzzle 10 (if one class makes up 90% of calls, C2 still inlines that one behind a check) |

The check costs one comparison, much less than a call. If it ever fails, because a class the profile never saw arrives, the compiled code has a plan for that: puzzle 24.

Code compiled without inlining the call, such as C1's here (its line says no static binding: it couldn't prove there is only one method to call), still avoids a full lookup on most calls with an **inline cache**: the call site remembers the first receiver class it sees and jumps straight to that class's method while the same class keeps coming; once a second class arrives it switches to the method-table lookup. The wiki: it flips "to a monomorphic state at the first call", and to "a megamorphic state if a second receiver type is encountered", after which it uses the method table.

### The edges

- *Two meanings of inline.* Kotlin's inline function (puzzle 9) is copied by kotlinc into the class file, for every call, at build time; javap shows it. Inlining here is done by C2, in machine code, while the program runs, only for hot calls, and javap never shows it. Both remove a call; that's all they share.
- *Already compiled big methods.* A called method that already has compiled code larger than 1,000 bytes of machine code (the InlineSmallCode option, on x86-64) isn't inlined (already compiled into a big method), and C2 inlines at most 15 calls deep (MaxInlineLevel).
- *Keep hot methods small.* A big method may not be inlined into its callers. The wiki's advice: keep "hot methods small (35 bytecodes or less) with error processing and slow paths in separate methods".
- *Megamorphic is not slow, just unoptimized.* A method-table lookup is fast (puzzle 10); what's lost is everything inlining would have enabled.
- *Android:* ART's JIT and dex2oat inline too, with their own rules; puzzle 18 links the Android course.

## The analogy

A clerk's procedure says "now ask the arithmetic desk for visits times two plus stars". Walking over, waiting and walking back takes longer than the sum. The senior specialist who writes the polished sheet copies the arithmetic desk's one-line method straight into it. For "ask whichever branch office handles this customer", the specialist checks the tally: if every customer so far belonged to one branch, the sheet says "if it's that branch, do this; otherwise ask". If customers came from many branches, the sheet keeps "look the branch up in the phone list".

## Run it yourself

Save the Kotlin above, with this main, as Mixed.kt:

```kotlin
fun main(args: Array<String>) {
    val kinds = args[0].toInt()
    val all = listOf(Counter(), Loud(), Quiet()).take(kinds)
    var sum = 0
    for (i in 0 until 300_000) {
        sum += use(all[i % kinds])
    }
    println("$kinds receiver classes: $sum")
}
```

```sh
kotlinc Mixed.kt -d out
java -XX:+UnlockDiagnosticVMOptions -XX:CompileCommand=quiet \
     -XX:CompileCommand=option,MixedKt::use,PrintInlining \
     -cp out:kotlinc/lib/kotlin-stdlib.jar MixedKt 2
```

Replace kotlinc/lib with the lib folder of your kotlinc. Before running with 1, 2 and 3, predict the word at the end of each Counter::next line.

## Check yourself

- use has run 100,000 times with only Loud objects; Counter and Quiet are loaded but never passed. What does C2 compile for c.next(1)?::*Loud's body, inlined behind a check that c is a Loud||A method-table lookup, because three classes are loaded >> The type profile counts what the call site met, not what is loaded. >> s4||Counter's body, because the instruction names Counter.next >> The instruction names the method; the profile says which body ran. >> s4::One receiver class: monomorphic.
- Why does inlining make C2's other optimizations possible?::*C2 optimizes one method at a time, and inlining puts the called code inside it||Inlined code skips verification, so C2 is allowed to rewrite it in any way >> Verification happened at linking (puzzle 11); it has nothing to do with inlining. >> the-building-block||An inlined method goes back to the interpreter, which collects a fuller profile >> Inlined code is part of the caller's compiled machine code. >> s2::Inlining widens the horizon.
- score is called from a Kotlin inline function that kotlinc copied into ten callers. How many copies of score's body does C2 make?::*One in each hot compiled caller that inlines it||Ten, one per place kotlinc copied the call to >> kotlinc copied the call site into ten callers; C2 decides per compiled caller, and only for hot ones. >> the-building-block||None: kotlinc already inlined score >> kotlinc copied the inline function's body, which contains a call to score; score itself is a normal method. >> the-building-block::Kotlin's inline and C2's inlining are separate steps.

## Sources

- [OpenJDK wiki: HotSpot performance techniques, Methods](https://wiki.openjdk.org/display/HotSpot/PerformanceTechniques) ("Methods are often inlined. This increases the compiler's "horizon" of optimization."; "If a loop contains a call, it is best if that call is inlined, so that loop can be optimized as a whole."; "Virtual (and interface) invocations with a lopsided type profile are compiled with an optimistic check in favor of the historically common type (or two types)."; "Depending on the profile, a failure of the optimistic check will either deoptimize or run through a (slow) vtable/itable call."; "In the absence of strong profiling information, a virtual (or interface) call site will be compiled in an agnostic state, waiting for the first execution to provide a provisional monomorphic receiver. (This is called an "inline cache".)"; "An inline cache will flip to a monomorphic state at the first call, and stay in that state as long as the exact receiver type (not a subtype) is repeated every time."; "An inline cache will flip to a "megamorphic" state if a second receiver type is encountered."; "Megamorphic calls use assembly-coded vtable and itable stubs")
- [OpenJDK wiki: Inlining](https://wiki.openjdk.org/display/HotSpot/Inlining) ("Segregate fast paths from slow paths, keeping hot methods small (35 bytecodes or less) with error processing and slow paths in separate methods.")
- [The java command (JDK 21)](https://docs.oracle.com/en/java/javase/21/docs/specs/man/java.html) ("-XX:+PrintInlining Enables printing of inlining decisions."; "The -XX:+PrintInlining option has to be used together with the -XX:+UnlockDiagnosticVMOptions option"; "-XX:MaxInlineSize=35"; "-XX:FreqInlineSize=325"; "-XX:CompileCommand=command,method[,option] Specifies a command to perform on a method."; "option Passes a JIT compilation option to the specified method")
- [OpenJDK source, bytecodeInfo.cpp, jdk-21+35](https://github.com/openjdk/jdk/blob/jdk-21%2B35/src/hotspot/share/opto/bytecodeInfo.cpp#L186-L190) (lines 188 and 190: set_msg("hot method too big"), set_msg("too big"); line 278: set_msg("already compiled into a big method"))
- [OpenJDK source, c1_GraphBuilder.cpp, jdk-21+35](https://github.com/openjdk/jdk/blob/jdk-21%2B35/src/hotspot/share/c1/c1_GraphBuilder.cpp#L3919) (line 3919: INLINE_BAILOUT("callee is too large"))
- [OpenJDK source, globals_x86.hpp, jdk-21+35](https://github.com/openjdk/jdk/blob/jdk-21%2B35/src/hotspot/cpu/x86/globals_x86.hpp#L54) (line 54: define_pd_global(intx, InlineSmallCode, 1000))
- [OpenJDK source, c2_globals.hpp, jdk-21+35](https://github.com/openjdk/jdk/blob/jdk-21%2B35/src/hotspot/share/opto/c2_globals.hpp#L594-L658) (line 594: TypeProfileMajorReceiverPercent 90, "% of major receiver type to all profiled receivers"; line 637: MaxInlineLevel 15, "maximum number of nested calls that are inlined by high tier compiler"; line 647: InlineSmallCode, "Only inline already compiled methods if their code size is less than this"; line 652: MaxInlineSize 35, "The maximum bytecode size of a method to be inlined by high tier compiler"; line 657: FreqInlineSize, "The maximum bytecode size of a frequent method to be inlined")
- The PrintInlining outputs (two runs of Score, one run each of Mixed.kt with 1, 2 and 3 classes, repeated with the same decisions) and the javap listing of use were produced in this session with kotlinc 2.2.21 and OpenJDK 21.0.12.
