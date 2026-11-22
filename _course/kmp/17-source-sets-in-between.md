---
title: Source sets in between
short: The default hierarchy
summary: In puzzle 16, every target got a source set of its own, and none of them was iosMain. Your iOS code is the same for a real iPhone and the simulator, and it shouldn't be written twice. Here's where iosMain really comes from.
takeaway: An intermediate source set is compiled for some, but not all, of a project's targets. The multiplatform plugin's default hierarchy template creates them for the targets you declare: iosMain above both iOS targets, appleMain above every Apple target, nativeMain above every Kotlin/Native target, all under commonMain. Building a target compiles every source set on its path up the tree.
---

## The problem

In puzzle 16, each target got its own platform source set: androidMain, iosArm64Main, iosSimulatorArm64Main. But the Kotlin you write for iOS is the same for a real iPhone and for the simulator. Put it in both iOS folders and every fix has to be made twice, the very problem this course started from in puzzle 0. And puzzle 1's iosMain wasn't in the list at all. Where does it come from?

## See it

```diagram hierarchy
```

## The building block

An **intermediate source set** is compiled for some of the project's targets, but not all. iosMain is one: it's compiled for both iOS targets, so code written there reaches a real iPhone and the simulator, and it's written once. That's where your iOS code goes. The platform source sets below it usually stay empty; Kotlin's docs call iosArm64Main "rarely used".

You don't create iosMain yourself. The multiplatform plugin carries a **default hierarchy template**: a built-in tree of intermediate source sets, from which it creates the ones that fit the targets you declared. For puzzle 16's three targets, that's this tree (each source set sits under the one it's compiled together with):

```text
commonMain
├── androidMain
└── nativeMain
    └── appleMain
        └── iosMain
            ├── iosArm64Main
            └── iosSimulatorArm64Main
```

Each level covers a wider group of targets:

| Source set | Compiled for |
|---|---|
| iosMain | every iOS target: iPhones and the simulator |
| appleMain | every Apple target: iPhone, Mac, Apple Watch, Apple TV |
| nativeMain | every Kotlin/Native target: Apple's, but also Linux and Windows |
| commonMain | every target |

A level only appears when you have a target for it. With no watch target, there's no watchosMain. Add one, such as watchosArm64, and the plugin creates watchosMain under appleMain, and the code in appleMain, nativeMain and commonMain is compiled for the watch too. The same tree exists for tests: commonTest, iosTest and so on.

The tree also tells you what each compilation from puzzle 16 takes in. To build a target, Kotlin collects every source set on that target's path up the tree. Building iosArm64 compiles iosArm64Main, iosMain, appleMain, nativeMain and commonMain together. androidMain isn't on that path, so it's never part of an iOS build.

## The analogy

The company from puzzle 1 groups its offices. There's the shared handbook for everyone (commonMain), a folder for every office in Asia (nativeMain), one for East Asia (appleMain), and one for Japan (iosMain), where the company has two offices: Tokyo, and the training office at headquarters (the simulator). A rule for Japan goes into the Japan folder once, not into each office's own folder. When an office prints its handbook, it binds in every folder on its line: shared, Asia, East Asia, Japan, then its own folder.

## Check yourself

- Your project declares the android, iosArm64 and iosSimulatorArm64 targets. You put a function in appleMain. Which builds compile it?::*Both iOS builds, but not the Android one||Only a Mac build, since appleMain is meant for Macs >> appleMain is for every Apple target in the project; here those are the two iOS targets. >> the-building-block||All three builds, since appleMain sits under commonMain >> Code reaches only the targets below it; Android isn't under appleMain. >> s6::Code reaches the targets below its source set.
- Why put your iOS code in iosMain rather than in iosArm64Main?::*Because iosMain is compiled for both iOS targets, so it's written once||Because iosArm64Main is where the iOS tests have to go >> It holds iosArm64's main code; tests go in the test source sets. >> s1||Because iosArm64Main is also compiled for the Android target >> A platform source set is compiled for exactly one target: here, iosArm64. >> s1::One place for every iOS target.
- Your project declares android, iosArm64 and iosSimulatorArm64. Your app gets a Mac version: you add a macosArm64 target, and the plugin creates macosMain. Which of your existing code is now compiled for the Mac too?::*The code in appleMain, nativeMain and commonMain, but not iosMain||Only commonMain's, since the Mac is a brand-new target >> macosMain lands under appleMain, like watchosMain would, so every level above it on the Mac's path is compiled for the Mac. >> the-building-block||iosMain's too, since a Mac is an Apple device like an iPhone >> iosMain is compiled only for iOS targets; macosMain sits beside it, under appleMain. >> s3::A new target compiles every source set on its path up the tree.

## Sources

- [Kotlin docs: The basics of Kotlin Multiplatform project structure](https://kotlinlang.org/docs/multiplatform/multiplatform-discover-project.html) ("An intermediate source set is a Kotlin source set that compiles to some, but not all of the targets in the project"; "there is no single ios target"; "Platform-specific source sets like iosArm64Main and iosSimulatorArm64Main are usually empty, as Kotlin code for iOS devices and simulators is normally the same. You can use only the iosMain intermediate source set to share code among all of them"; "iosArm64Main is therefore rarely used"; "During compilation to a specific target, Kotlin gets all of the source sets, including intermediate source sets, labeled with this target")
- [Kotlin docs: Source set hierarchy](https://kotlinlang.org/docs/multiplatform/multiplatform-hierarchy.html) ("The Kotlin Gradle plugin has a built-in default hierarchy template. It contains predefined intermediate source sets for some popular use cases. The plugin sets up those source sets automatically based on the targets specified in your project"; "If you add a watchOS target, like watchosArm64, the watchos source set is created, and the code from the apple, native, and common source sets is compiled to watchosArm64 as well"; "everything is the same for *Test sources as well")
