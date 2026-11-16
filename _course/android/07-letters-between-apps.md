---
title: Letters between apps
short: Intents and permissions
summary: Apps can't reach into each other, but they can ask the town hall to deliver a request. For some requests, the town hall first checks whether the app is allowed.
takeaway: An Intent is a letter to the town hall: "open this screen". system_server checks the sender's permissions, then delivers it, or doesn't.
---

## The problem

In puzzle 6, the sandbox kept every app inside its walls. But a link in a chat opens the browser, and a chat app can start a phone call. If apps can't reach each other, how do they work together?

## See it

```diagram intents
```

## The building block

An app sends an **Intent**: a message to system_server asking it to open a screen, in another app or in your own. It travels by Binder, like every message to the town hall.

Opening another app's screen often needs nothing special: a link in a chat opens the browser for anyone. But some actions need a **permission**: a right the app has to be granted. Placing a call straight away needs the phone-call permission, because calls can cost money. Some permissions are granted at install; risky ones, like this one, the user grants by tapping Allow in a prompt. system_server checks them before it acts. It knows which app sent the Intent from the app's UID, which Binder tells it (puzzle 13 shows how).

## The analogy

You can't walk into the neighbour's house, but you can send the town hall a letter: "please put a call through for me". The town hall checks its list of who's allowed what, then passes it on, or sends it back.

## Check yourself

- A game sends an Intent asking to start a phone call, but the user never granted it the phone-call permission. What happens?::*system_server refuses the request||The call starts anyway, because Intents always get delivered >> Delivery isn't automatic: the town hall checks permissions first. >> s3||The kernel blocks the Intent at the game's door >> The kernel guards files and memory. Permissions for actions are checked by system_server. >> s3::system_server checks the sender's permissions before acting.
- Why does an Intent go to system_server instead of straight to the other app?::*Apps can't reach each other, so the town hall delivers and checks permissions||Because Intents are too big for one app to send straight to another >> Size has nothing to do with it: the sandbox means only the town hall can deliver. >> s2::Only the town hall can deliver between sandboxes, and it checks the sender on the way.
- What's the difference between the sandbox and a permission?::*The sandbox closes each app off; a permission allows one specific action||They're the same protection, checked by system_server for every app >> The sandbox is walls the kernel enforces for every app; permissions are rights system_server grants per action. >> s1::Walls by the kernel; rights by the town hall.

## Sources

- [Android Developers: Intents and intent filters](https://developer.android.com/guide/components/intents-filters)
- [Android Developers: Permissions on Android](https://developer.android.com/guide/topics/permissions/overview)
- [Android reference: Intent.ACTION_CALL](https://developer.android.com/reference/android/content/Intent#ACTION_CALL) and [Manifest.permission.CALL_PHONE](https://developer.android.com/reference/android/Manifest.permission#CALL_PHONE)
- [Android reference: Binder](https://developer.android.com/reference/android/os/Binder)
