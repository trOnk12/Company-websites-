---
title: A hash with a secret
short: Message authentication codes
summary: Puzzle 5 showed a fingerprint anyone can recompute, so an attacker who changes the data just sends a new fingerprint. Add a key that only the two sides have, and the fingerprint becomes something only they can make.
takeaway: A MAC (message authentication code) is a short value computed from the data and a secret key together; HMAC builds one from a hash function. The sender attaches it as a tag; the receiver, who has the same key, recomputes it and compares. An attacker who changes the data can't compute the matching tag without the key, so any change is caught. TLS protects every chunk of your data this way.
---

## The problem

Puzzle 5's hash catches accidental changes. But an attacker who changes the data can hash the changed data and send that digest instead. If both sides already share a secret key (puzzle 3 got them one), can they make a fingerprint the attacker can't forge?

## See it

```diagram mac
```

## The building block

A **MAC**, message authentication code, is a short value computed from two inputs: the data and a secret key. The most common way to build one is **HMAC**: it runs a hash function like SHA-256 over the data mixed with the key, in a fixed recipe.

How it's used:

1. The sender computes the MAC of the data with the shared key and attaches it: the **tag**.
2. The receiver, who has the same key, computes the MAC of the data it received and compares it with the tag.
3. Equal: the data is unchanged and came from someone with the key. Different: reject it.

An attacker who changes the data would need a new tag that matches, and making one needs the key. Without it, there's no known way.

Compare the tools so far: a hash anyone can compute; a MAC only key holders can compute. And both sides hold the same key, so a MAC proves "one of us made this", not which one: proving who, to anyone, needs puzzle 7.

## The analogy

A wax seal pressed with a ring that only you and your friend own. Anyone can melt the seal and change the letter, but without the ring they can't press a new seal that looks right.

## Check yourself

- The attacker changes a message and computes a fresh SHA-256 digest of it. With a MAC in use, what happens?::*The receiver rejects it: the tag needs the key, which the attacker lacks||It passes, because the digest matches the changed message >> A plain digest isn't the check here; the tag needs the secret key. >> s3||It passes only if the change is small >> Any change needs a new tag, and that needs the key. >> s3::No key, no valid tag.
- Both sides share the MAC key. What can't a MAC prove?::*Which of the two sides made it||That the data is unchanged >> That's exactly what it proves. >> s4||That a key holder made it >> It proves that; it can't say which holder. >> s4::One of us, not which one.
- What's the difference between a hash and a MAC?::*Anyone can compute a hash, while only holders of the key can compute a MAC||Only holders of the key can compute a hash, while anyone can compute a MAC >> That's the two swapped. >> the-building-block::Public vs keyed.

## Sources

- [RFC 2104, HMAC](https://www.rfc-editor.org/rfc/rfc2104) ("This document describes HMAC, a mechanism for message authentication using cryptographic hash functions")
