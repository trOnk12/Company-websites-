---
title: Inside a Binder call
short: Inside Binder
summary: In puzzle 5, Binder carried messages between processes. Here's how a method call actually crosses: packed into bytes (raw data), marked with the sender's identity, and picked up by a waiting thread.
takeaway: proxy → Parcel → Binder stamps your UID → a Binder thread → the real method, and back. Meanwhile the thread that called waits.
---

## The problem

When your app calls `startActivity()`, the method that sends an Intent, it looks like an ordinary method call. But the object that does the work lives in system_server's memory, another process. And an object is data in a process's memory, so it can't leave that process. So how does a call cross from your app to the town hall and back? The answer: each "message" from puzzle 5 is really a method call on an object in another process. Your app has such objects too, which system_server calls: that's how the "resume" message from puzzle 5 arrives.

## See it

```diagram binder
```

## The building block

On your side sits a **proxy**: an object that looks exactly like the object in the other process that does the work. You never write it: Android's own code hands it to your app. Calling it packs the arguments into a **Parcel**, a flat envelope of bytes. Binder carries the Parcel across, and stamps it with your app's UID.

Binder itself lives in the kernel. A **Binder thread** is different: an ordinary thread inside a process, one of a few that wait for Binder to hand them calls. In the receiving process, one of them unpacks the Parcel and calls the real method. Meanwhile the thread in your app that made the call waits (if that's the main thread, the screen waits too); the reply comes back the same way, and only then does the call return.

It works both ways: system_server holds proxies for your app's objects too, and its calls arrive on your app's own Binder threads.

The stamp is how permission checks from puzzle 8 work, and your app can't change it. (For the curious: the receiver reads it with `Binder.getCallingUid()`; Binder's own code is in the Linux kernel, under `drivers/android/binder`.)

## The analogy

You hand your letter to the counter in your house (the proxy). The post office carries the envelope, stamps your key (your UID) on it, and a courier at the town hall's door brings it to the right desk.

## Check yourself

- Your main thread calls a method on a proxy, and system_server takes 2 seconds to answer. What does the user see?::*A frozen screen for 2 seconds||Nothing: Binder calls run in the background, on a Binder thread >> The calling thread waits until the reply comes back. If it's the main thread, nothing else on screen runs. >> s5||The call gives up after a moment and returns an empty result >> Binder doesn't give up: your thread waits for the reply. >> s5::A Binder call waits for its reply, so slow calls don't belong on the main thread.
- Can an app pretend to be another app in a Binder call?::*No: Binder stamps the real UID, and the app can't change it||Yes, by writing another UID into the Parcel >> The stamp isn't part of your envelope's contents: Binder adds it. >> s3::The UID comes from the kernel, not from your data.
- In system_server, which thread first picks up your call?::*One of its Binder threads||Its main thread >> Incoming calls are picked up by the couriers, Binder threads, not by the main thread. >> s4::Each process keeps a few Binder threads waiting for calls.

## Sources

- [Android reference: Binder](https://developer.android.com/reference/android/os/Binder)
- [Android reference: Parcel](https://developer.android.com/reference/android/os/Parcel)
