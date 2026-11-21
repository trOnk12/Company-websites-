# Kotlin Multiplatform learning path

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
