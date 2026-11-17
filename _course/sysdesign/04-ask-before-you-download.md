---
title: Ask before you download
short: HTTP caching
summary: Your feed downloads the same 200 KB every time the screen opens, even when nothing changed. HTTP already has the answer. Here's how a response says how long it stays good, and how the app asks "has this changed?" for almost nothing.
takeaway: Cache-Control on a response says how long it stays fresh; while fresh, the app reuses its stored copy with no network at all. Once stale, the app sends a conditional request with the ETag of its copy; if nothing changed, the server answers 304 with no body. Fresh copies cost zero round trips; checking costs one tiny one.
---

## The problem

Every time the user opens the feed, the app downloads it again: 200 KB, a round trip or more, a radio wake-up (puzzle 3). Most of the time, nothing in it has changed. How can the app avoid downloading what it already has, and still notice when it does change?

## See it

```diagram cache
```

## The building block

HTTP has caching built into its responses. OkHttp implements it when you give the client a cache directory.

**1. Fresh: don't ask at all.** The server adds a header like `Cache-Control: max-age=60`. For the next 60 seconds, the stored response is **fresh**: the app uses it without touching the network. Zero round trips, zero radio.

**2. Stale: ask, cheaply.** After 60 seconds the copy is stale. It isn't thrown away. The server also sent an **ETag**, a short tag naming this version of the feed, like `"v42"`. The app now sends a **conditional request**: "I have `"v42"`; has it changed?", in an `If-None-Match` header.

- Not changed: the server answers **304 Not Modified**, with no body. The app keeps its copy and marks it fresh again. One round trip, a few hundred bytes instead of 200 KB.
- Changed: a normal `200 OK` with the new feed and a new ETag.

So in a system design answer, "cache it" has two levels: how long it's fresh (no network) and how it's revalidated (a cheap check). The server decides both, per response: a user's profile might be fresh for an hour; a live score, never. Two directives people mix up: `no-cache` means "store it, but always revalidate"; `no-store` means "never store it".

## The analogy

A library book with a return date. Until the date, you read it without asking anyone (fresh). After, you phone the library: "is my edition still the latest?" If yes, they say "keep it" in one sentence (304), and you don't have to fetch a new copy.

## Check yourself

- The feed came with `Cache-Control: max-age=60`. The user reopens it 30 seconds later. What happens on the network?::*Nothing at all: the copy is still fresh, so it's used from the cache||A conditional request, answered 304 if nothing changed >> That's after 60 seconds, when the copy is stale. >> s2||A full download, because the screen was closed and reopened >> The stored response survives the screen closing. >> s1::Fresh means no network.
- Two minutes later the copy is stale and the feed hasn't changed. What does the server send?::*A 304 Not Modified with no body, so the app reuses its copy||The whole feed again, since the copy is out of date >> Stale isn't wrong: with a matching ETag the server answers 304. >> s3||Nothing, because the app doesn't ask once the copy is stale >> It asks with a conditional request carrying the ETag. >> s3::Stale means ask cheaply.
- What's the difference between Cache-Control and an ETag?::*Cache-Control says how long a copy stays fresh, while an ETag names its version for checking||Cache-Control names a copy's version for checking, while an ETag says how long it stays fresh >> That's the two swapped. >> the-building-block::How long vs which version.

## Sources

- [MDN: HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching) ("Stored HTTP responses have two states: fresh and stale. The fresh state usually indicates that the response is still valid and can be reused, while the stale state means that the cached response has already expired"; "If the age of the response is less than one week, the response is fresh", for max-age=604800)
- [MDN: Conditional requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Conditional_requests) ("The value of the validator is used as a parameter of the If-Modified-Since and If-None-Match headers. If the resource has not changed, the server sends back a 304 Not Modified response. This makes the cache fresh again, and the client uses the cached resource.")
