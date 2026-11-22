---
title: One line, every target
short: Publications and variants
summary: Puzzle 20 showed that a klib is built for one target, yet in puzzle 19 you wrote one line for Ktor's core and every target's build got its own file. Here's the published file that makes that work, and how each compilation finds its part.
takeaway: A multiplatform library is published as one publication per target, plus a root publication. The root's Gradle module metadata file lists every variant of the library, each tagged with attributes such as the platform and the native target, and points at where that variant's files are. Each compilation asks for the variant whose attributes match its own target, so one dependency line resolves to the right klib or jar for every target.
---

## The problem

Puzzle 20 opened Ktor's klib for iosArm64: its manifest names exactly one target. So Ktor must also publish a klib for iosSimulatorArm64, and something for Android. But in puzzle 19 you wrote one line:

```kotlin
commonMain.dependencies {
    implementation("io.ktor:ktor-client-core:3.6.1")
}
```

That name has no target in it. How does the iosArm64 compilation end up with the iosArm64 klib, the simulator compilation with the simulator one, and the Android build with something it can use? And why did the OkHttp part from puzzle 19 fail on iOS instead of quietly giving iOS nothing?

## See it

```diagram variants
```

## The building block

When a multiplatform library is published, the multiplatform plugin creates one **publication** per target: a separately named package of files on the library server, such as Maven Central. Ktor's core has, among others:

| Publication | What it holds |
|---|---|
| ktor-client-core-iosarm64 | the iosArm64 klib from puzzle 20 |
| ktor-client-core-iossimulatorarm64 | the iosSimulatorArm64 klib |
| ktor-client-core-jvm | class files in a jar, the JVM output from puzzle 0 |
| ktor-client-core | the root publication: no target of its own |

Your line names the root, the one without a target. The root publication holds a small file, ktor-client-core-3.6.1.module, written in **Gradle module metadata**: a format, published next to a library, that tells Gradle what the library offers. Its main part is a list of **variants**. A variant is one version of the library, built for one kind of consumer and tagged with attributes: labels such as which platform and which native target it's for. Here is one entry from the real file, shortened:

```json
{
  "name": "iosArm64ApiElements-published",
  "attributes": {
    "org.jetbrains.kotlin.platform.type": "native",
    "org.jetbrains.kotlin.native.target": "ios_arm64"
  },
  "available-at": {
    "module": "ktor-client-core-iosarm64"
  }
}
```

So the root doesn't contain the klibs. It points at them: "the variant for ios_arm64 is available at that publication".

