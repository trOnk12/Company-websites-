---
title: Threads take turns
short: The scheduler
summary: Your app runs dozens of threads, and so does every other app, on a phone that can run only a handful at once. Something has to decide who runs. Here's the kernel's turn-taking, the building block under every profiler chart in this course.
takeaway: A CPU core runs one thread at a time. The kernel's scheduler decides which ready thread runs on which core, and for how long; ready threads wait in a run queue, and a running thread can be switched out so others get a turn. A thread waiting for something (a lock, the disk, a message) leaves the queue entirely until the kernel wakes it. So a thread's elapsed time is its running time plus its waiting.
---

## The problem

Your app has the main thread, the RenderThread, a few background threads and the runtime's own helpers: easily thirty threads. Every other app and system service has its own. The phone's processor can run about eight at a time. Thirty threads can't all run at once. So when your main thread "takes 120 ms" to do something, how much of that was it actually running?

## See it

```diagram turns
```

## The building block

A **CPU core** is one part of the processor that executes instructions, one after another. In this phone model there are eight available logical CPUs, each running one scheduled thread at a time. Hardware topology and the set available to your process vary by device.

The **scheduler** is the part of the kernel that decides which thread runs on which core, and for how long. Threads that are ready to run, but have no core yet, wait in a **run queue**. When a core frees up, the scheduler gives it the next thread from the queue.

A thread doesn't keep a core until it's done. After a short stretch, or when a more urgent thread becomes ready, the scheduler can take the core away and put the thread back in the run queue. That's **preemption**: the thread didn't stop, it was paused so someone else could have a turn.

Some threads aren't ready at all. A thread that needs a lock another thread holds, or a file from the disk, or a message, has nothing to do until that arrives. The kernel takes it off the run queue: it's asleep and uses no core. When the thing arrives, the kernel **wakes** the thread: puts it back on a run queue. Woken isn't running yet: if every core is busy, it waits its turn.

So the time between a function's start and end, as a clock on the wall sees it, is made of three things: running on a core, waiting in the queue for one, and sleeping until something arrives. The first measures time executing; all three can affect the user-visible delay. The next puzzles show how a profiler tells them apart.

## The analogy

Eight checkout counters in a supermarket and a crowd of shoppers. Shoppers with full baskets queue for a counter (the run queue). A cashier serves one at a time, and a manager (the scheduler) can wave someone aside to serve an urgent customer first (preemption). A shopper who forgot the milk leaves the queue to fetch it (asleep) and has to queue again when back (woken).

## Check yourself

- A phone has eight cores and twenty threads are ready to run. What happens to the other twelve?::*They wait in a run queue for a core to free up||They run at the same time, each a bit slower >> A core runs one thread at a time; the rest wait. >> s1||They stop until the app calls them again >> Leaving the queue is for threads waiting for something; ready threads queue. >> s3::Ready but no core means waiting in the queue.
- A thread is waiting for a file from the disk. Where is it?::*Off the run queue, asleep, until the kernel wakes it||In the run queue, first in line for the next core >> It isn't ready yet; a sleeping thread takes no place in the queue. >> s3||On a core, checking again and again whether the file has arrived >> Asleep it uses no core; the kernel wakes it when the data is there. >> s3::Waiting for something means asleep, not queued.
- What's the difference between being woken and running?::*Woken puts the thread back in a run queue, while running means it's on a core||Woken means it's on a core, while running puts it back in a run queue >> That's the two swapped. >> s4::Woken is ready; running is on a core.

## Sources

- [Perfetto: CPU Scheduling events](https://perfetto.dev/docs/data-sources/cpu-scheduling) ("Which threads were scheduled on which CPU core at any point in time, with nanosecond accuracy. The reason why a running thread got descheduled (e.g. pre-emption, blocked on a mutex, blocking syscall or any other wait queue)."; "Thread A suspends on the wait() it will enter the state S(sleeping) and get removed from the CPU run queue. When Thread B notifies the variable, the kernel will transition Thread A into the R(unnable) state. Thread A at that point is eligible to be put back on a run queue. However this might not happen for some time because, for instance: All CPUs might be busy running some other thread")
