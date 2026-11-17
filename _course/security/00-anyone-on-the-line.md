---
title: Anyone on the line
short: Why encrypt
summary: Your app sends a password to a server. Between the two sit a café's Wi-Fi, a phone operator and a dozen machines you don't control. Here's what any of them can do, and the first defence that stops it.
takeaway: Data crosses many machines on its way. Any of them can read it, change it, or pretend to be the other side. Encryption turns the data into ciphertext that only someone with the key can turn back, which stops the reading. The next puzzles stop the rest.
---

## The problem

Your app sends the user's password to your server. It doesn't fly there directly: it goes through the café's Wi-Fi, the internet provider, and many machines in between, each one passing it along. Every one of them sees every byte. What could one of them do with it?

## See it

```diagram wire
```

## The building block

Call any such machine the listener (or the attacker: same machine). It can do three things, and the later puzzles build the blocks that stop them:

- **read** what passes by: the password, the token, the card number;
- **change** it on the way: a different amount, a different account;
- **pretend** to be the other side: answer as if it were your server.

The first block stops the reading. **Encryption** turns data into gibberish that only someone holding the right **key**, a secret number, can turn back (decrypt). The gibberish is **ciphertext**. A machine in the middle still sees every byte, but they mean nothing to it.

Encryption alone doesn't stop the other two. Someone can still change ciphertext (the result is garbage, or quietly different data, and nobody notices unless something checks), and encryption with someone who is pretending to be your server protects nothing. Puzzles 5 to 7 add those checks. First, though: where does the key come from?

## The analogy

Sending a postcard through a chain of strangers. Anyone can read it. Write it in a code only your friend can read, and the strangers see nonsense. But a stranger could still scribble on it, or hand it to someone pretending to be your friend.

## Check yourself

- Your app sends a password, encrypted, over the café Wi-Fi. A machine in the middle copies every byte. What does it learn?::*Nothing useful: it has the ciphertext, not the key||The password, because it saw every byte that passed >> Seeing the bytes isn't enough: without the key, ciphertext is gibberish. >> s3||The password, but only if the Wi-Fi has no password >> The Wi-Fi's own password doesn't matter here: what matters is your data is encrypted. >> s3::Ciphertext without the key means nothing.
- Why isn't encryption alone enough?::*Because it hides the data, but doesn't stop changes or pretending||Because the key can always be guessed in the end, given time >> A good key can't be guessed in any useful time; the gaps are changes and pretending. >> the-building-block::Encryption stops reading, not the other two.
- What's the difference between a key and ciphertext?::*The key is the secret that unlocks, while ciphertext is the locked data||The key is part of the ciphertext, sent along with it >> The key is never sent with the data; that would unlock it for everyone. >> s3||Ciphertext is the key after it's been encrypted >> Ciphertext is your data, encrypted; the key is what encrypts it. >> s3::The secret vs what it locks.

## Sources

- [RFC 8446: The Transport Layer Security (TLS) Protocol Version 1.3](https://www.rfc-editor.org/rfc/rfc8446) ("TLS allows client/server applications to communicate over the Internet in a way that is designed to prevent eavesdropping, tampering, and message forgery"; its goals are authentication, confidentiality and integrity, "even in the face of an attacker who has complete control of the network")
