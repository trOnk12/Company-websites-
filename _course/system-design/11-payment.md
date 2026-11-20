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

## Try it

Write the allowed transitions. Trace success before expiry, success after expiry, duplicate success and no notification at all. In the last case, decide when to query the provider and when to escalate unresolved work. What stable identity prevents a repeated refund?

## Check yourself

- What does a missing provider reply mean?::The charge was declined >> The charge may already have completed. >> the-building-block||*The result is unknown::The charge may already have completed.
- A charge succeeds after the space was released. What follows here?::*Create refund work||Take the space from its new owner >> The original hold no longer owns the space. >> the-building-block::The original hold no longer owns the space.
- Does sending a refund request complete the refund?::Yes, sending is sufficient >> Compensation can also have an uncertain outcome. >> the-building-block||*Confirm the provider's result::Compensation can also have an uncertain outcome.

## Sources

- [Azure Architecture Center · Saga](https://learn.microsoft.com/en-us/azure/architecture/patterns/saga) — “coordinating a sequence of local transactions across multiple services”
