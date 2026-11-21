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

### Trace the page boundary

Use ascending order for this small example. The rows for one owner are (time 10, id 1), (10, 2) and (11, 3). With a page size of one, the first response ends at (10, 1). A next-page filter requiring a time greater than ten jumps straight to row 3. A filter accepting a later time or the same time and a larger row number returns row 2. For descending order, reverse the direction of both the ordering and continuation comparison. First verify the pages contain the right rows in order. Then inspect the query plan to learn how much searching and sorting produced them.

## Try it

[Run the browser experiment](https://pachulski.dev/labs/backend-workbench/#08-query)

### Optional local lab

Run the data drills, inspect both plans and implement a second page. Check that two tied rows across the page boundary are each returned once.

[Open the local exercise files](https://github.com/trOnk12/Company-websites-/tree/main/labs/bookmark-service#data-drills)

## Check yourself

- Two bookmarks share a time. What belongs in the page cursor?::*Time and the unique row number||Only the timestamp of the last row >> A timestamp alone cannot distinguish the tied rows. >> the-building-block::An index matching the owner and sort order can serve the same page with less searching and sorting.

- Which failure can a fast query still have?::It must always return a complete page sequence >> An index speeds access but cannot repair the wrong continuation condition. >> the-building-block||*It can skip a row tied on the timestamp::An index speeds access but cannot repair the wrong continuation condition.
- Why include the owner before time in this particular index?::*The query restricts one owner then orders that owner's rows||Every query in a database filters by owner >> Choose an index for the actual filter and ordering. >> the-building-block::Choose an index for the actual filter and ordering.

## Sources

- [Technical reference](https://www.sqlite.org/queryplanner.html)
