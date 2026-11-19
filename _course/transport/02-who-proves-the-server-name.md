---
title: Who proves the server’s identity?
short: Who proves the server’s identity?
summary: The phone can already exchange bytes. Work out what it must verify before trusting the peer with an application request.
takeaway: In a typical certificate-authenticated TLS 1.3 handshake, the certificate links an identity and key, CertificateVerify proves possession, and Finished binds the handshake to the derived secrets.
---

## The problem

The phone opens a TCP connection for api.example.com. A peer answers and offers to encrypt the conversation. How does the phone know it is encrypting data for the intended service?

## See it

```diagram who-proves-the-server-name
```

## The building block

**TLS** adds a protected channel over a transport. The TCP sequence numbers synchronize delivery and have no role in authenticating the service. Consider a full TLS 1.3 exchange with server certificate authentication. The client and server exchange key shares, public values used to derive shared secrets. The exchange also supports checks about who is on the other side. A **handshake transcript** is the ordered record of relevant handshake messages used in these checks. A cryptographic digest gives those messages a compact fingerprint for verification.

| Check | What it answers |
|---|---|
| Certificate validation | Is there a valid chain to a configured trust anchor, appropriate for server authentication, and does the service identity match the name the client intended to reach? |
| CertificateVerify | Can this peer make a valid digital signature over context-bound data derived from a cryptographic digest of the handshake transcript, using the private key matching the certificate? |
| Finished | Does this handshake transcript check out under a key derived from the handshake secrets? |

For server identity, validate against the expected service name, not merely a name asserted by the peer. A trusted certificate for images.example.com alone does not establish identity for api.example.com.

In the standard full server-authenticated case, the server sends its certificate, proof and Finished after the first server message that selects the connection parameters. Those authentication messages are protected by handshake keys. Once verification succeeds, the client ordinarily sends its own Finished and can send the first protected application request. This example leaves out resumed connections, early data, and client certificates.

## Go deeper: Separate private-key proof from identity

- A peer has the key for a valid images.example.com certificate. It passes the proof-of-possession check. Can a client expecting api.example.com trust it on that evidence alone?::The possession check says the peer controls that key. The client still needs the expected service name to match the presented identity.

## Check yourself

- The peer proves it owns a key for images.example.com. The phone asked for api.example.com. What fails?::*The expected service identity check||The generation of the phone’s initial TCP byte number >> The TCP setup can succeed regardless of the name. >> the-building-block||The proof of possession automatically fails >> Possession of that other service’s key can still be proved. >> the-building-block::Key ownership and the intended name are distinct checks.
- What additional evidence does CertificateVerify give beyond presenting a certificate?::*Proof of control of the matching key for this handshake||Proof that the initial TCP segment contained no private data >> The certificate proof concerns the TLS exchange. >> the-building-block||Proof that all later application responses will succeed >> Authentication does not guarantee an application outcome. >> the-building-block::The peer actively signs data tied to the exchange.
- What does the Finished message check?::*The transcript against a key derived from handshake secrets||The order of the application requests seen by the application >> The regular application request is a separate step. >> the-building-block||The expiration date printed inside the peer’s certificate >> Certificate validity is a separate verification step. >> the-building-block::Finished ties the transcript to the negotiated secrets.

## Sources

- [IETF RFC 8446: TLS 1.3 full handshake and authentication](https://www.rfc-editor.org/rfc/rfc8446.html#section-4.4)
- [IETF RFC 9525: service identity](https://www.rfc-editor.org/rfc/rfc9525.html#section-6)
