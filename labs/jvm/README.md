# Follow a bookmark through the JVM

Use a JDK 21 installation. All commands run locally, without network access. Open a terminal in this directory.

```sh
mkdir -p out
javac -g -d out Bookmark.java
java -cp out Bookmark
javap -classpath out -c -p Bookmark
```

Expect three lines: `7 8`, `8 8`, `8`. Find the instructions for increment. Walk the operand stack from empty to [7], then [7, 1], then [8]. The brackets describe values, not output printed by the program.

1. Change the addition from one to two. Before recompiling, run the old class and predict its output. Rebuild and locate the changed constant in the disassembly.
2. Put a breakpoint in increment or trace it on paper. Record the caller's original local, the callee's local, and the returned value. Explain why the caller still prints seven.
3. Move the assignment to inside.value below the line that creates the second Counter in edit. Predict both values on the second line, rebuild, then compare. Inspect the order of putfield and astore.
4. Restore the source. Draw the two references after edit returns, then after second becomes null. Mark which object first still reaches. Explain why a matching output cannot tell you exactly when the other object was collected.

Portfolio check: submit your two edited methods, a short disassembly excerpt and one drawing with arrows from locals to objects. Explain a prediction that the output corrected.
