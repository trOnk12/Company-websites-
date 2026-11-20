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

## Try it

Complete experiment 4 in the [local JVM lab](https://github.com/trOnk12/Company-websites-/tree/main/labs/jvm). Record your prediction before running the program.

## Check yourself

- What does the last printed eight demonstrate?::*The original counter was still reachable||The collector ran just before the final print >> A field read does not report collector activity. >> the-building-block::Losing one reference leaves the object reachable while another live reference still leads to it.

## Sources

- [Oracle Java reference](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-2.html)
