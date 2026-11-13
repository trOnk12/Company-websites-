---
title: The one idea behind everything
short: The core idea
summary: Your app doesn't control its own life. Another process decides, and tells your app by sending messages to its main thread.
takeaway: system_server decides → Binder carries the message → your main thread receives it → your callback runs. You don't call onCreate(); you get called.
---

## The problem

Why does Android kill your screen on rotation? Why can a background app die without `onDestroy()`? Why does one slow line of code freeze the whole UI? These look like separate rules to memorise. They aren't: they all follow from one idea about who is in charge.

## See it

```diagram chain
```

## The four characters

Every puzzle in this course uses these four. Learn the picture once and you can reason about the rest.

- **Your app's process**: your house. It runs your code, but it doesn't decide when things happen.
- **system_server**: the town hall. One long-running Android process that keeps the register of apps, screens, windows and permissions.
- **The kernel, with Binder**: the post office. The only thing that can carry data between processes.
- **The main thread**: the one clerk at your front desk, handling one letter at a time.

## Check yourself

Answer all three to unlock the next puzzle.

- Who decides that your Activity should be created?::*Another process, system_server||Your app, in its own code||The kernel's Binder driver::system_server decides. Binder only carries the message, and your app is told.
- Can system_server call a method on your Activity object directly?::*No, it has to send a message through Binder||Yes, it keeps a reference to your Activity::It lives in a different process and can't touch your app's memory, so the request travels through Binder.
- Which thread runs `onCreate()`?::*Your app's main thread||A thread inside system_server::The message lands in your main thread's inbox, and the main thread runs your callback when it gets there.

## Sources

- [Android Developers: Processes and threads overview](https://developer.android.com/guide/components/processes-and-threads)
- [Android Open Source Project: Application sandbox](https://source.android.com/docs/security/app-sandbox)
