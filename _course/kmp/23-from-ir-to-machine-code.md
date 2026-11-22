---
title: From IR to machine code
short: The link stage and LLVM
summary: Puzzle 20 left your code and every library as IR inside klibs, with machine code promised for later. Here's the later step, the program that writes the instructions for the iPhone's processor, and why Kotlin didn't write that program itself.
takeaway: Kotlin/Native builds in two stages. The compile stage, one compilation per module and target, turns each module into a klib of IR; the link stage, run once per final binary, reads every klib, translates the whole program's IR into LLVM IR already marked with the target, merges in Kotlin's runtime, and hands it to LLVM. LLVM's optimizer improves that code and its code generator writes instructions for the target's processor. LLVM is shared by many compilers, Apple's own Clang among them, so Kotlin gets an optimizer and a code generator for every processor it supports.
---

## The problem

Puzzle 20 ended with a promise: a klib holds IR, and "later, one final build" turns your klib and every library's klib into machine code. Puzzle 0 said the iPhone's processor runs native code, made during the build. So some program must take IR, which names no processor, and write instructions for exactly the iPhone's processor. Which program is it, when does it run, and why doesn't Kotlin write that part itself for each processor?

## See it

```diagram llvm
```

## The building block

Kotlin/Native builds in two stages, and Gradle shows them as two kinds of tasks.

The compile stage runs once per module and target, and it is exactly a compilation in puzzle 16's sense: one compiler run for one target, over the source sets on that target's path. The front end checks your Kotlin, and the compiler writes the result as IR into a klib (puzzle 20). Change one file, and only that module's compile stage runs again.

The **link stage** runs once per final binary, such as the framework from puzzle 5. Its Gradle tasks are named after it: `linkDebugFrameworkIosArm64` builds a debug framework for iosArm64, `linkReleaseFrameworkIosArm64` a release one. It reads the klibs of your module, of Ktor, of coroutines and of the standard library (the very klibs that puzzle 21's variants picked, still holding IR), so for the first time the compiler sees the whole program at once. (Why it's called "link" is puzzle 24.)

In the link stage, Kotlin/Native's back end does two jobs, and hands the hard one on:

1. It translates the whole program's IR into **LLVM IR**: the IR of another project, LLVM. It's a lower-level form, closer to a processor's instructions. Kotlin marks every piece of LLVM IR it writes with the target from the start (for iosArm64, an iPhone's Arm processor), but it isn't instructions yet.
2. It hands that to **LLVM**, a collection of reusable compiler parts. Its core has an optimizer, which rewrites the code to do the same work faster, and a code generator, which writes instructions for one processor. For iosArm64, that's the Arm instructions of an iPhone.

One more input joins here. Puzzle 12 said every framework carries Kotlin's runtime, with the garbage collector from puzzle 7. The runtime doesn't arrive as a klib: it ships with the compiler as files of LLVM IR, such as runtime.bc, plus one file for the garbage collector you use. The link stage merges them into your program's LLVM IR before LLVM's work, so the runtime is optimized and translated together with your code.

Why not write those two parts in Kotlin's own back end? Because they're the hardest, largest parts of a compiler, and they're needed again for every processor. LLVM already has them for many processors, and other compilers use it too: Apple's own compiler for C and Objective-C, Clang, is built on LLVM. Kotlin's docs call Kotlin/Native "an LLVM-based backend for the Kotlin compiler". So one Kotlin back end reaches iPhones, Macs, Linux and Windows.

You can watch the stages. Run the compiler with the option `-Xprofile-phases`, and it prints the time each phase took. Kotlin's docs show a run on a small program, where both stages ran in one go:

```text
Frontend: 275 msec
PsiToIr: 1186 msec
...
LinkBitcodeDependencies: 476 msec
```

Frontend is puzzle 0's front end; PsiToIr writes the IR. Bitcode is LLVM IR stored as a file, like runtime.bc, and LinkBitcodeDependencies is the phase that merges those files in. A real app's log has tens of thousands of lines, mostly LLVM's own phases: Kotlin's docs warn that a noticeable part of compilation time is spent in LLVM.

## Go deeper: What can an optimizer do to add(2, 3)?

Puzzle 0's deeper section said a compiler may "work out the answer in advance". This is where. Suppose your code calls add(2, 3). Two different tricks can follow, one after the other.

1. add is tiny, so the optimizer can copy its body into the caller instead of calling it. That's called inlining, and it doesn't care what the inputs are: the call becomes 2 + 3.
2. Now both numbers are known while compiling, so the optimizer can replace 2 + 3 with 5. That's called constant folding, and it works only on values fixed before the app runs.
3. The code generator then writes one instruction that puts 5 where the result goes. No addition is left for the iPhone to do.

This is a model of what optimizers commonly do, not a promise for every build: debug builds keep the function as written, so a debugger can step through it.

- Change the call to add(2, x), where x is read from the screen. Which of steps 1 and 2 can still happen?::Step 1 can: copying the body in doesn't need the numbers, so the call becomes 2 + x. Step 2 can't: x is only known when the app runs, so the addition stays an instruction.

## The analogy

The print shop from puzzle 20 has the whole order at last. It doesn't build its own printing press: it retypes every manuscript into the format of a big, shared press that many publishers use (LLVM IR). The press tidies the layout, then prints on whatever paper size each country needs (the processor).

