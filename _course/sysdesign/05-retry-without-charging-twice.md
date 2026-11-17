---
title: Retry without charging twice
short: Idempotency and backoff
summary: The user taps Pay. The request times out. Did the payment go through? Retrying might charge them twice; not retrying might lose the order. Here's how a key makes retries safe, and how to retry without flooding a struggling server.
takeaway: A timeout doesn't tell you whether the server did the work. An idempotency key, a unique ID the client sends with the request, lets the server recognise a retry and return the first result instead of acting twice. Retry with exponential backoff plus jitter, so clients that failed together don't all retry at the same moment.
---

## The problem

The user taps Pay. Your `POST /payments` times out after 30 seconds. Maybe the request never arrived. Maybe the server charged the card and the answer got lost on the way back. You can't tell which. Retry, and you might charge twice. Don't, and you might lose a paid order.

## See it

```diagram retry
```

## The building block

An operation is **idempotent** when doing it twice has the same effect as doing it once. HTTP says `GET`, `PUT` and `DELETE` are meant to be: setting a profile name to "Anna" twice leaves it "Anna". `POST` isn't: two `POST /payments` can be two payments.

The fix is an **idempotency key**. Before the first try, the app generates a unique ID, a random UUID, and sends it with the request, for example in an `Idempotency-Key` header. The server remembers each key and its result:

- First time it sees the key: it does the work and stores the result.
- It sees the key again: it doesn't charge again; it returns the stored result.

Now a timeout is safe: retry with the **same** key. Either the first try never arrived and this one does the work, or it did and this one gets the saved answer. Generate the key once per user action and save it with the pending order, so a retry after the app restarts still uses it. (That's also how puzzle 4's pending writes should sync: each with its own key.) Stripe compares a retry's parameters with the original's and errors if they differ, and may forget keys after 24 hours.

When to retry matters too. If the server is struggling and every client retries at once, the retries pile on. **Exponential backoff** waits longer each time: 1 s, 2 s, 4 s, with a cap on the wait and on the number of tries. Retry only failures that may pass: timeouts, 5xx errors, and 429 Too Many Requests (honouring its `Retry-After` header). A 400 won't fix itself. **Jitter** randomises each wait, so clients that failed together spread out instead of returning in waves.

## The analogy

Posting a cheque with a reference number written on it. If you're not sure it arrived, you send another with the same number. The bank sees the number, recognises the duplicate, and cashes only one.

## Check yourself

- `POST /payments` timed out. You retry with a new idempotency key. What can happen?::*The user may be charged twice, since the server sees two different requests||Nothing bad: the server recognises the retry because it's the same payment >> The server recognises retries by the key; a new key looks like a new payment. >> s3||The retry fails, because the server rejects repeated amounts >> Servers don't match by amount; only the key marks a retry. >> s3::Same action, same key.
- 10,000 clients lost the connection at the same second. Why add jitter to their backoff?::*So their retries spread out instead of all arriving at the same moments||So each client retries faster than with plain backoff >> Jitter isn't about speed; it breaks up the waves. >> s4||So the server can tell which clients retried >> That's the idempotency key's job; jitter only spreads the timing. >> s4::Randomness breaks up the stampede.
- What's the difference between an idempotency key and exponential backoff?::*The key makes a retry safe to repeat, while backoff decides when to retry||The key decides when to retry, while backoff makes a retry safe to repeat >> That's the two swapped. >> the-building-block::Whether it's safe vs when to do it.

## Sources

- [Stripe API: Idempotent requests](https://docs.stripe.com/api/idempotent_requests) ("if a connection error occurs, you can safely repeat the request without risk of creating a second object or performing the update twice"; "A client generates an idempotency key, which is a unique key that the server uses to recognize subsequent retries of the same request… we suggest using V4 UUIDs")
- [RFC 9110, HTTP Semantics, 9.2.2 Idempotent methods](https://www.rfc-editor.org/rfc/rfc9110#name-idempotent-methods) (PUT, DELETE and the safe methods are idempotent; POST is not)
- [AWS Architecture Blog: Exponential backoff and jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/) ("The solution isn't to remove backoff. It's to add jitter.")
