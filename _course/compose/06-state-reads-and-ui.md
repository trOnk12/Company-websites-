---
title: Who read the bookmark count?
short: Who read the bookmark count?
summary: Module 1 took Compose apart. Now a real shared screen. Tap a bookmark, find where the count is read, and move that read so only the header runs again.
takeaway: The group that runs again is the one where the state read happened, not the one that shows the value. Pass the state object, or a lambda that reads it, down to the composable that needs the value, and a change marks only that composable. That's deferring a read.
---

## The problem

Module 1 ended with the whole stack, from the compiler plugin down to the edge that meets the phone. Now we use it on one shared screen that runs on Android and iOS. A reading app shows a header with the number of bookmarks and a list of saved items below it. Tapping a bookmark changes the count from 2 to 3. Puzzle 2 said Compose marks the groups that read the count. On this screen, which group is that, and how much of the screen runs again?

## See it

```diagram state-reads-and-ui
```

## The building block

The obvious version reads the count at the top and hands a number down:

```kotlin
@Composable
fun BookmarksScreen(count: State<Int>) {
    BookmarkHeader(count = count.value)   // the read happens here
    BookmarkList()
}
```

`count.value` is evaluated while `BookmarksScreen` runs, so the state read is noted against the screen's group. A tap marks the screen, and the whole screen body runs again: the header gets a new number and runs, and the list is skipped only because its arguments are equal (puzzle 3). On a small screen that's cheap. On a big one, or with a value that changes on every frame, it's work you don't need.

The fix is to move the read to where the value is used. Pass a lambda that reads the count, and call it inside the header:

```kotlin
@Composable
fun BookmarksScreen(count: State<Int>) {
    BookmarkHeader(count = { count.value })   // no read here
    BookmarkList()
}

@Composable
fun BookmarkHeader(count: () -> Int) {
    Text("Bookmarks: ${count()}")             // the read happens here
}
```

Now the screen never reads the count. The lambda runs, and reads it, while `BookmarkHeader` runs, so the read is noted against the header's group. A tap marks only the header, and the screen and the list don't run at all. That's **deferring a read**: moving a state read out of a parent and into the child that needs the value, so less code runs again when it changes. Passing the `State` object itself works the same way, as long as the child is the one that reads `.value`.

The lambda doesn't cost you skipping either. Under strong skipping (puzzle 3), the compiler remembers lambdas written inside a composable, so when the screen runs again for another reason, the header gets the same lambda instance and is skipped.

Deferring is a tool, not a rule. Android's guide lists it under fixing a performance issue you've found: reach for it when a value changes often, or the parent is big.

## Go deeper: Move one read

- If the header receives the state object and reads its value inside the header, where is the state read?::In the header. Passing the object from the parent doesn't read the count; only reading `.value` does, and that happens while the header runs.

## The analogy

The theatre's scoreboard. If the stage manager reads the score and calls the number to one performer, a change of score means the stage manager's whole scene is redone. Hand the performer a window onto the scoreboard instead, and only that performer's line is redone when the score changes.

## Check yourself

- The screen reads `count.value` and passes the number to the header. A tap changes the count. Which group does Compose mark?::*The screen's, because the read happened while the screen ran||Only the header's, because the header shows the number >> Compose follows where the read happened, not where the value is shown. >> s4||Every group in the app, starting from the root >> A write marks only the groups that read the value. >> s3::The read decides which group is marked.
- Why does passing a lambda that reads `count.value`, instead of `count.value` itself, move the rerun into the header?::*The lambda is called, and reads the count, while the header runs||The lambda copies the count, so the screen no longer holds the state >> The lambda reads the same state; what moves is when and where the read happens. >> the-building-block||Compose never compares lambdas, so it reruns the header on every frame >> Nothing reruns on every frame; a tap marks only the group that read the count. >> s5::Where the read runs is where it's noted.
- After deferring the read, the screen runs again for another reason, and passes the header the same lambda that reads `count.value`. Does the header run?::*No: strong skipping remembered the lambda, so the same instance comes back||Yes: a lambda is unstable, so it always counts as changed >> Unstable arguments are compared by instance, and the remembered lambda is the same instance. >> the-building-block||Yes: the header read the count, so it runs whenever the screen does >> A read marks the header only when the count changes; here it didn't. >> the-building-block::Remembered lambda, same instance, skipped.

## Sources

- [Android Developers: Follow best practices](https://developer.android.com/develop/ui/compose/performance/bestpractices) ("Defer reads as long as possible When a performance issue has been identified, deferring state reads can help."; "if your UI has state that is hoisted high up in the composable tree and you read the state in a child composable, you can wrap the state read in a lambda function. Doing this makes the read occur only when it is actually needed."; "Deferring state reads will ensure that Compose re-runs the minimum possible code on recomposition.")
- [Android Developers: Strong skipping mode](https://developer.android.com/develop/ui/compose/performance/stability/strongskipping) ("With strong skipping enabled, every lambda inside a composable function will be automatically remembered.")
- [Android Developers: Jetpack Compose phases](https://developer.android.com/develop/ui/compose/phases) ("When you read the value of a snapshot state during one of the phases listed previously, Compose automatically tracks what it was doing when it read the value.")
