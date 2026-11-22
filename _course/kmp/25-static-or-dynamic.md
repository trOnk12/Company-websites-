---
title: Static or dynamic
short: When your framework joins the app
summary: Puzzle 24's linker made one binary for your Kotlin. The iOS app has a binary of its own, built by Xcode from Swift. Here are the two moments the two can be joined, what each costs on an iPhone, and the one line and the one Xcode setting that go with each.
takeaway: A static library is copied into the app's executable by Xcode's linker when the app is built, so the phone starts one file. A dynamic library stays a separate file inside the app, which Xcode must embed, and the dynamic loader loads it and connects the calls every time the app starts. A Kotlin framework is dynamic unless you set isStatic = true; on iOS, every extra framework the loader has to load adds to launch time.
---

## The problem

Puzzle 24's linker joined your code, Ktor and the Kotlin runtime into one binary: your framework. But the iOS app is a program of its own. Xcode builds its Swift code into the app's **executable**, the binary the phone starts when you tap the app's icon. Swift's calls into your Kotlin have to be connected to your framework's addresses, exactly the job puzzle 24 gave the linker. And puzzle 24 left the calls into Apple's own frameworks, such as UIKit, still named. When are those calls connected: once, when Xcode builds the app, or on the phone, every time the app starts?

## See it

```diagram staticdyn
```

## The building block

Both are possible. Which one happens depends on what kind of library your framework holds.

A **static library** is joined at build time. When Xcode links the app, its linker copies the code the app uses from the library into the app's executable. After that, there's no separate Kotlin file on the phone: your Kotlin is part of the app's one executable.

A **dynamic library** is joined at launch. It isn't copied into the executable; it's shipped as its own file inside the app, and the executable only records which libraries it needs. Each time the app starts, the **dynamic loader**, Apple's dyld, does the connecting. Apple's guide to launch time describes it: dyld "loads the app's executable file", then "loads each of the frameworks into memory, and resolves dynamic symbols in the executable": puzzle 24's connecting job, done on the phone.

Apple's own frameworks reach every app this way. UIKit and Foundation are already on every iPhone, so they're never copied into your app: the linker only records which of them the app needs and which symbols it uses, and dyld connects those calls at launch. They cost little, because, in Apple's words, they "use shared memory with other processes that use the same framework".

A Kotlin framework holds a dynamic library unless you say otherwise. One line switches it:

```kotlin
iosArm64 {
    binaries.framework {
        baseName = "shared"
        isStatic = true    // a static library inside the framework
    }
}
```

The kind also decides one setting in Xcode. When you add a framework to the app, its row under "Frameworks, Libraries, and Embedded Content" has an Embed menu: Do Not Embed, Embed & Sign, or Embed Without Signing. A dynamic framework must be embedded, which copies the file into the app: choose Embed & Sign. Apple warns what happens otherwise: "If an app links a framework but doesn't embed it, the app crashes at launch, because the dynamic linker can't locate the missing framework." A static framework has nothing left to ship, since its code is already in the executable: Do Not Embed is enough, and if you embed it anyway, Xcode 15 or later leaves its binary out of the copy.

What changes:

| | Dynamic (the default) | Static (`isStatic = true`) |
|---|---|---|
| Joined to the app | by dyld, on the phone, at every launch | by Xcode's linker, once per app build |
| On the phone | the app's executable, plus your framework as a separate file | one executable that contains your Kotlin |
| Xcode's Embed menu | Embed & Sign, or the app crashes at launch | Do Not Embed is enough |
| Launch time | one more framework for dyld to load: Apple says each one "adds to the launch time" | nothing extra to load |

So for an iPhone app, dynamic doesn't make launch faster: on iOS, Apple's advice runs the other way, to limit the number of third-party frameworks you embed. Apple even added mergeable libraries in Xcode 15 to give "launch times similar to static linking in release builds" while keeping dynamic linking's quicker builds during development. Both kinds work for a framework only your app uses; how the different ways of shipping a framework to the iOS team treat the two is module 7's subject (coming soon).

One thing doesn't change: puzzle 12's rule. Static or dynamic, two Kotlin frameworks in one app still mean two Kotlin runtimes, because each was linked with its own (puzzle 24).

## The analogy

