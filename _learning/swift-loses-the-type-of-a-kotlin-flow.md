---
title: Swift loses the type of a Kotlin Flow, because Flow is an interface
date: 2026-11-13
status: seedling
tags: [kmp, ios]
summary: Kotlin/Native talks to Swift through an Objective-C header, and Objective-C only puts generics on classes. Flow is an interface, so its element type doesn't survive the trip.
---

## The gap

I learned that Swift sees the values of a Kotlin `Flow<User>` as `Any?`, and accepted it as a fact. What I was missing was the reason, so I couldn't predict which other types would lose information too.

## The pieces

- Kotlin/Native doesn't produce Swift. It produces a framework with an **Objective-C header**, and Swift reads that header.
- Objective-C has only "lightweight generics", and they can be defined on classes, not on interfaces (protocols) or functions.
- A Kotlin interface becomes an Objective-C protocol.
- `Flow<out T>` is an interface in kotlinx.coroutines, so it becomes a protocol, and the `T` has nowhere to go.

## The click

The Objective-C header is a restaurant menu that Swift orders from. The menu can print "soup of the day: tomato" next to a dish (a class), but for a protocol it can only print "soup". So a generic class such as `Box<User>` keeps its type in Swift, while a `Flow<User>` arrives as "a flow of something", and Swift has to cast.

The same rule predicts the rest: anything generic that isn't a class, such as a generic function, loses its type parameter in the header too.

## How I checked it

I read the Kotlin documentation on Objective-C interop: "Generics can only be defined on classes, not on interfaces (protocols in Objective-C and Swift) or functions." The kotlinx.coroutines API reference declares `Flow` as `interface Flow<out T>`.

I didn't build an iOS framework to look at the generated header; that needs a Mac. So this card is a seedling until I do.

## Check yourself

- Does Kotlin/Native translate Kotlin into Swift?::No. It produces a framework with an Objective-C header, and Swift imports that header.
- Why does a generic class keep its type parameter in Swift but a `Flow` doesn't?::Objective-C generics exist only on classes; `Flow` is an interface, which becomes a protocol, and protocols can't carry generics.
- A Kotlin generic function `fun <T> first(list: List<T>): T` is called from Swift. Will Swift know `T`?::No. Objective-C generics can't be defined on functions either, so the type parameter is lost.

## Sources

- [Kotlin docs: Interoperability with Swift/Objective-C, generics](https://kotlinlang.org/docs/native-objc-interop.html#generics)
- [kotlinx.coroutines API reference: Flow](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/-flow/)
