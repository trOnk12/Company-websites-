---
title: Which side hosts the other?
short: Which side hosts the other?
summary: Place a shared bookmarks screen in an iOS app, then put an Apple text field inside the shared screen.
takeaway: A shared screen can sit inside an iOS view controller. Inside that screen, a native view can be embedded with distinct creation and update steps.
---

## The problem

Our shared bookmarks screen already runs on Android. On iOS it sits under the app’s existing navigation bar. The search field uses UIKit because it needs a behavior specific to Apple’s text field. Which object hosts which?

## See it

```diagram who-hosts-the-native-view
```

## The building block

A **hosting boundary** is where one UI system gives a region to the other. There are two different directions in this example.

| Need | What to use | Owner of the surrounding region |
|---|---|---|
| Show the shared bookmarks in an existing iOS app | ComposeUIViewController | UIKit or a SwiftUI wrapper around that controller |
| Put a native search field inside the shared screen | UIKitView | Compose |

A view controller manages an area of UIKit UI. The controller returned by ComposeUIViewController hosts the shared composables. The rendering phases still run inside that shared region. SwiftUI can show that controller using UIViewControllerRepresentable, an adapter that lets SwiftUI display a UIKit controller.

Within the shared area, UIKitView can host a UITextField, Apple's text input view. Its factory creates the view. Its update callback can copy the latest shared value onto that existing view when the displayed text differs. User edits go in the other direction, through a native callback that updates the shared value.

For a field driven by shared state, make both directions explicit: user edit → shared value → displayed text. If you change the shared value through another action, such as Clear, the native field needs the update path to show the change.

## Go deeper: A reset while the keyboard is open

- The field writes edits to shared state, but a tap on Clear changes only that state. Which missing edge can leave old text on screen?::The native edit callback handles the other direction. The update callback has to copy the cleared shared value into the existing native field.

## Check yourself

- An existing UIKit navigation controller must present a shared screen. Which object belongs in its screen stack?::*A controller returned by ComposeUIViewController||The UIKitView nested inside a shared field >> UIKitView embeds a native view in the other direction. >> the-building-block||A shared button with no containing controller >> The host needs an iOS controller that contains the shared UI. >> the-building-block::Start from whoever owns the surrounding region.
- Why can a Clear button fail to clear the native field even though it clears shared state?::*The update path never copies the cleared value to the view||The factory can run only after the user edits the field >> Creation and state updates are separate steps. >> the-building-block||The native edit callback must clear the whole shared screen >> That callback reports edits from the view. Clear already changed shared state. >> the-building-block::State has to travel back from Compose to the native view.
- The latest value changes while the native field still exists. What should use that value?::*The update callback for the existing native view||Only the factory that originally created the view >> The view needs a later update, after its initial creation. >> the-building-block||The iOS navigation controller outside the screen >> The navigation controller owns placement of the screen, not the field text. >> the-building-block::Keep creation and synchronization separate.

## Sources

- [JetBrains: UIKit integration](https://kotlinlang.org/docs/multiplatform/compose-uikit-integration.html)
- [JetBrains: SwiftUI integration](https://kotlinlang.org/docs/multiplatform/compose-swiftui-integration.html)
