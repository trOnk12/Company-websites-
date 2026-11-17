---
title: Compose in one puzzle
short: Composables and recomposition
summary: The last module shares the UI itself, with Compose. If you've built screens with Activities and XML, here's the one idea Compose is built on, and the compiler step that makes it work, before we look at what can be shared.
takeaway: In Compose, a screen is a Kotlin function marked @Composable that describes the UI for the current data, instead of creating and updating view objects. When that data, its state, changes, Compose calls the affected functions again: recomposition. remember keeps a value across those calls. A compiler plugin rewrites every @Composable function so the runtime can track what each one showed and redo only what changed.
---

## The problem

With XML layouts, you build a view once, then change it by hand: `textView.text = name`. Compose has no such step: you write a function, and the screen follows your data. How does the screen update, if nothing tells it to?

## See it

```diagram compose
```

## The building block

A **composable** is a Kotlin function marked `@Composable` that takes data and describes the UI for it:

```kotlin
@Composable
fun Greeting(name: String) {
    Text("Hello, $name")
}
```

It returns nothing and creates no view objects you keep. It describes what the screen should look like for this `name`.

When the data changes, Compose calls the function again with the new value: **recomposition**. It's smart about it: only the functions whose inputs might have changed run again; the rest are skipped. Data that should trigger it is **state**, for example `var count by remember { mutableStateOf(0) }`; **remember** keeps that value across recompositions, so it isn't reset each time the function runs.

How can the runtime know which functions showed what? That's the **Compose compiler plugin**, a part of the Kotlin compiler from puzzle 0. It rewrites every `@Composable` function, adding hidden bookkeeping so Compose can track what each call showed and skip what didn't change.

## The analogy

A weather board that a printer reprints whenever the forecast changes, instead of a person climbing up to swap single letters. You only ever write what the board should say; the printer handles the rest, and only reprints the panels that changed.

## Check yourself

- The `name` passed to `Greeting` changes. What makes the text update?::*Compose calls `Greeting` again with the new name: recomposition||Your code sets the new text on the Text object >> You keep no Text object to set; you describe, Compose redraws. >> s3||The Activity recreates the whole screen >> Only the affected functions run again; nothing is recreated. >> s3::Data changes, functions run again.
- Why does a counter need `remember`?::*So its value survives each recomposition instead of resetting||So Compose knows the counter is on screen >> remember is about keeping the value across calls, not visibility. >> the-building-block||So the counter is saved when the app is closed >> remember lasts across recompositions, not after the app is killed. >> the-building-block::Kept across calls.
- What's the difference between a composable and the Compose compiler plugin?::*A composable describes UI for its data, while the plugin rewrites composables so the runtime can track them||A composable rewrites functions so the runtime can track them, while the plugin describes UI for its data >> That's the two swapped. >> the-building-block::What you write vs what the compiler adds.

## Sources

- [Android Developers: Thinking in Compose](https://developer.android.com/develop/ui/compose/mental-model) ("you can build your user interface by defining a set of composable functions that take in data and emit UI elements"; "This annotation informs the Compose compiler that this function is intended to convert data into UI"; "Recomposition is the process of calling your composable functions again when inputs change. When Compose recomposes based on new inputs, it calls only the functions or lambdas that might have changed, and skips the rest.")
