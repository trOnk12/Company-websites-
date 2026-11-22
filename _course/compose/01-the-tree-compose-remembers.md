---
title: The tree Compose remembers
short: Composition and the slot table
summary: Every composable call records a group through the Composer, and then returns. Here's where those records go, so that a counter's value survives the call that made it, and the same call finds it again next time.
takeaway: The first run of your composables builds the composition, a tree of groups, one per call, nested the way the calls nest, and kept after they return. Composables such as Text and Button also leave a node, a real UI element. Groups keep values in slots, and the runtime stores all of it in call order in the slot table. The next run walks the table in the same order, matching each call to the group with its key at that point; an if keeps a group of its own, so a call that only sometimes runs doesn't shift the ones after it.
---

## The problem

Puzzle 0 showed every composable call recording a group through the Composer, and then returning. When a function returns, its local variables are gone. So where does `remember { mutableStateOf(0) }` keep that 0 between runs? And puzzle 0 said every call to `Counter` opens a group with the same key. When `Counter` runs again, how does it find its own 0, and not the one from another `Counter` on the same screen?

## See it

```diagram slots
```

## The building block

The first time your composables run, the Composer builds the **composition**: a tree of groups, one per call, nested the way the calls nest. Android's docs put it in one line: "A Composition is a tree-structure of the composables that describe your UI." Unlike the calls, it stays: from then on it's only updated, by recomposition.

Some calls leave more than a group. `Text`, `Button`, `Column`: the composables that end up on screen also leave a **node**, a real UI element with a size and a place on screen. In Compose's UI library the node class is `LayoutNode` ("an element in the layout hierarchy"). Your own `Greeting` and `Counter` leave only groups: they arrange calls, they aren't elements. So the nodes, taken out of the groups, form a smaller tree of their own: the UI tree, which puzzle 5 turns into pixels.

Groups also keep values, in **slots**. A slot holds an argument the call got last time (puzzle 4 compares against it) or a value it asked to keep. That's all `remember` is: in the runtime's own code, `remember { … }` is a call that asks the current Composer to store the value in the composition, at this group. It doesn't become a global: two `Counter`s are two groups, with two slots and two counts.

The runtime keeps the whole composition in one structure, the **slot table**: each group with its key, followed by its slots and then its children, laid out in the order the calls ran. Reading it from start to end is fast; jumping around in it is not.

So the next run reads it from the start, in step with the calls. Each call arrives with its function's key (puzzle 0) and takes the group with that key at the reader's position: `Column` finds the `Column` group, then `Counter` finds the next group, the one with `Counter`'s key, and its slots, with the 0 in them. Two `Counter`s side by side carry the same key, so their order tells them apart: the first call gets the first group. Android's docs say it the same way: Compose "uses the execution order" to keep instances apart.

What about a call that only runs sometimes? Put `if (showError) ErrorBanner()` above `Counter()`. The plugin gives the `if` a group of its own, keyed by where the `if` sits in your source (a key from position, as puzzle 0 said), and records that group on every run: empty while showError is false, holding `ErrorBanner`'s group when it's true. So the group after it is always `Counter`'s, and `Counter` keeps its count. The runtime's code calls these groups for control flow, "such as an `if` statement", replace groups: when the content changes, the old content is removed and the new one inserted.

One case order can't solve, a loop that calls the same composable for every item, is puzzle 2.

## Go deeper: What does the slot table look like in memory?

- Why does the runtime store groups in call order in arrays, instead of as a tree of objects that point at each other?::The next run reads the groups in the same order the calls happen, and a front-to-back scan of an array is fast. The default table is two arrays (one for groups, one for slots) with a gap kept where the next insert goes, so adding a group there, like `ErrorBanner`'s, doesn't shift everything after it. A linked-list version, faster for moving and deleting content, is being tried behind a flag that's off by default.

## The analogy

The stage manager's prompt book from puzzle 0. The first performance fills it in, scene after scene, with each scene's notes inside it (its group). On some pages there's a set piece that goes on stage (a node). Margins hold what to keep: which hat the hero wore (slots). The next night, the stage manager turns the pages in order as the scenes come, so the hero's scene opens at the same page and finds the same hat. A scene that's only sometimes played still has its own page, blank on the nights it isn't played, so the pages after it never move.

## Check yourself

