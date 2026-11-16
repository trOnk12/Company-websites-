---
title: What's inside the APK
short: DEX and ART
summary: Phones have different CPUs, but you ship one APK, one file for every phone. So the APK can't hold code for just one kind of CPU, and something on the phone has to run it.
takeaway: Your Kotlin compiles to DEX, which no CPU runs directly. ART, inside your app's process, runs it: at first by reading it one instruction at a time.
---

## The problem

You upload one APK (the single file your app is packaged into) to the store, and it runs on phones with very different CPUs. But a CPU only runs instructions (the tiny steps a program is made of) written for that kind of CPU. So what's in the APK, and who makes it run?

## See it

```diagram apk
```

## The building block

Each kind of CPU has its own language: **machine code**. Your APK doesn't contain it. Your Kotlin compiles to **DEX**, compact instructions written for Android, not for any one CPU.

On the phone, **ART**, the Android Runtime (the part that runs your code), works inside your app's process and makes the DEX run. The simplest way it does that is **interpreting**: reading one DEX instruction at a time and doing what it says. That always works, but it's slow.

## The analogy

You write your recipes in one common language, so any kitchen can use them. In every house lives a translator, ART, who reads them to the cook word by word.

## Check yourself

- You ship the same APK to two phones with different CPUs. Why does it run on both?::*It contains DEX, and ART on each phone runs it||It contains machine code for every CPU >> Then it would only run on the CPUs it was built for. DEX isn't for any CPU. >> s1||Google rebuilds it for each phone >> Nobody rebuilds it: ART on the phone runs the same DEX. >> s3::DEX isn't tied to a CPU; ART on each phone runs it.
- Is there one ART for all the apps on the phone?::*No: each app's process runs its own ART||Yes: one ART runs every app >> ART lives inside each app's process, like a translator in every house. >> s2::Each process has its own ART.
- What's the difference between DEX and machine code?::*Machine code is for one kind of CPU; DEX is for any Android phone||They're the same: DEX is machine code for Android phones >> DEX has to be run by ART; machine code runs on the CPU directly. >> s4::DEX needs ART; machine code needs nothing.

## Sources

- [Android Open Source Project: Android runtime and Dalvik](https://source.android.com/docs/core/runtime)
- [Android Developers: Platform architecture](https://developer.android.com/guide/platform)
