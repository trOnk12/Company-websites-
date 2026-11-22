---
title: Build time and binary size
short: Where the minutes and megabytes go
summary: Your iOS colleagues wait minutes after every Kotlin change, and the app grew after you exported one more module. With the compile and link stages, LLVM, the linker and XCFrameworks from this module, you can now tell where the time and the bytes go, and which work to skip.
takeaway: Most Kotlin/Native time is spent in the link stage, once per final binary, and most of that in LLVM. So build only the binary you run (one target, debug), which embedAndSignAppleFrameworkForXcode and linkDebug tasks do, and leave XCFrameworks and release builds to CI. Release builds use link-time optimization, all modules optimized together, so they take an order of magnitude longer. Debug builds reuse a compilation cache of already compiled libraries, kept in ~/.konan. For size, export only what Swift calls and try the smallBinary option.
---

## The problem

Two complaints arrive in one week. The iOS developers say every change in commonMain costs them minutes before the simulator shows it. And the app's download grew after you exported one more Kotlin module to Swift. From this module you know the stages: compile to klibs (puzzle 20), link per binary through LLVM (puzzles 23 and 24), one framework per target gathered into an XCFramework (puzzle 26). Where do the minutes go, where do the bytes come from, and what can you skip?

## See it

```diagram buildtime
```

## The building block

Start with time. The compile stage is per module and fairly quick. The link stage runs once per final binary, and that's where LLVM does its optimizing and code generation (puzzle 23). So the first rule is: build only the binary you're about to run.

- Running from Xcode, the `embedAndSignAppleFrameworkForXcode` task builds the framework only for the platform Xcode is building for: one link stage, not one per target.
- From the command line, one linkDebug task for one target is enough to run your code.
- An XCFramework links every target in it (puzzle 26). Kotlin's docs say it "takes proportionally more time than building for a single target". Leave it to the build server that ships releases. Drop targets nobody uses, such as `iosX64` if no one has an Intel Mac.

Then debug versus release. Kotlin's docs say release compilation "takes an order of magnitude more time than debug". The reason is **link-time optimization**: in release, all modules are compiled and optimized together, in one large job for LLVM, which finds more to improve because it sees everything at once. A debug build skips that, and it reuses a **compilation cache**: libraries such as Ktor and the standard library are compiled to machine code once and kept, so later debug builds don't repeat that work for them. Kotlin/Native keeps these caches and downloaded tools in `~/.konan` in your home folder. On a build server that starts empty every time, that folder is rebuilt on every run unless you keep it between builds.

So during development, use debug tasks. A release build is for what you ship, and for measuring speed.

Now size. Two levers, both from this module:

- **Export less.** Each exported module comes in whole, because the linker can't know what Swift calls (puzzle 24). Kotlin's docs: "Each exported module negatively affects compilation time and binary size." Export only the modules Swift really uses, and don't switch on `transitiveExport`, which exports their dependencies too.
- **Ask LLVM for size.** The `smallBinary` option makes LLVM optimize release binaries for size instead of speed. It's experimental and can slow the app in some cases, so measure.

```kotlin
iosArm64 {
    binaries.framework {
        binaryOption("smallBinary", "true")
    }
}
```

| Lever | Saves time | Saves size |
|---|---|---|
| One target, debug, while developing | a lot | – |
| Keep `~/.konan` and Gradle's build cache on the build server | yes | – |
| Export only what Swift calls | yes | yes |
| `smallBinary` for release | some | yes |

## The analogy

The print shop from puzzle 23 again. For a proof copy, it prints one edition in draft quality, reusing plates it already made for the cookbooks it prints every week (debug with a cache). The final run prints every edition in top quality, with all books laid out together to save paper (release, link-time optimization): it's slower, so it's done once, for the shop window. Every recipe listed in the table of contents must be printed, wanted or not (exports).

## Check yourself

- An iOS developer runs `assembleXCFramework` after every Kotlin edit, then tries it in the simulator. Which change saves the most time?::*Run the app from Xcode, so embedAndSign builds one debug framework||Keep the same task but add the smallBinary option >> smallBinary is about size, and it applies to release builds; the time goes into linking every target. >> s3||Remove the iosSimulatorArm64 target, so there's one fewer to build >> Then there's no simulator build at all (puzzle 16), and nothing to run. >> s3::Build only the binary you run.
- Why does a release framework take so much longer to build than a debug one?::*Link-time optimization: all modules are optimized together in LLVM||Release builds also compile the iOS app's Swift code >> Kotlin's release link builds only the Kotlin binary; the time goes into optimizing it. >> s4||Release builds write the dSYM, which takes most of the time >> The docs name the optimizations as the cost, not the debug information. >> s4::The cost of optimizing everything together.
- After you export one more large module to Swift, the framework grows by megabytes. Which earlier idea explains it?::*The linker must keep every exported function for Swift||Exporting copies the module's klib, with all of its IR, into the app >> No klib reaches the app; the binary holds machine code, and exporting keeps all of it. >> s6||Exporting switches off LLVM's optimizer for the entire framework >> Export turns off dead code elimination for that module, not the optimizer. >> s6::Exported code can't be trimmed.

## Sources

- [Kotlin docs: Tips for improving compilation time](https://kotlinlang.org/docs/native-improving-compilation-time.html) ("linkDebug*. To run your code during development, you usually need only one binary, so running the corresponding linkDebug* task should be enough."; "during local development, it's faster to build the .framework file only for the platform you're using. To build a platform-specific framework, use the embedAndSignAppleFrameworkForXcode task."; "compiling an XCFramework (using an *XCFramework task) builds the same code for all targets, which takes proportionally more time than building for a single target"; "you don't need iosX64 if you don't run this project on iOS simulators on Intel-based Macs"; "compilation of release binaries takes an order of magnitude more time than debug binaries"; "By default, Kotlin/Native compiles release binaries in the link-time optimization (LTO) mode: all modules are compiled and optimized together. This makes release binaries faster at runtime but significantly increases compilation time."; "Kotlin/Native downloads the required components and caches some results of its work to the $USER_HOME/.konan directory"; "configure your environment to preserve ~/.konan between builds"; "It effectively sets -Oz as the default optimization argument for the compiler during the LLVM compilation phase. The option is still Experimental and might affect runtime performance in some cases."; "Using transitiveExport = true disables dead code elimination in many cases"; "Each exported module negatively affects compilation time and binary size.")
- [Kotlin docs: Kotlin/Native binary options](https://kotlinlang.org/docs/native-binary-options.html) (`binaryOption("smallBinary", "true")`; "smallBinary: Decreases the binary size for release binaries. Experimental since 2.2.20")
- [Kotlin docs: Multiplatform Gradle DSL reference](https://kotlinlang.org/docs/multiplatform/multiplatform-dsl-reference.html) ("disableNativeCache: Disables compilation cache. Use only in exceptional cases as it increases compilation time.")
- [Kotlin docs: Tips for customizing LLVM backend](https://kotlinlang.org/docs/native-llvm-passes.html) ("A noticeable part of the compilation time is also spent in LLVM")
