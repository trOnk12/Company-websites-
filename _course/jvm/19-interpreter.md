---
title: Why are the first thousand calls slow?
short: The interpreter and the first calls
summary: Puzzle 5 traced score's bytecode by hand, one instruction at a time. HotSpot starts out doing the same. Measure what that costs, and see how much faster the same method runs once HotSpot has compiled it.
takeaway: HotSpot starts every method in its template interpreter, which jumps to a small piece of machine code for each bytecode instruction, about ten times slower in this run than compiled code. It counts calls with an invocation counter and compiles only the methods that turn out to be hot, so the first calls of every method are slow by design.
---

## The problem

Puzzle 18 said that ART starts by interpreting DEX and compiles hot methods later. HotSpot, the JVM that ran every program in this course, works the same way, and you can measure it. This program calls puzzle 5's score a thousand times per batch and times 200 batches with System.nanoTime(), a clock in nanoseconds:

```java
public class Score {
    static int score(int visits, int stars) {
        int total = visits * 2 + stars;
        return total;
    }

    static int batch(int stars) {
        int sum = 0;
        for (int i = 0; i < 1000; i++) {
            sum += score(i, stars);
        }
        return sum;
    }

    public static void main(String[] args) {
        int sum = 0;
        for (int b = 1; b <= 200; b++) {
            long start = System.nanoTime();
            sum += batch(b);
            long nanos = System.nanoTime() - start;
            System.out.println("batch " + b + ": " + nanos + " ns");
        }
        System.out.println(sum);
    }
}
```

Two runs of java Score, and two with the Xint option, which turns HotSpot's compilers off (only some batches shown; the full output has 200 lines):

| Batch | default, run 1 | default, run 2 | Xint, run 1 | Xint, run 2 |
| --- | --- | --- | --- | --- |
| 3 | 18,856 ns | 15,023 ns | 18,525 ns | 19,490 ns |
| 50 | 17,305 ns | 14,072 ns | 19,114 ns | 18,973 ns |
| 80 | 2,747 ns | 13,550 ns | 18,941 ns | 18,419 ns |
| 100 | 3,091 ns | 1,915 ns | 19,172 ns | 19,213 ns |
| 200 | 610 ns | 1,947 ns | 19,601 ns | 18,503 ns |

The same thousand calls cost about 19,000 nanoseconds (19 per call) at the start of every run, and stayed there with the compilers off. With them on, the cost dropped to about 2,000 nanoseconds or less, at a different batch in each run. What was HotSpot doing during the slow batches, and why does it start that way?

## See it

```diagram interpreter
```

## The building block

An **interpreter** is a program that carries out bytecode one instruction at a time, as puzzle 18 said of ART. **Machine code** is the processor's own instructions, which run without one (puzzle 5 called them machine instructions).

HotSpot's interpreter is a **template interpreter**. When HotSpot starts, it generates, for every opcode, a small piece of machine code, the template, that carries out that one instruction. Running score in the interpreter means, for each of its 8 instructions: read the opcode at the current offset, jump to that opcode's template, let the template work on the frame's local slots and operand stack (puzzles 1 and 5), then read the next opcode. OpenJDK's runtime overview says it in its own words: HotSpot "generates an interpreter in memory at the startup", from "assembly code corresponding to each bytecode".

That is faster than a loop that compares the opcode against every case, but it still pays for every instruction: the read, the jump, and passing each value through the operand stack in the frame. Compiled code for score does the work of all 8 instructions without reading a single opcode or jumping between templates. That gap is what the table above measures: about 19 nanoseconds per loop turn and call interpreted, about 2 or less once the loop and score are compiled, in these runs on this machine.

So why not compile everything before main starts? Because most code runs rarely. The runtime overview: "Virtually all programs spend the vast majority of their time executing a minority of their code." Compiling a method takes time and memory, and for a method that runs a few times the interpreter finishes first. So HotSpot "immediately runs the program using an interpreter, and analyzes the code as it runs to detect the critical hot spots in the program". To find them, it keeps an **invocation counter** for every method, increased on each call. When a method's count crosses a threshold, HotSpot hands it to a compiler, a **JIT** (just-in-time) compiler because it compiles while the program runs. The machine code goes into the **code cache**, memory outside the heap reserved for compiled code (240 megabytes at most, by default).

That explains the slow batches. Compiling happens in the background, on separate compiler threads: the java manual says "the JVM compiles the method as a background task, running the method in interpreter mode until the background compilation is finished." The calls during the first batches ran in the interpreter while counters climbed and compilers worked; the drop came when compiled code arrived. Why it came at batch 80 in one run and batch 100 in the other, and why compiling score alone wasn't enough, is puzzle 20's subject.

