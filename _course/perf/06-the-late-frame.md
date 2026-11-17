---
title: The late frame
short: Expected vs actual
summary: Puzzle 5 showed that a frame's buffer must be ready before the display's next refresh. Perfetto draws that limit for every frame, next to when the frame really finished. Here's how to read the two lines, and tell your app's lateness from someone else's.
takeaway: FrameTimeline gives every frame two slices: the Expected Timeline, the window the app was given, and the Actual Timeline, from Choreographer's callback to when the frame was posted and the GPU finished. Actual past the deadline is jank; FrameTimeline says whether the app or SurfaceFlinger was late. Then read the late frame's main thread and RenderThread: states, then flame chart.
---

## The problem

Users say scrolling stutters, but only sometimes. In a trace there are hundreds of frames. Which ones were late, by how much, and was it your app's fault, or the display side's?

## See it

```diagram frametl
```

## The building block

In puzzle 5 you followed a frame's path: the main thread measures, lays out and draws, the RenderThread hands the drawing to the GPU, and the finished buffer must be queued for SurfaceFlinger before the vsync it's meant for. Since Android 12, Perfetto's **FrameTimeline** draws that contract for each frame, as two slices under your app:

- **Expected Timeline**: the window the app was given for this frame. It starts when the Choreographer callback was scheduled; its end is the frame's **deadline**.
- **Actual Timeline**: what really happened. It starts when `Choreographer#doFrame` started running and ends at whichever came later: the frame being posted to SurfaceFlinger (the RenderThread queues the buffer), or the GPU finishing.

When Actual ends after the deadline, the frame is janky, and FrameTimeline labels whose fault it was. "App Deadline Missed" means your app ran longer than expected. Other labels blame SurfaceFlinger or the display, and "Buffer Stuffing" means your app queued frames faster than they could be shown.

Notice that the GPU counts. A frame whose main thread finished early can still be late if the GPU work was too heavy.

So the method is: find the late frames on the Actual Timeline, then zoom into that frame's main thread and RenderThread. Read their states (puzzle 4) first, then the flame chart (puzzle 3) for the Running parts.

## The analogy

A train timetable next to the actual arrival board. The timetable (Expected) says when each train should arrive; the board (Actual) says when it did. A late train is easy to spot, and the board even says whether it was the driver or the station.

## Check yourself

- A frame's main thread finished well before the deadline, but FrameTimeline marks it late. What can explain it?::*The GPU finished after the deadline, and that counts too||Nothing: if the main thread finished early, the frame is on time >> The Actual Timeline ends at the later of posting and the GPU finishing. >> s3||The Expected Timeline was drawn wrong by Perfetto >> The expected window is the app's budget; the GPU work came on top. >> s3::Actual ends at max(GPU, post time).
- A frame is marked "App Deadline Missed". Where do you look next?::*At that frame's main thread and RenderThread, states first||At SurfaceFlinger's threads, since it draws the frame >> That label means your app took too long; SurfaceFlinger has its own labels. >> s4||At the Expected Timeline, to make the window longer >> The window comes from the display's timing; you can't stretch it. >> s4::The app was late: read the app's threads.
- What's the difference between the Expected Timeline and the Actual Timeline?::*Expected is the window the app was given, while Actual is when its work really ran||Expected is when the work really ran, while Actual is the window the app was given >> That's the two swapped. >> the-building-block::Budget vs what happened.

## Sources

- [Perfetto: Android Jank detection with FrameTimeline](https://perfetto.dev/docs/data-sources/frametimeline) ("FrameTimeline requires Android 12(S) or higher"; "Expected Timeline: Each slice represents the time given to the app for rendering the frame… The start time is the time the Choreographer callback was scheduled to run"; "Actual Timeline: These slices represent the actual time an app took to complete the frame (including GPU work) and send it to SurfaceFlinger for composition… The end time of the slices here represent max(gpu time, post time)"; "AppDeadlineMissed: The app ran longer than expected causing a jank.")
- [Android Studio: UI jank detection](https://developer.android.com/studio/profile/jank-detection) (the threads relevant to a janky frame: "the UI thread, RenderThread, and the GPU completion thread")
