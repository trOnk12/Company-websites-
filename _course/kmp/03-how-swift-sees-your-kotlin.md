---
title: How Swift sees your Kotlin
short: The framework and its header
summary: In puzzle 0, Kotlin/Native turned your code into native code for the iPhone. But the iOS app is written in Swift. Here's how Swift finds and calls what you built.
takeaway: Kotlin/Native packs your shared code into a framework, Apple's format for a library. Its description is an Objective-C header, because Swift can call Objective-C directly; Swift reads that header and calls your Kotlin as if it were Objective-C.
---

## The problem

In puzzle 0, Kotlin/Native compiled your shared code to native code for the iPhone. But the iOS app is written in Swift, by a team that may never open a Kotlin file. Native code is just instructions for a CPU: it has no names, no types, no "here's a class called LoginRules". How does Swift know what's in there, and how to call it?

## See it

```diagram swift
```

## The building block

For iOS, Kotlin/Native packs your shared code into a **framework**: Apple's format for a library. A framework holds two things: the compiled code, and a description of what's inside, so other code knows what it can call.

That description is a **header**: a file that lists every class, function and type, without their code. Kotlin writes it in **Objective-C**, the older language of Apple's platforms, because Swift can call Objective-C directly. Swift has no direct line to Kotlin; it goes through that Objective-C description.

So the iOS team imports the framework, and in Swift your `LoginRules` class looks like any other Objective-C class: Swift reads the header and calls the native code behind it.

That middle step has a price. Objective-C is older and simpler than both Kotlin and Swift, so some things don't survive the trip. The next puzzle shows which.

## The analogy

A book translated into a third language before it reaches its readers. The readers never see the original; they read the translation. Whatever that third language has no words for gets flattened on the way.

## Check yourself

- The iOS team opens your framework in Xcode. What do they read to learn your API?::*The Objective-C header Kotlin/Native wrote for it||Your Kotlin files, which Xcode can open directly >> The framework holds native code and an Objective-C description; Swift never reads Kotlin. >> s3||A Swift file Kotlin/Native generated for each class >> Kotlin describes your code in Objective-C, not Swift; Swift reads that. >> s3::Swift learns your API from the Objective-C header.
- Why does Kotlin describe your code in Objective-C, not in Swift?::*Swift can call Objective-C directly, so it's the bridge both sides understand||Because Swift can't run native code unless Objective-C starts it >> Swift runs native code fine; it needs a description it can read, and Objective-C is one. >> the-building-block::Objective-C is the language Swift already knows how to call.
- What's the difference between a framework and a header?::*The framework is the package; the header describes its API||They're the same file under two names >> A framework contains the header, plus the compiled code the header describes. >> s2||The header holds the code; the framework only lists it >> It's the other way round: the header lists, the framework holds the code too. >> s2::Package vs its description.

## Sources

- [Kotlin docs: Interoperability with Swift/Objective-C](https://kotlinlang.org/docs/native-objc-interop.html) ("Kotlin/Native provides indirect interoperability with Swift through Objective-C. This document covers how you can use Kotlin declarations in Swift/Objective-C code")
- [Kotlin docs: The basics of Kotlin Multiplatform project structure](https://kotlinlang.org/docs/multiplatform/multiplatform-discover-project.html) ("When it's built into an iOS framework, common Kotlin is treated as Kotlin/Native")
