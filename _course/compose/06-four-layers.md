---
title: Four layers, one edge per platform
short: Runtime, UI, foundation, Material
summary: Puzzles 0 to 5 followed one screen from a composable to pixels. Those steps live in different libraries, stacked on top of each other. Here's the stack, the one plug that keeps the runtime away from pixels, and and where the code written for iOS really sits.
takeaway: Compose is four layers. The runtime keeps the composition and changes a tree of nodes only through an Applier. Compose UI plugs in an Applier for LayoutNodes and does layout, drawing and input. foundation builds layout and gesture blocks with no look of their own; Material adds a design system. Each layer uses only the ones below it. The biggest iOS edge is Compose UI's iosMain, but every layer has some platform code, and much of the non-Android code, the iOS Applier included, sits in skikoMain, shared by iOS, desktop and web.
---

## The problem

The KMP course (puzzle 14) said Compose Multiplatform shares the Compose runtime with Jetpack Compose, and writes a thin platform layer for each target. Since then you've seen the runtime build a composition (puzzles 0 to 4) and a frame turn nodes into pixels (puzzle 5). If the runtime holds LayoutNodes in its slot table, how can it know "nothing about pixels"? And where exactly is the line between what's shared and what's written for iOS?

## See it

```diagram stack
```

## The building block

Android's docs describe Compose as layers in which "each layer is built upon the lower levels". From the bottom:

**The runtime** holds the composition, the slot table, snapshot state and the Recomposer: everything from puzzles 0 to 4. When a call leaves a node, the runtime stores it, but never looks inside it. To change the tree of nodes, it goes through an **Applier**: a small object with operations such as insert a node at an index, remove some, move some. The runtime's code says that to build "a tree of a novel type" you write your own Applier. So the runtime works with any tree: LayoutNodes, or something else entirely.

**Compose UI** is the layer that plugs in an Applier for LayoutNodes (on Android, a class called `UiApplier`) and does everything from puzzle 5: `Modifier`, layout, drawing onto a canvas, and input such as touches.

**foundation** builds on Compose UI. `Row`, `Column`, `LazyColumn` and gestures such as scrolling live here: building blocks with no look of their own.

**Material** sits on top. It's a **design system**: a set of rules and ready-made components for how an app looks, with colours, type and shapes. `Button` and `MaterialTheme` come from it. You can skip it and build your own design system on foundation; the higher layers are optional.

Each layer only calls the ones below it. That's what made Compose Multiplatform possible: the platform code could be kept at the edges where Compose meets the phone. But it isn't all in one layer. Each of these libraries is a KMP project, so its code sits in source sets (the KMP course, puzzle 1): `commonMain` for every target, `androidMain` for Android only, `iosMain` for iOS only. Between them sits `skikoMain`, an intermediate source set (the KMP course, puzzle 17) shared by every target that draws with Skia through Skiko, the Kotlin library that wraps Skia: iOS, desktop and the web. Counting the Kotlin files in JetBrains' copy of these libraries, at one commit:

| Layer | Written for iOS (or all Apple, or all native) targets | In `skikoMain`, shared by iOS, desktop and web |
|---|---|---|
| runtime | 8 files in `nativeMain`, for every Kotlin/Native target: the frame clock, threads, locking | none |
| Compose UI | 137 files in `iosMain`: the hosting view controller, the Metal view it draws into, the frame timer, the keyboard, accessibility | 88 files, among them the Applier |
| foundation | 32 files in `iosMain`: text fields, selection, the magnifier, the text context menu, iOS scroll physics | 126 files |
| material3 | 2 files in `darwinMain`, for all Apple targets: calendar and date formats | 97 files |

So Compose UI holds the biggest iOS edge, but every layer has a little platform code, and much of what's "not Android" is shared by iOS, desktop and web rather than written for iOS alone. Even the Applier differs. On Android, Compose UI plugs in `UiApplier` from `androidMain`; on iOS it's `DefaultUiApplier` from `skikoMain`. Both do the same job: when the runtime asks to insert a LayoutNode at an index, `DefaultUiApplier` adds it to the current parent node at that index. That edge is the KMP course's platform layer. On Android your build uses Google's libraries, and on iOS JetBrains' builds of the same ones.

## Go deeper: Could Compose drive something that isn't a screen?

- Someone writes an Applier for a tree of terminal text lines instead of LayoutNodes. Which layers can they reuse?::Only the runtime: composables, remember, snapshot state, recomposition and skipping all work, because the runtime touches the tree only through the Applier. Compose UI, foundation and Material are built for LayoutNodes, so they don't apply.

## The analogy

