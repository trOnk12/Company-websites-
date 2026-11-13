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

- Who decides that your Activity should be created: your app, or another process?::Another process, system_server. Your app is told, and your callback runs.
- Can system_server call a method on your Activity object directly?::No. It lives in a different process and can't touch your memory, so it sends a message through Binder.
- Which thread runs `onCreate()`?::Your app's main thread, when it reaches that message in its queue.

## Sources

- [Android Developers: Processes and threads overview](https://developer.android.com/guide/components/processes-and-threads)
- [Android Open Source Project: Application sandbox](https://source.android.com/docs/security/app-sandbox)
