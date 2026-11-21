---
title: Which work does a moving card need?
short: Which work does a moving card need?
summary: Move the shared card as the user scrolls. Defer the read once more, this time to a later phase, and predict which work a frame can reuse.
takeaway: A state read is noted in the phase that makes it. Read a scroll position at the top of a composable and every change reruns composition, layout and drawing. Read it inside the offset lambda, which runs during placement, and a change only moves the card. A value that only changes paint, read inside a drawing lambda, reruns drawing alone.
---

## The problem

Puzzle 6 deferred a read from a parent into the child that needs the value. Now a card on the same screen slides down as you scroll. Its text and size stay the same; only its position changes, on every frame of the scroll. Running composition for each of those frames is work nobody sees. Can the read move somewhere cheaper than composition?

## See it

```diagram read-in-the-right-phase
```

## The building block

Puzzle 4 split every frame into three phases: composition, layout (measure, then place) and drawing. Puzzle 2's state reads are noted per phase: Compose records which phase was running when the value was read, and a change reruns that phase onward, not everything.

The first version reads the position at the top of the composable. The position is an integer number of pixels:

```kotlin
val y = position.value                       // read in composition
Box(modifier = Modifier.offset { IntOffset(x = 0, y = y) }) {
    Text("Saved item")
}
```

`position.value` is evaluated while the composable runs, so the read belongs to composition. Every scroll step marks composition, and the frame then measures, places and draws again.

The second version reads it inside the lambda that `Modifier.offset { }` takes. Compose calls that lambda during placement, so that's where the read happens:

```kotlin
Box(modifier = Modifier.offset { IntOffset(x = 0, y = position.value) }) {
    Text("Saved item")   // read in placement
}
```

Now a scroll step reruns placement only. Composition doesn't run, and measuring doesn't either: Android's docs note that measuring and placing have separate restart scopes, so a read during placement doesn't redo the measuring before it. The card keeps its size and moves. It's the same idea as puzzle 6, deferring a read, but to a later phase instead of a smaller group.

The same works one phase further. If a value only changes paint, such as a background colour that follows the scroll, read it inside a drawing lambda:

```kotlin
Box(modifier = Modifier.drawBehind { drawRect(color.value) })
```

`drawBehind` runs its lambda while drawing, so a change of colour reruns drawing alone. Choose the phase by the work your value actually drives.

## Go deeper: Move versus measure

- Why might a card changing its height need more work than a card moving down?::A different height needs the card measured again, and its parent may then move the items below it. Moving a card of the same size reuses its measured size and only places it again.

## The analogy

The theatre once more. If the stage manager rewrites the script every time a prop must slide a little further across the stage, rehearsals never end. The tape marks on the floor (placement) can move without touching the script, and a change of light colour (drawing) needs neither the script nor the tape.

## Check yourself

- The card now also grows taller as you scroll, and its height follows the same position. Can placement alone handle that change?::*No: a new height needs measuring, and items below may move||Yes: the read is still inside the offset lambda, so only placement runs >> The offset lambda only moves the card; a height change has to be measured. >> go-deeper-move-versus-measure||Yes: drawing can stretch the old card to the new height >> Drawing paints what layout decided; it doesn't choose sizes. >> the-building-block::Size changes need measuring; position changes don't.
- Why does reading `position.value` inside the offset lambda keep composition from running on scroll?::*The lambda runs during placement, so the read is noted in layout||Compose never tracks reads made inside a lambda >> It does track them, in the phase where the lambda runs. >> the-building-block||The modifier keeps the last position and ignores changes >> The card does move: the change reruns placement. >> s4::The read is noted where it happens.
- A header's background colour follows the scroll, read inside `drawBehind`. The colour changes. What runs?::*Drawing only: composition and layout are reused||Layout first, then drawing, to fit the new colour >> A colour doesn't change any size or position. >> the-building-block||Composition, because every state change starts there >> A change reruns the phase where the read happened. >> the-building-block::A read during drawing reruns drawing.

## Sources

- [Android Developers: Jetpack Compose phases](https://developer.android.com/develop/ui/compose/phases) ("When you read the value of a snapshot state during one of the phases listed previously, Compose automatically tracks what it was doing when it read the value."; "Key Point: The measurement step and the placement step have separate restart scopes, meaning that state reads in the placement step don't re-invoke the measurement step before that."; "The value of firstVisibleItemScrollOffset changes every frame during scroll, and by deferring the state read to the layout phase, you can avoid recompositions all along.")
- [Android Developers: Follow best practices](https://developer.android.com/develop/ui/compose/performance/bestpractices) ("By switching to the lambda version of the modifier, you can make sure the function reads the scroll state in the layout phase."; "To improve this, use a lambda-based modifier—in this case, drawBehind.")
