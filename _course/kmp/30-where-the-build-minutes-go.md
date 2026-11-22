---
title: Where the build minutes go
short: Link stage, release builds and three caches
summary: Your iOS colleagues wait minutes after every Kotlin change. With the compile and link stages, LLVM, XCFrameworks and Xcode's Run Script from this module, you can now tell where the time goes, which work to skip, and which of three different caches saves what.
takeaway: Most Kotlin/Native time is the link stage, once per final binary, and most of that is LLVM. So build only the binary you run (Xcode's embedAndSign task, or one linkDebug task), and leave XCFrameworks and release builds to the build server: release builds optimize all modules together and take about ten times longer. Debug builds take a shortcut, a compilation cache of libraries already turned into machine code; Gradle's build cache and configuration cache are two other caches that save other work.
---

## The problem

Your iOS colleagues complain: every change in commonMain costs them minutes before the simulator shows it, and the build server takes even longer. From this module you know the stages: compile to klibs (puzzle 20), link per binary through LLVM (puzzles 23 and 24), one framework per target gathered into an XCFramework (puzzle 26), started from Xcode by a Run Script (puzzle 27). Where do the minutes go, and what can you skip?

## See it

```diagram buildtime
```

## The building block

The compile stage is per module and fairly quick. The link stage runs once per final binary, and that's where LLVM does its optimizing and code generation (puzzle 23); Kotlin's docs warn that "a noticeable part of the compilation time is also spent in LLVM". So the first rule is: build only the binary you're about to run.

- Running from Xcode, puzzle 27's `embedAndSignAppleFrameworkForXcode` links only the framework for the platform Xcode is building: one link, not one per target.
- From the command line, one linkDebug task for one target is enough to run your code.
- An XCFramework links every target in it (puzzle 26), and Kotlin's docs say it "takes proportionally more time than building for a single target": two targets, about twice the links. Leave it to the build server that ships releases, and drop targets nobody uses, such as `iosX64` if no one has an Intel Mac.

Then debug versus release. Kotlin's docs say release compilation "takes an order of magnitude more time than debug", about ten times. The reason is **link-time optimization**: by default, a release build compiles and optimizes all modules together, your klibs and every library's, in one large job, which finds more to improve because it sees everything at once (that's puzzle 24's merge into one piece). So during development, use debug tasks; a release build is for what you ship, and for measuring speed.

Debug builds are faster for a second reason, and it qualifies what puzzle 20 said. Puzzle 20 said machine code is made at the final link, and that's still the default for a release build. Debug builds take a shortcut: a **compilation cache**, libraries such as Ktor and the standard library already turned into machine code once, kept, and reused by every later debug build, so only your own module is compiled again. Kotlin/Native keeps it with its downloaded tools in `~/.konan`, in your home folder. Since Kotlin 2.4.20, you can let release builds use caches too, as an experiment, with two lines in gradle.properties:

```properties
kotlin.native.binary.enableReleaseBinaryCache=true
kotlin.internal.native.enableReleaseBinaryCache=true
```

That makes release builds faster "at the expense of some compiler optimizations", in the docs' words, so measure the result (puzzle 31 shows one optimization it costs).

"Cache" names three different things here, and they save different work. Besides Kotlin/Native's compilation cache, there's **Gradle's build cache**, which stores the outputs of Gradle tasks and reuses them when a task's inputs haven't changed, and **Gradle's configuration cache**, which stores the result of Gradle reading your build files:

| Cache | What it keeps | Where | Switched on by |
|---|---|---|---|
| Kotlin/Native's compilation cache | libraries already compiled to machine code | `~/.konan` | default for debug builds |
| Gradle's build cache | any task's outputs, such as a klib, reused when the task's inputs haven't changed, even from another build or machine | a local folder, or a shared server | `org.gradle.caching=true` |
| Gradle's configuration cache | the result of Gradle reading your build files, so the next build skips that step | .gradle/configuration-cache, in your project | `org.gradle.configuration-cache=true` |

On a build server that starts empty every time, all three start cold: the first build downloads Kotlin/Native's tools and rebuilds the caches. So keep `~/.konan` between builds, as Kotlin's docs advise, and use a shared Gradle build cache. And the server that links Apple targets must be a Mac (puzzle 28).

## The analogy

The print shop from puzzle 23 again. For a proof copy, it prints one edition in draft quality, reusing plates it already made for the cookbooks it prints every week (debug, with the compilation cache). The final run prints every edition in top quality, with all books laid out together to save paper (release, link-time optimization): it's slower, so it's done once, for the shop window. The shop also keeps finished pages from past orders that nobody changed (Gradle's build cache), and the order form already filled in from last time (the configuration cache).

## Check yourself

- An iOS developer runs `assembleXCFramework` after every Kotlin edit, then tries it in the simulator. Which change saves the most time?::*Run the app from Xcode, so embedAndSign links one debug framework||Keep the same task, but add the iosX64 target so all Macs are covered >> That's one more target to link, so it takes longer, not shorter. >> s2||Turn on Gradle's configuration cache and keep the same task >> It skips reading the build files; every target is still linked, in debug and in release. >> s2::Build only the binary you run.
- Why does a release framework take so much longer to build than a debug one?::*Link-time optimization: all modules optimized together||Release builds also compile the iOS app's Swift code along with it >> Kotlin's release link builds only the Kotlin binary; the time goes into optimizing it. >> s3||Release builds write the dSYM file, and that takes most of the time >> The docs name the optimizations as the cost, not the debug information. >> s3::The cost of optimizing everything together.
- Your build server starts every job on a fresh machine, and its debug builds of the framework are much slower than on your Mac. Which cache is missing, and what fixes it?::*Kotlin/Native's compilation cache: keep ~/.konan between builds||Gradle's configuration cache: switch it on, since it stores compiled libraries >> The configuration cache stores the result of reading the build files, not compiled code. >> the-building-block||None: debug builds never use a cache >> Debug builds reuse libraries already compiled to machine code, kept in ~/.konan. >> the-building-block::Each cache saves different work.

## Sources

- [Kotlin docs: Tips for improving compilation time](https://kotlinlang.org/docs/native-improving-compilation-time.html) ("linkDebug*. To run your code during development, you usually need only one binary, so running the corresponding linkDebug* task should be enough."; "during local development, it's faster to build the .framework file only for the platform you're using. To build a platform-specific framework, use the embedAndSignAppleFrameworkForXcode task."; "compiling an XCFramework (using an *XCFramework task) builds the same code for all targets, which takes proportionally more time than building for a single target"; "you don't need iosX64 if you don't run this project on iOS simulators on Intel-based Macs"; "compilation of release binaries takes an order of magnitude more time than debug binaries"; "By default, Kotlin/Native compiles release binaries in the link-time optimization (LTO) mode: all modules are compiled and optimized together. This makes release binaries faster at runtime but significantly increases compilation time."; "kotlin.native.binary.enableReleaseBinaryCache=true", "kotlin.internal.native.enableReleaseBinaryCache=true"; "Kotlin/Native downloads the required components and caches some results of its work to the $USER_HOME/.konan directory"; "configure your environment to preserve ~/.konan between builds"; "For local caching, add org.gradle.caching=true to your gradle.properties file"; "The Gradle configuration cache improves build performance by caching the results of the configuration phase"; "add the org.gradle.configuration-cache=true property to your gradle.properties file")
- [Kotlin docs: Kotlin/Native binary options](https://kotlinlang.org/docs/native-binary-options.html) ("enableReleaseBinaryCache true false (default) Enables the compiler to use caches in release mode, making builds faster at the expense of some compiler optimizations. Experimental since 2.4.20")
- [Kotlin docs: Multiplatform Gradle DSL reference](https://kotlinlang.org/docs/multiplatform/multiplatform-dsl-reference.html) ("disableNativeCache: Disables compilation cache. Use only in exceptional cases as it increases compilation time.")
- [Kotlin docs: Tips for customizing LLVM backend](https://kotlinlang.org/docs/native-llvm-passes.html) ("A noticeable part of the compilation time is also spent in LLVM")
- [Gradle docs: Build Cache](https://docs.gradle.org/current/userguide/build_cache.html) ("The Gradle build cache is a cache mechanism that aims to save time by reusing outputs produced by other builds. The build cache works by storing (locally or remotely) build outputs and allowing builds to fetch these outputs from the cache when it is determined that inputs have not changed"; "The built-in local build cache, DirectoryBuildCache, uses a directory to store build cache artifacts.")
- [Gradle docs: Configuration Cache](https://docs.gradle.org/current/userguide/configuration_cache.html) ("The Configuration Cache improves build performance by caching the result of the configuration phase and reusing it for subsequent builds."; "a cache entry stored under .gradle/configuration-cache in the project directory")
