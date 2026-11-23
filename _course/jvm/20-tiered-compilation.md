---
title: Which methods get compiled, and by whom?
short: Counters and tiered compilation (C1, C2)
summary: Puzzle 19's interpreter counts calls and hands hot methods to a compiler. Read HotSpot's own log of every compilation in the batch program, and find out why it compiled score twice and why the batches stayed slow long after score was compiled.
takeaway: HotSpot compiles a hot method in levels: the interpreter (0), then C1 with profiling (3), which quickly makes faster code and records a method profile, then C2 (4), which uses that profile to make the fastest code; each new version retires the old one. A long loop in a method that is called rarely is switched to compiled code while it runs, by on-stack replacement, when its loop counter crosses a threshold.
---

## The problem

Puzzle 19's batches stayed slow for about 60 to 100 batches, then sped up. score was called 1,000 times in the very first batch, well past the 200-call threshold below. So was score compiled late, or was something else slow? HotSpot can print a line each time it compiles a method, with the PrintCompilation option:

```text
$ java -XX:+PrintCompilation Score
…
27    8       3       Score::score (8 bytes)
…
batch 1: 35147 ns
44  112       4       Score::score (8 bytes)
batch 2: 38395 ns
…
45    8       3       Score::score (8 bytes)   made not entrant
…
batch 60: 15297 ns
47  134 %     3       Score::batch @ 4 (27 bytes)
batch 61: 38496 ns
…
batch 64: 19042 ns
48  137       3       Score::batch (27 bytes)
batch 65: 5628 ns
…
batch 101: 3216 ns
48  142 %     4       Score::batch @ 4 (27 bytes)
…
50  156       4       Score::batch (27 bytes)
…
```

The output is trimmed: the full run prints about 350 lines, most of them for JDK methods (… marks cuts). Each compile line holds, in order: milliseconds since the JVM started, a compile number, a % mark on some lines (explained below; other flag letters there are s for synchronized, ! for has exception handlers, n for native), a level (0 to 4), the method, its bytecode size, and sometimes a message. Compiler lines and batch lines can print interleaved, even mid-line: two threads are writing at once. score was compiled during batch 1, then again at level 4, yet the batches only sped up after batch 64. Why two compilations, and why did compiling score not help?

## See it

```diagram tiered
```

## The building block

HotSpot has two compilers. **C1** compiles quickly and does simple optimizations; **C2** compiles slowly and produces the fastest code it can. Oracle's documentation calls them the client and the server compiler. Using both, one after the other, is **tiered compilation**, on by default. HotSpot's source lists the levels a method can be at:

| Level | Who runs the method | Records a profile? |
| --- | --- | --- |
| 0 | the interpreter | counters; a full profile only while waiting for level 3 |
| 1 | C1-compiled code, no profiling | no |
| 2 | C1-compiled code with call and loop counters | counters only |
| 3 | C1-compiled code with full profiling | yes |
| 4 | C2-compiled code | no |

The usual path is 0, then 3, then 4. A method starts in the interpreter. When its invocation counter passes a threshold (200 calls by default, the Tier3InvocationThreshold option), C1 compiles it at level 3. That code is much faster than the interpreter and keeps recording what the method does: its **method profile**, how often each branch went each way and which classes the receiver had at each call (puzzle 7). HotSpot keeps it in an object it calls the MethodData. When the level 3 code has run enough (5,000 calls by default for level 4), C2 compiles the method again, using the profile to decide what to optimize. Levels 1 and 2 are for special cases: a method too simple to need C2 goes to level 1, and level 2 is used while C2 is too busy.

Two details of how HotSpot applies these thresholds matter for the log above. First, the thresholds are multiplied by a factor that grows when the compilers have a queue, so the same program crosses them at slightly different moments in each run. Second, HotSpot's source: "if a method does not contain anything worth profiling, a transition from level 3 to level 4 occurs without considering thresholds". score has no branch and no call, so its profile had nothing to wait for: level 3 at 27 ms, level 4 at 44 ms, long before 5,000 calls.

*made not entrant* is how the log says that a version was retired: once the level 4 code was installed, new calls could no longer enter the level 3 code. Nothing went wrong; that line is a replacement, not an error.

