---
title: Twelve help questions, two ways to find the right article
date: 2026-11-19
status: budding
tags: [ai, retrieval, experiments]
summary: A reproducible run compared TF-IDF and MiniLM on the same synthetic help articles. The difference showed up when questions used different words from their answers.
---

## The gap

A customer asks to require an extra proof at login. The help article says to add a second authentication factor. I wanted to see how much this change in wording affected which article a chat app would find.

## The click

Deciding what text to send a chat model is an experiment of its own. Give two search methods the same article collection, queries and expected answers. Compare their document rankings before adding a model that writes a response.

## How I checked it

I used an agent to run both methods on CPU with eight short, synthetic English help articles. I assigned each of twelve questions one expected article before running the code. Six questions use similar wording to the article and six use paraphrases.

| Method | Similar wording first | Paraphrase first | Overall first | Overall in top three |
|---|---|---|---|---|
| TF-IDF | 6/6 | 1/6 | 7/12 | 9/12 |
| MiniLM | 6/6 | 6/6 | 12/12 | 12/12 |

For the extra-proof question, TF-IDF ranked an article about ending a subscription first. MiniLM ranked the two-factor article first. The [dataset, rankings and script](https://github.com/trOnk12/Company-websites-/tree/main/_learning/experiments/text-retrieval) show the other cases and fix the model revision.

These numbers describe the chosen examples and methods. The set is small and synthetic, with one expected document per query. A chat model did not generate responses in this run. Larger collections, exact identifiers and questions with no answer in the collection need their own cases.

## Check yourself

- The correct article is second. Which metric counts that as a hit?::Top three counts it and top one does not.
- The model sees the correct text and still gives a wrong answer. What should the next experiment score?::Whether each answer claim is supported by the text the model received, separately from whether retrieval found it.

## Sources

- [Scikit-learn: TF-IDF vectorizer](https://scikit-learn.org/stable/modules/generated/sklearn.feature_extraction.text.TfidfVectorizer.html)
- [MiniLM ONNX model, pinned revision](https://huggingface.co/Xenova/all-MiniLM-L6-v2/tree/751bff37182d3f1213fa05d7196b954e230abad9)
- [OpenAI: Evaluation best practices](https://developers.openai.com/api/docs/guides/evaluation-best-practices)
