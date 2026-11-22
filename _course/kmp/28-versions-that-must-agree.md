---
title: What has to match
short: The Mac, Xcode and the iOS version
summary: Puzzle 27's Run Script works on your Mac. Then the build server, a Linux machine, can't make the framework; an iOS colleague updates Xcode and the Kotlin build breaks; and the app wants to run on an older iPhone than your framework. Here are the three things that must match, and where each is written down.
takeaway: Kotlin/Native builds final binaries for Apple targets only on a Mac; Linux and Windows can still produce klibs. Each Kotlin version is tested with one Xcode version, listed in Kotlin's compatibility table, so upgrade the two together. And a Kotlin framework supports iOS 15.0 and later by default, so the app's deployment target must be at least that, or you lower Kotlin's minimum on purpose.
---

## The problem

Puzzle 27's Run Script builds your framework on your Mac, every time Xcode builds. Then three things go wrong in one month. The team's build server, a Linux machine, runs the release task from puzzle 26 and fails. An iOS colleague installs the newest Xcode, and the Kotlin build starts failing on their Mac only. And the product team wants the app to keep running on iPhones with an older iOS than your framework was built for. None of this is about your Kotlin code. What has to match?

## See it

```diagram agree
```

## The building block

The first thing is the machine that runs the build, the **build host**. Kotlin's docs list which hosts can build what, and for Apple targets the split is exactly puzzle 23's two stages:

| Build host | Final binaries (the link stage) | klibs (the compile stage) |
|---|---|---|
| a Mac, Apple chip or Intel | any supported target | any supported target |
| Linux or Windows | any target except Apple's | Apple targets too, with one exception not taught yet |

The docs say it plainly: "Building final binaries for Apple targets on Linux and Windows is also not possible." So a build server can check and compile your shared code for iOS on Linux, but the job that links the framework or the XCFramework, and every iOS test run, needs a Mac.

The second thing is Xcode's version. Kotlin's docs say that "to compile Apple targets, you need to install Xcode and its command-line tools": the Kotlin build itself uses tools that come with Xcode. So each Kotlin version is tested with one Xcode version. Kotlin's compatibility guide keeps the table; two rows of it:

| Kotlin | Xcode it's tested with |
|---|---|
| 2.4.20–2.4.21 | 26.4 |
| 2.3.20–2.3.21 | 26.0 |

So when the iOS team moves to a new Xcode, check the table and move Kotlin with it; and when you upgrade Kotlin, check which Xcode it expects. Kotlin even removes targets to keep up: it deprecated one 32-bit watch target "to ensure compatibility with Xcode 27".

The third thing is the oldest iOS version. An iOS app has a **deployment target**: in Apple's words, "your app's minimum deployment target defines the range of operating system versions your app supports". Your Kotlin framework has a minimum of its own: by default, Kotlin builds Apple targets for iOS 15.0 and later. The app can't promise to run where its framework wasn't built to run, so keep the app's deployment target at 15.0 or higher. If the app really must support an older iOS, lower Kotlin's minimum on purpose, with a line Kotlin's docs give:

```kotlin
freeCompilerArgs += "-Xoverride-konan-properties=minVersion.ios=14.0"
```

## The analogy

The print shop from puzzle 23 only owns the presses for Apple's paper in one city, so the final print run happens there, though manuscripts can be typeset anywhere. Its presses are certified for one model of stitching machine at a time: when the restaurant's supplier changes the model, the shop upgrades too. And a cookbook printed for kitchens built after 2021 can't be promised to a restaurant whose oldest kitchen is from 2020, unless the shop prints a special edition.

## Check yourself

- Your build server runs Linux. Which of these can it still do for your iOS targets?::*Compile the shared code into klibs, the compile stage||Run linkReleaseFrameworkIosArm64 and produce the framework >> Final binaries for Apple targets can be built only on a Mac. >> s2||Nothing at all: Kotlin/Native doesn't run on Linux >> It runs on Linux, and can produce klibs for Apple targets; only the link stage for them needs a Mac. >> s2::Linux: klibs yes, Apple binaries no.
- An iOS colleague installs a newer Xcode than your Kotlin version is listed with, and the Kotlin build fails on their Mac only. Why does Xcode's version matter to a Kotlin build at all?::*Kotlin builds Apple targets with Xcode's tools, tested per version||It doesn't matter at all: the failure must come from their own Swift code >> The Kotlin build itself uses Xcode's tools, so a version it wasn't tested with can break it. >> the-building-block||Xcode first compiles the Kotlin code into Swift, then links the result >> Xcode never compiles Kotlin: Kotlin/Native does, then links with Xcode's tools. >> s3::Kotlin and Xcode versions move together.
- The app's deployment target is iOS 14.0, and your Kotlin framework uses Kotlin's default minimum. What's the problem, and one fix?::*The framework needs iOS 15.0: raise the app's target, or lower Kotlin's||None: an iOS 14 phone can run any framework an iOS 15 phone can run >> The framework was built for 15.0 and later, so it's not promised to work on 14. >> s5||The app must switch to a static framework to support iOS 14 phones >> Static or dynamic doesn't change which iOS versions the code was built for. >> the-building-block::The app can't support older iOS than its framework.

## Sources

- [Kotlin docs: Kotlin/Native target support](https://kotlinlang.org/docs/native-target-support.html) (hosts table: "macOS on Apple silicon (ARM64) Any supported target Any supported target"; "Linux with x86_64 architecture Any supported target, except for Apple targets Any supported target, Apple targets only without cinterop dependencies"; "Building final binaries for Apple targets on Linux and Windows is also not possible."; "Currently, the default minimum supported versions of Apple targets are: For iOS and tvOS, 15.0."; `freeCompilerArgs += "-Xoverride-konan-properties=minVersion.ios=14.0"`; "For example, you can run macosArm64 and iosArm64 tests only on the macOS ARM64 host")
- [Kotlin docs: Compatibility guide for Kotlin Multiplatform](https://kotlinlang.org/docs/multiplatform/multiplatform-compatibility-guide.html) ("check the compatibility of a particular version of the Kotlin Multiplatform Gradle plugin (same as the Kotlin version in your project) with Gradle, Xcode, and Android Gradle plugin versions"; table rows "2.4.20–2.4.21 7.6.3–9.7.0 8.5.2–9.3.1 26.4" and "2.3.20–2.3.21 7.6.3–9.3.0 8.2.2–9.0.0 26.0")
- [Kotlin docs: What's new in Kotlin 2.4.20](https://kotlinlang.org/docs/whatsnew2420.html) ("the watchosArm32 Kotlin/Native target is now deprecated. It's planned for removal in Kotlin 2.5.0 to ensure compatibility with Xcode 27")
- [Kotlin docs: Kotlin/Native overview](https://kotlinlang.org/docs/native-overview.html) ("To compile Apple targets, you need to install Xcode and its command-line tools.")
- [Apple: Running code on a specific platform or OS version](https://developer.apple.com/documentation/xcode/running-code-on-a-specific-version) ("Your app's minimum deployment target defines the range of operating system versions your app supports.")