Why were the batches still slow after score was at level 4? Because the time went to batch, not score. batch is called once per batch, 200 times in the whole run, far below its call threshold, yet each call runs a 1,000-turn loop in the interpreter. So HotSpot also counts loop turns. Here is batch's loop, from javap -c:

```text
       4: iload_2
       5: sipush        1000
       8: if_icmpge     25
      11: iload_1
      12: iload_2
      13: iload_0
      14: invokestatic  #7                  // Method score:(II)I
      17: iadd
      18: istore_1
      19: iinc          2, 1
      22: goto          4
```

if_icmpge jumps out of the loop when i ≥ 1000, iinc adds 1 to slot 2 (i), and goto 4 jumps back to the loop's first instruction: that jump is the back edge. Each one increases the method's back-edge counter. At 60,000 (the Tier3BackEdgeThreshold option), 60 batches of 1,000, HotSpot compiles the method while it is still running and switches the running loop over to the compiled code. That is **on-stack replacement** (OSR): the % mark in the log, with @ 4, the offset of the loop's first instruction. It arrived after batch 60, and batch 65 took 5,628 ns instead of 15,000 to 19,000. Later the loop and the whole method reached level 4 too.

A second run printed the same events in the same order at slightly different times: score at level 3 at 26 ms and level 4 at 43 ms, batch's loop at level 3 after batch 60.

So "the first thousand calls are slow" really means: slow until each hot method, or each hot loop, has climbed the levels.

### The edges

- *Two meanings of profile.* ART's profile (puzzle 18) is a file kept between runs that lists hot methods for dex2oat. HotSpot's method profile lives in memory, per method, and is lost when the JVM exits, unless you use JDK 25's ahead-of-time cache (puzzle 26).
- *C1 only.* The TieredStopAtLevel option stops at a lower level; with 1, HotSpot never runs C2. In two runs of the batch program it reached about 1,000 ns per batch, so for a loop this simple C1's code was enough; for real code, C2's optimizations from the next puzzles make the difference. Tools that run for seconds sometimes use it to save compile time.
- *Compiling costs time on other threads.* Compiler threads run beside your code. On a machine with few processor cores, they compete with it while the program starts.
- *Read the log, not the numbers.* PrintCompilation shows that something was compiled, not how fast it is. Puzzle 25 shows how to measure.

## The analogy

A new kind of request first goes to the clerk with the manual (level 0). After a couple of hundred, a junior specialist writes a quick instruction sheet and adds a tally box on it for every choice the clerk makes (level 3). Once the tallies show what usually happens, a senior specialist writes a polished sheet that assumes the usual case (level 4), and the junior's sheet goes in the bin. A request that's rarely made but takes all day, such as counting a whole warehouse, gets a sheet written while the count is under way, and the clerk switches to it mid-count.

## Run it yourself

With Score.java from puzzle 19:

```sh
javac Score.java
java -XX:+PrintCompilation Score | grep -E "Score::|batch (1|60|65|101):"
java -XX:TieredStopAtLevel=1 Score | tail -3
```

Before running, predict which level score reaches first and at which batch batch's loop is compiled.

## Check yourself

- You change batch's loop to 10,000 calls per batch and keep 200 batches. After which batch do you expect batch's loop to be compiled by on-stack replacement?::*After about batch 6||After about batch 60, as before >> The back-edge counter counts loop turns, not calls of batch; ten times more turns per batch get there ten times sooner. >> the-building-block||Never: batch is called only 200 times >> A rarely called method with a hot loop is exactly the case on-stack replacement exists for. >> the-building-block::The trigger is 60,000 loop turns: 6 batches of 10,000.
- Why does HotSpot compile a hot method with C1 first instead of going straight to C2?::*C1 code is ready sooner and records the profile C2 needs||C2 can only compile code that C1 has already compiled >> C2 compiles from the bytecode, using the profile recorded at level 3. >> s3||C1's code is faster, and C2 only shrinks it >> C2's code is the fastest; C1 trades speed for compile time. >> s4::Level 3 is fast code that also takes notes.
- You run the batch program with the TieredStopAtLevel option set to 3. Which PrintCompilation lines for score do you expect?::*One level 3 line, never followed by made not entrant||A level 3 line, then a level 4 line, as before >> TieredStopAtLevel=3 never lets C2 run, so there is no level 4. >> s4||Only level 1 lines, since score has nothing to profile >> Going to level 1 instead of 4 is a choice made when C2 would add nothing; here the levels stop at 3 and score stays there. >> the-building-block::Nothing replaces the level 3 code, so nothing retires it.

