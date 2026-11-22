---
title: Which program did you actually run?
short: Source, class file, launch
summary: Follow a source edit into the file the runtime reads, and see why an edit alone changes nothing that runs.
takeaway: The compiler writes instructions into a class file, and the launcher runs the class file it finds, not the source in your editor. An edit changes what runs only after it is compiled into the folder the launcher reads.
---

## The problem

This course starts from your editor, the one place every Kotlin developer already knows. A **class file** stores a compiled type and its instructions. You change a constant from one to two, run the program again, and it still prints the old answer. Which file did that run read?

Here is the whole program. It is Java rather than Kotlin, so that the compiled output stays as small as possible; puzzle 8 reads what kotlinc writes.

```java
public final class Bookmark {
    static final class Counter {
        int value;
        Counter(int value) { this.value = value; }
    }

    static int increment(int value) {
        return value + 1;
    }

    static void edit(Counter inside) {
        inside.value = 8;
        inside = new Counter(99);
    }

    public static void main(String[] args) {
        int original = 7;
        Counter first = new Counter(original);
        Counter second = first;
        edit(second);
        System.out.println(original + " " + increment(original));
        System.out.println(first.value + " " + second.value);
        second = null;
        System.out.println(first.value);
    }
}
```

This puzzle needs only increment and the first printed line, 7 8. The rest of the program comes back in puzzles 1 to 3.

## See it

```diagram class-file
```

## The building block

A source file is the text you edit. The Java compiler, javac, reads that text and writes a class file containing instructions. The Java Virtual Machine (JVM), the program that runs Java and Kotlin code, executes those instructions. It never reads your source.

```sh
javac -d out Bookmark.java
java -cp out Bookmark
javap -classpath out -c Bookmark
```

The first command places the compiled classes in the folder named out. The second, the launcher, looks in out for Bookmark and starts its main method. The third, javap, prints a readable listing of the instructions in a class file. This is what it prints for increment, compiled from value + 1:

```text
static int increment(int);
  Code:
     0: iload_0
     1: iconst_1
     2: iadd
     3: ireturn
```

You don't need to read every line yet (puzzle 1 does). Look at `iconst_1`: the one from the source is inside the class file as an instruction. Change the source to value + 2 and recompile, and javap shows `iconst_2` there instead.

| Action | Addition in the editor | Instruction in out/Bookmark.class | First printed line |
| --- | --- | --- | --- |
| Compile and launch the original | value + 1 | `iconst_1` | 7 8 |
| Edit only, then launch from out | value + 2 | `iconst_1` | 7 8 |
| Compile the edit into next, launch from out | value + 2 | `iconst_1` (next has `iconst_2`) | 7 8 |
| Compile the edit into out, launch again | value + 2 | `iconst_2` | 7 9 |

The third row is the one that fools people: the build succeeded, but into a different folder, and the launch command still names out. To investigate a stale deployment, find the artifact the launcher selected and inspect that artifact's instructions. A screenshot of the corrected source can't establish what ran.

## The analogy

An office clerk works from a printed copy of the procedures, never from the author's draft. The author can change the draft all day; the clerk keeps following the printed copy in the folder on the desk. Printing a new copy into a different folder changes nothing either: the clerk reads the folder on the desk.

## Run it yourself

Save the program above as Bookmark.java (puzzle 5 shows how to install a JDK if you don't have one), then:

```sh
javac -d out Bookmark.java
java -cp out Bookmark
```

Now change value + 1 to value + 2. Before each of the next commands, write down the first line you expect:

```sh
java -cp out Bookmark
javac -d next Bookmark.java
java -cp out Bookmark
java -cp next Bookmark
javap -classpath out -c Bookmark
```

[Run the browser experiment](https://pachulski.dev/labs/jvm-workbench/#00-class-file) for the same idea without installing anything, or experiment 1 in the [JVM source files](https://github.com/trOnk12/Company-websites-/tree/main/labs/jvm).

## Check yourself

- You edit the source to value + 2 and launch from out without compiling. What does the first line show?::*7 8, from the earlier class file||7 9, from the edited source >> The launcher reads the class file in out; the source isn't read at all. >> s2::The compiler writes instructions into a class file. Running an existing class reads that earlier output.
- You compiled the edit into next but still launch with -cp out. Which result appears?::*7 8||7 9 >> The launch command still names out, whose class file still holds `iconst_1`. >> s4::Compilation can succeed while the running program uses an older artifact.
- A colleague says "the fix is deployed, I can see it in the source". What would prove which version ran?::*javap on the class file the launcher read||The source file's last-modified time >> The source is only the input to a future compilation; the launcher never reads it. >> s3||A successful build log >> A build can succeed into a folder the launcher doesn't read. >> s4::Inspect the actual artifact selected at launch.

## Sources

- [The javac command (JDK 21)](https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html) ("The javac command reads source files that contain module, package and type declarations written in the Java programming language, and compiles them into class files that run on the Java Virtual Machine."; "-d directory Sets the destination directory (or class output directory ) for class files.")
- [The java command (JDK 21)](https://docs.oracle.com/en/java/javase/21/docs/specs/man/java.html) ("The java command starts a Java application."; "-cp classpath Specifies a list of directories, JAR files, and ZIP archives to search for class files.")
- [The javap command (JDK 21)](https://docs.oracle.com/en/java/javase/21/docs/specs/man/javap.html) ("The javap command disassembles one or more class files."; "-c Prints disassembled code, for example, the instructions that comprise the Java bytecodes, for each of the methods in the class.")
- The four runs (7 8, 7 8, 7 8 from out with next holding the fix, 7 9) and both javap listings of increment were produced in this session with javac, java and javap from OpenJDK 21.0.12.
