---
title: Why is it zero?
short: Static initialization order and its traps
summary: Puzzle 11 showed that preparation fills static fields with defaults and initialization runs the static code once. Here is what goes wrong when that code reads a field before the line that sets it, or throws.
takeaway: A class's static code runs once, top to bottom, as one method the class file calls <clinit>. Any read of a static field whose line hasn't run yet silently sees the default value (0 or null), and if the static code throws, the class is marked as failed and every later use throws NoClassDefFoundError.
---

## The problem

This Kotlin class compiles without a warning and prints 0, not 20:

```kotlin
class Settings {
    val doubled = limit * 2

    companion object {
        val shared = Settings()
        val limit = 10
    }
}

fun main() {
    println(Settings.shared.doubled)   // prints 0
}
```

limit is clearly 10 in the source. Where does the 0 come from? And why doesn't anything crash?

## See it

```diagram static-order
```

## The building block

All the static code of a class, every static field's value and every static block, is compiled into one method that the class file calls `<clinit>` and javap prints as static {}. It is the class's **static initializer**, and initialization (puzzle 11) means running it, once. For Settings it holds the companion's fields too (Kotlin stores a companion's properties as static fields of the outer class, puzzle 8):

```text
static {};
  Code:
     0: new           #28     // class Settings$Companion
     3: dup
     4: aconst_null
     5: invokespecial #31     // Method Settings$Companion."<init>":(Lkotlin/jvm/internal/DefaultConstructorMarker;)V
     8: putstatic     #35     // Field Companion:LSettings$Companion;
    11: new           #2      // class Settings
    14: dup
    15: invokespecial #36     // Method "<init>":()V
    18: putstatic     #24     // Field shared:LSettings;
    21: bipush        10
    23: putstatic     #12     // Field limit:I
    26: return
```

`putstatic` writes a static field, the opposite of `getstatic`. The lines run in the order they're written in the source. Offset 15 runs Settings' constructor, which computes doubled from limit. limit has existed since preparation, holding the default 0, and the `putstatic` that writes 10 is at offset 23, later. The constructor reads 0, and doubled is 0. Nothing is wrong from the JVM's point of view: the field exists and has a value.

The rule: **inside a static initializer, a static field read before the line that writes it gives its default value**: 0, false or null. It isn't an error, so nothing tells you. The same happens in Java (this class prints 0 10):

```java
public class Config {
    static final Config shared = new Config();
    static int limit = 10;
    final int doubled;
    Config() { doubled = limit * 2; }
}
```

The fixes, both checked by running them: write limit before shared, and doubled is 20; or make it const val limit = 10, which is copied into the constructor's bytecode at compile time (puzzle 6), so there's no field to read too early, and doubled is 20 in any order. In general, keep a static initializer from calling code that reads other statics of the same class.

**When static code throws.** Initialization can fail. Here the static code tries to turn the text "seven" into a number:

```java
static class Prices {
    static int base = Integer.parseInt("seven");
}
```

Reading Prices.base twice, catching what's thrown each time, prints:

```text
1: java.lang.ExceptionInInitializerError / cause: java.lang.NumberFormatException: For input string: "seven"
2: java.lang.NoClassDefFoundError: Could not initialize class Broken$Prices / cause: java.lang.ExceptionInInitializerError: Exception java.lang.NumberFormatException: For input string: "seven" [in thread "main"]
```

The first attempt gets `ExceptionInInitializerError` wrapping the real cause. The JVM then marks Prices as failed for good. It never retries: every later use of the class throws `NoClassDefFoundError` with "Could not initialize class". In a crash report, that second error is the one you usually see, often far from the first. Always scroll back to the first `ExceptionInInitializerError`; its cause is the real bug.

### The edges

- *Two classes that need each other.* If A's static code uses B, and B's static code uses A, the thread initializing A starts B, and B's read of A sees A's defaults: the JVM treats the second request for A as already under way and doesn't wait for itself. The result depends on which class is touched first.
- *Threads wait for each other.* If another thread is initializing the class, the JVM makes the next thread wait until it finishes. That's why a Kotlin object is a safe way to create one shared instance: its static initializer runs once, even with many threads.
- *A Kotlin object is initialized at first access*, a companion object when its outer class is initialized, matching a Java static initializer, as the Kotlin docs put it.

## The analogy

A new office opens and the clerk works through the opening checklist from the top. Line 1: "Print the welcome sign: the opening hours are twice the posted staff count." Line 2: "Post the staff count: 10." When line 1 runs, the board still shows the blank the painters left, 0, so the sign says 0 hours, and nobody reprints it. If a line of the checklist fails, the office is marked "closed, could not open", and every visitor after that is told only that, not why.

## Run it yourself

```sh
kotlinc Settings.kt -d out
java -cp out:$KOTLIN_HOME/lib/kotlin-stdlib.jar SettingsKt
javap -classpath out -c -p Settings
```

Before running, swap the two companion lines and predict the output. Then make limit a const val and predict again.

## Check yourself

- In Settings, you add a third static line after limit: val tripled = limit * 3. What does tripled hold?::*30, because limit was written on the line before||0, because the static code reads defaults >> Only reads before the writing line see defaults; limit is 10 by then. >> s5||It depends on which thread runs first >> One thread runs the static code, top to bottom. >> the-building-block::Order matters line by line.
- Why is reading limit too early not an error?::*Preparation already created the field with 0, so the read is valid||The compiler fixes the order before the program runs >> The program prints 0, so nothing reordered it. >> s4||The constructor reads its own copy of limit >> There is one static field; the constructor read it before 10 was written. >> s3::A prepared static field always has a value.
- A crash log shows NoClassDefFoundError: Could not initialize class Prices. Where is the real cause?::*In an earlier ExceptionInInitializerError||In a Prices class file that went missing >> "Could not initialize" means the class was found but its static code failed before. >> the-building-block||In the line of code that threw this error >> That line only touched a class already marked failed. >> the-building-block::Find the first failure and its cause.

## Sources

- [JVM specification, 2.9.2 Class Initialization Methods](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-2.html#jvms-2.9.2) ("A class or interface has at most one class or interface initialization method and is initialized by the Java Virtual Machine invoking that method (§5.5)."; "It has the special name <clinit>.")
- [Java language specification, 12.4.2 Detailed Initialization Procedure](https://docs.oracle.com/javase/specs/jls/se21/html/jls-12.html#jls-12.4.2) ("Next, execute either the class variable initializers and static initializers of the class, or the field initializers of the interface, in textual order, as though they were a single block.")
- [JVM specification, 5.5 Initialization](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-5.html#jvms-5.5) ("If the Class object for C indicates that initialization is in progress for C by some other thread, then release LC and block the current thread until informed that the in-progress initialization has completed"; "If the Class object for C indicates that initialization is in progress for C by the current thread, then this must be a recursive request for initialization. Release LC and complete normally."; "If the Class object for C is in an erroneous state, then initialization is not possible. Release LC and throw a NoClassDefFoundError.")
- [Java 21 API: ExceptionInInitializerError](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/ExceptionInInitializerError.html) ("Signals that an unexpected exception has occurred in a static initializer.")
- [Kotlin docs: Object declarations and expressions](https://kotlinlang.org/docs/object-declarations.html) ("Object declarations are initialized lazily , when accessed for the first time. A companion object is initialized when the corresponding class is loaded (resolved) that matches the semantics of a Java static initializer.")
- The outputs (0, 0 10, 20 after either fix, and the two errors) were produced in this session with kotlinc 2.2.21 and OpenJDK 21.0.12.
