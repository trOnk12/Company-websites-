---
title: Counting or tracing
short: Two ways to free memory
summary: Kotlin on iOS and Swift free unused objects in two completely different ways. Before they meet in your app, here's each one on its own, and the one shape of objects that only one of them can free.
takeaway: A tracing garbage collector starts from the roots, the references a program always has (local and global variables), follows every reference, and frees whatever it couldn't reach, even objects that point at each other. Reference counting keeps a count of strong references on every object and frees it the moment the count hits zero, but two objects holding each other never reach zero: a cycle it can't free.
---

## The problem

Objects take memory, and memory is finite. Something must notice when an object isn't needed anymore and free it. On Android you never think about it. Swift, and Kotlin when it runs on iOS, each have their own answer. What are the two answers, and where do they differ?

## See it

```diagram trace
```

## The building block

Your objects live in the **heap**: the memory area where objects are created and kept. Variables hold references to them, arrows pointing at objects.

Tracing (what Android, the JVM and Kotlin/Native do). From time to time a **tracing GC**, a garbage collector, runs:

1. It starts from the **roots**: the references the program certainly still has, like local variables of running functions and global variables.
2. It follows every reference from there, and from those objects onward, marking what it reaches.
3. Whatever it didn't reach is unused: freed.

Two objects pointing only at each other, with nothing pointing at them from a root, are unreachable: freed too.

**Reference counting** (what Swift does, called ARC). Every object keeps a count of its **strong references**, the references that keep it alive. A new reference: +1. One goes away: −1. At zero, it's freed at once. No passes, no waiting.

But it only ever sees counts. Two objects holding strong references to each other each have a count of 1, forever, even when nothing else uses them. A **cycle** like that is never freed: a leak. The next puzzle shows how Swift breaks it.

## The analogy

Tracing is a park ranger who, every evening, walks every path from the entrance and removes any bench nobody can walk to. Counting is a bench that disappears the moment its last visitor leaves; two benches chained to each other keep each other "visited" forever.

## Check yourself

- Two objects point only at each other; nothing else points at them. What does a tracing GC do?::*Frees both, since neither can be reached from a root||Keeps both, because each still has a reference >> Tracing doesn't count; it frees what it can't reach from the roots. >> s3||Frees one of them and keeps the other >> Neither is reachable, so both are freed. >> s3::Unreachable means freed, cycles included.
- The same two objects under reference counting. What happens?::*Neither is freed: each keeps the other's count at 1||Both are freed when the program next pauses >> Counting has no passes; it frees only at zero, and neither reaches zero. >> s4||Both are freed at once, because nothing else uses them >> Counting can't see that; it only sees each count, still 1. >> s4::A cycle never reaches zero.
- What's the difference between tracing and reference counting?::*Tracing frees what roots can't reach, in passes, while counting frees each object at zero||Tracing frees each object at zero, while counting frees what roots can't reach, in passes >> That's the two swapped. >> the-building-block::Reachability vs counts.

## Sources

- [Kotlin docs: Kotlin/Native memory management](https://kotlinlang.org/docs/native-memory-manager.html) ("Tracing garbage collection is performed periodically to collect objects that are not reachable from the 'roots', like local and global variables")
- [The Swift Programming Language: Automatic Reference Counting](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/automaticreferencecounting/) (ARC tracks "how many properties, constants, and variables are currently referring to each class instance"; a strong reference cycle happens "if two class instances hold a strong reference to each other, such that each instance keeps the other alive")
