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

## Try it

Run the clock-controlled exercise. Invalidate after the write. Predict which assertion changes and why Ben’s list stays empty.

[Open the local exercise](https://github.com/trOnk12/Company-websites-/tree/main/labs/bookmark-service#core-workbench)

## Check yourself

- Which cache key keeps two owners separate?::*The verified owner plus list options||Only the common list route >> Both owners share that route. >> the-building-block::A cache entry needs a suitable key and a freshness policy.

## Sources

- [Technical reference](https://www.rfc-editor.org/rfc/rfc9111.html)
