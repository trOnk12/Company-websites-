---
title: The man in the middle
short: Two exchanges, one listener
summary: Puzzle 3 ended with a gap: a key exchange gives you a secret shared with whoever answered. Here's the attack that fills that gap, step by step, and the one thing that would stop it.
takeaway: A man in the middle intercepts the key exchange and runs two: one with your app, pretending to be the server, and one with the server, pretending to be your app. Each side ends with a shared secret, but shares it with the attacker, who decrypts, reads or changes everything, and re-encrypts it. Encryption doesn't help. What stops it is proof of who sent the public values: a signature, puzzle 7.
---

## The problem

Puzzle 3's key exchange gives your app and "the server" a secret nobody else can compute from the public values. But who sent the public value your app received? The phone can't see a server; it only sees bytes arriving. What can someone in the middle do with that?

## See it

```diagram mitm
```

## The building block

The listener from puzzle 0 now acts. It sits between your app and the server and intercepts the key exchange:

1. Your app sends its public value. The attacker keeps it, and sends the server its own public value instead, pretending to be your app.
2. The server answers with its public value. The attacker keeps it, and sends your app its own, pretending to be the server.
3. Your app computes a shared secret with the attacker. The server computes a different shared secret with the attacker. Neither knows.

This is a **man-in-the-middle attack**. From now on the attacker decrypts each message with one secret, reads it or changes it, encrypts it again with the other secret, and passes it on. Both sides see working encryption, and every byte goes through the attacker.

Encryption didn't fail: it worked perfectly, with the wrong party. What's missing is proof that the public value really came from your server. That proof needs something only the real server can produce, which the attacker can't fake: puzzle 7 builds it, and HTTPS uses it on the exchange itself, so a swapped public value is caught.

## The analogy

Two people agree to post locked boxes to each other, but a postman intercepts both. He gives each of them his own box to lock their message into, opens each one with his key, reads it, re-locks it in the other person's box, and passes it on. Both believe the box was the other person's.

## Check yourself

- In a man-in-the-middle attack, who does your app share its secret with?::*The attacker, who answered in the server's place||The server, because the key exchange guarantees it >> The exchange only guarantees a secret with whoever answered. >> s3||Nobody, since the attacker blocks the exchange >> The exchange succeeds; it just succeeds with the attacker. >> s3::With whoever answered.
- Why doesn't encryption stop a man in the middle?::*The attacker holds both secrets||The attacker breaks AES by trying keys on enough computers >> It doesn't need to break anything; it has the keys. >> s4||The two shared secrets are too short to be safe >> Length doesn't matter if you share the secret with the wrong party. >> s4::Encrypted, but to the wrong party.
- What's the difference between a listener and a man in the middle?::*A listener only reads what passes, while a man in the middle runs both exchanges and relays||A listener runs both exchanges and relays, while a man in the middle only reads what passes >> That's the two swapped. >> the-building-block::Watching vs standing in between.

## Sources

- [RFC 4949, Internet Security Glossary](https://www.rfc-editor.org/rfc/rfc4949) ("man-in-the-middle attack: A form of active wiretapping attack in which the attacker intercepts and selectively modifies communicated data to masquerade as one or more of the entities"; with an unauthenticated Diffie-Hellman exchange, the attacker could "establish separate session keys with each of them, and … function as a clandestine proxy server between them")
