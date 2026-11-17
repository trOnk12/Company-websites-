---
title: The main thread on iOS
short: Main queue and run loop
summary: On Android you know the main thread: a Looper takes messages from a queue, one at a time, and only that thread may touch the UI. iOS has the same shape under other names. Here they are, before your coroutines run on it.
takeaway: iOS's main thread runs a run loop, the role of Android's Looper: it waits for work, handles it, and waits again. Work for it waits in the main queue, the role of the MessageQueue, and DispatchQueue.main.async plays handler.post. As on Android, UIKit may be touched only from the main thread, and slow work there freezes the screen.
---

## The problem

Your shared code updates data that the iOS screen shows. On Android you'd make sure that happens on the main thread, which you know as a Looper with a MessageQueue. What does iOS have instead, and does the same "UI only on the main thread" rule apply?

## See it

```diagram mainthread
```

## The building block

Same shape, different names:

| Android | iOS | Its job |
|---|---|---|
| Looper | **run loop** | keeps the main thread alive: wait for work, handle it, wait again |
| MessageQueue | **main queue** | the line of tasks waiting for the main thread |
| `handler.post { }` | `DispatchQueue.main.async { }` | add a task to that line |

The main thread's **run loop** handles touches, timers and the tasks in the main queue, one at a time. Apple describes it as an event-processing loop that keeps the thread busy when there's work and lets it sleep when there isn't.

The rule you know holds: UIKit, like Android's UI toolkit, may be touched only from the main thread. And the same consequence follows: a slow task on the main thread holds up every touch and frame behind it.

```swift
DispatchQueue.global().async {        // slow work off the main thread
    let image = loadImage()
    DispatchQueue.main.async {        // back to the main queue
        imageView.image = image       // UI: main thread only
    }
}
```

## The analogy

The same shop under a new owner: the counter clerk (the main thread) still serves one customer at a time from one line (the main queue), and only the clerk may touch the shop window (the UI). Only the signs changed.

## Check yourself

- Which iOS piece plays the role of Android's MessageQueue?::*The main queue, where tasks wait for the main thread||The run loop, because it handles the messages >> The run loop is the Looper; the line of waiting tasks is the main queue. >> s2||UIKit, because the UI work lands there >> UIKit is the screen framework; tasks wait in the main queue. >> s2::The waiting line is the main queue.
- A background thread sets `imageView.image` directly. What's wrong?::*UIKit may be touched only from the main thread, as on Android||Nothing, because UIKit is thread-safe on iOS >> It isn't: UI work belongs on the main thread. >> s4||Only that it's slower than doing it on the main thread >> The problem is correctness: UI must be touched on the main thread. >> s4::UI: main thread only.
- What's the difference between the run loop and the main queue?::*The run loop keeps the main thread working, while the main queue is the line of tasks it takes from||The main queue keeps the main thread working, while the run loop is the line of tasks it takes from >> That's the two swapped. >> the-building-block::The worker's loop vs its in-tray.

## Sources

- [Apple: Threading Programming Guide, Run Loops](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/Multithreading/RunLoopManagement/RunLoopManagement.html) ("A run loop is an event processing loop that you use to schedule work and coordinate the receipt of incoming events. The purpose of a run loop is to keep your thread busy when there is work to do and put your thread to sleep when there is none.")
- [Apple: DispatchQueue](https://developer.apple.com/documentation/dispatch/dispatchqueue) ("An object that manages the execution of tasks serially or concurrently on your app's main thread or on a background thread")
