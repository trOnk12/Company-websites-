---
title: Threads share one house
short: Shared memory
summary: All the threads in a process see the same memory. That's what makes them useful together, and it's also how two of them can quietly break the same value. Here's the trap, and Android's way around it for the screen.
takeaway: Threads in one process share its memory: a value one thread changes, every other thread sees. If two threads change the same value at the same moment, their steps can interleave and an update is lost. The fix is a lock (one thread at a time) or one owner (only one thread ever touches it). Android picked one owner for the screen: the main thread.
---

## The problem

In puzzle 2, a download thread and the main thread worked in the same process. The download finishes and has a result: how does the main thread get it? And if both threads can reach the same data, what happens when both change it at once?

## See it

```diagram shared
```

## The building block

A process has one block of memory (puzzle 0), and every thread inside it can read and write all of it. A value one thread writes, the others can read a moment later. That's how threads cooperate: one prepares data, another uses it.

The danger is changing the same value at the same moment. Even `count = count + 1` is three steps for the CPU: read the value, add one, write it back. If two threads both read 5, both add one and both write 6, one update is lost: the count should be 7. This is a **race condition**: the result depends on the exact order the kernel happened to run their steps in, so it works most of the time and breaks once in a while.

There are two ways out. A **lock** lets only one thread at a time into a piece of code: the second one waits until the first is done. Or give the value **one owner**: only one thread ever touches it, and the others ask it to.

Code that stays correct when several threads use it at once is **thread-safe**. Android's screen code isn't, so it uses the second way. Buttons, text and everything drawn belong to the main thread, and no other thread may change them. Puzzle 16 shows how other threads ask the main thread to do it for them.

## The analogy

The house has one whiteboard everybody can write on. Two people each read "5 visitors", each add one, each write "6": one visitor vanished. Either they take turns with the marker (a lock), or only the clerk may write on it and the others hand her notes (one owner).

## Check yourself

- Two threads each add 1 to the same counter, 1,000 times, with no lock. The counter starts at 0. What can it end at?::*Sometimes 2,000, sometimes less: updates can be lost when their steps interleave||Always 2,000, because each addition is one quick step >> Adding one is three steps (read, add, write), and two threads can interleave them. >> s3||Always 1,000, because only one thread can run at a time >> Both run; the kernel switches between them, and sometimes their steps overlap. >> s2||Never more than 1,000: the second thread can't see the first one's changes >> Threads share the process's memory, so each sees the other's writes. >> s1::Read, add, write: two threads can read the same old value.
- A download thread has a result for the screen. What's the safe way to show it?::*Hand it to the main thread, which owns the screen, and let it update the text||Change the text from the download thread, since the memory is shared anyway >> Shared memory is exactly why that's unsafe: the main thread may be drawing the same text. >> s4||Put a lock on the whole screen while the download thread writes >> Android's screen code isn't built for locks; it has one owner, the main thread. >> s4::One owner: only the main thread touches the screen.
- What's the difference between a lock and one owner?::*A lock lets every thread in, but one at a time; one owner lets only one thread ever touch it||A lock lets only one thread ever touch it; one owner lets every thread in, one at a time >> That's the two swapped. >> s4::Turns at the marker vs only the clerk writes.

## Sources

- [Android Developers: Processes and threads overview](https://developer.android.com/guide/components/processes-and-threads) ("the Android UI toolkit is not thread-safe. So, don't manipulate your UI from a worker thread. Do all manipulation to your user interface from the UI thread.")
- [Kotlin docs: Shared mutable state and concurrency](https://kotlinlang.org/docs/shared-mutable-state-and-concurrency.html) ("Coroutines can be executed parallelly using a multi-threaded dispatcher like the Dispatchers.Default. It presents all the usual parallelism problems. The main problem being synchronization of access to shared mutable state.")
