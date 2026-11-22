---
title: Where does the arithmetic happen?
short: The operand stack does the arithmetic
summary: Puzzle 1 traced one addition. Now a method with two inputs, a multiplication and a local variable. Read every instruction and predict what the operand stack holds after each one.
takeaway: Instructions never name the variables they combine. Each one takes its inputs from the top of the operand stack and leaves its result there; loads copy a local onto the stack and stores move the top back into a local, so the order of the instructions is the order of the arithmetic.
---

## The problem

Puzzle 1's helper added one to seven in four instructions. Real methods have several inputs, several operators and named local variables. You write this:

```kotlin
fun score(visits: Int, stars: Int): Int {
    val total = visits * 2 + stars
    return total
}
```

The compiled instructions contain no brackets, no operator precedence and no variable names. So how does the JVM know to multiply before it adds, and where does total live while the method runs?

## See it

```diagram operand-stack
```

## The building block

The instructions inside a class file are called **bytecode**, because each one starts with a single byte, its **opcode**, that says which operation to perform. Some instructions carry a few more bytes after the opcode, such as a small number. This is the bytecode of score, printed by javap from puzzle 0 (the same output comes from the Kotlin function above and from the same method written in Java):

```text
static int score(int, int);
  Code:
     0: iload_0
     1: iconst_2
     2: imul
     3: iload_1
     4: iadd
     5: istore_2
     6: iload_2
     7: ireturn
```

Read it with one rule: **an instruction takes its inputs from the top of the operand stack and leaves its result there**. It never names the values it combines. `iload_0` copies the value in local slot 0 (visits) onto the stack. `iconst_2` pushes the constant 2. `imul` removes the top two values and pushes their product. Then `iload_1` pushes stars, and `iadd` replaces the two values with their sum. The call score(3, 4) leaves 10.

| Instruction | What it does | Stack afterwards (top on the right) | Local slot 2 |
| --- | --- | --- | --- |
| `iload_0` | copy local 0 (visits = 3) | 3 | empty |
| `iconst_2` | push the constant 2 | 3, 2 | empty |
| `imul` | remove two values, push their product | 6 | empty |
| `iload_1` | copy local 1 (stars = 4) | 6, 4 | empty |
| `iadd` | remove two values, push their sum | 10 | empty |
| `istore_2` | remove the top value, write it into local 2 | empty | 10 |
| `iload_2` | copy local 2 | 10 | 10 |
| `ireturn` | hand the top value to the caller | frame discarded | |

So the compiler has already turned the precedence into an order. Multiplication binds tighter in Kotlin, so `imul` comes before `iadd`. Write (visits + stars) * 2 and the compiler emits a different order: `iload_0`, `iload_1`, `iadd`, `iconst_2`, `imul`. The JVM just runs the list.

A store is the opposite of a load. `istore_2` removes the top value and writes it into local slot 2, which is where the source's total lives: locals are numbered slots, and the names stay in the source. The parameters take the first slots (visits is 0, stars is 1), so the first local you declare gets slot 2.

For subtraction the order matters. The value pushed first sits deeper and is the left-hand side. visits - stars compiles to `iload_0`, `iload_1`, `isub`: the JVM subtracts the top value (stars) from the one below it (visits).

The numbers on the left are **byte offsets**: where each instruction starts, counted in bytes from the start of the method. Here every instruction is one byte long, so they count 0 to 7. Change the constant 2 to 100 and the compiler emits `bipush` 100, which carries the number in a second byte, so the next instruction starts two bytes later. 1000 doesn't fit in one byte; `sipush` 1000 carries two:

```text
0: iload_0           0: iload_0
1: bipush  100       1: sipush  1000
3: imul              4: imul
4: ireturn           5: ireturn
```

When javap shows a jump in the offsets, an instruction carried extra bytes. A number too large for two bytes, such as 100000, can't travel inside the instruction at all; the next puzzle shows where it lives.

The first letter of most of these names is a **type letter**: i for int, l for long, a for a reference (puzzle 2). The JVM doesn't work out types while it runs; the compiler picks the instruction for the type. A long is 8 bytes and needs two slots: a method that takes one long uses local slots 0 and 1 for it, and the long counts twice towards the stack's depth.

```text
static long big(long);
  Code:
     0: lload_0
     1: ldc2_w        #7        // long 100000l
     4: ladd
     5: lreturn
```

