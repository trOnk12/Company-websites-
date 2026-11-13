---
title: Zygote is why apps start fast
short: Zygote
summary: One process, started at boot, preloads ART and the framework. Every app is forked from it and shares its memory until it writes.
takeaway: Cold start = fork Zygote, create your Application, create your first Activity. Anything slow in Application.onCreate() is paid on every cold start, before the user sees anything.
---

## The problem

In puzzle 2, ART moved into every house. But starting ART and loading the thousands of framework classes takes seconds. If every app launch did that from scratch, every tap on an icon would be slow, and every app would hold its own copy of the same framework in memory.

## See it

```diagram zygote
```

## The building block

The kernel hands out memory in small fixed-size blocks called **pages**. To **fork** is to ask the kernel for a new process that starts as a copy of an existing one. The copy is cheap because the kernel doesn't duplicate the pages: parent and child share them, and a page is only copied when one of them writes to it (copy-on-write).

**Zygote** ("the first cell") starts at boot, loads ART and the common framework code, then waits. It also forks system_server, the town hall. When you launch an app, system_server asks Zygote to fork; the child switches to the app's UID and loads the app's code.

In the source, `ZygoteInit.main()` does exactly this: preload, start system_server, then wait for "fork an app" requests.

## In practice: cold, warm, hot start

Your app has one `Application` object per process; its `Application.onCreate()` runs before any screen exists. Then come the screens (Activities).

- Cold start: no process yet. Fork from Zygote, create the Application, then the first Activity.
- Warm start: the process is alive, but the Activity has to be created again.
- Hot start: process and Activity are alive; the app just comes back to the front. (Nothing to do with "hot code" in puzzle 2.)

## The analogy

Zygote is a show house, fully furnished at boot. Each new app house is a copy of it, but the furniture isn't duplicated: every house uses the show house's furniture until it repaints a chair. Only then does it get its own copy of that chair.

## Check yourself

- Why is heavy work in `Application.onCreate()` bad?::*It runs on every cold start, before any screen appears||It runs again every time Zygote forks any app >> Zygote's fork only copies Zygote. Your Application is created in your own process, after the fork. >> s2||It slows down the framework for all apps >> The framework pages are shared, but your code runs only in your process. It's your users who wait. >> s3::On a cold start your Application is created before the first screen, so users stare at a blank screen while it runs.
- Ten apps are running. How many copies of the preloaded framework are in memory?::*Mostly one, shared from Zygote||Ten: forking copies all of Zygote's memory >> Fork starts the child as a copy, but the kernel shares the pages instead of duplicating them. >> s3||One per app that was opened recently >> Recency doesn't matter: every forked app shares Zygote's pages. >> s3::Forked apps share Zygote's pages until they write to them (copy-on-write).
- Your app changes one shared page. What happens?::*The kernel copies just that page for your app||Zygote's page changes for every app >> That's exactly what copy-on-write prevents: your change goes into your own copy. >> s4||The whole framework gets copied into your app >> Only the page you write to is copied; everything else stays shared. >> s4::Copy-on-write copies only the page that's written, and only for the process that wrote it.

## Sources

- [Android Developers: Overview of memory management (sharing memory)](https://developer.android.com/topic/performance/memory-overview)
- [Linux man page: fork(2), copy-on-write](https://man7.org/linux/man-pages/man2/fork.2.html)
- [Android Developers: App startup time](https://developer.android.com/topic/performance/vitals/launch-time)
