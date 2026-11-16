---
title: Queues, not handlers
short: GCD and dispatch queues
summary: On Android, you post work to the main thread with a Handler and run slow work on another thread or a coroutine dispatcher. iOS has one system for both. Here it is.
takeaway: Grand Central Dispatch runs tasks from dispatch queues on a pool of threads it manages. A serial queue runs one task at a time, in order; a concurrent queue can run several at once. The main queue runs on the main thread, so DispatchQueue.main.async is iOS's handler.post.
---

## The problem

In puzzle 1, slow work on the main run loop froze the screen. On Android you'd move it to another thread, a coroutine on `Dispatchers.IO` for example, and then post the result back to the main thread with a `Handler`. On iOS you don't create those threads yourself either. Where does the slow work go, and how does the result get back?

## See it

```diagram queues
```

## The building block

iOS's answer is **GCD**, Grand Central Dispatch. Instead of threads, you think in **dispatch queues**: first-in, first-out lines of tasks. You add a task, a closure, to a queue; GCD runs it on one of a pool of threads that it creates and manages for you.

A queue is either **serial**, running one task at a time in order, or **concurrent**, able to run several of its tasks at the same time on different threads.

One queue is special: the main queue. It's serial, and its tasks run on the main thread: they're one of the kinds of work the main run loop from puzzle 1 picks up, next to touches and timers. The others you'll use most are the global queues: concurrent queues GCD provides, ready to use, for work off the main thread. So the iOS pattern is the Android one, with new names:

```swift
DispatchQueue.global().async {          // a concurrent queue: off the main thread
    let image = loadBigImage()          // slow work
    DispatchQueue.main.async {          // back to the main queue
        imageView.image = image         // screen work, on the main thread
    }
}
```

`DispatchQueue.main.async` is iOS's `handler.post`: it adds your task to the main queue, and the main thread runs it when it gets there. The rule is the same as Android's: screen work only on the main queue.

## The analogy

The clerk from puzzle 1 still has one in-tray: the main queue. But the back office no longer has named workers: it has more in-trays, and a manager (GCD) who assigns whoever is free to pick up the next task.

## Check yourself

- You add three tasks to a serial queue, one after another. How do they run?::*One at a time, in the order you added them||All three at once, each on its own thread >> That's a concurrent queue; a serial one runs one task at a time. >> s2||In any order, whichever thread is free first >> A serial queue keeps the order: first in, first out. >> s2::Serial: one at a time, in order.
- Why does the image go back through `DispatchQueue.main.async` before it's shown?::*Because screen work must run on the main thread, and the main queue runs there||Because the global queue can't hold an image that big >> Size isn't the issue: only the main thread may touch the screen. >> s4||Because GCD deletes a task's results when its queue finishes >> Nothing is deleted; the result has to be used on the main thread. >> s4::Screen work belongs on the main queue.
- What's the difference between a dispatch queue and a thread?::*A queue is a line of tasks, and GCD picks which thread runs each||A dispatch queue is GCD's name for one thread >> A concurrent queue can run tasks on several threads; queues and threads aren't one-to-one. >> s3||A thread is a queue that runs on the main run loop >> Only the main queue is tied to the main thread; other queues use GCD's pool. >> s3::Tasks wait in queues; threads run them.

## Sources

- [Apple: DispatchQueue](https://developer.apple.com/documentation/dispatch/dispatchqueue) ("An object that manages the execution of tasks serially or concurrently on your app's main thread or on a background thread. Dispatch queues are FIFO queues to which your application can submit tasks in the form of block objects. Dispatch queues execute tasks either serially or concurrently. Work submitted to dispatch queues executes on a pool of threads managed by the system.")
