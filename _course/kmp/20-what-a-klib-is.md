---
title: What a klib is
short: The library file of Kotlin/Native
summary: In puzzle 19, one line in commonMain brought Ktor's core into every iOS source set. But something has to arrive on disk for the iOS build to use. Open that file, see what's inside, and why it isn't machine code yet.
takeaway: Every Kotlin/Native compilation writes a klib, a zip file for one target. Inside are the code as IR, the compiler's own checked form of it, a description of every declaration, and a manifest naming the target and the libraries it needs. A klib can't run; machine code is made later, once, when the final binary such as the framework is built.
---

## The problem

In puzzle 19, you added Ktor's core library to commonMain, and iosMain could call it. In puzzle 16, each target was built by its own compilation. So when iosArm64's main compilation runs, some file from Ktor must be on disk for it to read, and your own module must write a file for whatever uses it next.

Puzzle 0 said Kotlin/Native produces native code during the build. But Ktor's file was published months before your app existed. It can't know which other code your app will contain, so how could it already be your app's machine code? What is in that file?

## See it

```diagram klib
```

## The building block

Every Kotlin/Native compilation writes a **klib**, short for Kotlin library: one file, for one target. It's a zip file with a fixed set of folders. Here is the real file that Ktor's core publishes for iosArm64, unpacked:

```text
ktor-client-core-iosarm64-3.6.1.klib
└── default/
    ├── ir/                       the code, as IR
    ├── linkdata/                 one folder per package: its declarations
    │   ├── package_io.ktor.client/
    │   └── …
    ├── targets/ios_arm64/        the one target it was built for
    └── manifest
```

Three parts matter.

**IR**, short for intermediate representation, is the code after the compiler's front end (puzzle 0) has read and checked it. It's no longer Kotlin text, and not yet instructions for any processor: it's the compiler's own form of your functions, stored so the compiler can pick them up again later.

The linkdata folders describe every declaration: each class, function and type, with its parameters. When your iosMain calls `HttpClient()`, the compiler checks that call against this description. It doesn't need Ktor's source.

The **manifest** is a short text file about the library itself. Ktor's says, among other lines:

```text
native_targets=ios_arm64
depends=stdlib … org.jetbrains.kotlinx\:kotlinx-coroutines-core …
unique_name=io.ktor\:ktor-client-core
```

So it names the one target it was built for and the libraries it needs. That's why one klib can't serve another target: the iosSimulatorArm64 compilation needs Ktor's iossimulatorarm64 klib.

Now the contradiction from the problem. A klib can't be run, and it can't be handed to Xcode as a library. Kotlin's docs say so plainly. Machine code is still made during the build, as puzzle 0 said, but at a later step: when a final binary, such as the framework from puzzle 5, is built. That step reads the klibs of your module and of every library it uses, and turns them all into machine code at once. Module 5 opens that step, and puzzle 30 shows the one shortcut: debug builds keep libraries they already turned into machine code once, in a cache, instead of redoing them every time.

Your own shared module works the same way. Each of its Kotlin/Native compilations writes a klib, and the framework build reads it.

## Go deeper: What does IR look like?

The real IR is a tree of objects inside the compiler. As a simplified model, puzzle 0's add function might be stored as:

```text
function add(a: Int, b: Int): Int
└── return
    └── call Int.plus
        ├── receiver: a
        └── argument: b
```

Every name is resolved: the plus sign has become a call to one exact function, Int.plus, with its types known. Nothing in it says "Arm" or "register": that only appears when the later step picks a processor.

- In the model, change both parameters of add from Int to Long. What changes in the tree?::The call becomes Long.plus and the types become Long. The tree's shape stays the same, and it still names no processor.

## The analogy

A cookbook sent to a print shop as a manuscript, not as printed books. The text is checked and final, and its table of contents lists every recipe, so other authors can refer to a page. But it isn't printed yet: the print shop prints it together with the other manuscripts in the same order, in one run, once it knows the whole order.

## Check yourself

- Your shared module declares iosArm64 and iosSimulatorArm64. You hand a colleague only the klib from the iosArm64 compilation and ask them to build for the simulator. What happens?::*It can't be used: its manifest names ios_arm64 as its only target||It works, because IR names no processor, so any target can use it >> IR names no processor, but the klib is still built for one target, and its manifest names that target. >> s3||It works on the simulator, but more slowly than a real iPhone >> Nothing runs at all: the simulator target needs its own klib. >> s3::One klib, one target.
- Why can a klib that Ktor published months ago serve your new app?::*It holds checked IR, and machine code is made later for the whole app||It holds machine code for every iPhone, so any app can load it as it is >> A klib holds no machine code; it can't be loaded or run on its own. >> s4||The compiler reads Ktor's Kotlin source from the klib and compiles it again >> The klib holds IR and declarations, not Kotlin source; the front end already did its work. >> s3::Not machine code yet: IR, made into machine code later.
- In iosMain you call a Ktor function with the wrong argument type. Ktor's klib is on disk, but its source code isn't. Which part lets the compiler report the error?::*The description of each declaration in the klib's linkdata||The manifest, since it lists every function the library has >> The manifest names the target and the libraries it needs; the declarations are described in linkdata. >> the-building-block||Nothing: without Ktor's source, the call can only fail when the app runs >> The klib describes every declaration, so the call is checked at build time. >> the-building-block::Declarations are described in the klib.

## Sources

- [Kotlin docs: Kotlin/Native libraries](https://kotlinlang.org/docs/native-libraries.html) ("Kotlin/Native libraries are zip files containing a predefined directory structure"; the layout lists "ir/ - Serialized Kotlin IR.", "linkdata/ - A set of ProtoBuf files with serialized linkage metadata." and "manifest - A file in the java property format describing the library."; klib utility: "dump-ir: Dump the intermediate representation (IR) of library declarations")
- [Kotlin docs: Build final native binaries](https://kotlinlang.org/docs/multiplatform/multiplatform-build-native-binaries.html) ("By default, a Kotlin/Native target is compiled down to a *.klib library artifact, which can be consumed by Kotlin/Native itself as a dependency but cannot be executed or used as a native library.")
- [Maven Central: ktor-client-core-iosarm64 3.6.1](https://repo1.maven.org/maven2/io/ktor/ktor-client-core-iosarm64/3.6.1/), the published klib, unpacked for this puzzle: folders `default/ir`, `default/linkdata/package_io.ktor.client`, `default/targets/ios_arm64`; manifest lines `native_targets=ios_arm64`, `unique_name=io.ktor\:ktor-client-core`
- [Kotlin docs: K2 compiler migration guide](https://kotlinlang.org/docs/k2-compiler-migration-guide.html) ("the new JVM and JS IR (Intermediate Representation) backends that share logic, simplifying code generation for targets on different platforms")
