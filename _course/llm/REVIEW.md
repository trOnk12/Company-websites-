# Review log: LLMs for mobile engineers

Every course-clarity run adds a row. Pass bar: lint clean, every puzzle and diagram at least 8.

| Date | Version | Lint | Scores | What the review found → what changed |
|---|---|---|---|---|
| 2026-11-17 | v1: module 1 (6 puzzles) | clean | correctness/clarity: 8/9 · 8/9 · 8/9 · 8/8 · 9/9 · 6/8 (one combined ML engineer + learner reviewer); pictures checked from the contact sheet | Gemini Nano runs only for the top foreground app, with per-app request and battery quotas (verified in ML Kit GenAI docs); the Prompt API is beta; cancelling must reach through the proxy to the model; latency grows "mostly" with the answer; tokenizer splits vary; why temperature 0 still varies; prompt caching; Firebase AI Logic; stale labels in the sampling diagram. → All fixed. Next puzzle planned: what a call costs and how it fails (max_tokens, output pricing, rate limits, structured output). Not re-scored after these fixes. |
