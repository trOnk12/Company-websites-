---
title: The ViewModel outlives the screen
short: ViewModel and its store
summary: In puzzle 17, turning the phone threw away the Activity and everything in its fields. Here's the object made to survive that, and where it waits while the new Activity is built.
takeaway: A ViewModel lives in its Activity's ViewModelStore. On a configuration change, ActivityThread keeps the store and hands it to the new Activity, all inside your process. When the screen closes for good, the store is cleared and onCleared() runs.
---

## The problem

In puzzle 17, a configuration change replaced your Activity with a new one, and the counter in its fields went back to 0. Now imagine the field held a list that took two seconds to download. Every time the user turns the phone, it's gone, and you download it again. The process survived: is there somewhere in it that outlives one Activity object?

## See it

```diagram viewmodel
```

## The building block

A **ViewModel** is an object made to hold one screen's data. You write it as a class built on `ViewModel`, and it can do the slow work itself, like the download:

```kotlin
class ListViewModel : ViewModel() {
    val items = startDownload()   // starts once, when the ViewModel is created, on another thread (puzzle 15)
}

// in the Activity:
val vm: ListViewModel by viewModels()
```

The word by in that last line hands the job of finding the ViewModel to `viewModels()`, which doesn't create a new one each time. Each Activity keeps its ViewModels in a **ViewModelStore**: a small map from a name to a ViewModel. `viewModels()` looks in the store first and creates the ViewModel only if it isn't there yet.

The trick is what happens to the store. When the Activity is destroyed only to be recreated, `ActivityThread` (puzzle 14), Android's code in your process that carries out system_server's orders, like "destroy" and "create", keeps the store and hands it to the new Activity. Same store, same ViewModel, same count. Nothing crosses Binder: it all stays in your process's memory.

When the Activity is destroyed for good, for example the user pressed the Back button to leave the screen, no new Activity is coming. Then the store is cleared, and each ViewModel's `onCleared()` runs: your chance to stop work it started, like an unfinished download. The code that ships with `ViewModel` decides between the two with one check: at destroy, clear the store only if `isChangingConfigurations` is false (it's true when this destroy is only to recreate the Activity).

So a ViewModel lives as long as the user keeps that screen: the screen they see stays the same, while the Activity objects behind it are replaced. But it still lives in your process. If the process itself is gone, so is the ViewModel. What survives that is puzzle 19.

## The analogy

Before the room is torn down to be rebuilt, the clerk carries its locker out and sets it in the new room. If the room is closed for good, the locker is emptied instead.

## Check yourself

- A ViewModel downloads a list when it's created, like the one above. The user turns the phone twice. How many times is the list downloaded?::*Once: the same ViewModel is handed to each new Activity||Three times, once per Activity >> The Activities are new, but the ViewModel waits in the store and is handed over. >> s3||Twice, once after each turn, because turning clears the store >> The store is cleared only when the screen closes for good, not on a configuration change. >> s4::The store survives configuration changes, so the ViewModel and its list do too.
- Why is the store cleared when the user presses Back, but not when they turn the phone?::*Because after a turn a new Activity will take the store, while after Back none will||Because Back ends the whole process, store and all >> The process can live on. Only that screen is finished. >> s4||Because a turn is too quick for the store to be cleared in time >> Speed has nothing to do with it: the code checks whether the Activity is being destroyed only to be recreated. >> the-building-block::Clear the store unless a new Activity will take it.
- What's the difference between a ViewModel and the ViewModelStore?::*A ViewModel holds a screen's data; the store is the map that keeps them||A ViewModel lives in the Activity; the store lives in system_server >> Both stay in your process; the store is the map the ViewModels live in. >> s1||The store is a ViewModel that holds the other ViewModels' data >> The store holds the ViewModels themselves, as a map; it isn't a ViewModel. >> s1::One map, many ViewModels, all in your process.

## Sources

- [AndroidX source: ComponentActivity](https://github.com/androidx/androidx/blob/androidx-main/activity/activity/src/main/java/androidx/activity/ComponentActivity.kt) (on `ON_DESTROY`: `if (!isChangingConfigurations) { viewModelStore.clear() }`; the new Activity takes the store from `lastNonConfigurationInstance`)
- [AndroidX source: ViewModelStore](https://github.com/androidx/androidx/blob/androidx-main/lifecycle/lifecycle-viewmodel/src/commonMain/kotlin/androidx/lifecycle/ViewModelStore.kt) (a `mutableMapOf<Any?, ViewModel>()`)
- [AOSP: ActivityThread.java](https://github.com/aosp-mirror/platform_frameworks_base/blob/1cdfff555f4a21f71ccc978290e2e212e2f8b168/core/java/android/app/ActivityThread.java#L6120) (`r.lastNonConfigurationInstances = r.activity.retainNonConfigurationInstances()`, then passed to `activity.attach(…)`)
- [Android Developers: ViewModel overview](https://developer.android.com/topic/libraries/architecture/viewmodel)
