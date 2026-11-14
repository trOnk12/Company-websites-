---
title: The kernel is in charge
short: The kernel
summary: Something has to share the phone between all those processes. That's the core of the phone's own software, and it's the only thing that can reach into every process.
takeaway: Processes never deal with the CPU or memory directly. They ask the kernel, which shares them out and keeps every process in its place.
---

## The problem

In puzzle 0, every running app was its own process with its own memory. But the phone has one CPU and one pool of memory for all of them. Who decides which process runs right now, and who hands out the memory?

## See it

```diagram kernel
```

## The building block

The phone runs its own software underneath the apps: the **operating system**. Android is an operating system, built on **Linux**: a free operating system first made for computers shared by many people.

At its core is the **kernel**. It shares the CPU between processes, switching between them many times a second, so they all seem to run at once. It hands out memory, and it opens files. Because the kernel hands out every process's memory, it can reach into any process. A process can only reach the memory it was given.

## The analogy

The processes are houses on a street. The kernel is the street's management: it decides who gets electricity right now, hands out building space, and is the only one with a key to every house.

## Check yourself

- One CPU, two apps both busy. How do both get work done?::*The kernel switches the CPU between them many times a second||They take turns: one runs until it finishes, then the other >> If one ran until it finished, the other would freeze. The kernel switches between them constantly. >> s2||Each app has its own CPU inside its process >> The phone has the CPU; processes only get turns on it, handed out by the kernel. >> s2::The kernel shares the CPU by switching between processes very often.
- An app needs more memory. Who gives it?::*The kernel||It takes some from another app's memory >> A process can't reach another's memory. Only the kernel hands memory out. >> s3::Memory is handed out by the kernel; processes ask for it.
- What's the difference between the kernel and the operating system?::*The kernel is the core part of the operating system||They're two separate programs that don't know each other >> The kernel is inside the operating system: its core, under everything else. >> s1::Android is the operating system; the kernel is its core.

## Sources

- [Android Developers: Platform architecture (Linux kernel)](https://developer.android.com/guide/platform)
- [Android Developers: Processes and threads overview](https://developer.android.com/guide/components/processes-and-threads)
