---
title: What does a method receive?
short: What does a method receive?
summary: Track one number across a call and back.
takeaway: Each method invocation has its own frame with locals and an operand stack.
---

## The problem

Look at the increment instructions in the class file from the previous puzzle. The caller holds seven. A helper adds one and returns eight. Where did the seven go while the helper ran?

## See it

```diagram frame
```

## The building block

A **stack frame** belongs to one method call. It holds local variables and an operand stack for intermediate values. Calling increment copies the integer argument into its local slot. Inspect increment with javap. The load instruction pushes seven. The next instruction pushes one. Addition consumes both values and pushes eight. The integer return sends eight to the caller and the helper frame is discarded. The original local in the caller still holds seven.

## Try it

Complete experiment 2 in the [local JVM lab](https://github.com/trOnk12/Company-websites-/tree/main/labs/jvm). Record your prediction before running the program.

## Check yourself

- After the addition and before the return, what is on the helper stack?::*One value, eight||Two values, seven and eight >> Addition consumes both of its inputs. >> the-building-block::Each method invocation has its own frame with locals and an operand stack.

## Sources

- [Oracle Java reference](https://docs.oracle.com/en/java/javase/21/docs/specs/man/javap.html)
