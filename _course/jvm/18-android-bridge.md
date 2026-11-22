---
title: What does Android do with all this?
short: From class files to a phone
summary: Modules 2 and 3 followed class files into a JVM. An Android phone has no JVM. Follow the same Kotlin to a phone and see which ideas carry over unchanged and which ones Android replaces.
takeaway: On Android, kotlinc still writes class files, but the build's d8 converts them into DEX, a register-based bytecode, and desugars features such as lambdas, which it always rewrites into ordinary classes because ART has no LambdaMetafactory. The phone never sees a class file: ART interprets DEX and JIT-compiles hot methods into a profile, dex2oat compiles the profiled methods ahead of time, and class loaders still load and link the app's classes.
---

## The problem

Puzzle 17 ended a long run on HotSpot: every program in modules 2 and 3 ran there, from class files on a class path. Your Android app is written in the same Kotlin, but the phone has no HotSpot and no class path. So how much of what you just learned applies to the app you ship: the operand stack, the constant pool, `invokedynamic` lambdas, class loaders?

## See it

```diagram android-bridge
```

## The building block

*The same start.* In an Android build, kotlinc writes ordinary class files, exactly the bytecode modules 2 and 3 read. javap works on them; the getters, the $default methods and the `invokedynamic` lambdas are all there.

*d8 converts them.* The next build step is d8, a tool that, in Android's words, compiles "your project's Java bytecode into DEX bytecode that runs on Android devices". **ART** (Android Runtime) is the program on the phone that runs app code; **DEX** (Dalvik Executable) is the bytecode format it runs. Two differences matter for reading it.

*DEX is register-based.* Android's description: "The machine is register-based, and frames are fixed in size upon creation." Each DEX instruction names its inputs and output as numbered **registers**, slots in the method's frame, instead of taking them from the top of an operand stack. Android's Dalvik bytecode reference describes add-int like this (its own example, not a run of ours):

```text
binop vAA, vBB, vCC
90: add-int
A: destination register or pair (8 bits)
B: first source register or pair (8 bits)
C: second source register or pair (8 bits)
Perform the identified binary operation on the two source registers,
storing the result in the destination register.
```

So one add-int names three registers: where to put the sum, and the two values to add. The JVM's score needed `iload_0`, `iload_1` and `iadd` to do the same, because its add takes both inputs from the stack.

*One file, shared tables.* All of an app's classes go into one or a few classes.dex files, whose tables of identifiers, such as string_ids, the list of "all the strings used by this file", serve every class in the file, instead of one constant pool per class.

The call kinds survive with new names: DEX has invoke-virtual, invoke-super, invoke-direct, invoke-static and invoke-interface, and invoke-custom for call sites linked at run time, the counterpart of `invokedynamic`.

*Desugaring.* Android's runtime can't run some Java features as kotlinc wrote them. So d8 rewrites them into simpler code while converting: Android calls it **desugaring**, "bytecode transformations, called desugar , as part of the D8/R8 compilation of class files into DEX code". Lambdas are the example you meet most: d8 rewrites every `invokedynamic` lambda into a small class at build time, whatever your minSdk, because Android's runtime library has no `LambdaMetafactory` to call. Jake Wharton explains it in his article on Android's Java 8 support: Android's runtime supports an equivalent of `invokedynamic`, "but the JDK's built-in LambdaMetafactory is not available to use". One edge from puzzle 9 carries over: "Android doesn't support the serialization of lambda expressions."

*On the phone.* The phone never receives a class file. ART runs DEX with an interpreter, which carries out one instruction at a time, and a **JIT** (just-in-time compiler) that compiles hot methods, the ones called often, into machine code while the app runs and records them in a profile. Later, dex2oat, a compiler on the phone, compiles the methods in that profile ahead of time (**AOT**) into machine code, so the next launches start fast. Machine code is the processor's own instructions, which run without an interpreter. Classes are still loaded by class loaders: Android documents that it uses PathClassLoader "for its system class loader and for its application class loader(s)". And ART still verifies code; Android's documentation says ART "has tighter install-time verification than Dalvik", its predecessor.