## Sources

- [OpenJDK source, compilationPolicy.hpp, jdk-21+35](https://github.com/openjdk/jdk/blob/jdk-21%2B35/src/hotspot/share/compiler/compilationPolicy.hpp#L36-L117) (lines 36–41: "level 0 - interpreter (Profiling is tracked by a MethodData object, or MDO in short) * level 1 - C1 with full optimization (no profiling) * level 2 - C1 with invocation and backedge counters * level 3 - C1 with full profiling (level 2 + All other MDO profiling information) * level 4 - C2 with full profile guided optimization"; line 57: "Execution starts at level 0 (interpreter), then the policy can decide either to compile the method at level 3 or level 2."; line 105: "i > TierXInvocationThreshold * s || (i > TierXMinInvocationThreshold * s && i + b > TierXCompileThreshold * s)"; lines 113–115: "if a method does not contain anything worth profiling, a transition from level 3 to level 4 occurs without considering thresholds"; line 117: "OSR transitions are controlled simply with b > TierXBackEdgeThreshold * s predicates.")
- [OpenJDK source, compiler_globals.hpp, jdk-21+35](https://github.com/openjdk/jdk/blob/jdk-21%2B35/src/hotspot/share/compiler/compiler_globals.hpp#L179-L199) (Tier3InvocationThreshold 200: "Compile if number of method invocations crosses this threshold"; Tier3BackEdgeThreshold 60000: "Back edge threshold at which tier 3 OSR compilation is invoked"; Tier4InvocationThreshold 5000)
- [OpenJDK source, compileTask.cpp, jdk-21+35](https://github.com/openjdk/jdk/blob/jdk-21%2B35/src/hotspot/share/compiler/compileTask.cpp#L249-L274) (the PrintCompilation line: compile id, then "is_osr_method ? '%' : ' '", the level, the method name, " @ %d" with the OSR bytecode offset, and " (%d bytes)")
- [Java 21 HotSpot VM guide: Tiered Compilation](https://docs.oracle.com/en/java/javase/21/vm/java-hotspot-virtual-machine-performance-enhancements.html) ("With tiered compilation, the server VM also uses the client compiler to generate compiled versions of methods that collect profiling information about themselves. The compiled code is substantially faster than the interpreter, and the program executes with greater performance during the profiling phase."; "Tiered compilation is enabled by default for the server VM.")
- [OpenJDK wiki: HotSpot performance techniques, Profiling](https://wiki.openjdk.org/display/HotSpot/PerformanceTechniques) ("Profiling is performed at the bytecode level in the interpreter and tier one compiler. The compiler leans heavily on profile data to motivate optimistic optimizations."; "Every call site with a receiver has a record of which types were encountered (up to 2-3 types)."; "Every call site and branch point has a record of execution counts.")
- [OpenJDK wiki: So You Want to Write a Micro-Benchmark](https://wiki.openjdk.org/display/HotSpot/MicroBenchmarks) ("The -XX:+PrintCompilation flag reports OSR compilations with an at-sign to denote the non-initial entry point")
- [The java command (JDK 21)](https://docs.oracle.com/en/java/javase/21/docs/specs/man/java.html) ("-XX:-TieredCompilation Disables the use of tiered compilation. By default, this option is enabled.")
- The PrintCompilation logs (three runs), the javap listing of batch the TieredStopAtLevel=1 runs, two TieredStopAtLevel=3 runs (one level 3 line for score each), and two runs with 10,000 calls per batch (the loop's on-stack replacement came after batch 6 in both) were produced in this session with OpenJDK 21.0.12.
