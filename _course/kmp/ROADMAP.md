# Roadmap: Kotlin Multiplatform, from the compiler up to shipping it

The owner's goal for this course: "mega complete, leading to expert". Expert here means **shipping and maintaining
KMP in production**: you can read what the toolchain produces, predict what Swift will see, ship the framework to an
iOS team, debug a crash from the field, keep builds fast and binaries small, choose the common stack, test it on both
platforms, and migrate an existing app without stopping it.

Rules every module follows (AGREEMENTS.md, course-author skill):

- **Foundation first.** A puzzle may use only what earlier puzzles taught. Each module lists what it builds on.
- **One core idea per puzzle**, 3–4 new concepts (never more than 6), a step-through diagram, an analogy from the
  course world, three checks, and sources with exact quotes fetched in the session that writes the puzzle.
- **Modules of 5–7 puzzles.** New modules are appended; existing puzzles are never renumbered.
- **"Go deeper" floors** are optional and never gate. They point down into foundation courses (see the end of this
  file). The main path must stand without them.

## Where the course stands (2026-11-21)

| Module | Puzzles | Core ideas |
|---|---|---|
| 1. One codebase, two worlds | 00–06 | compiler and targets; source sets; platform libraries; expect/actual; an iOS app; the framework and its Objective-C header; what the header loses |
| 2. Living on iOS | 07–12 | tracing vs counting; weak references and closures; GC meets ARC; the main thread on iOS; coroutines on iOS; one umbrella framework |
| 3. Sharing the UI | 13–15 | Compose's core idea; what Compose Multiplatform shares; one canvas on iOS |
| 4. The build | 16–22 | the `kotlin { }` block; the default hierarchy; who sees what; dependencies per source set; klibs; one line resolves per target; expect/actual or an interface with DI |
| 5. Kotlin/Native under the hood | 23–28 | the two stages and LLVM; the linker; static vs dynamic; frameworks vs XCFrameworks; debug symbols and symbolication; build time and binary size |

Modules 6–11 below are the remaining path. They are listed in `course.json` → `upcoming` until written.

## Module 6: Across the boundary (29–35)

Builds on: 5–6 (header, what it loses), 11 (coroutines on iOS, cancellation), 20 (klib), 23–24 (two stages, linker).
Why now: module 5 explained what the framework is; this module explains exactly what Swift gets from it.

| # | Puzzle | Core idea |
|---|---|---|
| 29 | Reading the generated header | Open `shared.h`: class prefixes, `KotlinInt`-style boxed numbers, nullability, how a top-level function becomes a class method. Learn to predict a declaration's Swift shape before building. |
| 30 | Generics, sealed classes and enums | Which generics survive (classes only, puzzle 6), why a sealed class becomes an open class hierarchy Swift can't switch over exhaustively, how enums arrive. |
| 31 | Defaults, overloads and names | No default arguments in Objective-C; overload clashes; `@ObjCName`, `@HiddenFromObjC`, `@ShouldRefineInSwift` to shape the API on purpose. |
| 32 | Exceptions as an error contract | `@Throws` produces `NSError**`/Swift `throws`; what an unlisted exception does; the unhandled-exception hook and what a Kotlin crash looks like in a crash report (needs puzzle 27). |
| 33 | suspend from Swift, precisely | The completion handler, Swift's async form, which thread the result arrives on, why calling from a non-main thread was once restricted and what changed. |
| 34 | Flow from Swift | A Flow has no Swift equivalent: collecting it with a callback wrapper, as an `AsyncSequence` through a library, and who cancels the collection when the screen goes away. |
| 35 | SKIE and Swift export | Two ways to give Swift a better API: SKIE post-processes the Objective-C path (sealed, enums, Flow, suspend with cancellation); Swift export skips Objective-C. What each supports today, and how to decide. |

Go deeper: "How code becomes a program" → calling conventions (why a boundary needs a shared description).

## Module 7: Shipping it to iOS (36–41)

Builds on: 12 (umbrella, export), 25 (static vs dynamic), 26 (XCFramework), 27 (dSYM).
Why now: the iOS team needs a repeatable way to receive the framework, locally and in releases.

