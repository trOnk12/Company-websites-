---
title: Who can see what
short: Up the tree, never down
summary: Puzzle 17 built a tree of source sets. Code in iosMain calls functions in commonMain all the time. Can commonMain call one in iosMain? And which of Apple's APIs may appleMain use? Here's the rule behind both answers.
takeaway: Each source set dependsOn the one above it, and that link goes one way. A source set sees the code above it, internal declarations included, and can keep the expect promises made there; it never sees down or sideways. And it may use only the APIs that all of its targets have, which is why commonMain, compiled for Android too, can never call UIKit, while iosMain can.
---

## The problem

Puzzle 1 said common code can't call Apple's APIs, and puzzle 2 that Apple's bindings exist only on Apple targets. Puzzle 17 put four more source sets on the way to iOS, and they compile together. So may iosMain call a function in appleMain? May appleMain call one in iosMain? May nativeMain, which sounds like it's for Linux and Windows too, use UIKit?

## See it

```diagram visibility
```

## The building block

Puzzle 17's arrows are links called `dependsOn`: iosArm64Main dependsOn iosMain, iosMain dependsOn appleMain, and so on up to commonMain. When a source set dependsOn another, three things follow:

- It sees that one's code, `internal` declarations included, and through it, everything further up.
- It can keep that one's expect promises. That's why puzzle 3's actual for iOS can live in iosMain: both iOS platform source sets depend on iosMain, so one actual serves both targets.
- It gets that one's libraries (the next puzzle).

The template from puzzle 17 sets every link for you. You rarely write one: a `dependsOn` written by hand in the build file switches the default template off, and then you must build the whole tree yourself.

The links go one way, and that's the first rule. A source set sees up, never down and never sideways. commonMain can't call iosMain's code: commonMain is compiled for Android too, and on Android that code doesn't exist. And iosMain can't call androidMain's: they're never compiled together, so for each, the other isn't there.

The second rule is about the platforms' own APIs, the ones puzzle 2's platform libraries bring: a source set may use only the APIs that all of its targets have. Kotlin checks every source set against that set. That's the precise version of puzzle 1's rule. commonMain has Android among its targets, so no UIKit; it has iOS among them, so no `java.io.File`. iosMain's targets are all iOS, so UIKit is there.

The second rule follows the targets, not the names, and that leads to a surprise. In a project whose only Apple targets are the two iOS ones, appleMain and nativeMain are also compiled only for those two. So, despite their names, they may use all of iOS's APIs, UIKit included. Kotlin's docs call this counter-intuitive, and say it may change. Don't lean on it: keep UIKit calls in iosMain. Add a Mac target later (Macs draw their screens with another framework, AppKit) and appleMain's targets include a Mac, which has no UIKit: every UIKit call in appleMain stops compiling.

## The analogy

The binders from puzzle 17 again. The Japan binder may quote the shared handbook, because every office that gets the Japan binder also gets the shared one. The shared handbook can't quote the Japan binder: an office in France would read a reference to a page it doesn't have. Tokyo's own folder and the Paris office's folder never meet, so neither can quote the other. And a binder may only mention equipment that every office receiving it actually owns.

## Check yourself

- Your project has the android, iosArm64 and iosSimulatorArm64 targets. A function in commonMain calls a function you wrote in iosMain. What happens?::*The build fails, because commonMain can't see code in iosMain||It works on iOS, and on Android the call is skipped >> commonMain is checked against all its targets; it can't compile a call to code Android doesn't have. >> s3||It works, because iosMain dependsOn commonMain, so the two share everything >> The link goes one way: iosMain sees commonMain, not the reverse. >> s3::Up, never down.
- Why can iosMain use UIKit when commonMain can't, although both are compiled for iOS?::*Because every iosMain target has UIKit, while Android, a commonMain target, doesn't||Because iosMain is compiled after commonMain, once UIKit has been loaded >> Order isn't the rule: a source set may use only the APIs all its targets have. >> s5||Because commonMain isn't allowed to import code from any library at all >> It can use libraries built for every target, such as coroutines; UIKit isn't one. >> s5::All of its targets must have the API.
- Your appleMain calls UIKit and builds fine, since your only Apple targets are the two iOS ones. Then you add a Mac target. What happens?::*appleMain stops compiling, because a Mac target has no UIKit||Nothing changes, because appleMain was always allowed to use UIKit >> It was allowed only while all its targets were iOS ones; now a Mac is one of them. >> the-building-block||The Mac build compiles, and skips appleMain's UIKit calls >> Nothing is skipped: appleMain is checked against all its targets, the Mac included. >> s5::The rule follows the targets, not the name.

## Sources

- [Kotlin docs: Advanced concepts of the multiplatform project structure](https://kotlinlang.org/docs/multiplatform/multiplatform-advanced-project-structure.html) ("A observes the API from B, including internal declarations"; "A can provide actual implementations for expected declarations from B"; "A inherits all the regular dependencies of B"; "This is how Kotlin understands that iosMain is supposed to see the API from commonMain but not from iosArm64Main")
- [Kotlin docs: The basics of Kotlin Multiplatform project structure](https://kotlinlang.org/docs/multiplatform/multiplatform-discover-project.html) ("Code written in platform-specific source sets can access declarations from the common source set. For example, the code in jvmMain can use code from commonMain. However, the opposite isn't true: commonMain can't use code from jvmMain")
- [Kotlin docs: Source set hierarchy](https://kotlinlang.org/docs/multiplatform/multiplatform-hierarchy.html) ("The Kotlin toolchain ensures that each source set has access only to the API that is available for all targets to which that source set compiles"; "In this example, the apple and native source sets compile only to the iosArm64 and iosSimulatorArm64 targets. Despite their names, they have access to the full iOS API. This can be counter-intuitive"; "This behavior may change in the future"; "If you have previously introduced intermediate sources manually with dependsOn calls, it cancels the use of the default hierarchy template")
- [Kotlin docs: Expected and actual declarations](https://kotlinlang.org/docs/multiplatform/multiplatform-expect-actual.html) ("Only iosMain typically contains the actual declarations and not the platform source sets")
- [Kotlin docs: Interoperability with Swift/Objective-C](https://kotlinlang.org/docs/native-objc-interop.html) ("NSView class (from the AppKit framework) or UIView classes (from the UIKit framework)")
