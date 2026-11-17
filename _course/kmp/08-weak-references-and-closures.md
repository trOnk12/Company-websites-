---
title: Weak references and closures
short: Breaking cycles in Swift
summary: Puzzle 7 left Swift with a leak it can't see: two objects holding each other. Swift's fix is a reference that doesn't count. Here's how it works, and the most common way the cycle sneaks in: a lambda.
takeaway: A weak reference points at an object without adding to its count, so it can't keep it alive; it becomes nil when the object is freed. Make one link in a cycle weak and the cycle can be freed. Closures, Swift's lambdas, hold strong references to what they use, including self, so a closure stored by the object it captures is a cycle; [weak self] makes that capture weak. deinit runs when an object is freed.
---

## The problem

A screen holds a timer helper; the helper keeps a lambda, Swift calls it a **closure**, to update the screen every second; the closure uses the screen. The user leaves the screen, and it's never freed: its `deinit` never runs. From puzzle 7 you know why: a cycle. How do Swift developers break it?

## See it

```diagram weak
```

## The building block

A Swift class can have a **deinit**: code that runs when an instance is freed. A missing `deinit` message is the classic sign of a leak.

A **weak reference** points at an object **without** adding to its count. It can't keep the object alive; when the object is freed, the weak reference becomes `nil` (Swift's `null`). Make one link in a cycle weak, and the counts can reach zero again:

```swift
class Apartment {
    weak var tenant: Person?   // doesn't keep the person alive
}
```

The sneakier cycle is a **closure**, Swift's lambda. A closure holds strong references to everything it uses, including `self` (Swift's `this`). If `self` stores the closure, that's a cycle:

```swift
class Screen {
    var onTick: (() -> Void)?
    func start() {
        onTick = { [weak self] in   // capture self weakly
            self?.refresh()
        }
    }
}
```

`[weak self]` is a capture list: it tells the closure to hold `self` weakly. Inside, `self` may already be gone, so it's optional: `self?.refresh()`.

Which link should be weak? The one pointing at the object that should be allowed to go first: here, the screen.

## The analogy

Two climbers roped together hold each other up forever. A weak reference is a hand on the other's shoulder instead of a rope: you still know where they are, but if they leave, nothing holds them back.

## Check yourself

- The screen stores a closure that uses `self` strongly. The user leaves. What happens?::*The screen is never freed: it and the closure hold each other||The screen is freed, because the user left it >> Leaving doesn't change counts; the closure still holds the screen. >> s2||The closure is freed, and the screen with it >> The screen holds the closure, so neither count reaches zero. >> s2::Self stores a closure that holds self: a cycle.
- With `[weak self]`, the screen is freed while the closure is still stored. What does `self` become inside it?::*`nil`, since a weak reference empties when its object is freed||A copy of the screen kept by the closure >> A weak reference keeps nothing; it becomes nil. >> s4||Still the screen, because the closure was created first >> Order doesn't matter; weak never keeps the object alive. >> s4::Weak references become nil.
- What's the difference between a strong and a weak reference?::*A strong one adds to the count and keeps the object alive, while a weak one doesn't||A weak one adds to the count and keeps the object alive, while a strong one doesn't >> That's the two swapped. >> the-building-block::Counted vs not counted.

## Sources

- [The Swift Programming Language: Automatic Reference Counting](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/automaticreferencecounting/) ("Weak and unowned references enable one instance in a reference cycle to refer to the other instance without keeping a strong hold on it"; "Use a weak reference when the other instance has a shorter lifetime"; strong reference cycles for closures are resolved with "a closure capture list"; the `weak var tenant: Person?` example)
