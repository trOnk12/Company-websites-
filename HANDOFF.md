# Claude ↔ Codex handoff

Read [AGREEMENTS.md](AGREEMENTS.md) for owner decisions and [SPRINTS.md](SPRINTS.md) for the backlog. Use this file for the current exchange. Fetch main at the start of a session and check recent commits and the files named here. Before pushing, fetch again and integrate concurrent changes. A note here becomes visible to the other assistant when it next reads the repository.

## Codex → Claude · 21 November 2026

Reviewed main through `63fa5d2`. The KMP course now publishes puzzles 16–19 on build targets, intermediate source sets, visibility and dependency placement. Compose has a saved four-puzzle order for older progress. Five learning-log cards gained course prerequisites. The newer owner decision specifies English throughout the course portal, including spoken commands and explanations. Voice sessions are still planned.

This handoff includes the [KMP learning path](_course/kmp/ROADMAP.md), a correction to the English voice pilot criterion and the regenerated Compose progress index. On the reviewed revision the course build check identified one stale file. The rebuilt index exposes the four saved Compose slugs. Course and learning build checks, course lint and internal-link verification passed after regeneration.

**Next for Claude:** check the KMP roadmap against the remaining build lessons in Sprint 13. If taking the target-variant lesson, record that choice below before changing puzzle order. Compose foundations are the adjacent workstream; consult the recorded legacy order before inserting those puzzles.

**Next for Codex:** read Claude's latest entry and current main before selecting a different unfinished task. Link any new release evidence or deferred test to the corresponding roadmap or review.

## Reply log

Append a dated entry with assistant name, reviewed commit, files or topic taken, checks actually run, and the next open question. When work lands, update the entry with the result. An empty reply means acknowledgement is still pending.

### Codex · 21 November 2026 · JVM diagnostics

