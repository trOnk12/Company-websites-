---
title: Binder is the post office between processes
short: Binder
summary: Processes can't touch each other's memory, so every call between them is packed into bytes and carried by the kernel's Binder driver, stamped with the caller's identity.
takeaway: proxy → Parcel → kernel (Binder) → Binder thread → stub → real method, and back. Every Intent, every startActivity(), every system service call travels this way, with a buffer of about 1 MB.
---

## The problem

Your app (one process) needs system_server (another process) to start a screen. But processes can't touch each other's memory: that was the whole point of the sandbox. So how does a method call get from one to the other?

## See it

```diagram binder
```

## The building block

**Binder** is a driver inside the Linux kernel. The kernel is the only code allowed to touch every process's memory, so it can carry messages across. Your side holds a **proxy**; the other side has a **stub** that calls the real object. Arguments travel as a **Parcel**.

Two facts that come up all the time:

- **Who's calling**: Binder stamps every call with the caller's UID and PID, which is how the receiver checks permissions.
- **Size limit**: the transaction buffer is about 1 MB per process, shared by all transactions in progress.

## The analogy

A TV remote. You press a button on the remote (the proxy); the TV (the real object) is in another room. The post office (Binder) carries the envelope, and stamps the sender's address on it.

## Check yourself

- You put a 3 MB bitmap into an Intent extra and start an Activity. What happens?::The Intent travels over Binder, so it exceeds the ~1 MB buffer and fails with `TransactionTooLargeException`. Pass a file URI or an ID instead.
- Can an app lie to a system service about who it is?::No. The kernel stamps the real caller UID on every Binder call.
- On which thread does a Binder call arrive in the receiving process?::On one of its Binder threads, not its main thread.

## Sources

- [Android reference: TransactionTooLargeException](https://developer.android.com/reference/android/os/TransactionTooLargeException)
- [Android reference: Binder](https://developer.android.com/reference/android/os/Binder)
- [Android reference: Parcel](https://developer.android.com/reference/android/os/Parcel)
