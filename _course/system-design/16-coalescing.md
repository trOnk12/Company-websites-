---
title: Can two cache misses share one read?
short: Share one pending map read
summary: Make overlapping requests for the same reading share the work and observe how a failed read propagates.
takeaway: Sharing a pending result by key removes duplicate work while that result is being fetched.
---

## The problem

In the routing puzzle, round robin could send two requests to the same worker. Keep their destination fixed and change what they ask for. The map entry for west expires. Two drivers ask for west before its replacement arrives. Another asks for east, which also has no usable cache entry. All three requests reach the same service instance. How many times should it read each lot from storage?

## See it

```diagram coalescing
```

## The building block

A cache keeps a completed answer for later use. **Request coalescing** lets callers that need the same answer share work that is still underway. Picture two people at a counter asking when the same train leaves. The clerk starts one lookup and gives its answer to both. Someone asking about another train needs a separate lookup.

The first caller stores a promise, a value in the program representing a future result, under the lot name. The next caller for that lot can take the same promise. When it settles, remove it whether it succeeded or failed. A request arriving later can start a fresh lookup. A completed-answer cache would need its own freshness and eviction rules.

## Trace the pending reads

The fixture starts three calls before waiting for any result. The storage function counts actual invocations and yields once so the requests overlap. It returns a known map or fails with a known error. The last call happens after the burst finishes. Compare **Independent reads** with **Share reads for each lot**.

```read-path coalescing
```

In the independent burst storage receives two west requests and one east request. Sharing reduces west to one while both west callers receive the result. Now choose the failure scenario. One failed west read reaches both west callers. East still succeeds. The later west lookup succeeds because the failed promise was removed. The counts shown in the later row include the earlier calls.

## Go deeper: What belongs in the sharing key?

Suppose the public map shows only free spaces, while an attendant can also see reserved names. A key containing only the lot would combine requests for different answers. Build the key from every input that changes what callers may see, or share only the public part after checking access. Giving one caller a shorter deadline can end that caller's wait while the other caller still needs the shared result.

- What happens if two service instances each keep this dictionary?::Simultaneous misses can produce one storage read per instance for the same key.

## Try it

Select the scenario that keeps the failed promise. Only cleanup changes. Before running it, predict how many west calls reach storage in the later row and which reply that driver receives.

## Compare your result

The later read finds the old rejected promise and fails again. West still has only one storage call even though storage has recovered. Restore the failed-read scenario with normal cleanup and explain why sharing an in-flight read cannot by itself make an old completed map entry fresh.

## Check yourself

- Which two requests share storage work?::East and west on the same worker >> Different lots need different data. >> s2||*The overlapping reads for west::Their requested result and the time of their pending lookup coincide.
- If the shared west read fails, who sees the failure?::*Both waiting west callers||Only the first west caller >> Both await the same result. >> trace-the-pending-reads::Sharing includes the outcome of failure.
- Why remove the entry when it settles?::To make each duplicate call run immediately >> Removing during the fetch would defeat sharing. >> the-building-block||*To let a later caller try again::A later read should be able to start fresh work.

## Sources

- [Go singleflight · Package overview](https://pkg.go.dev/golang.org/x/sync/singleflight) — “a duplicate function call suppression mechanism”
