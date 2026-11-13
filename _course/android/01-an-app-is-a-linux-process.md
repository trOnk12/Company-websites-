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

Answer all three to unlock the next puzzle.

- A game wants to read the bank app's database file directly. Does it work?::*No, the kernel refuses: the file belongs to another UID||Yes, as long as both apps are installed::Each app is a separate Linux user, and the kernel checks the UID on every file. Apps share only through official doors like Intents and ContentProviders.
- Who enforces the sandbox?::*The Linux kernel||Each app, by being careful::The kernel enforces it, which is why a buggy or hostile app can't switch it off.
- Two apps run at the same time. Do they share one process?::*No, each app runs in its own process||Yes, all apps share one Android process::Each app gets its own process, with its own memory that other apps can't read.

## Sources

- [Android Open Source Project: Application sandbox](https://source.android.com/docs/security/app-sandbox)
- [Android Developers: Processes and threads overview](https://developer.android.com/guide/components/processes-and-threads)
