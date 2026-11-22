---
title: Reading a crash from the field
short: Debug symbols and symbolication
summary: A user's iPhone crashed inside your Kotlin code, and the report Apple collected is a list of numbers. Here's what those numbers are, the file that turns them back into function names and lines, how the report says which file you need, and where to keep it for every build you ship.
takeaway: A crash report's backtrace gives each address as the binary's load address plus an offset. The load address changes from launch to launch; the offset is fixed by the linker, and that's what a dSYM maps to a function and a line. The report's Binary Images section names each binary's build UUID, and only the dSYM with the same UUID matches. Kotlin writes the dSYM next to every release framework: keep it, or upload it, for every build you ship.
---

## The problem

Your app is in the App Store. A user's iPhone crashes while saving a bookmark, and you get the report: through Xcode, if you shipped through App Store Connect, Apple's website for sending apps to the App Store and to testers; or through a crash-reporting service your app uses. The interesting lines look like this, with the binary's name, then numbers (an example made for this puzzle, in the form Apple shows):

```text
Thread 0 Crashed:
0   shared      0x0000000104a3c1f4 0x104a20000 + 115188
1   shared      0x0000000104a3b8e0 0x104a20000 + 112864
2   MyApp       0x0000000102f1a0c8 0x102f10000 + 41160
```

The name shared is your Kotlin framework. Which function was running at 0x104a3c1f4, and on which line of your Kotlin? And why does each line carry three numbers?

## See it

```diagram dsym
```

## The building block

When an app crashes, iOS collects a **crash report**: what the app was doing at that moment. Its most useful part is a **backtrace** for each thread: the chain of functions that were running, from the one that crashed (line 0) back to the ones that called it. Each line names a binary and an address inside it, in hexadecimal: base-16 numbers, written with 0x in front.

The three numbers are one sum. Puzzle 24's linker laid out the binary, so it fixed where each function sits inside it. But it didn't decide where in memory the binary itself goes: iOS chooses that at launch, and on purpose it randomizes it, so the place changes from one launch to the next (Apple calls this address space layout randomization). The place where the binary begins in that run is its **load address**. So each line reads:

address = load address + offset

0x104a3c1f4 is 0x104a20000, where shared was loaded this time, plus 115188 bytes into the binary. The offset is the part the linker fixed, the same on every phone and every launch; the load address is not.

Addresses alone say almost nothing. **Symbolication** is translating them back into function names and line numbers. It needs the information the compiler had: puzzle 24's symbols, and a table from each offset in the binary to the file and line it came from. That's called debug information.

Where it lives depends on the build:

- A debug build keeps puzzle 24's symbols in the binary, and Kotlin/Native writes its debug information beside it, so Xcode's debugger can stop on a line of your Kotlin.
- A release build, the one users get, has its symbols stripped from the binary to keep the app small. On Apple platforms, Kotlin/Native writes it to a separate **dSYM** file by default: a file that maps the offsets in a binary to functions and lines. It lands next to the framework, named after it: build/bin/iosArm64/releaseFramework/shared.framework.dSYM.

But it must be the matching dSYM. Each binary and its dSYM carry the same **build UUID**, a unique ID written into both by the build. Build the same source again with another Xcode version or other settings, and the UUIDs won't match; the layout, and so the offsets, can differ too. Apple's docs are strict: a binary and a dSYM are compatible "only … when they have identical build UUIDs". The crash report says which one you need: its Binary Images section, at the bottom, lists every binary loaded in the app, with its load address and its build UUID. On your Mac, two commands close the loop:

```bash
dwarfdump --uuid shared.framework.dSYM    # prints the dSYM's UUID: compare it
xcrun crashlog MyApp.ips                   # symbolicates a whole report
```

With the matching dSYM, line 0 becomes something like "Bookmarks.add, Bookmarks.kt, line 12". In practice, the dSYM must reach whoever symbolicates:

- Shipping through App Store Connect, include debug symbols in the upload, and Xcode's Crashes organizer symbolicates for you.
- A crash-reporting service needs its own copy: Firebase Crashlytics, for example, uploads dSYMs from a build script, and has an upload-symbols tool for files it missed.
- Either way, keep each release's dSYM, next to its version number, as long as that version is in use. A dSYM made today can't read last month's crash.

## The analogy

The book from puzzle 24 is printed with page numbers only. A reader phones in: "it went wrong 9 pages into the cookbook, which started at page 200 of my folder today". The start page depends on what else is in their folder, so it changes; "9 pages in" doesn't. To know which recipe that was, you need the printer's index for that exact print run, and the cover tells you which run it is. A reprint, even of the same manuscript, may move recipes around, so its index points at the wrong ones.

## Check yourself

