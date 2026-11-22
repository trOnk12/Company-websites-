---
title: When does a class arrive?
short: Loading, linking, initialization
summary: Module 2 read the bytecode inside a class file. Now watch when the JVM actually reads that file, checks it, and runs its static code, using a log of one tiny program.
takeaway: The JVM brings a class in only when the running code first needs it, in phases. Loading creates the class from its file; linking verifies it, prepares its static fields with default values and resolves its symbolic references; initialization runs its static code, once, at the first real use.
---

## The problem

Puzzle 6 said an instruction names a field or method by text, and that the JVM looks it up while the program runs. Puzzle 8 showed a class with static code that "runs once, before the class is first used". Before when, exactly? A large app has thousands of classes. If the JVM read and set up all of them at startup, starting would be slow, and a class that's never used would still cost time and memory.

```java
public class Lazy {
    static class Rare {
        static int value = 7;
        static { System.out.println("Rare initialized"); }
    }

    public static void main(String[] args) {
        System.out.println("main starts");
        Rare[] slots = new Rare[2];
        System.out.println("array made");
        System.out.println(Rare.value);
        System.out.println(Rare.value);
    }
}
```

## See it

```diagram class-lifecycle
```

## The building block

HotSpot can log what it does to each class. This is the real output of running Lazy with two log options, keeping only the lines about Lazy's classes:

```text
$ java -Xlog:class+load -Xlog:class+init=info -cp out Lazy
[0.049s][info][class,init] 323 Initializing 'Lazy'(no method) (0x00007fdef8000800) by thread "main"
main starts
[0.050s][info][class,load] Lazy$Rare source: file:/.../out/
array made
[0.050s][info][class,init] Start class verification for: Lazy$Rare
[0.050s][info][class,init] End class verification for: Lazy$Rare
[0.050s][info][class,init] 326 Initializing 'Lazy$Rare' (0x00007fdef8000a08) by thread "main"
Rare initialized
7
7
```

(Lazy$Rare is how the class file names the nested class Rare.) Read it as a timeline. Nothing happens to Rare until main is running. Then the phases come at different moments, each triggered by something the code does.

**Class loading** happens at new Rare[2]. An array of Rares needs to know the class Rare, so the JVM finds its bytes (here, the file Lazy$Rare.class in the out directory, the "source" in the log) and creates the class in memory. No code of Rare runs: the line "array made" prints before anything else happens to Rare.

The first Rare.value is the first real use: a `getstatic` on one of Rare's fields. Before Rare's code may run, the class must be linked, in three parts:

- **Verification** checks the bytecode is safe to run: every instruction gets inputs of the right type, the stack never underflows, jumps land on real instructions. This is why the class file records the stack depth from puzzle 5, and why a hand-edited class file is rejected rather than crashing the JVM. The log shows HotSpot doing it here, just before initialization.
- **Preparation** creates Rare's static fields and fills them with default values: 0 for numbers, null for references. At this moment value exists and holds 0, not 7. The 7 is written by code, and that code hasn't run yet.
- **Resolution** turns a symbolic reference (puzzle 6) into a real one: the `getstatic` names "field value of type I in class Rare", and resolution finds that field in memory. HotSpot resolves each reference the first time an instruction needs it; the specification also allows a JVM to do it earlier.

Verification, preparation and resolution together are **linking**. Then comes **initialization**: the JVM runs the class's static code, here value = 7 and the println, in the order they're written in the source. It happens exactly once. The second Rare.value finds Rare initialized and its reference resolved, and only reads the field.

| Event in main | What happens to Rare | value |
| --- | --- | --- |
| main starts | nothing: not in memory | no field yet |
| new Rare[2] | loaded | no field yet |
| first Rare.value | verified, prepared, resolved, initialized | 0, then 7 |
| second Rare.value | nothing: already done | 7 |

What triggers initialization? The JVM specification names four instructions: new (creating an object of the class), `getstatic`, its opposite that writes a static field, and `invokestatic`, on the class that declares the field or method. Some reflective calls, initializing a subclass, and starting a program's main class do it too (the log's first line: Lazy was initialized, with "no method" because it has no static code, before main ran).

### The edges

- *Loading without initializing.* new Rare[2] loaded Rare but ran none of its code. So does reading Rare.class, the object Java uses to describe the class: in a second run, a line printing Rare.class printed before Rare was initialized.
- *A constant isn't a use.* Reading a static final constant, such as const val in Kotlin, doesn't even load the class: puzzle 6 showed its value is copied into the caller.
- *Errors wait for first use.* If something about Rare is wrong (its class file is missing, or verification fails), the error is thrown when the code first needs Rare, not at startup. A program can run for an hour before reaching that line. Puzzle 14 reads those errors.
- *Order of classes.* Before a class is linked, its parent class is loaded and linked; before it's initialized, its parent is initialized.
- *Where JDK classes come from.* In the unfiltered log most JDK classes say "source: shared objects file": they come from an archive HotSpot prepared earlier to start faster. Module 4 opens it.

