---
title: What does #7 point to?
short: The constant pool
summary: Puzzle 5's instructions carried small numbers inside themselves. Now score reads a field and multiplies by 100000. Follow the number after the instruction to the table where names and big numbers live.
takeaway: An instruction that needs a name or a big number carries only an index into the constant pool, a numbered table in the class file. Fields and methods are described there by text (the class, the name, the descriptor), never by a memory address, because the compiler can't know where they will be when the program runs.
---

## The problem

Puzzle 5 ended with a number too big to travel inside an instruction. Here is a second problem: score now reads its weight from a field, and a field belongs to a class that might be compiled at another time, by another build.

```java
public class Score {
    static int weight = 2;

    static int score(int visits, int stars) {
        return visits * weight + stars * 100000;
    }
}
```

An instruction is only a few bytes long. It can't hold the text "weight", and it can't hold a memory address, because nobody knows where weight will be in memory until the program runs. So what does the instruction that reads weight carry?

## See it

```diagram constant-pool
```

## The building block

This is what javap prints for score:

```text
static int score(int, int);
  Code:
     0: iload_0
     1: getstatic     #7                  // Field weight:I
     4: imul
     5: iload_1
     6: ldc           #13                 // int 100000
     8: imul
     9: iadd
    10: ireturn
```

Two new instructions. `getstatic` reads a static field (one that belongs to the class, not to an object) and pushes its value. `ldc` pushes a constant. Look at the offsets: `getstatic` starts at 1 and the next instruction at 4, so it is three bytes long, the opcode plus two bytes holding one number, 7. The text after // is not in the class file. javap adds it to help you, and you are about to see where it gets it.

Near the start of every class file, right after a magic number and the version, is its **constant pool**: a numbered table of the names, texts and numbers its code refers to. 7 is an index into that table. The verbose option of javap prints it (this is part of the real output for Score):

```text
Constant pool:
   #7 = Fieldref           #8.#9          // Score.weight:I
   #8 = Class              #10            // Score
   #9 = NameAndType        #11:#12        // weight:I
  #10 = Utf8               Score
  #11 = Utf8               weight
  #12 = Utf8               I
  #13 = Integer            100000
  ...
  #16 = Utf8               score
  #17 = Utf8               (II)I
```

Follow #7 the way the diagram does. It's a Fieldref: a field, described by two other entries. #8 is a Class entry that points to the text Score (Utf8 means a piece of text). #9 pairs a name, weight, with a **descriptor**, I. A descriptor is the type written in a short code: I is int, J is long, and a reference to an object of a class is L, the class name with slashes, and a semicolon, such as Ljava/lang/String; for a String. A method's descriptor lists the parameter types in brackets, then the return type: score's own descriptor is entry #17 in the listing above: two I letters in brackets, then I, so two ints in and an int out.

So the instruction says "read the field named weight, of type int, in class Score". That's a **symbolic reference**: it names the field instead of giving its address. Each class file is compiled on its own, so the compiler can't know where another class's field, or even its own, will sit in memory. The JVM looks the name up while the program runs. Module 3 shows when and how it does (puzzle 11).

Big numbers live in the pool too. `ldc` #13 points at an entry that holds 100000 itself, so `ldc` just pushes it. `ldc` has a one-byte index (it starts at 6, the next instruction at 8); for an entry past number 255 the compiler emits `ldc_w`, which carries a two-byte index.

Why a table rather than text inside each instruction? Instructions stay small (an index takes one or two bytes, however long the name), and a name used in twenty places is stored once. The pool is also where the class names itself, its methods and its parent class.

### The edges

- *A long or double takes two entries.* In puzzle 5's big method the long 100000 was #7, and the next entry was #9: #8 doesn't exist. The JVM specification itself calls this "a poor choice", kept for compatibility.
- *The table has a limit.* The class file stores the entry count in two bytes, so a class can have at most 65,534 usable entries. Huge generated classes (big lookup tables written as code) can hit it, and the compiler then refuses to compile them.
- *A constant can be copied into the caller.* A static final field with a constant value in Java, or a const val in Kotlin, is not looked up by name at all: the compiler writes its value into every class that uses it. This run shows the trap, with a class Config declaring two fields, a constant and a plain static field, and a second Score whose fixed method multiplies by base and whose live method multiplies by weight:

```java
public class Config {
    static final int base = 2;
    static int weight = 2;
}

public class Score {
    static int fixed(int visits) { return visits * Config.base; }
    static int live(int visits) { return visits * Config.weight; }
    public static void main(String[] a) { System.out.println(fixed(3) + " " + live(3)); }
}
```

