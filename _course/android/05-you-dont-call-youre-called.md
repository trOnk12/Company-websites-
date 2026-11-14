---
title: You don't call. You're called.
short: Callbacks
summary: Put the characters you've met together, and you get the one chain behind all of Android's lifecycle code.
takeaway: system_server decides → Binder carries the message → your main thread receives it → your code runs. You write onCreate(); you never call it.
---

## The problem

You've met the five characters: your app's process (puzzle 0), the kernel (1), the main thread (2), system_server (3) and Binder (4). Now: when the town hall's message arrives, what actually runs in your app?

## See it

```diagram chain
```

## The building block

A **callback** is a method you write so that someone else can call it when the time comes. Lifecycle code is all callbacks: `onCreate()` sets up an Activity, and there's one callback for each lifecycle stage.

You write them. You never call them yourself. system_server decides, Binder delivers, and your main thread runs your callback. If you did call `onCreate()` by hand, it would only run your method: system_server's register wouldn't change, and no screen would appear.

(This picture is simplified: puzzles 13 and 14 show how the message gets from Binder to the main thread.)

## The analogy

You leave instructions on the clerk's desk ("when the town hall says open, do this"). The clerk follows them when the letter arrives. You never knock on the town hall's door asking to be opened.

## Check yourself

- Your app calls `onCreate()` on its own Activity, by hand. What have you done?::*Run your setup code, without system_server knowing: the screen still isn't created or shown||Created and shown the screen >> Only system_server moves an Activity through its lifecycle. Calling the callback yourself just runs your method. >> s2::A callback is called by the system when the time comes. Calling it yourself doesn't change what system_server decided.
- Which thread runs your `onCreate()`?::*Your app's main thread||A thread inside system_server >> system_server only sends the message. Your code runs in your process, on your main thread. >> s5||Whichever thread delivered the message >> Screen code always runs on the main thread, the clerk. >> s4::The message reaches your main thread, which runs your callback.
- Why does Android use callbacks instead of letting apps decide?::*Because system_server makes the decisions; your code only says what to do when they happen||Because callbacks run faster >> Speed isn't the point: who decides is. >> s2::The town hall decides when; your callback says what.

## Sources

- [Android Developers: The activity lifecycle](https://developer.android.com/guide/components/activities/activity-lifecycle)
- [Android Developers: Processes and threads overview](https://developer.android.com/guide/components/processes-and-threads)