The play, staged in two theatres (the KMP course, puzzle 14). The prompt book and its rules (the runtime) work with any stage; the stage manager changes the set only through the stage crew (the Applier). The crew of each theatre (Compose UI's edge) knows its own trapdoors and lights. The choreography (foundation) and the costumes (Material) travel with the company, with a step or two adjusted to each stage.

## Check yourself

- Your shared code calls `Button` inside a `Column`, and you build it for iOS. Which layer on that path has the most code written only for iOS?::*Compose UI, with the hosting view controller, the keyboard and touches||material3, where Button is redrawn to look like an iOS button >> material3's only Apple-specific files are about dates; Button is shared code. >> the-building-block||The runtime, which needs its own way to store the composition on iOS >> The slot table is shared; the runtime's few native files are about threads and the frame clock. >> the-building-block::Compose UI holds the biggest iOS edge.
- On iOS, the runtime inserts the LayoutNode a `Text` call left. Which code adds it to its parent?::*DefaultUiApplier, from skikoMain, the same class desktop uses||UiApplier, the same class as on Android >> UiApplier lives in androidMain; iOS gets the Applier from skikoMain. >> s6||The runtime, which adds the node to its parent itself >> The runtime never touches nodes directly; it asks the Applier. >> s2::The runtime asks; the platform's Applier inserts.
- A team builds its own design system with custom buttons, and doesn't want Material. Which layer do their buttons build on?::*foundation, with Row, gestures and Compose UI's drawing below it||The runtime directly, since foundation already has Material's look >> foundation has no look of its own; that's why it suits a new design system. >> s3||Material, since every button must start from Material's Button >> Higher layers are optional; you can stop at foundation. >> s4::Build a design system on foundation.

## Sources

- [Android Developers: Jetpack Compose architectural layering](https://developer.android.com/develop/ui/compose/layering) ("Each layer is built upon the lower levels, combining functionality to create higher level components."; Runtime: "You might consider building directly upon this layer if you only need Compose's tree management abilities, not its UI."; UI: "These modules implement the fundamentals of the UI toolkit, such as LayoutNode, Modifier, input handlers, custom layouts, and drawing."; Foundation: "This module provides design system agnostic building blocks for Compose UI, like Row and Column, LazyColumn, recognition of particular gestures, etc."; Material: "This module provides an implementation of the Material Design system for Compose UI, providing a theming system, styled components, ripple indications, icons.")
- [Compose runtime source: Applier.kt](https://github.com/androidx/androidx/blob/c13c6d0da6b9d595f72caad9fa1759c6a8aece83/compose/runtime/runtime/src/commonMain/kotlin/androidx/compose/runtime/Applier.kt#L23) ("An Applier is responsible for applying the tree-based operations that get emitted during a composition."; "A custom [Applier] implementation will be needed in order to utilize Compose to build and maintain a tree of a novel type."; its operations include `insertTopDown`, `insertBottomUp`, `remove`, `move` and `clear`)
- [Compose Multiplatform source: UiApplier.android.kt](https://github.com/JetBrains/compose-multiplatform-core/blob/97210bb938d0143fd1bf0bea3d1b83a977568537/compose/ui/ui/src/androidMain/kotlin/androidx/compose/ui/node/UiApplier.android.kt) (`internal class UiApplier(root: LayoutNode) : AbstractApplier<LayoutNode>(root)`; and the folder compose/ui/ui/src holds per-platform source sets such as androidMain, iosMain, desktopMain and webMain beside commonMain; counting Kotlin files at that commit: compose/runtime/runtime/src/nativeMain 8 (MonotonicFrameClock.native.kt, Thread.native.kt, Synchronization.native.kt…); compose/ui/ui/src/iosMain 137 (plus 97 translated string files), skikoMain 88; compose/foundation/foundation/src/iosMain 32 (text/BasicTextField.ios.kt, text/selection/…, Magnifier.ios.kt, text/ContextMenu.ios.kt, cupertino/CupertinoScrollDecayAnimationSpec.ios.kt), skikoMain 126; compose/material3/material3/src/darwinMain 2 (CalendarLocale.darwin.kt, PlatformDateFormat.darwin.kt), skikoMain 97)
- [Compose Multiplatform source: DefaultUiApplier.skiko.kt](https://github.com/JetBrains/compose-multiplatform-core/blob/97210bb938d0143fd1bf0bea3d1b83a977568537/compose/ui/ui/src/skikoMain/kotlin/androidx/compose/ui/platform/DefaultUiApplier.skiko.kt#L22) (`internal class DefaultUiApplier(root: LayoutNode) : AbstractApplier<LayoutNode>(root)`; `override fun insertBottomUp(index: Int, instance: LayoutNode) { current.insertAt(index, instance) }`; and build-fork.gradle for compose/ui/ui: `desktopMain { dependsOn(skikoMain) }`, `nonJvmMain { dependsOn(skikoMain) }`, `nativeMain { dependsOn(nonJvmMain) }`)
- [Kotlin docs: Compose Multiplatform and Jetpack Compose](https://kotlinlang.org/docs/multiplatform/compose-multiplatform-and-jetpack-compose.html) ("It shares the Compose compiler and runtime with Jetpack Compose and uses the same APIs")