```text
static int fixed(int);          static int live(int);
  0: iload_0                      0: iload_0
  1: iconst_2                     1: getstatic  #9   // Field Config.weight:I
  2: imul                         4: imul
  3: ireturn                      5: ireturn
```

Both print 6 for 3 visits. Change both values in Config to 5 and recompile only Config: the program prints 6 and 15. fixed still multiplies by 2, because the 2 is inside Score's own bytecode, exactly the stale-output problem of puzzle 0. Recompile every class that uses a constant when you change it, which a full build does and a hand-copied class file doesn't.

## The analogy

A clerk's order slip doesn't say "the drawer with Mrs Novak's file in the records room on floor three". It says "see entry 7" and the front page of the folder lists entry 7: records room, Novak, type: file. The clerk who carries out the order looks up where the records room is today. If the slip had a room number written on it, it would break the first time the office moved.

## Run it yourself

Save the Score class from the top of this page as Score.java, then:

```sh
javac -d out Score.java
javap -classpath out -v Score
```

For the constant trap, put Config.java and the second Score.java in a new folder and run javac -d out Config.java Score.java, then java -cp out Score. Change both 2s in Config to 5, run javac -d out Config.java only, and run Score again. Predict both numbers before each run.

Find the line for `getstatic` in score, then follow its index through the constant pool by hand before reading javap's comment.

## Check yourself

- You rename the field weight to factor and recompile Score. In the constant pool, what changes?::*The Utf8 entry that held weight now holds factor||The number after `getstatic` becomes the field's new memory address >> The instruction holds an index into the pool, never an address. >> s2||Nothing: names are removed when the class is compiled >> The name is exactly what the pool keeps, so it can be looked up while the program runs. >> s4::Fields are described by name and descriptor.
- Why does `getstatic` carry an index rather than the field's address?::*Where the field will be in memory is only known while the program runs||Addresses are too long to fit in two bytes >> Even a short address couldn't be known when the class was compiled. >> the-building-block||The JVM forbids instructions from touching memory directly >> It does read the field; it just finds it by name first. >> the-building-block::The compiler can only name the field; the JVM finds it later.
- A library's Kotlin const val limit = 10 changes to 20. Your app's classes aren't recompiled. What do they use?::*10, copied into their own bytecode||20, looked up through the constant pool when they run >> A constant's value is copied into the user's class, not looked up. >> the-building-block||Whichever value the library's class file holds >> The user's class never reads the library's field for a constant. >> the-building-block::Recompile everything that uses a changed constant.

## Sources

- [JVM specification, 4.4 The Constant Pool](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-4.html#jvms-4.4) ("Java Virtual Machine instructions do not rely on the run-time layout of classes, interfaces, class instances, or arrays. Instead, instructions refer to symbolic information in the constant_pool table.")
- [JVM specification, 4.1 The ClassFile Structure](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-4.html#jvms-4.1) ("u4 magic; u2 minor_version; u2 major_version; u2 constant_pool_count;"; "The value of the constant_pool_count item is equal to the number of entries in the constant_pool table plus one.")
- [JVM specification, 4.4.5 CONSTANT_Long_info and CONSTANT_Double_info](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-4.html#jvms-4.4.5) ("All 8-byte constants take up two entries in the constant_pool table of the class file."; "In retrospect, making 8-byte constants take two constant pool entries was a poor choice.")
- [JVM specification, 4.3 Descriptors](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-4.html#jvms-4.3) ("I int integer J long long integer L ClassName ; reference an instance of class ClassName"; "A method descriptor contains zero or more parameter descriptors, representing the types of parameters that the method takes, and a return descriptor")
- [JVM specification, 2.6.3 Dynamic Linking](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-2.html#jvms-2.6.3) ("The class file code for a method refers to methods to be invoked and variables to be accessed via symbolic references.")
- [JVM specification, 6.5 getstatic and ldc](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-6.html#jvms-6.5.ldc) (getstatic: "Get static field from class"; ldc: "The index is an unsigned byte that must be a valid index into the run-time constant pool of the current class")
- [Java language specification, 13.4.9 final Fields and static Constant Variables](https://docs.oracle.com/javase/specs/jls/se21/html/jls-13.html#jls-13.4.9) ("they will not see any new value for a usage of the field unless they are recompiled")
- [Kotlin docs: Properties, compile-time constants](https://kotlinlang.org/docs/properties.html) ("Compile-time constants are inlined at compile time, so each reference is replaced with its actual value.")
- The listings and the 6 6 / 6 15 run were produced in this session with OpenJDK 21.0.12 (javac, java, javap).
