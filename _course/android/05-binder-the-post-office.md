---
title: Binder is the post office between processes
short: Binder
summary: Processes can't touch each other's memory, so every call between them is packed into bytes and carried by the kernel's Binder driver, stamped with the caller's identity.
takeaway: proxy → Parcel → Binder (kernel) stamps your UID → a Binder thread → the real method, and back. Every Intent and every system call travels this way, through a mailbox of about 1 MB.
---

## The problem

In puzzle 4, your "start B" letter went to the town hall. But in puzzle 1 we saw that one process can't touch another's memory. So how does a method call get from your house into the town hall at all?

## See it

```diagram binder
```

## The building block

**Binder** is a driver in the Linux kernel (`drivers/android/binder`), and the kernel is the only code allowed into every process. On your side, a **proxy** looks like the service you're calling. It packs the arguments into a `Parcel`. On the other side, a Binder thread unpacks it and calls the real method.

Two facts that come up all the time:

- **Who's calling.** Binder stamps every call with the caller's UID, and its PID (process number). The receiver reads it with `Binder.getCallingUid()`. That's how system_server checks permissions: the kernel guards files and memory (puzzle 1), and system_server guards everything else using this stamp.
- **Size.** Each process's buffer for incoming calls is about 1 MB, shared by every call in flight.

## The analogy

The post office. You hand your letter to the counter in your house (the proxy). The post office carries it, stamps your address on it, and a courier at the town hall's door (a Binder thread) brings it to the right desk.

## Check yourself

- You put a 3 MB bitmap into an Intent extra and start an Activity. What happens?::*It fails with `TransactionTooLargeException`||It works: an Intent is just an object passed to the other app >> An Intent can't travel as an object: it's packed into a Parcel and carried by Binder, through a mailbox of about 1 MB. >> s6||It works, but slowly >> Size isn't about speed here: the mailbox has a fixed size, and a parcel that doesn't fit fails. >> s6::The Intent travels over Binder, whose buffer is about 1 MB per process, shared by all calls in flight. Pass a file URI or an ID instead.
- Can an app lie to a system service about who it is?::*No: the kernel stamps the real UID on every call||Yes, by writing a different UID into the Parcel >> The stamp isn't part of your letter's contents: the post office adds it, and you can't change it. >> s3::The UID comes from the kernel, not from the data, so the receiver can trust it for permission checks.
- In the town hall, which worker picks up an incoming Binder call?::*One of its Binder threads||Its main thread, directly >> Binder calls arrive on the couriers (Binder threads). In puzzle 0's simplified picture the letter seemed to go straight to the clerk; this is the real hand-off. >> s4::Each process keeps a few Binder threads waiting for incoming calls.

## Sources

- [Android reference: TransactionTooLargeException](https://developer.android.com/reference/android/os/TransactionTooLargeException)
- [Android reference: Binder](https://developer.android.com/reference/android/os/Binder)
- [Android reference: Parcel](https://developer.android.com/reference/android/os/Parcel)
