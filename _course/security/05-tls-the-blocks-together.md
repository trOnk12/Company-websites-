---
title: "TLS: the blocks together"
short: TLS
summary: Puzzles 0 to 4 each stopped one thing a machine in the middle could do. The S in HTTPS is those blocks put together in one short conversation before your first request.
takeaway: A TLS handshake does a key exchange, has the server prove who it is with its certificate and a signature, and turns the shared secret into symmetric keys. Everything after that is encrypted with an AES-style cipher that also detects changes. Reading, changing and pretending are all stopped.
---

## The problem

Puzzle 0 named three things a machine in the middle can do: read, change, pretend. Puzzles 1 to 4 each built one block: symmetric encryption, key exchange, hashes, signatures and certificates. Your app opens an https address and sends a request a moment later. How do all those blocks fit into that moment?

## See it

```diagram tls
```

## The building block

**TLS** is the protocol behind HTTPS. Before any of your data is sent, the app and the server have a short exchange: the **handshake**. In TLS 1.3 it takes one round trip:

1. Your app says hello and sends its public value for a key exchange (puzzle 2).
2. The server answers with its own public value, its certificate (puzzle 4), and a signature over the whole conversation so far, made with its private key.
3. Your app checks the certificate against the authorities it trusts, checks the name, and checks the signature. Now it knows it's talking to your server, and that nobody changed the handshake on the way.
4. Both sides compute the shared secret and turn it into symmetric keys (puzzle 1).

From then on, every request and response is encrypted with an AES-style cipher that also adds a check value to every record, built on the same idea as a hash (puzzle 3), so any change on the way is detected. Reading: stopped by encryption. Changing: stopped by the check on every record. Pretending: stopped by the certificate and the signature.

TLS doesn't hide everything: someone in the middle still sees which server you talk to and how much data goes back and forth. It hides what is said, and makes sure it's said to the right server.

## The analogy

A courier and a bank: first the bank shows its registered seal and you both agree on a code, in plain sight but in a way no one listening can copy. Then every envelope goes out in that code, sealed so any tampering shows.

## Check yourself

- Your app connects to your server over HTTPS on the café Wi-Fi. A machine in the middle replaces one byte of the response. What happens?::*The check on that record fails, so your app rejects it instead of using it||Your app uses the slightly changed response without noticing >> Every record carries a check value; a changed byte makes it fail. >> s4||Nothing, because the change is encrypted too >> Encryption alone wouldn't notice; the per-record check is what catches it. >> s4::Every record is checked as well as encrypted.
- Why does the server sign the handshake, not only send its certificate?::*Anyone can copy a certificate; only the private key can sign||Because the certificate is too big to send in one handshake >> Size isn't the issue: a copied certificate proves nothing without a signature. >> s2||Because the signature is what encrypts the data afterwards >> The data is encrypted with symmetric keys from the key exchange, not with the signature. >> s3::A certificate can be copied; a signature can't.
- What's the difference between the handshake and everything after it?::*The handshake sets up keys and proves identity; after it, data uses those keys||The handshake is encrypted with the server's private key; the rest isn't >> Afterwards everything is encrypted, with symmetric keys from the key exchange. >> s4::Setting up vs using.

## Sources

- [RFC 8446: TLS 1.3](https://www.rfc-editor.org/rfc/rfc8446) (the handshake: key exchange "(EC)DHE"; server authentication with Certificate and CertificateVerify; "application-layer data protected through authenticated encryption"; "TLS does not hide the length of the data it transmits"; the 1-RTT handshake)
