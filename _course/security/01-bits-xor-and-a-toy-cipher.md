---
title: Bits, XOR and a toy cipher
short: The smallest cipher
summary: Puzzle 0 said encryption turns data into gibberish with a key. Before any real cipher, here's the one operation every cipher you'll meet ends with, and a complete cipher you can do by hand.
takeaway: Data is bits, and a key is a string of bits too. XOR combines two bits: 0 if they're equal, 1 if they differ; XOR the same key in twice and you're back where you started. A one-time pad XORs each data bit with a key bit: perfectly secret if the key is random, as long as the data, and used once. Reuse the key, and XORing two ciphertexts cancels it, leaking the two messages XORed together.
---

## The problem

Puzzle 0 said a key turns data into gibberish and back. That's a black box. How can a number possibly hide a message, and get it back exactly?

## See it

```diagram xor
```

## The building block

Everything your app sends is **bits**: zeros and ones, eight to a byte. A key is bits too.

**XOR** (exclusive or) combines two bits: the result is 0 if they're equal, 1 if they differ. Do it bit by bit to two strings:

| | |
|---|---|
| data | `0101` |
| key | `0011` |
| data XOR key | 0110 |
| … XOR key again | `0101`, the data |

XOR with the same key twice gives you back what you started with. That's a cipher: XOR the data with the key to encrypt, XOR the result with the key again to decrypt.

If the key is truly random, as long as the data, and used only once, that's a **one-time pad**: every possible message is equally likely from the ciphertext, so the listener learns nothing at all.

Its weakness is the "once". Use the same key for two messages, and the listener XORs the two ciphertexts: the key cancels out, leaving the two messages XORed together, which is often enough to read both.

Real ciphers keep the XOR and fix the key problem: from one short key they generate a long, fresh stream of key bits, a **keystream**, different for every message. The next puzzle shows a real cipher doing exactly that.

## The analogy

A stencil of random holes over a page of letters: shift each letter where there's a hole, leave it where there isn't. With the same stencil, the friend undoes it exactly. Use the stencil twice, and overlaying the two pages shows where they differ.

## Check yourself

- Data 1100, key 1010. What is data XOR key?::*0110: 1 where the bits differ, 0 where they're equal||1110: 1 wherever at least one of the two bits is 1 >> That's OR; XOR gives 0 when both bits are 1. >> s2||1000: 1 only in places where both bits are 1 >> That's AND; XOR gives 1 where the bits differ. >> s2::Different gives 1, equal gives 0.
- The same one-time pad key encrypts two messages. What can the listener do?::*XOR the two ciphertexts, cancelling the key||Nothing more than before, since the key itself is still secret >> The key cancels out when the two ciphertexts are combined. >> s4||Read the whole key straight out of either ciphertext >> Not directly; the leak comes from combining the two. >> s4::Reusing the key cancels it.
- What's the difference between a one-time pad key and a keystream?::*A one-time pad key is fully random and as long as the data, while a keystream is generated from a short key||A one-time pad key is generated from a short key, while a keystream is fully random and as long as the data >> That's the two swapped. >> the-building-block::Truly random vs generated.

## Sources

- [NIST SP 800-38A](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38a.pdf) (exclusive-OR: "The bitwise addition, modulo 2, of two bit strings of equal length")
- [RFC 4949, Internet Security Glossary](https://www.rfc-editor.org/rfc/rfc4949) (one-time pad: "An encryption algorithm in which the key is a random sequence of symbols and each symbol is used for encryption only one time")
