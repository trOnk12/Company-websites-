---
title: Proof of who you are
short: Signatures and certificates
summary: In puzzle 2, the key exchange worked with whoever answered, and in puzzle 3 an attacker could swap a digest. Both gaps close the same way: a stamp only the real server can make.
takeaway: A key pair is a private key the owner keeps and a public key anyone may have. Signing locks a digest with the private key; anyone can check it with the public key, and nobody can fake it without the private key. A certificate is a server's name and public key, signed by a certificate authority your phone already trusts.
---

## The problem

Two gaps are open. In puzzle 2, your app agreed on a secret with whoever answered, which might be the listener pretending to be your server. In puzzle 3, a digest only helped if the attacker couldn't swap it. Both come down to one question: how does your app know that something really comes from your server?

## See it

```diagram signature
```

## The building block

The server has a key pair: a **private key** it never shows anyone, and a **public key** anyone may have. They're made together, and they work as a pair:

- To make a **signature**, the server hashes the data (puzzle 3) and locks the digest with its private key.
- Anyone with the public key can check it: unlock the signature, hash the data themselves, compare. They match only if the signature was made with the matching private key and the data hasn't changed.
- Without the private key, nobody can make a signature that checks out. Not the listener, not anyone.

So a signature proves two things at once: who sent it, and that it wasn't changed.

That moves the question: how does your app know which public key is really your server's? A listener could hand over its own. The answer is a **certificate**: a small document with your server's name and its public key, signed by a **certificate authority**, an organization whose public key is already built into your phone. Your app checks the authority's signature on the certificate, checks the name matches your server, and from then on trusts that public key.

Note the look-alike from puzzle 2: a key exchange's private value is thrown away after one connection; a server's private key is kept for years and proves who it is.

## The analogy

A wax seal. Only the king has the seal (private key), but everyone knows what it looks like (public key), so anyone can check a letter is really his and unopened. And how do you know what the king's seal looks like? A register kept by someone you already trust (the certificate authority) shows it, with the king's name beside it.

## Check yourself

- A listener answers in your server's place and sends its own certificate for your server's name. What does your app see?::*No trusted authority signed it, so the check fails and the app refuses||A valid certificate, because it has the right name on it >> The name isn't enough: the signature on it must check out with an authority's public key. >> s4||A valid certificate, if the listener copied the server's public key >> The listener can copy the public key, but can't make the signature without the private key. >> s3::Only an authority's signature makes a certificate trusted.
- Why can't anyone make a signature that checks out with your server's public key?::*It takes the private key, which never leaves the server||Because public keys are kept secret by the phone >> Public keys are meant to be shared; the protection is the private key. >> s1||Because each signature is encrypted again with AES >> Signing doesn't need AES; it's the private key that makes it unforgeable. >> s2::No private key, no valid signature.
- What's the difference between a server's private key and a key exchange's private value?::*The private key lasts years and proves identity; a private value is used once||They're the same number, used once for the exchange and once to sign >> They're separate: one proves identity, the other makes this connection's secret. >> the-building-block::Long-lived identity vs one-time secret.

## Sources

- [RFC 8446: TLS 1.3, section 4.4.2 Certificate and section 4.4.3 Certificate Verify](https://www.rfc-editor.org/rfc/rfc8446) (CertificateVerify "is used to provide explicit proof that an endpoint possesses the private key corresponding to its certificate"; authentication "can happen via asymmetric cryptography (e.g., RSA, … ECDSA, … EdDSA)")
- [NIST FIPS 180-4: Secure Hash Standard](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.180-4.pdf) ("Secure hash algorithms are typically used with other cryptographic algorithms, such as digital signature algorithms")
