---
title: One Kotlin, many machines
short: Compiler and targets
summary: Your app's rules are written twice, once for Android and once for iOS. Here's how one Kotlin file ends up running on both, even though an iPhone can't run Android's kind of code.
takeaway: The Kotlin compiler has one front end that reads your code and one back end per target. For Android it produces bytecode for a virtual machine; for iOS, Kotlin/Native produces native code that runs directly on the CPU.
---

## The problem

Your login rules, your price calculation, your sync logic: in most teams they're written twice, in Kotlin for Android and in Apple's own language for iOS. Every bug gets fixed twice, and the two copies drift apart. Kotlin runs on the JVM, the Java Virtual Machine, a program that runs compiled Kotlin and Java on any computer, and an iPhone has no JVM. So how can one Kotlin file run on both?

## See it

```diagram targets
```

## The building block

A **compiler** turns your source code into something a machine can run. Kotlin's compiler works in two halves. The **front end** reads your code and checks it: types, nullability, every rule of the language. It's the same whatever you build for. Then a **back end** turns the checked code into output for one kind of machine.

Each platform you build for is a **target**: Android, the JVM (servers and desktop apps run on it), iOS, the web. Each target has its own back end.

For Android, the back end produces **bytecode**: instructions for a virtual machine, not for any one CPU (on the phone, it's turned into the DEX that ART runs; ART is Android's own virtual machine, a close cousin of the JVM, which is why Android and the JVM are separate targets). An iPhone has no virtual machine to run bytecode. So for iOS there's Kotlin/Native: a back end, built on a widely used compiler toolkit, that produces **native code**, machine code for the iPhone's own CPU, which runs directly, with nothing in between.

Same Kotlin, same checks, two kinds of output. That's what makes the rest of this course possible.

## The analogy

One recipe, two kitchens. A head chef reads and checks the recipe once (the front end). Then each kitchen's cook rewrites it for their own equipment (a back end): one for a kitchen with a helper who reads instructions aloud (a virtual machine), one for a kitchen where the cook works the stove directly (native code).

## Check yourself

- Your shared Kotlin already runs on Android and iOS. You add a desktop target. What happens to the shared code?::*It stays the same, and the compiler adds another back end for desktop||You rewrite it in a desktop language, then share the tests >> The shared Kotlin is compiled again, by another back end. Nothing is rewritten. >> s4||It has to be checked again by a new front end for desktop >> There's one front end for every target; only the back end differs. >> s2::One front end, one back end per target.
- Why can't an iPhone just run the Android bytecode?::*Because an iPhone has no virtual machine to run bytecode||Because Apple's CPUs are too slow to run bytecode in time >> Speed isn't the issue: bytecode needs a virtual machine, and iOS doesn't have one. >> s3::Bytecode needs a virtual machine; native code needs only the CPU.
- What's the difference between bytecode and native code?::*Bytecode is for a virtual machine; native code runs directly on the CPU||Bytecode is Kotlin's code; native code is Apple's own code >> Both come from your Kotlin; they differ in what runs them. >> s4||Native code is bytecode that has been compressed >> They're different instructions for different machines, not a smaller copy. >> s3::What runs it: a virtual machine, or the CPU itself.

## Sources

- [Kotlin docs: Kotlin/Native overview](https://kotlinlang.org/docs/native-overview.html) ("Kotlin/Native is a technology for compiling Kotlin code to native binaries that can run without a virtual machine. Kotlin/Native includes an LLVM-based backend for the Kotlin compiler… primarily designed to allow compilation for platforms on which virtual machines are not desirable or possible, such as embedded devices or iOS")
- [Kotlin docs: The basics of Kotlin Multiplatform project structure](https://kotlinlang.org/docs/multiplatform/multiplatform-discover-project.html) ("Targets define the platforms to which Kotlin compiles the common code. These could be, for example, the JVM, JS, Android, iOS, or Linux.")
