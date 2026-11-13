---
title: ART is what runs your code
short: ART
summary: Your Kotlin ships as DEX bytecode. ART, inside each app's process, reads it line by line, compiles hot code while it runs, and the system compiles more of it ahead of time later.
takeaway: JIT = compile hot code now, while the app runs. AOT = compile it ahead of time, later, from the profile. A Baseline Profile moves "later" to "before the first launch".
---

## The problem

In puzzle 1, each app became its own house. But what actually runs inside the house? Android runs on many kinds of CPU, yet you upload one APK, and machine code for one CPU won't run on another. So the APK must hold something more general, and someone in the house has to translate it.

## See it

```diagram art
```

## The building block

Your Kotlin compiles to **DEX bytecode**: compact instructions that aren't tied to any CPU. **ART** (the Android Runtime) runs inside your app's process and turns them into work. Each piece of code can be in one of three states:

- interpreted: read one instruction at a time (slow, works immediately);
- JIT-compiled: compiled to machine code *now*, while the app runs, because it's hot;
- AOT-compiled: compiled *ahead of time*, later, by the system's `dex2oat` tool, using the profile ART wrote.

ART also runs your app's garbage collector, which frees objects you no longer use. That's for another module.

## The analogy

A translator lives in your house. The first time, they read your recipe word by word. Recipes you ask for often, they translate on the spot and note in a notebook. Once a day, at night, a professional translates everything in the notebook properly.

## Check yourself

- Is there one shared ART for all apps on the phone?::*No, each app's process runs its own ART||Yes, one ART runs every app >> ART is the translator living in each house, not a central office. Each process has its own, with its own memory. >> s1::ART runs inside each app's process, with its own memory and garbage collector.
- Your app gets faster a few days after install. Why?::*ART noted the hot code in a profile, and `dex2oat` later compiled it ahead of time||The JIT keeps its compiled code in the APK >> JIT code lives in memory while the app runs; it's lost when the app stops. What survives is the notebook (profile). >> s3||The app downloaded faster code in an update >> No update needed: the same DEX gets compiled better on the phone, from the profile. >> s4::The JIT writes a profile of hot code, and the system's `dex2oat` later compiles that code ahead of time.
- What's the difference between JIT and AOT?::*When: JIT compiles hot code now while the app runs; AOT compiles it ahead of time, later||Where: JIT runs on your laptop, AOT on the phone >> Both happen on the phone. The difference is when, not where. >> s3||JIT is for Kotlin, AOT is for Java >> Both work on DEX, which Kotlin and Java both compile to. >> s1::Both turn DEX into machine code. JIT does it on the spot for hot code; AOT does it later from the profile.

## Sources

- [Android Open Source Project: Android runtime and Dalvik](https://source.android.com/docs/core/runtime)
- [Android Open Source Project: Implement ART just-in-time compiler](https://source.android.com/docs/core/runtime/jit-compiler)
- [Android Open Source Project: ART Service configuration (background dexopt)](https://source.android.com/docs/core/runtime/configure/art-service)
- [Android Developers: Baseline Profiles overview](https://developer.android.com/topic/performance/baselineprofiles/overview)