### The edges

- *Interpreted, not slow everywhere.* 19 nanoseconds a call is fast for a request that runs once. The cost matters only for code that runs many times, and that's exactly the code HotSpot compiles.
- *Xint is for experiments.* With it, the java manual says, "all bytecode is executed by the interpreter". Nothing in production should run like that. The default, interpret first and compile hot methods, is what the manual calls mixed mode, and java -version prints it: "mixed mode".
- *Android does it too.* ART interprets DEX, compiles hot methods while the app runs, and dex2oat compiles profiled methods ahead of time (puzzle 18).
- *Numbers depend on the machine.* The nanoseconds above come from one Linux machine running OpenJDK 21; yours will differ. The ratio, interpreted several times slower than compiled, is what carries over.

## The analogy

A clerk handles each request by looking up every line of the procedure in the office manual before doing it: find the page for "add", do it, find the page for "multiply", do it. It's reliable, and it works for a request seen once. The clerk also keeps a tally of how often each kind of request comes in. When one kind passes a few hundred, a specialist writes it out as a single sheet the clerk can follow without opening the manual.

## Run it yourself

Save the program above as Score.java, then:

```sh
javac Score.java
java Score | head -5
java Score | tail -3
java -Xint Score | tail -3
```

Before running, predict batch 200 in both modes. Run each twice: the batch where the default run speeds up moves.

## Check yourself

- You run the 200 batches with the Xint option and print batch 1,000 instead of 200. What does it cost?::*About 19,000 ns, like batch 3: nothing is ever compiled||About 2,000 ns: the interpreter speeds up with practice >> The interpreter does the same work per instruction on every call; only compiled code is faster. >> s4||More than batch 3, because the invocation counter overflows >> The counter only decides when to compile; with Xint it decides nothing. >> s5::Xint turns the compilers off for the whole run.
- Why doesn't HotSpot compile every method before main starts?::*Most methods run rarely, and compiling them would cost time and memory first||Compilers can only compile a method after the interpreter has run it once >> HotSpot chooses to wait for counts; nothing forces it to. >> the-building-block||The code cache can hold only the methods of one class >> The code cache holds up to 240 megabytes of compiled code from any class. >> s5::"A minority of their code" does most of the work.
- Your server's first request calls 300 methods that never ran before, in classes not used yet. Which costs does that request pay?::*Loading and linking those classes, and interpreting those methods||Only class loading: HotSpot compiles each method when its class loads >> Methods start in the interpreter and are compiled only once they are hot. >> s5||Only interpretation: all classes were loaded when the program started >> Puzzle 11: a class is loaded the first time code needs it, not at startup. >> the-building-block::A first request meets both lazy loading and the interpreter.

## Sources

- [OpenJDK: HotSpot Runtime Overview, Interpreter](https://openjdk.org/groups/hotspot/docs/RuntimeOverview.html#Interpreter) ("The current HotSpot interpreter, which is used for executing bytecodes, is a template based interpreter. The HotSpot runtime a.k.a. InterpreterGenerator generates an interpreter in memory at the startup using the information in the TemplateTable (assembly code corresponding to each bytecode). A template is a description of each bytecode."; "The template design performs better than a classic switch-statement loop"; "Virtually all programs spend the vast majority of their time executing a minority of their code. Rather than compiling method by method, just in time, the Java HotSpot VM immediately runs the program using an interpreter, and analyzes the code as it runs to detect the critical hot spots in the program.")
- [The java command (JDK 21)](https://docs.oracle.com/en/java/javase/21/docs/specs/man/java.html) ("-Xint Runs the application in interpreted-only mode. Compilation to native code is disabled, and all bytecode is executed by the interpreter. The performance benefits offered by the just-in-time (JIT) compiler aren't present in this mode."; "-Xmixed Executes all bytecode by the interpreter except for hot methods, which are compiled to native code. On by default."; "-Xbatch Disables background compilation. By default, the JVM compiles the method as a background task, running the method in interpreter mode until the background compilation is finished."; "-XX:ReservedCodeCacheSize= size Sets the maximum code cache size (in bytes) for JIT-compiled code."; "The default maximum code cache size is 240 MB")
- [OpenJDK source, compilationPolicy.hpp, jdk-21+35](https://github.com/openjdk/jdk/blob/jdk-21%2B35/src/hotspot/share/compiler/compilationPolicy.hpp#L36-L37) (lines 36–37: "The system supports 5 execution levels: * level 0 - interpreter")
- The timings (four runs, two with -Xint) were produced in this session with OpenJDK 21.0.12 on Linux x86-64.
