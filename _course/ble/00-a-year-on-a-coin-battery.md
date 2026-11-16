---
title: A year on a coin battery
short: Why "low energy"
summary: A heart-rate strap runs for months on a battery the size of a coin. Here's the one idea that makes that possible, and that every later puzzle follows from.
takeaway: The radio is the hungriest part of a small device. BLE keeps it off almost all the time and wakes it only for short, planned moments. Every rule in this course follows from that.
---

## The problem

Your Bluetooth headphones need charging every day or two. A heart-rate strap, a key finder or a plant sensor runs for months on a battery the size of a coin. Both talk over Bluetooth. What do the small devices do differently?

## See it

```diagram battery
```

## The building block

A device's **radio** is the part that sends and listens over the air. A radio that is on, sending or just listening, uses far more power than the rest of the device asleep. For a small device, it's the hungriest part.

**Bluetooth Low Energy**, **BLE** for short, is the kind of Bluetooth built for tiny batteries. Its trick is simple to say: keep the radio off almost all the time. The device sleeps, wakes for a few milliseconds to send or listen, and goes back to sleep for a long while: anything from milliseconds to seconds. Your headphones use the original Bluetooth, which keeps the radio busy streaming sound; that's why they need charging every day or two.

That creates the two problems the next puzzles solve. A device that's asleep almost all the time is hard to find: how does your phone ever hear it? (puzzle 1) And once they've found each other, how do two devices that both sleep meet at the same moment? (puzzle 2)

## The analogy

A lighthouse keeper on a tiny budget. Leaving the lamp on all night empties the fuel tank. So the keeper flashes it for a split second, then waits, then flashes again. Ships learn to watch for the flashes.

## Check yourself

- A strap's battery is nearly empty after two days instead of months. What's the most likely cause?::*Its radio is awake far more often than it needs to be||Its battery is too small for BLE >> BLE is built for coin-sized batteries: the size isn't the problem, how long the radio is on is. >> s3||It's sending too much data at a time >> What drains the battery is how long the radio is awake, waking often or staying on; the busy moments are short. >> s2::Battery life is decided by how much of the time the radio is on.
- Why does BLE save power by sleeping, instead of by sending less data?::*A radio that's on costs a lot even just listening; being off is the saving||Because a sleeping radio sends smaller messages when it wakes >> Sleeping doesn't change the messages; it changes how long the radio is on. >> the-building-block::Being on, even just listening, is the cost; sleeping is the saving.
- What's the difference between BLE and the Bluetooth in your headphones?::*BLE sleeps almost all the time; headphone Bluetooth streams sound nonstop||They're the same Bluetooth; BLE is the newer name for it >> They share the name and the airwaves, but BLE's whole design is about keeping the radio off. >> s3::Same airwaves, different goal: BLE optimizes for battery, not for streaming.

## Sources

- [Bluetooth Core Specification 5.4, Vol 6, Part B: Link Layer](https://www.bluetooth.com/wp-content/uploads/Files/Specification/HTML/Core-54/out/en/low-energy-controller/link-layer-specification.html) (devices meet at planned moments: "A connection event is a point of synchronization between the Central and the Peripheral")