### The edges

- The class file records how deep the stack can get and how many local slots the method uses, so a frame can be set up before its first instruction runs. Print them with javap's verbose option: score shows stack=2, locals=3. The compiler computed that depth by walking the same list you just walked.
- This is the execution model the instructions describe. As puzzle 1 said, a runtime may run the same method differently, for example translated to machine instructions, as long as the result is the one this model gives.
- A Kotlin function written at the top of a file becomes a static method of a class named after the file (Score.kt becomes a class named `ScoreKt`). Puzzle 8 reads more of what Kotlin compiles to.

## The analogy

A clerk works with a spike for paper slips and a row of numbered drawers. A load copies the slip in a drawer onto the spike. An arithmetic order takes the top two slips off the spike, writes the answer on a new slip and spikes it. A store takes the top slip off and files it in a drawer. The clerk's list of orders never says "visits", only "drawer 0", and the clerk does them strictly in the order they're written.

## Run it yourself

```sh
javac -d out Score.java
javap -classpath out -c Score
javap -classpath out -v Score
```

Before running the second command, write down the instruction list you expect for score. Then change the constant 2 to 100 and predict the new offsets.

## Check yourself

- A method returns visits - stars. Which instruction list computes it?::*`iload_0`, `iload_1`, `isub`||`iload_1`, `iload_0`, `isub` >> The value pushed first is the left-hand side; this list computes stars - visits. >> the-building-block||`isub`, `iload_0`, `iload_1` >> The inputs must be on the stack before the instruction that uses them runs. >> s2::The first value pushed sits deeper and is the left-hand side.
- Why does the bytecode for (visits + stars) * 2 need no brackets?::*The order of the instructions already says which operation runs first||The JVM reads the brackets from the source file when it runs the method >> The JVM runs the class file; the source isn't consulted (puzzle 0). >> the-building-block||The JVM always adds before it multiplies >> For visits * 2 + stars the same JVM multiplies first, because `imul` comes first. >> s4::The compiler turned the precedence into the order of the list.
- The caller runs score(3, 4) and then score(5, 1). What is in local slot 2 when the second call starts?::*Nothing yet, until its own `istore_2` runs||10, left over from the first call >> Each call gets a fresh frame with its own locals (puzzle 1). >> s5::A local slot belongs to one call's frame; the second call fills its slot 2 with 11.

## Sources

- [JVM specification, 2.6.2 Operand Stacks](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-2.html#jvms-2.6.2) ("Each frame (§2.6) contains a last-in-first-out (LIFO) stack known as its operand stack. The maximum depth of the operand stack of a frame is determined at compile-time"; "Other Java Virtual Machine instructions take operands from the operand stack, operate on them, and push the result back onto the operand stack."; "a value of type long or double contributes two units to the depth")
- [JVM specification, 2.6.1 Local Variables](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-2.html#jvms-2.6.1) ("A value of type long or type double occupies two consecutive local variables.")
- [JVM specification, 2.11 Instruction Set Summary](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-2.html#jvms-2.11) ("A Java Virtual Machine instruction consists of a one-byte opcode specifying the operation to be performed, followed by zero or more operands supplying arguments or data that are used by the operation.")
- [JVM specification, 2.11.1 Types and the Java Virtual Machine](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-2.html#jvms-2.11.1) ("the instruction type is represented explicitly in the opcode mnemonic by a letter: i for an int operation, l for long, s for short, b for byte, c for char, f for float, d for double, and a for reference")
- [JVM specification, 6.5 istore_&lt;n&gt;](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-6.html#jvms-6.5.istore_n) ("The value on the top of the operand stack must be of type int. It is popped from the operand stack, and the value of the local variable at &lt;n&gt; is set to value.")
- [The javap command (JDK 21)](https://docs.oracle.com/en/java/javase/21/docs/specs/man/javap.html) ("-c Prints disassembled code, for example, the instructions that comprise the Java bytecodes, for each of the methods in the class."; "-verbose or -v Prints additional information about the selected class.")
- [Kotlin docs: Calling Kotlin from Java](https://kotlinlang.org/docs/java-to-kotlin-interop.html) ("Kotlin represents package-level functions as static methods.")
- The bytecode listings were produced in this session with javac and javap from OpenJDK 21.0.12 and kotlinc 2.2.21.
