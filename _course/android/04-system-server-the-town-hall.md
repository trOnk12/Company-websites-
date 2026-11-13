---
title: system_server is the town hall
short: system_server
summary: One long-running process holds Android's system services. It keeps the register of every app and screen, and it decides their lifecycle, not your app.
takeaway: Your Activity's life is decided in system_server. startActivity(), even for your own screen, is a request to the town hall, which answers by telling your app what to create.
---

## The problem

If every app is locked in its own sandbox, who decides which app is on screen, who may use the camera, which app handles a link, and which app to kill when memory runs low? It has to be one trusted place that sees everything.

## See it

```diagram town-hall
```

## The building block

**system_server** is a process started at boot that runs as long as the phone is on. Inside it live the **system services**: the activity and task managers (screens, tasks, process priority), the package manager (installed apps, their components, permissions), the window manager (what's on screen and who gets touches), and many more.

It keeps a record of every screen of every app, and tells your app when to create, pause, stop or destroy one.

## The analogy

The town hall keeps the official register of every flat and resident. You don't issue your own building permit; you ask, and they send you the decision.

## Check yourself

- Your app opens its own next screen with `startActivity()`. Does that call stay inside your process?::No. It goes to system_server, which checks it, records it, and then tells your process to create the new screen.
- Where is the official list of your app's open screens kept?::In system_server, not in your app.
- Why must system_server be a separate, trusted process?::Because it decides things for all apps (screens, permissions, killing). No app's sandbox could see or be trusted with all of that.

## Sources

- [Android Developers: Processes and app lifecycle](https://developer.android.com/guide/components/activities/process-lifecycle)
- [Android Developers: Tasks and the back stack](https://developer.android.com/guide/components/activities/tasks-and-back-stack)
