# Compose Multiplatform: the road to expert

The learner: an Android engineer who finished the Kotlin Multiplatform course (its Compose puzzles 13–15 are the
entry point) and writes Jetpack Compose at work, but has never looked inside Compose or shipped it to iOS.
The goal: someone who can predict what Compose does in every frame, on both platforms, and can decide, screen by
screen, where Compose Multiplatform belongs in an iOS app.

Rules: one core idea per puzzle, 5–7 puzzles per module, foundation first (no module uses an idea a later module
teaches). Facts from developer.android.com, kotlinlang.org, jetbrains.com, and the androidx and
compose-multiplatform-core sources, quoted on every page. Status: **done**, *next*, or planned.

## Module 1: Compose underneath (**done**, puzzles 0–5)
0. What @Composable really does: the compiler plugin, the Composer, groups, `$changed`.
1. The tree Compose remembers: composition, nodes, slots, the slot table, call sites, `key()`.
2. Who read that state: snapshot state, state reads, restart groups, the Recomposer and the frame.
3. What gets skipped: skipping, stable and unstable types, strong skipping, `@Stable`.
4. One frame: composition, layout (constraints, measure once, placement), drawing onto a canvas.
5. Four layers: runtime, Compose UI (the Applier), foundation, Material; where the per-platform code lives.

## Module 2: One screen, two platforms (**done**, puzzles 6–9, the applied module)
6. Who read the bookmark count: deferring a read into the child.
7. Which work a moving card needs: deferring a read to a later phase.
8. Which side hosts the other: ComposeUIViewController and UIKitView.
9. Can VoiceOver understand the bookmark: semantics to iOS accessibility.

## Module 3: Compose Multiplatform on iOS (*next*)
1. Skia and Skiko: what a graphics library does, and how Kotlin/Native reaches Skia's C++ (Skiko).
2. Inside ComposeUIViewController: the hosting view controller, its container view, and the one Metal-backed view
   (`MetalView`, `MetalRedrawer` in compose-multiplatform-core's iosMain).
3. The GPU and Metal in plain words: why drawing goes through a command buffer, what "presenting a drawable" means.
4. Frame scheduling on iOS: CADisplayLink, the Recomposer's frame clock, and 120 Hz ProMotion
   (`DisplayLinkListener`, `DisplayLinkFrameRate`, `FrameChoreographer`).
5. Touches in: UITouch to Compose pointer events, and how scrolling gets iOS physics (foundation's Cupertino
   overscroll and decay).
6. Where a frame's time goes on iPhone: composition and layout on the main thread, Skia's GPU work, and what a
   dropped frame looks like.

## Module 4: Living with UIKit
1. UIKit inside Compose, properly: UIKitView and UIKitViewController, factory/update/release, sizing, and the
   interaction modes for touches.
2. Compose inside SwiftUI and UIKit: UIViewControllerRepresentable, safe areas and insets, several Compose screens
   in one app.
3. Text input on iOS: the hidden UIKit text input bridge, the keyboard, selection, autocorrect and IME composition.
4. The keyboard and the layout: insets, `imePadding`, and what moves when the keyboard animates.
5. Accessibility in depth: the semantics tree mapped to UIAccessibility elements, traversal order, merging, testing
   with VoiceOver and the Accessibility Inspector.
6. Looking at home on iOS: what Material does on iOS, Cupertino-style components, fonts, haptics, and when to drop
   to a native control.

## Module 5: Shared app plumbing
1. Resources: `composeResources`, the generated `Res` class, strings, images and fonts per locale and density.
2. Navigation: Navigation Compose in common code, the back stack, the iOS back swipe.
3. Lifecycle and ViewModel in common code: lifecycle-runtime-compose and lifecycle-viewmodel on iOS, who owns
   the ViewModel when a UIKit controller hosts the screen.
4. Performance on iOS: startup, binary size, memory, profiling with Instruments, and Compose's own tracing.
5. Testing: compose-ui-test in commonTest, semantics matchers, running on the iOS simulator, screenshot tests.
6. CMP or SwiftUI, screen by screen: a decision checklist (look, interop cost, input, accessibility, team).

## Module 6: Expert floor (planned)
1. Effects and their lifetimes: LaunchedEffect, DisposableEffect, rememberUpdatedState, `produceState`.
2. Snapshots in depth: the snapshot system, isolation, and writing state from background threads.
3. CompositionLocal: implicit parameters, and when they hurt.
4. Custom layouts and modifiers: `Layout`, `Modifier.Node`, intrinsic measurements.
5. Lazy layouts: item reuse, keys, content types, prefetch.
6. Reading the compiler's reports: stability reports and composition metrics.

## Go-deeper floors to link (foundation courses)
What a compiler plugin is (How code becomes a program); what a GPU does and why frames are drawn in a command
buffer (Computers from the ground up); the main thread and the run loop (Android course, KMP course).
