# Review log: Encryption, from the ground up

Every course-clarity run adds a row. Pass bar: lint clean, every puzzle and diagram at least 8.

| Date | Version | Lint | Scores | What the review found → what changed |
|---|---|---|---|---|
| 2026-11-16 | v1: module 1 (6 puzzles) | clean | text: 8 · 7 · 7 · 8 · 5 · 5 — pictures: 6 · 6 · 6 · 8 · 4 · 5 | Correctness: P5 had TLS 1.3's order wrong (the certificate and signature travel encrypted, after the key exchange: RFC 8446 "Everything after this phase is encrypted"); the per-record check is keyed (AEAD), not a plain hash; P4's "lock the digest with the private key" fits RSA only and suggested signing is encrypting; P1 implied AES scrambles each block alone. Clarity: key pairs never introduced as a new kind of key; nothing said authorities check who owns a name, or that certificates are public. → All rewritten from the RFC; key pair term added; TLS diagram redrawn in the real order. Re-review running. |
