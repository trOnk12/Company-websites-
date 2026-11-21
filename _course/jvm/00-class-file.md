---
title: Which program did you actually run?
short: Which program did you actually run?
summary: Follow a source edit into the file the runtime reads.
takeaway: The compiler writes instructions into a class file. Running an existing class reads that earlier output.
---

## The problem

A **class file** stores a compiled type and its instructions. You change a constant from one to two. The next run still prints the old answer. Which file did that run consume?

## See it

```diagram class-file
```

## The building block

A source file is the text you edit. The Java compiler reads that text and writes a class file containing instructions. The Java Virtual Machine (JVM) can execute those instructions. In this exercise the launcher looks for Bookmark in a directory named out. Separate the two operations on paper. Under compile, write the input and output filenames. Under launch, write the name of the program and the directory searched for its classes.

```sh
javac -d out Bookmark.java
java -cp out Bookmark
javap -classpath out -c Bookmark
```

The first command places the compiled classes in the directory named out. The second looks there for Bookmark and starts its main method. The third prints a readable listing of the instructions in the class. Find the helper named increment. You can inspect a compiled class even if the editor currently shows different source.

| Action | Addition in the editor | Addition in out | First printed line |
| --- | --- | --- | --- |
| Compile and launch the original | add one | add one | 7 8 |
| Edit only, then launch the existing class | add two | add one | 7 8 |
| Compile the edit into out and launch again | add two | add two | 7 9 |

Imagine you compile the fix into another directory called next, then launch using the same command as before. The build succeeds. The result still comes from out. To investigate a stale deployment, identify the artifact the launcher selected and inspect that artifact's instructions. A screenshot of the corrected source cannot establish what ran.

## Try it

[Run the browser experiment](https://pachulski.dev/labs/jvm-workbench/#00-class-file)

### Optional local lab

Complete experiment 1 in the [JVM source files](https://github.com/trOnk12/Company-websites-/tree/main/labs/jvm). Record your prediction before running the program.

## Check yourself

- You edit the source and run the existing class. What does its first line show?::*The earlier 7 8||The updated 7 9 >> The launch command loads the class that already exists. >> the-building-block::The compiler writes instructions into a class file. Running an existing class reads that earlier output.
- You compiled the edit into next but still launch from out. Which result appears?::*The earlier 7 8||The new 7 9 >> The launch command still names out. >> the-building-block::Compilation can succeed while the running program uses an older artifact.
- Which evidence distinguishes stale compiled output from a source edit?::*Inspect the class in the launch directory||Inspect the most recently edited source file >> The editor shows the intended input to a future compilation. >> the-building-block::Inspect the actual artifact selected at launch.

## Sources

- [Java 21 compiler guide](https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html) — “compiles them into class files”
- [Java 21 launcher guide](https://docs.oracle.com/en/java/javase/21/docs/specs/man/java.html)
