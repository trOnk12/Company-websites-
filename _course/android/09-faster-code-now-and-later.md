---
title: Faster code, now and later
short: JIT and AOT
summary: Reading DEX one instruction at a time is slow. So ART translates busy code into machine code while the app runs, and the phone translates more of it later.
takeaway: JIT = translate busy code now, while the app runs. AOT = translate it ahead of time, later, from ART's notes. A Baseline Profile sends those notes with the APK.
---

## The problem

In puzzle 8, ART ran your DEX by interpreting it, which is slow. But some of your code runs thousands of times: scrolling a list, drawing the screen. Translating that once into machine code would pay off every time it runs again. When should that happen?

## See it

```diagram jit
```

## The building block

ART watches which code runs often, "hot" code, and translates it to machine code right away, while the app runs: that's **JIT**, just-in-time. That machine code lives in the process's memory, so it's gone when the app stops. It also writes down which code was hot in a notebook, the **profile**.

Later, about once a day while the phone is idle and charging, `dex2oat`, a program that's part of Android, translates the code in the profile to machine code and keeps it in a file on the phone: that's **AOT**, ahead-of-time. Next start, that code is fast from the first moment. It doesn't translate everything: that would take a long time and use storage, and most code is rarely used.

A **Baseline Profile** is a profile the app's developers write and ship inside the APK, so `dex2oat` can translate the important code when the app is installed, before its first launch.

## The analogy

The translator reads new recipes word by word, but recipes asked for often get translated on the spot and noted in a notebook. Once a day, at night, a professional translates everything in the notebook for good.

## Check yourself

- Your app gets faster a few days after install, without an update. Why?::*ART noted the hot code, and `dex2oat` later translated it ahead of time||The JIT saved its machine code into the APK >> JIT's machine code lives in memory while the app runs and is lost when it stops. The notebook is what's kept. >> s3||The phone's CPU got used to the app >> CPUs don't learn. The difference is which code is already translated. >> s4::The profile survives; AOT translation from it is what makes the next starts faster.
- Why not translate all the DEX ahead of time, right at install?::*Translating everything takes time and space; the profile says which code is worth it||Because AOT can't translate DEX >> AOT translates DEX, but only what's worth it: the hot code from the profile. >> s4::The profile focuses the work on code that's actually used.
- What's the difference between JIT and AOT?::*When: JIT translates now, while the app runs; AOT translates ahead of time, later||Where: JIT runs on your computer, AOT on the phone >> Both happen on the phone. The difference is when. >> s2::Same goal, different moment.

## Sources

- [Android Open Source Project: Implement ART just-in-time compiler](https://source.android.com/docs/core/runtime/jit-compiler)
- [Android Open Source Project: ART Service configuration (background dexopt)](https://source.android.com/docs/core/runtime/configure/art-service)
- [Android Developers: Baseline Profiles overview](https://developer.android.com/topic/performance/baselineprofiles/overview)
