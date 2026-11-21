---
title: What if the space expires before payment is confirmed?
short: What if the space expires before payment is confirmed?
summary: Make uncertain outcomes and compensation explicit.
takeaway: A missing payment reply leaves an unknown outcome that needs reconciliation.
---

## The problem

Payment introduces a second decision beyond the reservation itself. The lot holds a space for five minutes. The payment provider charges the driver, but its reply disappears. What should the phone show?

## See it

```diagram payment
```

## The building block

Represent the process with explicit states such as pending, confirmed, expired and refund pending. Save a payment-attempt identity before contacting the provider. Silence leaves the result unknown. A later authoritative notification or status query lets the service reconcile both records. A saga coordinates local steps and explicitly defined compensating actions.

Expiry and payment success can race. Both try to transition from pending. The winner determines which transitions remain valid. If the space has been released, late payment success creates durable refund work. A refund is another operation that can fail or take time. The driver needs to distinguish an outstanding refund from one completed by the provider.

### Trace one late payment

At minute zero, hold H owns seat 12. At minute five, expiry releases it. At minute six a different driver acquires the seat. The provider then reports a successful charge for H. Keep the new owner's seat. Record the old charge reference and a pending refund as a durable decision. A second success notification for the same charge finds that decision and produces no additional refund work.

Now lose the refund response. A worker needs a provider-supported way to query the refund or safely repeat the same refund identity. Mark it complete only after obtaining a confirmed outcome. If neither operation is available, keep it unresolved for reconciliation. Announcing a completed refund from the local send alone would give the driver a false financial status.

## Replay a late charge after the seat changes hands

A hold belongs to one driver. Once it expires, another hold can own the seat. The following database already contains Ada's expired hold and Ben's live hold. A verified provider message says charge 91 succeeded for Ada. Where should that message be allowed to write?

```sql run
CREATE TABLE hold (id TEXT PRIMARY KEY, seat TEXT, state TEXT);
CREATE TABLE refund_work (charge INTEGER PRIMARY KEY, hold_id TEXT);
INSERT INTO hold VALUES
  ('Ada-1', 'B12', 'expired'), ('Ben-2', 'B12', 'confirmed');

BEGIN;
UPDATE hold SET state = 'confirmed'
WHERE id = 'Ada-1' AND state = 'pending';
INSERT INTO refund_work
SELECT 91, id FROM hold WHERE id = 'Ada-1' AND state = 'expired'
ON CONFLICT (charge) DO NOTHING;
COMMIT;

-- Another delivery of the same success for the expired hold.
INSERT INTO refund_work
SELECT 91, id FROM hold WHERE id = 'Ada-1' AND state = 'expired'
ON CONFLICT (charge) DO NOTHING;

SELECT id, seat, state FROM hold ORDER BY id;
SELECT charge, hold_id FROM refund_work;
```

Both hold states stay the same and exactly one refund job names charge 91. A worker must still reconcile that refund with the provider. The database row records an obligation, not money arriving on a card.

Change the fixture to the earlier instant: replace the entire two-row insert with the statement below.

```sql
INSERT INTO hold VALUES ('Ada-1', 'B12', 'pending');
```

The same handler should confirm Ada and create no refund work. In production, the expiry path also releases inventory atomically, and a separate constraint must enforce a single live holder for each seat. This excerpt isolates how the payment handler treats an already-decided hold.

## Try it

Write the allowed transitions. Trace success before expiry, success after expiry, duplicate success and no notification at all. In the last case, decide when to query the provider and when to escalate unresolved work. What stable identity prevents a repeated refund?

## Check yourself

- What does a missing provider reply mean?::The charge was declined >> The charge may already have completed. >> the-building-block||*The result is unknown::The charge may already have completed.
- A charge succeeds after the space was released. What follows here?::*Create refund work||Take the space from its new owner >> The original hold no longer owns the space. >> the-building-block::The original hold no longer owns the space.
- Does sending a refund request complete the refund?::Yes, sending is sufficient >> Compensation can also have an uncertain outcome. >> the-building-block||*Confirm the provider's result::Compensation can also have an uncertain outcome.

## Sources

- [Azure Architecture Center · Saga](https://learn.microsoft.com/en-us/azure/architecture/patterns/saga) — “coordinating a sequence of local transactions across multiple services”
