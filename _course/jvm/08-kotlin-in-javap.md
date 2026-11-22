---
title: What did Kotlin write for you?
short: Reading javap on your own Kotlin
summary: You can now read stack instructions, the constant pool and the five calls. Point javap at a small Kotlin class and find the methods and classes you never wrote, and the hidden calls behind a property and a default argument.
takeaway: Kotlin features that the JVM doesn't have become ordinary class-file members. A property is a private field plus a getter (and a setter for var), a companion object is a second class reached through a static field, and a default argument becomes a $default method that receives a mask saying which arguments were left out.
---

## The problem

The JVM knows fields, methods and classes, and the five calls from puzzle 7. It has no idea what a Kotlin property is, or a companion object, or a parameter with a default value. Yet Kotlin runs on it. So what did kotlinc write into the class file, and what does a line like visit(b) really call?

```kotlin
class Bookmark(val url: String, var visits: Int) {
    companion object {
        fun create(url: String) = Bookmark(url, 0)
    }
}

fun visit(b: Bookmark, times: Int = 1) {
    b.visits = b.visits + times
}

fun main() {
    val b = Bookmark.create("pachulski.dev")
    visit(b)
    visit(b, 5)
    println(b.visits)
}
```

## See it

```diagram kotlin-javap
```

## The building block

kotlinc wrote three class files: Bookmark.class, Bookmark$Companion.class and BookmarkKt.class (the top-level functions, as in puzzle 5). javap without -c lists the members, with -p to show the private ones:

```text
public final class Bookmark {
  public static final Bookmark$Companion Companion;
  private final java.lang.String url;
  private int visits;
  public Bookmark(java.lang.String, int);
  public final java.lang.String getUrl();
  public final int getVisits();
  public final void setVisits(int);
  static {};
}
```

*Properties.* Each property became a private field plus a **getter**, a method that returns the field: `getUrl()`, `getVisits()`. The var also got a **setter**, `setVisits(int)`, a method that stores its argument in the field. The methods are final because Kotlin classes and members are final unless marked open. Code outside the class calls these methods; it never reads the field. Here is visit:

```text
public static final void visit(Bookmark, int);
  Code:
     0: aload_0
     1: ldc           #9      // String b
     3: invokestatic  #15     // Method kotlin/jvm/internal/Intrinsics.checkNotNullParameter:(Ljava/lang/Object;Ljava/lang/String;)V
     6: aload_0
     7: aload_0
     8: invokevirtual #21     // Method Bookmark.getVisits:()I
    11: iload_1
    12: iadd
    13: invokevirtual #25     // Method Bookmark.setVisits:(I)V
    16: return
```

Read it with puzzles 5 and 7. The first three instructions are a check Kotlin adds to public functions: `checkNotNullParameter` throws at once if b is null, which only a caller written in Java could do. Then b is pushed twice. The upper copy is the receiver of `getVisits()`, which leaves the current count; `iload_1` pushes times and `iadd` adds. The lower copy of b is still there, so `setVisits` finds its receiver and its argument on top, in that order. So b.visits = b.visits + times is two method calls, not two field accesses.

*The companion object.* It became its own class, Bookmark$Companion, with create as an ordinary method. Bookmark got a static field named Companion holding the companion's one instance. The static {} member is code that runs once, before the class is first used, and creates that instance. So Bookmark.create(...) in Kotlin compiles to:

```text
0: getstatic     #38     // Field Bookmark.Companion:LBookmark$Companion;
3: ldc           #40     // String pachulski.dev
5: invokevirtual #46     // Method Bookmark$Companion.create:(Ljava/lang/String;)LBookmark;
```

Read the static field to get the companion, push the argument, and call create on it with `invokevirtual`. It's not a static method: the companion is an object. If Java code must call Bookmark.create(...) directly as a static method, mark the function `@JvmStatic`; Kotlin then also generates a static method in Bookmark.

*Default arguments.* The JVM has no default values: every call must push every argument. So kotlinc generated a second method, visit$default, and compiled visit(b) as a call to it with two extra values:

```text
 9: aload_0
10: iconst_0
11: iconst_2
12: aconst_null
13: invokestatic  #48     // Method visit$default:(LBookmark;IILjava/lang/Object;)V
```

The call pushes b, then 0 as a placeholder for times, then 2, then null for a fourth parameter that visit$default never reads (no instruction below uses slot 3). The 2 is the **mask**: an int in which bit number n is set when argument n was left out. b is argument 0 and times is argument 1, and bit 1 has the value 2. Inside, visit$default tests that bit and fills in the default:

