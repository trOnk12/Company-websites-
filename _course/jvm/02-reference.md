---
title: Why do both names read eight?
short: Copying a reference, not an object
summary: Predict which changes made inside a method survive the call, when the argument is an object rather than a number.
takeaway: A variable of a class type holds a reference to an object, and a call copies that reference, not the object. Writing a field through the copy changes the one shared object; assigning the parameter a new object changes only the helper's own slot.
---

## The problem

Puzzle 1 showed that a call copies its argument, so increment couldn't change main's 7. Now the argument is an object. main makes one Counter, gives it a second name, and passes it to edit:

```java
static void edit(Counter inside) {
    inside.value = 8;
    inside = new Counter(99);
}

// in main:
Counter first = new Counter(7);
Counter second = first;
edit(second);
System.out.println(first.value + " " + second.value);
```

If the call copied the argument, how does the program print 8 8? And why not 99?

## See it

```diagram reference
```

## The building block

A **reference** is a value that lets code reach an object. A variable of a class type, such as first, doesn't hold the Counter itself: its slot in the frame holds a reference, and the object lives elsewhere in memory, outside every frame. Call the object that new Counter(7) creates A.

- Counter second = first copies the reference. Both slots now lead to A. There is still one object.
- edit(second) copies the reference again, into edit's slot for inside. Three slots, one object.
- inside.value = 8 follows the reference and writes into A. Anyone who follows a reference to A now reads 8.
- inside = new Counter(99) creates a second object, B, and writes a reference to B into inside's slot only. first and second still lead to A.

| Step | first | second | inside | Objects |
| --- | --- | --- | --- | --- |
| Enter edit | A | A | A | A holds 7 |
| inside.value = 8 | A | A | A | A holds 8 |
| inside = new Counter(99) | A | A | B | A holds 8, B holds 99 |
| Back in main | A | A | gone with edit's frame | prints 8 8 |

Puzzle 1's rule still holds: the call copied the argument. The argument just happened to be a reference, so the copy leads to the same object. javap shows the two kinds of write: the field write is `putfield` (store into a field of the object a reference leads to), and the reassignment is `astore_0` (store a reference into local slot 0). Swap the two lines in edit and the 8 lands in B instead: main then prints 7 7.

If main really wants second to lead to B, edit has to return B and main has to assign it: second = edit(second). A method can change a shared object's contents, but only the caller can change what its own variables refer to.

## The analogy

The office keeps one filing card for each customer in a cabinet. A clerk's drawer never holds the card itself, only a slip with its cabinet number. Giving a colleague a copy of the slip lets them find and change the same card. If the colleague writes a different cabinet number on their own slip, your slip still points at the original card.

## Run it yourself

With Bookmark.java from puzzle 0:

```sh
javac -d out Bookmark.java
java -cp out Bookmark
javap -classpath out -c Bookmark
```

Before running, write down the second printed line. Then swap the two lines inside edit, predict the second line again, and run.

[Run the browser experiment](https://pachulski.dev/labs/jvm-workbench/#02-reference), or experiment 3 in the [JVM source files](https://github.com/trOnk12/Company-websites-/tree/main/labs/jvm).

## Check yourself

- You swap the lines in edit: inside = new Counter(99) first, then inside.value = 8. What does main print for first.value and second.value?::*7 7||8 8 >> After the reassignment, inside leads to B, so the 8 lands in B. >> s4||99 99 >> Only inside was given B; first and second still lead to A. >> s4::The write follows whichever reference inside holds at that moment.
- edit writes 8, creates B and returns it, but main ignores the result. Which object does second reach?::*A||B >> Returning a reference doesn't store it anywhere; only an assignment in main would. >> s5::The caller's slot keeps the reference it had.
- main runs second = edit(second), with edit returning B. What does first reach now?::*A, holding 8||B, holding 99 >> The assignment changed only second's slot; first was copied earlier and still leads to A. >> s2::Each name holds its own copy of a reference.

## Sources

- [Java language specification, 15.12.4.5 Create Frame, Synchronize, Transfer Control](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.12.4.5) ("assign the argument values to corresponding freshly created parameter variables of the method")
- [Java language specification, 4.3.1 Objects](https://docs.oracle.com/javase/specs/jls/se21/html/jls-4.html#jls-4.3.1) ("The reference values (often just references ) are pointers to these objects")
- [JVM specification, 6.5 putfield](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-6.html#jvms-6.5.putfield) ("Set field in object")
- The output 8 8, the swapped version's 7 7 and the javap listing of edit were produced in this session with OpenJDK 21.0.12.
