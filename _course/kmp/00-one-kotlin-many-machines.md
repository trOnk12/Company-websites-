---
title: One Kotlin function, two ways to run it
short: Compiler and targets
summary: Follow the same addition from Kotlin source to Android and iOS. At each step, find out what is produced and what can run it.
takeaway: For Android, Kotlin produces class files, the Android build turns them into DEX, and ART runs the DEX on the phone. For iOS, Kotlin/Native produces machine code during the build. In both cases, the processor ultimately runs machine instructions.
---

## The problem

Write one Kotlin function:

```kotlin
fun add(a: Int, b: Int) = a + b
```

An Android app and an iOS app call it with 2 and 3. Both show 5. What instructions did each phone actually run, and who made those instructions?

## See it

```diagram targets
```

## The building block

A processor carries out small, encoded commands, such as adding two numbers. A **compiler** reads the Kotlin text and produces another form of instructions. Its **front end** understands the Kotlin rules. Its **back end** produces instructions for the environment you're building for. A **target** is that destination, such as Android or iOS.

**Bytecode** is an instruction format a program can read and run. **Native code** is made of instructions the processor understands directly. Here is where each form goes for our addition.

| When | Android | iOS |
|---|---|---|
| While building | Kotlin produces class files with Java bytecode. The Android build converts it into DEX, Android's bytecode format. | Kotlin/Native produces native code for the iOS target. That code can be packaged into the iOS app. |
| On the phone | ART, the Android Runtime, runs the DEX. It can read the DEX instructions and carry them out, or compile them to native code. Either way, the processor executes native instructions. | When the app calls the function, the processor runs the native instructions built for iOS. |

A desktop JVM app can use the class-file format directly. The JVM, or Java Virtual Machine, is the runtime for Java bytecode on that path. Android apps use the DEX path shown here.

Think of the Android runtime reading an instruction that means “add these two values.” The runtime itself is a program running on the processor. If ART compiles that code to native instructions ahead of the call, the processor can run those instructions directly. The iOS build has already produced native instructions for the function. Both executions still need the processor.

## Go deeper: How does a processor add two numbers?

Suppose it already has 2 and 3 in two *registers*, small places inside the processor that hold values it is working on. We'll call the registers `w0` and `w1`.

The following is an example of a real Arm instruction, written as text so we can read it. The processor itself reads the bits that encode it. This example is chosen to show the idea. A compiler may choose other instructions or work out the answer in advance.

```text
add w0, w0, w1
```

1. *Fetch.* The processor reads the instruction from the address of the current instruction.
2. *Decode.* It reads the parts of the instruction: add, read the values in `w0` and `w1`, write to `w0`.
3. *Execute.* The addition produces 5. The processor writes 5 to `w0`. The instruction leaves `w1` holding 3.

- Change only the destination: `add w1, w0, w1`. Which register holds 5?::The instruction reads the same two values, so the sum stays 5. The first register keeps 2 and the second gets 5.

## Go deeper: How do values get into registers?

Imagine 2 and 3 are in memory instead. Each value is at an *address*, a number that tells the processor where to look. Arm has separate instructions for moving values between memory and registers.

| Instruction | What changes in our example |
|---|---|
| Load the first input | Copy 2 from its memory address into `w0`. |
| Load the second input | Copy 3 from its memory address into `w1`. |
| Add into `w0` | Update the register to 5. The values in memory are still 2 and 3. |
| Store `w0` at the result address | Copy 5 from the register to the result's place in memory. |

- Predict what happens if you skip the store.::The processor still calculated 5. Code that later reads the result address in memory will still see the old value there.

Now return to the two paths above. The processor knows how to work with instructions like these. ART can get the same job done from DEX instructions, and the iOS build supplies native instructions up front.

## The analogy

One recipe goes to two kitchens. One has a cook who follows a translated recipe during service. The other has the instructions prepared for its own equipment in advance. In both kitchens, the stove still does the heating.

## Check yourself

- Your Android build has produced Kotlin class files, then stops before making DEX. Which step is still missing before those classes can run as part of the app?::*The Android build must convert the class files into DEX||ART must first turn them into DEX on the phone >> ART runs DEX on the phone. It gets the DEX that the build produced. >> s3||Kotlin/Native must produce the DEX >> Kotlin/Native is the iOS path here. The Android build produces the DEX. >> s4::Follow the output of the build up to the moment it reaches the phone.
- You have the finished DEX file. Why can't an iOS app replace its compiled Kotlin code with that file and call it in the same way?::*DEX is meant for ART. This iOS app uses native code.||Any file made from Kotlin can be used on both phones >> The same source can build for both targets, but their outputs have different consumers. >> s4||The iOS processor cannot perform the same addition >> Both phones have processors that can add. The instruction formats delivered by the builds are different. >> s1::Identify what reads each file before asking whether the processor can run it.
- ART compiles the DEX for the addition to native code. When the compiled function runs, what carries out the addition?::*The processor executes native instructions, as it does for the iOS build||The processor executes the original Kotlin text >> The source is an input to the compiler. It isn't the code the processor runs. >> s2||The processor can now execute a DEX instruction directly >> ART produced a different form: native instructions the processor understands. >> the-building-block::Trace the last hand-off, from the runtime or the build to the processor.

## Sources

- [Kotlin docs: Kotlin/Native overview](https://kotlinlang.org/docs/native-overview.html) ("compiling Kotlin code to native binaries that can run without a virtual machine")
- [Android Developers: D8](https://developer.android.com/tools/d8) ("compile your project's Java bytecode into DEX bytecode that runs on Android devices")
- [Android Open Source Project: Configure ART](https://source.android.com/docs/core/runtime/configure) ("a hybrid combination of AOT compilation, just-in-time (JIT) compilation, and interpretation")
- [Arm: A64 Instruction Set Architecture Guide](https://documentation-service.arm.com/static/674d8b61c7fc0d1f211dc776), sections on registers, arithmetic, and loads and stores ("transfer a single value between memory and the general-purpose registers")
