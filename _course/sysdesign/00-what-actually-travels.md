---
title: What actually travels
short: Packets, IP, TCP
summary: Your app calls an API and gets JSON back, as if the two were joined by a pipe. Underneath, there's no pipe: only small chunks of data that can get lost. Here's the stack of layers that turns them into a request and a response.
takeaway: Data crosses the internet in packets. IP addresses each packet and routes it, but can lose, delay or reorder it. TCP turns those packets into a reliable, ordered stream: it numbers them, waits for acknowledgements and resends what's lost, and needs a connection set up first. TLS encrypts that stream, and HTTP is the language of requests and responses on top.
---

## The problem

In your code, a request is one call, and a user object comes back. But the phone and the server are joined by Wi-Fi, a cell tower, cables and a dozen routers, any of which can drop data. How does a request survive that trip, and what does it cost?

## See it

```diagram layers
```

## The building block

Nothing travels as one piece. Data is cut into **packets**: small chunks, each up to about a kilobyte and a half, each with an address on it.

**IP**, the Internet Protocol, is the postal service: it addresses each packet and passes it from router to router toward the server. It does its best, nothing more. A packet can be lost, delayed, or overtaken by the one sent after it.

**TCP**, the Transmission Control Protocol, builds something reliable on top. The sender numbers every packet; the receiver sends back acknowledgements, "got up to number 12"; anything not acknowledged in time is sent again; the receiver puts packets back in order. Your code sees one clean stream of bytes. To keep that bookkeeping, both sides must first agree to talk: a TCP **connection**, set up with a short exchange before any data flows.

On top of TCP, two more layers:

| Layer | Its job |
|---|---|
| HTTP | the request and the response: method, URL, headers, body |
| TLS | encrypts the stream, so routers on the way can't read or change it (the Encryption course) |
| TCP | reliable, ordered delivery, over a connection |
| IP | addresses and routes each packet, best effort |

Every puzzle that follows is about the cost of this stack: how long packets take to cross (puzzle 1), what setting up a connection costs (puzzle 2), and what the phone's radio pays to send them (puzzle 3).

## The analogy

Sending a book by post, one page per envelope. The post office (IP) delivers most envelopes, in any order, and loses a few. Your friend (TCP) numbers the pages, writes back "got pages 1 to 40", and you resend the missing ones. Before the first page, you agree by letter that you're sending a book at all: the connection.

## Check yourself

- A packet of your request is lost between two routers. Who notices and fixes it?::*TCP: the missing packet isn't acknowledged, so it's sent again||IP: it reroutes the packet around the broken router >> IP only does its best; recovering lost packets is TCP's job. >> s3||Your app: OkHttp sees the gap and asks for the packet >> Your code sees a clean stream; TCP handles losses underneath. >> s3::Numbering, acknowledging, resending: TCP.
- Why must a TCP connection be set up before the first request?::*Both sides must agree to talk and start numbering packets||IP needs the server's address confirmed first >> IP addresses every packet anyway; the setup is TCP's bookkeeping. >> s4||TLS refuses to send data without one >> TLS runs on top of TCP, but the setup is TCP's own need. >> s4::Reliability needs shared bookkeeping.
- What's the difference between IP and TCP?::*IP delivers single packets as best it can, while TCP makes them a reliable, ordered stream||IP makes packets a reliable, ordered stream, while TCP delivers single packets as best it can >> That's the two swapped. >> the-building-block::Best effort vs reliable.

## Sources

- [High Performance Browser Networking: Building blocks of TCP](https://hpbn.co/building-blocks-of-tcp/) ("The IP, or Internet Protocol, is what provides the host-to-host routing and addressing, and TCP, or Transmission Control Protocol, is what provides the abstraction of a reliable network running over an unreliable channel"; TCP hides "retransmission of lost data, in-order delivery, congestion control and avoidance, data integrity")
