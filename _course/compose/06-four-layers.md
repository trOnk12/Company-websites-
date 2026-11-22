---
title: Four layers, one edge per platform
short: Runtime, UI, foundation, Material
summary: Puzzles 0 to 5 followed one screen from a composable to pixels. Those steps live in different libraries, stacked on top of each other. Here's the stack, the one plug that keeps the runtime away from pixels, and why only one edge of it had to be written again for iOS.
takeaway: Compose is four layers. The runtime keeps the composition and changes a tree of nodes only through an Applier. Compose UI plugs in an Applier for LayoutNodes and does layout, drawing and input. foundation builds layout and gesture blocks with no look of their own; Material adds a design system. Each layer uses only the ones below it, so Compose Multiplatform keeps its iOS code at the edge that meets the phone: mostly in Compose UI (the window, the canvas, touches, text input and accessibility), with a few touches in foundation.
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

Each layer only calls the ones below it. That's what made Compose Multiplatform possible: the platform code could be kept at the edge where Compose meets the phone. In Compose Multiplatform's own source code, the runtime and Material hold no code written only for iOS. Most of the iOS code sits in Compose UI, where it meets the phone (the window, the canvas, touches, the keyboard and accessibility), in an iOS source set beside the Android one. foundation adds a few iOS touches too, such as the stretch at the end of a scroll. That edge is the KMP course's platform layer. On Android your build uses Google's libraries, and on iOS JetBrains' builds of the same ones.

## Go deeper: Could Compose drive something that isn't a screen?

- Someone writes an Applier for a tree of terminal text lines instead of LayoutNodes. Which layers can they reuse?::Only the runtime: composables, remember, snapshot state, recomposition and skipping all work, because the runtime touches the tree only through the Applier. Compose UI, foundation and Material are built for LayoutNodes, so they don't apply.

## The analogy

The play, staged in two theatres (the KMP course, puzzle 14). The prompt book and its rules (the runtime) work with any stage; the stage manager changes the set only through the stage crew (the Applier). The crew of each theatre (Compose UI's edge) knows its own trapdoors and lights. The choreography (foundation) and the costumes (Material) travel with the company, with a step or two adjusted to each stage.

## Check yourself

- Your shared code calls `Button` inside a `Column`, and you build it for iOS. Which layer on that path holds the most code written only for iOS?::*Compose UI, where it meets the window, the canvas and touches||material3, where Button is redrawn to look like an iOS button >> Material is shared and looks the same on both; it has no iOS-only code. >> s4||The runtime, which needs its own way to store the composition on iOS >> The runtime is shared; it never touches the platform. >> s5::The edge that meets the phone is in Compose UI.
- Why does the runtime change the tree of nodes only through an Applier?::*So the runtime works with any kind of tree, not only LayoutNodes||So the Applier can measure each node before it is inserted >> Measuring happens in the layout phase, in Compose UI; the Applier only inserts, moves and removes. >> s2||So that nodes are drawn in the same order as they are inserted >> Drawing is Compose UI's job in a later phase; the Applier doesn't draw. >> s2::The Applier keeps the runtime independent of the tree.
- A team builds its own design system with custom buttons, and doesn't want Material. Which layer do their buttons build on?::*foundation, with Row, gestures and Compose UI's drawing below it||The runtime directly, since foundation already has Material's look >> foundation has no look of its own; that's why it suits a new design system. >> s3||Material, since every button must start from Material's Button >> Higher layers are optional; you can stop at foundation. >> s4::Build a design system on foundation.

## Sources

- [Android Developers: Jetpack Compose architectural layering](https://developer.android.com/develop/ui/compose/layering) ("Each layer is built upon the lower levels, combining functionality to create higher level components."; Runtime: "You might consider building directly upon this layer if you only need Compose's tree management abilities, not its UI."; UI: "These modules implement the fundamentals of the UI toolkit, such as LayoutNode, Modifier, input handlers, custom layouts, and drawing."; Foundation: "This module provides design system agnostic building blocks for Compose UI, like Row and Column, LazyColumn, recognition of particular gestures, etc."; Material: "This module provides an implementation of the Material Design system for Compose UI, providing a theming system, styled components, ripple indications, icons.")
- [Compose runtime source: Applier.kt](https://github.com/androidx/androidx/blob/c13c6d0da6b9d595f72caad9fa1759c6a8aece83/compose/runtime/runtime/src/commonMain/kotlin/androidx/compose/runtime/Applier.kt#L23) ("An Applier is responsible for applying the tree-based operations that get emitted during a composition."; "A custom [Applier] implementation will be needed in order to utilize Compose to build and maintain a tree of a novel type."; its operations include `insertTopDown`, `insertBottomUp`, `remove`, `move` and `clear`)
- [Compose Multiplatform source: UiApplier.android.kt](https://github.com/JetBrains/compose-multiplatform-core/blob/97210bb938d0143fd1bf0bea3d1b83a977568537/compose/ui/ui/src/androidMain/kotlin/androidx/compose/ui/node/UiApplier.android.kt) (`internal class UiApplier(root: LayoutNode) : AbstractApplier<LayoutNode>(root)`; and the folder compose/ui/ui/src holds per-platform source sets such as androidMain, iosMain, desktopMain and webMain beside commonMain; compose/foundation/foundation/src/iosMain holds files such as cupertino/CupertinoOverscrollEffect.ios.kt; compose/material3/material3/src and compose/runtime/runtime/src have no iosMain)
- [Kotlin docs: Compose Multiplatform and Jetpack Compose](https://kotlinlang.org/docs/multiplatform/compose-multiplatform-and-jetpack-compose.html) ("It shares the Compose compiler and runtime with Jetpack Compose and uses the same APIs")
