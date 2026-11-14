---
title: Sharing memory without sharing mistakes
short: Sharing memory
summary: If every app were a full copy of Zygote, memory would run out fast. The kernel makes the copies share, and copies only what changes.
takeaway: Memory comes in pages. After a fork, parent and child share every page; a page is copied only when one of them writes to it: copy-on-write.
---

## The problem

In puzzle 10, every app process started as a copy of Zygote. But Zygote holds a lot: ART and the whole framework. Twenty apps, twenty full copies? The phone would run out of memory. And yet each app must be able to change its own data without changing anyone else's.

## See it

```diagram pages
```

## The building block

The kernel hands out memory in small fixed-size blocks called **pages**.

When a process forks, the kernel doesn't copy the pages. The original (Zygote) and the new process share them. Only when one of them writes to a page, that is, changes it, does the kernel make a private copy of that one page for the writer: that's **copy-on-write**. Everything nobody changes stays shared, so twenty apps cost little more than one framework.

That doesn't break puzzle 0's rule. Shared pages are only ever read; the moment a process writes, it writes into its own copy. So no process can change another's data.

## The analogy

Every new house uses the show house's furniture. Repaint a chair, and only then do you get your own copy of that chair. The other houses keep the original.

## Check yourself

- Twenty apps are running. How many copies of the framework's pages are in memory?::*Mostly one, shared by all of them||Twenty, one per app >> Forking shares pages; it doesn't duplicate them. >> s2::Untouched pages stay shared after a fork.
- Your app changes one shared page. What happens in the other apps?::*Nothing: your app gets its own copy of that page first||They see your change too, since the page is shared >> That's exactly what copy-on-write prevents: you write into your own copy. >> s3||The change is refused >> Writing is allowed; it just goes into a private copy. >> s3::Only the writer gets a copy; everyone else keeps the original.
- Why doesn't the kernel copy every page at fork?::*Copying everything would waste memory and time; most pages are never changed||Because pages can't be copied >> Pages can be copied, and are, when written. Doing it up front would waste memory. >> s4::Copy only what changes.

## Sources

- [Android Developers: Overview of memory management (sharing memory)](https://developer.android.com/topic/performance/memory-overview)
- [Linux man page: fork(2), copy-on-write](https://man7.org/linux/man-pages/man2/fork.2.html)