| # | Puzzle | Core idea |
|---|---|---|
| 36 | How Xcode gets your framework | Direct integration: a run-script phase calls `embedAndSignAppleFrameworkForXcode`, which builds only the platform Xcode is building for, copies it into the app and signs it. Code signing in one paragraph. |
| 37 | Swift Package Manager | Shipping the XCFramework as a binary target: a `Package.swift`, a zip and its checksum, where it's hosted. Local development vs released versions. |
| 38 | CocoaPods | The `kotlin("native.cocoapods")` plugin, the generated podspec, pod dependencies from Kotlin; its current status, and when a team still needs it. |
| 39 | Two loops: local and released | Developers who edit Kotlin build from source; the iOS team consumes released binaries. Switching between the two without breaking Xcode. |
| 40 | Versioning a shared module | Semantic versions for the framework; what counts as a breaking change on the Swift side (renames, new parameters, moved classes); keeping dSYMs per version; one Kotlin version per app. |
| 41 | CI for Apple targets | Which tasks run where (Linux can build klibs; final Apple binaries need a Mac), caching `~/.konan`, building only the slices a job needs. |

Go deeper: "Computers from the ground up" → what code signing proves (hashes and signatures; the encryption course covers both).

## Module 8: The common stack (42–48)

Builds on: 19–22 (dependencies, variants, interfaces and DI), 11 (dispatchers), 13–14 (state, Compose).
Why now: with the build and shipping understood, the learner chooses libraries knowing what each costs on iOS.

