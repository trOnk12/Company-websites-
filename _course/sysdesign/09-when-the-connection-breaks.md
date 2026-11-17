---
title: When the connection breaks
short: Timeouts and lost answers
summary: Puzzle 0 said TCP resends lost packets. Yet requests still fail after a while, and sometimes you can't tell whether the server did the work. Here's where TCP's promise ends, and the question the app then can't answer.
takeaway: TCP is reliable only while the connection lasts; on a phone, connections break in lifts, tunnels and handovers between Wi-Fi and mobile data. OkHttp gives up after timeouts: connect (no connection made) and read (no answer arrived). A read timeout can't tell you whether the server did the work: the request may have arrived and the answer been lost. Puzzle 10 makes that safe to retry.
---

## The problem

The user taps Pay in a lift. After ten seconds, OkHttp throws a `SocketTimeoutException`. TCP was supposed to resend whatever got lost. So why did it fail, and, the question that matters: was the payment made or not?

## See it

```diagram timeout
```

## The building block

TCP resends lost packets, but only while the connection exists and both ends can still reach each other. On a phone, that ends all the time: a lift, a tunnel, a switch from Wi-Fi to mobile data. Then the packets have nowhere to go, and TCP can't help.

So the app can't wait forever. OkHttp gives up after a **timeout**, and there are two kinds you'll meet:

- **Connect timeout:** no connection could be made at all. The request never left: safe to try again.
- **Read timeout:** the connection was made and the request was sent, but no answer arrived in time.

The read timeout is the dangerous one. It has two possible stories, and from the phone they look identical:

1. The request was lost on the way: the server never saw it.
2. The server did the work, and the **answer** was lost on the way back.

That's the question a timeout can't answer: did it happen? For reading data, it doesn't matter: ask again. For a payment or an order, retrying could do it twice. Puzzle 10 is the fix.

## The analogy

Posting a cheque and hearing nothing back. Maybe the post lost your letter; maybe the bank cashed it and the receipt got lost. From your sofa, you can't tell which.

## Check yourself

- A read timeout fires on `POST /orders`. What do you know?::*Not whether the order was created: the answer may just have been lost||The order wasn't created, because the server didn't answer >> The server may have answered; only the answer went missing. >> s3||The order was created twice, by TCP's resending >> TCP resends packets inside one request; it doesn't send the request twice. >> s3::A read timeout can't say if it happened.
- A connect timeout fires. Is it safe to retry a payment request?::*Yes: no connection was made, so the request never left the phone||No: the server may have charged the card already >> With no connection, the request couldn't reach the server. >> s2||Only after checking the server's logs >> No connection means nothing was sent; there's nothing to check. >> s2::No connection, nothing sent.
- What's the difference between a connect timeout and a read timeout?::*A connect timeout means nothing was sent, while a read timeout means the answer didn't arrive||A connect timeout means the answer didn't arrive, while a read timeout means nothing was sent >> That's the two swapped. >> the-building-block::Never left vs no answer back.

## Sources

- [OkHttp: OkHttpClient](https://github.com/square/okhttp/blob/master/okhttp/src/commonJvmAndroid/kotlin/okhttp3/OkHttpClient.kt) ("Default connect timeout (in milliseconds). The default is 10 seconds."; "Default read timeout (in milliseconds). The default is 10 seconds.")
- [High Performance Browser Networking: Building blocks of TCP](https://hpbn.co/building-blocks-of-tcp/) (TCP's reliability: "retransmission of lost data, in-order delivery" over a connection)
