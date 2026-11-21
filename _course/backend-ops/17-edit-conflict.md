---
title: What does the second editor see?
short: Two editors, one bookmark
summary: Follow two clients editing the same saved title.
takeaway: A version check inside the update lets the service report a stale edit while preserving the first writer's title.
---

## The problem

Your released service stores a bookmark called River. Two phones open it. Ada changes the title to Lake and saves. Ben still sees River and taps Save on his edit, Forest. What should his phone receive?

## See it

```diagram edit-conflict
```

## The building block

**Optimistic locking** lets both people edit immediately and checks at save time whether the version they read is still current. A **header** is a named field carrying information about a request or response. An **ETag** is a response field identifying the version of the representation sent. Here its value is the quoted version of the title. Each edit sends that tag back in the If-Match request header. Every change to this title advances the version.

Both phones read version seven. The service handles Ada's request by running the update below with Lake, the bookmark identity and seven. In one database statement it checks the identity and version, changes the title and advances the version. One row changes. After commit the service replies 204, meaning the save succeeded with an empty response body.

```sql
UPDATE bookmark
SET title = ?, version = version + 1
WHERE id = ? AND version = ?;
```

For Ben the same condition now matches zero rows. In this fixture the bookmark always exists, so the stale tag explains the zero. The service replies 412, meaning his request's condition failed. Ben's phone can keep his draft, read Lake and ask him which title to save. Silently resending Forest with the latest tag would overwrite Ada's decision.

## The analogy

Two clerks copy edition seven of a filing card. The archive accepts a replacement only against the edition written on the clerk's slip. After the first replacement, the archive can show the second clerk edition eight while the clerk keeps the proposed text.

### Distinguish replay from an edit conflict

A request identity answers whether a particular intention already took effect. A version answers whether the document still matches the copy a person edited. Suppose Ada's conditional save commits and its reply is lost. Retrying it with the old version can yield 412 even though Ada's first request succeeded. A new read reveals the current title and version. It cannot in general identify who wrote them. If the service promises to recover the precise outcome of each submitted edit, record a stable request identity and its outcome alongside the accepted edit.

## Try it

[Run the browser experiment](https://pachulski.dev/labs/backend-workbench/#17-edit-conflict)

### Optional local lab

Run the following command in the [bookmark service source files](https://github.com/trOnk12/Company-websites-/tree/main/labs/bookmark-service).

```sh
python3 edit_conflict.py
```

It starts a temporary local service and sends real reads and writes. Predict Ben's status, the stored title and the next tag before running. In a copy, remove the tag condition and its matching SQL parameter. Which assertion fails, and which title survived? Restore the condition and reverse the order of the two saves. Trace the losing client's next read.

## Check yourself

- Ben's update matches zero rows. What title does the next read return?::*Lake||Forest >> The condition rejected Ben's update. >> s3::Ada's committed title survives.
- What tells the phone that its edit was stale?::A database row count sent directly to the phone >> The service interprets that count and constructs a response. >> the-building-block||*The 412 response::The client sees the HTTP contract.
- Which retry preserves the user's choice?::*Show the current title and draft before saving a chosen edit||Fetch the latest tag and automatically send the old draft >> That can overwrite the other edit silently. >> the-building-block::A fresh tag establishes freshness, while the user decides the intended title.

## Sources

- [HTTP Semantics, section 13.1.1](https://www.rfc-editor.org/rfc/rfc9110.html#section-13.1.1) — “to prevent accidental overwrites when multiple user agents might be acting in parallel on the same resource”
- [SQLite UPDATE](https://www.sqlite.org/lang_update.html)
