---
title: What gets skipped
short: Skipping and stability
summary: When a marked composable runs again, it calls its children again too. Most of them got the same arguments as last time. Here's how Compose decides that a child call doesn't need to run, and why a list built in the wrong place makes it run every time.
takeaway: A call is skipped when every argument equals the one stored in its slots last time. Stable types (Int, String, a data class of vals) are compared with equals. Unstable types (a class with a var, a List) are compared by instance with ===, under strong skipping, on by default since Kotlin 2.0.20. So a new list built on every run makes its child run every time; keep it in remember, or in state, and the same instance comes back.
---

## The problem

Puzzle 3 ended with one marked composable, `Screen`, running again from its start. Running its body means calling `Header`, `Counter` and `Tags` again. If each of those ran its body every time, one change near the top would rerun the whole screen below it, which is what puzzle 3 tried to avoid. Most of those calls got exactly what they got last time. How does a call know it can stay as it is?

## See it

```diagram skip
```

## The building block

Puzzle 1 said a group keeps the arguments it got last time in its slots. When a call comes in again, the code the plugin added compares each new argument with the stored one. If all of them are equal, the body doesn't run and the group keeps last time's record, nodes included: that's **skipping**. (Puzzle 0's `$changed` is how a caller passes on "this argument is the same as last time", so the child can skip a comparison the caller already made.)

Equal how? That depends on the argument's type, and on whether Compose can trust the answer.

A **stable** type is one that can't change without Compose seeing it: it never changes once made (Int, String, a data class whose properties are all vals of stable types), or it changes only through snapshot state, which Compose watches (puzzle 3). For a stable argument, Compose calls `equals`: a new `User("Ana")` equal to last time's skips.

An **unstable** type could change without Compose seeing a watched write: a class with a plain var property, or the `List`, `Set` and `Map` interfaces, since the list behind a `List` might be a mutable one. So are classes from a module the Compose compiler didn't compile. Before Kotlin 2.0.20, a call with an unstable argument always ran when its parent ran. Since then the compiler's **strong skipping** mode is on by default: an unstable argument is compared by instance, with `===`, and the call is skipped when the very same object comes back.

That's why where you build a value matters. Calling `Tags` with `listOf("a", "b")` inside `Screen` builds a new list on every run of `Screen`: a different instance each time, so `Tags` runs every time, even though the words inside never change. Keep the list in `remember`, in snapshot state or in a ViewModel, and `Tags` gets the same instance and is skipped. For a list computed from another one, give `remember` that list as a key, so it computes again only when the input changes:

```kotlin
val done = remember(items) { items.filter { it.done } }
Done(done)
```

Under strong skipping the compiler also remembers the lambdas you write inside a composable, such as an `onClick`, so they don't count as new on every run.

When the compiler can't prove a type stable, but you know its changes are always visible to Compose, the **`@Stable`** annotation promises it. Compose then compares it with `equals`, which is only worth it if `equals` is cheap: comparing a long list item by item can cost more than running the call.

Skipping and puzzle 3 work together. Skipping decides whether a child runs because its parent ran. A skipped child that read some state that changed is still marked on its own, and restarts by itself at the next frame.

## Go deeper: What does a skip look like in the generated code?

- The plugin's own comments show the rewrite: the body runs if an argument changed, else `skipToGroupEnd()`. What does skipping to the group's end leave in the slot table?::Everything the group recorded last time, untouched: its slots, its child groups and its nodes. The reader jumps past them, so the screen keeps showing what that call produced on its last run.

## The analogy

Back in the theatre. When a scene is redone, the stage manager checks each prop list against last night's. Props that can't change on their own, like a printed sign, are checked by reading them: same words, no reset (equals). A box of loose papers could have been reshuffled by anyone backstage, so the stage manager only checks it's the very same box (`===`). If the props team brings a fresh box every night, even with the same papers, the scene is reset every night.

## Check yourself

- `Screen` runs again and calls Profile(User(name)), building a new `User` each run. User is a data class with one val, a String, in your own module. name hasn't changed. Does Profile run?::*No: User is stable, so equals compares it, and it's equal||Yes: it's a new instance, and new instances always count as changed >> Comparing by instance is for unstable types; a data class of vals is stable and compared with equals. >> the-building-block||Yes: every child of a composable that runs again runs too >> Each child call compares its arguments first; equal arguments skip. >> s2::A stable argument is compared with equals.
- Why does Compose treat a class with a plain var property as unstable?::*The var could change with no watched write, so Compose can't know||A class with a var can't be compared with equals at all >> Any class has equals; the problem is that a change to the var is never seen. >> the-building-block||Reading a var property counts as a state read and marks the group >> Only snapshot state is watched (puzzle 3); a plain var is invisible to Compose. >> the-building-block::Unstable means Compose can't see its changes.
- A parent reads the scroll position, so it runs on every scroll frame. It passes `items.filter { it.done }` to a child, Done(list). Under strong skipping, what makes Done skip when nothing changed?::*Filter once, in remember keyed on items, and pass that list||Mark the child composable itself with @Stable, so it skips >> @Stable is for types, and filter still makes a new List instance on every run. >> the-building-block||Nothing: List arguments make a call run every time, whatever you do >> Under strong skipping, an unstable List skips when the same instance comes back. >> s6::Same instance, skipped.

## Sources

- [Android Developers: Stability in Compose](https://developer.android.com/develop/ui/compose/performance/stability) ("A type is stable if it is immutable, or if it is possible for Compose to know whether its value has changed between recompositions."; "A type is unstable if Compose can't know whether its value has changed between recompositions."; "If a composable's stable parameters are equal to their previous values, Compose skips it."; "Compose compares unstable parameters using instance equality (===) and skips the composable if the same object instances are passed."; "Compose always recomposes a composable with unstable parameters when its parent recomposes."; "Compose considers standard collection interfaces (List, Set, and Map) unstable because their underlying implementations may be mutable."; "Compose considers classes from modules where the Compose compiler does not run to be unstable")
- [Android Developers: Strong skipping mode](https://developer.android.com/develop/ui/compose/performance/stability/strongskipping) ("Note: Strong Skipping is enabled by default in Kotlin 2.0.20."; "With strong skipping enabled, every lambda inside a composable function will be automatically remembered."; "Add @Stable or @Immutable when the compiler can't infer stability")
- [Compose compiler plugin source: ComposableFunctionBodyTransformer.kt](https://github.com/JetBrains/kotlin/blob/445745fcddeb23e605547c2600a81472ef225c29/plugins/compose/compiler-hosted/src/main/java/androidx/compose/compiler/plugins/kotlin/lower/ComposableFunctionBodyTransformer.kt#L278) ("Composable functions can "skip" their execution if certain conditions are met. This is done by appealing to the composer and storing previous values of functions and determining if we can skip based on whether or not they have changed."; its example ends in "$composer.skipToGroupEnd()"; and on $changed: "This type of propagation of information through composable functions is called Comparison Propagation.")
