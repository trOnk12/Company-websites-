---
title: Why do both names read eight?
short: Why do both names read eight?
summary: Predict which changes survive a method call.
takeaway: A copied reference can still point to the same object. Reassigning one local changes only that local.
---

## The problem

A **reference** is a value that lets code reach an object. Two variables refer to the same bookmark counter. A helper receives one of them. Can it change what the other variable reads?

## See it

```diagram reference
```

## The building block

Each variable holds a reference. The call copies that value into the helper frame. Writing eight into the object changes the field visible through both names. Reassigning the helper parameter to a newly created counter changes only the local copy. Reverse the two statements in edit. Now the write lands on the new object and both caller variables still see seven. Compare the order of the field write and local store in the disassembly.

## Try it

Complete experiment 3 in the [local JVM lab](https://github.com/trOnk12/Company-websites-/tree/main/labs/jvm). Record your prediction before running the program.

## Check yourself

- Reassign the parameter before writing eight. Which value does first see?::*Seven in the original counter||Eight in the newly created counter >> The caller still points at the original object. >> the-building-block::A copied reference can still point to the same object. Reassigning one local changes only that local.

## Sources

- [Oracle Java reference](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-2.html)
