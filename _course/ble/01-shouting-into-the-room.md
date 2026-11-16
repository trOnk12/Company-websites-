---
title: Shouting into the room
short: Advertising and scanning
summary: In puzzle 0, the strap's radio slept almost all the time. Here's how a device that's nearly always asleep still gets found.
takeaway: A device advertises: it wakes, sends a short packet on each of the 3 advertising channels, and sleeps, over and over at its advertising interval. A phone scans: it listens on those channels until one packet lands while it's listening.
---

## The problem

In puzzle 0, the strap's radio slept almost all the time to save its battery. But you open an app, and your phone finds the strap in a second or two. How does a phone find something that's nearly always asleep?

## See it

```diagram advertising
```

## The building block

The strap takes turns being loud for a moment. It wakes, sends a **packet**, one short burst of data, that says "I'm a heart strap, here's my name", listens for a moment in case someone answers (puzzle 2 uses that), and goes back to sleep. Doing that over and over is **advertising**.

The time between two advertisements is the **advertising interval**: at least 20 ms, and it can be seconds or much longer. Short means found fast; long means a longer battery life. To every interval the radio adds a random delay of 0 to 10 ms. Two packets sent at the same moment on the same channel garble each other: a collision. If two straps happened to start together, the random delays make them drift apart instead of colliding every time.

BLE splits its airwaves into 40 **channels**, like stations on a radio dial: a radio sends or listens on one at a time. Advertising uses only 3 of them, and each advertisement is sent on all 3, one after another. Three is few enough that a listener knows where to listen, and more than one, so noise on a single channel (another radio, like Wi-Fi, sending on the same slice) doesn't hide the strap.

Your phone, meanwhile, is **scanning**: listening on the advertising channels. It can't hear all three at once, so it listens on one for a while, then the next. When the strap shouts on the channel the phone is listening to, the phone hears it.

## The analogy

The lighthouse from puzzle 0 flashes its lamp in three directions, one after another, anything from many times a second to every few seconds. A ship's lookout watches one direction at a time. Sooner or later, a flash lands where the lookout is looking.

## Check yourself

- You shorten a strap's advertising interval from 1 s to 100 ms. What changes?::*Phones find it faster, and its battery drains faster||Nothing for the battery: advertising is free >> Every advertisement wakes the radio. Ten times as many means ten times the radio time. >> s2||Phones find it slower, because it's busier >> More advertisements give the phone more chances to hear one, so finding gets faster. >> s2::Advertise often to be found fast; rarely to last long.
- Why does each advertisement go out on three channels, not one?::*So noise on one channel doesn't hide the device, while listeners still know where to look||Because the phone needs all three copies to read the packet >> Any one copy is enough. The other two are backups against noise. >> s3||To send three times as much data >> It's the same packet three times, on three channels. >> s3::Few enough to find, more than one to survive noise.
- What's the difference between advertising and scanning?::*Advertising is the small device sending "I'm here"; scanning is the phone listening for it||They're two names for the same thing >> They're the two sides: one shouts, the other listens. >> s4||Scanning is the phone sending a request to every device nearby >> Scanning here is listening, not sending: the phone hears advertisements. >> s4::One side shouts, the other listens.

## Sources

- [Bluetooth Core Specification 5.4, Vol 6, Part B: Link Layer](https://www.bluetooth.com/wp-content/uploads/Files/Specification/HTML/Core-54/out/en/low-energy-controller/link-layer-specification.html) ("40 RF channels are defined… divided into 3 RF channels known as the 'primary advertising channels'… and 37 RF channels known as the 'general-purpose channels'"; "The advertising interval (advInterval) shall be an integer multiple of 0.625 ms in the range 20 ms to 10,485.759375 s. The advDelay is a (pseudo-)random value with a range 0 ms to 10 ms"; "When scanning, the Link Layer shall listen on the primary advertising physical channel")
