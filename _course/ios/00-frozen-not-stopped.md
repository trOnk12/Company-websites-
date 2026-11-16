---
title: Frozen, not stopped
short: App states and suspension
summary: On Android, an app in the background keeps its process, and its threads can keep running. On iOS, a few seconds after the user leaves, your app stops running any code at all. Here's what that means for your work.
takeaway: An iOS app moves through app states: not running, inactive, active, background, suspended. Seconds after it goes to the background it's suspended: still in memory, running no code. iOS can end a suspended app without running any of your code, so save your state as you enter the background, not at the end.
---

## The problem

On Android, when the user switches away, your Activity is stopped, but your process lives on: a coroutine can finish its upload, a thread can keep writing to the database. You save state in `onStop` and the process might still run for a long time. Write the same app for iOS, and the upload dies a few seconds after the user leaves. What happens to an iOS app in the background?

## See it

```diagram states
```

## The building block

**`UIKit`**, Apple's framework that runs an iOS app's screens, keeps every app in one of a few **app states**: not running, inactive (in front but not taking touches, like during a phone call banner), **active** (in front, taking touches), background, and suspended.

The big difference from Android is the last step. When the user leaves, your app goes to the background and gets a few seconds to finish crucial work: the callback that announces it (`sceneDidEnterBackground`) has five seconds to return. Shortly after, iOS **suspends** the app: its memory stays, but none of its code runs, on any thread. No coroutine, no timer, nothing.

A suspended app can be woken up again when the user comes back, and resumes as if nothing happened. Or, when memory is needed, iOS ends it, and no code of yours runs at that moment. The "about to terminate" callback isn't called for a suspended app, so it can't be your chance to save.

So the iOS rule is: save as you enter the background, and if work truly must finish, say so. For a short task, `beginBackgroundTask` asks iOS for extra time before suspension. For uploads and downloads, a background session hands the transfer to iOS itself, which carries it on in a separate process even while your app is suspended or ended.

## The analogy

On Android, the clerk from the house keeps working at a back desk after the shop closes, until the town hall decides to end it. On iOS, a few seconds after closing, the whole house is frozen in place: nobody moves until the owner returns, or until the house is quietly torn down. (Want something to continue? Hand it to the town's own courier service before you close.)

## Check yourself

- Your iOS app starts a 30-second upload in an ordinary session, and the user leaves the app after 5 seconds. You did nothing special. What happens?::*The app is suspended seconds later, and the upload stops with it||The upload finishes in the background, like a coroutine on Android >> On iOS, a suspended app runs no code at all; the upload stops with it. >> s3||The upload continues on a background thread, which isn't suspended >> Suspension stops every thread of the app, not only the main one. >> s3::Suspended means no code runs, on any thread.
- Why save state when entering the background, not when the app is about to be ended?::*Because a suspended app is ended without running any of its code||Because entering the background happens more often than ending >> Frequency isn't the point: when a suspended app is ended, no code runs at all. >> s4||Because saving while the app is ending is too slow >> It isn't slow: it never gets the chance to run. >> s4::No code runs when a suspended app is ended.
- What's the difference between background and suspended?::*In the background the app can still run briefly; suspended, it runs nothing at all||Background means another app is in front; suspended means the phone is locked >> Both happen after the user leaves; the difference is whether your code runs. >> s3::Briefly running vs not running.

## Sources

- [Apple: Managing your app's life cycle](https://developer.apple.com/documentation/uikit/managing-your-app-s-life-cycle) ("When someone dismisses your app's UI, UIKit moves the associated scene to the background state and eventually to the suspended state. UIKit can disconnect a background or suspended scene at any time to reclaim its resources")
- [Apple: Extending your app's background execution time](https://developer.apple.com/documentation/uikit/extending-your-app-s-background-execution-time) ("That method has five seconds to perform any tasks and return. Shortly after that method returns, iOS puts your app into the suspended state")
- [Apple: About the app launch sequence](https://developer.apple.com/documentation/uikit/about-the-app-launch-sequence) (iOS "suspends your process without allowing any application code to run")
