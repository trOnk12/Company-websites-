---
title: Who read that state?
short: Snapshot state and restart groups
summary: The composition remembers every call. When a counter changes, Compose doesn't run your whole screen again; it runs only the calls that read the counter. Here's how it knows who read it, and when it runs them.
takeaway: mutableStateOf makes snapshot state: Compose watches every read and write of its value. While a composable runs, each state read is noted against the group that was running. A write that changes the value marks those groups, and at the next frame the Recomposer runs each marked restart group again, from its start. Nobody else runs. Writing the same value marks nothing, and several writes before one frame cause one run.
---

## The problem

Puzzle 1's composition holds a group for every call on the screen, often hundreds. You tap a button and `count++` runs. Running all of them again on every tap would be slow: Android's docs call running the whole UI tree again "computationally expensive, which uses computing power and battery life". So which calls need to run again, and who decides?

## See it

```diagram reads
```

## The building block

`mutableStateOf(0)` doesn't give you a plain `Int`. It gives you **snapshot state**: a value holder, `MutableState`, whose every read and every write of `.value` Compose watches. (The name comes from Compose's snapshot system, which can also show different threads a consistent picture of all state at once. This module only needs the watching.) Only these objects are watched: change a plain `var` in some class and Compose never hears about it.

Whenever a composable reads `.value` while it runs, that's a **state read**, and Compose notes which group was running at that moment. With `var count by remember { mutableStateOf(0) }`, reading `count` calls a getter that reads `.value`, so it's the same read. What counts is where the read happens: if `Screen` reads `count` and passes the number down as `Counter(count)`, the reader is `Screen`.

A write that changes the value marks every group that read it. Then the marked groups run again, but a group can only run again on its own if the compiler plugin made it possible. For most composable functions it does: puzzle 0's start was `startRestartGroup`, and at the end the plugin hands the runtime a small lambda that calls the function again with the same arguments. That makes the function's group a **restart group**: a group Compose can run again by itself, from its start. Marked `Counter` runs again; `Screen` and `Header` don't run at all. (Some composables, such as `Column`, are inline functions: their content is part of the caller's group, so a read inside `Column { }` marks the function around it.)

Who does the running? The **Recomposer**, the part of the runtime that decides when marked groups run. It doesn't run anything at the moment of the write. It waits for the next frame, then runs every marked group, so three taps before one frame cost one run, showing the latest value. And if a write puts in the same value that's already there, nothing is marked at all.

## The analogy

The lighting cues of the play. Every scene that uses the blue light signs the blue cue's card (a state read). When the director changes the blue light, the stage manager flags exactly the scenes on that card, and redoes them before the next performance (the Recomposer at the next frame), starting each from its first line (a restart group). Changing the cue three times during one afternoon still means one redo that night. Setting it to the colour it already has flags nothing.

## Check yourself

- `Screen` reads `count` and passes it down: `Counter(count)`. A tap changes `count`. Which group runs again first?::*Screen's, because the state read happened in Screen||Counter's only, because Counter is the one that shows the number >> Compose follows reads, not what's on screen: the read happened in Screen. >> s2||Every group on the screen, starting from the root >> A write marks only the groups that read the value. >> s3::Where the read happens is what runs again.
- A click handler sets `count` to the value it already has. Why does nothing run again?::*A write marks the readers only when it changes the value||The Recomposer runs marked groups at most once a second >> It waits for the next frame, not a second, and here nothing was marked. >> s5||The click handler isn't a composable, so its writes aren't watched >> Writes are watched wherever they happen; this one just didn't change anything. >> s3::Same value, nothing marked.
- What's the difference between a state read and a restart group?::*A state read is the moment code reads a value, while a restart group is the part Compose can run again||A state read is the part Compose can run again, while a restart group is the moment code reads a value >> That's the two swapped. >> s4||They're the same: a restart group is the record a state read leaves behind >> A read is an event Compose notes; a restart group is a piece of the composition. >> s2::An event, and the part that reruns.

## Sources

- [Compose runtime source: SnapshotState.kt](https://github.com/androidx/androidx/blob/c13c6d0da6b9d595f72caad9fa1759c6a8aece83/compose/runtime/runtime/src/commonMain/kotlin/androidx/compose/runtime/SnapshotState.kt#L88) ("The MutableState class is a single value holder whose reads and writes are observed by Compose."; "When the [value] property is written to and changed, a recomposition of any subscribed [RecomposeScope]s will be scheduled. If [value] is written to with the same value, no recompositions will be scheduled.")
- [Android Developers: Jetpack Compose phases](https://developer.android.com/develop/ui/compose/phases) ("When you read the value of a snapshot state during one of the phases listed previously, Compose automatically tracks what it was doing when it read the value."; "Under the hood of the property delegate, "getter" and "setter" functions are used to access and update the State's value."; "Each block of code that can be re-executed when a read state changes is a restart scope.")
- [Android Developers: Stability in Compose](https://developer.android.com/develop/ui/compose/performance/stability) ("Compose only tracks changes to Compose State objects.")
- [Compose compiler plugin source: ComposableFunctionBodyTransformer.kt](https://github.com/JetBrains/kotlin/blob/445745fcddeb23e605547c2600a81472ef225c29/plugins/compose/compiler-hosted/src/main/java/androidx/compose/compiler/plugins/kotlin/lower/ComposableFunctionBodyTransformer.kt#L352) ("Restartable composable functions get wrapped with "restart groups"."; "we generate a lambda that teaches the runtime how to "restart" that group"; and, for lambdas: "val restartable = declaration.shouldBeRestartable() && !inlineLambdaInfo.isInlineLambda(declaration)")
- [Android Developers: Thinking in Compose](https://developer.android.com/develop/ui/compose/mental-model) ("recomposing the entire UI tree can be computationally expensive, which uses computing power and battery life.")
- [Compose runtime source: Recomposer.kt](https://github.com/androidx/androidx/blob/c13c6d0da6b9d595f72caad9fa1759c6a8aece83/compose/runtime/runtime/src/commonMain/kotlin/androidx/compose/runtime/Recomposer.kt#L186) ("The scheduler for performing recomposition and applying updates to one or more [Composition]s."; and, where it waits: "Align work with the next frame to coalesce changes.")
- [Compose foundation source: Column.kt](https://github.com/androidx/androidx/blob/c13c6d0da6b9d595f72caad9fa1759c6a8aece83/compose/foundation/foundation-layout/src/commonMain/kotlin/androidx/compose/foundation/layout/Column.kt#L82) (`public inline fun Column(`)
