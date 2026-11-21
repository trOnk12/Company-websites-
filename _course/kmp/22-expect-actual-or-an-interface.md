---
title: expect/actual or an interface
short: Handing in platform code
summary: Puzzle 3 kept a small promise with expect and actual, and said bigger platform services usually go behind an interface instead. Here's what that means in a real module, how the right implementation is handed in on each platform, and how to choose.
takeaway: expect/actual gives exactly one implementation per target, merged by the compiler: right for small facts and for pointing at an existing platform type. For a service, declare an interface in commonMain, implement it per platform, and hand the implementation in from outside, at the app's start or through a dependency injection framework such as Koin. Then a test can hand in a fake, and expect/actual is needed at most to configure the framework.
---

## The problem

Puzzle 3 kept a promise: common code declared expect fun platformName(), and each platform's source set kept it with an `actual`. It also said that for bigger platform services, an interface handed in from outside does the same job and is easier to test.

Now a real case. Your shared `Bookmarks` class must save a user's bookmarks. On Android, the app keeps small values in SharedPreferences. On iOS, Apple's own key-value store is called NSUserDefaults. Bookmarks lives in commonMain, so by puzzle 18 it can't call either. And your test for `Bookmarks` must run without either store. Do you write `expect`, or an interface? And if an interface, who creates the right implementation, and when?

## See it

```diagram handin
```

## The building block

Start with the interface. commonMain declares what `Bookmarks` needs, and takes it as a constructor parameter instead of creating it:

```kotlin
// commonMain
interface Storage {
    fun save(key: String, value: String)
    fun load(key: String): String?
}

class Bookmarks(private val storage: Storage) {
    fun add(url: String) = storage.save("last", url)
}
```

Each platform's source set implements it with its own APIs, and the shared module's test source set adds one more:

```kotlin
// androidMain
class PrefsStorage(context: Context) : Storage { /* SharedPreferences */ }

// iosMain
class DefaultsStorage : Storage { /* NSUserDefaults */ }

// commonTest
class FakeStorage : Storage {
    val saved = mutableMapOf<String, String>()
    override fun save(key: String, value: String) { saved[key] = value }
    override fun load(key: String) = saved[key]
}
```

`Bookmarks` never creates its storage: it's handed one. That pattern is **dependency injection**: an object receives what it depends on from outside, instead of creating it itself. Here the outside is each app's start, which Kotlin's docs call the entry point. The Android app builds it in its `Application`'s `onCreate()`, the iOS app at its start, in Swift, and a test in commonTest:

```kotlin
Bookmarks(PrefsStorage(this))              // Android: Application.onCreate()
// Bookmarks(storage: DefaultsStorage())   // iOS: the app's start, in Swift
Bookmarks(FakeStorage())                   // a test
```

A **fake** is a small, working implementation of an interface written for tests: it keeps data in memory, so a test can check what `Bookmarks` saved without a phone, a file or a store.

Could an expect class Storage do the same? It can give each target its implementation, but the compiler merges each `expect` with exactly one `actual` per target. A test compiled for iOS gets the iOS actual, so there's no place for a fake, and no way to have two storages on one platform. Kotlin's docs also mark expected classes as Beta: the compiler warns when you use them.

As an app grows, writing every constructor call by hand at the start gets long. A **dependency injection framework** builds the objects and hands each one what it needs, from a list of rules you write. Koin is one that works in common code. Only the rule for the platform part differs per target, so that rule is the one place where expect and actual remain:

```kotlin
// commonMain
expect val platformModule: Module

// iosMain
actual val platformModule = module {
    single<Storage> { DefaultsStorage() }
}
```

How to choose:

| You need | Use |
|---|---|
| A small platform fact, like a name or a new ID | expect fun or expect val |
| An existing platform type under a common name | expect class with actual typealias |
| A service: storage, network, sensors | an interface, handed in |
| Many services, already using a framework | that framework, with expect and actual only for its platform rules |

## The analogy

The shared handbook from puzzle 3 again. "Call the local tax office" is a blank each country fills in once, before printing: fine for one phone number. But for "the courier who delivers our parcels", the handbook says only what a courier must do, and each office hires its own and introduces them on the first day. During training, a stand-in courier carries empty boxes, so nobody has to wait for a real delivery.

## Check yourself

- Your iOS app needs two storages on iOS: NSUserDefaults for settings and an encrypted store for passwords. Storage is an expect class with one `actual` in iosMain. What's the problem?::*The compiler merges one actual per target, so iOS can't have two||There is none, since an actual can be written once in iosMain and once in appleMain >> The compiler accepts exactly one actual per target; a second one for the same target is an error. >> the-building-block||The actual can't use Apple's APIs, so neither store works >> An actual in iosMain can use Apple's APIs; the limit is one actual per target. >> s2::expect/actual: exactly one implementation per target.
- Why does the test for Bookmarks run without SharedPreferences or NSUserDefaults?::*It hands Bookmarks a FakeStorage that keeps values in memory||The test source set runs only on Android, where SharedPreferences is always there >> commonTest is compiled for every target; the test passes a fake instead of a platform store. >> s5||Kotlin skips platform calls when it runs tests >> Nothing is skipped: Bookmarks calls whatever storage it was handed, here the fake. >> s6::A fake is handed in, like any implementation.
- Your project already uses Koin, and you need the platform's name in common code. Kotlin's docs recommend one way. Which?::*Bind it in Koin's platform module, like every other dependency||Add an expect fun next to Koin, because small facts always use expect >> expect suits a small fact in a project without a framework; with one, the docs recommend not mixing two ways. >> the-building-block||Read `Build.VERSION.SDK_INT` directly from commonMain >> commonMain can't call Android's APIs (puzzle 18). >> s1::One way of handing things in, not two.

## Sources

- [Kotlin docs: Use platform-specific APIs](https://kotlinlang.org/docs/multiplatform/multiplatform-connect-to-apis.html) ("you can define an interface in common code that holds abstract platform-independent declarations and then provide implementations of that interface in the platform source sets"; "To inject the appropriate platform implementations when using a common interface, you can choose one of the following options: Use expected and actual functions, Provide implementations through different entry points, Use a dependency injection framework"; "Koin is a dependency injection framework that supports Kotlin Multiplatform"; `single<Platform> { IOSPlatform() }`; "We recommend continuing to use DI if you already have it in your project, rather than using the expected and actual functions manually. This way, you can avoid mixing two different ways of injecting dependencies.")
- [Kotlin docs: Expected and actual declarations](https://kotlinlang.org/docs/multiplatform/multiplatform-expect-actual.html) ("Expected and actual classes are in Beta"; "the Kotlin compiler will warn you about the Beta status of the feature"; "This means that expected and actual declarations are only needed in the configuration of the DI framework"; "With interfaces, you don't limit your design to one implementation per target platform. Also, it's much easier to substitute a fake implementation in tests or provide multiple implementations on a single platform."; `actual typealias MyDate = java.time.LocalDate`)
