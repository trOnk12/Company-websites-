---
title: A running app is a process
short: Processes
summary: When you open an app, the phone starts it as a separate program with its own private data. That's why one app crashing doesn't take the others down.
takeaway: An installed app is just files. A running app is a process, with its own memory that no other process can touch.
---

## The problem

You've built an app. But what actually happens when someone taps its icon? And why can a crashing game not take your notes app down with it? Everything in this course starts here.

## See it

```diagram processes
```

## The building block

A **process** is a running program. When you tap an app's icon, the phone starts it as a process; when the phone closes it, the process ends. The app's files stay installed either way.

Each process has its own **memory**: the data the program keeps while it runs, like the text you're typing or the list on the screen. One process can't see or change another process's memory.

## The analogy

Each running app is a house. Its memory is everything inside the house. Neighbours live in their own houses: they can't walk into yours, and if a house burns down, the street is still standing.

## Check yourself

- The music app crashes while your notes app is open. What happens to the note you were typing?::*Nothing: the notes app is a separate process with its own memory||It's lost too, because all apps share memory >> Each process has its own memory. A crash ends one process; the others don't even notice. >> s4||It's saved by the music app before it crashes >> The music app can't reach the notes app's memory at all: different houses. >> s3::A crash ends only that process. Other processes keep their own memory.
- Is an app you installed but haven't opened a process?::*No: it's only files until it's started||Yes: installing an app starts its process >> Installing puts the app's files on the phone. A process exists only while the app runs. >> s1::A process is a running program. Installed but not running means files only.
- Why can't one app read the text another app is showing?::*It lives in the other process's memory, which only that process can reach||Because apps are written in different languages >> The language doesn't matter: the walls are around each process's memory. >> s3::Each process's memory is private to that process.

## Sources

- [Android Developers: Processes and threads overview](https://developer.android.com/guide/components/processes-and-threads)
- [Android Developers: Overview of memory management](https://developer.android.com/topic/performance/memory-overview)
