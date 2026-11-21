---
title: What if a successful reply disappears?
short: What if a successful reply disappears?
summary: Recognize a retry after the database has committed.
takeaway: A stable identity ties a replay to the original intention and committed grant.
---

## The problem

The database commits Ada's reservation. The connection drops before her phone sees the reply. How can the service distinguish a retry from a second trip?

## See it

```diagram retry-identity
```

## The building block

The phone creates a request identity before the first attempt and retains it for retries of that intention. Bind it to the owner, the requested lot and the result. A unique constraint in the store arbitrates simultaneous first attempts. Recording the grant and its identity must survive a crash together.

Replaying the same successful request for the same lot returns its existing grant. Reusing the identity for a different lot is a conflict. The lab returns status 201 on creation and 200 on a successful replay. Both leave the same durable state. In this contract a full-lot refusal does not permanently consume the identity. State explicitly which results your own service retains and how long retries are supported.

Example calls against the local service:

```text
PUT /sessions/ada-17    west    → 201 west
PUT /sessions/ada-17    west    → 200 west
PUT /sessions/ada-17    east    → 409 id already used
GET /sessions/ada-17            → 200 west
```

### Keep the identity across a restart

Ada taps once, the phone sends request 17 and the app closes before it receives the reply. On restart the phone still has the pending intention and its ID. Resending 17 lets the service return the original result. If the app invents 18 for that same tap, a lot with two spaces could grant both. A unique ID per network attempt breaks this contract.

Decide what a second deliberate tap means. If Ada wants a second space, it needs a new intention. If the service forgets completed identities after a day, a phone retrying a two-day-old request needs an explicit recovery rule. One option is to stop automatic retries after the supported window and look up the original reservation before offering a new purchase.

## Store the first answer and challenge the replay

Suppose one driver can reserve different lots. A request number is unique only within that driver's account. Together the owner and the request number identify one intention. Run the SQL and predict what the last lookup returns when the incoming request says east.

```sql run
CREATE TABLE receipt (
  owner TEXT NOT NULL, intent TEXT NOT NULL, lot TEXT NOT NULL, grant_id INTEGER NOT NULL,
  PRIMARY KEY (owner, intent)
);
INSERT INTO receipt VALUES ('Ada', '17', 'west', 301);

INSERT INTO receipt VALUES ('Ada', '17', 'east', 302)
ON CONFLICT (owner, intent) DO NOTHING
RETURNING grant_id;

SELECT grant_id, lot,
       CASE WHEN lot = 'east' THEN 'replay'
            ELSE 'conflicting request' END AS decision
FROM receipt WHERE owner = 'Ada' AND intent = '17';
```

The second insert returns no row. That alone cannot tell the handler how to reply. Reading the saved row gives grant 301 for west, so the changed lot is a conflict. Change east to west in both places to model a genuine retry. The handler can return 301 even though the attempted insert proposed 302.

The table isolates the identity check. In a service, derive the owner from the signed-in account and include every field that changes the operation's meaning in the comparison. Commit the receipt and the real inventory change together. Otherwise a receipt can outlive a failed reservation.

## Try it

Compare a disconnect immediately before commit with one immediately after. Then compare retry identity with an edit version. One asks whether this intention was already carried out. The other asks whether the record is still the version the editor saw.

[Drop the reply and retry](https://pachulski.dev/labs/parking-design/#retry)

## Check yourself

- What identity should the phone send on retry?::*The original identity||A freshly generated one >> A fresh value looks like another intention. >> the-building-block::A fresh value looks like another intention.
- The same identity arrives for another lot. What follows?::Reserve the second lot >> The request changed meaning. >> the-building-block||*Report a conflict::The request changed meaning.
- What detects an edit based on stale data?::*The version the editor saw||The number of network retries >> A fresh intention can still edit an old version. >> the-building-block::A fresh intention can still edit an old version.

## Sources

- [AWS · Making retries safe](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/) — “the service first checks to see if it has seen this identifier before”
- [SQLite · UPSERT](https://www.sqlite.org/lang_upsert.html)
