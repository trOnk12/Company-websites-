---
title: Whose thread is it?
short: Coroutines on iOS
summary: Your shared code uses coroutines and Dispatchers.Main. On Android, that's the main Looper. On iOS there's no Looper. Here's where your coroutines run, and the one thing Swift can't do to them.
takeaway: On iOS, Dispatchers.Main is backed by the main queue, so a coroutine resumed there runs on the main thread, like on Android. Default and IO run on Kotlin's own worker threads. If Swift calls a suspend function without a bridge library, cancelling the Swift task doesn't cancel the Kotlin coroutine, so the shared code must own the scope.
---

## The problem

In puzzle 6, a `suspend` function crossed into Swift as a function with a completion handler. Inside, your shared code launches coroutines on `Dispatchers.Main` and `Dispatchers.IO`, as it would on Android. On Android, Main means the main thread's Looper. An iPhone has no Looper. Which thread runs your coroutines on iOS, and what happens when the Swift side gives up? (A Swift **Task** is Swift's version of a launched coroutine, and `await` is where it waits.)

## See it

```diagram dispatch
```

## The building block

On iOS, `Dispatchers.Main` is backed by the main queue from puzzle 10, the line of tasks the main thread's run loop works through. So a coroutine that resumes on `Dispatchers.Main` runs on the main thread, exactly where screen work belongs, just as on Android. `Dispatchers.Default` and `Dispatchers.IO` are intended for CPU and blocking work respectively. Do not depend on a particular worker thread or assume a call always switches threads.

The surprise is **cancellation**. On Android, cancelling the job of a **scope**, the `CoroutineScope` that owns a group of coroutines, signals cancellation to its children. Running code must cooperate before it stops. From Swift, a Kotlin `suspend` function arrives as a function with a completion handler, and that bridge has no way to pass a cancellation through. So when the Swift task that's waiting is cancelled, say the user leaves the screen, the Kotlin coroutine keeps going: the network call runs to the end, and the Swift side still waits for it, for a screen that's already gone.

Two ways out. Libraries such as SKIE, a Kotlin-to-Swift bridge from Touchlab, generate real Swift async functions that do pass cancellation through. Or your shared code owns the scope itself: a shared class creates its `CoroutineScope`, and exposes a `close()` that the Swift side calls when the screen goes away, which cancels everything in it.

## The analogy

A restaurant kitchen. On iOS the head chef still works at the main counter (the main queue), and the prep cooks are still in the back. But when a diner on the Swift side walks out, nobody tells the kitchen: the order is cooked anyway, unless the kitchen itself is told to close the ticket.

## Check yourself

- Your shared code resumes a coroutine on `Dispatchers.Main` on iOS. Which thread runs it?::*The main thread, through the main queue||A Kotlin worker thread, because there's no Looper on iOS >> On iOS, Main is backed by the main queue, so it still runs on the main thread. >> s2||Whichever thread called the suspend function from Swift >> The dispatcher decides, not the caller: Main means the main queue. >> s2::Main is still the main thread on iOS.
- A Swift task awaits your suspend function, then is cancelled. You use no bridge library. What happens to the Kotlin coroutine?::*It keeps running, since the completion-handler bridge can't pass cancellation||It's cancelled with the Swift task, as it would be in Kotlin >> The plain bridge is a completion handler, which has no way to carry the cancellation across. >> s3||It's paused until the Swift task is restarted >> Nothing pauses it; it runs to the end, and nothing stops it. >> s3::Without a bridge, cancellation doesn't cross.
- What's the difference between `Dispatchers.Main` on Android and on iOS?::*Android backs it with the main Looper, iOS with the main queue, both on the main thread||On iOS it runs on a worker thread, because UIKit has no main thread >> UIKit has a main thread too; Main runs there on both platforms. >> s2::Different machinery, same thread.

## Sources

- [kotlinx.coroutines API: Dispatchers.Main](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-dispatchers/-main.html) ("On Native Darwin-based targets, it is a dispatcher backed by Darwin's main queue.")
- [SKIE: Suspend functions](https://skie.touchlab.co/features/suspend) ("suspend functions have to be exposed as Obj-C callback functions, which can be called from Swift using the async/await syntax. However, this is just Swift's syntax sugar. Swift still handles these functions as callback functions that do not support cancellation.")
