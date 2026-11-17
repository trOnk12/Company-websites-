---
title: One connection, many requests
short: Handshakes and reuse
summary: Puzzle 1 counted round trips per request. A brand-new HTTPS connection adds its own before the first request even leaves. Here's what they cost, and how OkHttp makes them a one-time price.
takeaway: A new HTTPS connection costs a TCP handshake (one round trip) and a TLS 1.3 handshake (one more) before the request's own round trip. Connection reuse skips both for every later request; HTTP/2 goes further and sends many requests at once over that one connection. In code, that means one shared OkHttpClient, because each client has its own connection pool.
---

## The problem

Puzzle 1 said one request costs one round trip. You measure your first API call of the day on a 250 ms network: it takes about three times that. The next calls are fast. What did the first one pay for?

## See it

```diagram reuse
```

## The building block

Before HTTPS can carry a request, two handshakes happen on a new connection:

1. **TCP handshake:** client and server agree to talk. One round trip before any data flows.
2. **TLS handshake:** the key agreement from the Encryption course. TLS 1.3 needs one more round trip.
3. Then your request and its answer: the round trip from puzzle 1.

So a first request on a new connection costs about three round trips: 750 ms on that network, for a few kilobytes.

**Connection reuse** keeps the connection open and sends the next request over it. Both handshakes are skipped: one round trip, as in puzzle 1.

**HTTP/2** goes further. With HTTP/1.1, a connection carries one request at a time. HTTP/2 does **multiplexing**: many requests and responses interleaved on one connection, all in flight at once. That's what makes "send them together" from puzzle 1 cheap.

In an Android app, OkHttp (under Retrofit) does both for you, with one condition: use one `OkHttpClient` for the whole app. Each client keeps its own **connection pool**, the set of connections it keeps open for reuse; a new client per screen, or per request, starts cold and pays the handshakes again. For per-call settings, use `client.newBuilder()`: the new client shares the original's pool. (HTTP/3, over QUIC, goes further and combines both handshakes into one round trip.)

## The analogy

Phoning a busy office. The first call, you go through the switchboard and prove who you are (the handshakes). After that, you stay on the line and ask everything you need. With HTTP/2, you can even ask several questions without waiting for each answer. Hang up after every question, and you start at the switchboard again.

## Check yourself

- On a 250 ms network, the first HTTPS request on a new connection takes about 750 ms. Why?::*Two handshakes, TCP then TLS, each cost a round trip before the request's own||The server is slow to answer the first request of the day >> The extra time is two round trips of handshakes, not the server. >> s2||The first request carries the app's certificate, which is large >> Size barely matters here; the cost is round trips. >> s2::Three round trips: TCP, TLS, then the request.
- A screen creates a new `OkHttpClient` for each request. What does that cost?::*Every request may open a new connection and pay both handshakes again||Nothing, because OkHttp shares connections across all clients >> Each client holds its own connection pool, so nothing is shared. >> s4||Only memory, since the handshakes are cached by Android >> The handshakes happen per connection, and a new client has none open. >> s4::One client, one pool, connections reused.
- What's the difference between connection reuse and HTTP/2 multiplexing?::*Reuse sends later requests over an open connection, while multiplexing sends many at once over it||Reuse sends many requests at once, while multiplexing keeps a connection open for later >> That's the two swapped. >> the-building-block::One after another vs all at once, both skipping handshakes.

## Sources

- [High Performance Browser Networking: Building blocks of TCP](https://hpbn.co/building-blocks-of-tcp/) ("each new connection will have a full roundtrip of latency before any application data can be transferred"; "The delay imposed by the three-way handshake makes new TCP connections expensive to create, and is one of the big reasons why connection reuse is a critical optimization")
- [RFC 8446, TLS 1.3](https://www.rfc-editor.org/rfc/rfc8446) (the full handshake is the "1-RTT handshake")
- [High Performance Browser Networking: HTTP/2](https://hpbn.co/http2/) ("The primary goals for HTTP/2 are to reduce latency by enabling full request and response multiplexing")
- [OkHttp README and OkHttpClient docs](https://github.com/square/okhttp) ("HTTP/2 support allows all requests to the same host to share a socket"; "OkHttp performs best when you create a single OkHttpClient instance and reuse it for all of your HTTP calls. This is because each client holds its own connection pool and thread pools.")
