---
title: Why TCP starts with three messages
short: Why TCP starts with three messages
summary: Follow the first exchange between a phone and a server. What has each side learned at every step?
takeaway: The TCP handshake exchanges starting byte numbers and confirms both directions. A peer that has received only the first two messages has different information from its peer.
---

## The problem

A phone knows a server address and can send packets to it. Both sides will send bytes, and each side chooses its own starting number. How do they agree on both starting numbers before exchanging application data in the ordinary case?

## See it

```diagram open-the-tcp-connection
```

## The building block

**TCP** gives the two apps a reliable, ordered byte stream in each direction. A **sequence number** identifies a position in one direction of that stream. The opening **handshake** is a setup exchange between the peers.

| Message | Information it carries |
|---|---|
| Phone sends SYN, sequence 100 | The phone proposes its starting number. |
| Server sends SYN-ACK, sequence 500, acknowledgment 101 | The server proposes its number and says the next number it expects from the phone. |
| Phone sends ACK, acknowledgment 501 | The phone says it received the server's opening number and expects 501. |

SYN signals the start and consumes one position in each direction. ACK is an acknowledgment, which reports the next number expected from the other side. In this example, the first regular data sent by the phone starts at 101, and the server's data starts at 501.

After receiving the second message, the phone can acknowledge the server and treat the connection as established. The server ordinarily moves to that state after receiving the final valid ACK. The final acknowledgment may also carry data. If it is lost and no other valid acknowledgment arrives, the server still needs confirmation and can retransmit its SYN-ACK. The third message confirms the phone saw the server’s fresh SYN. A delayed duplicate SYN by itself cannot complete the connection. These exchanges synchronize the byte streams. They do not verify the server's identity for the application.

## Go deeper: Count both directions separately

- If the server changes its initial number from 500 to 900, which acknowledgments change?::The phone now acknowledges 901. The server still acknowledges 101 because the phone's starting number did not change.

## Check yourself

- The third message is lost and nothing else arrives. What is the server missing?::*Confirmation that the phone received the server’s starting number||The starting number that the phone announced in the first message >> The server already received that number in SYN. >> the-building-block||The server’s own starting number for data >> The server chose its own starting number before sending SYN-ACK. >> the-building-block::Keep track of what each peer has actually received.
- The server proposes 800. What does the phone acknowledge?::*801, the next position expected from the server||800, the position used by the server’s opening signal >> SYN consumes a position. The acknowledgment says what is next. >> the-building-block||101, the next position in the phone’s own stream >> The acknowledgment refers to bytes from the other peer. >> the-building-block::The two sequence spaces are independent.
- What has the phone established about the server after this exchange?::*It has synchronized byte numbers with the peer||It has verified the server’s application identity >> This exchange does not verify the application identity. >> the-building-block||It has learned that future packets cannot be lost >> Establishment does not eliminate packet loss. >> the-building-block::Opening the byte stream answers a transport question.

## Sources

- [IETF RFC 9293: TCP, sequence numbers and connection establishment](https://www.rfc-editor.org/rfc/rfc9293.html#section-3.5)