## The analogy

A town library doesn't shelve every book in the region on opening day. A book is fetched from the store when a reader first asks for it (loading). Before it goes on the shelf, a librarian checks it for missing pages (verification), puts blank index cards in its slots (preparation), and notes its catalogue number in the reading list (resolution). The first reader who opens it fills in the cards from the preface (initialization). The next reader just reads.

## Run it yourself

```sh
javac -d out Lazy.java
java -Xlog:class+load -Xlog:class+init=info -cp out Lazy | grep -v "shared objects file"
```

Before running, remove the line Rare[] slots = new Rare[2] and predict where the load line moves.

## Check yourself

- You delete both Rare.value lines but keep new Rare[2]. What does the program print?::*main starts and array made, without Rare initialized||main starts, Rare initialized, array made >> Creating an array of Rares loads Rare but runs none of its code. >> s1||Only main starts: the program stops when Rare can't initialize >> Nothing fails; Rare is loaded and never needs initializing. >> the-building-block::Loading isn't initialization.
- During preparation, what does value hold, and why not 7?::*0, because 7 is written by Rare's static code, which hasn't run||7, because the class file stores the initial value of every field >> The class file stores the code that writes 7; it runs during initialization. >> s3||Nothing: fields are only created at initialization >> Preparation creates the static fields, with default values. >> s3::Preparation gives defaults; initialization runs code.
- Rare's class file is deleted after compiling. The program prints main starts. Where does it fail?::*At new Rare[2], the first line that needs the class||Before main starts, when the JVM checks every class >> The JVM loads a class only when code first needs it. >> the-building-block||At the first Rare.value, because that's when Rare is initialized >> Loading comes first, and new Rare[2] already needs it. >> s1::Errors about a class surface where the code first needs it.

## Sources

- [JVM specification, chapter 5: Loading, Linking, and Initializing](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-5.html) ("Loading is the process of finding the binary representation of a class or interface type with a particular name and creating a class or interface from that binary representation. Linking is the process of taking a class or interface and combining it into the run-time state of the Java Virtual Machine so that it can be executed. Initialization of a class or interface consists of executing the class or interface initialization method <clinit>")
- [JVM specification, 5.4 Linking](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-5.html#jvms-5.4) ("Linking a class or interface involves verifying and preparing that class or interface, its direct superclass, its direct superinterfaces"; "Linking also involves resolution of symbolic references in the class or interface, though not necessarily at the same time as the class or interface is verified and prepared.";"Errors detected during linkage are thrown at a point in the program where some action is taken by the program that might, directly or indirectly, require linkage to the class or interface involved in the error.")
- [JVM specification, 4.10 Verification of class Files](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-4.html#jvms-4.10) ("At no point during execution can the operand stack grow to a depth greater than that implied by the max_stack item. At no point during execution can more values be popped from the operand stack than it contains."; "The target of each jump and branch instruction" must be "the opcode of an instruction within this method")
- [JVM specification, 5.5 Initialization, step 7](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-5.html#jvms-5.5) ("For each S in the list [ SC, SI1, ..., SIn ], if S has not yet been initialized, then recursively perform this entire procedure for S.")
- [JVM specification, 5.4.2 Preparation](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-5.html#jvms-5.4.2) ("Preparation involves creating the static fields for a class or interface and initializing such fields to their default values"; "explicit initializers for static fields are executed as part of initialization (§5.5), not preparation")
- [JVM specification, 5.4.3 Resolution](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-5.html#jvms-5.4.3) ("Resolution is the process of dynamically determining one or more concrete values from a symbolic reference in the run-time constant pool.")
- [JVM specification, 5.5 Initialization](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-5.html#jvms-5.5) ("The execution of any one of the Java Virtual Machine instructions new, getstatic, putstatic, or invokestatic that references C")
- [JVM specification, 6.5 getstatic](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-6.html#jvms-6.5.getstatic) ("On successful resolution of the field, the class or interface that declared the resolved field is initialized if that class or interface has not already been initialized")
- The log was produced in this session with OpenJDK 21.0.12 (javac, java with -Xlog:class+load and -Xlog:class+init=info); the class-literal and constant edges were checked with a second run in which a Rare.class line printed before Rare was initialized and reading a static final constant printed before Rare was loaded.
