---
title: Each app gets its own account
short: Each app, its own account
summary: The kernel keeps processes apart while they run. Android also keeps each app's files apart, by giving every app its own identity.
takeaway: An ordinary installed app receives its own UID. File access rules, process isolation and additional mandatory access controls protect app-private data.
---

## The problem

In puzzle 0, two running apps couldn't touch each other's memory. But apps also keep files on the phone, like a bank app's saved login and balance. When the bank app isn't even running, what stops a game from opening its files?

## See it

```diagram sandbox
```

## The building block

Linux was built for computers shared by many people, so it keeps accounts apart. A Linux account isn't necessarily a person: it's an identity the kernel uses to decide who owns which files. Android reuses that: by default, an installed app gets its own account, with its own user ID, or **UID**. The UID stays the same for as long as the app is installed. Files the app creates belong to its UID. And for every process, the kernel keeps a record of which UID it runs as: when that process opens a file, the kernel checks the process credentials, file access rules and additional access policy. An ordinary app cannot open another app’s private files just by learning their names.

The kernel checks the UID on every file and every process. The result is the **sandbox**: walls around each app's files and memory that no app can switch off, because the kernel enforces them.

## The analogy

Every house has its own key. The kernel is the lock on every door: it opens only for the right key.

## Check yourself

- The bank app isn't running. Can the game open the bank's saved files now?::*No: the files still belong to the bank's UID, and the kernel checks it||Yes: the bank's process isn't there to guard its files >> The walls aren't guarded by the bank app; the kernel checks the key on every file, running or not. >> s3::The kernel checks the UID whether or not the owner is running.
- Who enforces the sandbox?::*The kernel||Each app, by being careful >> If apps had to behave, a hostile app wouldn't. The kernel checks every access, whatever the app does. >> s3||system_server >> The town hall manages screens. The walls around files and memory are the kernel's job. >> s4::The kernel enforces it, so no app can switch it off.
- What's the difference between a UID and a process?::*A UID lasts as long as the app is installed, while a process lasts only while it runs||They're the same: an app's UID is the number of its running process >> The UID is the key, given at install. The process is the running house, started and ended many times. >> s2::One app, one UID; its process comes and goes.

## Sources

- [Android Open Source Project: Application sandbox](https://source.android.com/docs/security/app-sandbox)
