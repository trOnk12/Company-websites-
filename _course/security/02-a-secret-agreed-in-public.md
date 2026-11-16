---
title: A secret agreed in public
short: Key exchange
summary: In puzzle 1, AES needed the same key on both sides, and sending it would hand it to the listener. Here's how two sides agree on a secret while every word they say is overheard.
takeaway: In a key exchange, each side keeps a private value and sends a public value made from it. Each combines its own private value with the other's public value, and both get the same shared secret. The listener sees only the public values and can't compute it. But it doesn't tell you who you agreed with.
---

## The problem

In puzzle 1, your app and your server needed the same AES key, and sending it would give it to the listener from puzzle 0. Everything they say crosses the café Wi-Fi in plain sight. Is it even possible to agree on a secret when someone hears every word?

## See it

```diagram exchange
```

## The building block

It is, with a **key exchange**. The idea, in the form called Diffie–Hellman, which HTTPS uses:

1. Each side picks a random number and keeps it to itself: its **private value**.
2. From it, each computes a **public value** and sends it openly. Going from private to public is easy; going back, from the public value to the private one, is a problem nobody knows how to solve in any useful time.
3. Each side combines **its own private value** with **the other side's public value**. The math works out so both get the same number: the **shared secret**.

The listener has both public values, but neither private one, and with only public values there's no known way to compute the shared secret. So both sides now share a secret nobody else has, and the keys for AES from puzzle 1 are derived from it: computed from it in a fixed way both sides follow (puzzle 5). Once the connection ends, both private values are thrown away, so every connection gets fresh ones.

Mixing paint gives the feel of it. Both start from the same yellow, agreed in public. Each mixes a secret color into it and sends the mix. Each then adds its own secret color to the other's mix. Both end with the same brown; the listener, holding only the two mixes, can't un-mix them.

One gap is left: the exchange tells you that you share a secret with whoever answered, not who that is. If the listener answers in your server's place, you've agreed a secret with the listener. Puzzle 4 closes that gap.

## The analogy

The paint, above: two people end up with the same color, and someone watching every mix travel between them still can't make it.

## Check yourself

- The listener records both public values from a key exchange. What can it do with them?::*Nothing useful: without a private value, it can't compute the shared secret||Combine the two public values to get the shared secret >> Getting the secret needs one private value; public values alone don't give it. >> s3||Work back from a public value to its private value with enough patience >> Going back is a problem nobody knows how to solve in any useful time. >> s2::Public values alone don't give the secret.
- Why does each side keep its private value to itself?::*Because with it, anyone could compute the shared secret||Because the private value is the AES key itself, used as is >> The AES key comes from the shared secret, which both sides compute; the private value never leaves. >> s4::The private value is what makes the secret yours.
- What's the difference between a public value and the shared secret?::*The public value is sent openly, while the shared secret never is||The shared secret is the two public values joined together >> If it were, the listener would have it; it's computed with a private value. >> s3||The public value is the shared secret, sent early >> The secret is computed after both public values arrive, and never travels. >> s4::Sent openly vs never sent.

## Sources

- [RFC 8446: TLS 1.3, section 4.2.8 and section 7.4](https://www.rfc-editor.org/rfc/rfc8446) (the key exchange modes include "(EC)DHE (Diffie-Hellman over either finite fields or elliptic curves)"; section 7.4, "(EC)DHE Shared Secret Calculation")
