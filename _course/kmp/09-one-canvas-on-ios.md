---
title: One canvas on iOS
short: How Compose draws on iOS
summary: On iOS, your Compose screen doesn't become UIKit buttons and labels. It's drawn. Here's what UIKit sees, and why VoiceOver and native controls need a bridge.
takeaway: On iOS, Compose Multiplatform draws your whole UI itself with Skia, through Skiko, inside one hosted view: ComposeUIViewController. UIKit sees one view, not your buttons. So Compose maps its own semantics into iOS's accessibility tree for VoiceOver, and a native control such as a map goes in through UIKitView.
---

## The problem

Puzzle 8 said the platform layer is rewritten per target. On iOS, does your `Column` with a `Button` turn into a `UIStackView` with a `UIButton`? If it doesn't, how does VoiceOver know there's a button to read out?

## See it

```diagram canvas
```

## The building block

It doesn't turn into UIKit buttons and labels. Your Swift code hosts the whole Compose screen as one view controller, returned by `ComposeUIViewController { App() }`. Inside it, Compose draws every pixel itself with **Skia**, a graphics library for shapes and text, which Kotlin reaches through Skiko ("Skia for Kotlin").

So UIKit sees one view. It doesn't know there's a button at the top or a list below. That has two consequences.

First, accessibility. VoiceOver reads iOS's **accessibility tree**: the list of on-screen elements with their labels and roles. Compose already knows what each element is, from the semantics that Material components attach, so Compose Multiplatform maps that data into native accessibility objects. A Material `Button` arrives in the tree as a button. A shape you drew yourself, with no semantics, is invisible to VoiceOver, unless you give it some, for example with `Modifier.semantics { contentDescription = "Pay" }`, or make it `clickable`.

Second, native controls. A map, a web view or a video player is a UIKit view that Skia can't draw. **UIKitView** puts a real one into your Compose layout, and Compose sizes and positions it like any other composable.

And Compose doesn't have to own the whole app: a UIKit or SwiftUI app can show Compose for just one screen, one view controller among its own.

## The analogy

A painted mural instead of a shop window full of real objects. Passers-by see the same scene, but a blind visitor needs a guide who knows what each painted thing is (the accessibility tree), and anything that must really open, like a door, is a real door set into the wall (`UIKitView`).

## Check yourself

- Your Compose screen on iOS has a `Column` with a `Button`. What does UIKit see?::*One view hosted by `ComposeUIViewController`, with the whole screen drawn inside||A `UIStackView` holding a `UIButton`, built from your composables >> Compose doesn't create UIKit objects for composables; it draws them itself. >> s2||Nothing at all, because Compose replaces UIKit on iOS >> UIKit still runs the app; Compose lives inside one of its screens. >> s1::One view, drawn by Compose.
- You draw a custom icon button yourself, as plain shapes with no semantics. What does VoiceOver read?::*Nothing, since only semantics reach the accessibility tree||The button, because UIKit sees every drawn shape >> UIKit sees one view; what's in the tree comes from Compose's semantics. >> s3||The button's label, because Skia reports text it draws >> Skia only draws pixels; it doesn't tell iOS what they mean. >> s3::No semantics, nothing to read.
- What's the difference between `ComposeUIViewController` and `UIKitView`?::*The first puts Compose inside UIKit, while `UIKitView` puts UIKit inside Compose||Both put a Compose screen inside a UIKit app, in two styles >> `UIKitView` goes the other way: a native view inside Compose. >> s4||`UIKitView` puts Compose inside UIKit, while the first puts UIKit inside Compose >> That's the two swapped. >> s4::Opposite directions.

## Sources

- [Skiko README](https://github.com/JetBrains/skiko) ("Skiko (short for Skia for Kotlin) is the graphical library exposing significant part of Skia library APIs to Kotlin, along with the gluing code for rendering context"; supported platforms include "Kotlin/Native on iOS")
- [Kotlin docs: Support for iOS accessibility features](https://kotlinlang.org/docs/multiplatform/compose-ios-accessibility.html) ("semantics data produced by Compose APIs is now mapped to native objects and properties that are consumed by iOS Accessibility Services. For most interfaces built with Material widgets, this should happen automatically.")
- [Kotlin docs: Integration with the UIKit framework](https://kotlinlang.org/docs/multiplatform/compose-uikit-integration.html) ("To use UIKit elements inside Compose Multiplatform, add the UIKit elements that you want to use to a UIKitView")
