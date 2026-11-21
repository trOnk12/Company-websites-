---
title: What @Composable really does
short: The compiler plugin and the Composer
summary: The KMP course said a compiler plugin adds "hidden bookkeeping" to every composable. Here's what it really adds: a hidden parameter that every composable hands on to the next, and a start and an end around every call.
takeaway: The Compose compiler plugin rewrites every @Composable function. It adds a hidden $composer parameter (and a $changed one), and wraps the body in a start and an end, so everything the call records in between forms its group, labelled with a key from its place in the source. Each composable passes its Composer on to the composables it calls, which is why only a composable can call a composable.
---

## The problem

The KMP course ended its Compose puzzle with one sentence: a compiler plugin rewrites every `@Composable` function with "hidden bookkeeping". Rewrites it into what?

Look at `Greeting`. It takes a name, calls `Text`, and returns `Unit`. A plain Kotlin function forgets everything the moment it returns. Yet Compose can later run this one call again on its own, and it knows what the call showed last time. And if you call `Greeting` from an `onClick` lambda, the build fails. So something is passed into every composable that you never wrote.

## See it

```diagram rewrite
```

## The building block

`@Composable` is an annotation, but it does more than label the function: the Compose compiler plugin, part of the Kotlin compiler since Kotlin 2.0.0, rewrites every function that carries it. Roughly (simplified from the comments in the plugin's own source code):

```kotlin
// What you write
@Composable
fun Greeting(name: String) {
    Text("Hello, $name")
}

// Roughly what the plugin turns it into
@Composable
fun Greeting(name: String, $composer: Composer, $changed: Int) {
    $composer.startRestartGroup(1234)          // the key: a number for this spot in the source
    Text("Hello, $name", $composer, /* … */)   // the composer is handed on
    $composer.endRestartGroup()
}
```

Three things changed.

**A hidden parameter.** `$composer` is the **Composer**, an object from the Compose runtime. Every composable call records what it did through it: which composables it called, in which order, with which arguments, and which values it asked to keep. You never call it yourself: the runtime's code says the Composer is "targeted by the Compose Kotlin compiler plugin", so it trusts that only generated code uses it.

**A start and an end.** `startRestartGroup` opens the call's record and `endRestartGroup` closes it. Everything one call records between its start and its end belongs to that call: its **group**. Each group carries a key, a number the plugin computes from where the code sits in your source file (its offsets in the function), so the runtime can tell one group from its neighbours. Groups nest the way calls nest: `Greeting`'s group holds `Text`'s group inside it.

**A second hidden parameter**, `$changed`: an `Int` in which the caller passes on what it already knows about each argument, such as "this is the same value as last time". Puzzle 3 shows what it's for.

Then the rule you've met as a compile error. Inside `Greeting`, the call to `Text` gets `Greeting`'s own `$composer`. So one Composer travels down through every composable call, from where Compose starts (on Android, `setContent { }`; on iOS, the lambda you pass to `ComposeUIViewController`) to the smallest `Text`. A plain function, such as an `onClick` lambda, has no `$composer` to hand on, so the compiler refuses the call. That's what "a composable can only be called from another composable" means. It's the same shape as `suspend`: you can only call a suspending function from another suspending function.

## Go deeper: Why a number and not the function's name?

- Two calls to `Text` sit in one `Column`, one above the other. Why can't the runtime label both groups "Text"?::Both would carry the same label, and the runtime could not tell them apart. The plugin computes each key from the call's position in the source, so the first and second `Text` get different keys.

## The analogy

The theatre from the KMP course, where the same play is staged in two theatres. You, the playwright, write the scenes. Before rehearsals, the script editor (the compiler plugin) marks the start and the end of every scene and adds one line to each: "hand the prompt book to the next scene". The stage manager's prompt book (the Composer) travels through the whole play, and each scene notes what it did between its marks (its group). A scribble on a napkin (a plain lambda) has no marks, and no prompt book to hand on.

## Check yourself

- You write a plain function, showName, that calls `Text`, and you forget the @Composable on it. You build. What happens?::*The build fails: showName has no `$composer` to hand to `Text`||It builds, and `Text` throws an exception when showName runs >> The check happens at compile time: the hidden parameter is missing in the call, so the code never gets to run. >> s5||It builds, and the plugin adds a `$composer` parameter to showName >> The plugin rewrites only functions marked @Composable; showName stays a plain function. >> s2::No @Composable, no Composer to hand on, no build.
- Why does the plugin wrap each composable's body in a start and an end?::*So the runtime knows which records belong to this one call||So Kotlin can run the body on a background thread later >> Nothing here is about threads: the start and end mark where one call's records begin and stop. >> s3||So the function returns an object Compose keeps and updates >> A composable still returns Unit; what's kept is what it recorded through the Composer. >> s1::Start and end mark one call's group.
- `Greeting` calls `Text` twice: once for a title, once for a subtitle. How many groups does one run of `Greeting` record?::*Three: one for Greeting, with one for each Text inside it||One: the two Text calls share Greeting's group >> Every composable call opens its own group, nested inside its caller's. >> s3||Two: one per Text call, and none for Greeting itself >> Greeting is a composable too; the plugin wrapped its body in a start and an end. >> s3::One group per call, nested the way the calls nest.

## Sources

- [Compose runtime source: Composable.kt](https://github.com/androidx/androidx/blob/c13c6d0da6b9d595f72caad9fa1759c6a8aece83/compose/runtime/runtime/src/commonMain/kotlin/androidx/compose/runtime/Composable.kt#L24) ("Annotating a function or expression with [Composable] changes the type of that function or expression. For example, [Composable] functions can only ever be called from within another [Composable] function. A useful mental model for [Composable] functions is that an implicit "composable context" is passed into a [Composable] function")
- [Compose runtime source: Composer.kt](https://github.com/androidx/androidx/blob/c13c6d0da6b9d595f72caad9fa1759c6a8aece83/compose/runtime/runtime/src/commonMain/kotlin/androidx/compose/runtime/Composer.kt#L153) ("Composer is the interface that is targeted by the Compose Kotlin compiler plugin and used by code generation helpers. It is highly recommended that direct calls these be avoided as the runtime assumes that the calls are generated by the compiler")
- [Compose compiler plugin source: ComposableFunctionBodyTransformer.kt](https://github.com/JetBrains/kotlin/blob/445745fcddeb23e605547c2600a81472ef225c29/plugins/compose/compiler-hosted/src/main/java/androidx/compose/compiler/plugins/kotlin/lower/ComposableFunctionBodyTransformer.kt#L244) ("Generally speaking, every composable function *must* emit a single group when it executes. Every group can have any number of children groups."; its example rewrite: "@Composable fun A(x: Int, $composer: Composer<*>, $changed: Int) { $composer.startRestartGroup() … $composer.endRestartGroup()"; and the key, in sourceKey(): "hash = 31 * hash + (startOffset - currentFunctionScope.function.startOffset)")
- [Kotlin docs: Compose compiler migration guide](https://kotlinlang.org/docs/compose-compiler-migration-guide.html) ("The Compose compiler has been merged into the Kotlin repository since Kotlin 2.0.0"; "the Compose compiler ships simultaneously with Kotlin and will always be compatible with Kotlin of the same version")
- [Android Developers: Thinking in Compose](https://developer.android.com/develop/ui/compose/mental-model) ("This annotation informs the Compose compiler that this function is intended to convert data into UI.")
- [Kotlin docs: Coroutines basics](https://kotlinlang.org/docs/coroutines-basics.html) ("You can only call a suspending function from another suspending function.")
