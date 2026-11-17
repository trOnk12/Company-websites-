---
title: Who puts pixels on screen
short: GPU, buffers, SurfaceFlinger
summary: Your app never touches the display. It fills a block of memory with pixels and hands it to someone else, who combines it with every other window on screen. Here's that hand-off, the path every frame takes.
takeaway: The display redraws at a fixed rate and sends vsync before each refresh. Your app's RenderThread gives drawing commands to the GPU, which fills a buffer with the frame's pixels. The finished buffer is queued for SurfaceFlinger, which composites the latest buffer of every visible window into what the display shows. A frame counts only once its buffer is ready when SurfaceFlinger needs it.
---

## The problem

On your screen right now are the status bar, your app, maybe a keyboard, and the navigation bar. Each comes from a different process. Yet the display shows one picture, 60 or 120 times a second, without tearing. Who puts it together, and what exactly does your app hand over?

## See it

```diagram pixels
```

## The building block

The display redraws its picture at a fixed rate, 60 or 120 times a second. Just before each refresh it sends **vsync**, a signal that says "a new picture is about to be shown". Everything below happens in rhythm with it.

In the Android course you saw a frame's work: the main thread measures, lays out and records what to draw, and the RenderThread takes it from there. The RenderThread sends those drawing commands to the **GPU**, the graphics processor: a separate part of the chip built to fill millions of pixels at once. Android's docs put it plainly: drawing on a view's canvas uses the GPU.

The GPU writes the pixels into a **buffer**, a block of memory that holds one picture. Your app doesn't own the display, so it queues the finished buffer and moves on to the next frame with a fresh one.

On the other side of that queue is **SurfaceFlinger**, a system service. Between display refreshes, it takes the latest buffer from every visible window (your app, the status bar, the keyboard) and **composites** them: combines them into the one picture the display shows. It only accepts buffers between refreshes, so the screen never changes halfway through drawing.

So a frame is on time when its buffer, pixels finished by the GPU, is queued before the refresh it's meant for. Late in any step, main thread, RenderThread or GPU, and the display shows the old picture again. That's the jank the next puzzle measures.

## The analogy

A newspaper's layout desk. Each reporter (an app) types their article onto their own page (a buffer), with a fast typesetter (the GPU). Before the press runs (vsync), the editor (SurfaceFlinger) takes the latest page from every reporter and pastes them into one front page. An article not ready in time? Yesterday's version runs again.

## Check yourself

- Your app's main thread and RenderThread finished early, but the GPU is still filling the buffer at the refresh. What does the display show?::*The previous picture, because the new buffer isn't ready||The new frame, since your app's threads finished in time >> The pixels are written by the GPU; until it's done, there's no new buffer. >> s3||Half of the new frame and half of the old one >> SurfaceFlinger only takes finished buffers between refreshes, so there's no half picture. >> s4::No finished buffer, no new picture.
- The status bar and your app are drawn by different processes. Who combines them?::*SurfaceFlinger, which composites every visible window's latest buffer||Your app, which draws the status bar into its own buffer >> Each window fills its own buffer; your app never draws the status bar. >> s4||The GPU, which reads every app's views directly >> The GPU fills buffers it's given commands for; combining them is SurfaceFlinger's job. >> s4::One service puts every window together.
- What's the difference between vsync and a buffer?::*Vsync is the display's signal before each refresh, while a buffer is memory that holds one picture||Vsync is memory that holds one picture, while a buffer is the display's signal before each refresh >> That's the two swapped. >> the-building-block::The beat vs the picture.

## Sources

- [Android Developers: Hardware acceleration](https://developer.android.com/develop/ui/views/graphics/hardware-accel) ("all drawing operations that are performed on a View's canvas use the GPU")
- [Android Open Source Project: Graphics](https://source.android.com/docs/core/graphics) ("A surface represents a block of memory that gets composited to the screen."; "All of the visible surfaces rendered are composited onto the display by SurfaceFlinger.")
- [Android Open Source Project: BufferQueue and Gralloc](https://source.android.com/docs/core/graphics/arch-bq-gralloc) ("The BufferQueue class connects components that generate buffers of graphical data (producers) to components that accept the data for display or further processing (consumers).")
- [Android Open Source Project: SurfaceFlinger and WindowManager](https://source.android.com/docs/core/graphics/surfaceflinger-windowmanager) ("Though apps can submit buffers at any time, SurfaceFlinger only wakes up to accept buffers between display refreshes"; "This minimizes memory usage and avoids visible tearing on the screen, which can occur when updating the display mid-refresh.")
