---
title: system_server is the town hall
short: system_server
summary: One long-running process holds Android's system services. It keeps the register of every app's screens and decides their lifecycle, not your app.
takeaway: startActivity(), even for your own screen, is a letter to the town hall. It checks, writes the screen in its register, and only then tells your app to create it.
---

## The problem

In puzzle 3, Zygote also started system_server. Why does Android need it? If every app is locked in its own house, someone has to decide which app is on screen, which app opens a link, and which screens exist. It has to be one trusted place that sees all the houses.

## See it

```diagram town-hall
```

## The building block

**system_server** starts at boot and runs as long as the phone is on. Inside it live the **system services**. The one that manages screens is ActivityTaskManagerService: it keeps a record of every Activity of every app, and tells each app when to create, pause, stop or destroy one. Other services handle installed apps, windows, notifications and more.

It starts in `SystemServer.main()`. When your app calls `startActivity()`, the request arrives in `ActivityTaskManagerService.startActivity()`.

## The analogy

The town hall keeps the official register of every house and every room. You don't add a room on your own; you send a request, and they send you the decision.

## Check yourself

- Your app opens its own next screen with `startActivity()`. Does that call stay inside your process?::*No: it goes to system_server, which then tells your app to create the screen||Yes: your own screens never leave your app >> Even your own screens go through the town hall. Watch where the "start B" letter goes. >> s2::Every screen change goes through the town hall: it checks, records, and then tells your process what to create.
- Right after your app asks for screen B, has B been created yet?::*No: first system_server checks and records it, then tells your app to create it||Yes: `startActivity()` creates the screen immediately >> `startActivity()` only sends the request. The screen is created later, when the "create B" letter arrives. >> s4::Screens are created only when the town hall says so.
- Where is the official list of your app's screens kept?::*In system_server||In your app's memory >> Your Activity objects live in your memory, but the official record that decides their lives is in the town hall. >> s1::system_server keeps the register of every screen of every app; your app holds the objects.

## Sources

- [Android Developers: Processes and app lifecycle](https://developer.android.com/guide/components/activities/process-lifecycle)
- [Android Developers: Tasks and the back stack](https://developer.android.com/guide/components/activities/tasks-and-back-stack)
