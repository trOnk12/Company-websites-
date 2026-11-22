---
title: Why can't Greeter be cast to Greeter?
short: Class loaders and delegation
summary: Puzzle 11 said loading finds a class's bytes and creates the class. Meet the objects that do the finding, the order they ask each other in, and why the same class file loaded twice gives two different classes.
takeaway: A class loader finds class files and creates classes, but asks its parent first, up to the bootstrap loader, and defines a class itself only if no parent has it. While the program runs, a class is its name plus its defining loader, so two loaders that each define Greeter from the same file create two classes that can't be cast to each other.
---

## The problem

Here is an error message that looks impossible:

```text
Exception in thread "main" java.lang.ClassCastException: Cannot cast Greeter to Greeter
```

The same name on both sides, compiled from one source file into one class file. It happens in programs that load plugins or run several applications side by side, such as app servers. Puzzle 11 said loading means "finding a class's bytes and creating the class". Who does the finding, and how can it create the same class twice?

## See it

```diagram loader-delegation
```

## The building block

A **class loader** is an object, an instance of the JDK class `ClassLoader`, that finds the bytes of a class by name and asks the JVM to create the class from them. Every class remembers the loader that created it; getClassLoader() returns it. Here is a real run:

```java
System.out.println("String:  " + String.class.getClassLoader());
System.out.println("Driver:  " + java.sql.Driver.class.getClassLoader());
ClassLoader app = Loaders.class.getClassLoader();
System.out.println("Loaders: " + app);
System.out.println("parent:  " + app.getParent());
System.out.println("parent of parent: " + app.getParent().getParent());
```

```text
String:  null
Driver:  jdk.internal.loader.ClassLoaders$PlatformClassLoader@45ee12a7
Loaders: jdk.internal.loader.ClassLoaders$AppClassLoader@639fee48
parent:  jdk.internal.loader.ClassLoaders$PlatformClassLoader@45ee12a7
parent of parent: null
```

Three loaders come with the JDK, each the parent of the next:

| Loader | Loads | Shown as |
| --- | --- | --- |
| bootstrap | the core JDK classes, such as String | null: it's part of the JVM, not a Java object |
| platform | the rest of the Java platform, such as java.sql | PlatformClassLoader |
| application (also called system) | your classes, from the class path given with -cp | AppClassLoader |

Every loader except bootstrap has a parent, and the rule they follow is **parent delegation**: when asked for a class, a loader first asks its parent, which asks its parent, up to bootstrap. Only if no parent has the class does the loader look in its own places. That's why your own class called String can never replace the real one: the request reaches bootstrap first, and bootstrap answers with its own.

The loader that actually created a class is its **defining loader**, and the JVM tells classes apart by name and defining loader together. In the JVM specification's words, a class "is determined not by its name alone, but by a pair: its binary name (§4.2.1) and its defining loader."

Now the impossible error. An app creates two loaders, one and two, each reading from a folder plugin-out, each with app as its parent:

```java
URL[] where = { Path.of("plugin-out").toUri().toURL() };
ClassLoader one = new URLClassLoader("one", where, app);
ClassLoader two = new URLClassLoader("two", where, app);
Class<?> a = one.loadClass("Greeter");
Class<?> b = two.loadClass("Greeter");
System.out.println(a.getName() + " == " + b.getName() + " ? " + (a == b));
Object greeter = a.getDeclaredConstructor().newInstance();
b.cast(greeter);
```

```text
Greeter == Greeter ? false
Exception in thread "main" java.lang.ClassCastException: Cannot cast Greeter to Greeter
```

