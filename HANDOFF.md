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