Two words here have other meanings you already know, so keep them apart. A variant in this file is not an Android build variant (debug or release, or a product flavor, chosen inside your own app's build): it's one of the library's published builds, chosen by target. And "module" now has three meanings: a Gradle module of your project, such as `:shared`, written with a colon in a build file; Ktor's published library, which Gradle also calls a module; and the .module file, the metadata that describes it.

Now follow your one line through puzzle 16's compilations. Each compilation asks Gradle for the library, and says what it is: "I'm native, ios_arm64". Gradle reads the .module file and picks the variant whose attributes match:

- iosArm64's compilation gets the ios_arm64 variant: Ktor's iosArm64 klib.
- iosSimulatorArm64's compilation gets the ios_simulator_arm64 variant: the other klib.
- The Android build asks for platform type androidJvm. Ktor's core publishes no androidJvm variant, only a jvm one, and Kotlin's plugin accepts a jvm variant for an androidJvm request: an Android build starts from JVM class files anyway, converting them to DEX, as puzzle 0 showed.
- While Kotlin checks commonMain's own code, it gets a variant marked common: the declarations every target shares, so common code can only call what every target has.

Now the OkHttp failure from puzzle 19 is exact. The OkHttp part's .module file lists only a common and a jvm variant. When the iosArm64 compilation asks for a variant matching ios_arm64, there's none, so Gradle stops the build with an error that no variant matches. It never silently gives iOS nothing.

One more consequence. If a library forgets to publish one target, only the compilation for that target fails: the list in its .module file is the library's real promise, not its name.

## The analogy

A wholesaler's catalogue. You order "Ktor core" by its catalogue name. The catalogue page lists one edition per country, each labelled with the country and the plug type, and says which warehouse shelf it's on. Each office's order is filled with the edition whose labels match it. If no edition matches an office's labels, that office's order is refused, not filled with nothing.

## Check yourself

- A library's .module file lists variants for jvm, ios_arm64 and common, but not ios_simulator_arm64. You add it to commonMain in a project with android, iosArm64 and iosSimulatorArm64 targets. What happens?::*The simulator compilation fails: no variant matches its target||Every build works, and the simulator reuses the ios_arm64 klib >> A klib is built for one target; the simulator's compilation needs a variant tagged with its own target. >> s4||Only the Android build works, because only jvm is a full variant >> The iosArm64 compilation finds its matching variant too; only the simulator has none. >> s4::Each compilation needs its own matching variant.
- Why can one dependency line in commonMain serve all three targets?::*It names the root, whose metadata points each target at its own variant||It downloads one klib that every target's compilation can read >> Each target has its own klib or jar; the root only lists them and says where they are. >> s3||Gradle builds the library from its source code once for every target >> Nothing is rebuilt: each target's files were already published, and Gradle picks among them. >> s4::The root publication is a list of variants.
- Puzzle 20's klib manifest named ios_arm64. Where else is that same target written, so that Gradle can pick the klib before opening it?::*In an attribute on its variant in the root's .module file||In the dependency line you wrote in commonMain >> Your line names only the root; the target is written in the published metadata. >> the-building-block||Nowhere: Gradle downloads every klib and opens each one's manifest >> The variant's attributes let Gradle choose without opening any klib. >> s3::Variants carry their target as attributes.

## Sources

- [Kotlin docs: Setting up multiplatform library publication](https://kotlinlang.org/docs/multiplatform/multiplatform-publish-lib-setup.html) ("Publications of a Kotlin Multiplatform library include multiple Maven publications, each corresponding to a specific target. Additionally, an umbrella root publication, kotlinMultiplatform, that represents the entire library is published. When added as a dependency to the common source set, the root publication automatically resolves to the appropriate platform-specific artifacts."; "The root publication serves as an entry point that references all target-specific publications"; "This task publishes a *.module file with information about the target-specific publications")
- [Gradle docs: Gradle Module Metadata](https://docs.gradle.org/current/userguide/publishing_gradle_module_metadata.html) ("Gradle Module Metadata is a unique format aimed at improving dependency resolution by making it multi-platform and variant-aware"; "consistent selection of platform-specific dependencies"; "Each variant must have at least one attribute")
- [Maven Central: ktor-client-core 3.6.1 .module file](https://repo1.maven.org/maven2/io/ktor/ktor-client-core/3.6.1/ktor-client-core-3.6.1.module), read for this puzzle: variant `iosArm64ApiElements-published` with attributes `"org.jetbrains.kotlin.platform.type": "native"` and `"org.jetbrains.kotlin.native.target": "ios_arm64"`, `available-at` module `ktor-client-core-iosarm64`; a `metadataApiElements` variant with `"org.jetbrains.kotlin.platform.type": "common"`; `jvmApiElements-published` with platform type `jvm`; no variant with platform type `androidJvm`
- [Maven Central: ktor-client-okhttp 3.6.1 .module file](https://repo1.maven.org/maven2/io/ktor/ktor-client-okhttp/3.6.1/ktor-client-okhttp-3.6.1.module): variants only for `common` and `jvm`
- [Ktor docs: Client engines](https://ktor.io/docs/client-engines.html) (its table of supported platforms has the row Engine "OkHttp", Platforms "JVM, Android")
- [Kotlin Gradle plugin: KotlinPlatformType.kt, Kotlin 2.4.21](https://github.com/JetBrains/kotlin/blob/9180ce6a7a7d3627f88b424717583f28ddca052d/libraries/tools/kotlin-gradle-plugin-api/src/common/kotlin/org/jetbrains/kotlin/gradle/plugin/KotlinPlatformType.kt#L80) (the compatibility rule for the platform-type attribute: `if (producerValue == jvm && consumerValue == androidJvm)` then `compatible()`)
