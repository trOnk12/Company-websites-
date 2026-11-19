---
title: Which step failed the answer?
short: Which step failed the answer?
summary: Keep the same help question and find whether the problem happened during search or writing.
takeaway: Measure whether the expected evidence was retrieved and whether the generated answer follows that evidence. A pass at one step does not prove a pass at the other.
---

## The problem

A customer asks when a card refund will appear. The answer says “one day.” The article says “five business days.” Which system component deserves the bug report?

## See it

```diagram measure-retrieval-and-answer-separately
```

## The building block

A **labeled test set** lists questions and the evidence or outcome expected for each. Use a small set with literal questions, paraphrases, and questions your documents cannot answer. Save it before changing the application.

**Hit at 3** counts how many questions have the expected document among the first three search results. In the previous lab, `TF-IDF` put the expected article first for seven out of twelve and among the first three for nine. MiniLM put it first for all twelve on this collection.

An **evidence check** asks whether the answer's claims are supported by the text it received. Run it separately. In this example:

| Evidence provided | Answer observed | Diagnosis |
|---|---|---|
| An article about ending a subscription | One day | Retrieval missed the refund article. |
| The refund article saying five business days | One day | The answer contradicts available evidence. |
| No article that states a refund window | I couldn't find a refund window in the help articles. | The answer acknowledges missing evidence. |

The lab measured the first stage only. The three rows above are worked examples of the second stage, not results from a model run. If you compare two chat tools later, give them the same allowed articles and score their claims against those articles.

## Go deeper: Design a fair agent comparison

- One agent can search all articles and another sees only five. Can you attribute an answer difference to the model?::Not from this comparison. Freeze the corpus, permitted tools and success criteria. Log tool calls and evidence, then change one variable.

## Check yourself

- The expected article is second of three results. Does this question count as a hit at 3?::*Yes, because the article is among the first three||No, because the article must rank first for both metrics >> First place is the cutoff for hit at 1, not hit at 3. >> the-building-block||Only if the model later cites the article in an answer >> This retrieval metric is computed independently of the answer. >> the-building-block::Pick the cutoff before measuring.
- The model saw the correct refund article but said one day. What failed in this case?::*The generated claim failed the evidence check||The retrieval stage failed to select a relevant article >> The relevant article was available to the model. >> the-building-block||The test set recorded the wrong search protocol >> The discrepancy is between the claim and the provided evidence. >> the-building-block::Compare the answer with the text that was actually provided.
- Two chat setups differ in both model and article access. What can you conclude from a score difference?::*The full setups differ on this test||The difference isolates the model choice >> Article access changed at the same time. >> the-building-block||The difference isolates the document selection method >> The model changed too, so the effect cannot be isolated. >> the-building-block::Freeze other variables to attribute a difference.

## Sources

- [OpenAI: Evaluation best practices](https://developers.openai.com/api/docs/guides/evaluation-best-practices)
- [Experiment, raw query rankings and reproduction](https://github.com/trOnk12/Company-websites-/tree/main/_learning/experiments/text-retrieval)
