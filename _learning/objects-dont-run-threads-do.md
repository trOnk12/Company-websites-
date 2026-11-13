---
title: Objects don't run on threads. Whoever calls them does.
date: 2026-11-13
status: budding
tags: [android, threading]
summary: An object doesn't belong to a thread. Its method runs on whichever thread calls it, which is why "run this on the main thread" means putting a message in the main thread's queue.
---

## The gap

I pictured objects as living "on" a thread: the ViewModel on the main thread, the repository on a background thread. Then I couldn't explain why the same object's code sometimes ran on main and sometimes didn't, or what `Handler.post` actually changes.

## The pieces

- A thread is a worker that executes instructions. An object is just data plus methods in memory, shared by every thread.
- When a thread calls a method, that same thread runs the method's code, whoever created the object.
- The main thread runs a loop: it takes the next message from its queue and runs it.
- `Handler.post` doesn't move an object anywhere. It puts a piece of work in the queue of the thread the Handler's `Looper` belongs to.

## The click

Mia is the main thread and Bob is a background thread. The clerk (an object) is a desk, not a person: whoever sits down at the desk does the stamping. If Bob wants something stamped by Mia, he can't walk Mia over; he drops a note in Mia's in-box with a bell on it, and Mia stamps it when she gets to it. That in-box is the message queue, the bell is the Looper waking up, and dropping the note is `Handler.post`.

## How I checked it

A plain Java program (JDK 21) with one `Clerk` object whose `stamp()` prints the current thread's name:

- Called from `main`, it ran on `main`. Called from a thread named `bob`, the same object ran on `bob`.
- Submitted to a single-thread executor named `mia` (a queue plus one worker, like a Looper), it ran on `mia`.

This was on a plain JVM, not Android; the Handler part comes from the Android reference below. The program and a script that reruns it are in [this site's repository](https://github.com/trOnk12/Company-websites-/tree/main/_learning/experiments/objects-dont-run).

## Check yourself

- A ViewModel is created on the main thread. Does a method on it called from `Dispatchers.IO` run on the main thread?::No. It runs on the IO thread that called it; creating an object on main doesn't tie its code to main.
- What does `Handler(Looper.getMainLooper()).post { … }` actually do?::It adds the work to the main thread's message queue, so the main thread runs it when it reaches that message.
- Why can't a background thread just "switch" an object to the main thread?::Because objects don't run anything. Only threads run code, so the background thread has to hand the work to the main thread's queue.

## Sources

- [Android reference: Handler](https://developer.android.com/reference/android/os/Handler)
- [Android reference: Looper](https://developer.android.com/reference/android/os/Looper)
