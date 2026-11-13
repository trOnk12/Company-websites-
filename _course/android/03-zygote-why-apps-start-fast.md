---
title: Zygote is why apps start fast
short: Zygote
summary: One process, started at boot, preloads the runtime and the framework. Every app is a fork of it, and shares its memory until it writes.
takeaway: Cold start = fork from Zygote, then create your Application, then your first Activity. Anything slow in Application.onCreate() is paid on every cold start, before the user sees anything.
---

## The problem

Starting ART and loading the Android framework's thousands of classes takes seconds. If every app launch did that from scratch, every tap on an icon would be painfully slow, and every app would use its own copy of the same framework in RAM.

## See it

```diagram zygote
```

## The building block

**Zygote** ("the first cell") starts at boot, loads ART and the common framework code and resources, then waits. To launch an app, the system asks Zygote to **fork**. The child already has everything loaded; it switches to the app's user ID and loads the app's code.

Because Linux implements fork with **copy-on-write** pages, the framework's memory is shared across all apps until one of them writes to a page.

## The analogy

A shared textbook. Every student "has a copy", but they're all reading the same book. Only when a student writes a note on a page do they get a photocopy of that one page.

## In practice: cold, warm, hot

- **Cold start**: no process yet. Fork from Zygote, create the Application, create the Activity.
- **Warm start**: the process is alive, but the Activity has to be created again.
- **Hot start**: process and Activity are alive; the app just comes back to the front.

## Check yourself

- Why is heavy work in `Application.onCreate()` bad?::It runs on every cold start, on the main thread, before any screen is shown, so users stare at a blank screen.
- Ten apps are running. How many copies of the preloaded framework are in RAM?::Mostly one. The forked apps share Zygote's pages until they write to them.
- What's the difference between a warm and a cold start?::A cold start has to create the process (fork from Zygote) first; a warm start reuses the living process and only recreates the Activity.

## Sources

- [Android Developers: Overview of memory management (sharing memory)](https://developer.android.com/topic/performance/memory-overview)
- [Linux man page: fork(2), copy-on-write](https://man7.org/linux/man-pages/man2/fork.2.html)
- [Android Developers: App startup time](https://developer.android.com/topic/performance/vitals/launch-time)