- The same crash happens twice. The first report says shared 0x104a3c1f4 0x104a20000 + 115188; the second, from a later launch, a different first number. Which number does the dSYM need to find the function?::*The offset, 115188, which the linker fixed and which stays the same||The full address, 0x104a3c1f4, since it's the exact place that crashed >> That address is only valid for one launch: the load address changes, the offset doesn't. >> s2||The load address, since it says where the framework's code begins >> The load address is where iOS put the binary this time; the function is found by the offset inside it. >> s2::Offsets are fixed at build time; load addresses change at launch.
- You shipped version 3.2 and kept no dSYM. A crash report for 3.2 arrives, so you rebuild 3.2's source today, with the newer Xcode and Kotlin your project uses now, and use that dSYM. What do you get?::*No reliable names: its build UUID won't match the one in the report's Binary Images||The right names, because the source code is exactly the same as in 3.2 >> Same source isn't enough: a build with other tool versions gets another build UUID and may lay out code differently. >> s5||The right function names, but with every line number missing >> A mismatched dSYM can't be trusted for names either; the offsets may belong to other functions. >> s5::Only the dSYM from that exact build matches.
- Why does a release build put debug information into a separate dSYM file instead of the binary?::*To keep the downloaded app small, yet still able to read crashes||Because a release binary has no room left for any names at all >> It could hold them; Apple's release builds move debug symbols out to reduce the size of the app. >> the-building-block||So that LLVM's optimizer can't delete the debug information >> The optimizer works on code; the dSYM is written so the information survives outside the shipped app. >> the-building-block::Small app, crash data kept aside.

## Sources

- [Kotlin docs: Debugging Kotlin/Native](https://kotlinlang.org/docs/native-debugging.html) ("Crash reports typically require symbolication, the process of translating memory addresses into readable source code locations."; "you need a special debug symbol (.dSYM) file. This file maps memory addresses in crash reports with actual locations in the source code, such as functions or line numbers."; "The Kotlin/Native compiler generates .dSYM files for release (optimized) binaries on Apple platforms by default. When building in Xcode, the IDE looks for .dSYM files in standard locations and uses them automatically for symbolication.")
- [Apple: Adding identifiable symbol names to a crash report](https://developer.apple.com/documentation/xcode/adding-identifiable-symbol-names-to-a-crash-report) ("One of the most important parts of the crash report is the thread backtraces, which appear as hexadecimal addresses. You translate these addresses into readable function names and line numbers — a process called symbolication"; "If you include debug symbols when you upload your app to App Store Connect for distribution in the App Store or TestFlight, the Crashes organizer in Xcode automatically symbolicates the crash reports for you."; "You can symbolicate your crash report in Terminal using the crashlog command. Enter xcrun crashlog with the path to the crash report you want to symbolicate"; the example `% xcrun crashlog /Users/.../TouchCanvas.ips`; the unsymbolicated line "0 TouchCanvas 0x1045a19b4 0x10459c000 + 22964"; for atos, "Note its architecture and load address")
- [Apple: Examining the fields in a crash report](https://developer.apple.com/documentation/xcode/examining-the-fields-in-a-crash-report) ("The binary images section of a crash report lists all code loaded in the process at the time that it crashes"; "The first address is the binary's load address."; "A build UUID that uniquely identifies the binary image. Use this value to locate the corresponding dSYM file when symbolicating the crash report.")
- [Apple: Locating a missing debug symbol file](https://developer.apple.com/documentation/xcode/locating-a-missing-debug-symbol-file) ("The build UUID links the two files. A binary and its .dSYM file are compatible only when their build UUIDs match."; "use dwarfdump to retrieve its build UUID. In Terminal, run dwarfdump with the --uuid option and the path to the .dSYM file")
- [Apple: Building your app to include debugging information](https://developer.apple.com/documentation/xcode/building-your-app-to-include-debugging-information) ("Debug builds of an app place the debug symbols inside the compiled binary file by default, while release builds of an app place the debug symbols in a companion debug symbol (dSYM) file to reduce the size of the distributed app"; "If you build two binaries from the same source code but with different Xcode versions or build settings, the build UUIDs for the two binaries won't match. A binary and a dSYM file are only compatible with each other when they have identical build UUIDs. Keep the dSYM files for the specific builds you distribute")
- [Apple Platform Security: Runtime process security](https://support.apple.com/guide/security/runtime-process-security-sec15bfe098e/web) ("ASLR randomly arranges the memory addresses of executable code, system libraries, and related programming constructs"; "Xcode, and the iOS or iPadOS development environments, automatically compile third-party programs with ASLR support turned on.")
- [Kotlin/Native compiler source, Kotlin 2.4.21: OutputFiles.kt](https://github.com/JetBrains/kotlin/blob/9180ce6a7a7d3627f88b424717583f28ddca052d/kotlin-native/backend.native/compiler/ir/backend.native/src/org/jetbrains/kotlin/backend/konan/OutputFiles.kt#L63) (`val symbolicInfoFile = "$nativeBinaryFile.dSYM"`: the dSYM is the binary's own path plus .dSYM)
- [Firebase docs: Get readable crash reports in the Crashlytics dashboard](https://firebase.google.com/docs/crashlytics/ios/get-deobfuscated-reports) ("By default, Firebase Crashlytics automatically processes your debug symbol (dSYM) files"; "you configured a run script to automatically process dSYMs and upload the files"; "upload-symbols script that you can call from anywhere in your build process to manually upload your dSYM files")
