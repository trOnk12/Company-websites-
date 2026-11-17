---
title: Frames, jank and ANRs
short: Frames and ANRs
summary: Drawing the screen is just another message in the main thread's queue. So one slow message doesn't only delay a tap: it stops the screen from being drawn.
takeaway: A frame is due about every 16 ms. A message that takes longer makes frames late: jank. A touch that waits 5 seconds gets the "App isn't responding" dialog: an ANR.
---

## The problem

In puzzle 14, the main thread ran messages one at a time. Now suppose one message takes a long time, like reading a big file, or a `Thread.sleep(6000)` in a button's click code, which pauses the thread for 6 seconds. What does the user see?

## See it

```diagram frames
```

## The building block

The screen is redrawn about 60 times a second. Each redraw is a **frame**, and each one must be ready within about 16 milliseconds (1000 ms ÷ 60). Drawing a frame is a message in the main thread's queue too.

If a message takes longer than that, the frames behind it come late, and the app visibly stutters: **jank**.

system_server sent each touch down the window's input channel (puzzle 14), and waits for your app to answer "done" on that same line, which it does once the main thread has handled the touch. If a touch waits in the queue for 5 seconds with no answer, system_server shows the "App isn't responding" dialog: an **ANR** (Application Not Responding). That's why slow work (files, network, big calculations) belongs on another thread, never on the main thread.

## The analogy

The clerk also has to repaint the shop window 60 times a second. One long phone call, and the window freezes; keep a customer waiting long enough, and the town hall puts up a sign: "not responding".

## Check yourself
- A button's click code calls `Thread.sleep(6000)`, and the user taps the screen again right away. What happens?::*The tap waits, and after 5 seconds system_server shows an ANR||Another thread handles the tap while the main thread sleeps >> Touches are messages for the main thread too, so they wait behind the sleeping click code. >> s3||Android stops the click code after 5 seconds and runs the tap >> Nothing is stopped: system_server shows a dialog and the user decides. >> s4::One message at a time: the touch waits behind the sleep, and after 5 seconds comes the ANR.
- A message takes 100 ms (about six frames' worth: 100 ÷ 16), and there are no touches. Is that an ANR?::*No, but about six frames come late: the app stutters (jank)||Yes: any message slower than a frame is an ANR >> An ANR is about a touch waiting 5 seconds. 100 ms is jank: late frames. >> s2::100 ms ÷ 16 ms ≈ 6 frames late: jank. A touch waiting 5 s means an ANR.
- Why should file reading go on another thread?::*Because then the main thread stays free to draw frames and handle touches||Because the main thread isn't allowed to read files or the network >> It can; it just mustn't, because frames and touches wait behind it. >> s2::Keep every main-thread message short.

## Sources

- [Android Developers: Slow rendering (jank)](https://developer.android.com/topic/performance/vitals/render)
- [AOSP: InputChannel.java](https://github.com/aosp-mirror/platform_frameworks_base/blob/1cdfff555f4a21f71ccc978290e2e212e2f8b168/core/java/android/view/InputChannel.java#L29) ("An input channel specifies the file descriptors used to send input events to a window in another process") and [InputEventReceiver.java](https://github.com/aosp-mirror/platform_frameworks_base/blob/1cdfff555f4a21f71ccc978290e2e212e2f8b168/core/java/android/view/InputEventReceiver.java#L213) (`finishInputEvent(event, handled)`)
- [Android Developers: ANRs](https://developer.android.com/topic/performance/vitals/anr)
