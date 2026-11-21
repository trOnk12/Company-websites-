---
title: Proof of who you are
short: Signatures and certificates
summary: In puzzle 3, the key exchange worked with whoever answered, and in puzzle 5 an attacker could swap a digest. Both gaps close the same way: a mark on the data that only the real server can make.
takeaway: A signature verifies possession of a private key and binds the signed content. To map the public key to a server name, the client validates its certificate chain, the intended name, validity and applicable trust policy.
---

## The problem

Two gaps are open. In puzzle 3, your app agreed on a secret with whoever answered, which might be the listener pretending to be your server. In puzzle 5, a digest only helped if the attacker couldn't swap it. Both come down to one question: how does your app know that something really comes from your server?

## See it

```diagram signature
```

## The building block

This needs a different kind of key from puzzle 2. There, one key did both jobs. Here the server has a **key pair**: two keys made together, a **private key** it never shows anyone and a **public key** anyone may have. What one does, only its partner can check. That's why this kind is also called asymmetric.

- To make a **signature**, the server hashes the data (puzzle 5) and runs the digest through a signing step that needs its private key.
- Anyone with the public key can check the signature against the data: it checks out only if it was made with the matching private key and the data hasn't changed since.
- Without the private key, nobody can make a signature that checks out. Not the listener, not anyone. (Signing isn't encrypting: the data stays readable; the signature only proves who made it and that it's unchanged.)

So a signature proves two things at once: who sent it, and that it wasn't changed. That closes puzzle 4's gap: in HTTPS, the server signs the key exchange, including its public value, so a swapped value from a man in the middle can't carry the server's signature.

That moves the question: how does your app know which public key is really your server's? A listener could hand over its own. The answer is a **certificate**: a small document with your server's name and its public key, signed by a **certificate authority**. An intermediate authority can sign the leaf certificate. The client validates a chain ending at a configured trust anchor. Before it signs, the authority checks that whoever asks really controls that name. Certificates aren't secret: your server shows its certificate to every visitor, so anyone can copy one. A certificate that cannot be validated against the client’s configured trust policy fails that check. Your app checks the authority's signature on the certificate, checks that the name matches the one in the address it asked for, and from then on trusts that public key. Puzzle 8 shows why a copied certificate alone gets the listener nowhere.

Note the look-alike from puzzle 3: a key exchange's private value is thrown away when the connection ends; a server signing key is used for authentication and can be rotated independently of the per-handshake key shares.

## The analogy

A wax seal. Only the king has the seal (private key), but everyone knows what it looks like (public key), so anyone can check a letter is really his and unopened. And how do you know what the king's seal looks like? A register kept by someone you already trust (the certificate authority) shows it, with the king's name beside it.

## Check yourself

- A listener makes its own certificate with your server's name and its own public key. What does your app see?::*No trusted authority signed it, so the check fails||A valid certificate, because the name on it is right >> The name isn't enough: the certificate must carry a trusted authority's signature. >> s4||A valid certificate, once the listener signs it itself >> Only a signature from an authority your phone trusts counts, and authorities check who controls the name. >> the-building-block::Only an authority's signature makes a certificate trusted.
- Why can't anyone make a signature that checks out with your server's public key?::*Because it takes the private key, which never leaves the server||Because public keys are kept secret by the phone >> Public keys are meant to be shared; the protection is the private key. >> s1||Because each signature is encrypted again with AES >> Signing doesn't need AES; it's the private key that makes it unforgeable. >> s2::No private key, no valid signature.
- What's the difference between a server's private key and a key exchange's private value?::*The private key lasts years and proves identity, while a private value is used once||They're the same number, used once for the exchange and once to sign >> They're separate: one proves identity, the other makes this connection's secret. >> the-building-block::Long-lived identity vs one-time secret.

## Sources

- [RFC 8446: TLS 1.3, section 4.4.2 Certificate and section 4.4.3 Certificate Verify](https://www.rfc-editor.org/rfc/rfc8446) (CertificateVerify "is used to provide explicit proof that an endpoint possesses the private key corresponding to its certificate"; authentication "can happen via asymmetric cryptography (e.g., RSA, … ECDSA, … EdDSA)")
- [NIST FIPS 180-4: Secure Hash Standard](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.180-4.pdf) ("Secure hash algorithms are typically used with other cryptographic algorithms, such as digital signature algorithms")
