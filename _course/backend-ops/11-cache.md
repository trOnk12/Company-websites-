---
title: When does a reader see yesterday’s list?
short: When does a reader see yesterday’s list?
summary: Predict the exact interval during which a saved response can be stale.
takeaway: A cache entry needs a suitable key and a freshness policy.
---

## The problem

Ada saves a second bookmark. The route still shows her first list. Where could an old answer be hiding?

## See it

```diagram cache
```

## The building block

A cache stores a previous result for reuse. Our key is the verified owner and the entry expires ten seconds after loading. At time zero Ada reads river. A write adds hill in the database. Reading at time nine still uses the cached list. At ten the entry expires and the next read loads both names. Clearing the owner’s entry after a successful write shortens this stale window. With several processes each private cache needs its own invalidation strategy.

### Write the owner’s timeline

At tick 0 Ada reads [river] and her cache entry expires at 10. At tick 1 hill commits to storage. At tick 9 the cached copy can still answer [river]. Tick 10 forces a reload, so both names appear. Under immediate invalidation the tick 9 read would also reload. Before choosing either policy, write down the promise the interface makes after a save. If it promises the writer will see hill immediately, a ten-second lifetime alone cannot meet it. Include filters and page boundaries in the key when they change the response.

## Try it

[Run the browser experiment](https://pachulski.dev/labs/backend-workbench/#11-cache)

### Optional local lab

Run the clock-controlled exercise. Invalidate after the write. Predict which assertion changes and why Ben’s list stays empty.

[Open the local exercise files](https://github.com/trOnk12/Company-websites-/tree/main/labs/bookmark-service#core-workbench)

## Check yourself

- Which cache key keeps two owners separate?::*The verified owner plus list options||Only the common list route >> Both owners share that route. >> the-building-block::A cache entry needs a suitable key and a freshness policy.

- Two pages for Ada have different filters. May they share one unqualified owner key?::Yes, because only one owner is involved >> A key must identify the requested result. >> the-building-block||*No, the filters can select different rows::A key must identify the requested result.
- When is it safe to tell the writer that storage now contains hill?::*After the storage transaction commits||As soon as the old cache entry is removed >> Removing a previous read result does not prove that the write succeeded. >> the-building-block::Removing a previous read result does not prove that the write succeeded.

## Sources

- [Technical reference](https://www.rfc-editor.org/rfc/rfc9111.html)