## Check yourself

- You change one line in commonMain, then run the app from Xcode with a debug build for the simulator. Which stages run for your shared module?::*The compile stage writes a new klib, then the link stage makes a new framework||Only the link stage, because the old klib can be reused >> The klib holds your module's code as IR, so a changed line means a new klib first. >> s1||Only the compile stage, because the framework updates itself from the klib >> Only the link stage writes a binary; the framework isn't updated without it. >> s1::Compile, then link.
- Why does Kotlin/Native hand its code to LLVM instead of generating each processor's instructions itself?::*LLVM already optimizes code and generates it for many processors||Apple allows only programs built with LLVM to run on an iPhone >> The reason is reuse: LLVM's optimizer and code generators already exist for many processors. >> the-building-block||LLVM reads Kotlin source and skips the IR, which saves time >> LLVM never sees Kotlin: it starts from the LLVM IR that Kotlin's back end wrote. >> s2::Reuse the hardest parts of a compiler.
- Puzzle 20's klib held IR that names no processor. At which step are instructions for the iPhone's processor first written?::*When LLVM's code generator runs, in the link stage||When the front end checks the Kotlin, in the compile stage >> The compile stage writes IR, which names no processor. >> s1||When Gradle picks the ios_arm64 variant of each library >> Picking a variant (puzzle 21) only chooses which klib arrives, and that klib still holds IR. >> the-building-block::Instructions appear only at code generation.

## Sources

- [Kotlin docs: Kotlin/Native overview](https://kotlinlang.org/docs/native-overview.html) ("Kotlin/Native includes an LLVM-based backend for the Kotlin compiler and a native implementation of the Kotlin standard library.")
- [Kotlin docs: Tips for customizing LLVM backend](https://kotlinlang.org/docs/native-llvm-passes.html) ("Run the command line compiler with the provided arguments plus the -Xprofile-phases argument"; "The Kotlin/Native compiler uses LLVM to optimize and generate binary executables for different target platforms. A noticeable part of the compilation time is also spent in LLVM"; the excerpt "Frontend: 275 msec", "PsiToIr: 1186 msec", "LinkBitcodeDependencies: 476 msec"; "The log can contain tens of thousands of lines")
- [Kotlin docs: Tips for improving compilation time](https://kotlinlang.org/docs/native-improving-compilation-time.html) ("Binaries for different targets are built with linkDebug*$Target and linkRelease*$Target Gradle tasks")
- [Kotlin docs: What's new in Kotlin 2.3.0](https://kotlinlang.org/docs/whatsnew23.html) ("faster build times for release tasks like linkRelease*, for example linkReleaseFrameworkIosArm64")
- [Kotlin docs: Debugging Kotlin/Native](https://kotlinlang.org/docs/native-debugging.html) ("To get debug binaries, use linkDebug* Gradle tasks"; "The tasks differ depending on the binary type (for example, linkDebugSharedNative) or your target")
- [Kotlin docs: Build final native binaries](https://kotlinlang.org/docs/multiplatform/multiplatform-build-native-binaries.html) ("DEBUG – produces a non-optimized binary with additional metadata that is helpful when working with debugger tools")
- [The LLVM Project](https://llvm.org/) ("The LLVM Project is a collection of modular and reusable compiler and toolchain technologies"; "The LLVM Core libraries provide a modern source- and target-independent optimizer, along with code generation support for many popular CPUs"; "These libraries are built around a well specified code representation known as the LLVM intermediate representation (\"LLVM IR\")"; "Clang is an \"LLVM native\" C/C++/Objective-C compiler")
- [Kotlin/Native README, JetBrains/kotlin on GitHub](https://github.com/JetBrains/kotlin/blob/9180ce6a7a7d3627f88b424717583f28ddca052d/kotlin-native/README.md) ("Kotlin/Native is an LLVM backend for the Kotlin compiler, runtime implementation, and native code generation facility using the LLVM toolchain.")
- [Kotlin/Native compiler source, Kotlin 2.4.21: ContextUtils.kt](https://github.com/JetBrains/kotlin/blob/9180ce6a7a7d3627f88b424717583f28ddca052d/kotlin-native/backend.native/compiler/ir/backend.native/src/org/jetbrains/kotlin/backend/konan/llvm/ContextUtils.kt#L410) (every LLVM module Kotlin writes gets the target at creation: `LLVMSetDataLayout(module, runtime.dataLayout)`, `LLVMSetTarget(module, runtime.target)`)
- [Kotlin/Native compiler source, Kotlin 2.4.21: RuntimeModule.kt](https://github.com/JetBrains/kotlin/blob/9180ce6a7a7d3627f88b424717583f28ddca052d/kotlin-native/backend.native/compiler/ir/backend.native/src/org/jetbrains/kotlin/backend/konan/llvm/runtime/RuntimeModule.kt#L11) (`MAIN("runtime.bc")`, with separate files for each garbage collector such as `GC_COMMON("common_gc.bc")`), and [CompilerOutput.kt](https://github.com/JetBrains/kotlin/blob/9180ce6a7a7d3627f88b424717583f28ddca052d/kotlin-native/backend.native/compiler/ir/backend.native/src/org/jetbrains/kotlin/backend/konan/CompilerOutput.kt#L130) (the runtime's bitcode files are collected and linked as LLVM modules)
