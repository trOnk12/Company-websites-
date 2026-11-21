---
title: Dependencies per source set
short: Where a library line goes
summary: In an Android module, every library goes into one dependencies block for the whole module. In a shared module, the source set you add a library to decides which code can use it. Here's where each kind of library goes.
takeaway: Each source set has its own dependencies block, and a library added to a source set flows down to every source set below it. commonMain may only take multiplatform libraries, published for all of its targets with one common API. A library built for one platform goes into that platform's source set, such as androidMain or iosMain.
---

## The problem

Puzzle 18 said a source set sees the code above it. Your shared code needs libraries too: an HTTP client everywhere, Android's OkHttp underneath it on Android, Apple's own networking on iOS. In an Android module, you'd add all of them to the one `dependencies { }` block, and every class in the module could use every library. Where do they go when the module is compiled for three targets, and some libraries only exist on one of them?

## See it

```diagram deps
```

## The building block

Each source set has its own dependencies, declared inside `kotlin { }`:

```kotlin
kotlin {
    // the targets from puzzle 16 …
    sourceSets {
        commonMain.dependencies {
            implementation("io.ktor:ktor-client-core:3.6.1")
            implementation(project(":core"))
        }
        androidMain.dependencies {
            implementation("io.ktor:ktor-client-okhttp:3.6.1")
        }
        iosMain.dependencies {
            implementation("io.ktor:ktor-client-darwin:3.6.1")
        }
        commonTest.dependencies {
            implementation(kotlin("test"))
        }
    }
}
```

You can write `iosMain.dependencies` without creating iosMain: the default template from puzzle 17 already made it, and the plugin gives every template source set a name you can use in the build file.

A library added to a source set **flows down** the `dependsOn` links from puzzle 18: every source set below gets it too. Ktor's core, added to commonMain once, can be used in androidMain, nativeMain, appleMain, iosMain and both iOS platform source sets. Add a library to iosMain instead, and only the iOS source sets can use it. The one library you never add is Kotlin's standard library: every source set gets it automatically.

commonMain only accepts a **multiplatform library**: one published for all of commonMain's targets, with one common API that common code can call. Kotlin's coroutines, Ktor's core and SQLDelight are multiplatform libraries. A library built for one platform only goes into that platform's source set. Ktor shows both kinds: the part that actually sends requests is per platform, ktor-client-okhttp for Android (built on OkHttp, a library for the JVM and Android) and ktor-client-darwin for Apple's systems (built on Apple's own networking). Put the OkHttp part in commonMain and the build fails: commonMain must compile for iOS too, and that part has nothing for iOS.

Two more lines in the code above. The `kotlin("test")` line in commonTest gives every test source set Kotlin's multiplatform test library. And the project(":core") line adds another multiplatform module of your own, the same way: one line in commonMain, and each target's build gets that module's part for its target. How one line finds the right part for each target is puzzle 21.

## The analogy

Supplies for the offices from puzzle 17. A supply ordered for the shared handbook's level reaches every office below it, so it must be something every country can use, like a standard pen. A local supply, like a plug adapter that only fits Japan's wall plugs, is ordered at the Japan folder's level, and only offices under it receive it. Order the adapter for everyone and the order fails: France can't use it.

## Check yourself

- You add OkHttp, a library built only for the JVM and Android, to `commonMain.dependencies`. What happens when you build for iOS?::*It fails, because commonMain must compile for iOS and OkHttp has nothing for it||It works, because Kotlin/Native rebuilds OkHttp for the iPhone >> A library arrives already built for its platforms; Kotlin/Native can't make an iOS one from it. >> s5||It works on Android, and on iOS the OkHttp calls are skipped >> commonMain is compiled for every target; nothing is skipped on iOS, it just doesn't compile. >> s5::commonMain takes only libraries built for all its targets.
- Why can iosMain use a library you added only to commonMain?::*Because a library added to a source set flows down to every one below it||Because iosMain copies commonMain's build file when the project is built >> There's no copy: the library flows down the dependsOn links. >> s2||Because the library is part of Kotlin, which every source set gets for free >> Only the standard library comes for free; this one you added yourself. >> the-building-block::Libraries flow down the links.
- What's the difference between a multiplatform library and a library built for one platform?::*The first can go into commonMain, while the second only into its platform's source set||The first is written in Kotlin, while the second is written in Java >> The language isn't it: a Kotlin library built only for Android can't go into commonMain either. >> the-building-block||The first works only in commonMain, while the second works in any source set >> The other way round: a multiplatform library added to commonMain reaches every source set below. >> s2::Where each one may go.

## Sources

- [Kotlin docs: Adding dependencies on multiplatform libraries](https://kotlinlang.org/docs/multiplatform/multiplatform-add-dependencies.html) ("The main difference is that you need to add the dependency to a specific source set rather than to the module as a whole"; "Multiplatform dependencies. These are multiplatform libraries that support multiple targets and can be used in the common source set"; "The common source set can't depend on platform-specific artifacts: common code needs to compile for every declared target"; "Each source set in a Kotlin Multiplatform project automatically depends on the Kotlin standard library"; "Makes kotlin.test classes available in all test source sets")
- [Kotlin docs: Advanced concepts of the multiplatform project structure](https://kotlinlang.org/docs/multiplatform/multiplatform-advanced-project-structure.html) ("Multiplatform dependencies are propagated down the dependsOn structure. When you add a dependency to commonMain, it will be automatically added to all source sets that declare dependsOn relations directly or indirectly in commonMain")
- [Kotlin docs: Source set hierarchy](https://kotlinlang.org/docs/multiplatform/multiplatform-hierarchy.html) ("The Kotlin Gradle plugin provides both type-safe and static accessors for all of the source sets from the default hierarchy template")
- [Ktor docs: Client engines](https://ktor.io/docs/client-engines.html) ("For multiplatform projects, you can use Ktor's default engines or select specific engines for individual targets"; supported platforms: "OkHttp JVM, Android Darwin Native"; "The Darwin engine targets Darwin-based operating systems, such as macOS, iOS, tvOS, and watchOS. It uses NSURLSession under the hood")
