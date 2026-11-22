---
title: When can a counter be reclaimed?
short: Reachable from a root
summary: Clear one of the two names from puzzle 2 and trace which objects the program can still reach, including two objects that only point at each other.
takeaway: An object stays alive while a path of references leads to it from a root, a local of a running method or a static field. Clearing one reference frees nothing while another path remains, and objects that only reach each other are unreachable however many references they hold.
---

## The problem

Puzzle 2 ended with two objects: A, which first and second both lead to, and B, which nothing leads to after edit returns. Now main clears one name and reads through the other:

```java
second = null;
System.out.println(first.value);   // prints 8
```

Did A disappear when second was cleared? What about B? Java has no delete: memory is freed by the runtime. How does it decide what it may free?

## See it

```diagram reachability
```

## The building block

The **garbage collector** is the part of the JVM that frees the memory of objects the program can no longer use. It decides by reachability, not by counting: an object may be kept while the running program could still follow references to it.

Following references needs starting points. A **root** is one: a local in a running method (a slot in a frame that hasn't returned, like main's first), or a static field (a field that belongs to a class rather than an object, like a cache the whole app shares). Start at every root, follow every reference, and mark every object you reach. What isn't marked can be reclaimed.

Apply it to Bookmark after second = null:

- first is a local of main, which is still running, so it's a root, and it leads to A. A is reachable: the read through first prints 8. (Had first been cleared too, the read itself would fail: reading a field through a variable that holds null throws NullPointerException, because no object is reached.)
- B was only ever referred to by inside, a slot in edit's frame, and that frame was thrown away when edit returned. No root leads to B: it may be reclaimed.

Now add a cache: a static field that keeps objects for later reuse. Suppose it holds A too.

| Change | Objects still reachable | The path that proves it |
| --- | --- | --- |
| A local and the cache both lead to A. Clear the local. | A | cache to A |
| Clear the cache entry too. | none | no path from a root |
| Two objects C and D refer to each other, and nothing else refers to either. | neither | the traversal never enters the pair |

The last row is the one people get wrong: C and D each have an incoming reference, but neither has a path from a root, so both can be reclaimed. Conversely, one forgotten cache entry keeps alive everything reachable from it, however large. To explain unexpected memory use, look for the path from a root, not for who still "has" a reference.

Two limits. Printed values can't tell you when the collector ran, or whether it ran at all: reachability says what may be reclaimed, not when. And this puzzle covers ordinary references only; Java also has weaker kinds, which are coming in a later module.

## The analogy

The office's archive is cleared once in a while. The clearer starts from the files on desks being worked on and the cabinets every clerk shares, follows every "see also" slip, and tags each file reached. Untagged files are shredded, even two files whose slips point at each other, because nobody working can reach either.

## Run it yourself

With Bookmark.java from puzzle 0:

```sh
javac -d out Bookmark.java
java -cp out Bookmark
```

Before running, write down the last printed line. Then add a line first = null; before the last println, predict what happens, and run.

[Run the browser experiment](https://pachulski.dev/labs/jvm-workbench/#03-reachability), or experiment 4 in the [JVM source files](https://github.com/trOnk12/Company-websites-/tree/main/labs/jvm).

## Check yourself

- You add first = null; just before the last println. What happens?::*It throws NullPointerException||It prints 8, because A still exists until the collector runs >> The read goes through first, and first no longer holds a reference to anything. >> s2||It prints 0, the default for an int >> No object is reached at all, so no field, default or not, is read. >> s2::A read needs a path through the variable you read from.
- A static cache leads to A, and main's local leads to A too. The local is cleared. Is A reachable?::*Yes, through the cache, a static field and so a root||No: clearing a reference frees the object it led to >> Clearing removes one path; A stays while any root still leads to it. >> s3||Only until main returns >> The cache is a static field, so it stays a root after main's frame is gone. >> s1::One remaining path from a root keeps an object.
- C and D refer only to each other, and no root leads to either. What does the traversal decide?::*Both may be reclaimed||Both must stay, because each has an incoming reference >> Incoming references don't count; a path from a root does. >> s4||One of them is kept, chosen at random >> The traversal never enters the pair, so neither is marked. >> s4::Reachability starts at the roots.

## Sources

- [Java language specification, 12.6.1 Implementing Finalization](https://docs.oracle.com/javase/specs/jls/se21/html/jls-12.html#jls-12.6.1) ("A reachable object is any object that can be accessed in any potential continuing computation from any live thread.")
- The outputs (8, and NullPointerException: Cannot read field "value" after first = null) were produced in this session with OpenJDK 21.0.12.
