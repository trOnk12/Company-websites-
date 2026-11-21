---
title: When can a counter be reclaimed?
short: When can a counter be reclaimed?
summary: Trace which object the remaining variable can reach.
takeaway: Losing one reference leaves the object reachable while another live reference still leads to it.
---

## The problem

The caller clears the second name and then reads the first. Did the object disappear when one name was cleared?

## See it

```diagram reachability
```

## The building block

Draw locals first and objects second. After edit returns, first and second still point to the original counter. Clearing second removes one arrow. The subsequent read through first still reaches eight. The temporary counter created inside edit has no surviving reference in this example. The runtime may reclaim its storage. The printed values cannot establish when collection ran, or whether an optimizing runtime materialized that temporary allocation at all. This distinction matters when investigating a long-lived cache that still points to old objects.

The **garbage collector** manages storage for objects. To reason about ordinary, strongly held references, start with values that the running program can still use. A **root** is one of these starting points in your drawing. Follow their references and mark every object reached. A cache is a collection that keeps values for later reuse. If a live application keeps a cache, references stored in its entries also matter.

| Change to the example | Objects still reachable | Path that proves it |
| --- | --- | --- |
| A live local and the cache both hold A. A holds B. Clear the local. | A and B | cache to A to B |
| Also remove A's link to B. | A only | cache to A |
| Instead, start again and clear both the local and the cache entry. | Neither A nor B | no path from a root |

The rows assume there are no other references. Add a link from B back to A in the last row. The two objects now point at each other. A traversal starting from the roots still reaches neither. Conversely, retaining a single cache entry can keep a large group of objects alive. To diagnose unexpected retention, look for a path from a live owner to that group. The number of times a method returned tells you little about this path.

## Try it

[Run the browser experiment](https://pachulski.dev/labs/jvm-workbench/#03-reachability)

### Optional local lab

Complete experiment 4 in the [JVM source files](https://github.com/trOnk12/Company-websites-/tree/main/labs/jvm). Record your prediction before running the program.

## Check yourself

- What does the last printed eight demonstrate?::*The original counter was still reachable||The collector ran just before the final print >> A field read does not report collector activity. >> the-building-block::Losing one reference leaves the object reachable while another live reference still leads to it.

- The local is cleared but the cache holds A, which holds B. Which objects can still be reached?::*Both A and B||Only A >> Following fields from A also reaches B. >> the-building-block::Trace each surviving path beyond the first object.
- Only A and B refer to each other and no live owner can reach them. What does the cycle prove?::*Neither is reachable from those roots||Both must stay alive forever >> Starting from the roots never enters the cycle. >> the-building-block::Reachability depends on a path from a root, not the mere existence of incoming references.

## Sources

- [Java language specification, reachability](https://docs.oracle.com/javase/specs/jls/se21/html/jls-12.html#jls-12.6.1) — “can be accessed in any potential continuing computation from any live thread”
