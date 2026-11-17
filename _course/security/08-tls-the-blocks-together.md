---
title: TLS, the blocks together
short: TLS
summary: Puzzles 0 to 7 each stopped one thing a machine in the middle could do. The S in HTTPS is those blocks put together in one short conversation before your first request.
takeaway: A TLS handshake does a key exchange, has the server prove who it is with its certificate and a signature, and turns the shared secret into symmetric keys. Everything after that is encrypted with an AES-style cipher that also detects changes. Reading, changing and pretending are all stopped.
---

## The problem

Puzzle 0 named three things a machine in the middle can do: read, change, pretend. Puzzles 1 to 7 each built one block: symmetric encryption, key exchange, hashes, signatures and certificates. Your app opens an https address and sends a request a moment later. How do all those blocks fit into that moment?

## See it

```diagram tls
```

## The building block

**TLS** is the protocol behind HTTPS: a set of agreed messages and rules. Before any of your data is sent, the app and the server have a short exchange: the **handshake**. In TLS 1.3 (the current version) it takes one round trip, there and back:

1. Your app says hello and sends its public value for a key exchange (puzzle 3).
2. The server answers with its own public value. Now both sides compute the shared secret, and from it they derive several keys (computed from it by a fixed recipe both sides follow): one set for the rest of the handshake, another for your data. From this point on, everything is encrypted.
3. Still in the handshake, but now encrypted, the server sends its certificate (puzzle 7) and a signature over the whole conversation so far, made with its private key.
4. Your app checks the certificate against the authorities it trusts, checks the name against the address, and checks the signature. A listener with a copied certificate fails here: it can't make that signature.
5. Both sides end the handshake with a MAC (puzzle 6) over everything said so far, called Finished. Only now does each know that nobody changed the handshake on the way.

Then your data flows in records: chunks of data, each sent and checked on its own. Each record goes through one combined step, called authenticated encryption, for example AES in a mode built for it: it encrypts the record and attaches a MAC (puzzle 6), called a tag, both computed with keys derived from the shared secret. A listener who changes a byte can't make a matching tag, because it doesn't have the keys, so the change is detected and the record rejected. Reading: stopped by encryption. Changing: stopped by the tag on every record. Pretending: stopped by the certificate and the signature.

TLS doesn't hide everything: someone in the middle still sees which server you talk to and how much data goes back and forth. It hides what is said, and makes sure it's said to the right server.

## The analogy

A courier and a bank: first the bank shows its registered seal and you both agree on a code, in plain sight but in a way no one listening can copy. Then every envelope goes out in that code, sealed so any tampering shows.

## Check yourself

- Your app connects to your server over HTTPS on the café Wi-Fi. A machine in the middle replaces one byte of the response. What happens?::*The MAC on that record fails, so your app rejects it||Your app uses the slightly changed response without noticing >> Every record carries a keyed check; a changed byte makes it fail, and the listener can't recompute it. >> s4||Nothing, because the change is encrypted too >> Encryption alone wouldn't notice; the per-record check is what catches it. >> s4::Every record is checked as well as encrypted.
- Why does the server sign the handshake, not only send its certificate?::*Because certificates are public and copyable, but only the private key can sign||Because the certificate is too big to send in one handshake >> Size isn't the issue: a copied certificate proves nothing without a signature. >> s2||Because the signature is what encrypts the data afterwards >> The data is encrypted with symmetric keys from the key exchange, not with the signature. >> s3::A certificate can be copied; a signature can't.
- What's the difference between the handshake and everything after it?::*The handshake sets up keys and proves identity; then data uses those keys||The handshake is encrypted with the server's private key; the rest isn't >> Afterwards everything is encrypted, with symmetric keys from the key exchange. >> s4::Setting up vs using.

## Sources

- [RFC 8446: TLS 1.3](https://www.rfc-editor.org/rfc/rfc8446) (the handshake "can be thought of as having three phases": Key Exchange, "Everything after this phase is encrypted", then Server Parameters and Authentication with Certificate and CertificateVerify; "all ciphers are modeled as Authenticated Encryption with Associated Data (AEAD)… a unified encryption and authentication operation"; "TLS does not hide the length of the data it transmits")
