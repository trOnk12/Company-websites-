---
title: Who vouched for the caller?
short: Who vouched for the caller?
summary: Follow a session from an identity check to permission on one row.
takeaway: Session expiry and resource ownership answer different questions.
---

## The problem

Ada can read river before lunch. After the session expires she asks for the same row. What changed if the database row is identical?

## See it

```diagram session
```

## The building block

After a successful sign-in, a service may issue a session identifier and keep its owner and expiry on the server. On each protected route it checks the session and then the permission for the resource. The workbench starts with invented session records. An unknown or expired record yields 401. In this exercise a known user without permission gets 403. A real login also needs secure credential handling, protected transport and a revocation policy. Use an established identity provider when implementing the portfolio version.

### Place requests on the expiry boundary

In the model a session belongs to Ada and is valid while the server's current tick is strictly below 100. At 99 the lookup succeeds and her own bookmark is visible. At 100 it fails even if the record has not been physically removed. Revocation handles an earlier cutoff: deleting the record at 98 means a request arriving at 99 also fails. This separates how long a credential was originally issued for from whether the server still accepts it now.

## Try it

[Run the browser experiment](https://pachulski.dev/labs/backend-workbench/#10-session)

### Optional local lab

Freeze time one tick before expiry and then exactly at expiry. Revoke a fixture and show that a subsequent request requires authentication.

[Open the local exercise files](https://github.com/trOnk12/Company-websites-/tree/main/labs/bookmark-service#core-workbench)

## Check yourself

- The session expired but the owner still matches. What happens?::*Require fresh authentication||Permit the read based on the old owner >> The earlier identity check has expired. >> the-building-block::Session expiry and resource ownership answer different questions.

- What happens at exactly tick 100 in this contract?::The session always lasts one more tick >> The validity condition uses a strict less-than comparison. >> the-building-block||*The request needs fresh authentication::The validity condition uses a strict less-than comparison.
- Ada has a valid session and requests Ben's private record. What is still required?::*Check permission for that record||Serve it because the session is current >> Session validity establishes identity before resource authorization. >> the-building-block::Session validity establishes identity before resource authorization.

## Sources

- [Technical reference](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
