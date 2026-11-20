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

## Two callers, one counter

Run `java SharedCounter.java` with JDK 21. Two callers have already observed seven. Predict the final total with separate reads and writes, then predict the two booleans when each caller tries a conditional write. The program replays a specific ordering without relying on thread scheduling. Explain which instruction belongs to the caller that still owes an increment. Compare that decision with a user editing a title in the [two-editor HTTP lab](../bookmark-service/README.md#two-editors-one-bookmark).

## JVM backend graduation project

Build the [bookmark service graduation project](../bookmark-service/README.md#graduation-project) on the JVM. Use Java or Kotlin, a relational database and an HTTP framework. The Java counter and Python HTTP fixture above are small reference experiments. The project below is an independent build. Work through the gates in order and retain the evidence in your project.

| Gate | Work to deliver | How a reviewer checks it |
| --- | --- | --- |
| 1. First vertical slice | A versioned migration, create/read handlers and one integration test using the same database engine as the service. Record one command to build and one to test. | Start with an empty database, create a bookmark, restart the application, then read it. The title survives. |
| 2. Concurrent changes | Give each bookmark a version. Run two application instances against one database. Coordinate the test so both clients read before either writes. | Two different edits use the same original version. Exactly one succeeds. Read through the other instance and verify the winner's title and version. |
| 3. Failure during delivery | In one transaction save the bookmark and a pending event. Give the event a stable ID. Have the worker record its database effect and its processed ID together. | Stop the worker just after its database commit and before it acknowledges the event. Replay that event. Verify one effect and show recovery of the pending work. |
| 4. Diagnose a slow request | Bound the database connection pool. Hold all its connections in a local test, then send one more request with a finite wait limit. Capture elapsed time, pool usage and a JVM thread dump during the wait. | Explain which threads are waiting, what for, and what releases them. Restore the connections and show another request succeeding. Compare with a baseline using the same workload. |
| 5. Release and recover | Build one image, test it, record its identity, and run the existing [local Kubernetes rollout exercise](../bookmark-service/k8s/README.md). Introduce a compatible schema change. | Roll back the application while keeping the upgraded database. Demonstrate a real write and read. Record the recovery time and the migration assumption that made rollback possible. |
| 6. Defend the design | Write a one-page decision record for one contested choice. Include workload assumptions, two plausible designs, one measurement, and a condition that would change your choice. | A reviewer changes an assumption, such as ten times the traffic or frequent edits to one row. Trace the resulting failure mode and identify a measurement that could disprove your prediction. |

For gate 4, use a full JDK. Run `jcmd -l` locally, identify the lab application's process ID, then run `jcmd PID Thread.print` with that ID while the waiting request is still open. Capture a second dump after releasing the connections. A thread snapshot shows where work was waiting at that instant. Use pool measurements and request durations to test your explanation.

Assess each gate separately. **Reproduced** means a reviewer can rerun the evidence from a clean checkout. **Explained** means you can predict a changed outcome before running one variation and account for the result afterwards. Record both alongside the commit and exact commands. Keep production ownership, mentoring and cross-team decisions as separate evidence from professional work.

For a worked first service, run the [JVM parking lab](../parking-design/README.md). Its HTTP test races two clients, checks retry behavior, restarts the Java process and reads the committed row. The [system design course](https://pachulski.dev/course/system-design/) connects the implementation to capacity, consistency, overload and recovery.
