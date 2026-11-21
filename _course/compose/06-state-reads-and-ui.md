---
title: Who read the bookmark count?
short: Who read the bookmark count?
summary: Tap a bookmark. Work out which part of a shared screen has to run again.
takeaway: A read of observable state gives Compose a dependency to track. When the value changes, Compose can revisit the parts that read it.
---

## The problem

A reading app has a header that shows the number of bookmarks and a card with a static title. Tapping a bookmark changes the count from 2 to 3. How does Compose know which code needs to run again?

## See it

```diagram state-reads-and-ui
```

## The building block

A **tracked state read** is a dependency that Compose records when your code reads an observable value. Here the header reads the bookmark count inside a composable function, a function that describes UI.

```kotlin
@Composable
fun BookmarkCount(count: State<Int>) {
    Text("Bookmarks: ${count.value}")
}
```

The button event changes the observable count held elsewhere. Compose schedules **recomposition**, running again the parts of the composition that need to update their UI description. The header reads 3 and describes new text. A sibling with a static title has no dependency on this count. Compose can skip unrelated work when it can reuse the result.

That dependency comes from the read. Holding a reference to the state object and reading its value are different operations. If you read the value at the screen's top and hand an integer down, the read happened at the top, even though the header displays it.

## Go deeper: Move one read

- If the header receives a state object and only reads its value inside the header, where is the observable read?::It takes place in the header. Passing the object from the parent does not by itself read the count.

## Check yourself

- Only the count changes. Which UI code depends directly on the count?::*The header that read the count||Every sibling on the screen >> A sibling without the read has no direct dependency. >> the-building-block||Only the code handling the tap >> The tap writes the value. The header reads it. >> the-building-block::Locate the observable read.
- The parent now reads the integer and passes it to the header. Where does Compose observe that read?::*In the parent code||In the header that displays it >> The header receives an integer. The parent read the observable value. >> the-building-block||In the button code that changes it >> Writing the count and observing it are separate. >> the-building-block::The location of the actual read determines the dependency.
- The count is stored only in an ordinary mutable field. What change would let Compose observe edits?::*Store the value in observable state and read it in the UI||Move the ordinary field into the header and keep writing it >> Moving an ordinary field does not make its reads observable. >> the-building-block||Write the same ordinary field twice on each tap >> Two writes still provide no observable dependency. >> the-building-block::Use an observable value and actually read it.

## Sources

- [Android Developers: Lifecycle of composables](https://developer.android.com/develop/ui/compose/lifecycle)
- [Android Developers: State and Jetpack Compose](https://developer.android.com/develop/ui/compose/state)
