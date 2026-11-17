---
title: Your first call
short: Request and response
summary: Puzzle 1 said the model works in tokens. Now one real call, so everything after it has something concrete to stand on: what your app sends, what comes back, and the three numbers that matter in the response.
takeaway: A call to a model is one HTTP POST: a model name, max_tokens (the most it may write), and messages, a list of turns each marked user or assistant. The response holds the continuation, a stop_reason (end_turn when it finished, max_tokens when it was cut off), and usage: the input and output tokens you pay for. Output tokens cost more than input ones, and each one takes time to generate.
---

## The problem

You know the model continues text and counts in tokens. But what does the request look like, in code you could write with OkHttp? And what comes back besides the answer?

## See it

```diagram firstcall
```

## The building block

A call to Anthropic's Messages API is one HTTP POST with a JSON body (shown slightly simplified):

```json
{
  "model": "MODEL_NAME",
  "max_tokens": 300,
  "messages": [
    { "role": "user", "content": "Summarise this review: …" }
  ]
}
```

- **model**: which model to use, a name from the provider's docs.
- **max_tokens**: the most tokens the answer may have.
- **messages**: the conversation as a list of **turns**, each marked `user` (your side) or `assistant` (the model's earlier answers). Puzzle 4 shows why that list matters.

The response, also JSON:

```json
{
  "content": [ { "type": "text", "text": "Short battery life, great screen." } ],
  "stop_reason": "end_turn",
  "usage": { "input_tokens": 312, "output_tokens": 9 }
}
```

Three things to read every time:

- the text in `content`;
- **stop_reason**: `end_turn` means the model finished; `max_tokens` means it was cut off at your limit, mid-sentence;
- **usage**: the input and output tokens of this call. That's the bill: providers charge per token, and output tokens cost several times more than input ones. Output is also what takes time, one token per step (puzzle 1).

## The analogy

A telegram service that charges per word, with a higher rate for the reply. You state the maximum reply length up front, and if the reply hits it, it stops, mid-sentence.

## Check yourself

- The response's stop_reason is `max_tokens`. What happened?::*The answer was cut off at the limit you set||The model finished its answer normally >> That's end_turn; max_tokens means it hit your limit. >> s3||The request had too many input tokens >> That's a different error; this is about the answer's length. >> s3::Cut off at your limit.
- A call used 312 input and 9 output tokens. Which part costs more per token?::*Output: providers charge more per output token than per input token||Input, because it's read before anything is written >> Input is cheaper per token; output costs several times more. >> s4||Both cost the same per token >> Output tokens are priced higher. >> s4::Output costs more.
- What's the difference between a `user` turn and an `assistant` turn?::*A user turn is your side of the conversation, while an assistant turn is the model's earlier answer||A user turn is the model's earlier answer, while an assistant turn is your side >> That's the two swapped. >> the-building-block::Your side vs the model's.

## Sources

- [Anthropic: Messages API examples](https://docs.anthropic.com/en/api/messages-examples) (a response contains `content`, `stop_reason` such as `"end_turn"` or `"max_tokens"`, and `"usage": { "input_tokens": …, "output_tokens": … }`; requests send `model`, `max_tokens` and `messages` with roles)
- [Anthropic: Pricing](https://docs.anthropic.com/en/docs/about-claude/pricing) (input and output tokens are priced separately, output higher)
