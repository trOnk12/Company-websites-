---
title: Round trips, not bandwidth
short: Why it feels slow
summary: Your profile screen loads in a blink on office Wi-Fi and crawls on the train. The data is 60 KB. Here's what the user is actually waiting for, and why a faster network barely helps.
takeaway: Latency is how long a packet takes to arrive; bandwidth is how much data fits through per second. Small requests are bound by latency, so the wait is the number of round trips times the round-trip time. Requests that wait for each other add their round trips together; cut the round trips, and the screen gets faster on every network.
---

## The problem

Your profile screen makes four requests, one after another: the user, their settings, their avatar URL, then the avatar itself. Only the avatar really needs something from the one before; the code just happens to wait for each. Together they carry 60 KB. On office Wi-Fi it's instant; on a train it takes over a second. The train's network can carry megabytes per second. So where does the second go?

## See it

```diagram rtt
```

## The building block

A network link has two numbers. **Latency** is how long one packet takes to get from sender to receiver: distance, plus the queues and radios on the way. **Bandwidth** is how much data the link carries per second.

A request needs a **round trip**: the request travels to the server, the server answers, the answer travels back. For a few kilobytes, the data itself takes almost no time to send. Almost all the wait is the trip.

So for small requests, the time is roughly:

| | Time |
|---|---|
| One request | 1 round trip |
| Four requests, each waiting for the one before | 4 round trips |
| The three independent ones together, then the avatar | 2 round trips |

At 30 ms per round trip on Wi-Fi, four in a row is 120 ms. At 250 ms on a busy mobile network, it's a full second, and doubling the bandwidth doesn't change it, because you weren't waiting for bandwidth. Sending the user, settings and avatar URL requests together, then the avatar, takes two round trips: 500 ms. (In Kotlin, start them with `async` and wait with `awaitAll`; over one connection this needs a newer HTTP version, puzzle 5.)

That's why the first question of any mobile system design is: how many round trips does this screen need, and can they happen at the same time, or not at all? One endpoint that returns the whole screen, or requests that don't depend on each other, can shorten this latency-dominated example.

## The analogy

Asking a friend in another city four questions by post, one letter at a time, waiting for each answer before you write the next. A bigger envelope doesn't help. Putting all four questions in one letter does.

## Check yourself

- Your screen's four requests each wait for the one before, on a 250 ms mobile network. Bandwidth doubles. Roughly how long does loading take now?::*About the same, about one second, since the wait is four round trips||Half as long, because twice the bandwidth moves data twice as fast >> For a few kilobytes the data takes almost no time; the trips do. >> s3||A quarter as long, because the four requests now share the bandwidth >> Sharing bandwidth doesn't shorten a trip. >> s3::Small requests wait for round trips.
- Which change reduces sequential waits in this example?::*Sending the three independent requests together, then the avatar||Compressing the responses so each one is smaller >> Smaller data saves little when the wait is the trip, not the data. >> s4||Moving from Wi-Fi to a 5G network with more bandwidth >> More bandwidth doesn't remove round trips; fewer trips do. >> s4::Fewer trips on this critical path.
- What's the difference between latency and bandwidth?::*Latency is how long a packet takes to arrive, while bandwidth is how much data fits per second||Latency is how much data fits per second, while bandwidth is how long a packet takes to arrive >> That's the two swapped. >> the-building-block::Time of the trip vs size of the pipe.

## Sources

- [Ilya Grigorik, High Performance Browser Networking: Primer on latency and bandwidth](https://hpbn.co/primer-on-latency-and-bandwidth/) ("Latency: The time from the source sending a packet to the destination receiving it. Bandwidth: Maximum throughput of a logical or physical communication path"; "transmission delay is dictated by the available data rate of the transmitting link and has nothing to do with the distance between the client and the server")
