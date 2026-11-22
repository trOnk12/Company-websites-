---
title: Where do classes live, and how do they leak?
short: Metaspace and class-loader leaks
summary: Puzzle 14 created a new loader per plugin, and puzzle 3 showed that unreachable objects can be reclaimed. Put the two together and find out where a loaded class is stored, when it can be thrown away, and how one kept object stops that.
takeaway: Objects live on the heap; a loaded class's metadata lives in metaspace, memory outside the heap, owned by its defining loader. A class is unloaded only together with its loader, once nothing reaches either, so a single kept object from a plugin keeps its class, its loader and every class that loader defined, and repeated reloads fill metaspace until OutOfMemoryError: Metaspace.
---

## The problem

A server reloads its plugins whenever they change, each time with a new class loader, the way puzzle 14 did. Memory use climbs a little with every reload, and after a few days the server dies with an OutOfMemoryError whose message doesn't mention objects at all.

Puzzle 3 said the collector reclaims what can't be reached. Why isn't an old plugin, which nobody uses any more, reclaimed? And where do classes live?

## See it

```diagram metaspace
```

## The building block

The **heap** is the memory where objects live and where the garbage collector from puzzle 3 works. A plugin's loader is an object, and so is every Greeter it creates. But a loaded class is more than an object: HotSpot needs its methods, their bytecode, its constant pool and its method table (puzzles 5 to 10). Oracle's documentation calls this the class metadata, and HotSpot keeps it in **metaspace**, memory outside the heap that it requests from the operating system. Each class loader gets its own chunks of metaspace, and its classes' metadata goes in them. Before JDK 8, class metadata lived in a part of the heap called the permanent generation; that's why old advice mentions PermGen.

Metaspace has no limit by default. You can set one with the MaxMetaspaceSize option (see the commands below), which is what made this run fail quickly instead of after days.

When is a class thrown away? The Java language specification gives the rule: a class "may be unloaded if and only if its defining class loader may be reclaimed by the garbage collector". So **class unloading** happens per loader: when nothing reachable leads to the loader, or to any of its classes, or to any object of those classes, the collector can reclaim the loader object, and HotSpot frees all its classes' metadata at once. Classes defined by the bootstrap loader are never unloaded.

