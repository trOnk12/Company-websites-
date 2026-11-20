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

The Java Virtual Machine (JVM) executes a program described by class files. The compiler reads the source and writes those files. The launcher in this lab loads Bookmark from the out directory. Editing the source alone leaves the old class there. Use the four commands in the lab guide, change the addition and run the old class before recompiling. On Android you may recognize the source language, but installed Android apps normally execute DEX code on ART. This lab runs the desktop Java runtime.

## Try it

Complete experiment 1 in the [local JVM lab](https://github.com/trOnk12/Company-websites-/tree/main/labs/jvm). Record your prediction before running the program.

## Check yourself

- You edit the source and run the existing class. Which value changes?::*Neither printed value||The result immediately increases by one >> The launch command loads the class that already exists. >> the-building-block::The compiler writes instructions into a class file. Running an existing class reads that earlier output.

## Sources

- [Oracle Java reference](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-2.html)
