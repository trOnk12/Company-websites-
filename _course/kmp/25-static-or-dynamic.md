---
title: Static or dynamic
short: When your framework joins the app
summary: Puzzle 24's linker made one binary for your Kotlin. The iOS app has a binary of its own, built by Xcode from Swift. Here are the two moments the two can be joined, what each costs, and the one line that picks between them.
takeaway: A static library is copied into the app's own executable by Xcode's linker when the app is built, so the phone starts one file. A dynamic library stays a separate file inside the app, and the dynamic loader loads it and connects the calls each time the app starts. A Kotlin framework holds a dynamic library unless you set isStatic = true. Apple's trade-off: dynamic keeps the executable smaller and can delay loading; static leaves nothing to load separately.
---

## The problem

Puzzle 24's linker joined your code, Ktor and the Kotlin runtime into one binary: your framework. But the iOS app is a program of its own. Xcode builds its Swift code into the app's **executable**, the binary the phone starts when you tap the app's icon. Swift's calls into your Kotlin have to be connected to your framework's addresses, exactly the job puzzle 24 gave the linker. When does that happen: once, when Xcode builds the app, or on the phone, every time the app starts?

## See it

```diagram staticdyn
```

## The building block

Both are possible. Which one happens depends on what kind of library your framework holds.

A **static library** is joined at build time. When Xcode links the app, its linker copies the code the app uses from the library into the app's executable, as Apple's guide puts it. After that, there's no separate Kotlin file on the phone: your Kotlin is part of the app's one executable.

A **dynamic library** is joined at launch. It isn't copied into the executable; it's shipped as its own file inside the app, and the executable only records which libraries it needs. Each time the app starts, the **dynamic loader**, a program that starts with every app, loads those libraries and connects the calls to them: puzzle 24's connecting job, done on the phone. Apple's own frameworks, like UIKit, reach your app this way. Apple's guide describes this for the Mac; iPhone apps start the same way.

A Kotlin framework holds a dynamic library unless you say otherwise. One line switches it:

```kotlin
iosArm64 {
    binaries.framework {
        baseName = "shared"
        isStatic = true    // a static library inside the framework
    }
}
```

What changes:

| | Dynamic (the default) | Static (`isStatic`) |
|---|---|---|
| Joined to the app | on the phone, every launch | by Xcode, once per build |
| On the phone | the app's executable, plus your framework as a separate file | one executable that contains your Kotlin |
| Apple's trade-off | a smaller executable; loading can be delayed until needed | the whole executable is loaded at once |

For a framework that only your app uses, both work. Kotlin's own example of shipping a framework as a Swift package sets `isStatic` to true; how each way of shipping treats the two kinds is module 7's subject (coming soon).

One thing doesn't change: puzzle 12's rule. Static or dynamic, two Kotlin frameworks in one app still mean two Kotlin runtimes, because each was linked with its own (puzzle 24).

## The analogy

A cookbook can be bound into the restaurant's own menu book at the print shop, so the kitchen opens one book (static). Or it can stay a separate volume on the shelf, and each morning, before service, a helper fetches it and sticks bookmarks from the menu into the right pages (dynamic). Fewer pages to carry in the menu, but the helper works every morning.

## Check yourself

- You set your framework's `isStatic` to true and rebuild the iOS app. On the phone, what does the dynamic loader load for your Kotlin code at launch?::*Nothing separate: Xcode's linker copied it into the app's executable||The shared framework file, as before, only faster >> A static library isn't a separate file on the phone; it's inside the executable. >> s2||The shared framework once, then it stays in memory even after the app quits >> "Static" means joined at build time, not kept in memory. >> s2::Static: copied in when the app is built.
- Apple says using dynamic libraries instead of static ones can help an app launch faster. Why?::*The executable is smaller, and a library can be loaded only when needed||The dynamic loader skips the library's instructions until the user taps something >> It loads libraries the app needs at launch; the gain is a smaller executable and the option to load later. >> the-building-block||Dynamic libraries are compiled again on the phone for that exact processor >> Nothing is compiled on the phone: the library already holds machine code. >> the-building-block::Smaller executable, deferred loading.
- Puzzle 24's linker connected each call to an address. Your framework is dynamic. Who connects Swift's call into your Kotlin function?::*The dynamic loader, when the app starts||Xcode's linker, when it builds the app >> That's the static case; a dynamic library is joined at launch. >> s5||Kotlin's garbage collector, when it first sees the call >> The collector frees memory; connecting calls is the loader's job. >> s5::Dynamic: connected at launch.

## Sources

- [Apple: Overview of Dynamic Libraries](https://developer.apple.com/library/archive/documentation/DeveloperTools/Conceptual/DynamicLibraries/100-Articles/OverviewOfDynamicLibraries.html) ("When an app is linked with a library using a static linker, the code that the app uses is copied to the generated executable file"; "Dynamic libraries are not statically linked into client apps; they don't become part of the executable file. Instead, dynamic libraries can be loaded (and linked) into an app either when the app is launched or as it runs."; "The dynamic loader then loads the app's dependent libraries. These are the dynamic libraries the app was linked with."; "Using dynamic libraries instead of static libraries reduces the executable file size of an app. They also allow apps to delay loading libraries with special functionality only when they're needed instead of at launch time."; static libraries make "one executable file that is loaded into memory in its entirety at runtime")
- [Kotlin docs: Multiplatform Gradle DSL reference](https://kotlinlang.org/docs/multiplatform/multiplatform-dsl-reference.html) ("isStatic: For Objective-C frameworks. Includes a static library instead of a dynamic one.")
- [Kotlin docs: Swift package export setup](https://kotlinlang.org/docs/multiplatform/multiplatform-spm-export.html) (its XCFramework example sets `isStatic = true`)
