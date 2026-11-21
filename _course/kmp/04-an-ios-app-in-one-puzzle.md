---
title: An iOS app in one puzzle
short: Swift, Xcode and view controllers
summary: The next puzzles put your Kotlin inside an iOS app. If you've never opened one, here's the minimum: the language, the tool, and the iOS piece that plays the role of an Activity, with Android names next to each.
takeaway: iOS apps are written in Swift, in Xcode, Apple's IDE. Screens are built with UIKit, Apple's screen framework (or the newer SwiftUI). A view controller manages one screen's UI elements and reacts to the user, much like an Activity or Fragment. Swift looks like Kotlin: let is val, var is var, and a class can subclass UIViewController the way yours subclasses Activity.
---

## The problem

From the next puzzle on, Swift code calls your Kotlin. You've never read **Swift**, iOS's language, never opened **Xcode**, Apple's IDE, and you don't know what an iOS screen is made of. What's the smallest picture you need?

## See it

```diagram iosapp
```

## The building block

Four names, each with its Android twin:

| iOS | What it is | On Android |
|---|---|---|
| **Swift** | The language of iOS apps | Kotlin |
| **Xcode** | Apple's IDE, which builds and runs the app | Android Studio |
| **UIKit** | Apple's framework for screens: buttons, lists, text | the View system |
| **view controller** | Manages one screen's UI elements and reacts to the user | an Activity or Fragment |

A minimal screen in Swift:

```swift
import UIKit

class GreetingViewController: UIViewController {
    let label = UILabel()           // let is Kotlin's val

    override func viewDidLoad() {   // like onCreate
        super.viewDidLoad()
        label.text = "Hello"
        label.frame = view.bounds
        label.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.addSubview(label)
    }
}
```

Swift will feel close to Kotlin: classes, `override`, optional types written with `?`, and lambdas (Swift has its own name for them, coming in puzzle 8). Newer iOS apps often use **SwiftUI**, Apple's declarative UI, the way newer Android apps use Compose; KMP works with both.

Where does your Kotlin fit? It becomes a library this app imports (puzzle 5), and Swift code, often inside a view controller, calls it.

## The analogy

Moving to a city where the streets have different names but the same layout. "Main Street" is "Hauptstraße"; once you have the map of names, you find your way.

## Check yourself

- Which iOS piece plays the role of an Activity?::*A view controller: it runs one screen and reacts to the user||Xcode, because it starts the app the way Android starts an Activity >> Xcode is the IDE; it builds the app, it isn't part of it. >> the-building-block||UIKit itself, since it holds the screen >> UIKit is the framework; a view controller is one screen built with it. >> the-building-block::One screen, one view controller.
- In Swift, `let label = UILabel()`. What's the Kotlin equivalent of `let`?::*`val`: set once, never reassigned||A variable you can reassign later >> That's Swift's var; `let` is fixed once set. >> the-building-block||`fun`: it declares a function named label >> `let` declares a value, like `val`. >> the-building-block::let is val.
- What's the difference between UIKit and SwiftUI?::*UIKit builds screens from UI objects you change, while SwiftUI describes them declaratively, like Compose||UIKit describes screens declaratively, like Compose, while SwiftUI builds them from UI objects you change >> That's the two swapped. >> the-building-block::Objects vs descriptions.

## Sources

- [Apple: UIViewController](https://developer.apple.com/documentation/uikit/uiviewcontroller) ("A view controller's main responsibilities include the following: Updating the contents of the views, usually in response to changes to the underlying data; Responding to user interactions with views")
- [The Swift Programming Language: The Basics](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/thebasics/) (constants are declared with `let`, variables with `var`)