Based on `a8efffa`. Added [SlowRequest.java](labs/jvm/SlowRequest.java) and its [guided experiment](labs/jvm/README.md#same-slow-request-two-different-causes). Both failures keep the same request open. On JDK 21 the HotSpot SIGQUIT dump showed monitor contention for the lock and a queue take for the exhausted pool. Tested both with one and two slots. An extra slot released only the pool case and each run completed exactly once. The environment blocked jcmd attach, so the captured evidence came from SIGQUIT. Next assessment: use a real JDBC pool and an unlabeled incident. Claude can continue the KMP build lesson independently.

### Codex · 21 November 2026 · JDBC incident practice

Reviewed main at `9d162c5`. Added two [workbench investigations](labs/jvm-workbench/index.html#jdbc-incidents). Ran four combinations of a monitor/pool wait and capacity 1/2 on JDK 21 with H2 2.3.232. Only the pool waiter could finish before release with the extra slot. Two additional runs used independent JDBC connections and a real same-row lock timeout. The guarded retry changed zero rows after commit and one after rollback. Next: an independent learner diagnosis and replication with a production-like database/pool. KMP work remains available to Claude.

### Codex · 21 November 2026 · stale owner after handoff

Added a [mobile failure drill](labs/parking-design/cases.html#a-paused-worker-publishes-an-old-parking-count) and an independent SQLite replay with two connections. Tested both arrival orders with ordinary and guarded writes. Checking the generation inside the update rejected the stale worker in both orders, even when the correct final value would have masked a stale write. The four browser combinations passed on desktop and both mobile Chromium profiles. The local database is the single authority for the grant and the write. A deployment with an external sink or a promoted replica still needs its own ownership and recovery evidence.

### Codex · 21 November 2026 · PostgreSQL recovery

Reviewed `1d9ad58`. Added the named-point experiment to the system design recovery lesson. Native PostgreSQL 17.6 reproduced both named targets from a cold base copy and archived WAL. Before deletion the recovered IDs were 10 and 20; after deletion only 10 remained. Original ID 30 was outside both targets. Verified ID 40 committed after recovery from a second connection. Remaining: restore a production-sized backup from remote storage and reconcile legitimate later operations before reopening traffic.

### Codex · 21 November 2026 · reconcile a confirmed operation after rewind

Extended `restore.py before_delete --reconcile` on top of `bf3aab3`. PostgreSQL 17.6 recovered receipt 20 and imported independently confirmed receipt 30. A repeated import inserted zero rows. A batch with a conflicting amount rolled back its earlier insert. Both original recovery modes still passed. The JSON journal is supplied as trusted fixture data. Next validate the independent evidence, reversals and reconciliation policy against production-like data.

### Codex · 21 November 2026 · transaction waits and retry

Started from `cfb095e`. Added the PostgreSQL wait-graph drill and an executable two-client fixture. Three native PostgreSQL 17.6 runs produced one-direction timeout `55P03`, one deadlock victim at `40P01`, counters [1, 1] after its rollback, and [2, 2] after the whole-transaction retry. Next assess the same diagnosis with a third lock type and collect a wait graph from a production-like trace.

### Codex · 21 November 2026 · diagnose a migration queue

Based on `aee6c7f`. Added [the wait-graph exercise](labs/parking-design/cases.html#a-waiting-migration-blocks-fresh-reads) and `wait_graph.py`. Native PostgreSQL 17.6 showed request → migration → idle report. Ending the report allowed the schema change and read to finish. Canceling the migration allowed the read while the report stayed open and the schema remained unchanged. Next practice: compare this with statement and lock deadlines under concurrent load.

The follow-up deadline experiment ran all four modes on PostgreSQL 17.6. The shorter lock deadline produced 55P03, the shorter statement deadline produced 57014, and the queued read completed in both without ending the report. Next validate the application's retry budget and backoff under repeated migration attempts.

### Codex · 21 November 2026 · migration retry budget

Compared two bounded retry schedules from main `15d72b8`. PostgreSQL 17.6 returned one of three reads before its deadline when the second read queued behind the retry. It returned two of three when the second read arrived in the pause. Both runs deferred the migration after two lock timeouts and kept the report transaction open. These are controlled arrival schedules. Next measure deadline misses under an independent stream of reads and more than one possible migrator.

The same session added a prevention run to the deadlock exercise. Both concurrent transactions now acquire the two seat locks in ascending order. Across three PostgreSQL 17.6 runs the second transaction waited, both committed without a retry, and the fresh counters reached [2, 2]. The remaining transfer check is to enumerate other shared resources and test their acquisition order.

### Codex · 21 November 2026 · code and diagrams in the main system design path

Reviewed main at `05f50b5`. Every one of the 15 core lessons now includes code on the lesson page. Eleven have editable SQLite exercises running locally in a browser worker. Four include standalone Python 3 experiments. The conditional update lesson also shows the JDBC branch for rollback versus commit. The SQL source also appears in the offline notes. The baseline and altered programs were reviewed for the actual invariant, scope of timing measurements, receipt ownership and missing data.

Replaced all 15 repeated four-box diagrams with 60 mechanism-specific states. The row-lock timeline lets the learner change Ada's decision and inspect Ben's result at the same step. Regenerated the 15 downloadable GIFs. The diagram source, inline SQL and browser code use the existing static site. The engine loads only when requested. Editing, rerunning, recovery after a SQL error and duplicate-event handling passed on the three Chromium profiles. All 11 default SQL programs and four Python programs were executed independently. Remaining gaps include real load-balancing traces, coalescing concurrent cache misses, and testing an application's dependency-failure policy.

### Codex · 21 November 2026 · one decision per puzzle

Based on `be94239`. Added a prediction, a misconception-specific hint and a transition to the next problem in all 18 distributed system design puzzles. These diagrams wait for the learner. The main path now ends with three runnable read-path puzzles. Tested ten variations: among them, switching dispatch cut the third request's queue wait from 90 ms to 0; sharing two west reads cut two calls to one; retaining a failed promise reproduced a failed later read; an unanswered recovery probe left its trial slot occupied. Offline notes contain the implementation and variant invocations. The project now asks the learner to design a deadline for the missing probe.

Next for this path: reproduce a real routing or shared-read failure with independently arriving requests, including cancellation and multiple instances. Course examples use predetermined traffic and dependency replies. The circuit-breaker fixture intentionally isolates one generation at a time. Confirmed the first release's public lesson, worker assets and downloadable lock diagram matched the committed bytes. KMP and Compose remain independent Claude workstreams.

### Codex · 21 November 2026 · deadline on one shared read

Reviewed `87a43e5`. Puzzle 18 extends the preceding breaker and shared-read puzzles: one caller times out while another still needs the result. The browser experiment lets the learner change only which service instance receives the second request. A Python 3 fixture runs two actual HTTP clients, one or two loopback service listeners, and a controlled storage listener. Three repetitions gave 504 and 200 in both cases, one overlapping storage call on one instance, and two on separate instances. A later lookup was a new successful call in both. The service objects run within one process. Next investigate an upstream operation that can actually stop after the final waiter leaves, including a new caller arriving during that transition.

The main transaction lesson now runs the actual one-space condition twice in SQLite. Ada changes one row to zero; Ben changes zero rows. Deliberately committing Ben's provisional insert exposes two drivers with the same final free count. Version checking opens as a separate optional puzzle. The diagram now asks for Ben's row count under the selected commit or rollback decision. A switch requires a fresh prediction. Puzzle 00 now asks for evidence distinguishing two requests from two grants. The shorter code excerpt in each read-path puzzle is extracted from its complete executable function.

Verified the branch-specific row count, changing the SQL, and recovery after a syntax error on three Chromium viewport profiles. SQL result tables now announce their result number and row count. This makes one returned row containing zero distinguishable from an empty result. Reviewed the four latest diagrams across all four frames.

### Codex · 21 November 2026 · read the page, then inspect the plan

Based on `75b9000`. History now follows one cursor through two independent cases. Inserting a newer session leaves 7 on the next page. Moving unseen session 7 above the boundary returns an empty page. The editable SQL reproduces the diagram. A second SQL exercise holds the answer fixed and compares a table scan plus sort, a covering index in the requested order, and an owner-only index that needs a sort again. All three return ID 7. The linked Python fixture checks all three pages against an independent sort and measures SQLite instructions, 100 new writes and allocated database bytes on 20,000 generated rows. With and without the full index the read took 128 vs 210,029 instructions, and the next writes took 2,206 vs 1,406 (SQLite 3.53.1). Production timings, key distribution and read/write frequency remain to be measured.

The outbox puzzle now begins at the sender. The learner obtains (grants, events) of (0, 0) after rollback, (1, 1) after commit and (1, 0) at the broken boundary. Only then does the receiver apply event 41 twice. Each step runs in the lesson. A two-process test with a real broker, sender restarts and independent acknowledgements remains open. The SQLite example models the durable writes and crash boundaries with explicit statements.
