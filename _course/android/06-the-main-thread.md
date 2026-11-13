---
title: The main thread is one clerk with one queue
short: The main thread
summary: All UI and lifecycle code runs on one thread that takes messages from a queue, one at a time. A slow message blocks everything behind it.
takeaway: The full chain: system_server decides → Binder carries the letter → a Binder thread posts it with a Handler → the main thread's Looper runs it → your code. Keep every main-thread message short.
---

## The problem

In puzzle 5, a Binder thread picked up the town hall's letter. But your screens can't be touched from just any thread. Android's UI code isn't thread-safe: if two threads changed the same view at the same moment, it could end up broken. So every UI change and every lifecycle letter has to end up on one thread, in order.

## See it

```diagram main-thread
```

## The building block

Inside your process:

- `MessageQueue`: the queue of messages ("run this"), sorted by when they should run.
- **Looper**: `Looper.loop()` is an endless loop on one thread: take the next message, run it, repeat; sleep when the queue is empty.
- **Handler**: the slot that puts a message into one Looper's queue. `handler.post { … }` drops your code in as a letter.

```kotlin
val main = Handler(Looper.getMainLooper())
main.post { textView.text = "Done" }        // runs when the clerk reaches it
main.postDelayed({ hideHint() }, 2_000)     // runs about 2 s later
```

Every app process starts in `ActivityThread.main()`, which prepares this loop for the main thread and runs it forever.

The screen is redrawn about every 16 ms (60 times a second), and each redraw is also a message in this queue. If a message takes longer, frames are skipped and the app stutters ("jank"). If a touch waits 5 seconds, the system shows an **ANR** dialog: Application Not Responding.

In puzzle 0 the letter seemed to go straight into the clerk's tray. Now you know the real hand-off: a Binder thread receives it and posts it with a Handler.

## The analogy

One clerk at a desk with an in-tray. The clerk takes one letter at a time and finishes it before the next. Anyone, including the post office's couriers, can drop letters in through the slot (a Handler).

## Check yourself

- `onCreate()` calls `Thread.sleep(6000)` and the user taps the screen. What happens?::*The tap waits in the queue; after 5 seconds the system shows an ANR||The tap is handled on another thread meanwhile >> Touches are letters for the main thread too, so they wait in its queue behind the sleeping `onCreate`. >> s4||Android cancels `onCreate()` after 5 seconds >> Nothing is cancelled: the system shows a dialog and the user decides. Watch what stays stuck. >> s5::One message at a time: the touch waits behind the sleeping onCreate(), and after 5 seconds the system shows an ANR.
- What does `handler.post { … }` do?::*It adds the code to that Handler's queue; that thread runs it when it gets there||It runs the code right away on a new thread >> A Handler doesn't start anything: it only drops a letter into one queue. The code runs later, on that queue's thread. >> s2::A Handler is the slot into one Looper's queue. Nothing runs until that thread reaches the message.
- A Binder thread receives "resume your screen". How does it reach your `onCreate`-style code?::*It posts a message to the main thread's queue with a Handler||It calls your Activity's method directly on the Binder thread >> Screen code must run on the main thread, in order. The courier drops a letter in the queue instead. >> s2::The Binder thread hands the work to the main thread through its queue, so all UI code runs on one thread.

## Sources

- [Android Developers: Processes and threads overview](https://developer.android.com/guide/components/processes-and-threads)
- [Android Developers: ANRs](https://developer.android.com/topic/performance/vitals/anr)
- [Android reference: Handler](https://developer.android.com/reference/android/os/Handler)
- [Android reference: Looper](https://developer.android.com/reference/android/os/Looper)
