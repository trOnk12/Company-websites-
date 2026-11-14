---
title: Each app is its own user
short: Each app, its own user
summary: The kernel keeps processes apart while they run. Android also keeps each app's files apart, by giving every app its own identity.
takeaway: Every app gets its own UID, its key. The kernel checks that key on every file, so one app can never open another's private files: the sandbox.
---

## The problem

In puzzle 0, two running apps couldn't touch each other's memory. But apps also keep files on the phone, like a bank's saved accounts. When the bank app isn't even running, what stops a game from opening its files?

## See it

```diagram sandbox
```

## The building block

Linux was built for computers shared by many people, so it keeps accounts apart. A Linux account isn't necessarily a person: it's an identity the kernel uses to decide who owns which files. Android reuses that: at install time, every app gets its own account, with its own user ID, or **UID**. The UID stays the same for as long as the app is installed. Files the app creates belong to its UID. And for every process, the kernel keeps a record of which UID it runs as: when that process opens a file, the kernel compares the file's UID with the process's UID. Match: the door opens. No match: refused.

The kernel checks the UID on every file and every process. The result is the **sandbox**: walls around each app's files and memory that no app can switch off, because the kernel enforces them.

## The analogy

Every house has its own key. The kernel is the lock on every door: it opens only for the right key.

## Check yourself

- The bank app isn't running. Can the game open the bank's saved files now?::*No: the files still belong to the bank's UID, and the kernel checks it||Yes: nobody is there to guard them >> The walls aren't guarded by the bank app; the kernel checks the key on every file, running or not. >> s2::The kernel checks the UID whether or not the owner is running.
- Who enforces the sandbox?::*The kernel||Each app, by being careful >> If apps had to behave, a hostile app wouldn't. The kernel checks every access, whatever the app does. >> s2||system_server >> The town hall manages screens. The walls around files and memory are the kernel's job. >> s3::The kernel enforces it, so no app can switch it off.
- What's the difference between a UID and a process?::*A UID is an app's identity, kept as long as the app is installed; a process exists only while the app runs||They're the same thing >> The UID is the key, given at install. The process is the running house, started and ended many times. >> s1::One app, one UID; its process comes and goes.

## Sources

- [Android Open Source Project: Application sandbox](https://source.android.com/docs/security/app-sandbox)
