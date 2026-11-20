---
title: How can two increments produce eight?
short: Two callers, one counter
summary: Follow two callers that both read seven before either saves.
takeaway: Checking the expected value and changing it in one indivisible step detects the stale increment.
---

## The problem

Two callers hold references to the same counter. Both want to add one. Starting at seven, could both finish their writes and leave eight?

## See it

```diagram shared-counter
```

## The building block

Write each caller's calculation on paper. A reads seven and calculates eight. B reads seven and also calculates eight. A writes eight. B writes eight. The second write used an old observation. Reading and writing a value safely as separate operations still leaves a gap between them.

A **conditional write** changes a value only if it still matches an expected value. Java's atomic integer offers a method that compares and writes as one indivisible step. A supplies seven as the expected value and eight as the replacement. It succeeds. B supplies the same pair and gets false because the counter already holds eight. B still owes one increment. The lab finishes it with a single operation that adds one to the current value.

## The analogy

Two clerks copy the same tally from a shared sheet. If each replaces the tally with their pencilled answer, one arrival disappears. If the clerk checks and changes the tally while holding the sheet, the second clerk can see the mismatch.

## Try it

Run the following command from the [JVM lab](https://github.com/trOnk12/Company-websites-/tree/main/labs/jvm).

```sh
java SharedCounter.java
```

The statements replay one possible order so you can reproduce it on every run. Before running, write down both return values and the total after each write. Then move B's read just after A's first write in the separate-writes experiment. Predict the result and update the assertion for that experiment. Reset both snapshots to seven before the conditional experiment.

## Check yourself

- B reads only after A writes eight. What does B calculate?::*Nine||Eight >> B starts from the value A just stored. >> the-building-block::B reads eight and adds one.
- Both expect seven. A succeeds. What does B's conditional write report?::Success >> Seven no longer matches eight. >> s3||*False::The rejected write leaves eight in place.
- Which part must stay together to detect a stale write?::*Compare and replace||Read and calculate the candidate >> The shared value can change before a later write. >> the-building-block::Compare against the live value at the instant of replacement.

## Sources

- [Java 21 atomic integer, compareAndSet](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/atomic/AtomicInteger.html#compareAndSet(int,int)) — “False return indicates that the actual value was not equal to the expected value.”
