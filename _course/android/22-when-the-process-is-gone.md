---
title: When the process is gone
short: Process death and saved state
summary: In puzzle 21, the ViewModel survived turning the phone, but it still lives in your process. Here's what's left when the process itself is ended, and where it waits.
takeaway: Before your Activity is stopped, your app sends a small Bundle, its saved state, to system_server by Binder. If the process is ended in the background, a new process gets it back. Back throws it away. Keep it small: it crosses the ~1 MB Binder buffer.
---

## The problem

In puzzle 21, the ViewModel survived turning the phone, because it waited in your process. In puzzle 14, you saw that when memory runs short, Android ends the processes of apps in the background. The user typed half a message, switched to another app for a minute, and came back. The process is gone, and with it every object it held, ViewModels included. Is the message lost?

## See it

```diagram saved
```

## The building block

When Android ends your process in the background to free memory, that's **process death**. Nothing inside the process survives it.

So, before it can happen, your app sends a little of its state somewhere that outlives the process: system_server. Each time your Activity is stopped (the user left it), your app packs what it chose to save into a **`Bundle`**, a small map of simple values like text and numbers, and Binder carries it to system_server. That copy is the screen's **saved state**. When the user comes back to a process that's gone, a new process starts (a cold start, puzzle 14), and system_server hands the Bundle back to the new Activity.

Saved state crosses Binder twice, through the receiver's buffer of about 1 MB (puzzle 19), and it's kept in system_server's memory. So keep it small: what the user typed, an ID, a scroll position. Big data, like the downloaded list, goes in a file on the phone and is read again by its ID.

An Activity fills its Bundle itself, in `onSaveInstanceState()`. A ViewModel can use saved state too, through a **`SavedStateHandle`**: a map that's kept in the saved state. `viewModels()` hands one to the ViewModel when it creates it.

```kotlin
class DraftViewModel(private val saved: SavedStateHandle) : ViewModel() {
    var draft: String
        get() = saved["draft"] ?: ""
        set(value) { saved["draft"] = value }
}
```

Saved state survives turning the phone too: the old Activity is stopped before it's destroyed, so its Bundle is saved and handed to the new Activity.

Saved state is for coming back. If the user closes the screen for good with Back, there's nothing to come back to, so system_server throws it away. (On an app's first screen, Android 12 and later only move the app to the background on Back, so there the state stays.)

| Kept in | Survives turning the phone | Survives process death | Survives Back |
|---|---|---|---|
| a field of the Activity | no | no | no |
| a ViewModel | yes | no | no |
| saved state | yes | yes | no |
| a file on the phone | yes | yes | yes |

## The analogy

Before the house can be torn down, the clerk mails the town hall a postcard with the few things that matter. If the house is rebuilt, the town hall mails the postcard to the new clerk. If the owner moves out for good, the town hall bins it.

## Check yourself

- The user typed a long message, kept only in a ViewModel. They switch apps, and Android ends your process to free memory. They come back. What do they see?::*An empty message: the ViewModel ended with the process||The message: a ViewModel survives everything >> A ViewModel lives in your process; when the process is gone, so is it. >> s2||The message, because system_server keeps every ViewModel >> system_server keeps only the small Bundle your app sent, never your objects. >> s1::Only what was in the saved state (or in a file) comes back.
- Why must saved state be small?::*Because it crosses Binder's ~1 MB buffer and waits in system_server's memory||Because system_server writes it to a file, and files are slow >> It waits in system_server's memory and crosses Binder; the Binder buffer is the limit. >> the-building-block||Because each Bundle can hold only one value >> A Bundle is a map and can hold many values; it's the shared ~1 MB buffer that limits it. >> the-building-block::It crosses Binder, so it has to fit the shared ~1 MB buffer.
- A ViewModel and saved state: which survives what?::*A ViewModel survives turning the phone, while saved state survives that and process death too||Both survive process death, because both are saved by Android >> The ViewModel is an object in your process, so it ends with the process. >> s2||Saved state also survives Back, so a closed screen comes back as it was >> After Back there's nothing to come back to, so system_server throws it away. >> s4::Different lifetimes: pick the place by what the data must survive.

## Sources

- [Android Developers: Save UI states](https://developer.android.com/topic/libraries/architecture/saving-states) (the table: saved state survives "system-initiated process death", not "user complete screen dismissal/finish()"; "only for primitive types and simple, small objects")
- [AOSP: PendingTransactionActions.java](https://github.com/aosp-mirror/platform_frameworks_base/blob/1cdfff555f4a21f71ccc978290e2e212e2f8b168/core/java/android/app/servertransaction/PendingTransactionActions.java#L135) (when the Activity stops: `ActivityClient.getInstance().activityStopped(mActivity.token, mState, …)`, with a `TransactionTooLargeException` check right after)
- [Android reference: SavedStateHandle](https://developer.android.com/reference/androidx/lifecycle/SavedStateHandle)
- [Android 12 behavior changes: root launcher activities are no longer finished on Back press](https://developer.android.com/about/versions/12/behavior-changes-all) ("In Android 12, the system now moves the activity and its task to the background instead of finishing the activity.")
