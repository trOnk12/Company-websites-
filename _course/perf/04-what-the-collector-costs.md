---
title: What the collector costs
short: How ART frees memory
summary: "Freeing memory paused my app" was true on old Android. Modern ART collectors barely pause. Here's how ART allocates and collects, and the way it can still cost you frames.
takeaway: Each thread allocates from its own TLAB by bumping a pointer, with no lock. ART's Concurrent Copying collector moves live objects while your threads keep running, with one small pause that doesn't grow with the heap, and since Android 10 it mostly runs cheap young GCs. What still costs frames is allocation churn: the collector's threads compete for CPUs, and an app that allocates faster than they free must wait.
---

## The problem

Your list allocates a few new objects per row: a `StringBuilder` for the title, a formatted date, a list for the tags. Someone on your team says the **garbage collector** (GC for short: the part of ART that finds objects nobody uses and frees their memory) "pauses the app when you allocate, and pauses cause jank". Is that still true? What does the collector actually do while you scroll?

## See it

```diagram collector
```

## The building block

Start with allocating. With ART's default collector, each thread gets its own **TLAB**, a thread-local slice of the **heap**, the memory where objects live. Allocating an object there is a pointer bump: move a marker forward by the object's size. No lock, no searching for space. Creating an object is cheap.

Collecting is the garbage collector's job: find the objects nothing can reach any more, and free their memory. Since Android 8, ART's default has been **Concurrent Copying** (newer devices may run its successor, Concurrent Mark-Compact, with the same low-pause idea): it copies the objects that are still alive into fresh space while your threads keep running, so live objects end up packed together, with no gaps, without stopping your app. There's one small pause per collection, and it doesn't grow with the size of the heap: ART's own docs show an average of about 2 ms.

Since Android 10 it's also generational. Most objects die young, like that `StringBuilder`, so ART runs a **young GC** that looks only at recently created objects: little work, run often. It switches to a full-heap collection only when young ones stop freeing enough.

So where does it hurt? Not mostly in the pause. **Allocation churn** makes collections frequent, and the collector's threads need CPUs too; your main thread may find them taken (Runnable, puzzle 2). And if your app allocates faster than the collector can free, your thread must wait for it, and that wait can cost a frame.

## The analogy

A café where every waiter has their own stack of clean cups (the TLAB): taking one is instant. A dishwasher collects dirty cups while service goes on (concurrent), mostly from the tables just cleared (young). Service only slows when cups are dirtied faster than he can wash them, and then a waiter stands at the counter, waiting.

## Check yourself

- Why is creating an object in ART cheap?::*Each thread bumps a pointer in its own TLAB, with no lock||The collector pre-creates objects of each class ahead of time >> It doesn't; allocation is fast because the space is the thread's own and contiguous. >> s1||Objects are put on the stack, not the heap, so the GC skips them >> Kotlin objects live on the heap; the speed comes from the TLAB. >> s1::Own space, one pointer bump.
- Concurrent Copying runs while you scroll. What does its pause depend on?::*Not the heap's size: it's one small pause per collection||The heap's size, since every live object must be copied during it >> Copying happens concurrently, while your threads run; the pause stays small. >> s2||Nothing, because Concurrent Copying never pauses at all >> It has one small pause per collection. >> s2::Small and constant, whatever the heap.
- What's the difference between a young GC and a full-heap GC?::*A young GC looks only at recent objects, while a full-heap GC looks at all||A young GC looks at all objects, while a full-heap GC looks only at recent ones >> That's the two swapped. >> s3::Recent objects only vs everything.

## Sources

- [Android Open Source Project: Debug ART garbage collection](https://source.android.com/docs/core/runtime/gc-debug) ("Starting with Android 8 (Oreo), the default plan is Concurrent Copying (CC)"; "This allocates a thread-local allocation buffer (TLAB) to each app thread, which can then allocate objects out of its TLAB by bumping the 'top' pointer, without any synchronization"; "CC performs heap defragmentation by concurrently copying objects without pausing app threads"; "GC only has one small pause, which is constant in time with regards to the heap size"; "CC extends to be a generational GC in Android 10 and higher. It enables collecting young objects, which often become unreachable fairly quickly"; "bad mutator behavior, such as excessive allocation, can still cause performance problems"; "young concurrent copying paused: … Avg: 1.830ms")
- [Android Studio: Capture a heap dump](https://developer.android.com/studio/profile/capture-heap-dump) ("if your app allocates memory faster than the system can collect it, your app might be delayed while the collector frees enough memory to satisfy your allocations. The delay could cause your app to skip frames")
