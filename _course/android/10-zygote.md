---
title: Zygote, the process every app starts from
short: Zygote
summary: Starting ART and reading Android's own code into memory takes seconds. Android does it once, when the phone starts, and makes every app a copy of that.
takeaway: Zygote starts with the phone, with ART and the framework loaded. Every app's process begins as a copy of it, a fork, so apps start fast.
---

## The problem

In puzzle 8, ART lived inside every app's process. But every app also uses Android's own code, thousands of classes like `Activity`. Starting ART and reading all of that code from files into memory takes seconds. If every app did it from scratch at every tap on an icon, opening apps would be slow.

## See it

```diagram zygote
```

## The building block

The phone starting up is called **boot**. Android's own code that every app uses, like the `Activity` class that every screen is built from, is called the **framework**.

At boot, Android starts one process, **Zygote**, which starts ART, loads the framework (reads its code from files into the process's memory), and then waits. When you open an app, system_server asks Zygote for a new process, and Zygote asks the kernel to **fork**: to make a new process that starts as a copy of Zygote. The copy already has ART and the framework loaded. It switches to the app's UID (Zygote runs with the power to switch to any UID, a power ordinary apps never get; once the copy switches, it can never switch back) and loads the app's own code (its DEX, plus any code already translated ahead of time). Zygote also forked system_server at boot, so the town hall starts fast too.

Android's code is public. In it, `ZygoteInit.main()` (`main()` is where a program starts running) does exactly this: load, start system_server, then wait for "start an app" requests.

## The analogy

Zygote is a show house, furnished at boot. Every new house on the street is built as a copy of it, already furnished, then given its own key.

## Check yourself

- You open three apps. How many times does Android load the framework from scratch?::*Once, at boot, in Zygote||Three times, once per app >> Each app is a copy of Zygote, which already has the framework loaded. >> s3||Never: apps don't use the framework >> Every app uses Android's own code, like the Activity class. Zygote loads it once. >> s1::Zygote loads it once; every app process starts as a copy.
- After the fork, how does the new process become your app and not Zygote?::*It switches to your app's UID and loads your app's own code||It stays Zygote until the user taps something >> The copy changes right away: new key, your code. >> s3::Fork copies, then the copy becomes your app.
- What's the difference between Zygote and system_server?::*Zygote is the template apps are copied from; system_server decides about screens||They're the same process: Zygote is what system_server is called at boot >> Both start at boot, but Zygote only starts processes, and system_server makes the decisions. >> s4::Different jobs: copying versus deciding.

## Sources

- [Android Developers: Overview of memory management (sharing memory)](https://developer.android.com/topic/performance/memory-overview)
- [Linux man page: fork(2)](https://man7.org/linux/man-pages/man2/fork.2.html)
