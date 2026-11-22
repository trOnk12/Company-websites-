---
title: The kotlin { } block
short: Targets and compilations
summary: Puzzle 1 said, in passing, that you list the targets in the build file. You use Gradle every day, but a shared module's build file has a block you've never written. Here's what it declares, and why "Android and iOS" means three targets.
takeaway: The kotlin { } block, read by the multiplatform plugin, declares the module's targets. iOS needs at least two, iosArm64 for real iPhones and iosSimulatorArm64 for the simulator on a Mac, because each target is one exact kind of binary. Every target gets its own platform source set, named after it, and is built by compilations, one compiler run each: main for your code, test for your tests.
---

## The problem

Puzzle 1 put your code into source sets and said, in passing, that you list the targets in the build file. In an Android module you know that file by heart: `plugins { }`, `android { }`, `dependencies { }`. A shared module's build.gradle.kts has a block you've never written, and it lists three targets for an app that runs on "Android and iOS". What does that block declare, and where does each line lead?

## See it

```diagram kblock
```

## The building block

The **multiplatform plugin**, `kotlin("multiplatform")`, is a Gradle plugin like the Android one you already apply. It reads the `kotlin { }` block, where each line declares one target:

```kotlin
// shared/build.gradle.kts
plugins {
    kotlin("multiplatform")
    id("com.android.kotlin.multiplatform.library")
}

kotlin {
    android {
        namespace = "com.example.shared"
        compileSdk = 36
        minSdk = 24
    }
    iosArm64()
    iosSimulatorArm64()
}
```

Android's line is a block because the Android target needs what every Android module needs: a namespace and SDK levels. It comes from Android's own plugin for shared modules, the second line under `plugins`. (Before version 8.12 of that plugin, the block was called `androidLibrary { }`.)

Most existing projects don't use that plugin yet. They apply Android's ordinary library plugin, `com.android.library`, keep a separate `android { }` block for the namespace and SDK levels, and declare the target inside `kotlin { }` with `androidTarget()`. Kotlin's docs call it the way before version 2.3.0. It still works in Kotlin 2.4 (2.3.0 warned about `androidTarget`, 2.3.10 took the warning back), but the docs recommend moving to the new plugin and renaming `androidTarget` to `android`. Both setups declare the same Android target.

iOS takes two lines. Puzzle 0 called iOS one target; that was a simplification, and here is the full picture. A target is one exact kind of binary, the finished file of machine code that one kind of device loads and runs, and an iPhone and the simulator need different ones. The simulator is Apple's stand-in iPhone that runs on your Mac, like the Android emulator. `iosArm64` builds for real iPhones; `iosSimulatorArm64` builds for the simulator on a Mac with Apple's own chip. An older Mac with an Intel chip needs a third iOS target, `iosX64`, but Kotlin now keeps it in its lowest support tier, Tier 3 ("not guaranteed to be tested"), and the other Intel targets for Apple, macosX64, tvosX64 and watchosX64, have been deprecated since Kotlin 2.3.20. Declare only the device target, and Kotlin's docs warn you can't run your app or its tests on your own machine.

Every target gets a **platform source set**: a source set compiled for that one target, named after it. Android's is androidMain, the one puzzle 1 showed. The iOS targets get iosArm64Main and iosSimulatorArm64Main.

And every target is built by **compilations**. A compilation is one compiler run for one target, over every source set that target uses. Each iOS target has two by default: main, for your code, and test, for your tests, which live in commonTest (tests for every target) and the target's own test source set, such as iosArm64Test. Android's compilations are set up by Android's own plugin instead, but play the same two roles.

