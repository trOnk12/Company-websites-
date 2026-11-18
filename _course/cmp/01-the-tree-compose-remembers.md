---
title: The tree Compose remembers
short: Composition and the slot table
summary: Every composable call records a group through the Composer, and then returns. Here's where those records go, so that a counter's value survives the call that made it, and the same call finds it again next time.
takeaway: The first run of your composables builds the composition, a tree of groups, one per call, nested the way the calls nest, and kept after they return. Composables such as Text and Button also leave a node, a real UI element. Groups keep values in slots (last time's arguments, what you remember), and the runtime stores all of it in call order in the slot table. On the next run, a call finds its own group and slots again by its call site, the place in the code it's called from.
---

## The problem

Puzzle 0 showed every composable call recording a group through the Composer, and then returning. When a function returns, its local variables are gone. So where does `remember { mutableStateOf(0) }` keep that 0 between runs? And when `Counter` runs again, how does it find its own 0, and not the one from another `Counter` on the same screen?

## See it

```diagram slots
```

## The building block

The first time your composables run, the Composer builds the **composition**: a tree of groups, one per call, nested the way the calls nest. Android's docs put it in one line: "A Composition is a tree-structure of the composables that describe your UI." Unlike the calls, it stays: from then on it's only updated, by recomposition.

Some calls leave more than a group. `Text`, `Button`, `Column`: the composables that end up on screen also leave a **node**, a real UI element with a size and a place. In Compose's UI library the node class is **LayoutNode** ("an element in the layout hierarchy"). Your own `Greeting` and `Counter` leave only groups: they arrange calls, they aren't elements. So the nodes, taken out of the groups, form a smaller tree of their own: the UI tree, which puzzle 4 turns into pixels.

Groups also keep values, in **slots**. A slot holds an argument the call got last time (puzzle 3 compares against it) or a value it asked to keep. That's all `remember` is: in the runtime's own code, `remember { … }` is a call that asks the current Composer to store the value in the composition, at this group. It doesn't become a global: two `Counter`s are two groups, with two slots and two counts.

The runtime keeps the whole composition in one structure, the **slot table**: groups and their slots, laid out in the order the calls ran, each group's children right after it. (Simplified: it's really two arrays, one for groups and one for slots, with a gap that makes inserting cheap. Reading it from start to end is fast; jumping around is not.)

So how does a call find its slots again? By where it's called from. Each **call site**, the place in your source where a composable is called, gets its own key from the compiler plugin. On the next run, the calls come in the same order from the same call sites, so `Counter` reaches the same group and finds its 0. If an if-statement adds a call above it, `Counter` still keeps its count: its call site didn't move.

## In practice

The one place call sites aren't enough is a loop: every item comes from the same call site, so the runtime tells them apart by their order. Insert an item at the top and every item below gets the slots of the one that used to be in its position. The `key()` composable fixes it by giving each item an identity of its own: `key(movie.id) { MovieRow(movie) }`.

## The analogy

The stage manager's prompt book. The first performance fills it in, scene after scene, with each scene's notes inside it (its group). On some pages there's a set piece that goes on stage (a node). Margins hold what to keep: which hat the hero wore (slots). The next night, the scenes come in the same order, so the stage manager turns to the same page and finds the same hat. A new scene added before it gets a new page; the old pages don't move.

## Check yourself

- Above `Counter()`, whose count is 3, you add a call to ErrorBanner() that runs only if showError is true. showError becomes true and the screen runs again. What's Counter's count now?::*Still 3, because Counter's call site didn't change, so it finds its own slots||0, because Counter is now the second call and gets new slots >> Order alone doesn't decide: each call site is told apart, so Counter keeps its group. >> s5||3, but now it belongs to ErrorBanner, which took Counter's spot >> Slots belong to a group, found by its call site; a new call gets its own. >> s3::Same call site, same slots.
- Why does a remembered value survive, when the composable's local variables are gone after it returns?::*It's in a slot of the call's group, in the composition that outlives the call||remember turns the variable into a global that every call shares >> Each call has its own slots: two Counters keep two counts. >> s3||The function never really returns; it waits for the next run >> It returns like any function; what stays is what it recorded. >> s1::It lives in the slot table, not on the call.
- What's the difference between a group and a node?::*Every call records a group, while only on-screen elements like Text also leave a node||Every call leaves a node, while only Text and Button also record a group >> That's the two swapped: Greeting and Counter leave only groups. >> s2||A node is a group's slot that holds a remembered value >> Slots hold values; a node is a real UI element. >> s2::One per call, or one per element on screen.

## Sources

- [Android Developers: Lifecycle of composables](https://developer.android.com/develop/ui/compose/lifecycle) ("A Composition is a tree-structure of the composables that describe your UI."; "A Composition can only be produced by an initial composition and updated by recomposition."; "The instance of a composable in Composition is identified by its call site."; "Each call has a unique call site and source position, which the compiler will use to uniquely identify it."; "Even though LoginInput went from being called first to being called second, the LoginInput instance will be preserved across recompositions."; "Compose uses the execution order in addition to the call site to keep the instance distinct in the Composition.")
- [Android Developers: State and Jetpack Compose](https://developer.android.com/develop/ui/compose/state) ("A value computed by remember is stored in the Composition during initial composition, and the stored value is returned during recomposition.")
- [Compose runtime source: Composables.kt](https://github.com/androidx/androidx/blob/c13c6d0da6b9d595f72caad9fa1759c6a8aece83/compose/runtime/runtime/src/commonMain/kotlin/androidx/compose/runtime/Composables.kt#L24) (`remember` is "currentComposer.cache(false, calculation)"; and in Composer.kt, cache's comment: "Cache, that is remember, a value in the composition data of a composition.")
- [Compose runtime source: SlotTable.kt](https://github.com/androidx/androidx/blob/c13c6d0da6b9d595f72caad9fa1759c6a8aece83/compose/runtime/runtime/src/commonMain/kotlin/androidx/compose/runtime/composer/gapbuffer/SlotTable.kt#L91) ("Groups form a tree where the child groups are immediately after the group fields for the group. This data structure favors a linear scan of the children. Random access is expensive unless it is through a group anchor."; "Slots are allocated in the slots array and are stored in order of their respective groups."; a node is "where the LayoutNode is stored by the slot table")
- [Compose UI source: LayoutNode.kt](https://github.com/androidx/androidx/blob/c13c6d0da6b9d595f72caad9fa1759c6a8aece83/compose/ui/ui/src/commonMain/kotlin/androidx/compose/ui/node/LayoutNode.kt#L77) ("An element in the layout hierarchy, built with compose UI.")
