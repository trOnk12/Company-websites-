---
title: How long does score really take?
short: Warm-up and measuring honestly with JMH
summary: Time the same loop five times in a row and get five answers between 121 and 0.44 nanoseconds. Use puzzles 19 to 24 to explain every one of them, then let a benchmark tool from OpenJDK measure it properly.
takeaway: A timing taken while code is still interpreted or at a lower level measures warm-up, and a timing of code whose result is unused can measure nothing at all, because C2 removes code whose result nobody reads. JMH warms the code up first, keeps every result alive, and runs each benchmark in a fresh JVM, so its number describes the compiled code you wanted to measure.
---

## The problem

Puzzles 19 to 23 showed HotSpot changing the code under your feet: interpreted, then compiled at level 3, then level 4, sometimes thrown away and compiled again. Now you want a number: how long does it take to score 100 bookmarks? The obvious way is a loop and a clock:

```java
public class Naive {
    static int[] visits = new int[100];

    static int score(int visits, int stars) {
        int total = visits * 2 + stars;
        return total;
    }

    static int total(int[] visits) {
        int sum = 0;
        for (int v : visits) {
            sum += score(v, 4);
        }
        return sum;
    }

    public static void main(String[] args) {
        for (int round = 1; round <= 5; round++) {
            long start = System.nanoTime();
            for (int i = 0; i < 100_000; i++) {
                total(visits);
            }
            long nanos = System.nanoTime() - start;
            System.out.println("round " + round + ": " + nanos / 100_000.0 + " ns per call");
        }
    }
}
```

```text
$ java Naive
round 1: 121.15569 ns per call
round 2: 32.26973 ns per call
round 3: 14.67826 ns per call
round 4: 0.43619 ns per call
round 5: 0.43616 ns per call
```

A second run: 107.5, 38.5, 17.6, 0.44, 0.44. Can 100 bookmarks really be scored in under half a nanosecond? Which round is the real answer?

## See it

```diagram warm-up
```

## The building block

None of them, and each is wrong for a reason you already know.

Rounds 1 to 3 measure **warm-up**: the start of a run, while methods are still interpreted or compiled at lower levels (puzzles 19 and 20). The JVM is doing what it should; the timing just mixes interpreter, C1 and compile time into one number.

Rounds 4 and 5 measure almost nothing. total's result is never used: the loop calls total(visits) and drops what it returns. Once C2 compiles main's loop with total and score inlined (puzzle 21), it can see that the whole computation produces a value nobody reads and has no other effect. So it removes it: **dead code elimination**, a compiler removing code whose result is never used. What's left is an almost empty loop, and 0.44 nanoseconds per "call" is the cost of that.

The OpenJDK wiki's advice for hand-written benchmarks starts with two rules: "Always include a warmup phase", and "Always run with" PrintCompilation, to see the compiler isn't working during the timing. Doing all of that correctly by hand is hard, which is why OpenJDK develops a tool for it (not part of the JDK: you add it as a library): **JMH**, the Java Microbenchmark Harness. A JMH benchmark is a method marked @Benchmark; JMH generates the loop around it:

```java
package bench;

import org.openjdk.jmh.annotations.*;
import java.util.concurrent.TimeUnit;

@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.NANOSECONDS)
@Warmup(iterations = 5, time = 1)
@Measurement(iterations = 5, time = 1)
@Fork(1)
public class ScoreBench {
    static int[] visits = new int[100];

    static int score(int visits, int stars) {
        int total = visits * 2 + stars;
        return total;
    }

    static int total(int[] visits) {
        int sum = 0;
        for (int v : visits) {
            sum += score(v, 4);
        }
        return sum;
    }

    @Benchmark
    public void resultDropped() {
        total(visits);
    }

    @Benchmark
    public int resultReturned() {
        return total(visits);
    }
}
```

What JMH does with it:

