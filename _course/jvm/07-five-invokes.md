---
title: Which method does a call run?
short: Five ways to call a method
summary: Puzzles 5 and 6 read arithmetic and fields. Now the instructions that call methods. There are five, and the compiler picks one for every call by asking a few questions about it.
takeaway: Every call compiles to one of five invoke instructions. invokestatic and invokespecial always run exactly the method the constant pool names; invokevirtual and invokeinterface pick the method from the receiver's class while the program runs; invokedynamic asks a bootstrap method, once, what the call should do.
---

## The problem

Puzzle 6 showed that an instruction names a method through the constant pool, by class, name and descriptor. But a name isn't always enough. A variable of type Counter can hold a subclass that overrides next(). A List can be an ArrayList or something else. A lambda has no method name at all. So how does the call instruction say which code to run?

## See it

```diagram invoke-kinds
```

## The building block

Here is a Java program with one call of each kind, and the bytecode javac 21 produced for its main method (the lambda line comes back in puzzle 9):

```java
import java.util.ArrayList;
import java.util.List;
import java.util.function.IntSupplier;

public class Calls {
    static class Counter {
        int value;
        Counter(int value) { this.value = value; }
        int next() { return value + 1; }
    }

    static int increment(int value) { return value + 1; }

    public static void main(String[] args) {
        int a = increment(7);                 // no object
        Counter c = new Counter(7);           // a constructor
        int b = c.next();                     // through a class type
        List<Counter> all = new ArrayList<>();
        all.add(c);                           // through an interface type
        ArrayList<Counter> al = new ArrayList<>();
        al.add(c);                            // the same add, through a class type
        IntSupplier s = () -> c.value;        // a lambda
        System.out.println(a + b + s.getAsInt() + all.size() + al.size());
    }
}
```

```text
 0: bipush        7
 2: invokestatic  #7       // Method increment:(I)I
 5: istore_1
 6: new           #13      // class Calls$Counter
 9: dup
10: bipush        7
12: invokespecial #15      // Method Calls$Counter."<init>":(I)V
15: astore_2
16: aload_2
17: invokevirtual #18      // Method Calls$Counter.next:()I
20: istore_3
...
30: aload         4
32: aload_2
33: invokeinterface #25,  2  // InterfaceMethod java/util/List.add:(Ljava/lang/Object;)Z
38: pop
...
48: aload         5
50: aload_2
51: invokevirtual #31      // Method java/util/ArrayList.add:(Ljava/lang/Object;)Z
54: pop
55: aload_2
56: invokedynamic #32,  0  // InvokeDynamic #0:getAsInt:(LCalls$Counter;)Ljava/util/function/IntSupplier;
```

Every call works the same way on the stack: push the inputs, run the invoke, find the result (if any) on top. `invokestatic` #7 takes the 7 that `bipush` pushed and leaves increment's result, which `istore_1` saves. The constant pool comment tells you the method and its descriptor: (I)I is one int in, one int out.

A call on an object needs the object too. The object a method is called on is its **receiver**, and its reference is pushed first, below the arguments. `aload_2` pushes c (a for reference, the type letter from puzzle 5), then `invokevirtual` calls next() on it. Inside the called method the receiver arrives in local slot 0: that's why the compiled next() starts with `aload_0`, then `getfield`, which reads a field of the object whose reference is on top:

```text
int next();
  Code:
     0: aload_0
     1: getfield      #7       // Field value:I
     4: iconst_1
     5: iadd
     6: ireturn
```

The compiler picks the instruction by asking the questions in the diagram:

| Instruction | When the compiler uses it | Which code runs |
| --- | --- | --- |
| `invokestatic` | a static method: no receiver | exactly the named method |
| `invokespecial` | a constructor, a super call, and (in Kotlin) a private method | exactly the named method |
| `invokevirtual` | a call through a class type | the version in the receiver's class |
| `invokeinterface` | a call through an interface type | the version in the receiver's class |
| `invokedynamic` | a lambda, and some other language features | whatever its bootstrap method decides |

A constructor is the clearest `invokespecial`. Creating an object takes three instructions: new makes an empty Counter and pushes its reference, dup copies that reference, and `invokespecial` runs the constructor, which the class file calls `<init>`, on one copy. The other copy stays on the stack and `astore_2` saves it as c. A constructor must run exactly the one written for that class, never a subclass's, so it isn't looked up through the receiver. super.next() inside a subclass compiles to `invokespecial` too, so it runs the parent's next() even though the object's own class overrides it.

`invokevirtual` and `invokeinterface` both look at the receiver while the program runs. Here c holds a plain Counter, so Counter.next() runs; if c held a subclass that overrides next(), the same instruction would run the subclass's version. The difference between the two is the declared type you call through, not where the method was written: all is declared as List, an interface, so the call is `invokeinterface` even though the object is an ArrayList. Declare it as ArrayList<Counter> and the same add compiles to `invokevirtual` java/util/ArrayList.add, as al.add(c) does at offset 51. The 2 after #25 counts the stack slots of the arguments, receiver included (a long or double counts as 2), and pop throws away add's true or false result, which main never uses.

`invokedynamic` is the odd one. Its constant pool entry names a **bootstrap method**: a method the JVM runs the first time this particular instruction executes, to decide what it will do from then on. For a lambda, that decision is "build an object that runs the lambda's code". Puzzle 9 follows it.

