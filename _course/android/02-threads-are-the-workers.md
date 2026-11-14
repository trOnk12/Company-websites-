---
title: Threads are the workers
short: Threads
summary: Inside every process, the work is done by workers that run code one step at a time. One of them, in every app, is in charge of the screen.
takeaway: A process can have many threads, but only one, the main thread, draws your screen and handles taps. If it's busy, the screen waits.
---

## The problem

In puzzle 1, the kernel handed the CPU to a process. But a process often needs to do several things at once: download a song, play it, and keep the screen responsive. Who actually runs the code inside a process?

## See it

```diagram threads
```

## The building block

A **thread** is a worker inside a process. It runs code one step after another. A process can have several threads, and the kernel gives each of them turns on the CPU, just as it does with processes.

Every Android app has one special thread: the **main thread**. It's the one that draws the screen and handles taps. Other threads can download or calculate, but anything on the screen is the main thread's job. (Why only one thread? Puzzle 14.)

## The analogy

Inside the house work several people. One of them, the clerk at the front desk, deals with everything visitors see: that's the main thread. The others work in the back.

## Check yourself

- The main thread is busy for 3 seconds sorting a huge list. The user taps a button. What happens?::*The tap waits until the main thread is free, and the screen seems frozen||Another thread handles the tap meanwhile >> Taps and drawing are the main thread's job only. Other threads can't step in. >> s3||The kernel stops the sorting to handle the tap >> The kernel shares the CPU between threads, but it doesn't take over the main thread's work. >> s3::Only the main thread handles taps and drawing, so while it's busy, the screen waits.
- Why put a download on another thread, not the main thread?::*So the main thread stays free to draw the screen and handle taps||Because only other threads can use the internet >> Any thread can download. The point is to keep the main thread free. >> s2::The main thread must stay free for the screen.
- What's the difference between a process and a thread?::*A process is a running app with its own memory; threads are the workers inside it||They're the same thing with two names >> A process is the house; threads are the people working inside it. One process, many threads. >> s1::Threads live inside a process and share its memory.

## Sources

- [Android Developers: Processes and threads overview](https://developer.android.com/guide/components/processes-and-threads)
