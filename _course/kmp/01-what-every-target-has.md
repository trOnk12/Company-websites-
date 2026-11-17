---
title: What every target has
short: Source sets
summary: In puzzle 0, one Kotlin file became bytecode and native code. But some code only makes sense on one platform. Here's how a project says which code goes where.
takeaway: Code lives in source sets. commonMain is compiled for every target, so it may only use what every target has; androidMain and iosMain are compiled for one platform each and can use that platform's own APIs.
---

## The problem

In puzzle 0, one Kotlin file was compiled for Android and for an iPhone. Now your shared code reads a file with `java.io.File`. On Android, fine: it's part of the Java library the JVM brings. An iPhone has no Java library at all. Which code is allowed to call what, and who decides?

## See it

```diagram sourcesets
```

## The building block

A multiplatform project keeps its code in **source sets**: folders, each compiled for a chosen set of targets.

**`commonMain`** is compiled for every target. Its code is the **common code**, and it may only use what every target has: the Kotlin standard library, and libraries built for every target themselves, like Kotlin's own coroutines library. `java.io.File` isn't one of them, because the iPhone has no Java library to provide it.

**`androidMain`** is compiled only for Android, so it can use anything Android and Java offer. **`iosMain`** is compiled only for iOS, so it can use Apple's own APIs, like `UIDevice`. Common code can't see into either: it doesn't know which platform it will end up on.

In Gradle, you list the targets in the build file, and each source set is a folder under src, like src/commonMain and src/iosMain.

The rule is what makes sharing safe: if something compiles in `commonMain`, it has something to run on, on every target.

## The analogy

A company with offices in two countries. Rules in the shared handbook must make sense in both, so they can't say "call the local tax office by its name". Each office keeps a local folder for what only applies there.

## Check yourself

- You call `java.io.File` in `commonMain`, and the project has Android and iOS targets. What happens when you build for iOS?::*It fails: the iPhone has no Java library to provide that class||It works: Kotlin/Native turns the Java class into native code too >> Kotlin/Native compiles your Kotlin; it can't bring along a Java library the iPhone doesn't have. >> s3||It builds, and on iOS the call is skipped at runtime >> Common code is compiled for every target; on iOS it can't compile at all. >> s3::Common code may only use what every target has.
- Why can't common code call Android's own APIs?::*Because it's compiled for every target, and the others lack those APIs||Because Android's APIs are written in Java, not Kotlin >> The language isn't the problem: those APIs don't exist on the iPhone. >> the-building-block::What every target has is the limit.
- What's the difference between `commonMain` and `iosMain`?::*`commonMain`: every target. `iosMain`: only iOS, with Apple's APIs||`commonMain` is for logic; `iosMain` is for screens >> The split is about which targets the code is compiled for, not about logic versus screens. >> s2||`iosMain` is written in Apple's own language; `commonMain` in Kotlin >> Both are Kotlin; they're compiled for different targets. >> s4::Which targets a source set is compiled for.

## Sources

- [Kotlin docs: The basics of Kotlin Multiplatform project structure](https://kotlinlang.org/docs/multiplatform/multiplatform-discover-project.html) ("Common code is the Kotlin code shared among different platforms… typically located in the commonMain directory. The location of code files is important, as it affects the list of platforms to which this code is compiled"; "a shared module with the commonMain, iosMain, and androidMain source sets")
