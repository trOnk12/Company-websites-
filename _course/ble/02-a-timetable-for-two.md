---
title: A timetable for two
short: Connections
summary: In puzzle 1, the phone found the strap by listening to its advertisements. Now two devices that both sleep need to talk again and again, without missing each other.
takeaway: In a connection, the central (the phone) sets a timetable: meet every connection interval, 7.5 ms to 4 s. At each connection event both wake, exchange packets on a channel picked by a shared rule, and go back to sleep.
---

## The problem

In puzzle 1, the phone found the strap by listening until an advertisement landed. That's fine for finding it once. But a heart rate changes every second, and both radios want to sleep. If they only meet by luck, data arrives late or not at all. How do two sleepers meet on time, every time?

## See it

```diagram connection
```

## The building block

The phone answers an advertisement with a request to connect, in the moment the strap listens after advertising (puzzle 1). From then on, the two are in a **connection**, and each has a role. The side that sent the request becomes the **central**, which sets the timing: usually the phone, because the phone is the one that goes looking. The side that advertised becomes the **peripheral**, which follows it: usually the small device.

In its request, the central sets a timetable: meet every **connection interval**. The same request also carries the rule for picking each meeting's channel, so both sides know it from the start. The connection interval is a multiple of 1.25 ms, from 7.5 ms up to 4 s. Short means data moves sooner but more radio time; long means slow replies and a longer battery life. The central can change it later.

Each meeting is a **connection event**. Both radios wake at the agreed moment, exchange packets, and sleep again until the next one. If neither has anything to say, they swap tiny empty packets, just enough to stay in step. Because both know the timetable, neither has to listen in between.

Each connection event happens on a different channel, picked from the 37 non-advertising channels by a rule both sides know. If one channel is noisy, only the events that land on it suffer.

## The analogy

Two lighthouse keepers who need to talk every night agree on a time: "every hour, on the hour". At each hour both light up, signal, and go dark again. And each hour they use a different color, picked by a list both have, so fog on one color doesn't silence them.

## Check yourself

- A heart strap's connection interval is 1 s. Your app shows the heart rate. What does the user notice?::*New values arrive only at the meetings, once a second||Nothing: the strap sends each value the moment it's measured >> Packets only travel at connection events; between them both radios sleep. >> s3||The connection drops, because 1 s is longer than BLE allows >> Anything up to 4 s is allowed. It's slow, not broken. >> s2::Data can only move when the two sides meet.
- Why does the phone, not the strap, set the timetable?::*Because the phone sent the request, so it's the central, which sets the timing||Because the strap's battery is smaller, so the phone is put in charge >> Battery size isn't what decides it: the roles do. The central sets the timing. >> s1||Because the strap's radio can't keep time on its own >> Both radios keep time; the rule is that the central decides. >> s2::Roles: the central sets the timing, the peripheral follows.
- What's the difference between a connection interval and an advertising interval?::*One is how often a device shouts to be found, the other how often two meet||They're the same setting: after connecting, it's renamed >> One is for being found by anyone, the other is a timetable for two devices that already found each other. >> s2::One finds; the other keeps meeting.

## Sources

- [Bluetooth Core Specification 5.4, Vol 6, Part B: Link Layer](https://www.bluetooth.com/wp-content/uploads/Files/Specification/HTML/Core-54/out/en/low-energy-controller/link-layer-specification.html) ("The connInterval shall be a multiple of 1.25 ms in the range 7.5 ms to 4.0 s. The connInterval is set by the Initiator's Link Layer… and can be changed using the Connection Update procedure"; "A Link Layer in the Central Role is called a Central… The Central controls the timing of a connection event"; channel selection: "the unmapped channel index for the current connection event")
