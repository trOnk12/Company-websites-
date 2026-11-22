---
title: What does Android do with all this?
short: Bridge to Android: DEX, ART and AOT
summary: Modules 2 and 3 followed class files into a JVM. An Android phone has no JVM. Follow the same Kotlin to a phone and see which ideas carry over unchanged and which ones Android replaces.
takeaway: On Android, kotlinc still writes class files, but the build's d8 converts them into DEX, a register-based bytecode, and desugars features such as lambdas for older phones. The phone never sees a class file: ART runs DEX, dex2oat compiles it ahead of time, and class loaders still load and link the app's classes.
---

## The problem

Every program in modules 2 and 3 ran on HotSpot, from class files on a class path. Your Android app is written in the same Kotlin, but the phone has no HotSpot and no class path. So how much of what you just learned applies to the app you ship: the operand stack, the constant pool, invokedynamic lambdas, class loaders?

## See it

```diagram android-bridge
```

## The building block

**The same start.** In an Android build, kotlinc writes ordinary class files, exactly the bytecode modules 2 and 3 read. javap works on them; the getters, the $default methods and the `invokedynamic` lambdas are all there.

**d8 converts them.** The next build step is d8, a tool that, in Android's words, compiles "your project's Java bytecode into DEX bytecode that runs on Android devices". DEX (the Android course, puzzle 9) is the format ART runs. Two differences matter for reading it:

- DEX is register-based. Android's description: "The machine is register-based, and frames are fixed in size upon creation." Each DEX instruction names its inputs and output as numbered **registers**, slots in the method's frame, instead of taking them from the top of an operand stack. Addition is one instruction, add-int vAA, vBB, vCC in Android's reference: output register, then the two input registers, where the JVM needs two loads and an add.
- All of an app's classes go into one or a few classes.dex files, whose tables of identifiers, such as string_ids, the list of "all the strings used by this file", serve every class in the file, instead of one constant pool per class.

The call kinds survive with new names: DEX has invoke-virtual, invoke-super, invoke-direct, invoke-static and invoke-interface, and invoke-custom for call sites linked at run time, the counterpart of `invokedynamic`.

**Desugaring.** Older Android versions can't run some newer Java features. So d8 rewrites them into simpler code while converting: Android calls it **desugaring**, "bytecode transformations, called desugar , as part of the D8/R8 compilation of class files into DEX code". Lambdas are the example you meet most: they work on every Android version, because the build rewrites them. One edge from puzzle 9 carries over: "Android doesn't support the serialization of lambda expressions."

**On the phone.** The phone never receives a class file. ART (the Android course, puzzle 9) runs DEX. At install, or later in the background, dex2oat compiles DEX ahead of time into machine code (AOT, the Android course, puzzle 10), and ART also compiles while the app runs (JIT). Classes are still loaded by class loaders: Android documents that it uses PathClassLoader "for its system class loader and for its application class loader(s)". And ART still verifies code; Android's documentation says ART "has tighter install-time verification than Dalvik", its predecessor.

| Idea from modules 2 and 3 | On a JVM | On Android |
| --- | --- | --- |
| Bytecode | class files, operand stack | DEX, registers |
| Names and constants | one constant pool per class | shared tables per DEX file |
| Calls | five invoke instructions | invoke-virtual, invoke-static and friends, invoke-custom |
| Lambdas | `invokedynamic` and `LambdaMetafactory` | desugared by d8 where needed |
| Class loaders | bootstrap, platform, application | PathClassLoader for apps |
| Making it fast | HotSpot's compilers while running | dex2oat ahead of time, plus ART's JIT |

So what transfers? Everything you learned about what kotlinc writes (module 2, puzzles 8 and 9) is the input to the Android build; class identity by name and loader, static initialization order and its traps, and loader leaks are ideas ART shares. What changes is the instruction format and who compiles it to machine code.

### The edges

