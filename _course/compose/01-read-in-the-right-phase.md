---
title: Which work does a moving card need?
short: Which work does a moving card need?
summary: Move the shared card as the user scrolls. Predict which parts of a screen update can be reused.
takeaway: Where a value is read determines which work that value can invalidate. A read only during placement can move a card without changing its UI description.
---

## The problem

The card slides vertically as you scroll. Its content and size stay the same. Which work needs to run in response to the scrolling value?

## See it

```diagram read-in-the-right-phase
```

## The building block

There are three useful **rendering phases**. Composition decides which UI to describe. Layout measures sizes and places each item. Drawing paints the result. A tracked state read records the phase that actually reads the value.

In this version the observable value is read inside the placement lambda, which is code that runs later when Compose places the card. The position value is already an integer number of pixels:

```kotlin
Box(
    modifier = Modifier.offset {
        IntOffset(x = 0, y = position.value)
    }
) {
    Text("Saved item")
}
```

Now a change in position can update placement without recomposing this box for that change. Related drawing can still run. If you first evaluate the same value up in composition, you have already created a composition dependency by the time the modifier receives it.

Suppose the position only controls a painted color. If the color is read exclusively while drawing, Compose can redraw it without recomposing or relaying out the UI for that change. Choose the phase by the work your value actually drives.

## Go deeper: Move versus measure

- Why might a card changing its height require more work than a card moving vertically?::A different height can require new measurements and can move neighboring items. Moving an item of the same size can reuse its measurement.

## Check yourself

- The position is read only during placement. What can Compose reuse for that change?::*The card description and its measured size||Only the values read while drawing >> The position is read in placement, after measurement. >> the-building-block||Nothing, because scrolling always builds a new tree >> The recorded read does not require composition for this change. >> the-building-block::Moving an already measured card is placement work.
- Moving the read into a local variable at the top of the composable has what effect?::*The changed value can now invalidate composition||The modifier still reads the observable value during placement >> The modifier receives a value already evaluated in composition. >> the-building-block||The read becomes untracked because it is local >> The location of a variable does not disable observation. >> the-building-block::Follow where evaluation happens.
- A value affects only paint and is read only during drawing. What follows when it changes?::*Drawing can run without relaying out the screen||Layout has to run first again to get the new color >> The layout has no new information to compute from the color. >> the-building-block||The color cannot change until another value recomposes >> Drawing owns the dependency and can update independently. >> the-building-block::A drawing dependency can invalidate drawing directly.

## Sources

- [Android Developers: Jetpack Compose phases](https://developer.android.com/develop/ui/compose/phases)
