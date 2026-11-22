---
title: Where did my lambda go?
short: Lambdas and inline functions
summary: Puzzle 7 met invokedynamic and its bootstrap method. Follow one Kotlin lambda passed to two functions, one plain and one inline, and compare what each leaves in the bytecode.
takeaway: A lambda passed to an ordinary function becomes a function object, built through invokedynamic and LambdaMetafactory, and the callee runs it with invokeinterface. Passed to an inline function, the lambda never becomes an object: kotlinc copies the function's body and the lambda's code into the caller.
---

## The problem

Kotlin code is full of lambdas: list.forEach { ... }, a click listener, a coroutine builder. The JVM from puzzle 7 has no "lambda" anywhere; it only knows objects and method calls. So when you pass { println(step) } to a function, what exists while the program runs? And why does Kotlin tell you to mark some functions inline?

```kotlin
fun runLater(action: () -> Unit) {
    action()
}

inline fun runNow(action: () -> Unit) {
    action()
}

fun main() {
    val step = 7
    runLater { println(step) }
    runNow { println(step) }
}
```

## See it

```diagram lambda-inline
```

## The building block

This is main as kotlinc 2.2.21 compiled it:

```text
public static final void main();
  Code:
     0: bipush        7
     2: istore_0
     3: iload_0
     4: invokedynamic #46,  0     // InvokeDynamic #0:invoke:(I)Lkotlin/jvm/functions/Function0;
     9: invokestatic  #48         // Method runLater:(Lkotlin/jvm/functions/Function0;)V
    12: iconst_0
    13: istore_1
    14: iconst_0
    15: istore_2
    16: getstatic     #54         // Field java/lang/System.out:Ljava/io/PrintStream;
    19: iload_0
    20: invokevirtual #60         // Method java/io/PrintStream.println:(I)V
    23: nop
    24: nop
    25: nop
    26: return
```

*The plain function, runLater (offsets 3 to 9).* A lambda that runLater can keep, store or call later must exist as something the JVM can pass around, so it becomes a **function object**: an object with one method, invoke(), whose class implements Kotlin's interface `Function0` (a function with zero parameters). `iload_0` pushes step, and `invokedynamic` takes it and leaves a function object on the stack; its descriptor reads "take an int, return a `Function0`". The captured value 7 travels inside the object. `invokestatic` then passes the object to runLater, and runLater's own bytecode calls it:

```text
6: aload_0
7: invokeinterface #22,  1      // InterfaceMethod kotlin/jvm/functions/Function0.invoke:()Ljava/lang/Object;
```

`invokeinterface`, because runLater calls it through its parameter's type, Function0, an interface (puzzle 7). The lambda's body was compiled into a private static method of main's own class, main$lambda$0, which javap shows with -p. So the call goes from runLater through invoke() into main$lambda$0(7), which prints.

Where does the object's class come from? There is no class file for it on disk. `invokedynamic` #46 points to a bootstrap method (puzzle 7), and javap's verbose output names it:

```text
BootstrapMethods:
  0: #43 REF_invokeStatic java/lang/invoke/LambdaMetafactory.metafactory:(...)Ljava/lang/invoke/CallSite;
    Method arguments:
      #29 ()Ljava/lang/Object;
      #34 REF_invokeStatic LambdasKt.main$lambda$0:(I)Lkotlin/Unit;
      #36 ()Lkotlin/Unit;
```

`LambdaMetafactory` is part of the JDK. Its arguments say: implement invoke() by calling main$lambda$0. The first time offset 4 runs, the JVM calls this bootstrap method. It creates a **hidden class** for the lambda while the program runs: a class with no class file, which no other code can name in its bytecode. Then it links this one **call site** (the place in the code where the call is written, here offset 4 of main) to a factory for that class's objects. From then on, each run of offset 4 just produces an object; the bootstrap method doesn't run again. Print action.javaClass.name inside runLater and you see the generated class: LambdasKt$$Lambda/0x00007fa17c001000 in this run (the number differs each time). In a loop that calls runLater three times from one line, all three objects printed the same class name, and javaClass.isHidden printed true.

*The inline function, runNow (offsets 12 to 25).* There is no call to runNow at all, and no function object. An inline function's body is copied into each place that calls it, and the lambda's code is copied in with it. Offsets 16 to 20 are println(step) itself: read System.out, push step, call println. The iconst_0 and istore pairs only fill marker locals whose names, such as $i$f$runNow, tell a debugger where copied code came from (javap -l lists them), and nop does nothing.

| | runLater (plain) | runNow (inline) |
| --- | --- | --- |
| What main contains | `invokedynamic`, then a call to runLater | the lambda's code itself |
| Objects created | one function object per call | none |
| Calls at run time | runLater, then invoke(), then main$lambda$0 | println only |
| Size of main | same for any lambda | grows with every copy |

That's why the Kotlin docs say functions that take lambdas impose "runtime penalties" (an object and extra calls), and why the standard library's forEach is inline. It's also why inline is for small functions: each call site gets a full copy.

### The edges

