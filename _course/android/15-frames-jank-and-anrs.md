---
title: Frames, jank and ANRs
short: Frames and ANRs
summary: Drawing the screen is just another message in the main thread's queue. So one slow message doesn't only delay a tap: it stops the screen from being drawn.
takeaway: A frame is due about every 16 ms. A message that takes longer makes frames late: jank. A touch that waits 5 seconds gets the "App isn't responding" dialog: an ANR.
---

## The problem

In puzzle 14, the main thread ran messages one at a time. Now suppose one message takes a long time, like reading a big file, or a `Thread.sleep(6000)` in `onCreate()`, which pauses the thread for 6 seconds. What does the user see?

## See it

```diagram frames
```

## The building block

The screen is redrawn about 60 times a second. Each redraw is a **frame**, and each one must be ready within about 16 milliseconds (1000 ms ÷ 60). Drawing a frame is a message in the main thread's queue too.

If a message takes longer than that, the frames behind it come late, and the app visibly stutters: **jank**.

If a touch waits in the queue for 5 seconds, system_server notices and shows the "App isn't responding" dialog: an **ANR**. That's why slow work (files, network, big calculations) belongs on another thread, never on the main thread.

## The analogy

The clerk also has to repaint the shop window 60 times a second. One long phone call, and the window freezes; keep a customer waiting long enough, and the town hall puts up a sign: "not responding".

## Check yourself
- `onCreate()` calls `Thread.sleep(6000)` and the user taps the screen right away. What happens?::*The tap waits in the queue; after 5 seconds system_server shows an ANR||The tap is handled on another thread meanwhile >> Touches are messages for the main thread too, so they wait behind the sleeping `onCreate()`. >> s3||Android stops `onCreate()` after 5 seconds >> Nothing is stopped: system_server shows a dialog and the user decides. >> s4::One message at a time: the touch waits behind the sleep, and after 5 seconds comes the ANR.
- A message takes 100 ms, and there are no touches. Is that an ANR?::*No, but about six frames come late: the app stutters (jank)||Yes: any slow message is an ANR >> An ANR is about a touch waiting 5 seconds. 100 ms is jank: late frames. >> s2::100 ms ÷ 16 ms ≈ 6 frames late: jank. A touch waiting 5 s means an ANR.
- Why should file reading go on another thread?::*So the main thread stays free to draw frames and handle touches||Because the main thread can't read files >> It can; it just mustn't, because frames and touches wait behind it. >> s2::Keep every main-thread message short.

## Sources

- [Android Developers: Slow rendering (jank)](https://developer.android.com/topic/performance/vitals/render)
- [Android Developers: ANRs](https://developer.android.com/topic/performance/vitals/anr)
