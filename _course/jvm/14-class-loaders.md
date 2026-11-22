---
title: Why can't Greeter be cast to Greeter?
short: Class loaders and delegation
summary: Puzzle 11 said loading finds a class's bytes and creates the class. Meet the objects that do the finding, the order they ask each other in, and why the same class file loaded twice gives two different classes.
takeaway: A class loader finds class files and creates classes, but asks its parent first, up to the bootstrap loader, and defines a class itself only if no parent has it. While the program runs, a class is its name plus its defining loader, so two loaders that each define Greeter from the same file create two classes that can't be cast to each other.
---

## The problem

Puzzle 13's errors came from one class's own code. This one comes from two copies of a class. Here is an error message that looks impossible:

```text
Exception in thread "main" java.lang.ClassCastException: class Greeter cannot be cast to class Greeter (Greeter is in unnamed module of loader 'one' @70dea4e; Greeter is in unnamed module of loader 'app')
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
| platform | a selected set of Java SE and JDK modules, such as java.sql (most of the JDK, java.logging included, is still bootstrap) | PlatformClassLoader |
| application (also called system) | your classes, from the class path given with -cp | AppClassLoader |

Every loader except bootstrap has a parent, and the rule they follow is **parent delegation**: when asked for a class, a loader first asks its parent, which asks its parent, up to bootstrap. Only if no parent has the class does the loader look in its own places. That's why your own class called String can never replace the real one: the request reaches bootstrap first, and bootstrap answers with its own.

Since JDK 9 there is one shortcut. The JDK itself is split into modules (puzzle 16 shows what a module is; for now, a named group of packages), and each JDK module belongs to one of the three loaders. When the application loader is asked for a class in a package that belongs to one of those modules, it hands the request straight to that module's loader instead of walking up the chain. Strict parent-first delegation, as drawn here, is what happens for everything else: in particular, for the classes on your class path. (The platform loader replaced JDK 8's "extension" loader, which old articles mention.)

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

The last two lines create an object from a class you hold only as a Class value: getDeclaredConstructor() finds Greeter's constructor that takes no arguments, and newInstance() runs it, like new Greeter() would. b.cast(greeter) is a cast written as a method call: it checks that greeter is an instance of b's class.

```text
Greeter == Greeter ? false
Exception in thread "main" java.lang.ClassCastException: Cannot cast Greeter to Greeter
```

"Cannot cast Greeter to Greeter" is the wording of the cast method. A cast written in code, (Greeter) obj, compiles to an instruction called `checkcast`, and the JVM's message for it is the longer one at the top of this page, which also names both defining loaders. That message came from a second program in which loader one's parent is the platform loader, so one defines its own Greeter while the code doing the cast got Greeter from app.

Follow the diagram. one asks app, app asks platform, platform asks bootstrap. None of them has Greeter (plugin-out isn't on the class path), so one defines it. two does exactly the same and defines its own. Two pairs, (Greeter, one) and (Greeter, two): two classes. An object created from one's Greeter is not an instance of two's.

Run the same program with plugin-out added to the class path (-cp app-out:plugin-out) and it prints Greeter == Greeter ? true, and the cast works. The delegation reached app, which now finds Greeter itself, so both one and two get app's single class. Delegation is what makes classes shared; skipping it is what makes them separate.

### The edges

- *Why use separate loaders at all?* To keep plugins apart (two plugins can each bring a different version of a library), and so that a plugin's classes can be thrown away when it's unloaded (puzzle 17).
- *The fix for the plugin case* is to load the shared part, an interface the host and the plugins both use, through a common parent loader, and keep only the plugins' own classes in their loaders. Then the host casts to the interface, which both sides got from the same loader.
- *A different error, same cause.* If two loaders disagree about which class a name means in a method's descriptor (puzzle 6), the JVM throws a LinkageError whose message starts "loader constraint violation: when resolving". Read it as "two classes with one name".
- *"Usually" delegate.* The ClassLoader documentation says a loader will "usually" ask its parent first. Some app servers deliberately look in their own folder first for application classes; when classes behave strangely there, check that setting.

## The analogy

A clerk in a branch office is asked for the "Greeter form". The rule: ask the regional office first, which asks head office. Only if nobody above has it does the clerk print one from the branch's own template. Two branches that both print their own copy from the same template produce two forms that look identical but carry different office stamps. Head office checks the stamp, not the title, and rejects one branch's form at the other's desk.

## Run it yourself

Make two folders, plugin and app. plugin/Greeter.java holds the plugin's class:

```java
public class Greeter {
    public String hello() { return "hello"; }
}
```

app/Loaders.java holds the program: the printing lines from the first listing, then the loader lines from the second, inside one main method, with these imports at the top: java.net.URL, java.net.URLClassLoader and java.nio.file.Path. Then, from the folder that holds plugin and app:

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
- A host creates loader one with app as its parent, but Greeter is in plugin-out only. Then it creates loader three with one as its parent, and asks three for Greeter. How many Greeter classes exist?::*One: three asks one first, and one has already defined it||Two: three defines its own, like two did >> two's parent was app, which lacked Greeter; three's parent is one, which has it. >> s5||None: three can't see plugin-out >> Delegation reaches one, which reads plugin-out. >> s4::Delegation shares a class whenever a parent has it.

## Sources

- [JVM specification, 5.3 Creation and Loading](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-5.html#jvms-5.3) ("After creation, a class or interface is determined not by its name alone, but by a pair: its binary name (§4.2.1) and its defining loader."; "Alternatively, L may load C indirectly, by delegating to another class loader which loads C directly or indirectly. If L loads C directly, we say that L defines C or, equivalently, that L is the defining loader of C."; "There are two kinds of class loaders: the bootstrap class loader supplied by the Java Virtual Machine, and user-defined class loaders.")
- [Java 21 API: ClassLoader](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/ClassLoader.html) ("Each instance of ClassLoader has an associated parent class loader. When requested to find a class or resource, a ClassLoader instance will usually delegate the search for the class or resource to its parent class loader before attempting to find the class or resource itself."; "Bootstrap class loader. It is the virtual machine's built-in class loader, typically represented as null , and does not have a parent."; "System class loader . It is also known as application class loader and is distinct from the platform class loader. The system class loader is typically used to define classes on the application class path")
- [JVM specification, 5.3.4 Loading Constraints](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-5.html#jvms-5.3.4) ("the Java Virtual Machine must immediately check to see if any loading constraints are violated. If so, the record is retracted, the Java Virtual Machine throws a LinkageError"); [OpenJDK source, linkResolver.cpp line 672, jdk-21+35](https://github.com/openjdk/jdk/blob/jdk-21%2B35/src/hotspot/share/interpreter/linkResolver.cpp#L672) ("loader constraint violation: when resolving %s '")
- [JEP 261: Module System](https://openjdk.org/jeps/261) ("We have de-privileged modules that do not require all permissions by defining them to the platform loader rather than the bootstrap class loader"; "The application class loader first searches the named modules defined to all of the built-in loaders. If a suitable module is defined to one of these loaders then that loader will load the class. If a class is not found in a named module defined to one of these loaders then the application class loader delegates to its parent. If a class is not found by its parent then the application class loader searches the class path."; "The extension class loader is no longer an instance of URLClassLoader but, rather, of an internal class."; "In its new role this loader is known as the platform class loader"; its lists put java.sql under the platform class loader and java.logging under "All other Java SE and JDK modules are defined to the bootstrap class loader")
- [JVM specification, 6.5 checkcast](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-6.html#jvms-6.5.checkcast) ("Check whether object is of given type")
- The two runs (false and the ClassCastException without plugin-out on the class path; true with it) and the checkcast message (a second program, Cast, compiled against Greeter, run with -cp app-out:plugin-out, its loader one created with the platform loader as parent) were produced in this session with OpenJDK 21.0.12.
