---
title: How does a call find the override?
short: Virtual dispatch and the method table
summary: Puzzle 7 said invokevirtual picks the method from the receiver's class. See how the JVM you run does that in one lookup, and what marking a method final changes in it.
takeaway: HotSpot gives every class a method table, a copy of its parent's with overridden entries replaced, so invokevirtual finds the right override with one lookup at a fixed position. Marking a method final doesn't change the caller's bytecode; it only spares the table an entry, because a final method can be called directly.
---

## The problem

Puzzle 7 said `invokevirtual` runs the version of a method that belongs to the receiver's class. Here it is in Kotlin, compiled and run:

```kotlin
open class Counter {
    open fun next(v: Int) = v + 1
}

class Loud : Counter() {
    override fun next(v: Int) = v + 10
}

class Plain {
    fun next(v: Int) = v + 1
}

fun use(c: Counter, p: Plain) = c.next(1) + p.next(1)

fun main() {
    println(use(Counter(), Plain()))   // 4
    println(use(Loud(), Plain()))      // 13
}
```

```text
12: aload_0
13: iconst_1
14: invokevirtual #23     // Method Counter.next:(I)I
17: aload_1
18: iconst_1
19: invokevirtual #26     // Method Plain.next:(I)I
22: iadd
23: ireturn
```

The same instruction at offset 14 ran Counter's next the first time and Loud's the second. The JVM specification describes which method must be chosen: look in the receiver's class, then its parent, then that one's parent, until a matching method is found. Doing that search on every call would make deep class hierarchies slow. **HotSpot**, the JVM inside OpenJDK that ran every program in this course, avoids it. And notice offset 19: Plain is a Kotlin class, so it and its next are final, yet the call is still `invokevirtual`. Did final buy nothing?

## See it

```diagram method-table
```

## The building block

HotSpot is what java -version calls the OpenJDK 64-Bit Server virtual machine. The specification says which method must run; HotSpot decides how to find it fast.

When HotSpot sets up a class, before the class's code first runs, it builds a **method table** for it: a list with one entry for each method a subclass could override, each entry pointing to the code to run. A class's table starts as a copy of its parent's table. For each method the class declares, HotSpot checks whether it overrides a parent's method: if it does, it replaces that entry in the copy; if not, it appends a new entry at the end. HotSpot's source says it in two comments: "Copy super class's vtable to the first part (prefix) of this class's vtable", and "if override, replace in copy of super vtable, otherwise append to end" (vtable, virtual table, is HotSpot's name for it).

The consequence is the whole trick: next() sits at the same position in Counter's table and in Loud's. So `invokevirtual` Counter.next can be carried out without any search. Take the receiver, go to its class, read the entry at next's position, run what it points to. That's one lookup whether the hierarchy is two classes deep or ten.

| Receiver | Its class's table, entry for next | Code that runs | Printed by use |
| --- | --- | --- | --- |
| a Counter | Counter's next | v + 1 | 2 + 2 = 4 |
| a Loud | Loud's next (replaced the copy) | v + 10 | 11 + 2 = 13 |

This is a simplified picture: real tables also hold the methods every class inherits from Object (such as toString), and interface calls use a second kind of table. The idea, a fixed position per method, is the same.

Now final. Plain.next can't be overridden, so a call to it can only ever reach one method. HotSpot's source comments: "a final method never needs a new entry; final methods can be statically resolved". The table gets no entry, and HotSpot calls the method directly. But the bytecode is the same `invokevirtual` either way: final is a fact about the class, not about the call site, so you can't see it in the caller's bytecode.

So does Kotlin's final-by-default make your code faster? Less than you'd think: HotSpot's optimizing compilers, which translate frequently called methods into machine instructions (the processor's own instructions) while the program runs, can call an open method directly too when no loaded class overrides it (coming in a later module).

### The edges

- *Choose final or open for design, not for speed.* Kotlin makes classes final so you decide what may be overridden. Making a hot class open costs almost nothing while it has no subclass.
- *Private and static methods have no entries either.* They can't be overridden, so like constructors (`<init>`) they are always called directly.
- *Interface methods* are found through a second kind of table (HotSpot calls it the itable): a class can implement many interfaces, so an interface method has no single position shared by every class that implements it.

