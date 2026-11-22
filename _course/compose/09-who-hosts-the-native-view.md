---
title: Which side hosts the other?
short: ComposeUIViewController and UIKitView
summary: Put the shared bookmarks screen inside an existing iOS app's navigation, then put Apple's own text field inside the shared screen, and follow the search text both ways across the edge.
takeaway: Going one way, a Kotlin function returns ComposeUIViewController { … }, and Swift pushes that controller like any other; Compose draws the whole screen inside it. Going the other way, UIKitView puts a UIKit view into a composable: factory creates it once, update copies state into it and runs again whenever the state it read changes, and onRelease cleans up. User edits come back through a native callback that writes the state.
---

## The problem

Puzzle 6 showed where Compose's iOS code lives: Compose UI's iosMain holds the view controller that hosts a Compose screen. Now we use it. Our shared bookmarks screen already runs on Android. On iOS, the app's existing UIKit navigation, with its back button and title bar, must show it as one more screen. Inside that screen, the search box should be Apple's own `UITextField`, the native text field, so typing behaves exactly as in every other iOS app. So UIKit hosts Compose, and Compose hosts a piece of UIKit. And when the user types, or taps Clear, which side has to tell the other?

## See it

```diagram who-hosts-the-native-view
```

## The building block

A **hosting boundary** is where one UI system gives a region of the screen to another: the outer one decides where the region sits and how big it is; the inner one draws everything inside. This screen has two, in opposite directions.

**UIKit hosts Compose.** In the iOS source set, a Kotlin function wraps the shared screen in a view controller:

```kotlin
// iosMain, in a file named main.ios.kt
fun MainViewController(): UIViewController =
    ComposeUIViewController { BookmarksScreen() }
```

`ComposeUIViewController` takes a composable lambda, the start of the Composer's journey from puzzle 0, and returns a plain `UIViewController`. Swift sees the function under a generated name made from the file name, `Main_iosKt`, and uses the controller like any other:

```swift
let bookmarks = Main_iosKt.MainViewController()
navigationController.pushViewController(bookmarks, animated: true)
```

The `UINavigationController`, UIKit's controller for a stack of screens with a back button, owns the title bar and the back swipe. Everything below the bar is Compose's: composition, layout and drawing (puzzle 5) all happen inside that one controller. A SwiftUI app does the same through `UIViewControllerRepresentable`, a small Swift wrapper whose `makeUIViewController` returns `Main_iosKt.MainViewController()`.

**Compose hosts UIKit.** Inside the shared screen, `UIKitView` cuts a region out of Compose's drawing and puts a real UIKit view there. It takes up to four things you'll use: `factory` creates the view, once, when the call first enters the composition; `modifier` sizes and places the region like any composable; `update` copies Compose state into the existing view; `onRelease` runs when the view leaves the composition for good, to clean up. Here is the search field, adapted from JetBrains' own example:

```kotlin
@OptIn(ExperimentalForeignApi::class)
@Composable
fun BookmarkSearch() {
    var query by remember { mutableStateOf("") }
    Column {
        UIKitView(
            factory = {
                val field = object : UITextField(CGRectMake(0.0, 0.0, 0.0, 0.0)) {
                    @ObjCAction
                    fun editingChanged() {
                        query = text ?: ""                  // native → Compose
                    }
                }
                field.addTarget(
                    target = field,
                    action = NSSelectorFromString(field::editingChanged.name),
                    forControlEvents = UIControlEventEditingChanged,
                )
                field
            },
            modifier = Modifier.fillMaxWidth().height(44.dp),
            update = { field ->
                if (field.text != query) field.text = query  // Compose → native
            },
            onRelease = { field -> field.resignFirstResponder() },
        )
        Button(onClick = { query = "" }) { Text("Clear") }
    }
}
```

Follow the text both ways.

**Typing.** UIKit reports edits the Objective-C way: `addTarget` tells the field to call a method by name whenever its text changes (the event `UIControlEventEditingChanged`). `@ObjCAction` makes the Kotlin function `editingChanged` callable that way, from Objective-C (the KMP course, puzzle 5). It writes the field's text into `query`, which is snapshot state, so everything that read `query` is marked (puzzle 3).

**Clear.** The button writes `query = ""`. Nothing in UIKit knows. The field only changes because `update` read `query` the last time it ran: `UIKitView`'s own documentation says update is "invoked once initially and then every time the state it reads changes". It's the same rule as a composable that read state, applied to a callback. So the write marks `update`, it runs, and it sets the field's text to "". The `if` stops it writing the same text back into the field while the user is typing.

Leave out `update`, or read `query` somewhere else, and Clear empties the state but the field keeps showing the old text: the two sides disagree. A field that only ever reports to Compose needs no `update`; one that Compose can also change needs both directions.

`onRelease` here hides the keyboard if the field still had it when the screen leaves. Release anything the view started (a timer, an observer, a playing video) the same way.

## Go deeper: Why not create the field outside and pass it in?

