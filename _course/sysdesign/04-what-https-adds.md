---
title: What HTTPS adds
short: TLS as a black box
summary: Every request your app makes is encrypted. That adds three promises on top of TCP, and one more step before the first byte. Here's what you get and what it costs, without the cryptography.
takeaway: HTTPS is HTTP sent through TLS. TLS gives three promises: encryption (nobody on the way can read it), integrity (nobody can change it unnoticed) and authentication (you're really talking to the server you named, proven by its certificate). To set that up, client and server run a TLS handshake when the connection opens; in TLS 1.3 it costs one round trip, on top of TCP's.
---

## The problem

Puzzle 0 said TLS "encrypts the stream" and moved on. On the café's Wi-Fi, every router between the phone and your server sees your packets. What exactly stops them from reading or changing a request, or from pretending to be your server? And what does that protection cost?

## See it

```diagram tls
```

## The building block

**HTTPS** is ordinary HTTP sent through TLS, Transport Layer Security, which sits between HTTP and TCP. TLS gives three promises:

1. Encryption: anyone on the way sees only scrambled bytes.
2. Integrity: a changed byte is detected, and the data is rejected.
3. Authentication: you're talking to the server you named, not an impostor. The server proves it with a **certificate**: a document, signed by an authority your phone already trusts, that says "this key belongs to api.example.com".

To set this up, client and server run a **handshake** when the connection opens: they agree on keys and the server shows its certificate. In TLS 1.3, the current version, that takes one round trip, on top of TCP's own.

You don't write any of it: OkHttp and Android do it for you. What you need to know is that it happens once per new connection, and that it costs a round trip, which is why the next puzzle cares so much about reusing connections. (How the keys are agreed in public, and how a certificate can be trusted, is the Encryption course.)

## The analogy

A sealed envelope (encryption), with a wax seal that breaks if anyone opens it (integrity), sent to an office that shows an ID card issued by an authority you trust (authentication). Agreeing on the envelope and checking the ID takes one exchange before the first real letter.

## Check yourself

- A router on the café Wi-Fi changes one byte of your HTTPS response. What happens?::*TLS detects the change, so the data is rejected||The app receives the changed byte and shows it >> Integrity means a change is detected, not passed on. >> s3||Nothing, because routers can't touch HTTPS packets >> They can tamper; TLS makes tampering detectable. >> s3::Integrity: changes are caught.
- What does the TLS handshake cost on a new connection?::*One extra round trip in TLS 1.3, on top of TCP's||Nothing, because encryption happens on the phone >> Agreeing on keys needs an exchange with the server: a round trip. >> s4||A round trip for every request on the connection >> It happens once, when the connection opens. >> s4::Once per connection, one round trip.
- What's the difference between encryption and authentication in TLS?::*Encryption hides the data, while authentication proves who the server is||Encryption proves who the server is, while authentication hides the data >> That's the two swapped. >> the-building-block::Secret vs identity.

## Sources

- [High Performance Browser Networking: Transport Layer Security](https://hpbn.co/transport-layer-security-tls/) ("The TLS protocol is designed to provide three essential services to all applications running above it: encryption, authentication, and data integrity"; "As part of the TLS handshake, the protocol also allows both peers to authenticate their identity")
- [RFC 8446, TLS 1.3](https://www.rfc-editor.org/rfc/rfc8446) (the full handshake is the "1-RTT handshake")
