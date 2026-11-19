---
title: Where did the extra round trips go?
short: Where did the extra round trips go?
summary: Time one small request over a new connection, then reuse the connection and account for the difference.
takeaway: A simplified fresh HTTPS request over TCP with full TLS 1.3 takes three RTTs to the first response byte. An already open connection can remove both setup exchanges.
---

## The problem

A backend responds nearly instantly once it sees a request. The network takes 40 ms each way. Why can the first small response still take about a quarter of a second?

## See it

```diagram count-the-first-https-byte
```

## The building block

A **round trip** is the time for a signal to go to the peer and back. With 40 ms each way, the **RTT**, or round-trip time, is 80 ms. **HTTPS** is HTTP over a secure connection. Here we trace HTTP over TCP with a full TLS 1.3 handshake. The phone still verifies the handshake transcript before its regular request.

| Step | Time on this simplified path |
|---|---|
| Send TCP SYN, get SYN-ACK | 1 RTT |
| Send the final acknowledgment with or alongside the TLS client hello, receive the TLS server flight | 1 RTT |
| Send client Finished and regular HTTP request, receive the first response byte | 1 RTT |

The estimate is about 240 ms. It assumes the address is known, the response is small, both sides respond immediately, no packets are lost, and the request has no early data, and the server accepts the initial key share without requesting a retry. It measures from the start of TCP establishment. It omits DNS, resource contention, redirects and other work real apps may do.

On a compatible connection that is already open, the setup is done. A small request can reach the server and return in roughly one RTT under the same assumptions. **Time to first byte** measures the wait until the response begins. A larger response can still take much longer to finish transferring.

## Go deeper: A real timing trace

- A second request takes 155 ms. The network RTT is 80 ms and the measured server work is 70 ms. Is another TLS exchange required to explain the time?::No. Roughly 150 ms already comes from network travel plus server work. Check separately whether the client actually reused its connection before assigning the remaining time.

## Check yourself

- On this model, the RTT rises to 100 ms. What is the approximate first-byte time over a fresh connection?::*300 ms, three round trips||200 ms, because encryption includes the request response >> The regular request still adds another trip. >> the-building-block||100 ms, because only the response carries application data >> The setup exchanges happen before the regular request. >> the-building-block::Count dependencies before calculating time.
- The app reuses the open connection. What is removed in this model?::*Both connection setup exchanges||Only the transfer from the server back to the phone >> A response still needs the return path. >> the-building-block||Only the second half of the first round trip >> Both TCP and TLS are already ready on the reused connection. >> the-building-block::Reuse leaves the regular request and response trip.
- The first byte arrives at the same time, but a larger response finishes later. What changed?::*Transfer completion, while time to first byte stayed the same||The TCP setup took a longer time than before >> The comparison holds response start time fixed. >> the-building-block||The network round trip doubled for every packet >> More bytes can take longer without changing round-trip time. >> the-building-block::Distinguish the start of the response from its end.

## Sources

- [IETF RFC 9293: TCP connection setup](https://www.rfc-editor.org/rfc/rfc9293.html#section-3.5)
- [IETF RFC 8446: TLS 1.3 message flow](https://www.rfc-editor.org/rfc/rfc8446.html#section-2)
- [IETF RFC 9110: HTTPS URI scheme](https://www.rfc-editor.org/rfc/rfc9110.html#section-4.2.2)
