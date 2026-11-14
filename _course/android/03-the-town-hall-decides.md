---
title: Who decides about your screens
short: The town hall
summary: Your app doesn't decide when its own screens appear or go away. A separate Android process does, and tells your app.
takeaway: system_server is the town hall. It keeps the register of every app's screens and moves each screen through its lifecycle. Your app follows.
---

## The problem

In puzzle 2, the main thread drew your app's screen. But many apps are running, and only one can be on screen. Someone has to decide which screen is in front, which ones are paused in the background, and which ones are closed. That can't be each app for itself.

## See it

```diagram lifecycle
```

## The building block

In Android, each screen of an app is an **Activity**.

Android runs one long-lived process of its own, **system_server**. It keeps a register of every Activity of every app, and it decides what happens to each one.

system_server moves each Activity along a fixed path of stages, called the **lifecycle**, and your app is told about every move:

- created: the screen is set up, not yet visible;
- started: visible;
- resumed: in front, ready for taps;
- paused: still visible, but no longer in front (a dialog covers it);
- stopped: not visible anymore (another app is in front);
- destroyed: gone for good.

## The analogy

system_server is the town hall. It keeps the official register of every house and every room, and it decides which room is open. The houses don't decide for themselves; they get told.

## Check yourself

- The user switches from your app to another app. Who moves your Activity to "stopped"?::*system_server||Your app, when it notices another app in front >> Your app finds out, but it doesn't make the decision. The town hall moves it. >> s4||The kernel >> The kernel shares the CPU and memory; screens and their stages are system_server's job. >> s4::system_server decides every lifecycle stage; your app is told.
- Why can't each app decide on its own which screen is in front?::*Only one screen can be in front, so one place that sees all apps has to decide||Because apps aren't allowed to have screens >> Apps have plenty of screens. The question is who decides which one is in front. >> s1::Only something that sees every app can fairly decide which screen is in front.
- What's the difference between an Activity and system_server?::*An Activity is one screen of your app; system_server is the Android process that manages all of them||They're the same thing >> An Activity lives in your app's process; system_server is a separate process: the town hall. >> s2::Your app holds the screens; the town hall holds the register and the decisions.

## Sources

- [Android Developers: The activity lifecycle](https://developer.android.com/guide/components/activities/activity-lifecycle)
- [Android Developers: Processes and app lifecycle](https://developer.android.com/guide/components/activities/process-lifecycle)
