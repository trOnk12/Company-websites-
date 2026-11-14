---
title: The post office carries letters
short: Binder
summary: system_server and your app are separate processes, so the town hall can't just reach in. The kernel carries its messages.
takeaway: Between processes, nothing is reached directly. Binder, a driver in the kernel, carries the message, like a post office.
---

## The problem

In puzzle 3, system_server decided to move your Activity to "resumed". But system_server is a process, and so is your app, and in puzzle 0 you saw that one process can't touch another's memory. So how does the town hall's decision get into your app?

## See it

```diagram post-office
```

## The building block

Only the kernel can reach into every process (puzzle 1). So the kernel carries the message.

The kernel is made of parts that each do one job; such a part is called a **driver**. The driver that carries messages between processes is called **Binder**. Every message between your app and system_server travels through Binder, in both directions.

## The analogy

The post office. The town hall writes a letter; it can't walk into your house, but the post office can deliver to every house on the street.

## Check yourself

- system_server wants your Activity to pause. Can it change your app's memory directly?::*No: it sends a message, and Binder carries it into your app||Yes: system_server is part of Android, so it can >> Being Android's own process doesn't give it access to yours. Only the kernel reaches into every process. >> s2::Separate processes never touch each other's memory; Binder carries the message.
- Why does the message go through the kernel?::*Only the kernel can reach into every process||Because the kernel decides when screens pause >> The kernel only carries the letter. The decision was the town hall's. >> s3::The kernel is the only code that can reach any process, so it does the carrying.
- What's the difference between Binder and system_server?::*Binder carries messages; system_server decides what they say||Binder is another name for system_server >> Binder is a part of the kernel, the post office. system_server is a process, the town hall. >> s1::The post office delivers; the town hall decides.

## Sources

- [Android Developers: Platform architecture](https://developer.android.com/guide/platform)
- [Android reference: Binder](https://developer.android.com/reference/android/os/Binder)
