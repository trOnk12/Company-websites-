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

It starts in `SystemServer.main()`. When your app calls `startActivity()`, the request arrives in `ActivityTaskManagerService.startActivity()`.

It keeps a record of every screen of every app, and tells your app when to create, pause, stop or destroy one.

## The analogy

The town hall keeps the official register of every flat and resident. You don't issue your own building permit; you ask, and they send you the decision.

## Check yourself

Answer all three to unlock the next puzzle.

- Your app opens its own next screen with `startActivity()`. Does that call stay inside your process?::*No, it goes to system_server, which then tells your app to create the screen||Yes, your own screens never leave your app::Even your own screens go through the town hall: it checks, records, and then tells your process what to create.
- Where is the official list of your app's open screens kept?::*In system_server||In your app's memory::system_server keeps the register of every screen of every app.
- Why must system_server be a separate, trusted process?::*It decides things for all apps, which no single app's sandbox could see or be trusted with||It makes apps start faster::Screens, permissions and which app to kill affect every app, so one trusted process has to decide.

## Sources

- [Android Developers: Processes and app lifecycle](https://developer.android.com/guide/components/activities/process-lifecycle)
- [Android Developers: Tasks and the back stack](https://developer.android.com/guide/components/activities/tasks-and-back-stack)
