---
title: Why answers stream
short: Streaming and time to first token
summary: Your chat screen shows a spinner for eight seconds, then the whole answer at once. Users think it's broken. The model had the first words after half a second. Here's how to show them, and what changes in your networking code.
takeaway: Because the model writes one token at a time, the API can stream: send each piece as it's generated, over one open HTTP response, as server-sent events. Time to first token, not total time, is what makes an app feel fast. On mobile, the stream is a long-lived request: keep it on a background coroutine, append to UI state as events arrive, and cancel it when the user leaves.
---

## The problem

Your app calls the model and waits for the full answer: eight seconds of spinner, then a wall of text. In the model's own playground, words start appearing almost at once. Same model, same prompt. What does the playground do that your app doesn't?

## See it

```diagram stream
```

## The building block

Puzzle 1 showed the model produces an answer one token at a time. So the first tokens exist long before the last one. If the API waits for the whole answer, your user waits for all of it.

With **streaming**, the API sends each new piece as soon as it's generated. Anthropic's API does this when you set `"stream": true`: one HTTP response stays open, and pieces arrive as **server-sent events**, small text events on the same connection.

Two numbers now matter:

- **Time to first token**: how long until the first words appear. This is what the user feels.
- Total time: about the same as before. Streaming doesn't make the model faster; it stops hiding its progress.

On Android, the stream is a long-lived request, so it changes your code more than a normal call:

- Run it on a coroutine that the screen's ViewModel owns, and append each piece to the UI state as it arrives.
- Cancel it when the user leaves or taps stop: you pay for every token generated, wanted or not. If the stream goes through your own server (puzzle 6), the server must cancel its request to the model too, or generation and billing carry on.
- OkHttp has an SSE add-on (`okhttp-sse`), and Anthropic publishes a Java SDK that streams.
- A dropped connection mid-answer is normal on mobile, in a lift or a tunnel: keep what arrived, show it, and offer to retry.

## The analogy

A friend reading you a letter over the phone. You could wait until they've read it all to themselves and then hear a summary, or hear each sentence as they read it. The letter takes the same time; one way you're listening from the first line.

## Check yourself

- Streaming is turned on. What gets faster?::*The time to first token, since words show as soon as they exist||The total time, because the model writes faster while streaming >> The model writes at the same speed; you just see it sooner. >> s3||Both, because streaming sends fewer bytes over the network >> The bytes are about the same; only when they're shown changes. >> s3::Sooner, not faster.
- The user leaves the chat screen mid-answer. Why cancel the stream?::*Every generated token is still paid for, even if nobody reads it||The stream would crash the app once the screen is gone >> It wouldn't crash if the ViewModel owns it; the waste is the point. >> s4||Server-sent events can't run in the background >> They can; you cancel because the answer is no longer wanted. >> s4::Unread tokens are still paid for.
- What's the difference between time to first token and total time?::*Time to first token is when the answer starts, while total time is when it ends||Time to first token is when the answer ends, while total time is when it starts >> That's the two swapped. >> the-building-block::Start vs end.

## Sources

- [Anthropic: Streaming messages](https://docs.anthropic.com/en/docs/build-with-claude/streaming) ("When creating a Message, you can set \"stream\": true to incrementally stream the response using server-sent events (SSE).")
- [Anthropic: Glossary, TTFT](https://docs.anthropic.com/en/docs/about-claude/glossary) ("Time to first token (TTFT) is a performance metric that measures the time it takes for a language model to generate the first token of its output after receiving a prompt. It is an important indicator of the model's responsiveness")
