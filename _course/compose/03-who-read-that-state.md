---
title: Who read that state?
short: Snapshot state and restart groups
summary: The composition remembers every call. When a counter changes, Compose doesn't run your whole screen again; it runs only the calls that read the counter. Here's how it knows who read it, and when it runs them.
takeaway: mutableStateOf makes snapshot state; Compose watches every read and write of its value. While a composable runs, each state read is noted against the group that was running. A write that changes the value marks those groups, and at the next frame the Recomposer runs each marked restart group again, from its start. Nobody else runs. Writing the same value marks nothing, and several writes before one frame cause one run.
---

## The problem

Puzzle 1's composition holds a group for every call on the screen, often hundreds. You tap a button and `count++` runs. Running all of them again on every tap would be slow: Android's docs call running the whole UI tree again "computationally expensive, which uses computing power and battery life". So which calls need to run again, and who decides?

## See it

```diagram reads
```

## The building block

`mutableStateOf(0)` doesn't give you a plain `Int`. It gives you **snapshot state**: a value holder, `MutableState`, whose every read and every write of `.value` Compose watches. (The name comes from Compose's snapshot system, which can also show different threads a consistent picture of all state at once. This module only needs the watching.) Only these objects are watched: change a plain `var` in some class and Compose never hears about it.

Whenever a composable reads `.value` while it runs, that's a **state read**, and Compose notes which group was running at that moment. With `var count by remember { mutableStateOf(0) }`, reading `count` calls a getter that reads `.value`, so it's the same read. What counts is where the read happens, not where the number ends up on screen: puzzle 7 follows that on a real screen.

A write that changes the value marks every group that read it. Then the marked groups run again, but a group can only run again on its own if the compiler plugin made it possible. For most composable functions it does: puzzle 0's start was `startRestartGroup`, and at the end the plugin hands the runtime a small lambda that calls the function again with the same arguments. That makes the function's group a **restart group**: a group Compose can run again by itself, from its start. (Android's docs call a block that can run again this way a restart scope; in this course it's the same thing, and puzzle 8 meets the word again.) Marked `Counter` runs again; `Screen` and `Header` don't run at all. (Some composables, such as `Column`, are inline functions: their content is part of the caller's group, so a read inside `Column { }` marks the function around it.)

Who does the running? The **Recomposer**, the part of the runtime that decides when marked groups run. It doesn't run anything at the moment of the write. It waits for the next frame, then runs every marked group, so three writes before one frame cost one run, showing the latest value. And if a write puts in the same value that's already there, nothing is marked at all.

## Go deeper: Why wait for the frame?

- A drag handler writes a new position 5 times between two frames. What would running the readers at each write cost, and what does the screen show either way?::Running at each write would run the readers 5 times, but the screen only changes once per frame, so 4 of those runs would never be seen. Waiting for the frame runs them once, with the latest position.

## The analogy

The lighting cues of the play. Every scene that uses the blue light signs the blue cue's card (a state read). When the director changes the blue light, the stage manager flags exactly the scenes on that card, and redoes them before the next performance (the Recomposer at the next frame), starting each from its first line (a restart group). Changing the cue three times during one afternoon still means one redo that night. Setting it to the colour it already has flags nothing.

## Check yourself

- `Header` reads one snapshot state, title, and `Counter` reads another, count. A tap changes only title. What runs again at the next frame?::*Only Header, the one group that read title||Header and Counter, because they sit side by side in Screen >> Marks follow reads: Counter never read title, so it isn't marked. >> s3||Screen, which then runs Header and Counter again >> Screen didn't read title, so Screen isn't marked; Header restarts on its own. >> s4::A write marks only its own readers.
- Counter shows count, now 4. A Reset button's handler sets count to 4, then another tap sets it to 4 again. What runs at the next frame?::*Nothing: neither write changed the value, so nothing was marked||Counter once: two writes before one frame cost one run >> Several writes cost one run only when they change the value; these changed nothing, so nothing was marked. >> s5||Counter twice, once per write >> The Recomposer never runs per write; it waits for the frame, and here nothing was marked at all. >> s3::A write of the same value marks nothing.
- A ViewModel keeps the count in a plain `var` field instead of `mutableStateOf`. Counter shows it, and a tap adds 1. What does the screen show?::*The old number: no state read was noted, so nothing is marked||The new number at the next frame, as with snapshot state >> The Recomposer only runs groups that a watched write marked; a plain var is never watched. >> the-building-block||The new number, because Counter's restart group reruns on every frame >> A restart group can run again, but only when something marks it. >> s4::Only snapshot state is watched.

## Sources

- [Compose runtime source: SnapshotState.kt](https://github.com/androidx/androidx/blob/c13c6d0da6b9d595f72caad9fa1759c6a8aece83/compose/runtime/runtime/src/commonMain/kotlin/androidx/compose/runtime/SnapshotState.kt#L44) ("The MutableState class is a single value holder whose reads and writes are observed by Compose."; "If [value] is written to with the same value, no recompositions will be scheduled.")
- [Android Developers: Jetpack Compose phases](https://developer.android.com/develop/ui/compose/phases) ("When you read the value of a snapshot state during one of the phases listed previously, Compose automatically tracks what it was doing when it read the value."; "Under the hood of the property delegate, "getter" and "setter" functions are used to access and update the State's value."; "Each block of code that can be re-executed when a read state changes is a restart scope.")
- [Android Developers: State and Jetpack Compose](https://developer.android.com/develop/ui/compose/state) ("Mutable objects that are not observable, such as ArrayList<T> or a mutable data class, are not observable by Compose and don't trigger a recomposition when they change.")
- [Compose compiler plugin source: ComposableFunctionBodyTransformer.kt](https://github.com/JetBrains/kotlin/blob/445745fcddeb23e605547c2600a81472ef225c29/plugins/compose/compiler-hosted/src/main/java/androidx/compose/compiler/plugins/kotlin/lower/ComposableFunctionBodyTransformer.kt#L352) ("Restartable composable functions get wrapped with "restart groups"."; "we generate a lambda that teaches the runtime how to "restart" that group"; and, for lambdas: "val restartable = declaration.shouldBeRestartable() && !inlineLambdaInfo.isInlineLambda(declaration)")
- [Android Developers: Thinking in Compose](https://developer.android.com/develop/ui/compose/mental-model) ("recomposing the entire UI tree can be computationally expensive, which uses computing power and battery life.")
- [Compose runtime source: Recomposer.kt](https://github.com/androidx/androidx/blob/c13c6d0da6b9d595f72caad9fa1759c6a8aece83/compose/runtime/runtime/src/commonMain/kotlin/androidx/compose/runtime/Recomposer.kt#L186) ("The scheduler for performing recomposition and applying updates to one or more [Composition]s."; and, where it waits: "Align work with the next frame to coalesce changes.")
- [Compose foundation source: Column.kt](https://github.com/androidx/androidx/blob/c13c6d0da6b9d595f72caad9fa1759c6a8aece83/compose/foundation/foundation-layout/src/commonMain/kotlin/androidx/compose/foundation/layout/Column.kt#L82) (`public inline fun Column(`)
