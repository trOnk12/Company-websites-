---
title: Slow isn't always busy
short: Thread states
summary: A trace section on your main thread takes 120 ms, but a sample of the same moment shows almost nothing running. Both are right. Here's the line under every thread in a system trace that explains it.
takeaway: A system trace shows each thread's state as the kernel sees it: Running on a CPU, Runnable and waiting for one, Sleeping while blocked on a lock or a reply, or in Uninterruptible Sleep waiting for disk I/O. A slow span that's mostly Running needs faster code; mostly Sleeping or Uninterruptible Sleep, it's waiting on something else; mostly Runnable, other threads have the CPUs.
---

## The problem

You wrapped `loadUser()` in a trace section (puzzle 2) and it's 120 ms long, on the main thread, during startup. You sample the same moment: the main thread's stack barely shows up, as if it did nothing. Is the code slow, or not?

## See it

```diagram states
```

## The building block

A span on a timeline says when something started and ended. It doesn't say whether the thread was working. For that, a system trace draws a coloured state line on every thread's track: its **thread state**, as the kernel's scheduler (puzzle 0) records it.

- **Running**: the thread is on a CPU, executing. Only this time is "your code being slow".
- **Runnable**: ready to run, waiting in the run queue because every core is busy with other threads. It waits its turn.
- **Sleeping**: off the run queue, nothing to do until something happens and the kernel wakes it: a lock held by another thread, a Binder reply from another process, a message.
- **Uninterruptible Sleep**: waiting inside the kernel, usually for disk I/O to complete.

Sampling (puzzle 2) only fires while a thread is on a CPU, so a thread that isn't Running collects almost no samples. That's why your 120 ms span barely shows: most of it the main thread was asleep.

So before you optimise a slow span, read its states. Mostly Running: make the code faster, the flame chart (puzzle 3) shows where. Mostly Sleeping: find who it's waiting for; the trace shows which thread woke it. Mostly Uninterruptible Sleep: it's reading the disk, so move that off the main thread. Mostly Runnable: other threads, maybe your own, are keeping the CPUs busy.

## The analogy

A waiter is away from your table for ten minutes. Was he slow to carry plates (Running)? Queuing for the one coffee machine (Runnable)? Waiting for the kitchen to call him (Sleeping)? Down in the cellar fetching a bottle (Uninterruptible Sleep)? The ten minutes look the same from your table; only watching him tells you which.

## Check yourself

- In another trace, a 120 ms main-thread span is 110 ms Sleeping. What will making its code faster save?::*Almost nothing: only 10 ms of it was Running||Most of the 120 ms, since the span is slow code >> Only Running time is code running; Sleeping is waiting for something else. >> s2||All 120 ms, because a faster CPU wakes the thread sooner >> Sleeping ends when what it waits for arrives, not when the CPU is faster. >> s3::Faster code shortens only Running.
- A span is mostly Uninterruptible Sleep. What is the thread most likely doing?::*Waiting for the disk, such as a file or database read||Waiting for a free CPU, because others are running >> That's Runnable: ready, but no CPU is free. >> s3||Running your code, but too slowly >> Running is its own state; in Uninterruptible Sleep the thread isn't on a CPU. >> s3::Uninterruptible Sleep usually means disk I/O.
- What's the difference between Runnable and Sleeping?::*Runnable is ready and waiting for a CPU, while Sleeping waits for an event||Runnable waits for an event like a lock, while Sleeping is ready and waiting for a CPU >> That's the two swapped. >> the-building-block::Ready but no CPU vs not ready.

## Sources

- [Android Developers: Navigate a Systrace report](https://developer.android.com/topic/performance/tracing/navigate-report) ("Running: The thread is completing work related to a process or is responding to an interrupt. Runnable: The thread is available to run but isn't currently scheduled. Sleeping: The thread has no work to do, perhaps because the thread is blocked on a mutex lock. Uninterruptable sleep: The thread is blocked on I/O or waiting for a disk operation to complete.")
- [Perfetto: CPU scheduling events](https://perfetto.dev/docs/data-sources/cpu-scheduling) ("When Thread A suspends on the wait() it will enter the state S(sleeping) and get removed from the CPU run queue"; end_state "R Runnable … S Sleeping D Uninterruptible Sleep")
