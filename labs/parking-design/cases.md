# Three system design reviews

Spend 35 minutes on each prompt before opening its worked review. Use the first five minutes to identify which missing assumptions would change your design. Specify the user contract, estimate scale, trace a write and a read, then choose a failure to reproduce. Use the final five minutes to defend an alternative. All numbers are exercise assumptions. After the three reviews, try the shorter parking-display failure drill.

## 1. Assigned concert seats

There are 30,000 seats, 90,000 people in the waiting room and a peak of 6,000 reservation attempts per second. A hold lasts two minutes. A payment can arrive after three. What happens if a driver switches devices or the hold expires before payment is known?

<details><summary>Worked review and failure drill</summary>

Start with one durable seat record per event and seat. Store state, hold owner, expiry and operation identity. A conditional transition from available to held arbitrates two claims on the same seat. Completing a sale checks both the owner and the current hold. Evaluate expiry against an agreed authoritative time source. A new device reads the stored state.

Separate the admission bottleneck from contention on one seat. A waiting room reduces the rate reaching the store. It grants no particular seat. A charge reported after another fan receives the seat creates durable reconciliation and refund work. An extra read region can speed up the seating chart. It does not automatically reduce contention on one write row.

**Drill.** Stop the application after the sale commits and before its reply. Replay from the same account on another device. Verify exactly one ticket and reconcile the provider's charge. Deliver the late payment notification twice. Identify the durable refund identity and which part of this guarantee depends on the payment provider.

</details>

## 2. A feed of followed authors

Assume 100,000 posts per day, an average of 200 followers per published post, and five million feed opens per day. One author has two million followers. Posts should normally appear within ten seconds. Revoking access to a private post must take effect on the next read.

<details><summary>Worked review and failure drill</summary>

Distributing each post identity into readers' personal lists implies about 20 million list writes per day under the stated weighted average. A single post from the popular author would require 200,000 list writes per second to distribute fully within ten seconds. Building on read instead moves work to five million feed opens, each finding and merging posts from followed authors.

A mixed design distributes ordinary posts in the background and merges recent posts from very popular authors at read time. Order by publication time and a unique identity. Deduplicate by post identity. If ranking can change while a reader pages, choose a frozen ranking version or define which movement readers may see. Select the popularity threshold by measuring write throughput and merge cost.

A stored feed entry is a candidate. Check current authorization before returning private content. Otherwise an old candidate or a previously cached answer can undermine the revocation promise. **Drill.** Pause distribution for a minute, revoke access and replay pending events with duplicates. Measure time to visibility for both author classes. Count duplicates and verify that revoked content stays hidden.

</details>

## 3. Private receipt photos

Drivers upload 100,000 private photos of four megabytes each per day. Phones can sleep halfway through. Estimate monthly storage, specify what a resumed upload means and define when the receipt becomes visible.

<details><summary>Worked review and failure drill</summary>

Using decimal units gives 400 gigabytes per day and twelve terabytes in thirty days before overhead, copies and deletion. Reading each image ten times implies four terabytes of reads per day. A currency estimate requires a region, storage class, retention period and transfer prices.

Authorize the driver, create a pending metadata row and assign a distinct object key. Give the phone a short-lived right to upload that object directly to object storage. On completion, verify existence, expected size and the agreed integrity mechanism before transitioning the row to ready. Bind completion to the correct object identity and version. For multipart uploads retain the upload session and the list of completed parts. When serving the photo, distinguish the owner's read authorization from the transfer permission already issued. Decide how long an existing permission can remain valid after revocation.

**Drill.** Fail after bytes arrive but before the metadata row is updated. Then fail after the ready state commits but before the phone receives a reply. Repeat completion and count ready receipts. Run cleanup of abandoned uploads after a grace period and race it against completion. Explain how ownership of the cleanup decision prevents deletion of a finished receipt.

</details>

## A paused worker publishes an old parking count

Two workers update one parking display. Worker A observes an open space, prepares “open” and pauses. The coordinator hands the job to B. B now observes a full lot. Both workers can still reach the database. Predict the final message for each arrival order, first with ordinary writes and then with a generation check.

Choose a write rule and arrival order below, then replay the handoff to inspect each write. To run the same experiment against real SQL, download [the Python fixture](https://pachulski.dev/labs/parking-design/fencing.py) and run `python3 fencing.py` locally. It uses two independent SQLite connections and creates four disposable databases. Each grant advances an integer on the display row. The handoff is explicit so you can repeat the same schedule without waiting for a real lease to expire.

<details><summary>Worked review and failure drill</summary>

If B publishes “full” and delayed A publishes “open” last, two ordinary updates succeed and the display lies. If A arrives first, the eventual “full” hides a brief stale write. Checking only the final message misses that error.

The grant records generation 2 before either publish. Each guarded update checks its generation inside the same SQL statement that writes the message. A's generation 1 changes zero rows in either order. B's generation 2 changes one row. Predict the result if A checks the generation in a separate query, pauses, and later sends an unconditional update. B can take ownership between those operations.

**Transfer check.** If B repeats a valid increment twice, does its generation suppress the duplicate? Both increments can pass the same ownership test. A non-repeatable effect needs its own operation identity and deduplication. This fixture keeps the granting authority and the protected write in one database. For a separate external display service, specify where it will persist and enforce ownership before promising the same guarantee.

[Further reading on fencing tokens](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html)

</details>

## Review rubric

| Review question | Evidence |
| --- | --- |
| What does the user see on success, refusal and silence? | Three client outcomes and one observable guarantee. |
| Which assumption drives most of the cost? | An estimate with units and a recalculation after a tenfold change. |
| What happens at the worst crash point? | A timeline naming the last durable write and recovery action. |
| Who may change or see the record? | Two identities, one successful request and a denied cross-owner request. |
| How would you discover a production failure? | A user-facing measurement, threshold and resulting action. |
| When would you change the design? | An explicit assumption change and a measurable cost of the current choice. |

Score each row separately: explained, reproduced, defended under changed assumptions. Repeat any weak row on a different case.
