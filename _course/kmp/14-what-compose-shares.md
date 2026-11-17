---
title: What Compose actually shares
short: Compose Multiplatform
summary: One set of Compose UI code runs on Android and on iOS. "Same code" hides three layers. Here's which ones are shared, and the one that's written again for every platform.
takeaway: Compose Multiplatform shares the Compose compiler and runtime with Jetpack Compose, and the same APIs. On Android your build uses Google's Jetpack Compose artifacts; on iOS, desktop and web it uses JetBrains' builds of the same libraries. What's written per target is the platform layer: window, touches, drawing surface, text input and accessibility.
---

## The problem

You wrote a `@Composable` screen in `commonMain`. On Android it shows your list; on an iPhone it shows the same list. But Jetpack Compose was built for Android: it draws through Android's own screen classes and reads Android touch events. So what exactly runs on the iPhone, and which part had to be written again?

## See it

```diagram layers
```

## The building block

Think of Compose as three layers.

At the bottom, the **Compose runtime** and the Compose compiler plugin. The compiler turns your `@Composable` functions into code that records what they showed. The runtime tracks state, such as what you `remember`, and decides what to recompose when it changes. Neither knows anything about pixels or Android, and **Compose Multiplatform** shares both with Jetpack Compose.

In the middle, the libraries you call: ui, foundation, material3. `Text`, `Column`, `LazyColumn` and `Modifier` are the same APIs on every target. On Android your build uses Google's Jetpack Compose artifacts. On iOS, desktop and web it uses JetBrains' builds of the same libraries. The Gradle plugin picks for you.

At the top, the **platform layer**: the part written per target. It's the window your UI lives in, how touches arrive, the surface the UI is drawn onto, the keyboard and text input, and what accessibility tools such as **VoiceOver**, iOS's screen reader, are told. That's the thin part JetBrains rewrote for iOS, and it's where platform differences show.

Some APIs never leave Android: anything that needs a `Context`, such as `LocalContext`, or Android resources through `R`. They stay in `androidMain`.

## The analogy

A play staged in two theatres. The script and the actors (runtime and libraries) travel. Each theatre has its own stage, lights and doors (the platform layer), so the same scene can feel slightly different in each.

## Check yourself

- Your app targets Android and iOS with Compose Multiplatform. Which build of `material3` does the Android app use?::*Google's Jetpack Compose build||JetBrains' build of the library, the same one the iOS target uses >> On Android the build switches to Google's artifacts; JetBrains' builds are for the other targets. >> s2||No build at all, since material3 can't be called from commonMain >> material3 is available from common code on all targets. >> s2::Android gets Google's artifacts.
- Which part of Compose had to be rewritten to run on iOS?::*The platform layer, the part that meets the phone||The runtime, because iOS has no garbage collector to free state >> The runtime is shared; puzzle 9 showed Kotlin/Native has its own GC. >> s1||The `@Composable` functions you wrote in commonMain >> Your composables are common code; they run unchanged. >> s3::Only the top layer is per platform.
- What's the difference between the Compose runtime and the platform layer?::*The runtime tracks state, while the platform layer turns it into pixels and input||The runtime draws the pixels, while the platform layer stores and tracks state >> It's the other way round: the runtime knows nothing about pixels. >> s1::State vs pixels and input.

## Sources

- [Kotlin docs: Compose Multiplatform and Jetpack Compose](https://kotlinlang.org/docs/multiplatform/compose-multiplatform-and-jetpack-compose.html) ("It shares the Compose compiler and runtime with Jetpack Compose and uses the same APIs"; "When you build your Compose Multiplatform application for Android, you use the Jetpack Compose artifacts published by Google. For example, if you add compose.material3 to your dependencies, your project will use androidx.compose.material3:material3 in the Android target, and org.jetbrains.compose.material3:material3 in other targets.")