## The analogy

Every department keeps a phone list in a fixed order: line 1 for complaints, line 2 for refunds. A new branch photocopies its parent office's list and crosses out the lines it handles differently, writing its own number in. A caller who wants "refunds at whatever branch this customer belongs to" never searches: they open that branch's list at line 2. A service only one desk can ever provide isn't on the list at all; you just walk over to that desk.

## Run it yourself

Save the Kotlin program at the top of this page as Dispatch.kt, then:

```sh
kotlinc Dispatch.kt -d out
javap -classpath out -c -p DispatchKt
javap -classpath out -c -p Plain Counter
```

In the second listing find both `invokevirtual` instructions. In the third, compare the flags javap prints for the two next methods (public final vs public).

## Check yourself

- A class Shout extends Loud and overrides next again with v + 100. A Shout reaches use(c). Which entry does `invokevirtual` read, and what does use return?::*The entry for next in Shout's table, so 101 + 2 = 103||Loud's entry, because Shout's table is a copy of Loud's >> The copy is made first, then Shout's override replaces that entry. >> s3||Counter's entry, because the instruction names Counter.next >> The instruction names the method; the receiver's table decides the code. >> s5::Each class's table has its own overrides at the same position.
- You mark Counter.next final (and delete Loud). What changes in use's bytecode?::*Nothing: still `invokevirtual`||It becomes `invokestatic`, since one method is possible >> A final method still needs a receiver; only static methods use `invokestatic`. >> s6||It becomes `invokespecial`, like a constructor >> The compiler emits `invokevirtual` for a call through a class type, final or not. >> s6::final changes the class and its table, not the call site.
- Counter gets a second open method, reset(), declared after next(). Loud overrides only next(). Where is reset in Loud's table, and what does its entry point to?::*At the same position as in Counter's table, pointing to Counter's reset||Appended at the end of Loud's table, after Loud's own methods >> Loud's table starts as a copy of Counter's, so inherited entries keep their positions. >> s3||Nowhere: Loud's table only lists the methods Loud declares >> The copy holds every entry of the parent; only overridden ones are replaced. >> s3::A copied entry that isn't overridden still points to the parent's code.

## Sources

- [JVM specification, 5.4.6 Method Selection](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-5.html#jvms-5.4.6) ("During execution of an invokeinterface or invokevirtual instruction, a method is selected with respect to (i) the run-time type of the object on the stack, and (ii) a method that was previously resolved by the instruction."; "a search for a declaration of an instance method that can override mR is performed, starting with the direct superclass of C and continuing with the direct superclass of that class, and so forth")
- [OpenJDK source, klassVtable.cpp, jdk-21+35](https://github.com/openjdk/jdk/blob/jdk-21%2B35/src/hotspot/share/oops/klassVtable.cpp#L130) (line 130: "Copy super class's vtable to the first part (prefix) of this class's vtable"; line 199: "if override, replace in copy of super vtable, otherwise append to end"; lines 419–421: "a final method never needs a new entry; final methods can be statically resolved and they have to be present in the vtable only if they override a super's method, in which case they re-use its entry"; lines 653–657: "private methods don't need to be in vtable", "static methods don't need to be in vtable", "<init> is never called dynamically-bound")
- [OpenJDK wiki: HotSpot performance techniques](https://wiki.openjdk.org/display/HotSpot/PerformanceTechniques) ("Static, private, final, and/or "special" invocations are easy to inline. Virtual (and interface) invocations are often demoted to "special" invocations, if the class hierarchy permits it. A dependency is registered in case further class loading spoils things.")
- [OpenJDK: the HotSpot group](https://openjdk.org/groups/hotspot/) ("the HotSpot virtual machine"; "you get two or three JIT compilers from bytecode to native instructions")
- [Kotlin docs: Inheritance](https://kotlinlang.org/docs/inheritance.html) ("By default, Kotlin classes are final – they can't be inherited.")
- The program output (4 and 13) and the listings were produced in this session with kotlinc 2.2.21 and OpenJDK 21.0.12.