A cookbook can be bound into the restaurant's own menu book at the print shop, so the kitchen opens one book (static). Or it can stay a separate volume on the shelf, and each morning, before service, a helper fetches it and sticks bookmarks from the menu into the right pages (dynamic). The helper also fetches the city's public reference books, but those are shared by every restaurant on the street and sit open already (Apple's frameworks). Forget to put the cookbook on the shelf, and the helper can't open the kitchen.

## Check yourself

- You set your framework's `isStatic` to true and rebuild the iOS app. On the phone, what does dyld load for your Kotlin code at launch?::*Nothing separate: Xcode's linker copied it into the app's executable||The shared framework file, as before, only faster >> A static library isn't a separate file on the phone; it's inside the executable. >> s3||The shared framework once, then it stays in memory even after the app quits >> "Static" means joined at build time, not kept in memory. >> s2::Static: copied in when the app is built.
- Your app embeds four dynamic frameworks from four different teams, two of them Kotlin. Users report a slow start. What does Apple's launch-time guide point at?::*Each extra third-party framework dyld loads adds to launch time||Nothing: dynamic frameworks make the executable smaller, so the app starts faster >> On iOS, Apple's guide says each additional third-party framework adds to the launch time. >> the-building-block||Only Apple's frameworks, such as UIKit, which every app loads at launch >> System frameworks use shared memory, so Apple says their impact on launch is much lower. >> the-building-block::More third-party frameworks to load, slower start.
- Your framework is dynamic, the default, and in Xcode its Embed value is Do Not Embed. The app builds. What happens on the phone?::*It crashes at launch: dyld can't find the framework it must load||It runs: Xcode's linker copied the Kotlin into the executable >> That's the static case; a dynamic library stays a separate file that must be embedded. >> s4||It runs, but every call into Kotlin is slower >> Nothing reaches Kotlin at all: the file isn't in the app, so dyld stops the launch. >> the-building-block::A dynamic framework must be embedded.

## Sources

- [Apple: Reducing your app's launch time](https://developer.apple.com/documentation/xcode/reducing-your-app-s-launch-time) ("The dynamic loader (dyld) loads the app's executable file, and examines the Mach load commands in the executable to find frameworks and dynamic libraries that the app needs. It then loads each of the frameworks into memory, and resolves dynamic symbols in the executable to point to the appropriate addresses in the dynamic libraries."; "Each additional third-party framework that your app loads adds to the launch time."; "You can reduce your app's launch time by limiting the number of 3rd party frameworks you embed."; "Built-in frameworks, like CoreFoundation, have a much lower impact on launch, because they use shared memory with other processes that use the same framework."; "In Xcode 15 or later, you can use mergeable dynamic libraries to get app launch times similar to static linking in release builds, without losing dynamically linked build times in debug builds.")
- [Apple: Overview of Dynamic Libraries](https://developer.apple.com/library/archive/documentation/DeveloperTools/Conceptual/DynamicLibraries/100-Articles/OverviewOfDynamicLibraries.html) ("When an app is linked with a library using a static linker, the code that the app uses is copied to the generated executable file"; "The static linker records the filenames of each of the dependent libraries at the time the app is linked")
- [Apple Xcode Help: Link a target to frameworks and libraries](https://help.apple.com/xcode/mac/current/en.lproj/dev51a648b07.html) ("under Frameworks, Libraries, and Embedded Content, click the Add button (+)"; "choose an option from the pop-up menu in the Embed column. Do Not Embed Embed & Sign Embed Without Signing")
- [Apple: Addressing missing framework crashes](https://developer.apple.com/documentation/xcode/addressing-missing-framework-crashes) ("If an app links a framework but doesn't embed it, the app crashes at launch, because the dynamic linker can't locate the missing framework.")
- [Apple: Creating a static framework](https://developer.apple.com/documentation/xcode/creating-a-static-framework) ("When a client links and embeds the framework, Xcode 15 or later omits the main binary from the embedded framework bundle because it's already statically linked into the client.")
- [Kotlin docs: Multiplatform Gradle DSL reference](https://kotlinlang.org/docs/multiplatform/multiplatform-dsl-reference.html) (binary parameters table, row isStatic: "For Objective-C frameworks. Includes a static library instead of a dynamic one.")
