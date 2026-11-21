---
title: Reading a crash from the field
short: Debug symbols and symbolication
summary: A user's iPhone crashed inside your Kotlin code, and the report Apple collected is a list of numbers. Here's what those numbers are, the file that turns them back into function names and lines, and why that file must be kept for every build you ship.
takeaway: A crash report holds a backtrace for each thread, the chain of functions that were running, as addresses in each binary. Symbolication turns those addresses into function names and lines, using debug information. Debug builds keep it inside the binary; for release builds, Kotlin/Native writes it to a separate dSYM file on Apple platforms. A binary and a dSYM match only when their build UUIDs are identical, so keep the dSYM of every build you ship.
---

## The problem

Your app is in the App Store. A user's iPhone crashes while saving a bookmark, and Apple's tools hand you the report. The interesting lines look like this, with the binary's name, then numbers (an example made for this puzzle, in the form Apple shows):

```text
Thread 0 Crashed:
0   shared      0x0000000104a3c1f4 0x104a20000 + 115188
1   shared      0x0000000104a3b8e0 0x104a20000 + 112864
2   MyApp       0x0000000102f1a0c8 0x102f10000 + 41160
```

The name shared is your Kotlin framework. Which function was running at 0x104a3c1f4, and on which line of your Kotlin?

## See it

```diagram dsym
```

## The building block

When an app crashes, iOS collects a **crash report**: what the app was doing at that moment. Its most useful part is a **backtrace** for each thread: the chain of functions that were running, from the one that crashed (line 0) back to the ones that called it. Each line names a binary and an address inside it, in hexadecimal: base-16 numbers, written with 0x in front. An address is where that function's instructions were, as laid out by puzzle 24's linker.

Addresses alone say almost nothing. **Symbolication** is translating them back into function names and line numbers. It needs the information the compiler had: puzzle 24's symbols, and a table from each instruction's address to the file and line it came from. That's called debug information.

Where it lives depends on the build:

- A debug build keeps debug information inside the binary, so Xcode's debugger can stop on a line of your Kotlin.
- A release build, the one users get, leaves it out of the binary to keep the app small. On Apple platforms, Kotlin/Native writes it to a separate **dSYM** file by default: a file that maps the addresses in crash reports to functions and lines.

With the matching dSYM, Xcode turns line 0 into something like "Bookmarks.add, Bookmarks.kt, line 12". If you upload your app with its symbol files, Xcode's crash list does this for you; for a report from elsewhere, you open it in Xcode, or run Apple's crashlog command on it.

But it must be the matching dSYM. Each binary and its dSYM carry the same **build UUID**, a unique ID written into both by the build. Apple's docs are strict: a binary and a dSYM are compatible "only … when they have identical build UUIDs". Build the same source again with another Xcode version or different build settings, and the UUIDs won't match. The addresses can differ too, since the code may be laid out differently. So a dSYM made today can't read a crash from last month's release: keep the dSYM of every build you ship, next to its version.

## The analogy

The book from puzzle 24 is printed with page numbers only, and a reader phones in: "it went wrong on page 214, line 9". To know which recipe that was, you need the printer's index for that exact print run. A reprint, even of the same manuscript, may move recipes to other pages, so its index points at the wrong recipes.

## Check yourself

- You shipped version 3.2 and kept no dSYM. A crash report for 3.2 arrives, so you rebuild 3.2's source today, with the newer Xcode and Kotlin your project uses now, and use that dSYM. What do you get?::*No reliable names: its build UUID won't match the shipped binary's||The right names, because the source code is exactly the same as in 3.2 >> Same source isn't enough: a build with other tool versions gets another build UUID and may lay out code differently. >> s6||The right function names, but with every line number missing >> A mismatched dSYM can't be trusted for names either; the addresses may belong to other functions. >> s6::Only the dSYM from that exact build matches.
- Why does a release build put debug information into a separate dSYM file instead of the binary?::*To keep the downloaded app small, yet still able to read crashes||Because a release binary has no room left for any names at all >> They could; Apple's release builds move debug symbols out to reduce the size of the app. >> the-building-block||So that LLVM's optimizer can't delete the debug information >> The optimizer works on code; the dSYM is written so the information survives outside the shipped app. >> the-building-block::Small app, crash data kept aside.
- A backtrace line says shared 0x104a3c1f4. Puzzle 24's linker is involved in reading it. How?::*The address points into the layout the linker chose for the code||The linker writes the crash report at the moment the app crashes >> iOS collects the report; the linker ran long before, during the build. >> s1||The linker runs again on the phone and remembers where it crashed >> The linker doesn't run on the phone; its layout is what the address refers to. >> s1::Addresses come from the linker's layout.

## Sources

- [Kotlin docs: Debugging Kotlin/Native](https://kotlinlang.org/docs/native-debugging.html) ("Crash reports typically require symbolication, the process of translating memory addresses into readable source code locations."; "you need a special debug symbol (.dSYM) file. This file maps memory addresses in crash reports with actual locations in the source code, such as functions or line numbers."; "The Kotlin/Native compiler generates .dSYM files for release (optimized) binaries on Apple platforms by default. When building in Xcode, the IDE looks for .dSYM files in standard locations and uses them automatically for symbolication.")
- [Apple: Adding identifiable symbol names to a crash report](https://developer.apple.com/documentation/xcode/adding-identifiable-symbol-names-to-a-crash-report) ("One of the most important parts of the crash report is the thread backtraces, which appear as hexadecimal addresses. You translate these addresses into readable function names and line numbers — a process called symbolication"; "You can symbolicate your crash report in Terminal using the crashlog command"; the unsymbolicated example lines in the form "0x00000001b3da6230 0x1b3348000 + 10871344")
- [Apple: Building your app to include debugging information](https://developer.apple.com/documentation/xcode/building-your-app-to-include-debugging-information) ("Debug builds of an app place the debug symbols inside the compiled binary file by default, while release builds of an app place the debug symbols in a companion debug symbol (dSYM) file to reduce the size of the distributed app"; "If you build two binaries from the same source code but with different Xcode versions or build settings, the build UUIDs for the two binaries won't match. A binary and a dSYM file are only compatible with each other when they have identical build UUIDs. Keep the dSYM files for the specific builds you distribute")
- [Kotlin docs: Build final native binaries](https://kotlinlang.org/docs/multiplatform/multiplatform-build-native-binaries.html) ("RELEASE – produces an optimized binary without debug information")
