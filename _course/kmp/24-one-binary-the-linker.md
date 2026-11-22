---
title: "One binary: the linker"
short: Object code, symbols and linking
summary: Puzzle 23's LLVM wrote instructions for your code, Ktor's and the standard library's, but your code calls Ktor, and calls need addresses. Here's the step that joins compiled code into one framework, connects every call, and where unused code is left out.
takeaway: LLVM writes object code, instructions in which each call still names its target by a symbol. The linker, the last step of the link stage, joins object code into one binary and connects each call to the address its symbol names. In a release build, dead code elimination has already dropped unreached code from the IR, before LLVM, and the linker trims a little more; an exported module can't be trimmed, because Swift, outside this build, might call any of it.
---

## The problem

Puzzle 23's link stage handed the whole program to LLVM, and LLVM wrote instructions for it: your code, Ktor's, coroutines', the standard library's, with the runtime merged in. Your `Bookmarks` calls Ktor's `HttpClient()`. A call instruction must jump to the address where the called function's instructions are: the number that tells the processor where in memory to find them. Who fills in those addresses? And where, in all this, did puzzle 12's dead code elimination happen?

## See it

```diagram linker
```

## The building block

LLVM's output is **object code**: machine instructions that aren't a finished program yet. Wherever the code calls a function that may live in another piece of compiled code, it leaves the address open and names the function instead.

That name is a **symbol**: the name of a function or a global variable inside compiled code. Ktor's object code defines the symbol for `HttpClient()`; your object code uses it. A symbol is how two pieces of compiled code refer to each other.

The **linker** is the program that runs last in the link stage, and the stage is named after it. It takes the object code and:

1. joins it into one binary, the framework's;
2. lays out where each function's instructions will be;
3. replaces each open call with the address its symbol now has.

How many pieces it joins depends on the build, and the diagram shows the simpler case on purpose:

- In a debug build (the diagram), libraries such as Ktor come from a cache, already turned into object code on an earlier build (puzzle 30). So your module's new object code and Ktor's cached object code really are separate pieces, and the linker connects them by symbol, as drawn.
- In a release build, before LLVM runs, the link stage merges the IR of every klib into one whole, which becomes one single piece of LLVM IR, runtime included (puzzle 23). LLVM then writes one piece of object code for all your Kotlin, with the calls between your code and Ktor already connected inside it. The linker joins that one piece with what lives outside it: Apple's frameworks, whose calls stay named for later (puzzle 25).

Now the unused code. Dead code elimination (puzzle 12) starts from the code that can be called from outside the binary, follows every call, and drops what is never reached. It doesn't happen in the linker: Kotlin/Native's back end runs it on the IR, after the merge and before LLVM, so LLVM never spends time on dropped code. And it runs only in release builds: in Kotlin's compiler code, the step is switched on only when the build is optimized and uses no cached libraries. A debug build keeps unused code.

The linker then trims a second, smaller time: Kotlin hands it the option `-dead_strip`, which removes pieces of machine code that nothing refers to.

Code that can be called from outside is the starting point, and that is the catch. A framework's code can be called by Swift, through the API in its header. Swift's code isn't part of this build, so nobody here can know which of those functions Swift will call: everything in the API must stay. That's why an exported module comes in whole (puzzle 12): exporting puts its whole API into the header.

## The analogy

The print shop from puzzle 23 prints manuscripts that say "see the recipe called 'Ktor bread'" instead of a page number, since nobody knew the page yet. The bookbinder puts the sheets into one book, numbers the pages, and replaces every "see 'Ktor bread'" with "see page 214". For the final edition, the editor has already struck out every recipe nothing refers to, starting from the table of contents, before anything was printed; the bookbinder only trims a few stray sheets. But any recipe listed in the table of contents stays, because readers outside the shop may open the book there.

## Check yourself

- Your shared module has a function that no Kotlin code calls, and it isn't in the API Swift can see. You build a release framework. Is the function in it?::*No: dead code elimination dropped it from the IR, before LLVM||Yes: dead code elimination runs only in the linker, and the function has a symbol >> It runs in Kotlin/Native's back end on the IR, before LLVM; the linker's trim comes later and is smaller. >> s4||Yes: everything in a klib is copied into the binary >> A release build follows calls from the API and drops what nothing reaches. >> s4::Release: unreached and not exported, so dropped before LLVM.
- In a debug build, your code calls Ktor's `HttpClient()`, and Ktor's code comes from the cache. How does the linker know where that call should jump?::*By the symbol: Ktor's object code defines it, yours uses it||From Ktor's klib manifest, which lists the address of every function >> The manifest names the target and the libraries Ktor needs; addresses are laid out by the linker. >> s2||It doesn't: the call is connected on the phone when the app starts >> Both pieces end up inside one binary, so the linker connects the call during the build. >> s3::Symbols connect separate pieces of object code.
- Puzzle 12 said an exported module comes in whole. Why can't dead code elimination trim it?::*Swift, which may call any of its API, isn't part of this build||Exported modules skip LLVM, so there's nothing to trim >> Exported code goes through LLVM like any other; what's missing is knowledge of the callers. >> the-building-block||Exporting removes the module's symbols, so the trim can't find them >> Exporting keeps the symbols; it adds the module's API to the header for Swift. >> the-building-block::The callers are outside the build.

## Sources

- [Apple: Overview of Dynamic Libraries](https://developer.apple.com/library/archive/documentation/DeveloperTools/Conceptual/DynamicLibraries/100-Articles/OverviewOfDynamicLibraries.html) ("A static linker collects compiled source code, known as object code, and library code into one executable file")
- [Apple: Building your app to include debugging information](https://developer.apple.com/documentation/xcode/building-your-app-to-include-debugging-information) ("When Xcode compiles your source code into machine code, it generates a list of symbols in your app — class names, global variables, and method and function names.")
- [Kotlin docs: Build final native binaries](https://kotlinlang.org/docs/multiplatform/multiplatform-build-native-binaries.html) ("When you export a dependency, it includes all of its API to the framework API. The compiler adds the code from this dependency to the framework, even if you use a small fraction of it. This disables dead code elimination for the exported dependency")
- [Kotlin docs: Tips for improving compilation time](https://kotlinlang.org/docs/native-improving-compilation-time.html) ("Using transitiveExport = true disables dead code elimination in many cases, so the compiler has to process a lot of unused code")
- [Kotlin/Native compiler source, Kotlin 2.4.21: TopLevelPhases.kt](https://github.com/JetBrains/kotlin/blob/9180ce6a7a7d3627f88b424717583f28ddca052d/kotlin-native/backend.native/compiler/ir/backend.native/src/org/jetbrains/kotlin/backend/konan/driver/phases/TopLevelPhases.kt#L514) (`val runGlobalOptimizations = optimize && !context.config.cachedLibraries.hasStaticCaches`; line 535: `val dceResult = runAndMeasurePhase(DCEPhase, DCEInput(module, moduleDFG), disable = !runGlobalOptimizations)`, before line 543's `CodegenPhase`, which hands the code to LLVM; lines 554–555: `mergeDependencies` adds every dependency's files to the one module, `targetModule.files.addAll(0, dependencies.flatMap { it.files })`)
- [Kotlin/Native compiler source, Kotlin 2.4.21: Linker.kt](https://github.com/JetBrains/kotlin/blob/9180ce6a7a7d3627f88b424717583f28ddca052d/kotlin-native/backend.native/compiler/ir/backend.native/src/org/jetbrains/kotlin/backend/konan/Linker.kt#L128) (for a framework: `additionalLinkerArgs = listOf("-dead_strip", "-install_name", …)`)