Follow the diagram. one asks app, app asks platform, platform asks bootstrap. None of them has Greeter (plugin-out isn't on the class path), so one defines it. two does exactly the same and defines its own. Two pairs, (Greeter, one) and (Greeter, two): two classes. An object created from one's Greeter is not an instance of two's.

Run the same program with plugin-out added to the class path (-cp app-out:plugin-out) and it prints Greeter == Greeter ? true, and the cast works. The delegation reached app, which now finds Greeter itself, so both one and two get app's single class. Delegation is what makes classes shared; skipping it is what makes them separate.

### The edges

- *Why use separate loaders at all?* To keep plugins apart (two plugins can each bring a different version of a library), and so that a plugin's classes can be thrown away when it's unloaded (puzzle 15).
- *The fix for the plugin case* is to load the shared part, an interface the host and the plugins both use, through a common parent loader, and keep only the plugins' own classes in their loaders. Then the host casts to the interface, which both sides got from the same loader.
- *A different error, same cause.* If two loaders disagree about which class a name means in a method's descriptor (puzzle 6), the JVM throws a LinkageError mentioning a "loader constraint violation". Read it as "two classes with one name".
- *"Usually" delegate.* The ClassLoader documentation says a loader will "usually" ask its parent first. Some app servers deliberately look in their own folder first for application classes; when classes behave strangely there, check that setting.

## The analogy

A clerk in a branch office is asked for the "Greeter form". The rule: ask the regional office first, which asks head office. Only if nobody above has it does the clerk print one from the branch's own template. Two branches that both print their own copy from the same template produce two forms that look identical but carry different office stamps. Head office checks the stamp, not the title, and rejects one branch's form at the other's desk.

## Run it yourself

```sh
javac -d plugin-out plugin/Greeter.java
javac -d app-out app/Loaders.java
java -cp app-out Loaders
java -cp app-out:plugin-out Loaders
```

Before the last command, predict the line with == and whether the cast fails.

## Check yourself

- You write your own class named java.lang.String and put it on the class path. Which String does your code get?::*The JDK's, because the request reaches bootstrap first||Yours, because the class path is searched first >> The application loader asks its parents before it looks at the class path. >> s2||Both, one per loader >> Only one loader ever gets to define it: bootstrap answers first. >> s3::Parent delegation protects the core classes.
- one and two both have app as parent, and Greeter is on the class path. What does a == b print?::*true: app defines Greeter once and both get it||false: each loader defines its own copy >> They ask app first, and app finds Greeter on the class path. >> the-building-block||It depends on which loader asks first >> Whichever asks first, app defines the class once and returns it to both. >> s2::Delegation shares a class.
- Two classes are both named Greeter, from the same class file. What makes them different classes?::*Their defining loaders differ||Their bytes differ >> They came from the same file. >> s6||They were created at different times >> Time doesn't matter; the pair of name and defining loader does. >> s4::Name plus defining loader identifies a class.

## Sources

- [JVM specification, 5.3 Creation and Loading](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-5.html#jvms-5.3) ("After creation, a class or interface is determined not by its name alone, but by a pair: its binary name (§4.2.1) and its defining loader."; "Alternatively, L may load C indirectly, by delegating to another class loader which loads C directly or indirectly. If L loads C directly, we say that L defines C or, equivalently, that L is the defining loader of C."; "There are two kinds of class loaders: the bootstrap class loader supplied by the Java Virtual Machine, and user-defined class loaders.")
- [Java 21 API: ClassLoader](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/ClassLoader.html) ("Each instance of ClassLoader has an associated parent class loader. When requested to find a class or resource, a ClassLoader instance will usually delegate the search for the class or resource to its parent class loader before attempting to find the class or resource itself."; "Bootstrap class loader. It is the virtual machine's built-in class loader, typically represented as null , and does not have a parent."; "System class loader . It is also known as application class loader and is distinct from the platform class loader. The system class loader is typically used to define classes on the application class path")
- [JVM specification, 5.3.4 Loading Constraints](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-5.html#jvms-5.3.4) ("the Java Virtual Machine must immediately check to see if any loading constraints are violated. If so, the record is retracted, the Java Virtual Machine throws a LinkageError"); [OpenJDK source, systemDictionary.cpp line 1663, jdk-21+35](https://github.com/openjdk/jdk/blob/jdk-21%2B35/src/hotspot/share/classfile/systemDictionary.cpp#L1663) ("loader constraint violation: loader %s")
- The two runs (false and the ClassCastException without plugin-out on the class path; true with it) were produced in this session with OpenJDK 21.0.12.
