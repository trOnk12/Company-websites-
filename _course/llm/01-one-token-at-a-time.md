---
title: One token at a time
short: Tokens and prediction
summary: You send a prompt and get a paragraph back. It looks like the model writes the answer the way you would. It doesn't. Here's the loop that produces every word, and the unit everything is measured and billed in.
takeaway: A language model reads and writes tokens: words, pieces of words, characters. It produces an answer by next-token prediction: given all the text so far, pick one next token, append it, and run again, until it stops. Limits, latency and price are all counted in tokens, and longer answers take longer because each token is one more step.
---

## The problem

Your app sends "Summarise this review" with a 300-word review, and gets a 60-word summary back. The API bill doesn't count words at all. The response time grows mostly with the length of the answer, much less with the question. What is the model actually doing?

## See it

```diagram tokens
```

## The building block

A language model doesn't see letters or words. Text is first cut into **tokens**: common words are one token, rarer words are split into pieces, and emoji or unusual characters can take several. On Anthropic's earlier Claude models, one token was about 3.5 English characters; other languages and other models differ. The API's token counting tells you exactly.

Then the model does one thing, over and over: **next-token prediction**. Given all the tokens so far, the prompt plus whatever it has written, it picks the next token. That token is appended, and the model runs again on the slightly longer text. It stops when it picks an end-of-answer token, or hits the maximum length you set (the next puzzle shows where). (The prompt itself is read in one go; only the answer is written step by step. That's why a long answer costs more time than a long question.)

Three consequences you'll feel in an app:

| | Because |
|---|---|
| A long answer takes longer than a short one | each token is one more run of the model |
| Limits and prices are in tokens | that's the unit the model reads and writes |
| The same text costs different amounts in different languages | the split into tokens differs |

## The analogy

A typist who can only see what's already on the page, and adds one word at a time, each time rereading the page to decide the next. The page is never planned in advance: every word is chosen when it's time.

## Check yourself

- Why does a 300-token answer take longer than a 30-token one?::*Each token is one more run of the model, one after another||The model must read the longer answer back before sending it >> It doesn't reread for sending; it generates one token per step. >> s3||A longer answer needs a bigger network response >> A few kilobytes cost little; the time is in generating each token. >> s3::One token per step.
- The same text in Polish costs more tokens than in English. Why?::*The text is split into more tokens, since the split depends on the language||The model charges more for languages other than English >> The price is per token; the text just becomes more tokens. >> s1||Polish answers are always longer >> Same meaning, more tokens: the split differs. >> s1::Different languages, different splits.
- What's the difference between a token and a word?::*A token is the model's unit, which can be a word, part of one, or a character||A token is always exactly one word, while a word can be several tokens >> Common words are one token, but tokens can also be parts of words. >> the-building-block::The model's unit, not the dictionary's.

## Sources

- [Anthropic: Glossary](https://docs.anthropic.com/en/docs/about-claude/glossary) ("Tokens are the smallest individual units of a language model, and can correspond to words, subwords, characters, or even bytes"; earlier models: "a token represents approximately 3.5 English characters"; "autoregressive language models… are pretrained to predict the next word, given the previous context of text")