### The edges

- *Private methods differ by compiler.* kotlinc 2.2.21 compiles a call to a private fun with `invokespecial`. javac 21 compiles the same call in Java with `invokevirtual`, a change made in JDK 11 so that nested classes can call each other's private methods. The result is the same: for a private method the JVM runs that exact method.
- *Interface methods have their own cases.* A Java interface can hold private methods, and a call to one from the interface's own code compiles to `invokeinterface` (JEP 181 lists "invokeinterface for private interface, nestmate instance methods"). A default method is a method with a body written inside an interface. Greet.super.hi(), which calls Greet's default hi() from a class that overrides it, compiles to `invokespecial` with an InterfaceMethod reference. And kotlinc 2.2 compiles a method body written in a Kotlin interface to such a default method, and also emits a class Greet$DefaultImpls that forwards to it, for older callers.
- *javap hides private members* unless you ask: add -p to see private helpers, such as the method that holds a lambda's code (puzzle 9).
- *A Kotlin property read is a call.* c.value in Java was a `getfield`; in Kotlin, reading a property of another class compiles to a call of a method kotlinc generated, with `invokevirtual`. Puzzle 8 shows it.

## The analogy

Five kinds of order slip. "Ask clerk Nowak in room 4": always that clerk (static). "Ask exactly the clerk named on the slip, even if this file's department has its own": special. "Ask whoever handles this file's type": the file decides who answers (virtual). "Ask whoever offers the passport service for this file": the file decides, but the service is listed by what it offers, not by department (interface). And a blank slip with "first time, ask the coordinator what to write here": dynamic.

## Run it yourself

Save the program above as Calls.java, then:

```sh
javac -d out Calls.java
javap -classpath out -c Calls
javap -classpath out -c -p 'Calls$Counter'
```

Before running, mark each call in main with the instruction you expect.

## Check yourself

- Counter.next() is overridable, and a subclass Loud overrides it. A method takes a parameter c: Counter and calls c.next(). You pass it a Loud. Which instruction is in the method's bytecode, and which next() runs?::*`invokevirtual` Counter.next, and Loud's next() runs||`invokevirtual` Loud.next, because a Loud was passed >> The compiler only knows the declared type, Counter; the object is known only while the program runs. >> s4||`invokespecial` Counter.next, so Counter's next() runs >> invokespecial is for calls that must run one exact method; an overridable call isn't one. >> s2::The declared type picks the instruction; the receiver's class picks the code.
- Inside Loud's next(), the code calls super.next(). Why can't that be an `invokevirtual`?::*`invokevirtual` would pick Loud's own next() again||`invokevirtual` can't call a method on this >> It can; it's how c.next() worked. The problem is which version it would choose. >> s2||Super calls have no receiver >> They do: the same object, this, is the receiver. >> s2::A super call must run exactly the parent's method, so it's `invokespecial`.
- javap shows `invokeinterface` for a call, and the variable's declared type is a class. What does that tell you?::*It can't: through a class type it would be `invokevirtual`||The object happens to be an ArrayList this time >> The compiler chooses from declared types, not from what the object will be. >> the-building-block||The method is private >> Private methods use `invokespecial` or `invokevirtual`, never `invokeinterface` for a class. >> the-building-block::`invokeinterface` means the call went through an expression whose declared type is an interface.

## Sources

- [JVM specification, 2.11.8 Method Invocation and Return Instructions](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-2.html#jvms-2.11.8) ("invokevirtual invokes an instance method of an object, dispatching on the (virtual) type of the object."; "invokeinterface invokes an interface method, searching the methods implemented by the particular run-time object to find the appropriate method."; "invokespecial invokes an instance method requiring special handling, either an instance initialization method (§2.9.1) or a method of the current class or its supertypes."; "invokestatic invokes a class (static) method in a named class."; "The call site object was bound to a specific lexical occurrence of the invokedynamic instruction by the Java Virtual Machine as a result of running a bootstrap method before the first execution of the instruction.")
- [JVM specification, 6.5 invokevirtual](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-6.html#jvms-6.5.invokevirtual) ("Let C be the class of objectref. A method is selected with respect to C and the resolved method (§5.4.6)."; "The objectref and the argument values are consecutively made the values of local variables of the new frame")
- [JVM specification, 5.4.6 Method Selection](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-5.html#jvms-5.4.6) ("If mR is marked ACC_PRIVATE, then it is the selected method.")
- [JEP 181: Nest-Based Access Control](https://openjdk.org/jeps/181) ("invokevirtual for private non-interface, nestmate instance methods"; "invokeinterface for private interface, nestmate instance methods")
- [The javap command (JDK 21)](https://docs.oracle.com/en/java/javase/21/docs/specs/man/javap.html) ("-private or -p Shows all classes and members.")
- The listings were produced in this session with javac/javap from OpenJDK 21.0.12 and kotlinc 2.2.21, including the edges: a Java interface Greet with a default hi() calling a private name() (`invokeinterface` InterfaceMethod name), a class Impl whose hi() calls Greet.super.hi() (`invokespecial` InterfaceMethod Greet.hi), the same default method called through a Plain-typed variable (`invokevirtual` Plain.hi), a Kotlin interface with a method body (a default method plus Greet$DefaultImpls), and a call put(1L, 2) on a Kotlin interface (`invokeinterface` with count 4).
