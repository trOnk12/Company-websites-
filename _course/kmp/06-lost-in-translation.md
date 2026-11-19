---
title: Lost in translation
short: What Swift doesn't see
summary: In puzzle 5, Swift saw your Kotlin through an Objective-C header. Objective-C is simpler than both languages, so some things don't make it across. Here are the three that bite.
takeaway: Through the Objective-C header, generics on interfaces are lost (a Flow<User> arrives without its User), suspend functions become completion handlers (async in Swift), and an unexpected Kotlin exception escaping the bridge can terminate the app.
---

## The problem

In puzzle 5, Swift reached your Kotlin through an Objective-C header. Your shared code returns a `Flow<User>`, has `suspend` functions, and throws an `IOException` when the login fails. The generated header has to describe all three using Objective-C. What can it express at that boundary?

## See it

```diagram lost
```

## The building block

**Generics.** Objective-C allows type parameters only on classes, not on interfaces. Kotlin's `Flow` is an interface, so `Flow<User>` arrives in Swift without its `User`: Swift sees "some Flow" and has to be told what's inside. A class like `Box<User>` keeps its `User`.

**`suspend` functions.** Objective-C has no coroutines. Its way of saying "later" is a **completion handler**: a function you pass in, which is called with the result when it's ready. So each `suspend` function becomes a method that takes a completion handler. Swift has its own version of suspend: an **async function**, which the caller waits for with `await`, without blocking, much as a coroutine waits at a `suspend` call. Swift 5.5 and later can also expose an async form for the imported Kotlin function. The completion handler is the underlying interface. This bridge has limitations, so test the generated interface you ship.

**Exceptions.** Every Kotlin exception is unchecked: nothing forces the caller to handle it. Swift's errors are checked: a function that can fail says so with `throws`, and the caller must handle it. For this bridge, list the expected exceptions with **`@Throws`**. Those classes and their subclasses reach Swift as errors it can catch. An unexpected exception escaping the bridge can terminate the app. If a suspending function is asked to stop, it can pass the error that signals this even without `@Throws`.

None of this is a bug: it's the price of the bridge from puzzle 5. Knowing it lets you shape your API so Swift gets what it needs: generic classes instead of generic interfaces, and a deliberate error contract for functions you expose.

## The analogy

The translation from puzzle 5 again. A word the third language doesn't have (a Kotlin interface's type parameter) is dropped. An idiom it can't express ("suspend") is rewritten into a phrase it has ("call me back"). And a warning nobody translated (an unlisted exception) reaches the reader as silence, then a crash.

## Check yourself

- Your shared code exposes a `Flow<User>`. What does Swift see?::*A Flow, without knowing it carries users||Exactly that Flow with its type, because generics always cross >> Generics cross only on classes; Flow is an interface, so its type parameter is lost. >> s2||Nothing at all, because Flow can't cross the header >> The Flow does cross, as an Objective-C type; only its type parameter is lost. >> s2::Interface generics are lost in the Objective-C header.
- An ordinary Kotlin function throws `IOException` and has no `@Throws`. Swift calls it, and it throws. What happens?::*The app ends: the exception isn't listed, so Swift can't catch it||Swift gets an error it can catch, like any `throws` function >> Only exceptions listed in `@Throws` become Swift errors; the rest end the app. >> s4||Kotlin catches it and returns null >> Nothing catches it on the way; an unlisted exception ends the app. >> s4::For ordinary functions, the annotation declares errors that may cross the bridge.
- What's the difference between a `suspend` function in Kotlin and what Swift sees?::*Swift sees a method with a completion handler, called with await||Swift sees the same suspend function, since Swift has suspend too >> Swift has no suspend; Objective-C's bridge turns it into a completion handler. >> s3||Swift sees a function that blocks until the result is ready >> Nothing blocks: the completion handler is called later, with the result. >> s3::Suspend becomes "call me back when done".

## Sources

- [Kotlin docs: Interoperability with Swift/Objective-C](https://kotlinlang.org/docs/native-objc-interop.html) ("Generics can only be defined on classes, not on interfaces (protocols in Objective-C and Swift) or functions"; mapping table: "suspend → completionHandler: / async"; "All Kotlin exceptions are unchecked… Swift has only checked errors"; "Other Kotlin exceptions reaching Swift/Objective-C are considered unhandled and cause program termination")
