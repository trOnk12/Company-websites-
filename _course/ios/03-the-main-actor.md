---
title: The main actor
short: Swift concurrency
summary: In puzzle 2, you moved work between queues by hand. Kotlin did the same job with coroutines and dispatchers. Swift has its own version, with one idea Kotlin doesn't have built in.
takeaway: An async function can give up its thread while it waits, at each await: Swift's suspend. An actor lets only one task at a time touch its data. The main actor protects all UI data, so code marked @MainActor runs on the main thread: Swift's Dispatchers.Main.
---

## The problem

In puzzle 2, the image went to a background queue and back to the main queue, by hand, in nested blocks. In Kotlin you'd write it straight down, wrapping the slow part in withContext(Dispatchers.IO), and the coroutine does the hopping. Does Swift have that, and how does it keep screen work on the main thread?

## See it

```diagram actor
```

## The building block

Swift's version of a suspend function is an **async function**. Where it waits, you write **`await`**: at that point the function may give up its thread so other work can run on it, and later it resumes, possibly on a different thread. Like a coroutine, it reads straight down.

Swift adds one block Kotlin doesn't have built in: the **actor**. An actor is an object that lets only one task at a time touch its data. Other code that wants in has to `await` its turn. That rules out two threads changing the same data at once, by construction rather than by remembering to lock.

The most important one is the **main actor**. It protects all the data used to show the UI: code marked `@MainActor` always runs on the main thread, taking turns with rendering and touch handling. It's Swift's `Dispatchers.Main`:

```swift
@MainActor
func showProfile() async {
    let user = await api.loadUser()   // waits off the main thread, without blocking it
    nameLabel.text = user.name        // back on the main actor: safe to touch the screen
}
```

## The analogy

The clerk again. An async function steps away from the desk while it waits for a reply, so the clerk can serve others. An actor is a room with one chair: only one task inside at a time; the rest wait at the door. The main actor is the clerk's own office, where all screen work happens.

## Check yourself

- Inside a `@MainActor` function, you `await` a network call that takes 2 seconds. Does the screen freeze?::*No: while it waits, the function gives up the main thread||Yes: it's on the main actor, so the main thread waits too >> At an await, the function gives up its thread; the main thread keeps handling touches. >> s2||Yes, unless the call is moved to a global dispatch queue first >> No manual queue is needed: await already lets the main thread go. >> s2::await gives the thread back while waiting.
- Why can't two tasks change an actor's data at the same moment?::*An actor lets only one task at a time touch its data; the others wait their turn||Because every actor runs on the main thread, one thing at a time >> Only the main actor is tied to the main thread; others run anywhere, still one task at a time. >> s3::One task inside at a time.
- What's the difference between the main actor and the main queue from puzzle 2?::*Both run on the main thread; the main actor is how Swift concurrency expresses it||The main actor runs on its own thread, next to the main queue >> The main actor runs on the main thread: that's what makes UI work safe. >> s4||The main queue is for UI; the main actor is for data only >> The main actor protects UI data, and its code runs on the main thread. >> s4::Two ways of saying "on the main thread".

## Sources

- [The Swift Programming Language: Concurrency](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/concurrency/) ("An asynchronous function in Swift can give up the thread that it's running on, which lets another asynchronous function run on that thread while the first function is blocked"; "actors allow only one task to access their mutable state at a time"; "the main actor protects all of the data that's used to show the UI. The main actor takes turns rendering the UI, handling UI events, and running code that you write that needs to query or update the UI")
