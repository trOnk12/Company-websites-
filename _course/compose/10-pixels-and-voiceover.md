---
title: Can VoiceOver understand the bookmark?
short: Semantics, roles and VoiceOver
summary: A custom bookmark icon turns solid when you tap it. A sighted user sees the change; VoiceOver hears nothing. Give the icon a label, a role and a state, and follow them from Compose to what VoiceOver says on an iPhone.
takeaway: Pixels don't speak. VoiceOver only knows what Compose's semantics say, and Compose Multiplatform maps those semantics to iOS accessibility properties. A tap handler with no semantics is silent; Modifier.toggleable(role = Role.Switch) plus a contentDescription gives VoiceOver a label, a switch role and an on/off value, and IconToggleButton does the same with Material's defaults. An icon inside a control that already has a label gets a null contentDescription.
---

## The problem

Puzzle 9 put the shared screen inside an iOS app and a native text field inside the screen. The native field already speaks to VoiceOver, Apple's screen reader, because UIKit built it. Everything else on the screen is Compose, drawn as pixels into one view (the KMP course, puzzle 15). Each saved item has a custom bookmark icon: an outline that turns solid when you tap it. A sighted user sees the change. A VoiceOver user moves a finger over the item and hears nothing. Why, and what has to change?

## See it

```diagram pixels-and-voiceover
```

## The building block

VoiceOver can't look at pixels. It asks the app for **accessibility semantics**: a description of each element, made of a label (what it is), a role (what kind of control), a state (on or off) and the actions it supports. Compose keeps that description in its semantics tree (the KMP course, puzzle 15), and on iOS, JetBrains' docs say, "semantics data produced by Compose APIs is now mapped to native objects and properties that are consumed by iOS Accessibility Services".

Here is the icon as first written:

```kotlin
Icon(
    painter = bookmarkIcon(saved),           // outline or solid picture
    contentDescription = null,
    modifier = Modifier.pointerInput(Unit) {
        detectTapGestures { onToggle(!saved) }
    },
)
```

`pointerInput` with `detectTapGestures` reacts to raw touches and adds no semantics at all, and a `contentDescription` of `null` says the picture means nothing on its own. So the semantics tree has nothing here, and VoiceOver skips the icon, or can't say what it does. For VoiceOver the bookmark doesn't exist.

The fix is to describe the control, not the picture:

```kotlin
Icon(
    painter = bookmarkIcon(saved),
    contentDescription = null,               // decorative: the control below speaks for it
    modifier = Modifier
        .toggleable(
            value = saved,
            role = Role.Switch,
            onValueChange = onToggle,
        )
        .semantics { contentDescription = "Bookmark ${item.title}" },
)
```

`Modifier.toggleable` makes the element something that is either on or off, and reacts to a tap or to an accessibility action by asking to flip it (`onValueChange`). It adds the semantics with it: a toggleable state (on or off) and a click action. `Role.Switch`, passed as its role, says what kind of control it is. The `semantics { }` block adds the label: `contentDescription`, the text a screen reader speaks for an element.

What iOS receives, in Compose Multiplatform's iOS code: the label becomes the element's accessibility label; the toggleable state adds a toggle trait and the value "1" or "0"; and `Role.Switch` adds UIKit's toggle-button trait on iOS 17 and later. VoiceOver puts those together and says something like "Bookmark Lake walk, switch button, on". The exact words depend on the iOS version and the user's VoiceOver settings, so check them on a device.

Why a `contentDescription` of `null` on the icon? A screen reader treats a control as one element, and the label belongs to the control. If the picture also had a description, it could be read as well, or instead. Android's docs say a null description marks a graphic that is "purely decorative".

Material has this built in. `IconToggleButton(checked = saved, onCheckedChange = onToggle) { Icon(bookmarkIcon(saved), contentDescription = "Bookmark ${item.title}") }` is already toggleable, with the role of a checkbox, and it merges its children's semantics into itself, so the icon's description becomes the button's label. Use it unless your design needs a custom control.

A screenshot can't test any of this. Turn on VoiceOver on an iPhone, move to the bookmark, listen, double-tap, and listen again: the value should change from off to on. The native field from puzzle 9 is UIKit's own element, so check it the same way, but separately.

## Go deeper: Where does Role.Switch become an iOS trait?

- On an iPhone with iOS 16, the same bookmark is read without "switch button". What changed?::Compose Multiplatform's iOS code adds UIKit's toggle-button trait for `Role.Switch` only when the iOS version is 17 or later (the code checks the iOS version before adding it). The toggleable state still maps to a value, "1" or "0", and the label stays, so VoiceOver still says the name and on or off; only the role word is missing.