| Idea from modules 2 and 3 | On a JVM | On Android |
| --- | --- | --- |
| Bytecode | class files, operand stack | DEX, registers |
| Names and constants | one constant pool per class | shared tables per DEX file |
| Calls | five invoke instructions | invoke-virtual, invoke-static and friends, invoke-custom |
| Lambdas | `invokedynamic` and `LambdaMetafactory` | always rewritten into classes by d8 |
| Class loaders | bootstrap, platform, application | PathClassLoader for apps |
| Making it fast | HotSpot's compilers while running | JIT while running, writing a profile; dex2oat compiles the profiled methods ahead of time |

So what transfers? Everything you learned about what kotlinc writes (module 2, puzzles 8 and 9) is the input to the Android build; class identity by name and loader, static initialization order and its traps, and loader leaks are ideas ART shares. What changes is the instruction format, how lambdas get their classes, and who compiles code to machine code.

### The edges

- *Read Android bytecode with Android's tools.* javap reads class files; for an APK, Android Studio's APK Analyzer has a DEX file viewer that can "Show bytecode".
- *Lambdas get generated names.* d8 names the class it generates for a lambda after the class that contains it, followed by $$ExternalSyntheticLambda and a number. R8's source (d8 is part of the same project) builds the name from the containing class, the separator "$$ExternalSynthetic" and the kind "Lambda". That's the name you see in a crash trace's lines for code inside a lambda.
- *R8 can remove a class your code loads by name.* Release builds can run R8, which also shrinks code and shortens names (com.example.MyActivity can become a.b.a). R8 can't see a class that is only named in a string, as in Class.forName (puzzle 15): it may rename or remove it, and the app then crashes with `ClassNotFoundException`. The fix is a keep rule, a line in the R8 configuration that tells it to keep that class. Renamed classes are also why release crash traces must be retraced to the original names.
- *Baseline Profiles.* An app can ship a profile with its APK, so that dex2oat compiles those methods ahead of time from the first launch.
- *The JVM course ends where the Android course begins.* How ART, dex2oat and profiles decide what to compile is in the Android course, puzzles 9 and 10.

## The analogy

A recipe written in the town's standard notation (class files) is sent to a franchise kitchen abroad that uses its own notation (DEX). Before shipping, the head office translates every recipe into the franchise's format, replacing every step the franchise kitchens can't do, such as "ask the coordinator what to write here", with written-out instructions (desugaring). In the kitchen, a cook works from the recipe at first, notes which dishes are ordered most, and overnight a second cook prepares those dishes in advance (JIT, profile, dex2oat).

## Check yourself

- You unzip your release APK and search it for Bookmark.class, which kotlinc wrote during the build. What do you find?::*No Bookmark.class: its code is inside classes.dex||Bookmark.class next to classes.dex, for PathClassLoader to load >> PathClassLoader loads classes from DEX; the APK carries no class files. >> s5||Bookmark.class, unchanged, because d8 only runs for debug builds >> d8 runs in every build; it is how class files become DEX. >> s2::d8 converts every class file into DEX before packaging.
- Your app's minSdk is 30 and kotlinc compiled its lambdas with `invokedynamic`. What runs on the phone?::*A class d8 generated at build time||A class `LambdaMetafactory` creates at run time >> ART has no LambdaMetafactory; d8 always rewrites lambdas. >> s3||The `invokedynamic` instruction itself, with the JDK's bootstrap method >> The bootstrap method lives in the JDK's LambdaMetafactory, which isn't available on Android. >> the-building-block::d8 desugars lambdas whatever the minSdk.
- Which puzzle-12 trap can still bite an Android app?::*A static read before its line gives the default||None, because ART reorders static code to avoid it >> ART runs static code in written order too; the trap is in what kotlinc writes. >> the-building-block||Only the missing-class error from puzzle 15 >> Static initialization order is part of the language and what kotlinc writes, not of HotSpot. >> the-building-block::The input to d8 is the same class files.

## Sources

