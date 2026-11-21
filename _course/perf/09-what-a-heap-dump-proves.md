---
title: What a heap dump proves
short: Memory that never goes
summary: Puzzle 8's collector frees everything it can't reach. So how does memory get stuck in a garbage-collected app? Here's what a snapshot of memory records, the two sizes it shows, and the chain that proves memory is stuck.
takeaway: A heap dump is a snapshot of every object and who refers to whom. Shallow size is one object alone; retained size is everything that would be freed with it. A leak is an object you're done with that's still reachable from a GC root, often a destroyed Activity held by something long-lived. The path from the root identifies a candidate retaining path to investigate.
---

## The problem

After rotating the phone ten times, your app uses 80 MB more than at start. The garbage collector frees everything that's unreachable, so whatever is left must still be reachable. From where? And which object, among millions, is the one to fix?

## See it

```diagram heap
```

## The building block

A **heap dump** is a snapshot of every object in your app's heap, with every reference between them. Android Studio lists them by class with two sizes:

- **Shallow size**: the memory one object takes by itself, its own fields. Its exact size depends on the class and runtime.
- **Retained size**: the memory that would be freed if this object were freed: itself, plus everything only it keeps alive. That same Activity can retain megabytes: its views and its Compose state. (Bitmap pixels live in **native memory**, memory outside the heap that the garbage collector doesn't manage, shown separately as Native Size.)

The collector starts from the GC roots (puzzle 7): local variables of running threads, static fields, and the like. Whatever it reaches stays; the rest is freed. So a **leak** in a garbage-collected app is an object you're finished with that's still reachable from a root.

The classic case: on rotation, your Activity is destroyed and a new one created (the Android course, module 4). If a long-lived object, such as a listener registered in a `companion object` or a singleton, still refers to the old Activity, the old Activity stays reachable, and everything it retains stays too. Ten rotations, ten old Activities.

The heap dump proves it. Android Studio's "Show activity/fragment leaks" filter finds destroyed Activities still in memory. For each instance it shows its depth, the shortest number of references from a GC root, and the reference chain. Remove the inappropriate ownership edge, for example by unregistering the listener. Another strong path may still retain the instance. Repeat the workload and inspect the next dump to verify release after collection.

## The analogy

A hotel cleans every room whose guest has checked out (the collector). A guest who left but whose name is still on a booking (a reference from a root) keeps the room, and everything in it, forever. The booking list is the chain: cancel that one booking, and the whole room is freed.

## Check yourself

- An old Activity has a shallow size of 400 bytes and a retained size of 12 MB. What does freeing it save?::*About 12 MB, since everything only it keeps alive goes too||400 bytes, because that's the Activity's own size >> That's shallow size; retained size counts everything that goes with it. >> s2||Nothing until the next app restart, since Activities aren't collected >> A destroyed Activity is collected like any object, once unreachable. >> s3::Retained size is what you really get back.
- The GC frees whatever it can't reach. How can an app leak?::*An object it no longer needs is still reachable from a GC root||The GC skips objects bigger than a few megabytes >> Size doesn't matter to the GC; reachability does. >> s3||Objects created on the main thread are never collected >> The thread that created an object doesn't matter; only whether it's reachable. >> s3::Reachable but unneeded.
- What's the difference between shallow size and retained size?::*Shallow size is the object alone, while retained size adds everything it alone keeps alive||Shallow size adds everything it alone keeps alive, while retained size is the object alone >> That's the two swapped. >> the-building-block::One object vs what goes with it.

## Sources

- [Android Studio: Capture a heap dump](https://developer.android.com/studio/profile/capture-heap-dump) ("Shallow Size: Size of this instance in Java memory. Retained Size: Size of memory that this instance dominates"; "Depth: The shortest number of hops from any GC root to the selected instance"; "Show activity/fragment leaks: Shows classes that are causing memory leaks"; "leaking the host Activity will retain the entire Compose hierarchy and all active state trees in memory"; "Long-lived references to Activity or Context")
- [Android Developers: Overview of memory management](https://developer.android.com/topic/performance/memory-overview) ("Garbage collection has two goals: find data objects in a program that cannot be accessed in the future; and reclaim the resources used by those objects.")
