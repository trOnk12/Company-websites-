---
title: Can an old client read the new response?
short: Can an old client read the new response?
summary: Define the shape and meaning of a request before changing it.
takeaway: An API contract specifies methods, fields, validation, status codes and compatibility.
---

## The problem

Your route accepts a bookmark. A newer client sends an extra color field. Must an older server reject the request?

## See it

```diagram contract
```

## The building block

An **application programming interface** (API) is the interface a program offers its callers. A contract is an agreement about what each side accepts and returns. First parse the bytes as **JavaScript Object Notation** (JSON), a text format for objects, arrays and simple values. Then validate the fields the operation needs. For this exercise a missing or blank name fails validation, while unknown fields are ignored. An additive field works only when readers tolerate it. Changing a field from text to a list can break existing readers even when the status stays 200. Document the rule and test both client versions.

### Walk one body through both checks

A lone opening brace cannot be parsed, so the fixture returns 400 before field validation. A body containing a name field set to a list of names parses successfully; the name has the wrong type, so the fixture returns 422. A body with the text fields name (river) and color (blue) passes because the required name is text and this reader ignores the extra field. For a version change, test old client with new server and new client with old server separately. A new client that requires color will still fail when the old server omits it.

## Try it

[Run the browser experiment](https://pachulski.dev/labs/backend-workbench/#05-contract)

### Optional local lab

Run the contract fixtures. Add cases for a blank name and a list. Write down the response an old client expects.

[Open the local exercise files](https://github.com/trOnk12/Company-websites-/tree/main/labs/bookmark-service#core-workbench)

## Check yourself

- Which change can break an old reader expecting text?::*Returning a list for name||Adding an optional field the reader ignores >> The reader still finds its original text field. >> the-building-block::An API contract specifies methods, fields, validation, status codes and compatibility.

- What does a successful parse establish?::Every required field has the right type >> Field validation follows parsing. >> the-building-block||*The input has valid JSON syntax::Field validation follows parsing.
- How can a new client safely read responses from the old server?::*Define behavior for a missing optional color||Require every older response to contain color >> An older producer cannot supply a field it never implemented. >> the-building-block::An older producer cannot supply a field it never implemented.

## Sources

- [Technical reference](https://spec.openapis.org/oas/latest.html)
