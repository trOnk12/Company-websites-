---
title: Where the megabytes come from
short: Exports, dead code and smallBinary
summary: The app's download grew after you exported one more Kotlin module to Swift. With puzzle 24's dead code elimination and puzzle 12's exports, you can now tell which code reaches the framework, why exported code always does, and which levers make the binary smaller.
takeaway: In a release build, dead code elimination drops every function nothing reaches from the API Swift can call, and the linker trims a little more. An exported module puts its whole API into the header, so none of it can be dropped: export only what Swift calls, never transitively, and remember export needs an api dependency. smallBinary asks LLVM to optimize for size, a second, separate step; measure size on release builds, never debug.
---

## The problem

Puzzle 30 found where the minutes go. The second complaint: the app's download grew by megabytes after you exported one more Kotlin module to Swift, and a colleague, measuring a debug build, says the framework is "full of code nobody calls". From puzzle 24 you know that dead code elimination exists, and from puzzle 12 that an exported module comes in whole. Which code really reaches the framework, and which levers shrink it?

## See it

```diagram binsize
```

## The building block

Start with what a release build keeps. Dead code elimination (puzzle 24) starts from the code Swift can call, the API in the framework's header, follows every call through the IR, and drops what nothing reaches, before LLVM runs. Then the linker's `-dead_strip` trims a little more. So in a release framework, a function of Ktor's that your code never reaches isn't there, and neither is one of yours.

Exports are where this stops. To export a module, you list it in the framework block, and Kotlin's docs add one condition: "You can export only api dependencies of the corresponding source set." Export one that's only an implementation dependency, and the link task stops with an error: "Following dependencies exported in the debugFramework binary are not specified as API-dependencies of a corresponding source set". (That's Gradle's `api` keyword, not the API Swift sees in the header.) `api` is Gradle's word, beside the `implementation` you met in puzzle 19, for a dependency that is part of your module's own public face, so whoever uses your module sees it too:

```kotlin
kotlin {
    sourceSets {
        iosMain.dependencies {
            api(project(":network"))          // api, so it can be exported
            implementation(project(":db"))    // used inside, not exported
        }
    }
    iosArm64 {
        binaries.framework {
            export(project(":network"))
        }
    }
}
```

Exporting puts the whole API of `:network` into the header, so it all becomes a starting point that Swift might call. Dead code elimination can drop none of it, and none of what it calls: the docs say the compiler adds the dependency's code "even if you use a small fraction of it". `:db` isn't exported, so only the parts your code reaches stay. That's the megabytes: each exported module, in the docs' words, "negatively affects compilation time and binary size". Export only the modules Swift really calls, and leave `transitiveExport` off: it exports every dependency of each exported module too.

