---
title: One key for both
short: Symmetric encryption
summary: In puzzle 0, encryption turned the password into gibberish. Here's how the standard way does it, why it's fast, and the one problem it leaves open.
takeaway: In symmetric encryption, the same key locks and unlocks. AES, the standard, encrypts in blocks of 128 bits with a key of 128, 192 or 256 bits; it's fast enough for everything you send. Its open problem: both sides need the same key, and you can't just send it.
---

## The problem

In puzzle 0, encryption turned the password into ciphertext with a key. Your app and your server will send thousands of messages: every request, every response, every image. Whatever does the encrypting has to be fast, and both sides have to be able to undo it. What does that look like?

## See it

```diagram aes
```

## The building block

The simplest arrangement: one key, and it works both ways. Encrypt with it, decrypt with the same key. That's **symmetric encryption**.

The standard one is **AES**. It takes the data in **blocks of 128 bits** (16 bytes) and scrambles each with the key, in rounds of mixing and substituting, in a way that can only be undone with that same key. Keys come in three sizes: 128, 192 or 256 bits. A 128-bit key has 2^128 possible values: far more than any computer could ever try, which is why guessing it isn't a way in.

AES is fast, and phones have instructions built for it, so it can encrypt everything you send. That's why, as puzzle 5 shows, even HTTPS uses it for all the actual data.

But it leaves one problem. Your app and your server both need the same key. You can't send it over the line from puzzle 0: the listener would copy it, and then decrypt everything. And you can't build one key into every copy of your app: anyone could pull it out of the APK. How do two sides get the same key, when everything they say can be heard? That's puzzle 2.

## The analogy

A box with one lock and one key, cut twice. Lock it with your copy, your friend opens it with theirs. The box is fast and strong. The hard part is getting the second copy of the key to your friend without anyone on the way copying it.

## Check yourself

- Your app encrypts a 1 MB photo with AES. Roughly how does AES handle it?::*In 128-bit blocks, one after another, all with the same key||In one go, because the key is as long as the photo >> The key is 128 to 256 bits; AES works through the data in 128-bit blocks. >> s2||In 128-bit blocks, each with its own new key >> Every block uses the same key; a new key per block would need its own way to share. >> s2::Fixed-size blocks, one key.
- Why can't your app just send the AES key to the server first?::*The listener would copy the key, then decrypt everything after it||Because AES keys are too long to send in one message >> A key is only 16 to 32 bytes; the problem is who can see it on the way. >> the-building-block||Because the server makes its own AES key, never the app >> Either side could make it; the problem is sending it where others can hear. >> the-building-block::Anything sent openly, the listener gets too.
- What's the difference between a 128-bit block and a 128-bit key?::*The block is data scrambled at a time; the key does the scrambling||The key is the first block of the data, reused for the rest >> The block is your data; the key is separate, and must stay secret. >> s2::Data piece vs secret.

## Sources

- [NIST FIPS 197: Advanced Encryption Standard (AES)](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.197-upd1.pdf) ("The AES algorithm is a symmetric block cipher that can encrypt (encipher) and decrypt (decipher) digital information. The AES algorithm is capable of using cryptographic keys of 128, 192, and 256 bits to encrypt and decrypt data in blocks of 128 bits.")
