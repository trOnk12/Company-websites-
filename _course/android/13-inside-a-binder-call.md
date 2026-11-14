---
title: Inside a Binder call
short: Inside Binder
summary: In puzzle 4, Binder carried messages between processes. Here's how a method call actually crosses: packed into bytes, stamped, and picked up by a waiting thread.
takeaway: proxy → Parcel → Binder stamps your UID → a Binder thread → the real method, and back. The receiver's Binder buffer is about 1 MB, shared by every call in progress.
---

## The problem

When your app calls `startActivity()`, the method that sends an Intent, it looks like an ordinary method call. But the method that does the work lives in system_server, another process. And objects can't leave a process: they live in its memory (puzzle 0). So how does a call cross from your app to the town hall and back?

## See it

```diagram binder
```

## The building block

On your side sits a **proxy**: an object that looks exactly like the object in the other process that does the work. Calling it packs the arguments into a **Parcel**, a flat envelope of bytes. Binder carries the Parcel across, and stamps it with your app's UID. In the receiving process, a **Binder thread**, one of a few threads waiting for incoming calls, unpacks it and calls the real method. Meanwhile the thread in your app that made the call waits (if that's the main thread, the screen waits too); the reply comes back the same way, and only then does the call return.

`startActivity()` sends your Intent to system_server, so it lands there. Incoming calls land in the receiver's **Binder buffer**: a fixed-size area of the receiver's memory, set up by the kernel, where incoming calls wait to be picked up. It's about 1 MB, shared by every call in progress. A call that doesn't fit fails with `TransactionTooLargeException`.

The stamp is how permission checks from puzzle 7 work: the receiver reads it with `Binder.getCallingUid()`, and your app can't change it. Binder's code is public too, in the Linux kernel's source under `drivers/android/binder`.

## The analogy

You hand your letter to the counter in your house (the proxy). The post office carries the envelope, stamps your address on it, and a courier at the town hall's door brings it to the right desk.

## Check yourself

- You put a 3 MB photo into an Intent and start an Activity. What happens?::*It fails with `TransactionTooLargeException`||It works: the Intent object is handed over as it is >> Objects can't leave a process: the Intent is packed into a Parcel and must fit the receiver's Binder buffer. >> s6||It works, just more slowly >> The buffer has a fixed size of about 1 MB. A Parcel that doesn't fit fails. >> s6::Every Intent crosses Binder, through a buffer of about 1 MB. Send a small ID, not the photo.
- Can an app pretend to be another app in a Binder call?::*No: Binder stamps the real UID, and the app can't change it||Yes, by writing another UID into the Parcel >> The stamp isn't part of your envelope's contents: Binder adds it. >> s3::The UID comes from the kernel, not from your data.
- In system_server, which thread first picks up your call?::*One of its Binder threads||Its main thread >> Incoming calls are picked up by the couriers, Binder threads, not by the main thread. >> s4::Each process keeps a few Binder threads waiting for calls.

## Sources

- [Android reference: TransactionTooLargeException](https://developer.android.com/reference/android/os/TransactionTooLargeException)
- [Android reference: Binder](https://developer.android.com/reference/android/os/Binder)
- [Android reference: Parcel](https://developer.android.com/reference/android/os/Parcel)
