---
title: Can VoiceOver understand the bookmark?
short: Can VoiceOver understand the bookmark?
summary: A custom bookmark icon looks right. Make its action understandable without seeing the screen.
takeaway: Compose semantics describe meaning and actions independently from pixels. On iOS the mapping to native accessibility information makes those semantics available to VoiceOver.
---

## The problem

Puzzle 8 placed the shared screen inside an iOS controller and a native field inside the screen. The rest of the screen is still drawn by Compose, as pixels. A custom icon toggles a bookmark and changes from outline to solid. A sighted person can see the difference. What information can a person using VoiceOver get?

## See it

```diagram pixels-and-voiceover
```

## The building block

**Accessibility semantics** are UI descriptions that a device's assistive technology can use, such as a label, a role, a current state or an action. On iOS, the screen reader is VoiceOver. Compose Multiplatform maps its semantics data to native accessibility services.

For this bookmark, expose what the control does and whether the item is currently saved. Prefer a control that already represents a toggle, then give it a meaningful label and expose the checked state. Keep the icon decorative if the surrounding control already provides the complete description.

| Situation | What the user should be able to learn |
|---|---|
| Focus before saving | Which item the action applies to and whether it is saved |
| Activate the control | That bookmarking can be toggled |
| Focus after saving | That the item is now saved |

A visual check proves part of the behavior. On an iPhone, verify focus order, spoken meaning and whether activating the item changes the state. Test a native field embedded in the same screen independently as well. At the hosting boundary, its view and interaction differ from the surrounding shared UI.

## Go deeper: Design a two-platform check

- What would a useful check record if the same icon works on iOS and Android?::Record the focused control, distinguish its saved and unsaved states, activate it with the platform screen reader, and verify the result. Keep platform-specific wording separate from the intended meaning.

## The analogy

The painted set from puzzle 8's theatre. A sighted audience sees a painted door that's open or closed. A blind audience member hears the play through an audio describer (VoiceOver), who can only say what the script tells them: "door, closed, opens on a tap". If the script says nothing about the door, the describer says nothing, however well it is painted.

## Check yourself

- The icon is solid after saving, but the action has no label or state. What is the missing signal?::*A semantic description of the action and its state||A larger solid icon so the change is easier to see >> Changing pixels does not expose a saved state to the screen reader. >> the-building-block||An extra native navigation bar above the control >> The navigation bar does not describe an unlabeled bookmark. >> the-building-block::Provide the meaning of the control along with its pixels.
- The button already provides the full label. What can duplicate text on the icon cause?::*The same meaning may be announced more than once||The button automatically loses its saved state >> Duplicating the name does not remove the state. >> the-building-block||The native field stops reporting text edits >> This concerns focus and labels on the bookmark. >> the-building-block::Describe one logical control coherently.
- An automated check finds the icon. Which additional check best verifies the intended interaction?::*Focus and activate the bookmark with VoiceOver on an iPhone||Check only whether the icon is filled in a screenshot >> A screenshot checks pixels instead of the screen reader interaction. >> the-building-block||Check only whether the page loads without crashing >> Successful navigation does not verify the label or toggle. >> the-building-block::Check focus, spoken meaning and a changed state.

## Sources

- [JetBrains: iOS accessibility](https://kotlinlang.org/docs/multiplatform/compose-ios-accessibility.html)
- [Android Developers: Compose semantics](https://developer.android.com/develop/ui/compose/accessibility/semantics)
