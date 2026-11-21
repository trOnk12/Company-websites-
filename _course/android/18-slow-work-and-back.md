---
title: Slow work off the main thread, and back
short: Out and back
summary: Puzzle 17 said slow work must leave the main thread. But only the main thread may touch the screen. Here's the trip every Android app makes: hand the work to another thread, then hand the result back.
takeaway: Keep slow work away from the UI thread, then dispatch the display update to its owner. A coroutine must use appropriate dispatchers or genuinely suspending operations to achieve that separation.
---

## The problem

A tap should load a 2-second list. On the main thread, the screen freezes for 2 seconds and might even get an ANR (puzzle 17). On another thread, the list loads, but that thread may not touch the screen (puzzle 3). How does the list get from one to the other?

## See it

```diagram roundtrip
```

## The building block

A **worker thread** is any thread that isn't the main thread, made to do slow work: download, read a file, sort a big list. While it works, the main thread keeps drawing frames and handling touches.

When the worker has the result, it doesn't touch the screen itself. It posts a small piece of code to the main thread's message queue (puzzle 16), and the main thread runs it when it gets there, like any other message:

```kotlin
val main = Handler(Looper.getMainLooper())   // a Handler for the main thread's queue

button.setOnClickListener {
    thread {                                  // a new worker thread
        val items = loadList()                // 2 seconds, off the main thread
        main.post { list.show(items) }        // back on the main thread
    }
}
```

`thread { }` (from Kotlin's standard library) starts a new thread that runs the code in the braces. Inside an Activity, `runOnUiThread { }` posts to the UI thread when called from a worker; when already on the UI thread it runs the action immediately.

That's the whole pattern: out to a worker, back with a post. In real apps you'll write it with Kotlin coroutines, where the dispatcher and suspension points determine where each part runs; underneath, the result still comes back as a message on the main thread.

## The analogy

The clerk at the front desk sends a runner to the archive. The clerk keeps serving visitors. When the runner comes back, he doesn't barge in: he drops the file in the clerk's in-tray, and the clerk hands it to the visitor.

## Check yourself

- A worker thread finished loading the list and sets the screen's text itself. What's wrong?::*Only the main thread may change the screen, so the worker must post it||Nothing is wrong, as long as the list loaded without any errors >> The screen has one owner, the main thread; another thread changing it can break it (puzzle 3). >> s3||It's too slow, because a worker thread draws text more slowly than the main thread >> Speed isn't the issue: the rule is who may touch the screen. >> s3::Out to a worker, back with a post.
- While the worker loads for 2 seconds, the user taps another button. What happens?::*The main thread handles it at once: it isn't waiting||The tap waits until the worker has finished loading >> The main thread isn't blocked: the slow work is on the worker. >> s2||The worker handles the tap, since it's the thread that's busy >> Touches are the main thread's job; the worker only loads. >> s2::The main thread stays free while the worker works.
- What's the difference between `thread { }` and `main.post { }`?::*`thread { }` starts a new worker thread; `main.post { }` queues code for the main thread||`thread { }` queues code for the main thread; `main.post { }` starts a new worker thread >> That's the two swapped. >> the-building-block::Out vs back.

## Sources

- [Android Developers: Processes and threads overview](https://developer.android.com/guide/components/processes-and-threads) ("Android offers several ways to access the UI thread from other threads": `Activity.runOnUiThread(Runnable)`, `View.post(Runnable)`, `View.postDelayed(Runnable, long)`)
- [Kotlin API: thread](https://kotlinlang.org/api/core/kotlin-stdlib/kotlin.concurrent/thread.html) ("Creates a thread that runs the specified block of code.")