- *Before Kotlin 2.0* a lambda like the one passed to runLater became its own class file, LambdasKt$main$1.class, created with new and `invokespecial`. Kotlin 2.0 made `invokedynamic` the default. The compiler option -Xlambdas=class brings the old way back for a whole module, for example when lambdas must be serializable, or annotate that one lambda with @JvmSerializableLambda: in a run with runLater @JvmSerializableLambda { println(step) }, that lambda became its own class file again while the other stayed `invokedynamic`.
- *An inline lambda can't be stored.* Because it never becomes an object, an inline function can only call its lambda or pass it to another inline function. To keep one, mark that parameter noinline; it then becomes a function object again.
- *Return means something different.* A bare return inside a lambda passed to an inline function, such as forEach, returns from the enclosing function, because the code was copied there; the Kotlin docs show it returning from a function called hasZeros. In a lambda passed to runLater, a bare return isn't allowed.
- *Android rewrites this.* Android's build tools convert class files into their own format and always replace `invokedynamic` lambdas with generated classes; module 3 ends with that bridge (puzzle 18).

## The analogy

runLater is a colleague who takes your instructions away to do later: you must write them on a card (the function object) that they can carry. The first time, the office makes up a card format for this kind of instruction (the bootstrap method). runNow is the colleague who says "just do it yourself, here's how", and you copy their steps into your own notebook: no card, no handover, but your notebook gets longer each time.

## Run it yourself

Save the program at the top of this page as Lambdas.kt, then:

```sh
kotlinc Lambdas.kt -d out
javap -classpath out -c -p LambdasKt
javap -classpath out -v LambdasKt
kotlinc Lambdas.kt -Xlambdas=class -d out-old
```

Count the class files in out and in out-old before you look.

## Check yourself

- You remove inline from runNow and recompile. What appears in main where the println instructions were?::*`invokedynamic` and a call to runNow||The same copied println instructions >> Without inline, nothing is copied; the lambda must become an object to be passed. >> s6||Only a call to runNow, with no lambda >> runNow still needs the lambda, so main must build a function object to pass. >> s3::A plain function receives the lambda as an object.
- Why must the lambda passed to runLater become an object, while the one passed to runNow needn't?::*runLater receives it as a value it could store or call later||Objects are faster to call than copied code >> The copy avoids an object and a call; the object exists because runLater needs a value. >> the-building-block||runNow's lambda captures no value >> Both capture step; capturing isn't the difference. >> s3::Only a function that receives the lambda needs an object.
- The line runLater { println(step) } runs 1,000 times inside a loop. How often does `LambdaMetafactory`'s bootstrap method run?::*Once, the first time that `invokedynamic` runs||1,000 times, once per call >> The bootstrap method links the call site once; later runs only make objects. >> s4||Never; kotlinc generated the class at compile time >> Since Kotlin 2.0 there is no class file for this lambda; its class is created while the program runs. >> s2::The bootstrap method runs once per call site.

## Sources

- [Kotlin docs: What's new in Kotlin 2.0.0](https://kotlinlang.org/docs/whatsnew20.html#generation-of-lambda-functions-using-invokedynamic) ("Kotlin 2.0.0 introduces a new default method for generating lambda functions using invokedynamic . This change reduces the binary sizes of applications compared to the traditional anonymous class generation."; "A lambda compiled into invokedynamic is not serializable."; "Annotate specific lambdas with @JvmSerializableLambda . Use the compiler option -Xlambdas=class to generate all lambdas in a module using the legacy method.")
- [Kotlin docs: Inline functions](https://kotlinlang.org/docs/inline-functions.html) ("Using higher-order functions imposes certain runtime penalties: each function is an object, and it captures a closure."; "The inline modifier affects both the function itself and the lambdas passed to it: all of those will be inlined into the call site."; "Inlining may cause the generated code to grow."; "noinline lambdas, however, can be manipulated in any way you like, including being stored in fields or passed around."; "if (it == 0) return true // returns from hasZeros")
- [Java 21 API: LambdaMetafactory](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/invoke/LambdaMetafactory.html) ("These methods are typically used as bootstrap methods for invokedynamic call sites"; "Linkage may involve dynamically loading a new class that implements the target interface, or re-using a suitable existing class."; "Capture occurs when the CallSite 's target is invoked, typically through an invokedynamic call site, producing a function object. This may occur many times for a single factory CallSite .")
- [JEP 371: Hidden Classes](https://openjdk.org/jeps/371) ("Introduce hidden classes , which are classes that cannot be used directly by the bytecode of other classes."; "C.class file uses LambdaMetaFactory at run time to define a hidden class that holds the body of the lambda expression and implements the required functional interface.")
- [JVM specification, 2.11.8](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-2.html#jvms-2.11.8) ("each occurrence of an invokedynamic instruction has a unique linkage state")
- The listings, the BootstrapMethods table, the run-time class name, the three-call loop with isHidden, the @JvmSerializableLambda run and the -Xlambdas=class comparison were produced in this session with kotlinc 2.2.21 and OpenJDK 21.0.12.