## The analogy

The painted set from puzzle 9's theatre. A sighted audience sees a painted door that's open or closed. A blind audience member hears the play through an audio describer (VoiceOver), who can only say what the script tells them: "door to the garden, a switch, now open". If the script says nothing about the door, the describer says nothing, however well it is painted.

## Check yourself

- You keep the `pointerInput` version but give the Icon a content description, "Bookmark". VoiceOver focuses it. What can the user learn?::*Its name, but not that it's a switch, nor whether it's on||Everything: the description is all VoiceOver needs to know >> A label names an element; the role, the state and the action come from toggleable. >> s2||Nothing: VoiceOver never reads icons, whatever their description >> An icon with a description gets a label and is read; it's the missing role and state that hurt here. >> the-building-block::A label alone doesn't make a control.
- Why does the fixed version set the Icon's own `contentDescription` to `null`?::*The control carries the label, so a second one could be read twice||Without it, toggleable throws an exception when it runs >> Nothing throws; the problem is what VoiceOver says. >> the-building-block||null hides the whole bookmark control from VoiceOver >> It hides only the picture's own description; the toggleable element still has its label, role and state. >> s4::One control, one label.
- A teammate replaces the custom icon with `IconToggleButton` and gives the Icon inside it the content description "Bookmark Lake walk". Is the label lost because it sits on the child?::*No: the button merges its children's semantics into itself||Yes: only modifiers on the button itself ever reach VoiceOver >> Material's buttons merge their children's semantics into one element. >> the-building-block||Yes: IconToggleButton has no semantics at all on iOS >> Material components come with semantics, and Compose Multiplatform maps them on iOS too. >> the-building-block::Merging lifts the child's label onto the control.

## Sources

- [Kotlin docs: Support for iOS accessibility features](https://kotlinlang.org/docs/multiplatform/compose-ios-accessibility.html) ("Screen readers and VoiceOver can access the content of the Compose Multiplatform UI."; "This is possible because semantics data produced by Compose APIs is now mapped to native objects and properties that are consumed by iOS Accessibility Services. For most interfaces built with Material widgets, this should happen automatically.")
- [Android Developers: Semantics](https://developer.android.com/develop/ui/compose/accessibility/semantics) ("Information about the meaning and role of a component in Compose is called semantics"; "The Role indicates the type of element."; "The ToggleableState is the current state of the Switch."; "the clickable and toggleable modifiers will automatically merge their descendants.")
- [Android Developers: Merging and clearing](https://developer.android.com/develop/ui/compose/accessibility/merging-clearing) (a custom toggle: ".toggleable(value = checked.value, onValueChange = { checked.value = it })" with "role = Role.Switch", and its Icon with "contentDescription = null // not needed here")
- [Android Developers: Accessibility API defaults](https://developer.android.com/develop/ui/compose/accessibility/api-defaults) ("Some graphic elements are purely decorative and you might not want to communicate them to the user. When you set the contentDescription parameter to null, you indicate to the Android framework that this element does not have associated actions or state.")
- [Compose Multiplatform source: SemanticConfigurationUtils.ios.kt](https://github.com/JetBrains/compose-multiplatform-core/blob/97210bb938d0143fd1bf0bea3d1b83a977568537/compose/ui/ui/src/iosMain/kotlin/androidx/compose/ui/platform/accessibility/SemanticConfigurationUtils.ios.kt#L73) ("if (contains(SemanticsProperties.ToggleableState)) { result = result or CMPAccessibilityTraitToggle }"; "Role.Switch -> { if (available(OS.Ios to OSVersion(major = 17))) { result = result or UIAccessibilityTraitToggleButton } }"; and for the value: "ToggleableState.On -> "1"", "ToggleableState.Off -> "0"")
- [Compose foundation source: Toggleable.kt](https://github.com/JetBrains/compose-multiplatform-core/blob/97210bb938d0143fd1bf0bea3d1b83a977568537/compose/foundation/foundation/src/commonMain/kotlin/androidx/compose/foundation/selection/Toggleable.kt#L126) (`public fun Modifier.toggleable(value: Boolean, enabled: Boolean = true, role: Role? = null, interactionSource: MutableInteractionSource? = null, onValueChange: (Boolean) -> Unit)`; "Configure component to make it toggleable via input and accessibility events"); and material3's IconButton.kt, where IconToggleButton uses ".toggleable(… role = Role.Checkbox …)"
