---
title: The main thread's queue
short: The queue
summary: Messages arrive on Binder threads, but screen code must run on the main thread. So everything for the screen waits in one line, and the main thread takes it one by one.
takeaway: Binder thread → Handler → the main thread's message queue → the Looper runs it. One message at a time, in order, so buttons and text never need locks.
---

## The problem

In puzzle 13, a Binder thread picked up the town hall's message. But in puzzle 2, only the main thread could touch the screen. Why only one thread? Because Android's screen code isn't **thread-safe**: if two threads changed the same button or text at the same moment, it could end up broken. So how does the message get from the Binder thread to the main thread?

## See it

```diagram main-thread
```

## The building block

The main thread has an in-tray: its **message queue**. (A message from Binder becomes a message in this queue: the Binder thread puts it there.) Every piece of screen work waits there as a message: draw the screen, handle a touch, run a lifecycle callback. Touches take a different road: for each window, system_server sets up a direct line into your app, an input channel, and sends every touch down it instead of through Binder. They land in the same queue.

The `Looper` is the main thread's endless loop from step 3: take the next message, run it to the end, repeat. A `Handler` is an object tied to one thread's queue that drops messages into it. The ones on this page are tied to the main thread's queue: the Binder thread uses one, then goes back to waiting (it doesn't wait for the main thread), and `handler.post { … }` is how you drop your own code in. Every app process starts in `ActivityThread.main()`: `ActivityThread` is Android's code in your process that runs the main thread's loop and carries out system_server's orders for your Activities; its `main()` which sets up this loop for the main thread and runs `Looper.loop()` forever.

## The analogy

The clerk at the front desk has an in-tray. Couriers drop letters in through the slot; the clerk takes one at a time and finishes it before the next.

## Check yourself

- Two Binder threads receive a message for your screen at the same moment. Can your buttons and text be changed by both at once?::*No: both are put in the main thread's queue and run one after the other||Yes: they run at the same time, so each must first stop the other >> Neither Binder thread touches the screen: they post to the queue, and only the main thread runs it. >> s2::The queue turns many senders into one worker, in order.
- What does `handler.post { … }` do?::*Adds your code to the queue; the main thread runs it when it gets there||Runs your code right away, on a new thread made for it >> A Handler starts nothing: it drops a message into one queue. >> s2::A Handler is the slot into the queue.
- What's the difference between a Binder thread and the main thread?::*A Binder thread receives calls; the main thread runs screen code from the queue||They're the same thread: the Binder thread also draws the screen >> The courier receives; the clerk does the work. The Binder thread hands over through the queue. >> s2::Couriers receive; one clerk works.

## Sources

- [Android Developers: Processes and threads overview](https://developer.android.com/guide/components/processes-and-threads)
- [Android reference: Handler](https://developer.android.com/reference/android/os/Handler)
- [Android reference: Looper](https://developer.android.com/reference/android/os/Looper)
