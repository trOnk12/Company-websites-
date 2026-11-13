---
title: Robolectric runs the real Android framework, and fakes only the native parts
date: 2026-11-13
status: budding
tags: [android, testing, robolectric]
summary: The android.jar you compile against is only stubs. Robolectric runs a jar with the real framework code instead, and swaps in Java fakes ("shadows") where Android would call native code.
---

## The gap

I used Robolectric without knowing what it actually runs. Is it a fake Android written from scratch, or an emulator in disguise? Neither, it turns out.

## The pieces

- The `android.jar` you compile against is a stub jar: method signatures only. Every body throws `RuntimeException("Stub!")`.
- Much of the Android framework is plain Java: `Intent`, `TextUtils`, `org.json`. That code can run on any JVM.
- Other parts call native C/C++ code (graphics, for example), which doesn't exist on a laptop's JVM.
- Robolectric publishes `android-all` jars with the real framework implementation, one per Android version.
- Its shadows replace the native methods, and add test APIs on top.

## The click

Think of the framework as a building with a few doors that open onto a device that isn't there. Robolectric doesn't rebuild the building. It moves the real one onto your computer and puts a painted backdrop behind each door that would lead to native code.

So most of the code under test is the same code that runs on a phone, and the differences are concentrated in the shadows. That's also where Robolectric can be wrong.

## How I checked it

Without Robolectric, on a plain JVM (JDK 21), with Robolectric's `android-all` jar for Android 16 next to an old stub `android.jar` from Maven Central:

- `javap` shows `TextUtils.isEmpty` in the stub jar is `new RuntimeException("Stub!")`, and in `android-all` it's the real null-and-length check.
- Calling `TextUtils.isEmpty("")` with the stub jar throws `Stub!`. With `android-all` it returns `true`.
- Calling `Bitmap.createBitmap(…)` with `android-all` fails with `UnsatisfiedLinkError` on a native method. `Bitmap` alone declares 46 native methods.

That's the gap the shadows fill. I didn't trace Robolectric's own bytecode rewriting here; that part is from its architecture docs.

The probe and a script that reruns it are in [this site's repository](https://github.com/trOnk12/Company-websites-/tree/main/_learning/experiments/android-on-jvm).

## Check yourself

- Is Robolectric an emulator?::No. It runs the framework's Java code directly on your JVM, with no Android system image.
- Why can't you just put `android.jar` on the test classpath?::It's stubs: every method throws `RuntimeException("Stub!")`.
- Which part of a Robolectric test is most likely to behave differently from a device?::Anything backed by native code or system services, because a shadow stands in for it.

## Sources

- [Robolectric: architecture](https://robolectric.org/architecture/)
- [Robolectric: shadows](https://robolectric.org/extending/)
