---
title: An app is a Linux process with its own user
short: Apps are processes
summary: Each app gets its own Linux user ID and its own process. The kernel keeps them apart, so one app can't open another's files or read its memory.
takeaway: Your app is a house with its own key (a UID) and its own walls (a process). To get anything from another app, you go through official doors, never straight in.
---

## The problem

A phone runs dozens of apps from different companies. A banking app must be safe from a game that wants to read its files or its memory. How do you keep them apart without trusting either of them?

## See it

```diagram sandbox
```

## The building block

Android is built on Linux, and Linux already knows how to keep *users* apart. So Android turns each app into its own user: at install time the app gets a unique **user ID** (UID), and it runs in its own **process**.

- Files the app creates belong to its UID; other apps can't open them.
- Processes can't read each other's memory.
- The kernel enforces both, so a buggy or hostile app can't switch them off.

## The analogy

An apartment block. Each app has its own flat and its own key. Neighbours can't walk in. To ask for something, they go through the building's official channels.

## Check yourself

- An app wants to read another app's database file directly. Possible?::No. The file belongs to another UID and the kernel refuses. Apps share data only through official channels such as ContentProviders and Intents.
- Who enforces the sandbox: the app, or the kernel?::The kernel. That's why an app can't simply turn it off.
- Two apps run at the same time. Do they share one process?::No. Each app runs in its own process, with its own memory.

## Sources

- [Android Open Source Project: Application sandbox](https://source.android.com/docs/security/app-sandbox)
- [Android Developers: Processes and threads overview](https://developer.android.com/guide/components/processes-and-threads)
