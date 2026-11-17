---
title: On the phone or in the cloud
short: On-device models
summary: Puzzle 6 put a server between your app and the model. For some features you can skip the server and the network entirely: Android ships a model that runs on the phone. Here's what it's good at, what it costs you, and how to choose.
takeaway: An on-device model like Gemini Nano runs on the phone through Android's AICore service: no network, no per-request bill, and the data never leaves the device. In exchange it's smaller than cloud models and available only on supported devices. Use it for short, private, frequent tasks; use a cloud model behind your backend for hard ones; and design a fallback for devices that can't run it.
---

## The problem

You want "smart reply" suggestions in a messaging app. Sending every private message to a cloud model raises privacy questions, costs money per message, and fails in a tunnel. Is there another way?

## See it

```diagram ondevice
```

## The building block

An **on-device model** runs on the phone itself. On Android, Google's Gemini Nano runs inside **AICore**, a system service that uses the device's hardware and keeps the model updated. Apps reach it through ML Kit's GenAI APIs: ready-made tasks like summarising, proofreading and rewriting, and a Prompt API (beta) for your own prompts.

What you gain:

- No network: it works in a tunnel, and there's no wait for a request to reach a server and the answer to come back.
- Privacy: the text never leaves the phone.
- No per-request bill: there's no API to pay for each call.

What you give up:

- Size: a model that fits on a phone is much smaller than a cloud model, so hard reasoning and long documents are out of reach.
- Reach: it runs only on devices that support it, and different devices can run different versions of Gemini Nano. Your feature needs a plan for the rest: a cloud fallback through your backend (puzzle 6), or a simpler feature.

So the decision is per feature. Short, frequent, private tasks the user triggers inside your app, like smart replies or tidying a note, suit the phone. Three limits shape the design: AICore runs the model only while your app is the top foreground app (a foreground service doesn't count); each app has a request **quota**, a cap on how many requests it may make in a period, so a burst gets a BUSY error to retry with backoff, plus a longer battery quota; and the model may need downloading first. So check the feature's status before you offer it, and show it only when it's ready. Long or hard ones, like answering questions over many documents, go to the cloud, behind your backend.

## The analogy

A pocket calculator and a call to an accountant. The calculator is instant, free and private, for everyday sums. For a tax return, you call the accountant, and pay for it.

## Check yourself

- Which feature suits an on-device model best?::*Smart replies for private messages, short and frequent||Answering questions over a 200-page manual >> Long documents and hard reasoning need a bigger, cloud model. >> s4||Generating a full marketing report from sales data >> A long, hard task suits a cloud model behind your backend. >> s4::Short, frequent, private.
- Your smart-reply feature uses Gemini Nano. What must you plan for?::*Devices that don't support it, with a fallback or a simpler feature||A network error whenever the phone goes offline mid-reply >> On-device runs without a network; that's one of its gains. >> s2||Protecting the API key that the app sends to the model >> There's no API key: the model runs in AICore on the phone. >> s2::Not every device can run it.
- What's the difference between an on-device model and a cloud model behind your backend?::*The on-device one runs on the phone with no network, while the cloud one is bigger but needs the network||The on-device one is bigger but needs the network, while the cloud one runs on the phone >> That's the two swapped. >> the-building-block::Local and small vs remote and big.

## Sources

- [Android Developers: Gemini Nano](https://developer.android.com/ai/gemini-nano) ("Gemini Nano lets you deliver rich generative AI experiences without needing a network connection or sending data to the cloud. On-device AI is a great solution for use-cases where low cost and privacy safeguards are your primary concerns"; "Gemini Nano runs in Android's AICore system service, which leverages device hardware to enable low inference latency and keeps the model up-to-date")