The trap is the chain of references. Every object knows its class (that's how `invokevirtual` found the method table in puzzle 10). Every class keeps a reference to the loader that defined it. So one object is enough:

| Kept by the app | Reaches | Can the plugin's classes be unloaded? |
| --- | --- | --- |
| nothing | nothing | yes, loader and classes together |
| one Greeter object | its class, then the loader | no: none of that loader's classes |
| the loader object | the loader | no |

This program loads Greeter with a new loader in a loop, with metaspace limited to 32 megabytes. With the argument keep, it adds each Greeter to a static list; without it, it drops each plugin at once:

```java
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

public class Leak {
    static final List<Object> kept = new ArrayList<>();

    public static void main(String[] args) throws Exception {
        boolean keep = args.length > 0 && args[0].equals("keep");
        URL[] where = { Path.of("plugin-out").toUri().toURL() };
        int i = 0;
        try {
            while (i < 200_000) {
                ClassLoader loader = new URLClassLoader(where, Leak.class.getClassLoader());
                Object greeter = loader.loadClass("Greeter").getDeclaredConstructor().newInstance();
                if (keep) kept.add(greeter);
                i++;
            }
            System.out.println(i + " plugins loaded and dropped");
        } catch (OutOfMemoryError e) {
            kept.clear();
            System.out.println("after " + i + " plugins: " + e);
        }
    }
}
```

Each loop creates a new loader and a Greeter from it, with getDeclaredConstructor().newInstance() as in puzzle 14. When metaspace runs out, the catch clears the list (so the program has memory to print) and prints how far it got.

```text
$ java -XX:MaxMetaspaceSize=32m -cp . Leak keep
after 5310 plugins: java.lang.OutOfMemoryError: Metaspace
$ java -XX:MaxMetaspaceSize=32m -cp . Leak
200000 plugins loaded and dropped
```

Same work, same limit. The second run loaded 200,000 copies of the class and finished, because the collector kept unloading old ones: with -Xlog:class+unload one run logged 195,033 lines like unloading class Greeter 0x00007f1b8a2c7800 (the count varies from run to run). In the first, the static list is reachable for the whole run, each Greeter reaches its class and its loader, and nothing could be unloaded.

In a real server the "list" is rarely that obvious. Typical holders are a static cache or registry in a class the host loaded (it outlives every plugin), a listener the plugin registered with the host and never removed, a value left in a ThreadLocal of a long-lived thread, or a thread the plugin started that never ends. Each is a path from a root to one object of the plugin, and that's enough to keep the whole plugin's classes in metaspace.

### The edges

- *Diagnose with the chain, not the size.* A growing metaspace says that classes aren't unloaded; a heap dump, a file listing every object on the heap and its references (coming in a later module), shows which path from a root still reaches the old loader. Check that classes are unloaded at all with -Xlog:class+unload.
- *Metaspace counts towards the JVM's total memory.* A container's memory limit applies to heap plus metaspace plus everything else; the rest of the memory outside the heap is coming in a later module.
- *A second metaspace limit.* On 64-bit HotSpot, part of class metadata goes into a separate region, the compressed class space, which has its own size (1 gigabyte by default, set with the CompressedClassSpaceSize option). So a class-loader leak can also fail as OutOfMemoryError: Compressed class space. Same cause, same fix: find what keeps the old loaders.
- *Unloading isn't immediate.* HotSpot reclaims class metadata when the garbage collector runs; it starts a collection when metaspace use reaches a threshold, the "high-water mark" in Oracle's guide. A metaspace graph can rise for a while and still be healthy.
- *Generated classes count too.* Lambdas (puzzle 9), proxies and other classes created while the program runs also take metaspace; libraries that keep generating new ones without reusing them can fill it the same way.

## The analogy

Each visiting company gets its own filing cabinet in the basement for its manuals, and a badge for its staff in the building. When the company leaves, the cabinet goes, but only if no badge of that company is still in use. One forgotten badge on the front desk, and the cabinet, with every manual in it, stays. Invite a new version of the company every day, forget one badge each time, and the basement fills up.

## Run it yourself

Use plugin/Greeter.java from puzzle 14 and save Leak above as Leak.java next to the plugin folder, then:

```sh
javac -d plugin-out plugin/Greeter.java
javac -d . Leak.java
java -XX:MaxMetaspaceSize=32m -cp . Leak keep
java -XX:MaxMetaspaceSize=32m -Xlog:class+unload -cp . Leak | head
```

Before running, predict which of the two runs finishes, and what changes if the list keeps the loader instead of the Greeter.

## Check yourself

- The list keeps the loader object instead of the Greeter. What happens to the run?::*It still fails: a reachable loader keeps every class it defined||It finishes, because no Greeter object is kept >> A class is unloaded only with its loader, and the list reaches the loader. >> s5||It fails sooner, because a loader is bigger than a Greeter >> The failure comes from class metadata kept in metaspace, not from the size of what's in the list. >> the-building-block::Reaching the loader is enough.
- The run fails with OutOfMemoryError: Metaspace. Will a larger heap limit help?::*No: class metadata isn't on the heap||Yes: a larger heap holds more classes >> Classes live in metaspace, which has its own limit. >> s2||Yes: more heap makes collections rarer >> The kept references still prevent unloading, however often the collector runs. >> s5::Metaspace is outside the heap.
- A plugin's code registered a listener object in a list owned by the host, and the plugin is reloaded 100 times without removing it. Why does metaspace grow?::*Each listener reaches its class and loader, so no old plugin can be unloaded||The host's list keeps copies of the plugin's class files >> The list holds objects; the class metadata stays because those objects reach their loaders. >> s5||Metaspace never shrinks, even when classes are unloaded >> In the run without the list, about 195,000 classes were unloaded and the run finished. >> the-building-block::One reachable object pins its whole loader.

## Sources

- [Java 21 GC tuning guide: Other Considerations, Class Metadata](https://docs.oracle.com/en/java/javase/21/gctuning/other-considerations.html) ("Java classes have an internal representation within Java Hotspot VM and are referred to as class metadata."; "Starting with JDK 8, the permanent generation was removed and the class metadata is allocated in native memory. The amount of native memory that can be used for class metadata is by default unlimited. Use the option -XX:MaxMetaspaceSize to put an upper limit on the amount of native memory used for class metadata."; "A class loader allocates space for metadata from its chunks (a chunk is bound to a specific class loader). When classes are unloaded for a class loader, its chunks are recycled for reuse or returned to the OS."; "a garbage collection is induced")
- [Java language specification, 12.7 Unloading of Classes and Interfaces](https://docs.oracle.com/javase/specs/jls/se21/html/jls-12.html#jls-12.7) ("A class or interface may be unloaded if and only if its defining class loader may be reclaimed by the garbage collector as discussed in §12.6 . Classes and interfaces loaded by the bootstrap loader may not be unloaded.")
- [Java 21 API: ClassLoader](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/ClassLoader.html) ("Every Class object contains a reference to the ClassLoader that defined it.")
- [Java 21 GC tuning guide: Other Considerations, CompressedClassSpaceSize](https://docs.oracle.com/en/java/javase/21/gctuning/other-considerations.html) ("The size of the region can be set with -XX:CompressedClassSpaceSize and is 1 gigabyte (GB) by default.")
- [Java 21 troubleshooting guide: Understand the OutOfMemoryError Exception](https://docs.oracle.com/en/java/javase/21/troubleshoot/troubleshooting-memory-leaks.html) ("If the space needed for UseCompressedClassPointers exceeds CompressedClassSpaceSize , a java.lang.OutOfMemoryError error with detail message Compressed class space is thrown.")
- [The java command (JDK 21)](https://docs.oracle.com/en/java/javase/21/docs/specs/man/java.html) ("-XX:MaxMetaspaceSize= size Sets the maximum amount of native memory that can be allocated for class metadata. By default, the size isn't limited.")
- [JEP 122: Remove the Permanent Generation](https://openjdk.org/jeps/122) ("Remove the permanent generation from the Hotspot JVM and thus the need to tune the size of the permanent generation.")
- Both runs (5,310 plugins then OutOfMemoryError: Metaspace; 200,000 plugins finished, 195,033 unload log lines in one run, 196,708 in another) were produced in this session with OpenJDK 21.0.12. The exact count depends on the JDK build and settings.
