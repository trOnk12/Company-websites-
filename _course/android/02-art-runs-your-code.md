---
title: ART is what runs your code
short: ART
summary: Your Kotlin ships as DEX bytecode. ART, inside each app's process, interprets it, compiles hot code while it runs, and compiles ahead of time from a profile.
takeaway: Each app process has its own ART, with its own heap and garbage collector. Code starts slow and gets faster as ART learns what's hot, unless a Baseline Profile tells it up front.
---

## The problem

Android runs on many kinds of CPU, but you upload one APK. Machine code for one CPU won't run on another. So what's actually inside the APK, and who turns it into something the phone can run?

## See it

```diagram art
```

## The building block

Your Kotlin compiles to **DEX bytecode**. **ART** (the Android Runtime) runs inside your app's process and executes it. Each method can be in one of three states: interpreted, JIT-compiled, or AOT-compiled. ART also runs the **garbage collector** that frees your app's unused objects.

## The analogy

A recipe written in a common language (DEX). The first time, the cook reads it line by line (interpreting). Dishes ordered often get memorised (JIT), and the cook writes down which ones those were (the profile). On a quiet day, those recipes are learned by heart for good (AOT).

## Check yourself

Answer all three to unlock the next puzzle.

- Is there one shared ART for all apps on the phone?::*No, each app's process has its own ART||Yes, one ART runs every app::ART runs inside each app's process, with its own heap and garbage collector.
- Why can an app get faster a few days after install?::*ART recorded the hot code in a profile and compiled it ahead of time||The Play Store sends faster machine code later||The garbage collector learns the app::The JIT writes a profile of hot code, and dex2oat later compiles that code ahead of time.
- What does a Baseline Profile change?::*It ships the list of important code, so ART can compile it before the first launch||It makes the JIT compiler faster||It removes the interpreter from the phone::Instead of learning what's hot from use, ART gets the list with the app and compiles it ahead of time.

## Sources

- [Android Open Source Project: Android runtime and Dalvik](https://source.android.com/docs/core/runtime)
- [Android Open Source Project: Implement ART just-in-time compiler](https://source.android.com/docs/core/runtime/jit-compiler)
- [Android Developers: Baseline Profiles overview](https://developer.android.com/topic/performance/baselineprofiles/overview)