- You build the `UITextField` in a `remember { }` and return it from factory. Why does the documentation warn against that?::The view's lifetime belongs to `UIKitView`: it creates the view with factory, and releases it with onRelease when the call leaves the composition. The source's own comment: "T shouldn't be leaked outside and will be managed by Compose runtime efficiently. Remembering T externally and passing it to be returned from factory can (and probably will) lead to hilarious bugs in case onReset is not null." `onReset` is a fifth parameter that lets Compose reuse the same view for another item, in lazy lists for example; a view also held elsewhere would then be shared by two owners.

## The analogy

Our company's play is a guest in another theatre: the theatre's own stage manager (the navigation controller) decides when our play is on and keeps the curtain and the exit signs; inside our time slot, our crew runs everything (Compose). One scene uses a real piece of the host theatre's machinery, a working lift (the native field). We built the set around it, but the lift has its own controls: it rings our bell when someone rides it (editingChanged), and when the script changes, our crew sends it to the right floor (update).

## Check yourself

- You delete the `update` parameter and keep editingChanged. The user types "lake", then taps Clear. What does the field show?::*Still "lake": nothing copies the cleared query into the field||Empty: Compose redraws the field from query at the next frame >> Compose draws around the field; UIKit draws the field itself, and only update writes into it. >> s4||Empty: factory runs again and makes a new, empty field >> factory runs once, when the field first enters the composition. >> the-building-block::State reaches the native view only through update.
- Why does `update` run again when Clear sets query to ""?::*It read query while it ran, so the write marks it||UIKit calls update after every tap anywhere on the screen >> UIKit doesn't know update exists; Compose runs it. >> s5||Compose calls update on every single frame, just in case >> It runs once at first and then only when state it read changes. >> the-building-block::Reads mark readers, even in a callback.
- An existing UIKit app with a `UINavigationController` wants the shared bookmarks screen as its next screen. What does its Swift code push?::*The controller that MainViewController() returns||A UIKitView that holds the whole bookmarks screen >> UIKitView goes the other way: a UIKit view inside Compose. >> s2||The composable BookmarksScreen(), called directly from Swift >> A composable needs a Composer handed to it (puzzle 0); only ComposeUIViewController starts one. >> s1::UIKit hosts Compose through a view controller.

## Sources

- [Kotlin docs: Integration with the UIKit framework](https://kotlinlang.org/docs/multiplatform/compose-uikit-integration.html) ("To use Compose Multiplatform inside a UIKit application, add your Compose Multiplatform code to any container view controller."; "UINavigationController(rootViewController: composeViewController)"; "To use UIKit elements inside Compose Multiplatform, add the UIKit elements that you want to use to a UIKitView from Compose Multiplatform."; "The editingChanged() function is annotated with @ObjCAction so that it can interoperate with Objective-C code."; "The action parameter of the addTarget() function passes the name of the editingChanged() function, triggering it in response to a UIControlEventEditingChanged event."; "The update parameter of UIKitView() is called when the observable message state changes its value."; "The function updates the text attribute of the UITextField so that the user sees the updated value.")
- [Kotlin docs: Integration with the SwiftUI framework](https://kotlinlang.org/docs/multiplatform/compose-swiftui-integration.html) ("fun MainViewController(): UIViewController = ComposeUIViewController { … }"; "ComposeUIViewController() is a Compose Multiplatform library function that accepts a composable function as the content argument."; "struct ComposeViewController: UIViewControllerRepresentable { func makeUIViewController(context: Context) -> UIViewController { return Main_iosKt.MainViewController() } … }"; "Main_iosKt.MainViewController is a generated name.")
- [Compose Multiplatform source: UIKitView.ios.kt](https://github.com/JetBrains/compose-multiplatform-core/blob/97210bb938d0143fd1bf0bea3d1b83a977568537/compose/ui/ui/src/iosMain/kotlin/androidx/compose/ui/viewinterop/UIKitView.ios.kt#L26) ("Compose a [UIView] of class [T] into the UI hierarchy."; "@param update A callback to be invoked every time the state it reads changes. Invoked once initially and then every time the state it reads changes."; "@param onRelease A callback invoked as a signal that the [T] has exited the composition forever. Use it to release resources and stop jobs associated with [T]."; "[T] shouldn't be leaked outside and will be managed by Compose runtime efficiently."; `fun <T : UIView> UIKitView(factory: () -> T, modifier: Modifier = Modifier, update: (T) -> Unit = NoOp, onRelease: (T) -> Unit = NoOp, onReset: ((T) -> Unit)? = null, properties: UIKitInteropProperties = UIKitInteropProperties.Default)`)
- [Compose Multiplatform source: ComposeUIViewController.ios.kt](https://github.com/JetBrains/compose-multiplatform-core/blob/97210bb938d0143fd1bf0bea3d1b83a977568537/compose/ui/ui/src/iosMain/kotlin/androidx/compose/ui/window/ComposeUIViewController.ios.kt#L34) (`fun ComposeUIViewController(content: @Composable () -> Unit): UIViewController`)
