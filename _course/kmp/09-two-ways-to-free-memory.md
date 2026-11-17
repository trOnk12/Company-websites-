---
title: Two ways to free memory
short: GC meets ARC
summary: Your shared Kotlin runs inside an iOS app. Kotlin's objects are freed one way, Swift's another. Here's what happens where they hold on to each other.
takeaway: Kotlin/Native keeps objects in a shared heap and frees them with a tracing GC, like the JVM. Swift frees with ARC. A Swift object held by Kotlin is only freed at a GC, not the moment it's let go; and a cycle that runs through both sides can leak. Break it with a weak reference on the Swift side.
---

## The problem

Puzzle 7 showed the two ways to free memory: Kotlin/Native traces from the roots, Swift counts. Now they meet. A Swift view controller holds your Kotlin view model, and the view model keeps a callback, a Swift closure, that points back at the screen. Who frees what, and when?

## See it

```diagram gcarc
```

## The building block

Kotlin/Native keeps its objects in a **shared heap**, one pool any thread can use, and frees them with the tracing GC from puzzle 7. Swift objects are freed by reference counting (ARC), also from puzzle 7.

Where the two meet, each side follows its own rules:

- A Kotlin object that Swift holds stays alive while Swift holds it: to the GC, Swift's hold counts as a root.
- A Swift object that Kotlin holds isn't freed the moment Kotlin lets go. It's freed at the next GC, when the collector finds Kotlin no longer reaches it. So Swift's `deinit` can run later than a Swift developer expects.
- A cycle that runs through both sides, Kotlin to Swift and back, can leak. The GC can't see through Swift's counts, and ARC can't see through Kotlin's references, so neither sees the whole loop, although each would free its own half alone.

The fix is puzzle 8's: make one link weak. Usually the Swift side holds the Kotlin object normally and the callback refers back to the Swift object weakly: in Swift, capture it with `[weak self]` in the closure you hand to Kotlin.

## The analogy

Two cities that clean their streets differently: one sends a sweeper round every few days (the GC), the other picks up each item the moment its owner lets go (ARC). An item two neighbours from different cities each keep "for the other one" is never picked up by either.

## Check yourself

- Kotlin holds a Swift object, then lets go. When does Swift's `deinit` run?::*At the next GC, when Kotlin's collector sees it's no longer reached||At once, because ARC frees it the moment its count hits zero >> Kotlin's hold is released by the collector, so the Swift object waits for the next GC. >> s3||Never, because Kotlin objects keep Swift objects forever >> It's freed, only later: at the next garbage collection. >> s3::Release follows Kotlin's GC, not the moment of letting go.
- Why can a cycle through both Kotlin and Swift leak?::*Because each side keeps the other alive, and neither sees the loop||Because Kotlin's garbage collector never runs while the app is on iOS >> The GC runs on iOS too; it just can't see past Swift's hold, which counts as a root. >> s4||Because ARC has no way to count references that point at Kotlin objects >> ARC counts fine; the trouble is the loop that runs through both. >> s4::Two tools, each seeing half the loop.
- What's the difference between a tracing GC and ARC?::*A tracing GC frees what it can't reach, while ARC frees at a count of zero||A tracing GC counts each object's references too, only less often than ARC >> Counting is ARC's way; a tracing GC follows references from the roots. >> s1||ARC follows references from the roots, while a tracing GC frees at a count of zero >> That's the two swapped. >> s2::Search in passes vs count as you go.

## Sources

- [Kotlin docs: Kotlin/Native memory management](https://kotlinlang.org/docs/native-memory-manager.html) ("Objects are stored in a shared heap and can be accessed from any thread. Tracing garbage collection is performed periodically to collect objects that are not reachable from the 'roots', like local and global variables.")
- [Kotlin docs: Integration with Swift/Objective-C ARC](https://kotlinlang.org/docs/native-arc-integration.html) ("An object is reclaimed only during the garbage collection. This applies to Swift/Objective-C objects that cross interop boundaries into Kotlin/Native"; "To avoid retain cycles, use weak or unowned references")
