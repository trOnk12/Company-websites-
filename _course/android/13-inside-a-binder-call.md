---
title: Inside a Binder call
short: Inside Binder
summary: In puzzle 4, Binder carried messages between processes. Here's how a method call actually crosses: packed into bytes, stamped, and picked up by a waiting thread.
takeaway: proxy → Parcel → Binder stamps your UID → a Binder thread → the real method, and back. Meanwhile the thread that called waits.
---

## The problem

When your app calls `startActivity()`, the method that sends an Intent, it looks like an ordinary method call. But the method that does the work lives in system_server, another process. And objects can't leave a process: they live in its memory (puzzle 0). So how does a call cross from your app to the town hall and back? The answer: each "message" from puzzle 4 is really a method call on an object in another process.

## See it

```diagram binder
```

## The building block

On your side sits a **proxy**: an object that looks exactly like the object in the other process that does the work. You never write it: Android's own code hands it to your app. Calling it packs the arguments into a **Parcel**, a flat envelope of bytes (a byte is the smallest unit of data a program stores). Binder carries the Parcel across, and stamps it with your app's UID.

Binder itself lives in the kernel. A **Binder thread** is different: an ordinary thread inside a process, one of a few that wait for Binder to hand them calls. In the receiving process, one of them unpacks the Parcel and calls the real method. Meanwhile the thread in your app that made the call waits (if that's the main thread, the screen waits too); the reply comes back the same way, and only then does the call return.

It works both ways: system_server holds proxies for your app's objects too, and its calls arrive on your app's own Binder threads.

The stamp is how permission checks from puzzle 7 work: the receiver reads it with `Binder.getCallingUid()`, and your app can't change it. Binder's code is public too, in the Linux kernel's code under `drivers/android/binder`.

## The analogy

You hand your letter to the counter in your house (the proxy). The post office carries the envelope, stamps your key (your UID) on it, and a courier at the town hall's door brings it to the right desk.

## Check yourself

- Your main thread calls a method on a proxy, and system_server takes 2 seconds to answer. What does the user see?::*A frozen screen for 2 seconds: the main thread waits for the reply||Nothing: Binder calls run in the background >> The calling thread waits until the reply comes back. If it's the main thread, nothing else on screen runs. >> s5||The call is dropped after a moment >> Binder doesn't give up: your thread waits for the reply. >> s5::A Binder call waits for its reply, so slow calls don't belong on the main thread.
- Can an app pretend to be another app in a Binder call?::*No: Binder stamps the real UID, and the app can't change it||Yes, by writing another UID into the Parcel >> The stamp isn't part of your envelope's contents: Binder adds it. >> s3::The UID comes from the kernel, not from your data.
- In system_server, which thread first picks up your call?::*One of its Binder threads||Its main thread >> Incoming calls are picked up by the couriers, Binder threads, not by the main thread. >> s4::Each process keeps a few Binder threads waiting for calls.

## Sources

- [Android reference: Binder](https://developer.android.com/reference/android/os/Binder)
- [Android reference: Parcel](https://developer.android.com/reference/android/os/Parcel)
