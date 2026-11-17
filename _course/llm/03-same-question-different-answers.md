---
title: Same question, different answers
short: Sampling and temperature
summary: Your unit test checks the model's summary against an expected string. It passes, then fails, then passes, with no code change. Here's where the randomness comes from, the knob that turns it down, and why it never reaches zero.
takeaway: At each step the model gives every possible next token a probability, and the next token is chosen by sampling from them. Temperature sets how adventurous that choice is: higher gives more varied text, lower sticks to the most likely tokens. Even at temperature 0 the output isn't fully deterministic, so test model features on properties, not exact strings.
---

## The problem

Your test calls the model with the same review and asserts the summary equals a saved string. It flips between passing and failing. Users also notice: "regenerate" gives a different answer each time. Is the model broken?

## See it

```diagram sampling
```

## The building block

Puzzle 0 said the model picks the next token. More precisely, at each step it scores every possible next token: "Great" very likely, "Good" likely, "Fine" less so. Then one is chosen by **sampling**: at random, weighted by those scores. Usually the likely one; sometimes not. Once a different token is picked, everything after it can go differently.

**Temperature** controls how adventurous the sampling is:

- Higher: less likely tokens get picked more often. More varied, more creative, sometimes less accurate.
- Lower: the most likely tokens win more often. More predictable, more repetitive.

For an app feature that must be consistent, like extracting fields or summarising, use a low temperature. For brainstorming names, a higher one.

But Anthropic's documentation is explicit: even at temperature 0, results aren't fully deterministic, and identical inputs might produce different outputs. Temperature 0 means "pick the top token", but tiny numeric differences on the provider's servers can still change which token is on top. So tests can't compare exact strings. Test what must be true: valid JSON, the required fields present, length under a limit, no forbidden words. For quality, keep a set of example inputs and check the answers in bulk, which module 3 covers.

## The analogy

A jazz musician playing a standard. Ask for a strict take (low temperature) and you get nearly the same performance every night. Ask for a free one (high temperature) and every night is different. Even the strict take isn't a recording: tiny differences still creep in.

## Check yourself

- You set temperature to 0. Can you now assert the exact output string in a test?::*No: even at 0 the output isn't guaranteed to be identical||Yes, because temperature 0 always picks the single most likely token >> Anthropic's docs say even at 0 the results won't be fully deterministic. >> s4||Only if the prompt is shorter than one sentence >> Prompt length doesn't make the output deterministic. >> s4::Test properties, not strings.
- Your app extracts a date and an amount from a receipt photo. Which temperature suits it?::*A low one, since you want the most likely, consistent answer||A high one, since receipts vary a lot from shop to shop >> Varied inputs don't need varied outputs; you want consistency. >> s3||It doesn't matter, because extraction has only one right answer >> It does: higher temperature makes less likely, possibly wrong, tokens more frequent. >> s3::Consistency wants low temperature.
- What's the difference between sampling and temperature?::*Sampling is choosing the next token at random by likelihood, while temperature sets how adventurous that choice is||Sampling sets how adventurous the choice is, while temperature is choosing the token at random >> That's the two swapped. >> the-building-block::The choice vs the knob on it.

## Sources

- [Anthropic: Glossary, Temperature](https://docs.anthropic.com/en/docs/about-claude/glossary) ("Temperature is a parameter that controls the randomness of a model's predictions during text generation. Higher temperatures lead to more creative and diverse outputs… Lower temperatures result in more conservative and deterministic outputs that stick to the most probable phrasing and answers"; "Even with temperature set to 0, the results will not be fully deterministic, and identical inputs might produce different outputs across API calls.")
