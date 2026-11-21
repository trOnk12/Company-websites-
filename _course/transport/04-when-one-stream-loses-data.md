---
title: Can a lost image slow a text response?
short: Can a lost image slow a text response?
summary: Two responses share a connection. Change the transport and predict which response can keep moving after loss.
takeaway: HTTP/2 streams share one ordered TCP byte stream. HTTP/3 maps traffic onto independently ordered QUIC streams, so loss on one stream need not stop delivery on another.
---

## The problem

The reading app requests a large cover and a small text card together. Part of the cover response is lost, but the bytes for the text card arrive. Can the card still be shown?

## See it

```diagram when-one-stream-loses-data
```

## The building block

**Multiplexing** lets multiple exchanges share a connection. Both HTTP/2 and HTTP/3 allow this, but the transport beneath them changes what happens during loss.

**QUIC** is a secure transport over UDP. UDP carries separate datagrams. QUIC adds its own recovery and provides independently ordered streams.

| Protocol | Where bytes have to be delivered in order | Consequence after the cover bytes are lost |
|---|---|---|
| HTTP/2 over TCP | One shared transport byte stream with a cumulative acknowledgment | Later text-card bytes can sit behind the gap if they occur after it in that stream. |
| HTTP/3 over QUIC | Within each stream | The text card can advance if its own bytes and any compression or control information it depends on are available. |

Even on QUIC, losing one packet can affect multiple streams if that packet contained their data. Congestion control also remains shared across the connection, so traffic may slow together even where delivery can progress independently.

The practical distinction is delivery waiting behind one missing range versus a shared reduction in sending rate. The first is an ordering dependency; the second is feedback about the network path.

## Go deeper: Trace the dependency before blaming the protocol

- A lost QUIC packet carried data for both the cover and the card. Does their independent ordering ensure the card can finish immediately?::No. If the card needs bytes that were in that packet, its own stream has a gap. Stream independence helps when the other stream has what it needs.

## Check yourself

- The text bytes arrive after a missing cover range in the same TCP stream. Why can HTTP/2 wait?::*TCP delivers the shared stream in byte order||HTTP/2 requires the app to request images and text in separate sessions >> HTTP/2 can share a connection across both requests. >> the-building-block||The text response has to include a complete copy of the cover >> The text bytes can be complete yet unavailable behind the TCP gap. >> the-building-block::Separate HTTP streams share the TCP delivery order.
- In HTTP/3, the lost packet held only cover bytes. Card bytes and its dependencies are present. What is possible?::*The text card can finish before the cover retries arrive||The text card waits for every earlier packet number to be filled >> Data is delivered by stream offset, not all packet numbers globally. >> the-building-block||The cover completes because the text stream got its data >> Each stream still needs its own missing bytes. >> the-building-block::Each stream has its own ordering.
- Both streams slow after network loss despite the card having no ordering gap. What could explain it?::*The connection reduces its sending rate||QUIC silently turned the two streams into a single TCP stream >> QUIC keeps the stream ordering independent. >> the-building-block||The cover and card have identical response bodies >> Content identity is unrelated to shared congestion control. >> the-building-block::Independent delivery can coexist with shared congestion feedback.

## Sources

- [IETF RFC 9113: HTTP/2 streams and multiplexing](https://www.rfc-editor.org/rfc/rfc9113.html#section-5)
- [IETF RFC 9000: QUIC streams and loss](https://www.rfc-editor.org/rfc/rfc9000.html#section-13)
- [IETF RFC 9114: HTTP/3 connection and streams](https://www.rfc-editor.org/rfc/rfc9114.html#section-6)
- [IETF RFC 9002: congestion control](https://www.rfc-editor.org/rfc/rfc9002.html#section-7)
