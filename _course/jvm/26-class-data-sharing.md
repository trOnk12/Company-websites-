---
title: Why does every run load the same classes again?
short: Starting faster with class data sharing and AOT caches
summary: Puzzles 11 and 17 showed HotSpot reading, parsing and linking each class the first time it's needed, and puzzles 19 to 25 showed every run warming up from nothing. Measure what a small Kotlin program spends on that at each start, and how much an archive prepared by an earlier run saves.
takeaway: Class data sharing maps an archive of already parsed classes into memory instead of reading and parsing class files: the JDK ships one for its own classes, and a training run can write one for your app. JDK 24's AOT cache also stores classes loaded and linked, JDK 25 adds method profiles, and the archive is only used if the class path and JDK match the training run.
---

## The problem

Puzzle 11 said a class is loaded, linked and initialized the first time code needs it, and puzzle 17 that its metadata is built in metaspace. A JVM does all of that again in every run, for the same classes, and then warms up again (puzzle 25). For a server that runs for weeks it hardly matters. For a command-line tool, a test run, or a container that is started for each request, startup is most of the run.

This Kotlin program sorts three bookmarks; kotlinc packed it and the Kotlin standard library into start.jar:

```kotlin
data class Bookmark(val url: String, val visits: Int)

fun main() {
    val bookmarks = listOf(Bookmark("a.dev", 3), Bookmark("b.dev", 7), Bookmark("c.dev", 1))
    val top = bookmarks.sortedByDescending { it.visits }.map { it.url }
    println(top.joinToString())
}
```

The -Xlog:class+load option prints one line per loaded class and says where it came from:

```text
$ java -Xlog:class+load -jar start.jar
…
[0.034s][info][class,load] StartKt source: file:/…/start.jar
[0.034s][info][class,load] Bookmark source: file:/…/start.jar
…
```

Counting the lines: 597 classes came from a source called "shared objects file", 41 from start.jar and 6 from jrt:/java.base, the JDK's own module file. With the -Xshare:off option, all 681 loaded classes came from class files: 640 of the JDK's own and 41 from start.jar. What is the shared objects file, and what does it save?

## See it

```diagram cds
```

## The building block

Loading a class from a class file means reading its bytes from a jar, parsing them, and building the class's metadata in metaspace, before linking (puzzles 11 and 17). The result is the same in every run of the same program. **Class data sharing** (CDS) skips that work: HotSpot maps a prepared archive file into memory, and the classes in it are already in the form HotSpot keeps them. That file is a **CDS archive**. JEP 310: classes are "pre-processed into a shared archive file that can then be memory-mapped at runtime to reduce startup time".

Since JDK 12 the JDK ships one (JEP 341): the java manual says it "contains about 1300 core library classes that are used by most applications", in lib/server/classes.jsa. That's the "shared objects file" the 597 classes came from. Your own classes and the Kotlin library aren't in it: those 41 still come from the jar.

You can archive them too. Run the program once with ArchiveClassesAtExit; when it exits, HotSpot writes every class it loaded that isn't in the JDK's archive into a new one (JEP 350, JDK 13). That run is a **training run**: a run whose only purpose is to record what a later archive should contain.

```text
$ java -XX:ArchiveClassesAtExit=app.jsa -jar start.jar
b.dev, a.dev, c.dev
$ java -XX:SharedArchiveFile=app.jsa -Xlog:class+load -jar start.jar
…
[0.035s][info][class,load] StartKt source: shared objects file (top)
[0.035s][info][class,load] Bookmark source: shared objects file (top)
…
```

All 635 loaded classes now came from archives, none from the jar or the JDK's module file (in two runs); (top) marks the app's archive, which sits on top of the JDK's. The time to start, run and exit, as the median of 21 runs, in two rounds:

