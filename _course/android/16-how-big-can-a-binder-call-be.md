---
title: How big can a Binder call be?
short: Binder's size limit
summary: In puzzle 13, a call crossed Binder as bytes packed in a Parcel. The receiving process has only so much room for them.
takeaway: Calls into a process wait in its Binder buffer: about 1 MB, shared by every call in progress. A call that doesn't fit fails with TransactionTooLargeException. Send where the data is, not the data.
---

## The problem

In puzzle 13, your call crossed into system_server packed into a Parcel. An Intent can carry data along with it, like a photo. But the Parcel has to wait somewhere in system_server until one of its Binder threads is free. How much room is there?

## See it

```diagram buffer
```

## The building block

Calls into a process wait in its **Binder buffer**: an area of that process's memory, set up by the kernel when the process first uses Binder. Its size is fixed then, so it can't grow later: about 1 MB.

That 1 MB is shared by every call in progress into that process, from every app. So a call can fail even when it's well under 1 MB, if many other calls are waiting at the same moment.

A call that doesn't fit fails with `TransactionTooLargeException` (a transaction is one Binder call). The fix is never a bigger Parcel: save the data somewhere both sides can reach, like a file, and send its name, or a number that identifies it. Inside your own app this just works: all its screens run as the same UID, so the sandbox lets every one of them read the file. (Sharing with another app needs system_server's help: a later puzzle.)

Splitting the data into many smaller calls doesn't help either: they all go through the same shared 1 MB, and the receiver would have to glue the pieces back together.

## The analogy

The town hall's mailbox has one fixed size, shared by everyone's letters. A parcel that doesn't fit the slot comes back. So you leave the parcel at home and send a note that says where it is.

## Check yourself

- You put a 3 MB photo into an Intent and start an Activity. What happens?::*It fails with `TransactionTooLargeException`||It works: the Intent object is handed over as it is >> Objects can't leave a process: the Intent is packed into a Parcel and must fit the receiver's Binder buffer. >> s3||It works, just more slowly >> The buffer has a fixed size of about 1 MB. A Parcel that doesn't fit fails; it doesn't wait. >> s3::Every Intent crosses Binder, through a buffer of about 1 MB.
- Your app's call into system_server carries 400,000 bytes (0.4 MB). It works most of the time but fails now and then. Why?::*The 1 MB is shared by every call in progress, so when others are waiting there's less room||0.4 MB is over the limit >> The limit is about 1 MB, more than 0.4 MB. It's the sharing that hurts. >> s2||The kernel shrinks the buffer when the phone is busy >> The buffer's size is fixed when the process first uses Binder; it never changes. >> the-building-block::A shared, fixed-size buffer: other calls take room too.
- How do you show a big photo on another screen of your own app?::*Save it to a file and send the file's name or an ID||Pack it into a bigger Parcel >> The Parcel isn't the limit; the receiver's buffer is, and it's fixed. >> s4||Send it in many small Intents, one after another >> They all cross the same shared 1 MB, and the receiver has to glue them back together. Send where the photo is, not the photo. >> the-building-block::Send a small reference; let the other side read the data itself.

## Sources

- [Android reference: TransactionTooLargeException](https://developer.android.com/reference/android/os/TransactionTooLargeException) ("The Binder transaction buffer has a limited fixed size, currently 1MB, which is shared by all transactions in progress for the process.")
- [Android reference: Parcel](https://developer.android.com/reference/android/os/Parcel)
