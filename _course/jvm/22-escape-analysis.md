---
title: Where did 240 megabytes of objects go?
short: Escape analysis, objects that never reach the heap
summary: A Kotlin function creates a small object on every call, ten million times a round. With one HotSpot option the run allocates 240 megabytes a round; without it, nothing. Find out what C2 proved about the object, and why inlining from puzzle 21 had to come first.
takeaway: After inlining, C2's escape analysis checks whether a new object can be reached from outside the compiled code: stored in a field, returned, or passed to a call that wasn't inlined. If not, scalar replacement keeps its fields as plain values and the object is never allocated, so the heap and the garbage collector never see it.
---

## The problem

Puzzle 17 said objects live on the heap, and puzzle 3 that the garbage collector reclaims the ones nothing reaches. So a function that creates an object on every call should keep the collector busy:

```kotlin
import java.lang.management.ManagementFactory

class Stats(val visits: Int, val stars: Int) {
    fun score() = visits * 2 + stars
}

fun scoreOf(visits: Int, stars: Int): Int {
    val stats = Stats(visits, stars)
    return stats.score()
}

fun main() {
    val threads = ManagementFactory.getThreadMXBean() as com.sun.management.ThreadMXBean
    val me = Thread.currentThread().threadId()
    var sum = 0L
    for (round in 1..5) {
        val before = threads.getThreadAllocatedBytes(me)
        for (i in 0 until 10_000_000) {
            sum += scoreOf(i, round)
        }
        val after = threads.getThreadAllocatedBytes(me)
        println("round $round: ${after - before} bytes allocated")
    }
    println(sum)
}
```

getThreadAllocatedBytes, from the JDK's ThreadMXBean, reports how many bytes a thread has allocated on the heap so far. The program prints the difference for each round of ten million calls. The -Xlog:gc option also prints a line for every garbage-collector run (GC for short):

```text
$ java -Xlog:gc -cp out:kotlin-stdlib.jar EscapeKt
[0.005s][info][gc] Using G1
round 1: 421096 bytes allocated
round 2: 0 bytes allocated
round 3: 0 bytes allocated
round 4: 0 bytes allocated
round 5: 0 bytes allocated
500000100000000
```

Fifty million Stats objects, and from round 2 on, zero bytes and not one collection. A second run: 345,424 bytes in round 1, then zero again. Where did the objects go?

## See it

```diagram escape
```

## The building block

Puzzle 21 left C2 with one big piece of code: the loop in main, with scoreOf, the Stats constructor and score() inlined into it. Inside that code C2 can see everything the new Stats is used for. **Escape analysis** is C2's check of whether a new object can be reached from anywhere outside the code it is compiling. Oracle's guide lists the ways out:

| What the code does with the object | Escapes? |
| --- | --- |
| stores it in a static field or in a field of an object that escapes, or returns it | yes, everywhere |
| passes it to a method that was not inlined | yes, into that call |
| only reads its fields in the compiled code | no |

Here the reference in stats is only used to read visits and stars. So C2 applies **scalar replacement**: it keeps the two fields as plain int values in the compiled code, like local variables, and drops the allocation. No Stats object exists, so nothing is allocated and nothing needs collecting. Oracle's guide: the compiler "eliminates the scalar replaceable object allocations". Note what it doesn't do: it "does not replace a heap allocation with a stack allocation". The object isn't moved somewhere cheaper; it's gone, and only its field values remain.

Turn it off with the DoEscapeAnalysis option, and every object is real:

```text
$ java -XX:-DoEscapeAnalysis -Xlog:gc -cp out:kotlin-stdlib.jar EscapeKt
[0.005s][info][gc] Using G1
[0.060s][info][gc] GC(0) Pause Young (Normal) (G1 Evacuation Pause) 13M->1M(216M) 1.500ms
[0.072s][info][gc] GC(1) Pause Young (Normal) (G1 Evacuation Pause) 35M->1M(216M) 0.674ms
[0.116s][info][gc] GC(2) Pause Young (Normal) (G1 Evacuation Pause) 127M->1M(216M) 1.006ms
round 1: 240003328 bytes allocated
[0.136s][info][gc] GC(3) Pause Young (Normal) (G1 Evacuation Pause) 127M->1M(216M) 0.936ms
[0.152s][info][gc] GC(4) Pause Young (Normal) (G1 Evacuation Pause) 127M->1M(284M) 0.874ms
round 2: 240000000 bytes allocated
…
round 5: 240000000 bytes allocated
500000100000000
```

(Trimmed after round 2; the run made 9 collections in all, and a second run printed the same allocation numbers.) 240,000,000 bytes for ten million objects: 24 bytes each, two 4-byte ints plus HotSpot's own bookkeeping for every object. Each GC line is one collection; 127M->1M means the heap held about 127 megabytes before and 1 after, because every Stats was already unreachable. How collections work is module 5's subject.

Round 1 of the default run still allocated about 400 kilobytes. Those calls ran before C2 compiled the loop: the interpreter and C1's code allocate every object.

Escape analysis needs inlining. Keep everything else and turn inlining off with the Inline option (the third command below): every round allocates 240,000,000 bytes again, because the Stats now goes to a constructor and a score() that weren't inlined, so it escapes into those calls. Or keep inlining and add one line to scoreOf, storing the object in a top-level property:

```kotlin
var last: Stats? = null

fun scoreOf(visits: Int, stars: Int): Int {
    val stats = Stats(visits, stars)
    last = stats
    return stats.score()
}
```

