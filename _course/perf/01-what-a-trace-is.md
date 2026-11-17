---
title: What a trace is
short: Tracks and slices
summary: Every performance tool in this course ends up drawing the same picture: rows of coloured bars over time. Before reading any of them, here's what that recording is, who writes it, and how to read one row.
takeaway: A trace is one continuous recording of timestamped events, detailed enough to rebuild the timeline afterwards: which thread ran on which core, when threads woke, and the spans the app marked. Perfetto records and shows Android traces. Time runs left to right; each thread gets a track; on it, each slice is a named span with a start and an end, and a slice drawn under another happened inside it.
---

## The problem

You want to know why your app's startup takes 900 ms. A number like "CPU usage 60%" says something is busy but not what, or when. You need a recording that says, moment by moment, what each thread was doing. What does such a recording contain, and how do you read it?

## See it

```diagram trace
```

## The building block

A **trace** (a system trace, when it covers the whole phone) is one continuous recording of events, each with a timestamp. The kernel writes down events like "this thread started running on core 2" and "this thread was woken" (the turns from puzzle 0), and apps and Android add their own, like "a frame started". Afterwards, those events are enough to rebuild the timeline: what happened, on which thread, in what order, for how long. That's the difference from a single number like CPU usage: a number says how much, a trace says what and when.

On Android the tool for this is **Perfetto**: it records traces on the phone and draws them in a web page you open in your browser. Android Studio's system trace uses it too.

Every trace view reads the same way:

- Time runs left to right. Zoom in and you can see microseconds.
- Each thread gets its own row, a **track**, grouped under its app's process.
- On a track, a **slice** is a bar with a name, a start and an end: something that happened during that span, like `Choreographer#doFrame`, the work for one frame. A slice drawn under another one happened inside it: `measure()` under `Choreographer#doFrame` ran as part of that frame.

Some slices come from Android: it marks spans like frames, and the kernel's recording draws when each thread ran. You can add your own too, and the next puzzle shows how.

## The analogy

A trace is a flight recorder for the phone: it writes down every event with the time, so after landing you can replay the flight. Perfetto is the replay screen: one lane per crew member (track), each task as a labelled block (slice).

## Check yourself

- CPU usage was 60% during startup. What does a trace add?::*Which threads did what, and when, event by event||A more precise number, like 60.4% instead of 60% >> A trace isn't a better number; it's the timeline behind it. >> s1||Nothing, since CPU usage already includes every thread >> It adds them up; the trace keeps them apart, in time. >> s1::A number says how much; a trace says what and when.
- On a thread's track, `measure()` is drawn under `Choreographer#doFrame`. What does that mean?::*`measure()` ran inside that frame's work||`measure()` ran after `Choreographer#doFrame` finished >> After would be further right on the same row, not underneath. >> s3||`measure()` ran on another thread at the same time >> Each thread has its own track; this is one thread's track. >> s3::Under means inside.
- What's the difference between a track and a slice?::*A track is one thread's row, while a slice is one named span on it||A track is one named span, while a slice is one thread's row >> That's the two swapped. >> s2::The row vs a bar on the row.

## Sources

- [Perfetto: What is tracing?](https://perfetto.dev/docs/tracing-101) ("Tracing involves collecting highly detailed data about the execution of a system. A single continuous session of recording is called a trace file or trace for short."; "Traces contain enough detail to fully reconstruct the timeline of events. They often include low-level kernel events like scheduler context switches, thread wakeups, syscalls, etc."; "Metrics are numerical values which track the performance of a system over time.")
- [Perfetto: CPU Scheduling events](https://perfetto.dev/docs/data-sources/cpu-scheduling) ("The UI represents individual scheduling events as slices"; "the scheduling events also create one track for each thread")
