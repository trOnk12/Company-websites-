---
title: Reading the flames
short: Call chart vs flame chart
summary: The profiler draws the same recording two ways. In one, left to right is time; in the other, it isn't. Here's how to read each, and where a slow function really spends its time.
takeaway: A call chart draws each call along a timeline, callees under their caller. A flame chart merges identical call stacks into one bar, so width means total time and left to right means nothing. A wide bar with a wide child is slow because of the child; a bar wider than all its children is slow in its own code: its self time.
---

## The problem

In puzzle 2 you recorded a slow scroll. The profiler now shows a mountain of coloured bars. `onBind()` is wide, `parseJson()` inside it is wide, and `format()` appears three times in one chart and once, very wide, in another. Which bar is the one to fix?

## See it

```diagram flames
```

## The building block

The **call chart** is a timeline. Each call is a bar from when it started to when it ended, and the functions it called, its **callees**, sit underneath it. If `onBind()` calls `format()` three times, you see three separate `format()` bars, one after another.

The **flame chart** takes the same recording and merges every call that has the same chain of callers into one bar. The three `format()` calls, all called from `onBind()`, become one bar as wide as the three together. Now width means "how much time in total", and left to right is no longer a timeline: the widest children are drawn first. That's why it's the fastest way to see where time goes.

Two numbers read the bars:

- **Total time**: the whole bar, the function plus everything it called.
- **Self time**: only the function's own code, the part of its bar not covered by children.

Start at the first caller's bar. (In Android Studio it's at the bottom: the flame chart is drawn upside down, callees stacked above their caller.) A wide bar whose child is just as wide is slow because of the child: follow the child. A bar noticeably wider than all its children together has self time: that's code to fix in that function.

The bottom-up view answers the opposite question: for a function that's slow everywhere, who calls it, and how much each caller spends.

## The analogy

A call chart is your day in a calendar: every meeting at its time. A flame chart is the same week summarised by type: "meetings with Anna: 6 hours", one block, no times. You can't tell when, but you see at a glance where the week went.

## Check yourself

- In a flame chart, `format()` is drawn left of `parseJson()`. What does that tell you?::*Nothing about order: a flame chart's left-to-right isn't time||That `format()` ran before `parseJson()` on the thread >> That's a call chart. In a flame chart the order is by width, not by when. >> s3||That `format()` was called by `parseJson()` >> A caller and its callees are stacked, not side by side. >> s2::Width is time; position isn't.
- `onBind()` is 200 ms wide. Its only child, `parseJson()`, is 190 ms wide. Where's the time?::*In `parseJson()`: `onBind()` has only 10 ms of self time||In `onBind()`, because it's the widest bar on the chart >> Its width includes its child; only 10 ms is its own. >> s4||Split evenly between both, since a bar's time is shared with its children >> Total time includes children; self time is only the gap they don't cover. >> s4::Follow the child while it's as wide as the parent.
- What's the difference between self time and total time?::*Self time is the function's own code, while total time adds every function it called||Self time adds every function it called, while total time is only the function's own code >> That's the two swapped. >> the-building-block::Own code vs own code plus callees.

## Sources

- [Android Studio: Flame chart](https://developer.android.com/studio/profile/chart-glossary/flame-chart) ("identical methods or functions that share the same sequence of callers are collected and represented as one longer bar in a flame chart"; "the horizontal axis doesn't represent a timeline; instead, it indicates the relative amount of time each method or function takes to execute"; "the callees that consume the most CPU time appear first")
- [Android Studio: Top down and bottom up charts](https://developer.android.com/studio/profile/chart-glossary/top-bottom-charts) ("Self: the time the method or function call spent executing its own code and not that of its callees"; "Total: the sum of the method's Self and Children time"; "The Bottom Up tab displays a list of calls in which expanding a function or method's node displays its callers.")
