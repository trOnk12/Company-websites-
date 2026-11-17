---
title: When memory runs out, who goes
short: The low-memory killer
summary: A phone has a few gigabytes of memory and dozens of apps you've opened. It can't keep them all. Here's who decides which process ends, in what order, and why your app can be gone when the user comes back.
takeaway: When free memory runs low, Android's low-memory killer ends whole processes, starting with the least important. Importance comes from what the process is doing for the user: the app on screen matters most; cached apps in the background, which the user isn't using, go first. A process ended this way gets no warning.
---

## The problem

You open ten apps in a row. Each one is a process with its own memory (puzzle 0), and memory is limited. The phone doesn't slow to a crawl, and it doesn't ask you what to close. Something quietly makes room. Who, and how does it choose?

## See it

```diagram lmk
```

## The building block

Android sorts every app process by **importance**: how much the user would notice if it disappeared. At the top is the **foreground** process, the app the user is using right now. Below it are processes the user can still see or hear, like music playing. At the bottom are **cached** processes: apps the user left, kept in memory only so they open faster next time.

When free memory runs low, Android's **low-memory killer** ends processes to get memory back. It always starts with the least important: cached apps go first, the app on screen last. It doesn't ask your app; the kernel ends the process, and everything in its memory is gone at once.

That's why "my app is in the background" never means "my app is still running". Leaving an app makes it cached, and a cached process can disappear at any moment. Two later puzzles build on this: starting an app again from nothing (puzzle 14), and how a screen gets its state back after its process was ended (puzzle 22).

## The analogy

A hotel with a fixed number of rooms. Guests who are in their rooms stay. Guests who checked out but left their bags are kept as long as there's space, so they can come back quickly. When a crowd arrives, the hotel clears those rooms first, oldest first, without calling anyone.

## Check yourself

- Your app is in the background and memory runs low. Another app is on screen. Which process goes first?::*Yours: a cached app ranks below the one on screen||The app on screen, since it uses the most memory of all >> Importance decides, not size: the app the user is using is the last to go. >> s3||Neither: Android asks the user which app to close >> No one is asked: the low-memory killer decides on its own. >> s3::Least important first; the app on screen last.
- The low-memory killer ended your app's process. What does your code get to run first?::*Nothing: the whole process ends at once, with no warning||Your Activity's last lifecycle callbacks, so it can save >> There's no callback for this: the process and everything in its memory just disappear. >> s4||A message on the main thread asking it to clean up >> A message needs a running process; this one is ended outright. >> s4::Ended outright: plan for it before it happens.
- What's the difference between a foreground process and a cached process?::*Foreground is the app in use, ended last; cached is kept for later, ended first||Foreground is kept for later, ended first; cached is the app in use, ended last >> That's the two swapped. >> s2::In use vs kept for later.

## Sources

- [Android Developers: Processes and app lifecycle](https://developer.android.com/guide/components/activities/process-lifecycle) ("A foreground process is one that is required for what the user is currently doing."; "A cached process is one that is not currently needed, so the system is free to kill it as needed when resources like memory are needed elsewhere.")
- [Android Developers: Memory allocation among processes](https://developer.android.com/topic/performance/memory-management) ("To decide which process to kill, LMK uses an \"out of memory\" score called oom_adj_score to prioritize the running processes. Processes with a high score are killed first. Background apps are first to be killed, and system processes are last to be killed.")
