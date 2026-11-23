---
title: What if the profile guessed wrong?
short: Uncommon traps, assumptions from the profile
summary: Puzzle 23 broke an assumption C2 took from the loaded classes. C2 also compiles from the method profile, as if the past will repeat. Take a branch the profile never saw, send a class a call site never met, and read what HotSpot does.
takeaway: C2 doesn't compile code for cases the method profile never saw: it puts an uncommon trap there, a spot that deoptimizes the method if it's ever reached. A branch never taken (unstable_if) or a receiver class the type profile never met (class_check) sends the call back to the interpreter, and HotSpot limits how often one spot may trap before it stops making that guess.
---

## The problem

Puzzle 23's assumption came from the loaded classes. Most of C2's other guesses come from the method profile of puzzle 20: how often each branch went each way. This function has two paths:

```kotlin
fun label(score: Int): Int = if (score < 0) -1 else score * 2
```

```text
public static final int label(int);
  Code:
     0: iload_0
     1: ifge          8
     4: iconst_m1
     5: goto          11
     8: iload_0
     9: iconst_2
    10: imul
    11: ireturn
```

ifge 8 jumps to offset 8 when the value is 0 or more. A program calls label 500,000 times with scores 0 to 99,999, so the jump is taken every time, and then once with -5. The LogCompilation log (puzzle 23) shows what C2 learned from the profile when it compiled label:

```text
<bc code='156' bci='1'/>
<branch target_bci='8' taken='199489' not_taken='0' cnt='199489.000000' prob='always'/>
<uncommon_trap bci='1' reason='unstable_if' action='reinterpret' debug_id='0' comment='taken always'/>
```

Taken 199,489 times, not taken never. So what did C2 compile for the -1 path, and what happens when -5 arrives?

## See it

```diagram trap
```

## The building block

C2 doesn't compile code for cases the profile never saw. It compiles an **uncommon trap** there instead: a spot that deoptimizes the method if it's ever reached. The OpenJDK wiki: "The compiler may stub out an untaken branch and deoptimize if it is ever taken." The compiled label is smaller and simpler than the bytecode, and the -1 path exists only in the interpreter. When -5 arrives:

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

unstable_if is HotSpot's name for "a branch predicted always false was taken" (its source's comment). The call carries on in the interpreter, which runs iconst_m1 and returns -1: the result is still right. label goes back to level 0, and since the program ends right after, no new level 4 line appears.

Puzzle 21's class check works the same way. Change Hot.kt from puzzle 23 so that main creates one Loud before phase 1 and never passes it: now CHA can't prove anything, so C2 inlines Counter's body behind a class check, from a type profile that has only met Counter. In phase 2 the first Loud fails the check:

```text
<uncommon_trap thread='11627' reason='class_check' action='maybe_recompile' debug_id='0' compile_id='36' compiler='c2' level='4' stamp='0.041'>
<jvms bci='8' method='HotKt use (LCounter;)I' bytes='12' count='294460' iicount='294460'/>
```

class_check is "saw unexpected object class", at offset 8, the `invokevirtual` of next. In two of three runs the log showed these traps; in the third, use had not reached C2 before phase 2, so there was nothing to deoptimize.

| Assumption C2 made | Based on | What breaks it |
| --- | --- | --- |
| this open method has one version | the loaded classes (CHA, puzzle 23) | loading a class that overrides it |
| this branch is never taken | the method profile | taking it: unstable_if |
| this call meets only class X | the type profile | another class arriving: class_check |

### Is deoptimization a problem?

Once, no: in the runs above it cost well under a millisecond. It becomes a problem when it repeats: code that keeps switching cases can cycle between compiled and interpreted, and a benchmark that takes a path for the first time while being timed measures the deoptimization (puzzle 25). HotSpot counts traps of one kind at one spot; the PerBytecodeTrapLimit option, 4 by default, limits the traps "of one kind" at one bytecode offset, so a spot that keeps failing stops being compiled on that assumption.

### The edges

