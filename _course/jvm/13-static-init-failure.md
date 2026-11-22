---
title: Why does the second try say something different?
short: When static code throws
summary: Puzzle 12 ran a class's static code top to bottom. Now one line of that code throws. Follow two attempts to use the class and see why the second error hides the first one's cause.
takeaway: If a class's static initializer throws, the first use gets ExceptionInInitializerError wrapping the real cause, and the JVM marks the class as failed for good. Every later use gets NoClassDefFoundError "Could not initialize class", so the real bug is in the first error, often far back in the log.
---

## The problem

Puzzle 12's static code read a field too early and quietly got 0. Static code can also fail loudly: a line in it can throw. The class is half set up, and the program may catch the error and carry on. What happens the next time something uses that class?

```java
public class Broken {
    static class Prices {
        static int base = Integer.parseInt("seven");
    }

    public static void main(String[] args) {
        for (int attempt = 1; attempt <= 2; attempt++) {
            try {
                System.out.println(Prices.base);
            } catch (Throwable t) {
                System.out.println(attempt + ": " + t + " / cause: " + t.getCause());
            }
        }
    }
}
```

Prices' static initializer tries to turn the text "seven" into a number. main reads Prices.base twice and prints whatever is thrown each time, with its cause.

## See it

```diagram init-failure
```

## The building block

First, the two kinds of thing Java can throw. Java's throwables come in two families: **Exception**, for conditions the caller is expected to handle (Java makes callers catch or declare some of them; Kotlin doesn't), and **Error**, for a broken JVM or deployment that ordinary code shouldn't catch. `NumberFormatException`, which Integer.parseInt throws for "seven", is an Exception. `ExceptionInInitializerError` and `NoClassDefFoundError` are Errors. main catches Throwable, the parent of both families, only so that this experiment can print them.

The run prints:

```text
1: java.lang.ExceptionInInitializerError / cause: java.lang.NumberFormatException: For input string: "seven"
2: java.lang.NoClassDefFoundError: Could not initialize class Broken$Prices / cause: java.lang.ExceptionInInitializerError: Exception java.lang.NumberFormatException: For input string: "seven" [in thread "main"]
```

**Attempt 1.** Prices.base is the first use, so the JVM initializes Prices (puzzle 11): it runs `<clinit>`. parseInt throws `NumberFormatException`. The JVM doesn't pass that exception on as it is: it wraps it in an `ExceptionInInitializerError`, whose cause is the real problem. Before throwing, it records that Prices is **erroneous**: its initialization failed.

**Attempt 2.** Prices.base again. The JVM looks at Prices, sees the erroneous mark, and doesn't run the static code a second time. It throws `NoClassDefFoundError` with "Could not initialize class Broken$Prices". Its cause (on JDK 21) is a copy of the first error, but many logs and crash reports show only the top line.

| Use of Prices | What the JVM does | What is thrown |
| --- | --- | --- |
| first | runs the static code, which throws | `ExceptionInInitializerError`, cause `NumberFormatException` |
| second and every later one | sees "erroneous", runs nothing | `NoClassDefFoundError`: Could not initialize class |

The mark is permanent for that class in that run: there is no retry. So a program that catches the first error and carries on fails at every later use of Prices, maybe hours later and in other code. In a crash report the second error is the one you usually see. Always scroll back to the first `ExceptionInInitializerError`; its cause is the real bug.

### The edges

- *An Error thrown by static code isn't wrapped.* The JVM wraps only exceptions; if the static code throws an Error, such as `OutOfMemoryError`, that Error is thrown as it is, and the class is still marked erroneous.
- *"Could not initialize class" is not "class missing".* `NoClassDefFoundError` also means a class file can't be found (puzzle 15 shows that case). The words "Could not initialize" tell you the class was found and its static code failed.
- *A Kotlin object or companion* runs its code in a static initializer too, so a throwing line in an object's body gives exactly these two errors.

## The analogy

A new office works through its opening checklist. Line 1 says "post the prices from the sheet", but the sheet says "seven" in words and the clerk can't post it. The office manager writes "closed, could not open" on the door and tells the first visitor why. Every visitor after that reads only the sign on the door: "could not open". To learn why, you have to ask the first visitor.

## Run it yourself

Save the program above as Broken.java, then:

```sh
javac -d out Broken.java
java -cp out Broken
```

Before running, write down the class name of what you expect each attempt to print. Then change "seven" to "7", predict again, and run.

## Check yourself

- Prices' static code is fixed, but a class Rates has static int r = 1 / 0, which throws ArithmeticException. main reads Rates.r three times, catching each time. What does the third attempt get?::*`NoClassDefFoundError`: Could not initialize class Rates||`ExceptionInInitializerError` again, with the same cause >> Only the first attempt runs the static code; after that Rates is marked erroneous. >> s4||The value 0, because the field was prepared with a default >> A class marked erroneous can't be used at all, so the field is never read. >> s5::Every use after the first failure gets NoClassDefFoundError.
- Why doesn't the second attempt show `NumberFormatException` as the error itself?::*The JVM doesn't run the static code again; it only reports the class as failed||The static code ran again and threw something else >> Nothing runs: the erroneous mark is checked first. >> s5||The first catch fixed the `NumberFormatException` >> Catching an error doesn't change the class's state. >> s3::The erroneous mark replaces a second run.
- A crash report shows only NoClassDefFoundError: Could not initialize class Prices. Where is the real cause?::*In an earlier `ExceptionInInitializerError`||In a Prices class file that went missing >> "Could not initialize" means the class was found but its static code failed before. >> the-building-block||In the line of code that threw this error >> That line only touched a class already marked failed. >> s5::Find the first failure and its cause.

## Sources

- [JVM specification, 5.5 Initialization](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-5.html#jvms-5.5) ("If the Class object for C is in an erroneous state, then initialization is not possible. Release LC and throw a NoClassDefFoundError ."; "the class or interface initialization method must have completed abruptly by throwing some exception E . If the class of E is not Error or one of its subclasses, then create a new instance of the class ExceptionInInitializerError with E as the argument, and use this object in place of E in the following step."; "Acquire LC , label the Class object for C as erroneous")
- [Java 21 API: ExceptionInInitializerError](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/ExceptionInInitializerError.html) ("Signals that an unexpected exception has occurred in a static initializer.")
- [Java 21 API: Exception](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Exception.html) ("The class Exception and its subclasses are a form of Throwable that indicates conditions that a reasonable application might want to catch."; "Checked exceptions need to be declared in a method or constructor's throws clause")
- [Java 21 API: Error](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Error.html) ("An Error is a subclass of Throwable that indicates serious problems that a reasonable application should not try to catch.")
- [Kotlin docs: Exceptions](https://kotlinlang.org/docs/exceptions.html) ("Kotlin treats all exceptions as unchecked by default.")
- The two printed lines were produced in this session with javac and java from OpenJDK 21.0.12.
