---
title: Turn the phone, lose your screen
short: Configuration changes
summary: In puzzle 3, system_server moved each Activity along its lifecycle. Turning the phone sends your Activity all the way to destroyed, and builds a new one.
takeaway: A configuration change (turning the phone, dark mode, language) destroys your Activity and creates a new one. The process stays; data kept in the old Activity's fields is gone.
---

## The problem

In puzzle 3, system_server moved your Activity through its lifecycle: created, started, resumed, and in the end destroyed. Usually "destroyed" means the user closed the screen. But a counter you keep in a field of your Activity resets to 0 when the user just turns the phone sideways. Nobody closed anything. Where did it go?

## See it

```diagram rotate
```

## The building block

How the phone is set up right now, its screen shape, dark mode on or off, its language, is its configuration. When it changes, that's a **configuration change**.

A new configuration can need a different screen: a wider layout, other text sizes, words in another language. The simplest way to get every part of the screen right is to build it again from scratch. So by default, system_server has your Activity **recreated**: the old Activity object is destroyed, and a new one is created, with its own `onCreate()`, for the new configuration.

The process doesn't die: same house, same main thread, same memory for everything else. Only the Activity object is replaced. But whatever lived in that object's fields went with it. That's why the counter is 0.

## The analogy

The room is torn down and built again in the new shape. Anything left lying in the old room is thrown out with it. The house itself stays standing.

## Check yourself

- Your Activity keeps the list the user scrolled in a field. The user switches the phone to dark mode. What happens to the field?::*It's gone: dark mode is a configuration change, so a new Activity is created||It stays: only turning the phone recreates the Activity >> Turning the phone is one configuration change of many; dark mode and language are too. >> s2||It stays, because the process wasn't killed >> The process lives on, but the Activity object is a new one, and the old fields went with the old object. >> s4::Any configuration change recreates the Activity.
- Why does Android build a new Activity instead of reshaping the old screen?::*Building from scratch picks up everything the new configuration needs||To free the memory the old screen used >> Recreating costs work. It's about getting the screen right for the new configuration. >> the-building-block||Because the process crashed and Android restarted it >> Nothing crashed: the process lives on; only the Activity is replaced. >> s3::Rebuilding from scratch is the simplest way to apply everything that changed.
- After the phone turns, what's new and what's the same?::*The Activity object is new; the process is the same||Both are new: the process restarts with the new shape >> The house stays; only one room is rebuilt. >> s4||Both are the same: the Activity is only resized >> The old Activity was destroyed, and `onCreate()` ran on a new one. >> s3::New Activity, same process: so something in the process could keep data across the rebuild. The next puzzle shows what.

## Sources

- [Android Developers: Handle configuration changes](https://developer.android.com/guide/topics/resources/runtime-changes) ("The system recreates an Activity when a configuration change occurs. To do this, the system calls onDestroy and destroys the existing Activity instance. It then creates a new instance using onCreate…")
