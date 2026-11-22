---
title: Framework or XCFramework
short: One file per target, gathered
summary: Every framework from puzzle 23's link stage is built for one target. The iOS team builds for a real iPhone in the morning and for the simulator in the afternoon. Here's why one merged file can't serve both, how an XCFramework does, and where the build puts each file.
takeaway: A framework holds one target's binary. lipo can merge binaries for different architectures into one universal file, but a real iPhone and the simulator on an Apple-chip Mac both use arm64, and a universal file holds each architecture once; Apple also says never to merge device and simulator builds. An XCFramework keeps one slot per platform, device and simulator, side by side; inside the simulator slot, builds for different architectures are merged into one universal binary. Xcode picks the slot that matches what it's building.
---

## The problem

Puzzle 23's link tasks are per target: `linkReleaseFrameworkIosArm64` makes a framework for real iPhones, and the simulator needs a second one, from the iosSimulatorArm64 target (puzzle 16). The iOS team runs the app on the simulator all afternoon and on a real iPhone before every release. Hand them two frameworks and ask them to swap the file each time? Or can the two become one?

## See it

```diagram xcf
```

## The building block

A framework from the link stage holds one target's binary, plus the header from puzzle 5 and a small file of settings, Info.plist. One framework, one target. Each link task writes its framework under the module's build folder: `linkReleaseFrameworkIosArm64` writes build/bin/iosArm64/releaseFramework/shared.framework, and the debug task writes debugFramework beside it. Info.plist names the framework with a bundle ID, and you can set it with one line in the framework block, `binaryOption("bundleId", "com.example.shared")`.

A processor's **architecture** is the family of instructions it understands. Puzzle 0's add instruction is an arm64 instruction: real iPhones and the simulator on a Mac with Apple's own chip both run arm64. An older Intel Mac runs x86-64 instead, the architecture of `iosX64` (puzzle 16).

The older way to ship several builds as one is a **universal framework**, also called a fat framework. A tool named `lipo` merges binaries for different architectures into one file, and the device loads the part, or slice, for its own architecture. That worked when every target had its own architecture; Kotlin's docs say merging "especially makes sense for 32-bit and 64-bit iOS frameworks". Two limits followed:

- A universal file holds each architecture only once. A real iPhone build and an Apple-chip simulator build are both arm64, so they can't both go in.
- Even when the architectures differ, device and simulator builds must stay apart. Apple: "Avoid using tools such as lipo to combine architecture slices built for iOS and iOS Simulator into a single binary."

The current way is the **XCFramework**, from puzzle 12, now in full. It's a folder with one slot per platform, labelled device or simulator, each holding a framework. Apple's docs say it includes what's needed "to build for multiple platforms … including Simulator builds", and "the frameworks can be static or dynamic" (puzzle 25). When Xcode builds the app for the simulator, it takes the simulator slot; for a real iPhone, the device slot.

lipo isn't gone, though: it works inside a slot. All simulators are one platform, so if you also declare iosX64, the plugin merges the x86-64 and arm64 simulator builds with lipo into one universal binary in the simulator slot. Apple describes exactly that: "The universal binary for Simulator includes slices for x86_64 and ARM64 for Apple silicon." Only device and simulator stay separate.

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

That adds Gradle tasks named after the XCFramework, by default the module's name: in a module called shared, `assembleSharedReleaseXCFramework` and `assembleSharedDebugXCFramework`, plus `assembleXCFramework`, which builds both. Each runs a link task for every target in it, then gathers the frameworks. The release one writes build/XCFrameworks/release/shared.xcframework. The cost is time: every target is linked, so it takes longer than building for the one platform you're running on (puzzle 30).

## The analogy

A shop that sells a manual in editions for different machines. Gluing two editions into one book works when each is in a different language, since each reader opens their own half. But two editions in the same language can't share one cover: the reader couldn't tell which half is theirs. So the shop sells a box with one shelf for workshop machines and one for training machines, each labelled. On the training shelf, the editions for the old and the new training machine are glued into one book, since they're in different languages; every reader takes the book from their shelf.

## Check yourself

