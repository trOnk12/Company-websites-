---
title: How Xcode builds your Kotlin
short: A Run Script phase and one Gradle task
summary: Puzzle 26 left your frameworks in Gradle's build folder. But the iOS developer presses Run in Xcode, and Xcode knows nothing about Gradle. Here's the one script that makes every Xcode build start Gradle first, the task it runs, and where the framework goes.
takeaway: Xcode builds an app as an ordered list of build phases. A Run Script phase placed before Compile Sources runs ./gradlew :shared:embedAndSignAppleFrameworkForXcode, which links the one framework for the platform and configuration Xcode is building, then copies it into Xcode's own build output and signs it. So Swift finds the framework without any path set by hand, and a dynamic framework is embedded for you.
---

## The problem

Puzzle 26 left your frameworks under Gradle's build folder: build/bin/iosArm64/debugFramework/shared.framework and the rest. The iOS developer doesn't open a terminal. They press Run in Xcode, for the simulator, after you changed a function in commonMain. Xcode compiles Swift; it has never heard of Gradle. So who runs Gradle, which of the link tasks from puzzle 23 does it run, and how does the new framework end up where Swift's `import shared` finds it, and inside the app, as puzzle 25 said a dynamic framework must be?

## See it

```diagram xcodegradle
```

## The building block

Xcode builds an app target as an ordered list of steps, its **build phases**. You see them in the target's Build Phases tab: Compile Sources compiles the Swift files, Link Binary With Libraries runs the linker, and so on, top to bottom.

One kind of build phase runs whatever you tell it: a **Run Script phase**, a shell script that Xcode runs at its place in the list, every build. That's the bridge to Gradle. Kotlin's docs give the script to paste into a new Run Script phase:

```bash
if [ "YES" = "$OVERRIDE_KOTLIN_BUILD_IDE_SUPPORTED" ]; then
  echo "Skipping Gradle build task invocation due to OVERRIDE_KOTLIN_BUILD_IDE_SUPPORTED environment variable set to \"YES\""
  exit 0
fi
cd "$SRCROOT/.."
./gradlew :shared:embedAndSignAppleFrameworkForXcode
```

`$SRCROOT` is the iOS project's folder, so `cd "$SRCROOT/.."` steps up to the root of your Gradle project, and `:shared` is your shared module's name. The first three lines are a guard: when you start the iOS app from Android Studio instead, the IDE has already built the framework and sets that variable, so the script skips a second build.

The task, `embedAndSignAppleFrameworkForXcode`, comes from the multiplatform plugin, and it exists only if your iOS targets declare `binaries.framework`. It reads what Xcode is building right now (the simulator or a real iPhone, Debug or Release) and then:

1. runs the one link task for that platform and configuration, such as `linkDebugFrameworkIosSimulatorArm64`: not every target, and never the XCFramework;
2. copies the new framework into Xcode's **derived data**: the folder where Xcode keeps its own build output for this project, next to the app it's building;
3. embeds and signs it, puzzle 25's Embed & Sign, done for you.

Because the framework lands in Xcode's own build output, Swift's `import shared` finds it without a search path you'd have to set by hand.

Three settings from Kotlin's docs make this reliable, and each has a reason:

- **Move the Run Script phase above Compile Sources.** Swift is compiled against the framework's header (puzzle 5), so the framework must exist first.
- **Untick "Based on dependency analysis".** Xcode would otherwise skip the script when it thinks nothing changed; it can't see your Kotlin files.
- **Turn off User Script Sandboxing** in Build Settings. With it on, Xcode lets a script touch only the files listed as its inputs, and Gradle reads your whole project.

A custom build configuration, other than Debug or Release, needs one more setting, `KOTLIN_FRAMEWORK_BUILD_TYPE`, set to Debug or Release, so the task knows which kind of framework to link. Other ways of handing a framework to an iOS team that doesn't build Kotlin itself are module 7's (coming soon).

## The analogy

