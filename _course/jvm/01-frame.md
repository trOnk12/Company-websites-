---
title: What does a method receive?
short: One frame per call
summary: Track the number seven across the call to increment and back, instruction by instruction.
takeaway: Each method call gets its own frame, with numbered local slots and an operand stack. Arguments arrive as copies in the new frame's slots, instructions work on the stack, and the frame is thrown away when the method returns, leaving only the returned value behind.
---

## The problem

Puzzle 0's javap printed four instructions for increment. Now run them. main holds 7 in its variable original and calls increment(original), which returns 8. While increment runs, where is the 7, and where does increment do its addition? When it returns, why does original still say 7?

```java
static int increment(int value) {
    return value + 1;
}
// in main:
int original = 7;
... increment(original) ...
```

```text
static int increment(int);
  Code:
     0: iload_0
     1: iconst_1
     2: iadd
     3: ireturn
```

## See it

```diagram frame
```

## The building block

A **stack frame** (frame for short) is the memory one method call works in. The JVM creates a new one each time a method is called and throws it away when the call returns. A frame has two parts:

- numbered **local slots**: the method's parameters and local variables, by number instead of by name. increment's value is slot 0.
- an **operand stack**: a pile of values the instructions work on. An instruction takes its inputs from the top of the pile and puts its result back on top.

Calling increment(original) creates increment's frame next to main's and copies 7 from main's slot into increment's slot 0. Then the four instructions run:

| Instruction | What it does | increment's stack afterwards (top on the right) |
| --- | --- | --- |
| before the first one | 7 arrives in local slot 0 | empty |
| `iload_0` | copy the value in slot 0 onto the stack | 7 |
| `iconst_1` | push the constant 1 | 7, 1 |
| `iadd` | remove the two top values and push their sum | 8 |
| `ireturn` | hand the top value to the caller and end this call | frame thrown away |

The names follow a pattern you'll see everywhere: i for int, then the action (load, const, add, return), then a number when the instruction names a slot or a constant. `ireturn` puts 8 on main's own operand stack, and increment's frame is gone.

The copy is the key. `iload_0` copied 7 onto the stack, and the call copied 7 into slot 0 in the first place; nothing ever wrote to main's slot. That's why original still holds 7. Call increment(original) again and you get 8 again, in a brand-new frame. Pass it the returned 8 instead, and you get 9.

This is the model the instructions describe. A real JVM may carry it out differently, as long as the result is the same (puzzle 5 comes back to that).

## The analogy

Each request to the office gets its own desk: a few numbered drawers (the local slots) and a spike for paper slips (the operand stack). The clerk who takes increment's request gets a photocopy of the number 7 in drawer 0. The clerk copies it onto a slip on the spike, spikes a slip with 1, replaces the two with one slip saying 8, and sends that slip back. Then the desk is cleared. The original 7 never left the first clerk's drawer.

## Run it yourself

With Bookmark.java from puzzle 0 compiled into out:

```sh
javap -classpath out -c Bookmark
java -cp out Bookmark
```

Before running, write down the stack after each of increment's instructions, and the first printed line. Then change main to print increment(increment(original)) and predict again.

[Run the browser experiment](https://pachulski.dev/labs/jvm-workbench/#01-frame), or experiment 2 in the [JVM source files](https://github.com/trOnk12/Company-websites-/tree/main/labs/jvm).

## Check yourself

- After `iadd` and before `ireturn`, what is on increment's operand stack?::*One value, 8||Two values, 7 and 8 >> `iadd` removes both of its inputs and pushes only the sum. >> s4||Nothing: the sum went straight into slot 0 >> An addition leaves its result on the stack; only a store would move it to a slot. >> s4::Instructions take inputs from the stack and leave the result on top.
- main ignores the result and calls increment(original) a second time. What comes back?::*8||9 >> The first call never wrote to original; the second call gets a fresh copy of 7 in a new frame. >> s5::Each call gets its own frame with its own copy of the argument.
- What would have to change for original to hold 8 after the call?::*main must store the returned value: original = increment(original)||increment must store 8 back into its slot 0 >> Slot 0 belongs to increment's frame, which is thrown away on return. >> s5||Nothing: `ireturn` writes the result into original >> `ireturn` hands the value to main's operand stack; only main's own store would put it in original. >> s5::Only the caller can change its own locals.

## Sources

- [JVM specification, 2.6 Frames](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-2.html#jvms-2.6) ("A new frame is created each time a method is invoked. A frame is destroyed when its method invocation completes"; "Each frame has its own array of local variables ( §2.6.1 ), its own operand stack ( §2.6.2 )")
- [JVM specification, 2.6.2 Operand Stacks](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-2.html#jvms-2.6.2) ("Other Java Virtual Machine instructions take operands from the operand stack, operate on them, and push the result back onto the operand stack.")
- [JVM specification, 2.6.1 Local Variables](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-2.html#jvms-2.6.1) ("On class method invocation, any parameters are passed in consecutive local variables starting from local variable 0 .")
- [The javap command (JDK 21)](https://docs.oracle.com/en/java/javase/21/docs/specs/man/javap.html) ("-c Prints disassembled code, for example, the instructions that comprise the Java bytecodes, for each of the methods in the class.")
- The listing of increment and the output 7 8 were produced in this session with javac, java and javap from OpenJDK 21.0.12.
