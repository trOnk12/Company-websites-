---
title: A promise and its keepers
short: expect and actual
summary: In puzzle 1, common code couldn't call a platform's own APIs. But shared logic sometimes needs a small platform fact, like which phone it's running on. Here's how it asks without knowing.
takeaway: An expect declaration in common code is a promise; every platform source set keeps it with an actual declaration. The compiler checks that every target has one. For anything bigger, an interface implemented per platform does the same job and is easier to test.
---

## The problem

In puzzle 1, common code could only use what every target has. But your shared logging code wants to print which platform it's on: "Android 34" or "iOS 17". Each platform has its own way to tell, and common code can't call either. How does common code use something only the platforms have?

## See it

```diagram expect
```

## The building block

Common code makes a promise. It declares what it needs, without a body, marked **`expect`**:

```kotlin
// commonMain
expect fun platformName(): String
```

Then every platform source set keeps that promise with an **`actual`** declaration, using its own APIs:

```kotlin
// androidMain
actual fun platformName(): String = "Android ${Build.VERSION.SDK_INT}"

// iosMain
actual fun platformName(): String = UIDevice.currentDevice.systemName() + " " + UIDevice.currentDevice.systemVersion
```

Common code calls `platformName()` like any function. When the compiler builds a target, it plugs in that target's actual. And it checks: if one target has no actual, that target's build fails, so a promise can't be forgotten.

`expect` and `actual` work best for small things like this. For bigger platform services, like storage or a network client, the usual choice is an interface in common code with one implementation per platform, handed in from outside: it does the same job, and in a test you can hand in a fake.

## The analogy

The shared handbook from puzzle 1 says: "Call the local tax office." It doesn't say which. Each country's office fills in its own number. Before the handbook is printed for a country, someone checks that number is filled in.

## Check yourself

- You add a web target. `platformName()` has actuals for Android and iOS only. What happens?::*The web build fails until you add a web actual||It builds, and `platformName()` returns an empty string on the web >> There's no default: the compiler requires an actual for every target. >> s4||It builds, and the web uses the Android actual >> One platform's actual is never used for another; each target needs its own. >> s4::Every target must keep the promise.
- Why mark it `expect` instead of writing an `if` that checks the platform in common code?::*Common code can't call either platform's APIs, even inside an `if`||Because an `if` in common code would run slower on iOS than a function >> Speed isn't it: common code can't reach the platforms' APIs at all. >> the-building-block::The platform calls must live where those APIs exist.
- What's the difference between an `expect` declaration and an `actual` one?::*`expect`: the promise in common code. `actual`: a platform keeping it||`expect` is for Android; `actual` is for iOS >> Every platform, Android included, writes its own `actual`. >> s3||`expect` holds a default body the actuals can replace >> An `expect` has no body at all: only the actuals do the work. >> s2::A promise, and its keepers.

## Sources

- [Kotlin docs: Expected and actual declarations](https://kotlinlang.org/docs/multiplatform/multiplatform-expect-actual.html) ("Expected and actual declarations allow you to access platform-specific APIs from Kotlin Multiplatform modules. You can provide platform-agnostic APIs in the common code.")
