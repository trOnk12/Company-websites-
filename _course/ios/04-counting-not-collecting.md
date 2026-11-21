---
title: Counting, not collecting
short: ARC and reference cycles
summary: On Android, objects nothing uses anymore are found and freed for you, cycles included. Swift doesn't work that way. Here's what it does instead, and the leak it can't see.
takeaway: ARC counts the strong references to each object and frees it the moment the count drops to zero. Two objects holding strong references to each other never reach zero: a strong reference cycle, which leaks. Make one side a weak reference, which doesn't keep the object alive.
---

## The problem

On Android, you rarely think about freeing memory: the **garbage collector**, from time to time, finds every object nothing can reach anymore and frees it, even two objects that point at each other. Swift on iOS has no garbage collector. So who frees your objects, when, and is there anything it misses?

## See it

```diagram arc
```

## The building block

Swift uses **ARC**, Automatic Reference Counting, for class instances (structs and enums are values copied on assignment, but their stored fields may contain references whose lifetimes ARC tracks). Each object keeps a count of the **strong references** to it: the variables, properties and collections that hold it. Every new one adds one; every one that goes away subtracts one. When the count reaches zero, ARC frees the object right away. No collector running in the background: memory goes back the moment it's no longer used (the counting itself has a small cost on every reference).

That has one blind spot. If two objects hold strong references to each other, say a screen holds its view model and the view model holds the screen back, then even after everything else lets go, each still counts one reference: the other one. Neither count reaches zero, so neither is ever freed. That's a **strong reference cycle**, and it's a leak. A garbage collector would see that nothing else can reach them; ARC only counts, so it can't.

The fix is to make one side a **weak reference**: a reference that doesn't add to the count. When the object it points to is freed, a weak reference becomes `nil` by itself. Usually the "child" points back to its owner weakly:

```swift
class ViewModel {
    weak var screen: Screen?   // doesn't keep the screen alive
}
```

The same trap waits in closures: a closure that captures `self` strongly holds it, so if `self` also stores that closure, they form a cycle. That's when iOS code writes `[weak self]`.

## The analogy

A library card system: each book counts how many cards are holding it, and goes back on the shelf the moment the count is zero. But two books that each hold the other's card keep each other's count at one: neither ever goes back.

## Check yourself

- A screen holds its view model strongly, and the view model holds the screen strongly. The user closes the screen. What happens on iOS?::*Neither is freed: each still counts one reference, the other||Both are freed, like a garbage collector would do >> There's no collector to notice: ARC only counts, and each count stays at one. >> s3||Only the view model is freed, because the screen is closed >> Closing the screen doesn't change the counts; both stay at one. >> s3::A cycle keeps both counts above zero.
- Why does a weak reference break the cycle?::*Because it doesn't add to the count, so the other can reach zero||Because ARC skips cycles that contain a weak reference >> ARC doesn't look for cycles at all; the weak side doesn't count. >> s4||Because a weak reference frees its object straight away >> It doesn't free anything; it just doesn't keep the object alive. >> s4::Weak references aren't counted.
- What's the difference between ARC and Android's garbage collector?::*ARC frees at once, while a collector frees later, in passes||ARC runs in passes like a collector, only more often >> ARC doesn't run in passes: it frees the moment the count reaches zero. >> s2::Counting now vs searching later.

## Sources

- [The Swift Programming Language: Automatic Reference Counting](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/automaticreferencecounting/) ("Swift uses Automatic Reference Counting (ARC) to track and manage your app's memory usage… ARC automatically frees up the memory used by class instances when those instances are no longer needed"; "two class instances hold a strong reference to each other, such that each instance keeps the other alive. This is known as a strong reference cycle. You resolve strong reference cycles by defining some of the relationships between classes as weak or unowned references")
