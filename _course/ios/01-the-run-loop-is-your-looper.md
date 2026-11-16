---
title: The run loop is your Looper
short: Run loop
summary: On Android, the main thread runs a Looper: take a message from the queue, run it, repeat. iOS has the same idea under another name. Here it is, and the one way it differs.
takeaway: Every iOS thread has a run loop: an event loop that handles work when there is some and puts the thread to sleep when there is none. The app framework starts the main thread's run loop for you, just as Android starts the main Looper. UI work belongs on that loop, so blocking it freezes the screen.
---

## The problem

On Android, you know the main thread's routine: a Looper takes the next message from its queue, runs it to the end, and repeats, and nothing touches the screen from anywhere else. Your iOS screen also needs touches handled, timers fired and redraws done, one after another, on one thread. Who runs that loop on iOS?

## See it

```diagram runloop
```

## The building block

iOS calls it a **run loop**: an event processing loop. Every thread has one. It waits for work, a touch, a timer, a task from elsewhere; handles it; and when nothing is left, puts the thread to sleep until the next thing arrives. Same job as Android's Looper, same reason: one thread handles events one at a time, so nothing has to lock the screen.

You don't start the main one yourself: the app framework sets up and runs the run loop on the main thread when the app launches, the way Android's `ActivityThread.main()` starts the main Looper. Other threads only run their run loop if you start it.

And the rule you already know carries over exactly: screen work happens on the main thread, and anything slow you do there blocks the loop. A touch waits behind it, and the screen stops responding, iOS's version of jank.

## The analogy

The same clerk from the Android house, with a different name on the badge: work from the in-tray, one item at a time, and doze off at the desk when the tray is empty.

## Check yourself

- On iOS, you read a large file on the main thread, and it takes 2 seconds. The user taps meanwhile. What happens?::*The tap waits until the run loop gets back to it, and the screen seems frozen||The tap is handled on another thread, so the screen stays smooth >> Touches are the main run loop's job; they wait behind your file read. >> s3||The run loop pauses the file read, handles the tap, then resumes >> A run loop runs each piece of work to the end; it can't pause your read halfway. >> s3::One loop, one thing at a time.
- Why does the main thread sleep when there's no work, instead of checking again and again?::*Checking again and again would burn CPU and battery for nothing||Because iOS ends threads that check too often >> Nothing is ended: sleeping is what saves the CPU and battery. >> s2::Sleep until there's work: no wasted CPU.
- What's the difference between a run loop and a thread?::*The thread does the work; the run loop feeds it events||A run loop is a thread that only handles touches >> A run loop isn't a thread: every thread has one, feeding it its events. >> s1||They're two names for the main thread >> Every thread has a run loop; the main thread is only one of them. >> s1::Worker vs its routine.

## Sources

- [Apple: Threading Programming Guide, Run Loops](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/Multithreading/RunLoopManagement/RunLoopManagement.html) ("A run loop is an event processing loop that you use to schedule work and coordinate the receipt of incoming events. The purpose of a run loop is to keep your thread busy when there is work to do and put your thread to sleep when there is none"; "each thread, including the application's main thread, has an associated run loop object… The app frameworks automatically set up and run the run loop on the main thread")