- *Warm-up first.* @Warmup runs the benchmark for 5 one-second iterations whose results are thrown away, so the measured iterations see C2's code.
- *Results stay alive.* A value the benchmark method returns is passed to a Blackhole, a JMH method that uses the value without doing anything with it. On recent JDKs, JMH asks C2 to treat it as a compiler blackhole (its output says so: Blackhole mode: compiler), so the computation can't be removed. The JMH sample on dead code: "returning the result of the computation will ask JMH to deal with the result to limit dead-code elimination". resultDropped keeps the mistake on purpose.
- *A fresh JVM per benchmark.* @Fork(1) runs each benchmark in one fresh JVM (JMH's default is 5), so one benchmark's method profiles (puzzles 20 and 21) can't spoil another's compiled code. JMH's sample on forking: "different tests can mix their profiles together, and then render the "uniformly bad" code for every test".

The result, run twice (JMH 1.37, the last lines of each run):

```text
Benchmark                  Mode  Cnt   Score   Error  Units
ScoreBench.resultDropped   avgt    5   0.503 ± 0.168  ns/op
ScoreBench.resultReturned  avgt    5  32.040 ± 2.160  ns/op

Benchmark                  Mode  Cnt   Score   Error  Units
ScoreBench.resultDropped   avgt    5   0.461 ± 0.054  ns/op
ScoreBench.resultReturned  avgt    5  31.513 ± 4.237  ns/op
```

Scoring 100 bookmarks takes about 32 nanoseconds once compiled; the error column is the spread over the 5 measured iterations. The dropped version reproduces the naive loop's half nanosecond: JMH can't save a benchmark that throws its own result away. Round 2 of the naive run happened to print 32 too, by coincidence: it was a mix of slower and faster code.

### The edges

- *Measure what production runs.* JMH measures compiled, warmed code. If your problem is the first request after a deploy, warm-up is the thing to measure, with real requests, not a microbenchmark.
- *Android:* the same traps apply on ART. Jetpack's Microbenchmark library (androidx.benchmark) is the JMH equivalent there; Android's documentation: "The library handles warmup, measures your code performance and allocation counts".
- *Constants fold too.* The other side of dead code: if the inputs are constants, C2 may compute the answer while compiling. JMH's sample: "the source is predictable, and computation is foldable". That's why visits is a field here, not a literal.
- *Don't time the first time.* The wiki: "Do not take any code path for the first time in the timing phase", because C2 may have compiled it as an uncommon trap (puzzle 24).
- *JMH doesn't explain the number.* Its output warns, just above the results: "Do not assume the numbers tell you what you want them to tell." Profilers do that part (coming in a later module).

## The analogy

You time how long the new clerk takes to handle a refund. The first few are slow because the clerk is still reading the manual. Later the specialist's sheet notices that your test refunds are never sent anywhere, and skips them, so they take no time at all. A fair test runs refunds until the polished sheet is in use, then makes sure each refund is actually posted, and hires a fresh clerk for each kind of test so habits from one don't carry into the next.

## Run it yourself

You need Maven, a Java build tool like Gradle (sdk install maven, or a download from maven.apache.org); pom.xml is its build file. Put ScoreBench.java in src/main/java/bench and save this as pom.xml next to src:

```xml
<project xmlns="http://maven.apache.org/POM/4.0.0">
  <modelVersion>4.0.0</modelVersion>
  <groupId>bench</groupId>
  <artifactId>score-bench</artifactId>
  <version>1</version>
  <properties>
    <maven.compiler.release>21</maven.compiler.release>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
  </properties>
  <dependencies>
    <dependency>
      <groupId>org.openjdk.jmh</groupId>
      <artifactId>jmh-core</artifactId>
      <version>1.37</version>
    </dependency>
  </dependencies>
  <build>
    <directory>build</directory>
    <plugins>
      <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-compiler-plugin</artifactId>
        <version>3.13.0</version>
        <configuration>
          <annotationProcessorPaths>
            <path>
              <groupId>org.openjdk.jmh</groupId>
              <artifactId>jmh-generator-annprocess</artifactId>
              <version>1.37</version>
            </path>
          </annotationProcessorPaths>
        </configuration>
      </plugin>
    </plugins>
  </build>
</project>
```

The annotationProcessorPaths entry is what runs JMH's generator, which writes the loop code around each @Benchmark method: from JDK 23, javac no longer runs annotation processors it merely finds on the class path. Then:

```sh
mvn compile dependency:build-classpath -Dmdep.outputFile=cp.txt
java -cp build/classes:$(cat cp.txt) org.openjdk.jmh.Main ScoreBench
javac Naive.java && java Naive
```

Before running, predict both JMH scores.

## Check yourself

- You change the naive loop to add every result to a sum and print the sum at the end. What do rounds 4 and 5 show now?::*About 32 ns per call: the work is no longer dead code||Still about 0.44 ns: C2 removes the loop anyway >> The sum is printed, so its value is needed and the computation must run. >> s4||About 121 ns: printing keeps the code interpreted >> Printing once at the end doesn't stop main's loop from being compiled. >> s1::A used result can't be eliminated.
- Why does JMH run each benchmark in a fresh JVM by default?::*So one benchmark's method profiles can't shape another's compiled code||So each benchmark starts in the interpreter and measures warm-up >> JMH warms up first and throws those iterations away. >> the-building-block||Because a JVM can compile each method only once >> Puzzles 20 and 23: methods are compiled again and again. >> the-building-block::Profiles are per JVM, and they decide what C2 compiles.
- A colleague's naive benchmark of a new parser shows 0.5 ns per document. Which earlier idea best explains the number?::*The result was dropped, and inlining let C2 remove the parse||The parser ran in the interpreter, which is fast for new code >> Puzzle 19: the interpreter is the slow mode, not the fast one. >> s1||Escape analysis put the documents on the stack >> Puzzle 22: C2 never moves objects to the stack, and this is about unused results. >> s4::Dead code elimination works on inlined code.

## Sources

- [JMH samples, JMHSample_08_DeadCode.java (commit a194eea)](https://github.com/openjdk/jmh/blob/a194eead0136bb66e5e59e4fdb2e18543e730929/jmh-samples/src/main/java/org/openjdk/jmh/samples/JMHSample_08_DeadCode.java) ("The downfall of many benchmarks is Dead-Code Elimination (DCE): compilers are smart enough to deduce some computations are redundant and eliminate them completely. If the eliminated part was our benchmarked code, we are in trouble."; "returning the result of the computation will ask JMH to deal with the result to limit dead-code elimination (returned results are implicitly consumed by Blackholes, see JMHSample_09_Blackholes)"; "This is wrong: result is not used and the entire computation is optimized away.")
- [JMH samples, JMHSample_10_ConstantFold.java (commit a194eea)](https://github.com/openjdk/jmh/blob/a194eead0136bb66e5e59e4fdb2e18543e730929/jmh-samples/src/main/java/org/openjdk/jmh/samples/JMHSample_10_ConstantFold.java) ("The flip side of dead-code elimination is constant-folding."; "This is wrong: the source is predictable, and computation is foldable.")
- [JMH samples, JMHSample_12_Forking.java (commit a194eea)](https://github.com/openjdk/jmh/blob/a194eead0136bb66e5e59e4fdb2e18543e730929/jmh-samples/src/main/java/org/openjdk/jmh/samples/JMHSample_12_Forking.java) ("JVMs are notoriously good at profile-guided optimizations. This is bad for benchmarks, because different tests can mix their profiles together, and then render the "uniformly bad" code for every test. Forking (running in a separate process) each test can help to evade this issue."; "JMH will fork the tests by default.")
- [OpenJDK wiki: So You Want to Write a Micro-Benchmark](https://wiki.openjdk.org/display/HotSpot/MicroBenchmarks) ("Rule 1: Always include a warmup phase which runs your test kernel all the way through, enough to trigger all initializations and compilations before timing phase(s)."; "Rule 2: Always run with -XX:+PrintCompilation, -verbose:gc, etc., so you can verify that the compiler and other parts of the JVM are not doing unexpected work during your timing phase."; "Rule 5: Be aware of deoptimization and recompilation effects. Do not take any code path for the first time in the timing phase")
- [OpenJDK wiki: HotSpot performance techniques](https://wiki.openjdk.org/display/HotSpot/PerformanceTechniques) ("Getting solid performance measurements is surprisingly tricky. Take extra care with micro-benchmarks.")
- [JDK-8321319, release note for JDK-8321314 (JDK 23)](https://bugs.openjdk.org/browse/JDK-8321319) ("stop running annotation processors found on the class path by default. That behavior can still be enabled by using one or more separate options.")
- [Android developers: Microbenchmark](https://developer.android.com/topic/performance/benchmarking/microbenchmark-overview) ("The Jetpack Microbenchmark library lets you benchmark your Android native code—Kotlin or Java—from within Android Studio. The library handles warmup, measures your code performance and allocation counts")
- JMH 1.37, java org.openjdk.jmh.Main -h ("-f <int> How many times to fork a single benchmark."; "(default: 5)")
- [OpenJDK: Code Tools: JMH](https://openjdk.org/projects/code-tools/jmh/) ("JMH is a Java harness for building, running, and analysing nano/micro/milli/macro benchmarks written in Java and other languages targetting the JVM.")
- The naive runs (two, plus two of a version that adds each result to a printed sum: rounds 3 to 5 at 31.6 to 33.3 ns) and the JMH runs (JMH 1.37 from Maven Central, four runs; the last, with exactly this pom.xml and these commands, printed 0.694 and 39.813 ns/op, and "Blackhole mode: compiler (auto-detected"; JMH's closing note "Do not assume the numbers tell you what you want them to tell." is from that output) were produced in this session with OpenJDK 21.0.12.
