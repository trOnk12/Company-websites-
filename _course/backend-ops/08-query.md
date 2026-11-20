---
title: Why does the same page cost less to read?
short: Why does the same page cost less to read?
summary: Inspect a query plan before and after adding an index.
takeaway: An index matching the owner and sort order can serve the same page with less searching and sorting.
---

## The problem

A route lists five recent bookmarks. Reading five rows sounds cheap. What if the database must inspect two thousand candidates first?

## See it

```diagram query
```

## The building block

The data drill generates repeated timestamps and several owners. The query filters by owner and sorts by time, then by a unique row number to settle ties. Without a matching index the database scans the table and uses temporary storage for sorting in this example. An index arranged by owner, time and row number can locate the matching range in order. Compare the plans and the actual rows. Extra indexes occupy space and must be maintained on writes. For the next page, carry the last time and row number together and continue below that pair using the same ordering.

## Try it

Run the data drills, inspect both plans and implement a second page. Check that two tied rows across the page boundary are each returned once.

[Open the local exercise](https://github.com/trOnk12/Company-websites-/tree/main/labs/bookmark-service#data-drills)

## Check yourself

- Two bookmarks share a time. What belongs in the page cursor?::*Time and the unique row number||Only the timestamp of the last row >> A timestamp alone cannot distinguish the tied rows. >> the-building-block::An index matching the owner and sort order can serve the same page with less searching and sorting.

## Sources

- [Technical reference](https://www.sqlite.org/queryplanner.html)