The restaurant from puzzle 25 has a fixed opening routine, a checklist the head chef runs top to bottom. You add one line near the top: "phone the print shop". The print shop prints only today's edition, for today's kind of service, and delivers it to the kitchen's own shelf, already stamped. By the time the cooks start (Compile Sources), the cookbook is where they always look.

## Check yourself

- On a fresh checkout, the Run Script phase sits below Compile Sources. The developer presses Run. What happens?::*Compiling Swift fails: import shared finds no framework, because Gradle hasn't run yet||It works, since Xcode runs every build phase before compiling Swift >> Build phases run in the listed order, top to bottom; the script would come after Compile Sources. >> s1||It works, but Gradle links every target first, so it's slower >> The task links only one framework; the problem is order: Swift compiles before it exists. >> s2::The framework must exist before Swift is compiled.
- Why does pressing Run in Xcode link one Kotlin framework, not the whole XCFramework from puzzle 26?::*The task links only the platform and configuration Xcode is building||Xcode can only read a single framework, never an XCFramework >> Xcode reads XCFrameworks fine (puzzle 26); this task builds only what this build needs. >> s3||Gradle remembers the other targets from the last build >> Nothing is remembered: the task never asks for the other targets. >> s3::One build, one framework.
- Your Kotlin framework is dynamic, the default, and you set it up with this Run Script. What puts it inside the app, so dyld finds it at launch?::*The Gradle task, which embeds and signs it in Xcode's build output||dyld, which fetches it from the Mac's build folder when the app starts >> dyld only loads files that are inside the app on the phone; something must embed the framework first. >> s4||Nothing: with this script, the framework is always static >> The script doesn't change the kind; a Kotlin framework is dynamic unless isStatic is set (puzzle 25). >> s4::The task embeds and signs for you.

## Sources

- [Kotlin docs: Direct integration](https://kotlinlang.org/docs/multiplatform/multiplatform-direct-integration.html) ("The script uses the embedAndSignAppleFrameworkForXcode Gradle task designed specifically for the Xcode environment. During the setup, you add it to the run script phase of the iOS app build. After that, the Kotlin artifact is built and included in the derived data before running the iOS app build."; "Copies the compiled Kotlin framework into the correct directory within the iOS project structure. Handles the code signing process of the embedded framework."; "The embedAndSignAppleFrameworkForXcode task only registers if the binaries.framework configuration option is declared."; the script with `cd "<Path to the root of the multiplatform project>"` and `./gradlew :<Shared module name>:embedAndSignAppleFrameworkForXcode`, "for example, $SRCROOT/.."; "When you start an iOS run configuration, IntelliJ IDEA and Android Studio build the Kotlin framework dependency before starting the Xcode build and set the OVERRIDE_KOTLIN_BUILD_IDE_SUPPORTED environment variable to \"YES\""; "Disable Based on dependency analysis option. This ensures that Xcode runs the script during every build"; "Move the Run Script phase higher, placing it before the Compile Sources phase."; "disable the User Script Sandboxing option"; "add the KOTLIN_FRAMEWORK_BUILD_TYPE setting under User-Defined and set it to Debug or Release")
- [Kotlin docs: Tips for improving compilation time](https://kotlinlang.org/docs/native-improving-compilation-time.html) ("during local development, it's faster to build the .framework file only for the platform you're using. To build a platform-specific framework, use the embedAndSignAppleFrameworkForXcode task.")
- [Kotlin docs: Make your Android application work on iOS, tutorial](https://kotlinlang.org/docs/multiplatform/multiplatform-integrate-in-existing-app.html) (the same script with `cd "$SRCROOT/.."` and `./gradlew :shared:embedAndSignAppleFrameworkForXcode`)
- [Firebase docs: Get readable crash reports in the Crashlytics dashboard](https://firebase.google.com/docs/crashlytics/ios/get-deobfuscated-reports) (on Xcode's script sandbox: "If User Script Sandboxing is enabled, Xcode only allows the run script to access files specified in the Input Files")
