---
title: A fingerprint for data
short: Hashes
summary: In puzzle 0, a machine in the middle could change data on its way, and encryption alone wouldn't notice. Here's the block that makes any change visible.
takeaway: SHA-256 maps data to a 256-bit digest. Accidental collisions are extremely unlikely, while a deliberately matching input is impractical to find. A trusted expected digest lets the receiver check what arrived.
---

## The problem

In puzzle 0, a machine in the middle could do three things. Encryption stopped it reading. But it can still flip bytes in the ciphertext as it passes. The result decrypts to garbage, or to something slightly different, and nothing on the other side checks. How would anyone notice that the data was changed on the way?

## See it

```diagram hash
```

## The building block

A **hash function** turns any amount of data, a word or a whole video, into a short number of fixed size: its **digest**, a fingerprint of the data. The standard one, **`SHA-256`**, always produces 256 bits.

Three properties make it useful:

- the same data always gives the same digest;
- a small input change typically changes many digest bits;
- for SHA-256, finding a matching input for an arbitrary digest or deliberately finding two inputs with the same digest is computationally infeasible with known practical methods. Collisions must exist because fixed-size digests describe many more possible inputs.

So if you know the digest the data should have, you can check it: hash what arrived, compare. Different digest: something changed it.

There's a catch. If the attacker can change the data, it can also change a digest sent next to it: it hashes its own version and sends that digest instead. A digest helps only if the attacker can't make a matching one.

Two ways close that gap. If both sides already share a secret key, they can mix it into the fingerprint, so only they can make one: that's the next puzzle. Before there's a shared key, puzzle 7 makes a mark that only the real sender can produce.

## The analogy

A fingerprint. It's tiny compared to the person, the same every time, different for everyone, and you can't build a person to match a given print. Compare prints, and you know whether it's the same person.

## Check yourself

- One bit of a 10 MB file is flipped on the way. What happens to its `SHA-256` digest?::*It will almost certainly differ, revealing the change||It changes by one bit, matching the one bit that changed >> A hash doesn't map bits to bits: one flipped bit changes the whole digest. >> s3||It stays the same, because one bit is too small to matter >> Even a one-bit change is overwhelmingly likely to give a different digest. >> s3::One bit changed, a different digest.
- Why can't an attacker just make new data that has the expected digest?::*Because finding a matching input is infeasible||Because the digest is encrypted with AES on the way >> The digest's strength is in the hash function itself, not in AES. >> the-building-block::Going from digest back to data is the hard direction.
- What's the difference between a digest and ciphertext?::*A digest can't be turned back, while ciphertext can, with the key||A digest is ciphertext made with a shorter key >> A hash uses no key at all, and there's no way back from a digest. >> s1||Ciphertext is shorter than a digest >> Ciphertext is about as long as the data; a digest is always the same short size. >> s2::A fingerprint vs locked data.

## Sources

- [NIST FIPS 180-4: Secure Hash Standard](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.180-4.pdf) ("the result is an output called a message digest… it is computationally infeasible 1) to find a message that corresponds to a given message digest, or 2) to find two different messages that produce the same message digest. Any change to a message will, with a very high probability, result in a different message digest.")
