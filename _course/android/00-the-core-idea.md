---
title: The one idea behind everything
short: The core idea
summary: Your app doesn't control its own life. Another process decides, and tells your app by sending messages to its main thread.
takeaway: system_server decides → Binder carries the letter → your main thread receives it → your code runs. You don't call onCreate(); you get called.
---

## The problem

Why does one slow line of code freeze the whole UI? Why can't your app keep a screen alive when the system wants it gone? These look like separate rules to memorise. They aren't. They follow from one idea about who is in charge, and this course builds it up one puzzle at a time.

## First, four words

- A **process** is a running program with its own private memory. Your app is one process; other apps are others.
- **Memory** here means the program's data while it runs. A process can only touch its own.
- The **kernel** is the core of the operating system. It's the only code that can reach into every process.
- A **thread** is one worker inside a process that runs code, one instruction after another.

And one Android word: a screen in your app is an **Activity**. `onCreate()` is the method that sets one up.

## See it

```diagram chain
```

## The four characters

Every puzzle uses these four. Learn the picture once and you can reason about the rest.

- Your app's process: your house. It runs your code, but it doesn't decide when things happen.
- system_server: the town hall. One long-running Android process that keeps the register of every app and screen.
- The kernel's Binder driver: the post office. The only way to carry a message between houses.
- The main thread: the one clerk at your desk, handling one letter at a time.

## Check yourself

Answer all three to unlock the next puzzle.

- Who decides that your Activity should be created?::*Another process, system_server||Your app, when it calls `onCreate()` >> That's the picture this puzzle replaces: you write `onCreate()`, but you never call it. Watch who writes the order. >> s2||The kernel's Binder driver >> Binder carries the letter, it doesn't write it. The post office delivers; the town hall decides. >> s3::system_server decides. Binder only carries the message, and your app is told.
- Can system_server call a method on your Activity object directly?::*No, it has to send a message through Binder||Yes, system services can reach into any app >> Being powerful doesn't let a process into another's memory. Only the kernel can reach into every process, which is why the letter needs the post office. >> s3::system_server lives in a different process and can't touch your app's memory, so the request travels through Binder.
- Which worker runs your `onCreate()`?::*Your app's main thread, when it reaches the letter||A worker inside system_server >> system_server only sends the order. The code of your screen runs in your house, by your clerk. >> s5||Whichever thread is free at that moment >> Not any thread: screen code always runs on the one clerk, the main thread, in order. >> s4::The letter lands in your main thread's tray, and the main thread runs your code when it gets there.

## Sources

- [Android Developers: Processes and threads overview](https://developer.android.com/guide/components/processes-and-threads)
- [Android Open Source Project: Application sandbox](https://source.android.com/docs/security/app-sandbox)