- *Kotlin's null checks are traps too.* Puzzle 21's use calls `checkNotNullParameter`; C2 compiled its throw path as an unstable_if trap ("taken always"), because no null ever arrived.
- *The result never changes.* A trap only changes how fast the rare case runs, never what it computes: the interpreter runs the same bytecode.
- *From JDK 25*, PrintCompilation says why: made not entrant: uncommon trap (puzzle 23).

## The analogy

The polished sheet for "label a score" says "write double the score", with a small box: "negative score? stop and fetch the manual". In months of work nobody has hit the box. The day a negative score comes in, the clerk stops, takes the manual, does it the long way, and the sheet goes back to the specialist.

## Run it yourself

Save label (above) with this main as Branch.kt:

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

Thread.sleep(50) gives the compiler threads time to finish before the next 100,000 calls, so label is at level 4 before -5 arrives.

```sh
kotlinc Branch.kt -d bout
java -XX:+PrintCompilation -cp bout:kotlinc/lib/kotlin-stdlib.jar BranchKt | grep -E "label|score"
```

For the class check, add val early = Loud() as the first line of Hot.kt's main and run it as in puzzle 23 with LogCompilation, then grep for class_check.

## Check yourself

- In Hot.kt, main creates a Loud before phase 1 but passes only Counter objects until phase 2. When phase 2 starts, what happens to use's level 4 code?::*A class check fails for the first Loud, and use deoptimizes||No deoptimization: CHA never proved next unique, so nothing can break >> C2 still assumed something, from the type profile: only Counter. That check fails for Loud. >> s5||A deoptimization when Loud is created, before phase 1 >> use hasn't been compiled yet when Loud is loaded at the start. >> the-building-block::The assumption moved from the loaded classes to the profile.
- Why does C2 put a trap on label's -1 path instead of compiling it?::*The profile says it never ran||C2 can't compile a branch that only returns a constant >> iconst_m1 is as easy to compile as anything; the profile decided. >> s2||The interpreter is faster for code that runs once >> The trap's job is safety, not speed: the rare case is slow, not fast. >> the-building-block::Compile for what happened, guard what didn't.
- After label's made not entrant line, the output shows no new level 4 line for label. Why?::*label is back at level 0 and isn't called again||C2 is not allowed to compile a method twice >> Puzzle 23's use was compiled again within a millisecond. >> the-building-block||The trap deleted label's bytecode >> Bytecode never changes; the interpreter just ran it. >> s4::Recompiling needs the counters to climb again.

## Sources

- [OpenJDK wiki: HotSpot performance techniques](https://wiki.openjdk.org/display/HotSpot/PerformanceTechniques) ("The compiler may stub out an untaken branch and deoptimize if it is ever taken."; "If a call site or cast encounters an unexpected type, the compiler deoptimizes."; "Depending on the profile, a failure of the optimistic check will either deoptimize or run through a (slow) vtable/itable call.")
- [OpenJDK source, deoptimization.hpp, jdk-21+35](https://github.com/openjdk/jdk/blob/jdk-21%2B35/src/hotspot/share/runtime/deoptimization.hpp#L89-L147) (line 89: "Reason_class_check, // saw unexpected object class (@bci)"; line 117: "Reason_unstable_if, // a branch predicted always false was taken"; line 146: "Action_maybe_recompile, // recompile the nmethod; need not invalidate"; line 147: "Action_reinterpret, // invalidate the nmethod, reset IC, maybe recompile")
- [OpenJDK source, globals.hpp, jdk-21+35](https://github.com/openjdk/jdk/blob/jdk-21%2B35/src/hotspot/share/runtime/globals.hpp#L1376-L1378) (line 1376: PerBytecodeTrapLimit 4, "Limit on traps (of one kind) at a particular BCI")
- The javap listing, the PrintCompilation outputs (two runs) and the LogCompilation logs (one run of Branch.kt, three of the Hot.kt version that creates a Loud first) were produced in this session with kotlinc 2.2.21 and OpenJDK 21.0.12.
