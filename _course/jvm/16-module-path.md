---
title: Can the JVM check before main runs?
short: The module path checks first
summary: Puzzle 15's missing class was found only at its first use, an hour into the run. Put the same App and Helper into Java modules and see the JVM refuse to start instead.
takeaway: A Java module is a named set of packages whose module-info file says which other modules it requires. On the module path, the JVM resolves every requires line before main runs, so a missing module stops the program at startup instead of failing at first use.
---

## The problem

In puzzle 15, App printed start and then died at the first call to Helper, because the class path is only a list of places to search. Nothing on it says which classes the program will need. Could the program declare what it depends on, so that the JVM can check before running a single line?

## See it

```diagram module-check
```

## The building block

Since JDK 9, Java code can be grouped into **modules**. A module is a named set of packages with a small file, module-info.java, at its top that says which other modules it **requires** and which of its own packages it exports to others. Here are App and Helper again, now in two modules, app and bonus:

```text
src/
  app/
    module-info.java
    dev/pachulski/app/App.java
  bonus/
    module-info.java
    dev/pachulski/bonus/Helper.java
```

```java
// src/app/module-info.java
module app {
    requires bonus;
}

// src/bonus/module-info.java
module bonus {
    exports dev.pachulski.bonus;
}
```

```java
// src/app/dev/pachulski/app/App.java
package dev.pachulski.app;

import dev.pachulski.bonus.Helper;

public class App {
    public static void main(String[] args) {
        System.out.println("start");
        System.out.println(Helper.bonus());
    }
}

// src/bonus/dev/pachulski/bonus/Helper.java
package dev.pachulski.bonus;

public class Helper {
    public static int bonus() { return 3; }
}
```

Modules are loaded from the **module path**, given with -p (or --module-path), instead of the class path. -m names the module and the class whose main should run. With both modules present, it prints start and 3. Now remove the compiled bonus module and run it again:

```text
$ java -p mods -m app/dev.pachulski.app.App
Error occurred during initialization of boot layer
java.lang.module.FindException: Module bonus not found, required by app
```

start is not printed. Before running main, the JVM reads the requires lines, starting from the module you named and following each required module's own requires lines, and checks that every required module is there, the way the module system's design calls "resolving". A missing piece is found at startup, not an hour later at its first use. That is the module system's stated goal of "reliable configuration": the class path just lists places to search, so, in the design document's words, it's "impossible to tell, in advance, when an artifact is missing".

| | class path (puzzle 15) | module path |
| --- | --- | --- |
| What the JVM knows at startup | a list of folders and jars | each module and what it requires |
| A missing piece is found | at the first use of a class from it | before main runs |
| What you see | `NoClassDefFoundError` | `FindException`: Module bonus not found |

The check covers modules, not every class. If bonus also held a second class, Rate, that Helper.bonus() calls, and only Rate.class were deleted, the module would still be found: the run prints start and then fails at the call with `NoClassDefFoundError`: dev/pachulski/bonus/Rate, exactly as on the class path. (Delete Helper.class instead, the only class of the package bonus exports, and the module itself is broken: the JVM stops at startup with FindException: Error reading module.)

### The edges

- *The same classes can still run from the class path.* java -cp mods/app:mods/bonus dev.pachulski.app.App runs the same compiled code with no module check at all: it prints start and 3, and with bonus missing it would fail at first use, as in puzzle 15. Classes on the class path belong to what the module system calls the unnamed module.
- *Most apps you meet still use the class path.* Anything started with -cp does.
- *Exports matter at compile time too.* Only packages a module exports can be used by modules that require it; javac refuses code that reaches into a package that isn't exported.

## The analogy

Puzzle 15's kitchen opens and finds out a dish's ingredient is missing only when someone orders it. A module-path kitchen has every recipe card list its ingredients, and the manager checks the whole list before unlocking the door: if one is missing, the kitchen doesn't open at all, and the sign says which ingredient and which recipe needed it.

## Run it yourself

Create the four files above in that layout, then:

```sh
javac -d mods --module-source-path src -m app,bonus
java -p mods -m app/dev.pachulski.app.App
mv mods/bonus bonus-away
java -p mods -m app/dev.pachulski.app.App
```

Before the last command, predict whether start is printed.

## Check yourself

- The module app requires bonus, and bonus requires a third module, json, which is missing. App's main doesn't touch json at all. Does start print?::*No: the JVM follows requires lines from app to bonus to json before main runs||Yes, because app itself doesn't require json >> Resolving follows each required module's own requires lines too. >> s4||Yes, and it fails when bonus first uses json >> That is the class path's behavior; the module path checks first. >> the-building-block::Startup resolution covers every module reachable through requires.
- Why can the module path fail before main, while the class path can't?::*Each module's requires lines say what it needs, so the JVM can check them first||The module path is searched faster than the class path >> Speed isn't the difference; the class path doesn't say what the program needs. >> s2||The JVM loads every class of every module at startup >> Only the modules are checked; classes still load when first needed. >> s4::A declared dependency can be checked; a search list can't.
- A service starts with java -cp app.jar:json.jar, and json.jar is missing on one server. When does it fail?::*When code first uses a class from json.jar||Before main runs, like a missing module >> -cp is the class path, which checks nothing at startup. >> the-building-block||Never: the JVM substitutes another version >> Nothing substitutes a missing class; its first use fails. >> s5::Only the module path checks at startup.

## Sources

- [The State of the Module System](https://openjdk.org/projects/jigsaw/spec/sotms/) ("the specific goals of the module system are to provide Reliable configuration , to replace the brittle, error-prone class-path mechanism with a means for program components to declare explicit dependences upon one another"; "This makes it impossible to tell, in advance, when an artifact is missing."; "If a request is made to load a type whose package is not defined in any known module then the module system will attempt to load it from the class path. If this succeeds then the type is considered to be a member of a special module known as the unnamed module")
- [JEP 261: Module System](https://openjdk.org/jeps/261) ("The module system constructs a module graph by resolving the transitive closure of the dependences of a set of root modules with respect to the set of observable modules."; release: 9)
- [The java command (JDK 21)](https://docs.oracle.com/en/java/javase/21/docs/specs/man/java.html) ("--module-path modulepath ... or -p modulepath Specifies where to find application modules with a list of path elements."; "To launch the main class in a module: java [ options ] -m module [ / mainclass ] [ args ...]")
- The module runs (start and 3; FindException with bonus removed; start and 3 from the class path) were produced in this session with OpenJDK 21.0.12.
