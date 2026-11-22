---
title: Not found, or no longer there?
short: Two errors that both sound like "class missing"
summary: Puzzles 11 and 14 showed that a class is loaded at its first use, by a loader searching the class path. Run the same small app two ways with a class missing, and learn what each error says about who asked and why nothing was found.
takeaway: On the class path, a missing class is discovered only when code first needs it. ClassNotFoundException means code asked a loader for a name in a string and nothing was found; NoClassDefFoundError means the JVM, resolving compiled code, needed a class that can no longer be found (it wraps the loader's ClassNotFoundException) or couldn't be initialized.
---

## The problem

Puzzle 14 followed a request for a class up the chain of loaders. Sometimes nobody has the class. An app ran fine on your machine. On a server it starts, serves requests for an hour, then crashes with NoClassDefFoundError. Another time it's ClassNotFoundException. Both sound like "class missing". Are they the same problem? And why didn't the JVM refuse to start if a class was missing all along?

## See it

```diagram missing-class
```

## The building block

Both names in this puzzle are things Java throws, from the two families of puzzle 13: `ClassNotFoundException` is an Exception, which the caller is expected to handle; `NoClassDefFoundError` is an Error, a broken deployment that ordinary code shouldn't catch. That difference is the whole story.

Real class paths list **jars** more often than folders: a jar is one zip file holding a library's class files, and the class path may list jar files and folders side by side. Leaving a jar out of a deployment removes every class in it at once.

**Run 1: a class deleted from the class path.** App calls Helper.bonus(). Both were compiled together; then Helper.class was deleted, the way a jar can be left out of a deployment. The two files:

```java
public class Helper {
    static int bonus() { return 3; }
}
```

```java
public class App {
    public static void main(String[] args) throws Exception {
        System.out.println("start");
        if (args.length > 0) {
            Class<?> k = Class.forName(args[0]);
            System.out.println("found " + k.getName());
            return;
        }
        System.out.println(Helper.bonus());
    }
}
```

```text
$ java -cp out App
start
Exception in thread "main" java.lang.NoClassDefFoundError: Helper
	at App.main(App.java:9)
Caused by: java.lang.ClassNotFoundException: Helper
	at java.base/jdk.internal.loader.BuiltinClassLoader.loadClass(BuiltinClassLoader.java:641)
	at java.base/jdk.internal.loader.ClassLoaders$AppClassLoader.loadClass(ClassLoaders.java:188)
	at java.base/java.lang.ClassLoader.loadClass(ClassLoader.java:526)
	... 1 more
```

start is printed: nothing needed Helper until line 9 (puzzle 11). There, the `invokestatic` for Helper.bonus must resolve the class, the application loader searches the class path, and finds nothing. The loader reports `ClassNotFoundException`; the JVM wraps it in `NoClassDefFoundError`, because compiled code depended on that class. Its documentation describes exactly this: the class "existed when the currently executing class was compiled, but the definition can no longer be found".

**Run 2: a name in a string.** Some code chooses classes at run time by name: plugin systems, serialization libraries, database drivers, dependency-injection libraries. They call Class.forName or a loader's loadClass with a string:

```text
$ java -cp out App Missing
start
Exception in thread "main" java.lang.ClassNotFoundException: Missing
	at java.base/jdk.internal.loader.BuiltinClassLoader.loadClass(BuiltinClassLoader.java:641)
	...
	at java.base/java.lang.Class.forName(Class.java:414)
	at App.main(App.java:5)
```

No `NoClassDefFoundError` this time. `ClassNotFoundException` is an Exception that methods like Class.forName declare, so the code that passed the name is expected to catch it and decide (try another driver, report a bad configuration). It says: "you asked for this name, and no loader had it".

| | `ClassNotFoundException` | `NoClassDefFoundError` |
| --- | --- | --- |
| Who asked | code, with a name in a string | the JVM, resolving a reference in compiled bytecode |
| What it means | that name was never found | the class was there at compile time and isn't usable now |
| Typical cause | wrong name, a driver or plugin not shipped | a jar left out at run time, or a failed static initializer (puzzle 13) |
| Who should handle it | the caller, which expected it might fail | usually nobody: fix the build or deployment |

A `NoClassDefFoundError` with "Could not initialize class" is the other case, from puzzle 13: the class was found, but its static initializer failed earlier. Read the message before reading the class path.

### The edges

- *Many apps use the class path.* Anything started with -cp does, so the first-use behavior of run 1 is what you'll meet most often. Puzzle 16 shows the alternative that checks before main runs.
- *The first matching class wins.* The class path is searched in order. Two jars containing different versions of the same class don't cause an error: the first one listed is used, and a method that exists only in the other version fails later with a different error, NoSuchMethodError. In a run with two folders holding Helper, version 1 listed first, Helper.bonus() returned version 1's answer and the call to a method only version 2 has failed with NoSuchMethodError: 'int Helper.extra()'. When a library behaves like an older version than you expected, list the class path and look for duplicates.
- *Fix the cause, not the catch.* Catching `NoClassDefFoundError` hides a broken deployment. Catch `ClassNotFoundException` only where a name might legitimately be absent.

## The analogy

Run 1 is a recipe book printed with "see page 40" on page 12, but page 40 was torn out. You only notice when you reach page 12, and the problem is the book, not you. Run 2 is a customer asking the clerk for a dish by name: the clerk says "we don't have that", and the customer is expected to pick something else.

## Run it yourself

Save App and Helper above as App.java and Helper.java in one folder, then:

```sh
javac -d out App.java Helper.java
java -cp out App
rm out/Helper.class
java -cp out App
java -cp out App Missing
java -cp out App java.lang.String
```

Before each java command, predict whether start is printed, and which error (if any) follows it.

## Check yourself

- A server crashes with NoClassDefFoundError: com/example/Json, caused by ClassNotFoundException. The code calls Json.parse directly. What's the most likely cause?::*The jar containing Json is missing from the server's class path||Someone passed a wrong class name to Class.forName >> A direct call compiles to bytecode referring to Json; no string name is involved. >> the-building-block||Json's static initializer failed earlier >> That message says "Could not initialize class" instead of being caused by ClassNotFoundException. >> the-building-block::Compiled code depended on a class that isn't deployed.
- Your code calls Helper.bonus() directly. Helper.class is on the class path, but Rate, a class that bonus() calls, was deleted. What is thrown when bonus() runs?::*`NoClassDefFoundError` for Rate, caused by `ClassNotFoundException`||`ClassNotFoundException` for Rate, thrown to your code >> No code passed Rate's name as a string; the JVM needed Rate while resolving Helper's bytecode. >> s4||`NoClassDefFoundError` for Helper >> Helper was found and loaded; the class that is missing is Rate. >> s2::The JVM asked, so the loader's ClassNotFoundException arrives wrapped in NoClassDefFoundError.
- Your code loads a database driver with Class.forName(name). The driver isn't installed. What should the code expect?::*A ClassNotFoundException that it can catch and report||A NoClassDefFoundError that ends the program >> A name in a string gives ClassNotFoundException, which the caller is expected to handle. >> s3||A null result instead of a class >> Class.forName throws; it never returns null for a missing class. >> s3::Asking by name is expected to fail sometimes.

## Sources

- [Java 21 API: NoClassDefFoundError](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/NoClassDefFoundError.html) ("Thrown if the Java Virtual Machine or a ClassLoader instance tries to load in the definition of a class (as part of a normal method call or as part of creating a new instance using the new expression) and no definition of the class could be found. The searched-for class definition existed when the currently executing class was compiled, but the definition can no longer be found.")
- [Java 21 API: ClassNotFoundException](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/ClassNotFoundException.html) ("Thrown when an application tries to load in a class through its string name using: The forName method in class Class . The findSystemClass method in class ClassLoader . The loadClass method in class ClassLoader . but no definition for the class with the specified name could be found.")
- [The jar command (JDK 21)](https://docs.oracle.com/en/java/javase/21/docs/specs/man/jar.html) ("The jar command is a general-purpose archiving and compression tool, based on the ZIP and ZLIB compression formats.")
- [The java command (JDK 21)](https://docs.oracle.com/en/java/javase/21/docs/specs/man/java.html) ("-cp classpath Specifies a list of directories, JAR files, and ZIP archives to search for class files.")
- Both runs, the java.lang.String run, and the two-version class path run were produced in this session with OpenJDK 21.0.12.
