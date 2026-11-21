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

Call the original object A and the new one B. These letters label their identity so we can follow each object even when two objects happen to store the same number. A field belongs to an object. A parameter is a local name initialized when the call starts.

```java
Counter first = new Counter(7);
Counter second = first;
edit(second);
```

| Operation inside the example | first | second | inside | Field values |
| --- | --- | --- | --- | --- |
| Enter edit | A | A | A | A holds 7 |
| Write inside.value = 8 | A | A | A | A holds 8 |
| Assign inside = new Counter(99) | A | A | B | A holds 8, B holds 99 |
| Return to caller | A | A | helper finished | caller reads 8 twice |

Suppose the caller wants second to refer to B after the call. Have the helper return B, then assign that returned value to second in the caller. First continues to refer to A. This explains how one method can change a shared object's contents while replacing a caller's variable requires a separate assignment.

## Try it

[Run the browser experiment](https://pachulski.dev/labs/jvm-workbench/#02-reference)

### Optional local lab

Complete experiment 3 in the [JVM source files](https://github.com/trOnk12/Company-websites-/tree/main/labs/jvm). Record your prediction before running the program.

## Check yourself

- Reassign the parameter before writing eight. Which value does first see?::*Seven in the original counter||Eight in the newly created counter >> The caller still points at the original object. >> the-building-block::A copied reference can still point to the same object. Reassigning one local changes only that local.

- The helper writes eight, creates B and returns B. The caller ignores the result. Which object does second reach?::*A||B >> Returning a value does not assign it to second. >> the-building-block::The caller still holds the copied reference to A.
- The caller assigns returned B to second. What does first reach?::*A||B >> The assignment changed just the caller's second variable. >> the-building-block::Track the two names independently, even when they originally held the same value.

## Sources

- [Java language specification, method invocation](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.12.4.5) — “assign the argument values to corresponding freshly created parameter variables”