- [Android developers: d8](https://developer.android.com/tools/d8) ("d8 is a command-line tool that Android Studio and the Android Gradle plugin use to compile your project's Java bytecode into DEX bytecode that runs on Android devices.")
- [Android developers: Java 8+ language features](https://developer.android.com/studio/write/java8-support) ("The default toolchain implements the new language features by performing bytecode transformations, called desugar , as part of the D8/R8 compilation of class files into DEX code"; "Lambda expressions Android doesn't support the serialization of lambda expressions.")
- [Jake Wharton: Android's Java 8 support](https://jakewharton.com/androids-java-8-support/) ("This is why desguaring always happens at compile-time regardless of your minimum API level. The VM has the bytecode support for an equivalent to invokedynamic , but the JDK's built-in LambdaMetafactory is not available to use.")
- [AOSP: Android runtime and Dalvik](https://source.android.com/docs/core/runtime) ("ART as the runtime executes the Dalvik executable (DEX) format and DEX bytecode specification."; "ART also has tighter install-time verification than Dalvik.")
- [AOSP: Implement ART just-in-time compiler](https://source.android.com/docs/core/runtime/jit-compiler) ("Android runtime (ART) includes a just-in-time (JIT) compiler with code profiling that continually improves the performance of Android applications as they run."; "The JIT profile data is dumped to a file in a system directory that only the application can access. The AOT compilation ( dex2oat ) daemon parses that file to drive its compilation.")
- [Android developers: Baseline Profiles overview](https://developer.android.com/topic/performance/baselineprofiles/overview) ("By shipping a Baseline Profile in an app or library, Android Runtime (ART) can optimize specified code paths through Ahead-of-Time (AOT) compilation")
- [AOSP: Dalvik bytecode format](https://source.android.com/docs/core/runtime/dalvik-bytecode) ("The machine is register-based, and frames are fixed in size upon creation."; "binop vAA, vBB, vCC 90: add-int"; "A: destination register or pair (8 bits) B: first source register or pair (8 bits) C: second source register or pair (8 bits) Perform the identified binary operation on the two source registers, storing the result in the destination register."; the opcode table lists invoke-virtual, invoke-super, invoke-direct, invoke-static, invoke-interface and invoke-custom: "Resolves and invokes the indicated call site.")
- [AOSP: Dalvik executable format](https://source.android.com/docs/core/runtime/dex-format) ("string_ids string_id_item[] string identifiers list. These are identifiers for all the strings used by this file")
- [R8 source, SyntheticNaming.java, commit c1157c2](https://r8.googlesource.com/r8/+/c1157c24d1112a9aebafb92171a46ce531bd5b43/src/main/java/com/android/tools/r8/synthesis/SyntheticNaming.java) (line 59: LAMBDA = generator.forInstanceClass("Lambda"); lines 464–465: EXTERNAL_SYNTHETIC_CLASS_SEPARATOR = SYNTHETIC_CLASS_SEPARATOR + "ExternalSynthetic"; line 450: SYNTHETIC_CLASS_SEPARATOR = "$$"; line 570: externalSyntheticTypePrefix + separator + (kind != null ? kind.descriptor : "") + id)
- [Android developers: About keep rules](https://developer.android.com/topic/performance/app-optimization/keep-rules-overview) ("R8 can't identify when classes, fields or methods are accessed with reflection."; "R8 might rename these methods and annotations or remove them entirely, leading to a ClassNotFoundException or a NoSuchMethodException at runtime.")
- [Android developers: Troubleshoot R8](https://developer.android.com/topic/performance/app-optimization/troubleshoot-the-optimization) ("You see Class.forName(...) . Solution : Add a keep rule .")
- [Android developers: Shrink, obfuscate, and optimize your app](https://developer.android.com/build/shrink-code) ("R8 shortens the names of classes, fields, and methods (for example, com.example.MyActivity could become a.b.a )"; "retrace crashes to the original source code")
- [Android developers: APK Analyzer](https://developer.android.com/studio/debug/apk-analyzer) ("The APK Analyzer's DEX file viewer gives you immediate access to the underlying information in the DEX files in your app."; "Show bytecode, find usages, and generate Keep rule")
- [Android API reference: PathClassLoader](https://developer.android.com/reference/dalvik/system/PathClassLoader) ("Android uses this class for its system class loader and for its application class loader(s).")