| # | Puzzle | Core idea |
|---|---|---|
| 42 | One HTTP client, two engines | Ktor's `HttpClient` in commonMain, OkHttp and Darwin engines per platform (puzzle 19), plugins such as content negotiation and timeouts. |
| 43 | Serialization without reflection | kotlinx.serialization is a compiler plugin: `@Serializable` generates serializers at build time, which is why it works on Kotlin/Native where reflection is limited. |
| 44 | SQL first: SQLDelight | Write SQL, get typed Kotlin; one driver per platform; migrations; reading the database from both apps. (Room's KMP support as the alternative.) |
| 45 | Small values: settings | Key-value storage per platform (SharedPreferences/DataStore, `NSUserDefaults`) behind one API; what not to keep there (secrets go to Keychain/Keystore). |
| 46 | Dependency injection across platforms | Koin modules in common code, the platform module from puzzle 22, starting it from Android's `Application` and from Swift; scopes and lifetimes. |
| 47 | A ViewModel in commonMain | AndroidX `lifecycle-viewmodel` for KMP, `viewModelScope`, who owns and clears it on iOS (SwiftUI, UIKit), and exposing its state to Swift (module 6). |
| 48 | Time, files and bytes | kotlinx-datetime, kotlinx-io and Okio: replacing `java.time` and `java.io.File` (puzzle 1's first error) in common code. |

Go deeper: "How code becomes a program" → what a compiler plugin can change (Compose and serialization both use one).

## Module 9: Testing shared code (49–53)

Builds on: 16 (test compilations), 22 (interfaces and fakes), 11 (dispatchers), 41 (CI).

| # | Puzzle | Core idea |
|---|---|---|
| 49 | One test, every target | `commonTest` with `kotlin.test`: written once, compiled and run per target; reading which target actually ran. |
| 50 | Running tests on iOS | `iosSimulatorArm64Test` runs on the simulator and needs a Mac; what a skipped target means in a CI report. |
| 51 | Fakes, not mocks | Reflection-based mocking doesn't run on Kotlin/Native; hand-written fakes behind the interfaces of puzzle 22; what a fake can and can't prove. |
| 52 | Testing coroutines | `runTest` and virtual time; replacing `Dispatchers.Main` in tests; testing a Flow. |
| 53 | Testing from the Swift side | An XCTest target that imports the framework: checking the API Swift really sees (module 6), not only the Kotlin behaviour. |

## Module 10: Architecture and migrating an existing app (54–59)

Builds on: everything above.

| # | Puzzle | Core idea |
|---|---|---|
| 54 | Where to draw the shared line | Share data and domain first; UI native or Compose Multiplatform; what the decision costs each team. |
| 55 | Modules in a real app | Feature modules, a core module, and one iOS export module that is the umbrella (puzzle 12): build graph, visibility and export. |
| 56 | Migrating an Android app | Move pure Kotlin first; find JVM-only dependencies (Retrofit, Gson, `java.*`) and their multiplatform replacements; keep the app shipping during the move. |
| 57 | Designing for the Swift team | API review with iOS developers: Swift-friendly shapes, ownership of the shared module, how changes are announced (module 7's versioning). |
| 58 | Memory and performance in production | GC behaviour in a long-running iOS app, finding leaks across the boundary (puzzle 9) with Xcode's tools, signposts for GC pauses. |
| 59 | Crashes and logs from the field | Crash reporting with Kotlin stack traces: dSYM upload (puzzle 27), the unhandled-exception hook (puzzle 32), and logging from common code. |

## Module 11: The expert's toolbox (60–64)

| # | Puzzle | Core idea |
|---|---|---|
| 60 | cinterop | Calling a C or Objective-C library that isn't in the platform libraries: a `.def` file, generated bindings, a klib of its own (puzzle 20). |
| 61 | Compiler plugins and KSP in KMP | What runs per source set, why generated code must exist for every target, where KSP output goes. |
| 62 | Upgrading Kotlin safely | Kotlin version, klib ABI compatibility, the compatibility guide; why every Kotlin framework in an app should be built with one compiler version. |
| 63 | Publishing a library | Maven Central, the root and per-target publications (puzzle 21), host requirements, checking the klib ABI before each release. |
| 64 | Capstone: ship a feature end to end | One feature from commonMain to a released framework: tests on both platforms, the Swift API reviewed, a crash symbolicated. Practicum, not a new idea. |

## Go deeper floors (foundation courses, planned)

These are linked from puzzles with an optional `## Go deeper: <question>` section. They don't exist as courses yet;
until they do, the floor is written inside the puzzle as a closed depth section.

| Floor | Course | Linked from |
|---|---|---|
| What a compiler does: tokens, tree, IR | How code becomes a program | 0, 20, 23 |
| What LLVM is, and what an optimisation pass does | How code becomes a program | 23, 28 |
| Linking: symbols, relocations, dead code | How code becomes a program | 24, 25 |
| How a program is loaded and started | How code becomes a program; Android course module 1 (processes) | 25 |
| Processor families and instruction sets | Computers from the ground up | 0, 26 |
| Memory and addresses | Computers from the ground up | 27 |
| The stack and the heap | Computers from the ground up | 7, 27 |
| How Gradle resolves a dependency | (none yet: a candidate floor for a build-tools course) | 21 |
| Hashes and signatures | Encryption course | 36, 40 |

## Open questions for the owner

- Swift export is still changing quickly; module 6's last puzzle should be re-verified against the docs when written.
- CocoaPods: confirm whether the course should teach it as a first-class path or only as legacy (puzzle 38).
- Module 10 would gain from a real migration case study from the notes vault, if one exists.

## Evidence a learner should be able to demonstrate

From the practice track (written alongside this roadmap): what each stage should let a learner prove on a clean
Android and Swift consumer.

Use the module lists in [course.json](course.json) for the published order. The evidence below defines what a learner should be able to demonstrate with a clean Android and Swift consumer. A published explanation and a verified exercise are tracked separately.

| Stage | Current material | Evidence to collect |
| --- | --- | --- |
| Compile one shared function | Published puzzles 00–03 cover targets, Apple interop and platform implementations. | Build one common function for Android and iOS. Introduce a platform-only dependency in common code, predict the failing compile task and move the dependency to the right source set. |
| Design a Swift-facing API | Published puzzles 04–06 and the [boundary practice chapter](topics.json). | Compare the Swift declaration with the Kotlin source. Call a successful and a failing operation from Swift. Record what the caller receives in each case. |
| Own resources across runtimes | Published puzzles 07–12 cover ownership, lifetime, threading and framework boundaries. | Retain and then release a callback from Swift. Compare object lifetimes before and after cancellation and show which thread updates the screen. |
| Separate shared UI and native hosting | Published puzzles 13–15 introduce the rendering boundary. The [Compose course](../compose/course.json) continues it. | Trace one state change to its rendered result on both platforms and identify where the host supplies the native surface. |
| Resolve dependencies for each target | Published puzzles 16–19 introduce the build and source-set graph. Target-specific library selection is next. | Give Android and iOS the same dependency declaration. Inspect which variant each resolves. Remove the required iOS variant in a disposable fixture and explain the resolution failure. |
| Deliver a library to another team | The [project](practicum.json) covers boundary design. A clean-consumer release fixture is still needed. | Package a versioned framework, import it in a fresh Swift app, and build without the producer checkout. Retain the artifact version, generated API and consumer build output. |
| Maintain a shipped release | Planned after the clean-consumer fixture. | Upgrade the library beneath existing Android and Swift consumers. Detect an incompatible API change in CI, reproduce the failure from the release artifact and demonstrate recovery using the previous version. |

Next authoring task: teach how a dependency selects a target variant, using the same library coordinates in two compilations. Define the artifact and its metadata before asking the learner to interpret a resolution failure. Fresh-learner review and a run on an Apple build host remain open.
