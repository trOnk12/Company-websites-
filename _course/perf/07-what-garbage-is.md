---
title: What garbage is
short: References and reachability
summary: In Kotlin you create objects and never free them. Something else decides when an object's memory can be reused. Here's the rule it follows, which is the rule behind both memory puzzles that come next.
takeaway: Objects live in the heap; variables and fields hold references to them, not the objects themselves. GC roots are the references that are always in use: running threads' local variables and static fields. An object is reachable if a chain of references leads to it from a root; if none does, nothing can ever use it again, and it's garbage. The garbage collector finds the garbage and frees its memory.
---

## The problem

In `onBind()` you write `val title = StringBuilder()`, use it, and return. You never free it, and Kotlin has no way to. Yet your app doesn't run out of memory after a million rows. Who decides that the `StringBuilder`'s memory can be reused, and how can they be sure nobody needs it any more?

## See it

```diagram garbage
```

## The building block

Every object you create lives in the **heap**, the part of your app's memory where objects are kept. A variable doesn't hold the object itself; it holds a **reference** to it, an arrow pointing at where the object is. Objects can hold references too: a `User` can refer to its `Address`.

Some references are always in use: the local variables of functions that threads are running right now, and static fields, like a property of a `companion object`. These are the **GC roots**.

An object is **reachable** if you can start at a root and follow references, one arrow after another, to it. Reachable means some code could still use it. If no chain from any root leads to an object, no code can ever get to it again. That object is **garbage**: its memory can be reused, safely.

The **garbage collector** (GC for short) is the part of ART that does this: it follows every chain from the roots, keeps whatever it reaches, and frees the rest. You don't call it; ART runs it when memory is needed.

Back to `onBind()`: while it runs, `title` is a local variable, a root, so the `StringBuilder` is reachable. When `onBind()` returns, that variable is gone. Unless you stored the reference somewhere else, nothing leads to the `StringBuilder` any more: it's garbage. But if you'd added it to a list held by a singleton, it would stay reachable, and stay in memory, for as long as that list does.

## The analogy

A museum. The entrances are the roots; corridors between rooms are references. A room you can walk to from an entrance stays open. A room no corridor leads to any more can never get a visitor again, so the museum can clear it and reuse the space. The garbage collector is the guard who walks every corridor from every entrance and marks which rooms to clear.

## Check yourself

- A function creates a `User` and keeps it only in a local variable. After the function returns, what is the `User`?::*Garbage, unless a reference to it was stored somewhere else||Reachable, since it was created by a running thread >> Who created it doesn't matter; what matters is whether a chain from a root still leads to it. >> s3||Freed at once, at the moment the function returns >> It becomes garbage then; the collector frees it later, when it runs. >> s4::No chain from a root means garbage.
- A singleton holds a list, and the list holds your `Activity`. Can the collector free the `Activity`?::*No: a chain from a root (the singleton) leads to it||Yes, once the Activity is no longer on screen >> Being off screen doesn't matter; the chain from the root keeps it reachable. >> s3||Yes, since the GC frees objects that are big enough >> Size doesn't matter to the GC; reachability does. >> s3::Reachable from a root means kept.
- What's the difference between a reference and an object?::*An object is the data in the heap, while a reference is an arrow pointing at it||A reference is the data in the heap, while an object is an arrow pointing at it >> That's the two swapped. >> s1::The thing vs the arrow to it.

## Sources

- [Android Developers: Overview of memory management](https://developer.android.com/topic/performance/memory-overview) ("Garbage collection has two goals: find data objects in a program that cannot be accessed in the future; and reclaim the resources used by those objects.")
- [Android Studio: Capture a heap dump](https://developer.android.com/studio/profile/capture-heap-dump) ("Depth: The shortest number of hops from any GC root to the selected instance.")
