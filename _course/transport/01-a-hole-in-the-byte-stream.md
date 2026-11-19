---
title: Where do the missing bytes go?
short: Where do the missing bytes go?
summary: Drop one range of bytes while a later range arrives. Predict what the receiver reports and what the application can read.
takeaway: A cumulative acknowledgment advances only across a contiguous prefix. Later bytes may wait while the receiver is missing earlier bytes.
---

## The problem

The phone sends three blocks of four bytes. They arrive as first, third, then second. Can the receiving app read the third block as soon as it arrives?

## See it

```diagram a-hole-in-the-byte-stream
```

## The building block

A **cumulative acknowledgment** reports the next byte needed to extend the contiguous prefix. Suppose the first byte has sequence number 101 and all three blocks are four bytes long.

| Received byte positions | Next number expected | What TCP can make available in order |
|---|---|---|
| 101–104 | 105 | 101–104 |
| 109–112 arrives early | 105 | Still only 101–104 |
| Missing 105–108 finally arrives | 113 | Now 101–112, if the later bytes were kept |

The receiver may buffer bytes that arrived ahead of a gap. It can still report 105, even though it has seen later bytes. The sender can send missing bytes again. When the gap closes, the acknowledgment can jump over the already buffered bytes.

TCP presents a continuous byte stream to the application. The app may read twelve bytes through one read or several, depending on when data is available and how much it asks for. The application has to understand its own message boundaries. It can't assume that one network segment equals one read or one complete message.

## Go deeper: Later data is useful without advancing the main acknowledgment

- If the receiver tells the sender separately that it kept bytes 109–112, does the cumulative acknowledgment change?::It still reports 105. TCP selective acknowledgments can describe received ranges without claiming that the earlier gap is filled.

## Check yourself

- The receiver has bytes 101–104 and 109–112. What cumulative acknowledgment can it send?::*105, the first missing byte||113, the number after the highest buffered byte >> The cumulative value cannot cross a gap. >> the-building-block||109, the first byte of the latest segment >> The value names the missing position rather than the latest arrival. >> the-building-block::Find the first hole after the contiguous prefix.
- Why can the app be waiting even while TCP has received new bytes?::*The new bytes sit after a gap in the ordered stream||Every application read requires a brand-new connection >> Reads can use an existing connection. >> the-building-block||Received bytes wait until the sender closes the connection >> Contiguous bytes can be delivered before the connection closes. >> the-building-block::Ordered application delivery and network arrival order can differ.
- One application message covers bytes 101–112. The app first gets four bytes. What should it do?::*Read further until its message framing says it is complete||Treat the four bytes as a complete network message >> TCP does not preserve application message boundaries. >> the-building-block||Discard the next eight bytes because the first read ended >> A read ending says nothing about the boundary of the application message. >> the-building-block::Message boundaries belong to the next layer.

## Sources

- [IETF RFC 9293: sequence numbers and processing incoming data](https://www.rfc-editor.org/rfc/rfc9293.html#section-3.4)
- [IETF RFC 2018: TCP selective acknowledgment](https://www.rfc-editor.org/rfc/rfc2018.html)
