---
title: One frame, from tree to pixels
short: Composition, layout, drawing
summary: Puzzles 0 to 4 ended with an up-to-date tree of UI elements. A tree isn't pixels yet. Here's what Compose does with it in every frame, in three steps, and why a parent sizes each child only once.
takeaway: Compose makes a frame in three phases, always in this order. Composition runs what's marked and updates the tree of nodes. Layout passes constraints down, measures each child once within them, lets each parent pick its own size, then places each child relative to its parent. Drawing has each node paint itself onto a canvas. Each phase can be skipped when its inputs didn't change.
---

## The problem

Puzzle 1 said some calls leave a node, a real UI element, and puzzles 3 and 4 showed how the tree of nodes stays up to date. But a `Column` node holding a `Text` and a card says nothing yet about pixels: how wide is the text, where does the card start, and what puts the colour on the screen? Something has to turn the tree into a picture, again for every frame that changes.

## See it

```diagram frame
```

## The building block

A frame (one redraw of the screen) is made in three **phases**, always in this order. Android's docs give them as: composition, "what UI to show"; layout, "where to place UI"; drawing, "how it renders". Composition is everything puzzles 0 to 4 covered: run what's marked, skip what's equal, update the nodes.

Layout walks the node tree from the top. A parent hands each child **constraints**: the smallest and largest width and height the child may take. The parent then asks each child to **measure** itself: the child picks a size within the constraints, after measuring its own children the same way. A `Text` with too little width wraps onto more lines and gets taller; it can't get wider than its constraints allow. With the children's sizes known, the parent picks its own size.

A parent may measure each child only once per layout. The reason is depth: if every parent measured its children twice, each level down would double the work, and a tree ten levels deep would cost a thousand times more. With one measure per child, layout visits each node once.

Then **placement**: the parent sets each measured child's x and y, relative to itself. The `Column` puts the `Text` at the top and the card under it, at y = 40, the height of the `Text`.

Drawing comes last. Each node paints itself, at its place, onto a **canvas**: the drawing surface, with commands such as `drawRect` (fill a rectangle with a colour) or draw a line of text. Compose's `Canvas` is a Kotlin interface. On Android, the object behind it wraps Android's own canvas; on iOS, it wraps Skia's (the KMP course, puzzle 15). Your composables never see which one.

All three phases run, in principle, for every frame, but each one is skipped where its inputs didn't change: a frame where only a colour changed can redo drawing alone, if the colour is read while drawing; puzzle 8 shows where a read has to sit for that. Puzzle 3's state reads are noted per phase too, and puzzle 8 uses that to move work out of composition.

## Go deeper: Who decides a size: the parent or the child?

- A parent passes constraints with a minimum and maximum width of 340 pixels, and the child, a `Text`, would like 120. What size does it get?::340 wide. When the smallest and largest allowed widths are the same, the child has no choice; that's how a modifier like fillMaxWidth works. The child still chooses its height within its own height constraints.

## The analogy

The theatre once more. The script says who is in the scene (composition). Before the curtain, the stage manager tells each group how much of the stage it may use, each performer says how much room they need within that, and the stage manager marks each one's spot on the floor with tape (layout). Then the lights come up and the scene is painted onto the stage (drawing). Nobody asks a performer twice for their size: with dozens of groups inside groups, the rehearsal would never end.

## Check yourself

- A `Column` gets at most 300 pixels of width. Its child, a `Text`, needs 400 pixels to fit its words on one line. What happens when the `Text` is measured?::*It takes at most 300 wide and wraps onto more lines, so it gets taller||It takes 400 wide and runs past the right edge of the Column >> A child picks its size within the constraints; it can't choose more than the maximum. >> s2||The Column measures it again with 400, then shrinks it to fit >> Each child is measured once per layout; the constraints come first. >> the-building-block::Within the constraints, so it wraps.
- A custom layout library lets every parent measure each child twice, to try two widths. In a tree ten levels deep, how many times is the node at the bottom measured in one layout?::*About a thousand: each level doubles it, 2 to the power 10||20 times: twice for each of the ten levels >> The doubling compounds: each of the two measures of a parent measures the child twice again. >> the-building-block||Twice: only its own parent measures it >> Each time a parent is measured, it measures its children again. >> s3::One measure per child is what keeps layout linear in the tree.
- A card's text changes from one short line to a three-line paragraph. Which phases have new work to do?::*Composition, layout and drawing: new text, a new height, new pixels||Only drawing, because text is pixels on the canvas >> The card got taller, so it must be measured again and what's below it moves. >> s3||Only composition, because layout and drawing happened last frame >> Each frame needs layout and drawing again for whatever changed size or looks. >> the-building-block::A size change reaches every phase.

## Sources

- [Android Developers: Jetpack Compose phases](https://developer.android.com/develop/ui/compose/phases) ("Compose has three main phases: Composition: What UI to show. Compose runs composable functions and creates a description of your UI. Layout: Where to place UI. This phase consists of two steps: measurement and placement."; "Drawing: How it renders. UI elements draw into a Canvas, usually a device screen."; "Conceptually, each of these phases happens for every frame; however to optimize performance, Compose avoids repeating work that would compute the same results from the same inputs in all of these phases."; "Note that each node was visited only once."; "In contrast, if each node was visited multiple times, the traversal time increases exponentially.")
- [Android Developers: Custom layouts](https://developer.android.com/develop/ui/compose/layouts/custom) ("Parents define the constraints for their child elements."; "An element is asked to define its size within those constraints."; "Compose UI does not permit multi-pass measurement."; "This means that a layout element may not measure any of its children more than once in order to try different measurement configurations.")
- [Compose foundation source: Size.kt](https://github.com/androidx/androidx/blob/c13c6d0da6b9d595f72caad9fa1759c6a8aece83/compose/foundation/foundation-layout/src/commonMain/kotlin/androidx/compose/foundation/layout/Size.kt#L464) (fillMaxWidth makes the content fill the incoming maximum width "by setting the [minimum width][Constraints.minWidth] and the [maximum width][Constraints.maxWidth] to be equal to the [maximum width][Constraints.maxWidth] multiplied by [fraction]")
- [Compose UI source: Canvas.kt](https://github.com/androidx/androidx/blob/c13c6d0da6b9d595f72caad9fa1759c6a8aece83/compose/ui/ui-graphics/src/commonMain/kotlin/androidx/compose/ui/graphics/Canvas.kt#L154) (`public interface Canvas {`, with `public fun drawRect(left: Float, top: Float, right: Float, bottom: Float, paint: Paint)`)
- [Compose Multiplatform source: Canvas.skiko.kt](https://github.com/JetBrains/compose-multiplatform-core/blob/97210bb938d0143fd1bf0bea3d1b83a977568537/compose/ui/ui-graphics/src/skikoMain/kotlin/androidx/compose/ui/graphics/Canvas.skiko.kt#L26) (`actual typealias NativeCanvas = SkCanvas`, imported as `org.jetbrains.skia.Canvas`; and on Android, AndroidCanvas.android.kt: `public actual typealias NativeCanvas = android.graphics.Canvas`)
