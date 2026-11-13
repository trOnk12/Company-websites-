---
title: An app is a Linux process with its own user
short: Apps are houses
summary: Each app gets its own Linux user ID and its own process. The kernel keeps them apart, so one app can't open another's files or read its memory.
takeaway: Your app is a house with its own key (a UID) and its own walls (a process). The kernel checks the key on every file. To get anything from another app, you send a letter through the town hall.
---

## The problem

In puzzle 0, your app was a house. But a phone has dozens of houses from different companies, and a banking app must be safe from a game that wants to read its files or its memory. How do you keep them apart without trusting either of them?

## See it

```diagram sandbox
```

## The building block

Android is built on Linux, and Linux already knows how to keep *users* apart. So Android turns each app into its own user: at install time the app gets a unique user ID (UID), and it runs in its own process.

- Files the app creates belong to its UID; other apps can't open them.
- A process can't read another process's memory.
- The kernel enforces both, so a buggy or hostile app can't switch them off.

You'll see the same UID written two ways: `10101` is the number, `u0_a101` is its name in tools like `ps`. The kernel guards files and memory; in puzzle 5 you'll see how system_server guards everything else, using the same UID.

## The analogy

Every app is a house with its own key. The kernel is the lock on every door: it only opens for the right key. Neighbours who want something send a letter through the town hall.

## Check yourself

- A game wants to read the bank app's database file directly. Does it work?::*No: the file belongs to another UID, and the kernel refuses||Yes, if the game asks for storage permission >> Permissions don't let one app into another app's private files. The key (UID) has to match the door, and it never does. >> s2||Yes, because both apps run on the same phone >> Same phone, different users. Linux keeps users apart even on one machine. >> s1::Each app is a separate Linux user, and the kernel checks the UID on every file. Apps share only through official doors like Intents.
- Who enforces the sandbox?::*The Linux kernel||Each app, by being careful >> If apps had to behave, a hostile app simply wouldn't. The walls hold because the kernel checks every access, whatever the app does. >> s2||system_server, the town hall >> The town hall carries letters between apps (step 4), but the walls around files and memory are the kernel's job. >> s4::The kernel enforces it, which is why a buggy or hostile app can't switch it off.
- How should a game get data from the bank app?::*Ask through an official door, like an Intent the system delivers||Read the bank's memory while both are running >> Running at the same time doesn't open the walls: each app's memory belongs to its own process. >> s2::Apps never reach into each other. They send letters, and the system decides whether to deliver them.

## Sources

- [Android Open Source Project: Application sandbox](https://source.android.com/docs/security/app-sandbox)
- [Android Developers: Processes and threads overview](https://developer.android.com/guide/components/processes-and-threads)
