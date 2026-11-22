---
title: How can two increments produce eight?
short: Two callers, one counter
summary: Follow two callers that both read seven before either saves, and see a write that checks the expected value first.
takeaway: Two threads that read a shared value and write back a result can lose an update, because the value can change between the read and the write. compareAndSet checks the expected value and writes in one indivisible step, so a stale writer gets false and must read again.
---

## The problem

Puzzle 3 ended with one object reachable through two paths. Now two parts of the program use that one Counter at the same time, and both want to add one. Starting at 7, could both finish their writes and leave 8?

A **thread** is one independent line of execution with its own frames (puzzle 1); two threads can run code at the same time, which is how A and B can both read seven. Each thread has its own frames, but the Counter they reach through their references (puzzle 2) is one object, shared.

## See it

```diagram shared-counter
```

## The building block

Write each thread's calculation down. A reads 7 and calculates 8. B reads 7 and also calculates 8. A writes 8. B writes 8. Two increments, one lost: B's write was based on an old observation. Reading and writing are each fine on their own; the gap between them is the problem.

A **conditional write** changes a value only if it still matches an expected value. Java's AtomicInteger offers one, compareAndSet(expected, replacement), which compares and writes as one indivisible step: no other thread's write can land between the comparison and the write.

```java
AtomicInteger counter = new AtomicInteger(7);
int firstRead = counter.get();                                   // A reads 7
int secondRead = counter.get();                                  // B reads 7
boolean firstSaved = counter.compareAndSet(firstRead, firstRead + 1);    // A: 7 → 8, true
boolean secondSaved = counter.compareAndSet(secondRead, secondRead + 1); // B: expects 7, finds 8, false
int result = counter.incrementAndGet();                          // B's increment, done right: 9
```

| Event | A's observed value | B's observed value | Shared counter |
| --- | --- | --- | --- |
| Both read | 7 | 7 | 7 |
| A: compareAndSet(7, 8) returns true | 7 | 7 | 8 |
| B: compareAndSet(7, 8) returns false | 7 | 7 | 8 |
| B reads again, compareAndSet(8, 9) returns true | 7 | 8 | 9 |

false is not a failure to ignore: B still owes one increment, so it must read the current value and try again. Reporting success after B's rejected attempt would quietly lose a requested increment. When adding one is the whole rule, incrementAndGet does the read, the add and the conditional write for you.

Now change the rule: both threads want to claim the last seat. A changes 1 to 0. B's comparison fails, and a fresh read returns 0. Retrying the business decision now means declining the reservation, not writing -1. Whether to try another write depends on what the operation promises. And a counter in one JVM only coordinates threads using that same object: two servers with their own counters need a shared authority for the last seat.

## The analogy

Two clerks copy the same tally from a shared sheet. If each replaces the tally with their pencilled answer, one arrival disappears. If the rule is "hold the sheet, check it still says what you copied, and only then write", the second clerk sees the mismatch and has to copy the tally again.

## Run it yourself

Run the following command from the [JVM source files](https://github.com/trOnk12/Company-websites-/tree/main/labs/jvm), which hold SharedCounter.java (the lines above, plus prints and checks).

```sh
java SharedCounter.java
```

The statements replay one possible order of the two threads in a single thread, so the result is the same on every run. Before running, write down both compareAndSet results and the value after each line. Then move B's read just after A's write, predict the two results again, and update the check that expects B to be rejected.

[Run the browser experiment](https://pachulski.dev/labs/jvm-workbench/#04-shared-counter) for the same steps in the browser.

## Check yourself

- B reads only after A's compareAndSet(7, 8) has succeeded. What does B's compareAndSet(8, 9) return?::*true, and the counter becomes 9||false, because A already wrote >> B's expected value, 8, matches what A left. >> s4::A comparison succeeds whenever nothing changed since that thread's read.
- Both threads read 7. A's compareAndSet(7, 8) succeeds. What does B's compareAndSet(7, 8) return?::true, and the counter stays 8 >> The comparison happens first: B expects 7 and finds 8, so nothing is written. >> s4||*false||true, and the counter becomes 9 >> B's replacement was 8, computed from its stale read; it can't produce 9. >> s3::The rejected write leaves 8 in place.
- A claims the last seat. B's comparison fails and a fresh read returns 0. What should B do?::*Decline the reservation||Write -1 with another compareAndSet >> A conditional write only protects against stale reads; the business rule still decides. >> the-building-block::Repeat the business decision using the fresh value.

## Sources

- [JVM specification, 2.5.2 Java Virtual Machine Stacks](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-2.html#jvms-2.5.2) ("Each Java Virtual Machine thread has a private Java Virtual Machine stack , created at the same time as the thread."); [2.5.1](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-2.html#jvms-2.5.1) ("The Java Virtual Machine can support many threads of execution at once")
- [Java 21 API: AtomicInteger.compareAndSet](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/atomic/AtomicInteger.html#compareAndSet(int,int)) ("Atomically sets the value to newValue if the current value == expectedValue"; "False return indicates that the actual value was not equal to the expected value.")
- The run of SharedCounter.java (8 with separate writes; true, false and value 8 with conditional writes; 9 after incrementAndGet) was produced in this session with OpenJDK 21.0.12.
