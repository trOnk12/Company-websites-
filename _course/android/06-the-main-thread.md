---
title: The main thread is one clerk with one queue
short: The main thread
summary: All UI and lifecycle code runs on one thread that handles messages from a queue, one at a time. A slow message blocks everything behind it.
takeaway: The full chain: system_server decides → Binder carries the message → a Binder thread posts it with a Handler → the main thread's Looper runs it → your callback. Keep every main-thread message short.
---

## The problem

The UI toolkit isn't thread-safe: if two threads changed the same view at once, it would break. And lifecycle messages from system_server arrive on Binder threads. So everything UI-related has to end up on one thread, in order.

## See it

```diagram main-thread
```

## The building block

Inside your process:

- `MessageQueue`: a list of messages ("run this"), sorted by when they should run.
- **Looper**: `Looper.loop()` is an endless loop on one thread: take the next message, run it, repeat; sleep when the queue is empty.
- **Handler**: the way to put a message into a particular Looper's queue.

```kotlin
val main = Handler(Looper.getMainLooper())
main.post { textView.text = "Done" }        // runs when the clerk reaches it
main.postDelayed({ hideHint() }, 2_000)     // runs about 2 s later
```

Every app process starts in `ActivityThread.main()`, which prepares this loop for the main thread and runs it forever.

`Dispatchers.Main` in coroutines is built on this same queue.

## The analogy

One clerk at a desk with an in-tray. The clerk takes one letter at a time and finishes it before the next. Anyone, including the post office's couriers (Binder threads), can drop letters into the tray through the slot (a Handler).

## Check yourself

Answer all three to unlock the next puzzle.

- `onCreate()` calls `Thread.sleep(6000)` and the user taps the screen. What happens?::*The tap waits in the queue, isn't handled within 5 seconds, and the system shows an ANR||The tap is handled on another thread||Android cancels onCreate()::One message at a time: the touch waits behind the sleeping onCreate().
- What does `handler.post { … }` do?::*It adds the code to that Handler's queue; its thread runs it when it gets there||It runs the code immediately on a new thread::A Handler is the slot into one Looper's queue. Nothing runs until that thread reaches the message.
- Why don't you need locks to update views?::*Only the main thread touches them, one message at a time||Views lock themselves internally::Single-threaded by design: the main thread handles one message fully before the next.

## Sources

- [Android Developers: Processes and threads overview](https://developer.android.com/guide/components/processes-and-threads)
- [Android Developers: ANRs](https://developer.android.com/topic/performance/vitals/anr)
- [Android reference: Handler](https://developer.android.com/reference/android/os/Handler)
- [Android reference: Looper](https://developer.android.com/reference/android/os/Looper)
