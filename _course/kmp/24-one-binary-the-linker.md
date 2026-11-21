---
title: "One binary: the linker"
short: Object code, symbols and linking
summary: Puzzle 23's LLVM wrote instructions for your code, Ktor's, the standard library's and Kotlin's runtime, but your code calls Ktor, and Ktor calls Apple. Here's the step that joins them into one framework, connects every call, and leaves out what nothing uses.
takeaway: LLVM writes object code, instructions in which each call still names its target by a symbol. The linker, the last step of the link stage, joins the object code into one binary and connects each call to the address its symbol names. Calls into Apple's frameworks stay named, to be connected on the phone. Because the link stage sees the whole program, it can leave out code nothing reaches, which is dead code elimination, and an exported module can't be trimmed because Swift, outside this build, might call any of it.
---

## The problem

Puzzle 23's link stage handed the whole program to LLVM, and LLVM wrote instructions for it: your code, Ktor's, coroutines', the standard library's, and the Kotlin runtime that puzzle 12 said every framework carries. But they came from different klibs. Your `Bookmarks` calls Ktor's `HttpClient()`, which itself calls Apple's networking code, which isn't in any klib at all. A call instruction must jump to the address where the called function's instructions are: the number that tells the processor where in memory to find them. Who fills in those addresses? And where, in all this, did puzzle 12's dead code elimination happen?

## See it

```diagram linker
```

## The building block

LLVM's output is **object code**: machine instructions that aren't a finished program yet. Wherever the code calls a function that may live elsewhere, it leaves the address open and names the function instead.

That name is a **symbol**: the name of a function or a global variable inside compiled code. Ktor's object code defines the symbol for `HttpClient()`; your object code uses it. A symbol is how two pieces of compiled code refer to each other.

The **linker** is the program that runs last in the link stage, and the stage is named after it. It takes all the object code and:

1. joins it into one binary, the framework's;
2. lays out where each function's instructions will be;
3. replaces each open call with the address its symbol now has.

Calls into Apple's frameworks are different. UIKit and Foundation are already on every iPhone, so they aren't copied in. The linker records which of Apple's frameworks the binary needs, with the symbols it uses from each, and those calls are connected on the phone, when the app starts. That's what puzzle 2 meant: the compiler "links the necessary" platform libraries.

Because the link stage sees the whole program, it's also where unused code can go. Start from the code that can be called from outside the binary, follow every call, and whatever is never reached can be left out: that's puzzle 12's dead code elimination, and now you can see why it needs this stage. A framework's code can be called from outside by Swift, through the API in its header. Swift's code isn't part of this build, so the linker can't know which of those functions Swift will call: everything in the API must stay. That's why an exported module comes in whole, unused parts included (puzzle 12).

The runtime is object code too: the garbage collector from puzzle 7 and the rest of Kotlin's runtime are linked into every Kotlin binary. Build two frameworks, and two runtimes are linked, one into each.

## The analogy

The print shop from puzzle 23 has printed every manuscript. Each one says "see the recipe called 'Ktor bread'" instead of a page number, since nobody knew the page yet. The binder puts all the sheets into one book, numbers the pages, and replaces every "see 'Ktor bread'" with "see page 214". Recipes nobody refers to, starting from the table of contents, are left out. But any recipe listed in the table of contents stays, because readers outside the shop may open the book there.

## Check yourself

- Your shared module has a function that no Kotlin code calls, and it isn't in the API Swift can see. After the link stage, is it in the framework?::*No: nothing reaches it, so the linker can leave it out||Yes: everything in a klib is copied into the binary >> The link stage sees the whole program and leaves out code nothing reaches. >> s4||Yes: the linker keeps every function in case Swift calls it >> Only code in the API Swift can see must stay; this function isn't in it. >> s4::Unreached and not exported: left out.
- Why is a call into UIKit still unconnected when the linker finishes?::*UIKit isn't copied in: it's on the phone, so the call is connected when the app starts||UIKit's code is copied into the framework but connected at runtime for speed >> Apple's frameworks aren't copied in at all; they're already on every iPhone. >> s5||The linker skips any call it can't find in a klib, and the app crashes there >> The binary records the frameworks and symbols it needs, so the calls are connected on the phone. >> s5::Apple's code lives on the phone.
- Puzzle 12 said an exported module comes in whole. What does the linker lack that would let it trim one?::*Knowing which functions Swift calls: Swift isn't part of this build||Object code for that module, since exported modules skip LLVM >> Exported modules go through LLVM like any other; what's missing is knowledge of the callers. >> the-building-block||The module's symbols, which exporting removes >> Exporting keeps the symbols; it adds the module's API to the header for Swift. >> s2::The callers are outside the build.

## Sources

- [Apple: Overview of Dynamic Libraries](https://developer.apple.com/library/archive/documentation/DeveloperTools/Conceptual/DynamicLibraries/100-Articles/OverviewOfDynamicLibraries.html) ("A static linker collects compiled source code, known as object code, and library code into one executable file"; "The static linker records the filenames of each of the dependent libraries at the time the app is linked")
- [Apple: Building your app to include debugging information](https://developer.apple.com/documentation/xcode/building-your-app-to-include-debugging-information) ("When Xcode compiles your source code into machine code, it generates a list of symbols in your app — class names, global variables, and method and function names.")
- [Kotlin docs: Platform libraries](https://kotlinlang.org/docs/native-platform-libs.html) ("The Kotlin/Native compiler automatically detects which platform libraries are accessed and links the necessary ones")
- [Kotlin docs: Build final native binaries](https://kotlinlang.org/docs/multiplatform/multiplatform-build-native-binaries.html) ("When you export a dependency, it includes all of its API to the framework API. The compiler adds the code from this dependency to the framework, even if you use a small fraction of it. This disables dead code elimination for the exported dependency")
- [Kotlin docs: Tips for improving compilation time](https://kotlinlang.org/docs/native-improving-compilation-time.html) ("Using transitiveExport = true disables dead code elimination in many cases, so the compiler has to process a lot of unused code")
- [Kotlin docs: Tips for customizing LLVM backend](https://kotlinlang.org/docs/native-llvm-passes.html) (the link stage's phases include "LinkBitcodeDependencies")
