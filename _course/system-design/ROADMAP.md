# Distributed system design learning path

The published order is in [course.json](course.json). Each puzzle poses one decision. Make the prediction in its diagram, inspect the outcome, change one assumption in the exercise and answer the three checks. Each closing question introduces the next puzzle. The numbered steps below identify what a learner should be able to demonstrate at each stage.

| Stage | Puzzles | Demonstration |
| --- | --- | --- |
| State the contract | 00–02 | Distinguish a green map pin from a durable grant. Measure a burst and retrieve a decision after the handler's connection closes. |
| Protect a single decision | 03–04 | Predict both outcomes of a row lock. Return an earlier grant for the same intention and report a changed request as a conflict. |
| Read a changing history | 05–06 | Page through tied records while a newer row arrives. Enforce a freshness budget inherited from the source. |
| Coordinate independent work | 07–10 | Deliver an event twice and count one local effect. Compute a draining backlog, identify a hot owner and explain when a leader can advance its commit position. |
| Operate and challenge the service | 11–14 | Resolve a late charge, separate queue time from execution, compare restored receipts in both directions and defend a seat-specific constraint. |
| Serve a busy read path | 15–18 | Route four jobs with uneven costs. Share overlapping reads by key. Admit one recovery probe and handle its missing reply explicitly. Split two callers across real HTTP listeners and verify both replies and storage-call counts. |
| Independent assessment | [Final project](practicum.json) and [practice chapters](topics.json) | Defend an invariant, support a throughput estimate with units, inject a failure and reconcile every externally confirmed operation. |

## Open evidence for production depth

- **Routing and overload.** Replay a measured request distribution through a real proxy and compare waiting time, rejections and service time by worker. The browser routing lesson uses one slot per worker and complete local visibility.
- **Shared reads and deadlines.** The local HTTP fixture demonstrates independent caller deadlines with one or two service instances. Next verify actual upstream cancellation after the final waiter leaves, including a new arrival during cancellation.
- **Distributed ownership.** Promote a replica under a controlled partition, fence the previous writer and verify every acknowledged identity. The current isolated PostgreSQL experiments cover selected schedules.
- **Mixed deployments.** Run old and new readers and writers concurrently during a data change. Establish the last point at which rollback remains safe with real persisted data.
- **Independent transfer.** Use an unfamiliar workload, keep the first design and its predictions, then compare them against the trace. Passing the course checks alone does not provide field evidence for these production decisions.
