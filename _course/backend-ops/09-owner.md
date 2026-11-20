---
title: Whose bookmark may this request read?
short: Whose bookmark may this request read?
summary: Trace identity from the caller to the storage query.
takeaway: Every read and write needs an ownership decision based on the authenticated caller.
---

## The problem

Two people save a bookmark named river. Your route receives that name. Which row belongs to the person making the request?

## See it

```diagram owner
```

## The building block

Authentication establishes the caller identity. Authorization decides which action that caller may perform on a resource. In the offline drill the trusted caller is an explicit test input. In a service it would come from a verified session. Filter database reads and updates by both that identity and the resource name. A unique key over owner and name lets two people reuse a name. An owner typed into a request body is ordinary input. It cannot establish who sent the request. The existing single-user loopback lab has no login system.

## Try it

Extend the offline exercise with a delete operation. Check that Ben cannot remove Ada’s row and that Ada can remove her own. Test both postconditions.

[Open the local exercise](https://github.com/trOnk12/Company-websites-/tree/main/labs/bookmark-service#data-drills)

## Check yourself

- Which owner should a write use?::*The identity from the verified session||The owner string supplied in the bookmark body >> A body field can name another person. >> the-building-block::Every read and write needs an ownership decision based on the authenticated caller.

## Sources

- [Technical reference](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
