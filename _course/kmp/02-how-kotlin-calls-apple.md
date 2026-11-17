---
title: How Kotlin calls Apple
short: Platform libraries
summary: In iosMain, your Kotlin can call Apple's own code, like the class that knows the device's name. But Apple's code isn't Kotlin. Here's how Kotlin/Native makes it callable.
takeaway: Kotlin/Native ships platform libraries: prebuilt Kotlin bindings for each target's native libraries. On Apple targets they cover Apple's frameworks, such as Foundation and UIKit, so code in iosMain can import platform.UIKit.UIDevice and call it like Kotlin. They exist only on Apple targets, which is why such calls live in iosMain, never in commonMain.
---

## The problem

Puzzle 1 said iosMain can use what only iOS has. On iOS, the device's name and system version come from an Apple class called `UIDevice`. Apple wrote it for its own languages, not for Kotlin. So how can a Kotlin file in iosMain call it?

## See it

```diagram platform
```

## The building block

Apple's code is grouped into **frameworks**: bundles of ready-made code for one area. Foundation has basics like dates, text and unique IDs; **UIKit** has everything about screens, including `UIDevice`.

Kotlin can't read those frameworks directly. So Kotlin/Native ships **platform libraries**: prebuilt Kotlin descriptions, called bindings, of each target's native libraries. For Apple targets they cover Apple's frameworks. The packages are there by default, under `platform.`:

```kotlin
// iosMain
import platform.UIKit.UIDevice

fun systemName(): String = UIDevice.currentDevice.systemName
```

When you compile, Kotlin/Native sees which ones you used and links Apple's real code in.

Two consequences:

- These bindings exist only for Apple targets. That's why `import platform.UIKit` works in iosMain and fails in commonMain (puzzle 1's rule: common code may use only what every target has).
- The names and shapes are Apple's, not Kotlin's: `UIDevice.currentDevice` reads a little foreign. That's normal.

## The analogy

A phrasebook for a country whose language you don't speak. You don't learn the language; you look up the phrase and say it, and you're understood. Each target comes with its own phrasebook, and the Apple one only works in Apple's countries.

## Check yourself

- Why does `import platform.UIKit.UIDevice` fail in commonMain?::*The binding exists only for Apple targets||UIKit is too large to compile into common code >> Size isn't the issue; Android has no UIKit at all. >> s4||commonMain can't import any library at all >> Common code can use libraries built for every target. >> s4::Apple bindings, Apple targets only.
- Who wrote the Kotlin binding for `UIDevice`?::*Kotlin/Native ships it, prebuilt, as part of its platform libraries||You do, by writing a Kotlin wrapper for each Apple class >> You don't have to; Apple's bindings come prebuilt. >> s2||Apple publishes Kotlin versions of its frameworks >> Apple doesn't; the Kotlin/Native distribution includes them. >> s2::Prebuilt, shipped with Kotlin/Native.
- What's the difference between a framework and a platform library?::*A framework is Apple's own code, while a platform library is Kotlin's binding to it||A framework is Kotlin's binding to Apple code, while a platform library is Apple's own code >> That's the two swapped. >> the-building-block::The real code vs Kotlin's way in.

## Sources

- [Kotlin docs: Platform libraries](https://kotlinlang.org/docs/native-platform-libs.html) ("To provide access to native services of operating systems, the Kotlin/Native distribution includes a set of prebuilt libraries specific to each target. These are called platform libraries. The packages from platform libraries are available by default"; "The Kotlin/Native compiler automatically detects which platform libraries are accessed and links the necessary ones")
- [Kotlin docs: The basics of a Multiplatform project](https://kotlinlang.org/docs/multiplatform/multiplatform-discover-project.html) (an Apple source set using `import platform.Foundation.NSUUID`)