- Above `Counter()`, whose count is 3, the code calls ErrorBanner() only if showError is true. showError was false, becomes true, and the screen runs again. What's Counter's count now?::*Still 3: the if's group was recorded on both runs, so the next group is still Counter's||0: Counter is now the second call, so it gets new slots >> The if's group was there even while showError was false; Counter's group never moved a place. >> s5||3, but that count now belongs to ErrorBanner, which took Counter's place >> ErrorBanner's group is new, inside the if's group; Counter's group and slots stay Counter's. >> s6::The if keeps a group of its own, so nothing after it shifts.
- A screen calls `Counter()` twice, one under the other, each with `remember { mutableStateOf(0) }`. You tap the second one twice, and the screen runs again. What does each remember hand back?::*0 to the first call and 2 to the second||2 to both: remember keeps one value per composable function >> remember stores the value in a slot of this call's group; two calls, two groups, two slots. >> s3||0 to both: the counts were local variables, gone when the calls returned >> The counts aren't locals: they sit in slots of each call's group, which stay after the calls return. >> the-building-block::Each call finds its own group by order, and its own slot inside it.
- Both `Counter` calls on that screen open groups with the same key. Why can't the next run find each one's group by its key alone?::*The two keys are equal, so only their order in the table tells the groups apart||Keys exist only during the first run, and are gone by the next one >> The plugin computes keys while compiling, and the table keeps each group's key. >> s4||The key finds the group, but its slots are stored somewhere else >> Each group's slots come right after it in the table, so finding the group finds its slots. >> s4::Same function, same key: order decides.

## Sources

- [Android Developers: Lifecycle of composables](https://developer.android.com/develop/ui/compose/lifecycle) ("A Composition is a tree-structure of the composables that describe your UI."; "A Composition can only be produced by an initial composition and updated by recomposition."; "Even though LoginInput went from being called first to being called second, the LoginInput instance will be preserved across recompositions."; "Compose uses the execution order in addition to the call site to keep the instance distinct in the Composition.")
- [Android Developers: State and Jetpack Compose](https://developer.android.com/develop/ui/compose/state) ("A value computed by remember is stored in the Composition during initial composition, and the stored value is returned during recomposition.")
- [Compose runtime source: Composables.kt](https://github.com/androidx/androidx/blob/c13c6d0da6b9d595f72caad9fa1759c6a8aece83/compose/runtime/runtime/src/commonMain/kotlin/androidx/compose/runtime/Composables.kt#L24) (`remember` is "currentComposer.cache(false, calculation)"; and in Composer.kt, cache's comment: "Cache, that is remember, a value in the composition data of a composition.")
- [Compose runtime source: Composer.kt](https://github.com/androidx/androidx/blob/c13c6d0da6b9d595f72caad9fa1759c6a8aece83/compose/runtime/runtime/src/commonMain/kotlin/androidx/compose/runtime/Composer.kt#L281) ("Start a replace group. A replace group is a group that cannot be moved during must only either be inserted, removed, or replaced. For example, the group created by most control flow constructs such as an `if` statement are replaceable groups.")
- [Compose compiler plugin source: ComposableFunctionBodyTransformer.kt](https://github.com/JetBrains/kotlin/blob/445745fcddeb23e605547c2600a81472ef225c29/plugins/compose/compiler-hosted/src/main/java/androidx/compose/compiler/plugins/kotlin/lower/ComposableFunctionBodyTransformer.kt#L4271) (in visitWhen, an `if` with one branch that calls composables becomes a coalescable group; "if a call happens after the coalescable child group, then we should realize the group of the coalescable child", and realizing it wraps the whole `if` in "irStartReplaceGroup(this, scope, …)" and "irEndReplaceGroup(…)", keyed by sourceKey(), its position in the function)
- [Compose runtime source: SlotTable.kt](https://github.com/androidx/androidx/blob/c13c6d0da6b9d595f72caad9fa1759c6a8aece83/compose/runtime/runtime/src/commonMain/kotlin/androidx/compose/runtime/composer/gapbuffer/SlotTable.kt#L95) ("Groups form a tree where the child groups are immediately after the group fields for the group. This data structure favors a linear scan of the children. Random access is expensive unless it is through a group anchor."; "Slots are allocated in the slots array and are stored in order of their respective groups."; a node is "where the LayoutNode is stored by the slot table")
- [Compose runtime source: ComposeRuntimeFlags.kt](https://github.com/androidx/androidx/blob/ebe7964173e100eb8833f6d4d5e59cba3656db0d/compose/runtime/runtime/src/commonMain/kotlin/androidx/compose/runtime/ComposeRuntimeFlags.kt#L31) ("A feature flag than can be used to enable the link-list based slot table implementation instead of the gap buffer based slot table."; "This flag is **disabled** by default.")
- [Compose UI source: LayoutNode.kt](https://github.com/androidx/androidx/blob/c13c6d0da6b9d595f72caad9fa1759c6a8aece83/compose/ui/ui/src/commonMain/kotlin/androidx/compose/ui/node/LayoutNode.kt#L77) ("An element in the layout hierarchy, built with compose UI.")
