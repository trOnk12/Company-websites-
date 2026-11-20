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

## Try it

Freeze time one tick before expiry and then exactly at expiry. Revoke a fixture and show that a subsequent request requires authentication.

[Open the local exercise](https://github.com/trOnk12/Company-websites-/tree/main/labs/bookmark-service#core-workbench)

## Check yourself

- The session expired but the owner still matches. What happens?::*Require fresh authentication||Permit the read based on the old owner >> The earlier identity check has expired. >> the-building-block::Session expiry and resource ownership answer different questions.

## Sources

- [Technical reference](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