- You try to merge the iosArm64 framework and the iosSimulatorArm64 framework into one universal framework with `lipo`. What happens?::*It can't hold both: they're both arm64, and a universal file holds each architecture once||It works, and the device and simulator each load their half >> The halves are told apart by architecture, and these two have the same one. >> s3||It works, but the simulator runs the device's code more slowly >> lipo can't put both in at all, since they share one architecture; and Apple says never to merge device and simulator builds anyway. >> s3::Same architecture, two platforms: lipo can't help.
- Why can an XCFramework hold the device and simulator builds when a universal framework can't?::*It gives each platform its own slot, so the two builds never share one file||It converts the simulator build to x86-64, so the architectures differ >> Nothing is converted: each slot keeps the builds as they were made. >> s4||It holds one framework built for both targets in a single compilation >> Each target is still compiled and linked on its own; the XCFramework only gathers them. >> s4::A slot per platform, side by side.
- Your project's XCFramework contains iosArm64 and iosSimulatorArm64. An iOS developer with an older Intel Mac says the app won't build for their simulator. What fixes it?::*Declaring iosX64, which the plugin merges with the arm64 build into the simulator slot||Adding a third slot, beside the two, for the x86-64 simulator >> All simulators are one platform: their builds share the simulator slot, merged into one universal binary. >> s5||Nothing: an XCFramework serves every Mac >> It serves only the architectures it contains; the simulator slot has no x86-64 slice yet. >> s5::Inside one slot, lipo merges architectures.

## Sources

- [Kotlin docs: Build final native binaries](https://kotlinlang.org/docs/multiplatform/multiplatform-build-native-binaries.html) ("By default, an Objective-C framework produced by Kotlin/Native supports only one platform. However, you can merge such frameworks into a single universal (fat) binary using the lipo tool. This operation especially makes sense for 32-bit and 64-bit iOS frameworks."; "Unlike universal (fat) frameworks, you don't need to remove all unnecessary architectures before publishing the application to the App Store."; the `XCFramework()` and `xcf.add(this)` example; tasks "assembleXCFramework", "assemble<Framework name>DebugXCFramework", "assemble<Framework name>ReleaseXCFramework"; "When producing a framework, the Kotlin/Native compiler generates the information property list file, Info.plist"; the binary option "bundleId" for the property "CFBundleIdentifier", set with `binaryOption("bundleId", "com.example.app")`)
- [Apple: Creating a multiplatform binary framework bundle](https://developer.apple.com/documentation/xcode/creating-a-multi-platform-binary-framework-bundle) ("An XCFramework bundle, or artifact, is a binary package created by Xcode that includes the frameworks and libraries necessary to build for multiple platforms (iOS, iPadOS, macOS, tvOS, visionOS, watchOS, and DriverKit), including Simulator builds. The frameworks can be static or dynamic and also include headers.")
- [Kotlin docs: Kotlin/Native target support](https://kotlinlang.org/docs/native-target-support.html) (iosArm64: "aarch64-apple-ios", "Apple iOS and iPadOS 15.0 and later on ARM64 platforms"; iosSimulatorArm64: "aarch64-apple-ios-simulator", "Apple iOS simulator 15.0 and later on Apple Silicon platforms"; iosX64: "x86_64-apple-ios-simulator")
- [Apple: Creating a multiplatform binary framework bundle](https://developer.apple.com/documentation/xcode/creating-a-multi-platform-binary-framework-bundle), its advice on architectures ("Avoid using tools such as lipo to combine architecture slices built for iOS and iOS Simulator into a single binary."; "The universal binary for Simulator includes slices for x86_64 and ARM64 for Apple silicon.")
- [Kotlin Gradle plugin source, Kotlin 2.4.21: XCFrameworkTask.kt](https://github.com/JetBrains/kotlin/blob/9180ce6a7a7d3627f88b424717583f28ddca052d/libraries/tools/kotlin-gradle-plugin/src/common/kotlin/org/jetbrains/kotlin/gradle/plugin/mpp/apple/XCFrameworkTask.kt#L51) (the simulator slot groups two targets, `IPHONE_SIMULATOR("iosSimulator", listOf(KonanTarget.IOS_X64, KonanTarget.IOS_SIMULATOR_ARM64))`, merged by a `FatFrameworkTask`; the output folder is `projectBuildDir.resolve("XCFrameworks")`, then the build type, then `${xcFrameworkName.get()}.xcframework`; `fun Project.XCFramework(xcFrameworkName: String = name)`)
- [Kotlin docs: Kotlin/Native as an Apple framework, tutorial](https://kotlinlang.org/docs/apple-framework.html) ("The build generates the framework into the build/bin/<yourTargetName>/debugFramework directory.")
