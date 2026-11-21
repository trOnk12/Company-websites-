---
title: Framework or XCFramework
short: One file per target, gathered
summary: Every framework from puzzle 23's link stage is built for one target. The iOS team builds for a real iPhone in the morning and for the simulator in the afternoon. Here's why one merged file can't serve both, and how an XCFramework does.
takeaway: A framework holds one target's binary. An older way to cover several targets is a universal framework, which merges binaries for different processor architectures into one file with lipo; but a real iPhone and the simulator on an Apple-chip Mac both use arm64, and a universal file can hold each architecture only once. An XCFramework instead keeps one framework per platform side by side, simulator builds included, static or dynamic, and Xcode picks the one that matches what it's building.
---

## The problem

Puzzle 23's link tasks are per target: `linkReleaseFrameworkIosArm64` makes a framework for real iPhones, and the simulator needs a second one, from the iosSimulatorArm64 target (puzzle 16). The iOS team runs the app on the simulator all afternoon and on a real iPhone before every release. Hand them two frameworks and ask them to swap the file each time? Or can the two become one?

## See it

```diagram xcf
```

## The building block

A framework from the link stage holds one target's binary, plus the header from puzzle 5 and a small file of settings, Info.plist. One framework, one target.

A processor's **architecture** is the family of instructions it understands. Puzzle 0's add instruction is an arm64 instruction: real iPhones and the simulator on a Mac with Apple's own chip both run arm64. An older Intel Mac runs x86-64 instead, the architecture of `iosX64` (puzzle 16).

The older way to ship several builds as one is a **universal framework**, also called a fat framework. A tool named `lipo` merges binaries for different architectures into one file, and the device loads the part for its own architecture. That worked when every target had its own architecture. Kotlin's docs say merging "especially makes sense for 32-bit and 64-bit iOS frameworks". Two limits followed:

- A universal file holds each architecture only once. A real iPhone build and an Apple-chip simulator build are both arm64, so they can't both go in. LLVM's version of `lipo` refuses with "have the same architecture … and therefore cannot be in the same universal binary".
- The parts an app doesn't need must be removed before it's sent to the App Store.

The current way is the **XCFramework**, from puzzle 12, now in full. It isn't one merged binary: it's a folder that keeps one framework per platform side by side, labelled as device or simulator. Apple's docs say it includes what's needed "to build for multiple platforms … including Simulator builds", and "the frameworks can be static or dynamic" (puzzle 25). When Xcode builds the app for the simulator, it takes the simulator's framework; for a real iPhone, the device's.

The multiplatform plugin builds one for you:

```kotlin
import org.jetbrains.kotlin.gradle.plugin.mpp.apple.XCFramework

kotlin {
    val xcf = XCFramework()
    listOf(iosArm64(), iosSimulatorArm64()).forEach {
        it.binaries.framework {
            baseName = "shared"
            xcf.add(this)
        }
    }
}
```

That adds Gradle tasks such as `assembleXCFramework`, which runs a link task for every target in it, then gathers the frameworks into one XCFramework. The cost is time: every target is linked, so it takes longer than building for the one platform you're running on (puzzle 28).

## The analogy

A shop that sells a manual in two editions. Gluing both editions into one book works when each is in a different language, since each reader opens their own half. But two editions in the same language can't share one cover: the reader couldn't tell which half is theirs. So the shop sells a box with both books standing side by side, each labelled, and every reader takes the one for their machine.

## Check yourself

- You try to merge the iosArm64 framework and the iosSimulatorArm64 framework into one universal framework with `lipo`. What happens?::*It refuses: both are arm64, and a universal file holds each architecture once||It works, and the device and simulator each load their half >> The halves are told apart by architecture, and these two have the same one. >> s3||It works, but the simulator runs the device's code more slowly >> lipo can't put both in at all, since they share one architecture. >> s3::Same architecture, two platforms: lipo can't help.
- Why can an XCFramework hold the device and simulator builds when a universal framework can't?::*It keeps a separate framework for each platform, side by side||It converts the simulator build to x86-64, so the architectures differ >> Nothing is converted: an XCFramework keeps each framework as it was built. >> s4||It holds one framework built for both targets in a single compilation >> Each target is still compiled and linked on its own; the XCFramework only gathers them. >> s4::Side by side, not merged.
- Your project's XCFramework contains iosArm64 and iosSimulatorArm64. An iOS developer with an older Intel Mac says the app won't build for their simulator. What's missing?::*An iosX64 framework: an Intel Mac's simulator runs x86-64||Nothing: an XCFramework serves every Mac >> It serves only the platforms it contains; an Intel Mac's simulator needs an x86-64 build. >> s2||A universal framework, since an XCFramework can't hold simulator builds >> XCFrameworks hold simulator builds; this one lacks the x86-64 one. >> s5::Each platform needs its own framework inside.

## Sources

- [Kotlin docs: Build final native binaries](https://kotlinlang.org/docs/multiplatform/multiplatform-build-native-binaries.html) ("By default, an Objective-C framework produced by Kotlin/Native supports only one platform. However, you can merge such frameworks into a single universal (fat) binary using the lipo tool. This operation especially makes sense for 32-bit and 64-bit iOS frameworks."; "Unlike universal (fat) frameworks, you don't need to remove all unnecessary architectures before publishing the application to the App Store."; the `XCFramework()` and `xcf.add(this)` example; tasks "assembleXCFramework", "assemble<Framework name>DebugXCFramework", "assemble<Framework name>ReleaseXCFramework"; "When producing a framework, the Kotlin/Native compiler generates the information property list file, Info.plist")
- [Apple: Creating a multiplatform binary framework bundle](https://developer.apple.com/documentation/xcode/creating-a-multi-platform-binary-framework-bundle) ("An XCFramework bundle, or artifact, is a binary package created by Xcode that includes the frameworks and libraries necessary to build for multiple platforms (iOS, iPadOS, macOS, tvOS, visionOS, watchOS, and DriverKit), including Simulator builds. The frameworks can be static or dynamic and also include headers.")
- [Kotlin docs: Kotlin/Native target support](https://kotlinlang.org/docs/native-target-support.html) (iosArm64: "aarch64-apple-ios", "Apple iOS and iPadOS 15.0 and later on ARM64 platforms"; iosSimulatorArm64: "aarch64-apple-ios-simulator", "Apple iOS simulator 15.0 and later on Apple Silicon platforms"; iosX64: "x86_64-apple-ios-simulator")
- [LLVM's lipo, llvm-project on GitHub](https://github.com/llvm/llvm-project/blob/main/llvm/tools/llvm-lipo/llvm-lipo.cpp) (error text: "have the same architecture " … " and therefore cannot be in the same universal binary")
