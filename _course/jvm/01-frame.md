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

A local is a slot belonging to the current call. The operand stack is its scratch space. In the table the rightmost number is the top, where an instruction takes its next input. The caller passes seven to a static helper, so the helper's first local slot starts at seven.

| Helper instruction | Action | Helper stack afterwards |
| --- | --- | --- |
| Before the first instruction | Receive seven in local slot zero | empty |
| iload_0 | Copy the value in slot zero onto the stack | 7 |
| iconst_1 | Push a constant one | 7, 1 |
| iadd | Remove the two numbers and push their sum | 8 |
| ireturn | Deliver eight to the caller and finish this call | frame discarded |

Notice that loading a local copies its value. If the caller throws away the returned eight and calls the helper again with its original seven, it gets eight again. If it passes the returned eight as the next argument, it gets nine. Trace both paths by drawing a fresh row for each call. This is the execution model described by the instructions. A runtime may optimize how it implements that model.

## Try it

[Run the browser experiment](https://pachulski.dev/labs/jvm-workbench/#01-frame)

### Optional local lab

Complete experiment 2 in the [JVM source files](https://github.com/trOnk12/Company-websites-/tree/main/labs/jvm). Record your prediction before running the program.

## Check yourself

- After the addition and before the return, what is on the helper stack?::*One value, eight||Two values, seven and eight >> Addition consumes both of its inputs. >> the-building-block::Each method invocation has its own frame with locals and an operand stack.

- The caller ignores the result and calls the helper again with its original seven. What comes back?::*Eight||Nine >> No value was assigned to the caller's original local. >> the-building-block::The second invocation receives seven in a fresh local slot.
- To get nine on the second call, which number must it receive?::*The first call's result, eight||The first call's unchanged input, seven >> The helper adds exactly one to the value it receives. >> the-building-block::Passing the result explicitly connects two otherwise independent calls.

## Sources

- [JVM specification, frames](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-2.html#jvms-2.6) — “A new frame is created each time a method is invoked.”
- [Java 21 disassembler guide](https://docs.oracle.com/en/java/javase/21/docs/specs/man/javap.html)