A top-level var compiles to a static field, so the object escapes: 240,000,000 bytes every round, in two runs.

### The edges

- *Small, short-lived objects are the ones it removes.* A Pair returned from a small inlined function, an iterator in a loop, a Kotlin data class used for one calculation: all can disappear. One stored in a field, a list or a lambda that escapes cannot.
- *Only C2 does it.* Interpreted and C1-compiled code allocate every object; that's round 1's 400 kilobytes.
- *Don't design around it.* Whether an object is removed depends on inlining decisions (puzzle 21) that change with code size and profiles. Measure allocation, as above, instead of assuming.
- *Android:* ART's compilers do their own allocation removal; how much is not covered here (puzzle 18 links the Android course).

## The analogy

A clerk fills in a form only to read two numbers off it a second later, then throws it away. The specialist writing the polished sheet notices that the form never leaves the desk: nobody files it, nobody sends it anywhere. So the sheet says "write the two numbers on your notepad" and the form is never printed. If the procedure files the form in a cabinet, it has to exist.

## Run it yourself

Save the first program as Escape.kt, then:

```sh
kotlinc Escape.kt -d out
java -Xlog:gc -cp out:kotlinc/lib/kotlin-stdlib.jar EscapeKt
java -XX:-DoEscapeAnalysis -Xlog:gc -cp out:kotlinc/lib/kotlin-stdlib.jar EscapeKt
java -XX:-Inline -cp out:kotlinc/lib/kotlin-stdlib.jar EscapeKt
```

Before running the third command, predict the bytes per round.

## Check yourself

- scoreOf now adds every Stats to a list that main prints at the end. With the default options, what does round 2 allocate?::*At least 240,000,000 bytes: every Stats escapes into the list||Zero, because C2 inlined scoreOf >> Inlining lets C2 see the object; here it sees the object stored in a list that outlives the call. >> s5||Zero, but only after round 5, once C2 has seen enough >> Escape is a property of the code, not of how long it runs. >> the-building-block::Stored where outside code can reach it means allocated.
- Why does turning inlining off bring the allocations back?::*The object is passed to calls C2 can't see into, so it escapes||Without inlining, escape analysis isn't allowed to run >> The analysis runs; it finds the object passed to a call that wasn't inlined. >> the-building-block||The constructor stores the object in a static field >> Stats' constructor only sets its two fields. >> s5::Passed to a call that wasn't inlined counts as escaping.
- In the default run, where are visits and stars of a removed Stats kept?::*As plain values in the compiled loop, like local variables||In a Stats object allocated on the thread's stack >> Oracle's guide: C2 does not replace a heap allocation with a stack allocation. >> s4||In the heap, but marked so the collector skips them >> No bytes reach the heap: the measured allocation is zero. >> s4::Scalar replacement keeps only the fields.

## Sources

- [Java 21 HotSpot VM guide: Escape Analysis](https://docs.oracle.com/en/java/javase/21/vm/java-hotspot-virtual-machine-performance-enhancements.html) ("Escape analysis is a technique by which the Java HotSpot Server Compiler can analyze the scope of a new object's uses and decide whether to allocate the object on the Java heap."; "GlobalEscape: The object escapes the method and thread. For example, an object stored in a static field, stored in a field of an escaped object, or returned as the result of the current method."; "ArgEscape: The object is passed as an argument or referenced by an argument but does not globally escape during a call."; "NoEscape: The object is a scalar replaceable object, which means that its allocation could be removed from generated code."; "After escape analysis, the server compiler eliminates the scalar replaceable object allocations and the associated locks from generated code."; "It does not replace a heap allocation with a stack allocation for objects that do not globally escape.")
- [OpenJDK wiki: EscapeAnalysis (Vladimir Kozlov)](https://wiki.openjdk.org/display/HotSpot/EscapeAnalysis) ("After escape analysis C2 eliminates scalar replaceable object allocations and associated locks."; "C2 does NOT replace a heap allocation with a stack allocation for non globally escaping objects.")
- [The java command (JDK 21)](https://docs.oracle.com/en/java/javase/21/docs/specs/man/java.html) ("-XX:+DoEscapeAnalysis Enables the use of escape analysis. This option is enabled by default. To disable the use of escape analysis, specify -XX:-DoEscapeAnalysis."; "-XX:+Inline Enables method inlining. This option is enabled by default to increase performance. To disable method inlining, specify -XX:-Inline.")
- [OpenJDK source, c2_globals.hpp, jdk-21+35](https://github.com/openjdk/jdk/blob/jdk-21%2B35/src/hotspot/share/opto/c2_globals.hpp#L473-L487) (line 473: DoEscapeAnalysis, "Perform escape analysis"; line 486: EliminateAllocations, "Use escape analysis to eliminate allocations")
- [Java 21 API: com.sun.management.ThreadMXBean](https://docs.oracle.com/en/java/javase/21/docs/api/jdk.management/com/sun/management/ThreadMXBean.html#getThreadAllocatedBytes(long)) ("Returns an approximation of the total amount of memory, in bytes, allocated in heap memory for the thread with the specified ID.")
- All runs (default and -XX:-DoEscapeAnalysis twice each with -Xlog:gc, -XX:-Inline twice, the version with last twice, and a version adding each Stats to a list, which allocated in every round) were produced in this session with kotlinc 2.2.21 and OpenJDK 21.0.12 (G1 collector).
