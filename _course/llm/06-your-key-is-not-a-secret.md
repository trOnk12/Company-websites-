---
title: Your key is not a secret
short: Keys and the proxy backend
summary: The quickest way to ship an AI feature is to put the provider's key in the app and call the model directly. A week later the bill is ten times your users' usage. Here's why a key inside an APK isn't hidden, and the small backend that fixes it.
takeaway: Anything in your APK can be extracted, so an API key in the app belongs to anyone who downloads it, and they can spend your money. Call the model through a proxy backend: the app authenticates the user to your server, and the server adds the key, applies per-user limits and calls the model. The key never leaves the server.
---

## The problem

You put the model provider's key in `BuildConfig`, obfuscated with R8, Android's build tool that shrinks code and renames it, and call the API straight from the app. It works. Then your usage dashboard shows calls your app never made, around the clock, with prompts that have nothing to do with your feature. How did anyone get the key?

## See it

```diagram proxy
```

## The building block

An **API key** is a password for your account: whoever sends it, gets served, and you get billed. And an APK is a file anyone can download and unpack. Strings in it can be found; **obfuscation**, scrambling names to make code harder to read, renames code but a key is still a string the app must send; and even if you hide it well, the key travels in every request from a phone the attacker controls, where they can intercept their own traffic. Google Cloud's guidance is plain: don't include API keys in client code.

So the key lives on a server you control, a **proxy backend**:

1. The app calls **your** server, sending the user's **login token**: the token your app receives when the user signs in, which proves to your server who they are.
2. Your server checks who it is, applies limits per user ("20 requests a day on the free plan"), and builds the request: your system prompt, the user's message.
3. Your server adds the API key and calls the model, streaming the answer back to the app (puzzle 3).

The key never leaves the server. If one user abuses the feature, you block that user, not your whole account. And your instructions to the model and the model choice can change without an app release. Google offers a managed version of this pattern for Gemini: Firebase AI Logic, with App Check to make sure calls come from your real app.

## The analogy

A company card. You don't hand the card to every customer and trust them to buy only what you meant. A cashier holds it, checks who's asking, applies the limit, and pays.

## Check yourself

- The key is in the APK, obfuscated by R8. Is it safe?::*No: the app must send it, so it can be found in the APK or in the app's traffic||Yes, because R8 obfuscation makes the key unreadable in the APK >> R8 renames code; the key is still a value the app sends. >> s2||Yes, as long as every request from the app goes over HTTPS >> HTTPS protects the wire from others, not from the phone's owner. >> s2::If the app can send it, users can read it.
- With a proxy backend, one user floods the AI feature. What can you do?::*Limit or block that user on your server, without changing the key||Rotate the API key and ship a new app version >> The key isn't in the app any more; you act on the user instead. >> s4||Nothing, since every request reaches the model the same way >> Every request passes your server first, which can refuse it. >> s4::The server sees users, not only a key.
- What's the difference between an API key and the user's login token?::*The API key bills your account with the provider, while the login token says who the user is to your server||The API key says who the user is to your server, while the login token bills your account with the provider >> That's the two swapped. >> the-building-block::Your account vs your user.

## Sources

- [Google Cloud: Best practices for managing API keys](https://cloud.google.com/docs/authentication/api-keys-best-practices) ("Don't include API keys in client code or commit them to code repositories. API keys hardcoded in the source code or stored in a repository are open to interception or theft by bad actors. The client should pass requests to the server, which can add the credential and issue the request.")