So the main compilation of `iosArm64` takes commonMain and iosArm64Main and compiles them together. (That's still slightly simplified: the next puzzle adds the source sets in between.) Notice what's missing from the list: there's no iosMain, because no target is called ios. The next puzzle shows where it comes from.

## The analogy

The company from puzzle 1 opens offices: the `kotlin { }` block is the list. "iOS" turns out to be two offices: the real one downtown, and a training office inside headquarters, where staff practise on a stand-in (the simulator). Each office keeps its own local folder (its platform source set), and each prints its handbook in two editions: one for staff, one for the inspectors who test it (the main and test compilations).

## Check yourself

- You declare only `iosArm64()` for iOS, then try to run the shared tests in the simulator on your Mac. What happens?::*No binary is built for the simulator, so there's nothing that runs on your Mac||They run, because `iosArm64` covers every iPhone, real or simulated >> A target is one exact kind of binary; the simulator needs its own, iosSimulatorArm64. >> s2||Only the commonTest tests run, since they're compiled for every target >> commonTest is compiled per declared target; with no simulator target there's no binary for the simulator at all. >> s4::Device and simulator are two different targets.
- Why does a module that runs on "Android and iOS" declare three targets?::*Because an iPhone and the simulator on a Mac each need their own binary||Because one iOS target compiles the Kotlin and the other compiles the Swift >> Both iOS targets compile your Kotlin; they differ in where the binary runs. >> s2||Because Gradle keeps a spare target in case one of the builds fails >> There's no spare: every target produces its own binary, for its own machine. >> s2::One target per kind of binary.
- Your project declares android, iosArm64 and iosSimulatorArm64, and you add a test to commonTest. You run the iOS tests in the simulator on your Apple-chip Mac. Which compilation builds them?::*iosSimulatorArm64's test compilation, over commonTest and iosSimulatorArm64Test||iosArm64's test compilation, since commonTest is shared by every iOS target >> commonTest is shared, but each target compiles it in its own compilation, and the simulator needs its own binary. >> s2||One test compilation for all three targets, since commonTest is written once >> A compilation is one compiler run for one target; commonTest is compiled again by each target's test compilation. >> s4::One compilation per target: the simulator's own test run.

## Sources

- [Kotlin docs: The basics of Kotlin Multiplatform project structure](https://kotlinlang.org/docs/multiplatform/multiplatform-discover-project.html) ("In Gradle, you declare targets using predefined DSL calls inside the kotlin {} block"; "Device target is used to generate binaries that can be executed on iOS devices"; "Simulator target is used to generate binaries for the iOS simulator launched on your machine. If you have an Apple silicon Mac computer, choose iosSimulatorArm64 as a simulator target"; "If you declare only the iosArm64 device target, you won't be able to run and debug your application and tests on your local machine"; "Each target has a corresponding platform source set that compiles for only that target")
- [Kotlin docs: Multiplatform Gradle DSL reference](https://kotlinlang.org/docs/multiplatform/multiplatform-dsl-reference.html) ("The fully qualified name of the Kotlin Multiplatform Gradle plugin is org.jetbrains.kotlin.multiplatform"; "Each target can have one or more compilations"; "Predefined compilations are created automatically for each target of a project except for Android targets")
- [Kotlin docs: Advanced concepts of the multiplatform project structure](https://kotlinlang.org/docs/multiplatform/multiplatform-advanced-project-structure.html) ("Kotlin Multiplatform projects require multiple compiler launches to build all the artifacts. Each compiler launch is a Kotlin compilation"; "By default, Kotlin creates two compilations for each target, the main compilation for production sources and the test compilation for test sources")
- [Kotlin docs: Kotlin/Native target support](https://kotlinlang.org/docs/native-target-support.html) (iosX64, listed under Tier 3: "Apple iOS simulator 15.0 and later on x86-64 platforms"; Tier 3: "The target is not guaranteed to be tested on CI"; deprecated targets with their deprecation start: "macosX64 Kotlin 2.3.20", "watchosX64 Kotlin 2.3.20", "tvosX64 Kotlin 2.3.20")
- [Kotlin docs: Compatibility guide for Kotlin Multiplatform](https://kotlinlang.org/docs/multiplatform/multiplatform-compatibility-guide.html) ("Before Kotlin 2.3.0, we provided support for the Android target through the com.android.application and com.android.library plugins"; "Migrate to the new com.android.kotlin.multiplatform.library plugin. Rename all occurrences of the androidTarget block to android."; "2.3.10: revert the deprecation warning when the androidTarget name is used in Kotlin Multiplatform projects")
- [Android docs: Set up the Android Gradle Library Plugin for KMP](https://developer.android.com/kotlin/multiplatform/plugin) ("Within the kotlin block, specify the Android target using android"; "Starting with AGP 8.12.0, a new android{} block was introduced to replace androidLibrary{}")
