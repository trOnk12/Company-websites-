---
title: One framework, not two
short: Shipping to iOS
summary: In puzzle 5, Kotlin/Native packed your shared code into a framework. Your project has several shared modules. Here's why they should reach Swift as one framework, and what each exported line costs.
takeaway: Each Kotlin framework carries its own copy of the Kotlin runtime, and using several in one Swift app is limited. So ship one umbrella framework that exports the modules Swift needs. Every exported module comes in whole, which turns off dead code elimination for it: export only what Swift calls.
---

## The problem

In puzzle 5, your shared code became a framework that Swift imports. Your project has grown: a network module, a database module, a features module. The obvious move is one framework per module, so the iOS app imports three. Why does that go wrong?

## See it

```diagram umbrella
```

## The building block

A Kotlin framework isn't only your code: it also carries the Kotlin runtime, the standard library and the garbage collector from puzzle 9. Build three frameworks and the app carries three runtimes, each with its own copy of everything, and Kotlin's docs say using several Kotlin frameworks in one Swift app is limited: a Kotlin type from one framework isn't the same type as the same class in another.

So you ship one **umbrella framework**: a single framework, with one runtime, that brings in every Kotlin module Swift needs. In Gradle you list which modules it exports to Swift:

```kotlin
binaries.framework { export(project(":network")) }
```

Exporting has a cost. An exported module comes in with its whole API, even if Swift uses a tiny part of it, and that turns off **dead code elimination** for it: the step that leaves out compiled code nothing uses, to keep the app small. So export only the modules Swift actually calls; the others still go into the framework, but trimmed to the code that's used.

For distribution, the umbrella framework is usually built as an **XCFramework**: one bundle holding the builds for every Apple device and simulator, which the iOS project adds like any other library.

## The analogy

One shipping container instead of three: each container comes with its own crane (the runtime), and goods from one container can't be swapped for the same goods from another. And whatever you put on the manifest (the export list) is shipped whole, even the parts nobody ordered.

## Check yourself

- An app imports two Kotlin frameworks, and both contain the same `User` class. Swift passes a `User` from one to the other. What happens?::*It doesn't work: the two `User` types are different types to Swift||It works, because the class has the same name in both >> Each framework has its own runtime and its own copy of the class; to Swift they're different types. >> s2||It works, but only for classes from `commonMain` >> Where the class came from doesn't help: two frameworks, two types. >> s2::Two frameworks, two copies of every type.
- Why export only the modules Swift calls, instead of everything?::*Because each exported module comes in whole, so less code can be left out||Because Swift can't read more than one exported module >> Swift can read many; the cost is size, since exported code isn't trimmed. >> s4||Because unexported modules aren't compiled into the framework at all >> They are compiled in, and trimmed to what's used; only exports come in whole. >> s4::Exports are kept whole; the rest is trimmed.
- What's the difference between an umbrella framework and an XCFramework?::*The umbrella holds all your Kotlin modules, while an XCFramework bundles builds for every Apple device||They're two names for the same bundle that holds your Kotlin modules for Swift >> One is about which modules are inside; the other about which devices it's built for. >> the-building-block||An XCFramework holds all your Kotlin modules, while an umbrella is built per device >> That's the two swapped. >> the-building-block::What's inside vs which devices.

## Sources

- [Kotlin docs: Build final native binaries](https://kotlinlang.org/docs/multiplatform/multiplatform-build-native-binaries.html) ("Usage of several Kotlin/Native frameworks in a Swift application is limited, but you can create an umbrella framework and export all these modules to it"; "When you export a dependency, it includes all of its API to the framework API. The compiler adds the code from this dependency to the framework, even if you use a small fraction of it. This disables dead code elimination"; "XCFrameworks… gather logic for all the target platforms and architectures in a single bundle")
