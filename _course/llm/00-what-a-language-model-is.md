---
title: What a language model is
short: A program that continues text
summary: Before anything else, the one idea everything stands on. You send a model some text; it continues it. Here's what that program is, where it runs, and how your app reaches it.
takeaway: A language model is a program trained on huge amounts of text until, given any text, it can score which words are likely to come next, and so continue it: answer a question, summarise a review. Large ones run on a provider's servers (Anthropic's Claude, Google's Gemini), and your app reaches them through an API: an HTTP request with your text, and a response with the continuation.
---

## The problem

Your product team wants "summarise this review" in the app. People call the thing that does it an AI or a model. Before any code: what is it, where does it run, and what does your app actually talk to?

## See it

```diagram model
```

## The building block

A **language model** is a program that continues text. Give it "The capital of France is" and it continues with "Paris". Give it a review and "Summary:" and it continues with a summary.

It learned to do that in **training**: it was shown huge amounts of text and, again and again, asked what comes next, and adjusted every time it was wrong. The result is a program that, given any text, can score how likely each possible next word is. Picking likely words, one after another, produces an answer. (The next puzzle shows the exact unit it picks.)

The big ones are called large language models, **LLM**s. They're too big for a phone and run on a provider's servers: Anthropic's models are called Claude, Google's are called Gemini.

Your app reaches one through an **API**: an HTTP request to the provider, with your text in the body and a secret key that identifies your account, and a response with the continuation in it. To your code, it's a slow, expensive, very capable endpoint.

## The analogy

Autocomplete on your keyboard, scaled up by a factor of millions. Your keyboard suggests the next word from what you typed; a language model does the same with whole paragraphs, because it has read far more.

## Check yourself

- What does a language model do with the text you send it?::*It continues it, one likely word after another||It looks up the answer in a database of facts >> It doesn't look things up; it continues text based on what it learned. >> s2||It runs your text as code on the provider's servers >> Your text is input to continue, not code to run. >> s2::It continues text.
- Where does a large language model like Claude usually run when your app uses it?::*On the provider's servers, reached through an API||Inside your APK, downloaded with the app >> Large models are far too big for an app; they run on servers. >> s3||On Google Play's servers, as part of the store >> The provider hosts it; the store has nothing to do with it. >> s3::On servers, through an API.
- What's the difference between training and using a model?::*Training is how it learned from text, while using it means sending text and getting a continuation||Training is sending it text and getting a continuation, while using it is how it learned >> That's the two swapped. >> the-building-block::Learning vs answering.

## Sources

- [Anthropic: Glossary, LLM](https://docs.anthropic.com/en/docs/about-claude/glossary) ("Large language models (LLMs) are AI language models with many parameters that are capable of performing a variety of surprisingly useful tasks. These models are trained on vast amounts of text data and can generate human-like text, answer questions, summarize information, and more"; models are "pretrained to predict the next word, given the previous context of text")