The second lever is separate, and comes later in the build. The **smallBinary** option asks LLVM to optimize release binaries for size instead of speed (puzzle 23's optimizer, aiming at fewer bytes):

```kotlin
iosArm64 {
    binaries.framework {
        binaryOption("smallBinary", "true")
    }
}
```

It's experimental and can slow the app in some cases, so measure both size and speed.

Two traps when measuring. A debug build keeps unused code, because it never runs dead code elimination, and its symbols are never stripped (puzzle 29): measure size only on release builds. And puzzle 30's release cache trades optimizations for speed; in Kotlin's compiler code, dead code elimination is one of the steps it switches off, since that step runs only when no cached libraries are used.

| Lever | What it removes | When |
|---|---|---|
| Dead code elimination | code nothing reaches from the API | every release build without caches |
| Export only what Swift calls | keeps unneeded API out of the header, so it can be dropped | your build file |
| No `transitiveExport` | keeps exported modules' dependencies trimmable | your build file |
| `smallBinary` | bytes inside the code that remains | release, experimental |

## The analogy

The print shop from puzzle 24 strikes out every recipe nothing refers to, starting from the table of contents. Each section you list in the table of contents (export) must be printed in full, every recipe in it, wanted or not. Then, separately, the typesetter can choose a smaller font for what's left (smallBinary).

## Check yourself

- After you export one more large module to Swift, the release framework grows by megabytes. Which earlier idea explains it?::*Its whole API is in the header, so dead code elimination can drop none of it||Exporting copies the module's klib, with all of its IR, into the app >> No klib reaches the app; the binary holds machine code, and exporting keeps all of the module's code reachable. >> s4||Exporting switches off LLVM's optimizer for the entire framework >> Export turns off dead code elimination for that module only; LLVM still optimizes everything. >> s4::Exported API is a starting point, so it all stays.
- In the framework block, you export the :network module, but iosMain adds :network with `implementation`. What happens?::*Kotlin refuses it: you can export only api dependencies||It works, and Swift sees :network's API as before >> The docs allow exporting only api dependencies of the source set. >> the-building-block||It works, but :network comes in trimmed, like any implementation dependency >> It isn't exported at all: export needs an api dependency. >> the-building-block::Export needs api.
- A colleague measures a debug framework and finds Ktor functions your code never calls. What's the right conclusion?::*Debug builds keep unreached code: measure a release build||Dead code elimination is broken in this project and must be switched on by hand >> It's on by default in release builds; debug builds don't run it. >> s2||Ktor must have been exported to Swift by mistake, so it came in whole >> Unreached code in a debug build is expected; check exports on a release build. >> s2::Measure size on release builds.

## Sources

- [Kotlin Gradle plugin source: KotlinNativeLink.kt](https://github.com/JetBrains/kotlin/blob/9180ce6a7a7d3627f88b424717583f28ddca052d/libraries/tools/kotlin-gradle-plugin/src/common/kotlin/org/jetbrains/kotlin/gradle/targets/native/tasks/KotlinNativeLink.kt#L375) ("Following dependencies exported in the ${binaryName.get()} binary are not specified as API-dependencies of a corresponding source set"; "Please add them in the API-dependencies and rerun the build.")
- [Kotlin docs: Build final native binaries](https://kotlinlang.org/docs/multiplatform/multiplatform-build-native-binaries.html) ("You can export only api dependencies of the corresponding source set."; "When you export a dependency, it includes all of its API to the framework API. The compiler adds the code from this dependency to the framework, even if you use a small fraction of it. This disables dead code elimination for the exported dependency (and for its dependencies, to some extent)."; "It is not recommended to use transitiveExport : it adds all transitive dependencies of the exported dependencies to the framework. This could increase both compilation time and binary size."; the example `api(project(":dependency"))` with `export(project(":dependency"))`)
- [Kotlin docs: Tips for improving compilation time](https://kotlinlang.org/docs/native-improving-compilation-time.html) ("Each exported module negatively affects compilation time and binary size."; "To reduce the size of release binaries and improve build time, try enabling the binary option smallBinary . It effectively sets -Oz as the default optimization argument for the compiler during the LLVM compilation phase. The option is still Experimental and might affect runtime performance in some cases.")
- [Kotlin docs: Kotlin/Native binary options](https://kotlinlang.org/docs/native-binary-options.html) (`binaryOption("smallBinary", "true")`; "smallBinary true false (default) Decreases the binary size for release binaries. Experimental since 2.2.20")
- [Apple: Building your app to include debugging information](https://developer.apple.com/documentation/xcode/building-your-app-to-include-debugging-information) ("Debug builds of an app place the debug symbols inside the compiled binary file by default")
- [Kotlin/Native compiler source, Kotlin 2.4.21: TopLevelPhases.kt](https://github.com/JetBrains/kotlin/blob/9180ce6a7a7d3627f88b424717583f28ddca052d/kotlin-native/backend.native/compiler/ir/backend.native/src/org/jetbrains/kotlin/backend/konan/driver/phases/TopLevelPhases.kt#L514) (`val runGlobalOptimizations = optimize && !context.config.cachedLibraries.hasStaticCaches`, and the `DCEPhase` at line 535 is disabled when `!runGlobalOptimizations`)
- [Kotlin/Native compiler source, Kotlin 2.4.21: Linker.kt](https://github.com/JetBrains/kotlin/blob/9180ce6a7a7d3627f88b424717583f28ddca052d/kotlin-native/backend.native/compiler/ir/backend.native/src/org/jetbrains/kotlin/backend/konan/Linker.kt#L128) (`"-dead_strip"` among the framework's linker arguments)