```text
public static void visit$default(Bookmark, int, int, java.lang.Object);
  Code:
     0: iload_2
     1: iconst_2
     2: iand
     3: ifeq          8
     6: iconst_1
     7: istore_1
     8: aload_0
     9: iload_1
    10: invokestatic  #32     // Method visit:(LBookmark;I)V
    13: return
```

`iand` keeps only the bits set in both values: mask and 2. `ifeq` 8 jumps to offset 8 if the result is zero, which skips the next two instructions. Here it isn't zero, so `iconst_1` and `istore_1` put 1 into times. Then it calls the real visit(b, 1). The call visit(b, 5) has no missing argument, so it compiles straight to `invokestatic` visit, with no mask at all.

### The edges

- *Java callers must pass every argument.* Java has no default arguments, so Java code must pass times. `@JvmOverloads` on the function generates the shorter overloads too.
- *Inside its own class, Kotlin reads the field directly.* Bookmark's own code uses `getfield`, because the field is private to that class; the getter is for everyone else. A const val skips the getter entirely and is copied into the caller (puzzle 6).
- *Names can change.* `@JvmName` renames a generated method, and a property whose name starts with is keeps that name for its getter (isOpen, not getIsOpen). When javap shows a name you don't expect, look for these annotations before assuming a bug.

## The analogy

You ask the front desk for "visit, the usual amount". The office has no form for "the usual". So the desk fills in a standard form with a box ticked: "amount not given". The clerk who receives it sees the tick, writes in the usual amount, and passes the completed form on. The person you asked never saw your shorthand.

## Run it yourself

```sh
kotlinc Bookmark.kt -d out
javap -classpath out -p Bookmark 'Bookmark$Companion'
javap -classpath out -c -p BookmarkKt
```

Before running the last command, predict the mask main passes if visit had a third parameter with a default and you left out only that one.

## Check yourself

- visit gets a third parameter, note: String = "". You call visit(b, 5) and leave note out. Which mask does visit$default receive?::*4, because note is argument 2||2, because one argument was left out >> The mask marks which argument, by position, not how many: bit 2 has the value 4. >> s5||1, because it's the first argument left out >> Bit 0 belongs to argument 0, b, which was given. >> the-building-block::Bit n is set for argument n.
- In Java you write bookmark.visits = 6, with Bookmark compiled from the Kotlin above. What happens?::*It doesn't compile: the field is private, use `setVisits(6)`||It compiles to a `setVisits` call, as in Kotlin >> Only Kotlin translates property syntax into the setter call. >> s2||It writes the field directly >> The field is private to Bookmark; only Bookmark's own code can use it. >> the-building-block::A property is a private field plus methods.
- Why does Bookmark.create(...) compile to `getstatic` followed by `invokevirtual`, not to one `invokestatic`?::*create belongs to the companion object in the static field||A static method can't take a String as its argument >> They can: increment took an int, and any type works. >> the-building-block||Kotlin never generates any static methods at all >> Top-level functions such as visit are static methods. >> the-building-block::The companion is an object; `@JvmStatic` adds a real static method.

## Sources

- [Kotlin docs: Calling Kotlin from Java](https://kotlinlang.org/docs/java-to-kotlin-interop.html) ("A Kotlin property is compiled to the following Java elements: a getter method, with the name calculated by prepending the get prefix. a setter method, with the name calculated by prepending the set prefix (only for var properties). a private field, with the same name as the property name (only for properties with backing fields)."; "Normally, if you write a Kotlin function with default parameter values, it's visible in Java only as a full signature, with all parameters present."; "If you use @JvmStatic on a function in a companion object, the compiler generates both a static method in the enclosing class and an instance method in the companion object"; "That's why Kotlin generates runtime checks for all public functions that expect non-nulls."; "For example, for a property isOpen , the getter is called isOpen()")
- [Kotlin docs: Object declarations and expressions](https://kotlinlang.org/docs/object-declarations.html) ("the name Companion is used"; "on the JVM, you can have members of companion objects generated as real static methods and fields if you use the @JvmStatic annotation")
- [Kotlin docs: Inheritance](https://kotlinlang.org/docs/inheritance.html) ("By default, Kotlin classes and their members are final")
- [JVM specification, 6.5 iand and ifeq](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-6.html#jvms-6.5.if_cond) (iand: "Boolean AND int"; ifeq: "ifeq succeeds if and only if value = 0")
- The class names, members, the $default method and its mask are the real output of kotlinc 2.2.21 and javap from OpenJDK 21.0.12, run in this session. The Kotlin docs don't describe the $default method; it is a compiler detail and can change between versions.