- *Read Android bytecode with Android's tools.* javap reads class files; for an APK, Android Studio's APK Analyzer has a DEX file viewer that can show the bytecode. This course doesn't show a DEX listing because running d8 wasn't possible in the session that wrote it; the instruction names above come from Android's published bytecode reference.
- *R8 does more.* Release builds can run R8, which also shrinks code and shortens names (com.example.MyActivity can become a.b.a), which is why release crash traces must be retraced to the original names.
- *The JVM course ends where the Android course begins.* How ART, dex2oat and profiles decide what to compile is in the Android course, puzzles 9 and 10.

## The analogy

A recipe written in the town's standard notation (class files) is sent to a franchise kitchen abroad that uses its own notation (DEX). Before shipping, the head office translates every recipe into the franchise's format, simplifying the steps old kitchens can't do (desugaring). The kitchen never sees the original notation, but it's the same dish, with the same ingredients list and the same rule about who may change which recipe.

## Check yourself

- You inspect your release APK and look for Bookmark.class. What do you find?::*No class files: the code is in classes.dex||Bookmark.class, which ART loads like HotSpot does >> d8 converts the class files into DEX; the phone never receives a class file. >> s5||Both, so that old phones can choose >> Old phones run desugared DEX, not class files. >> s3::d8 converts everything to DEX.
- Your app uses lambdas and runs on an old Android version without invokedynamic support. Why does it work?::*d8 desugared the lambdas while converting to DEX||ART creates the lambda classes with LambdaMetafactory at run time >> On old versions the build rewrites lambdas; that's what desugaring is for. >> s3||Kotlin never compiles lambdas with invokedynamic >> Since Kotlin 2.0 it does by default (puzzle 9). >> s3::Desugaring rewrites newer features at build time.
- Which puzzle-12 trap can still bite an Android app?::*A static read before its line gives the default||None, because ART reorders static code to avoid it >> ART runs static code in written order too; the trap is in what kotlinc writes. >> the-building-block||Only the missing-class error from puzzle 15 >> Static initialization order is part of the language and what kotlinc writes, not of HotSpot. >> the-building-block::The input to d8 is the same class files.

## Sources

- [Android developers: d8](https://developer.android.com/tools/d8) ("d8 is a command-line tool that Android Studio and the Android Gradle plugin use to compile your project's Java bytecode into DEX bytecode that runs on Android devices.")
- [Android developers: Java 8+ language features](https://developer.android.com/studio/write/java8-support) ("The default toolchain implements the new language features by performing bytecode transformations, called desugar , as part of the D8/R8 compilation of class files into DEX code"; "Lambda expressions Android doesn't support the serialization of lambda expressions.")
- [AOSP: Android runtime and Dalvik](https://source.android.com/docs/core/runtime) ("ART as the runtime executes the Dalvik executable (DEX) format and DEX bytecode specification."; "At install time, ART compiles apps using the on-device dex2oat tool."; "ART also has tighter install-time verification than Dalvik.")
- [AOSP: Dalvik bytecode format](https://source.android.com/docs/core/runtime/dalvik-bytecode) ("The machine is register-based, and frames are fixed in size upon creation."; "binop vAA, vBB, vCC 90: add-int"; the opcode table lists invoke-virtual, invoke-super, invoke-direct, invoke-static, invoke-interface and invoke-custom: "Resolves and invokes the indicated call site.")
- [AOSP: Dalvik executable format](https://source.android.com/docs/core/runtime/dex-format) ("string_ids string_id_item[] string identifiers list. These are identifiers for all the strings used by this file")
- [Android developers: Shrink, obfuscate, and optimize your app](https://developer.android.com/build/shrink-code) ("R8 shortens the names of classes, fields, and methods (for example, com.example.MyActivity could become a.b.a )"; "retrace crashes to the original source code")
- [Android developers: APK Analyzer](https://developer.android.com/studio/debug/apk-analyzer) ("The APK Analyzer's DEX file viewer gives you immediate access to the underlying information in the DEX files in your app."; "Show bytecode, find usages, and generate Keep rule")
- [Android API reference: PathClassLoader](https://developer.android.com/reference/dalvik/system/PathClassLoader) ("Android uses this class for its system class loader and for its application class loader(s).")
- Not verified by a run: no DEX was produced in this session (running the downloaded d8 tool was not permitted), so this puzzle shows no DEX listing and makes no claim about specific DEX instructions for score.