| Run | Classes parsed at startup (JDK + jar) | Round 1 | Round 2 |
| --- | --- | --- | --- |
| -Xshare:off | 681 | 95 ms | 97 ms |
| default (JDK's archive) | 47 | 75 ms | 67 ms |
| SharedArchiveFile=app.jsa | 0 | 45 ms | 47 ms |

Half the startup time of this program was loading classes. The rest, interpreting and warming up, an archive of classes doesn't touch. That's what the newer **AOT cache** goes after. JDK 24 (JEP 483) introduced it: an archive that stores classes "in a loaded and linked state", created from a training run in two steps:

```sh
java -XX:AOTMode=record -XX:AOTConfiguration=app.aotconf -cp start.jar StartKt
java -XX:AOTMode=create -XX:AOTConfiguration=app.aotconf -XX:AOTCache=app.aot -cp start.jar
java -XX:AOTCache=app.aot -cp start.jar StartKt
java -XX:AOTCacheOutput=app.aot -cp start.jar StartKt   # JDK 25: the first two steps in one
```

JDK 25 made it one step (JEP 514, the AOTCacheOutput option, last line below) and added the method profiles from the training run (JEP 515), so that C2 can start "immediately upon application startup, rather than having to wait for profiles to be collected" (puzzle 20). JEP 483 reports a 42% faster start for its examples; JEP 515 a further 19% for one program. JDK 28, due in March 2027, is to store compiled machine code in the cache as well (JEP 544, ahead-of-time code compilation). The course's reviewer ran this program on JDK 25.0.5.1: the cache was 11.7 megabytes, and the medians of 11 runs were 98 ms with -Xshare:off, 53 ms with the default archive, 30 ms with the AOT cache, and 25 ms with an app archive from ArchiveClassesAtExit. For a program this short, warm-up hardly matters, so the cache's extra content doesn't show; JDK 28's numbers are the JEP's own.

### The archive must match

It's only valid for the same JDK and a compatible class path. Appending entries after the training class path is allowed (-cp start.jar:extra still used the archive here); changing or prepending is not. Run the app's archive with an extra folder in front of the class path and HotSpot quietly ignores it:

```text
$ java -XX:SharedArchiveFile=app.jsa -cp extra:start.jar StartKt
[0.011s][warning][cds] shared class paths mismatch (hint: enable -Xlog:class+path=info to diagnose the failure)
[0.011s][warning][cds,dynamic] Unable to use shared archive. The top archive failed to load: app.jsa
b.dev, a.dev, c.dev
```

The program still runs, just without the archive. Rebuilding the jar has the same effect: in this run, touching start.jar made HotSpot print "start.jar timestamp has changed." and load Bookmark from the jar again. So recreate the archive with every build. With -Xshare:on the same mismatch is an error, and the JVM stops before main runs. JEP 310 recommends testing with on and running production with the default, auto.

### The edges

- *The training run decides what's in it.* JEP 483: "an AOT cache only helps insofar as the training run does similar things as production runs." Classes the training run never loaded still come from the jar.
- *AOT cache limits.* JEP 483: "Class paths must contain only JAR files", and a later run may only append entries to the training class path. The Z garbage collector can use the cache only from JDK 26 (JEP 516). JDK 27 renamed the AOTMode value on, which makes an unusable cache an error, to required.
- *Archives are bigger than jars.* The java manual: "about 2 to 5 times larger than classes stored in JAR files". app.jsa was 1.9 megabytes here.
- *Android* solves startup differently: dex2oat compiles ahead of time, and a Baseline Profile ships the profile with the app (puzzle 18).

## The analogy

Every morning the office unpacks the same filing cabinets from the delivery boxes, reads each manual and puts it on the shelf in the office's own format. Class data sharing photographs the finished shelf once; the next morning the photo is pinned up and the clerks start reading it straight away. The town keeps one photo of its standard manuals for every office; an office can take its own photo of its own shelf after a normal day. The AOT cache also photographs which forms were filled in most, so the specialists can start writing sheets on day one. A photo of another office's shelf is useless, so a mismatch means unpacking boxes as usual.

## Run it yourself

Save the program as Start.kt, then:

```sh
kotlinc Start.kt -include-runtime -d start.jar
java -Xlog:class+load -jar start.jar | grep -c "shared objects file"
java -XX:ArchiveClassesAtExit=app.jsa -jar start.jar
java -XX:SharedArchiveFile=app.jsa -Xlog:class+load -jar start.jar | grep "Bookmark"
time java -Xshare:off -jar start.jar
time java -XX:SharedArchiveFile=app.jsa -jar start.jar
```

The older way to make an app archive, a static one that replaces the JDK's, takes two runs: one that writes the class list, and -Xshare:dump. In this run its median was 41 and 38 ms:

```sh
java -XX:DumpLoadedClassList=classes.lst -jar start.jar
java -Xshare:dump -XX:SharedClassListFile=classes.lst -XX:SharedArchiveFile=static.jsa -cp start.jar
java -XX:SharedArchiveFile=static.jsa -jar start.jar
```

Before running the last two, predict which one is faster, and by about how much. Run each several times; single timings vary.

## Check yourself

- You add a new class to your app and rebuild start.jar, but keep the old app.jsa. What happens at startup?::*HotSpot sees the jar changed, warns, and loads the app's classes from the jar||The JVM refuses to start until the archive is rebuilt >> Only -Xshare:on makes an unusable archive an error; by default the JVM continues. >> the-building-block||Old classes come from app.jsa, only the new class from the jar >> HotSpot checks the jar's timestamp and drops the whole app archive when it changed. >> the-building-block::A changed jar means a new training run.
- Why does an app archive cut startup roughly in half here but not make main's sorting code faster?::*It skips reading and parsing classes, but the code still starts in the interpreter||It compiles the app's methods ahead of time, but only the startup ones >> CDS stores parsed classes, not machine code; machine code in the cache is JEP 544, JDK 28. >> s6||Sorting three bookmarks is too short to be compiled at all, archive or not >> True for this tiny program, but an archive of classes never contains compiled code, whatever the program. >> s3::Classes ready is not code compiled.
- Your service runs in containers that start for every batch job. Which change from module 4 helps its first second most?::*An AOT cache from a training run that does a typical job||Making hot classes final, for faster inlining >> Puzzle 23: final changes little, and only for code that is already hot. >> the-building-block||JMH with more warm-up iterations >> JMH measures code; it doesn't change how your service starts. >> the-building-block::Startup work done once ahead, not in every container.

## Sources

- [JEP 310: Application Class-Data Sharing (JDK 10)](https://openjdk.org/jeps/310) ("Class-Data Sharing, introduced in JDK 5, allows a set of classes to be pre-processed into a shared archive file that can then be memory-mapped at runtime to reduce startup time."; "If the -Xshare:on option is specified, the JVM will treat this as an error condition and fail to start."; "Please note that -Xshare:auto will also disable AppCDS if there's a classpath mismatch. Therefore, we recommend that you first test with -Xshare:on to ensure there's no classpath mismatch, and then use -Xshare:auto in the production environment.")
- [JEP 341: Default CDS Archives (JDK 12)](https://openjdk.org/jeps/341) ("Enhance the JDK build process to generate a class data-sharing (CDS) archive, using the default class list, on 64-bit platforms.")
- [JEP 350: Dynamic CDS Archives (JDK 13)](https://openjdk.org/jeps/350) ("Extend application class-data sharing to allow the dynamic archiving of classes at the end of Java application execution. The archived classes will include all loaded application classes and library classes that are not present in the default, base-layer CDS archive."; "% bin/java -XX:ArchiveClassesAtExit=hello.jsa -cp hello.jar Hello"; "% bin/java -XX:SharedArchiveFile=hello.jsa -cp hello.jar Hello")
- [JEP 483: Ahead-of-Time Class Loading & Linking (JDK 24)](https://openjdk.org/jeps/483) ("Improve startup time by making the classes of an application instantly available, in a loaded and linked state, when the HotSpot Java Virtual Machine starts."; "$ java -XX:AOTMode=record -XX:AOTConfiguration=app.aotconf"; "$ java -XX:AOTMode=create -XX:AOTConfiguration=app.aotconf -XX:AOTCache=app.aot -cp app.jar"; "$ java -XX:AOTCache=app.aot -cp app.jar com.example.App ..."; "an improvement of 42%"; "Keep in mind that an AOT cache only helps insofar as the training run does similar things as production runs."; "(Update: As of JDK 27, -XX:AOTMode=on is now -XX:AOTMode=required.)")
- JEP 483 also: "All runs must have consistent class paths. A subsequent run may specify extra class-path entries, appended to the training class path; otherwise, the class paths must be identical. Class paths must contain only JAR files"; "ZGC is not yet supported."
- [JEP 516: Ahead-of-Time Object Caching with Any GC (JDK 26)](https://openjdk.org/jeps/516) ("so that it can be used with any garbage collector, including the low-latency Z Garbage Collector (ZGC)")
- [JEP 514: Ahead-of-Time Command-Line Ergonomics (JDK 25)](https://openjdk.org/jeps/514) ("Make it easier to create ahead-of-time caches, which accelerate the startup of Java applications, by simplifying the commands required for common use cases."; "$ java -XX:AOTCacheOutput=app.aot -cp app.jar com.example.App ...")
- [JEP 515: Ahead-of-Time Method Profiling (JDK 25)](https://openjdk.org/jeps/515) ("Improve warmup time by making method-execution profiles from a previous run of an application instantly available, when the HotSpot Java Virtual Machine starts. This will enable the JIT compiler to generate native code immediately upon application startup, rather than having to wait for profiles to be collected."; "an improvement of 19%")
- [JEP 544: Ahead-of-Time Code Compilation (Release 28)](https://openjdk.org/jeps/544) ("Improve startup and warmup time by making optimized native code for an application instantly available when the HotSpot Java Virtual Machine starts.") and [JDK 28 schedule](https://openjdk.org/projects/jdk/28/) ("2027/03/09 General Availability"); status checked 22 November 2026.
- [The java command (JDK 21): Application Class Data Sharing](https://docs.oracle.com/en/java/javase/21/docs/specs/man/java.html) ("Application Class Data Sharing (AppCDS) stores classes used by your applications in an archive file. Since these classes are stored in a format that can be loaded very quickly (compared to classes stored in a JAR file), AppCDS can improve the start-up time of your applications."; "This archive contains about 1300 core library classes that are used by most applications."; "Classes in the CDS archive are stored in an optimized format that's about 2 to 5 times larger than classes stored in JAR files"; "-Xshare:mode Sets the class data sharing (CDS) mode."; "on Require using shared class data, otherwise fail.")
- The class counts, the archives, the warnings and the timings (median of 21 runs, two rounds each) were produced in this session with kotlinc 2.2.21 and OpenJDK 21.0.12. The JDK 25.0.5.1 AOT-cache runs (11.7 MB cache; medians of 11 runs: 98, 53, 30 and 25 ms) were made by the course's reviewer; JDK 28's AOT code was not run.
