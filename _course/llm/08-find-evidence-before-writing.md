---
title: Find evidence before asking the model
short: Find evidence before asking the model
summary: A support assistant needs the correct help article. Compare two ways to select it for the same question.
takeaway: Retrieval selects evidence before generation. Word overlap and learned vectors can rank the same documents differently, especially when a query changes its wording.
---

## The problem

The help article says “register an authenticator app.” A reader asks “Can I require an extra proof of who I am when I log in?” What text should the app add to the model call?

## See it

```diagram find-evidence-before-writing
```

## The building block

**Retrieval** selects candidate text from a collection before the application asks a model to answer. The query and every article get a score. Only the highest-ranked articles are passed along.

One approach, **`TF-IDF`**, measures how strongly words characterize each document. Common words receive less weight than words that are unusual in the collection. A short question and article can rank well if they share distinctive wording.

An **embedding** is a list of numbers produced by a model trained to represent text. The application can compare the direction of query and article vectors using cosine similarity. Related phrasing can end up close together even when it uses different words.

I compared both methods for twelve English questions against the same eight synthetic help articles. The expected document was assigned before running the comparisons.

| Query set | `TF-IDF` first result | MiniLM first result |
|---|---|---|
| Six questions with similar wording | 6/6 | 6/6 |
| Six paraphrases | 1/6 | 6/6 |
| All twelve | 7/12 | 12/12 |

This run measures selection in a tiny collection. Neither method here generated an answer. The result is an example of why to measure paraphrases on your own documents.

## Go deeper: What happens with an exact reference number?

- A user quotes a rare error identifier exactly. Is there a reason to keep lexical matching in the comparison?::A rare, exact identifier is a strong lexical signal. The paraphrase results tell us nothing about how either method ranks unseen identifiers, so add exact-identifier cases to the test set.

## Check yourself

- The query and article express the same idea with different words. What should you measure?::*Whether each method still ranks the labeled article high enough||Whether the articles can all be copied into the interface >> The problem is selecting evidence from the collection. >> the-building-block||Whether one method produced a longer generated answer >> Neither method in this run generates answers. >> the-building-block::Hold the corpus fixed and compare the rankings.
- The model says something plausible after receiving the wrong article. Which stage already failed?::*Evidence selection before generation||The interface state that displayed the answer >> The wrong article was selected before the answer reached the interface. >> the-building-block||The model’s choice of answer length >> Answer length cannot repair choosing unrelated evidence. >> the-building-block::Locate the first broken step.
- Both methods score 6/6 on similar wording. What can you infer for this collection?::*Both methods got those six cases right||Both were equally successful on all paraphrases >> The table separates the paraphrases and shows a difference. >> the-building-block||Either method can answer any question from this domain >> The experiment tests a small retrieval set, not all questions or generated answers. >> the-building-block::Limit the conclusion to the measured cases.

## Sources

- [Scikit-learn: `TF-IDF` vectorizer](https://scikit-learn.org/stable/modules/generated/sklearn.feature_extraction.text.TfidfVectorizer.html)
- [MiniLM model and pinned revision](https://huggingface.co/Xenova/all-MiniLM-L6-v2/tree/751bff37182d3f1213fa05d7196b954e230abad9)
- [Experiment, dataset and reproduction](https://github.com/trOnk12/Company-websites-/tree/main/_learning/experiments/text-retrieval)
