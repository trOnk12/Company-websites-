---
title: Finding the server
short: Addresses and DNS
summary: Puzzle 0 said every packet carries an address. Your code never writes one: it writes a name like api.example.com. Here's how the phone turns that name into a number, and what that costs.
takeaway: Every machine on the internet has an IP address, a number that routers use to deliver packets. People and code use hostnames instead, like api.example.com. Before the first connection, the phone asks DNS, the internet's phone book, which address a hostname has. That lookup is one more round trip on a cold start, so the answer is cached for a while.
---

## The problem

Your Retrofit base URL is `https://api.example.com`. Puzzle 0 said IP delivers packets by address. A name isn't an address. So before the first packet can leave, something has to turn the name into a number. What, and how long does it take?

## See it

```diagram dns
```

## The building block

Every machine reachable on the internet has an **IP address**: a number, like `93.184.215.14`, that routers read to deliver each packet.

Numbers are hard to remember and change when a company moves servers, so people and code use a **hostname** instead: `api.example.com`.

**DNS**, the Domain Name System, is the internet's phone book: a worldwide system of servers that answers "which address does this hostname have?". Before connecting, the phone needs an address. If there is no usable cached answer, name resolution can add a network wait.

Two consequences for an app:

- A cold lookup adds waiting. Another app, the operating system or a resolver may already have a usable answer.
- The answer is **cached**: kept for a while by the phone (and by DNS servers on the way), so the next requests skip the lookup.

## The analogy

Looking up a friend's number in your contacts before you can call. The first time, you search; after that, the number's on your recent calls list.

## Check yourself

- Your app's first-ever request to `api.example.com` is slower than the next ones. Which part of that is DNS?::*Looking up the host's IP address before anything can be sent||Downloading the response data, which is bigger the first time >> The data is the same size; the extra wait is the lookup before sending. >> s3||Routers learning the new hostname >> Routers deliver by address; the name is resolved by DNS first. >> s3::Name to address, once.
- Why are DNS answers cached?::*So later requests skip the lookup and its waiting||Because DNS servers can only answer once per app >> They answer many times; caching saves the wait. >> s4||So the app can work without an IP address >> Packets always need an address; caching only keeps it. >> s4::Look up once, reuse.
- What's the difference between a hostname and an IP address?::*A hostname is the name code uses, while an IP address is the number routers deliver to||A hostname is the number routers deliver to, while an IP address is the name code uses >> That's the two swapped. >> the-building-block::Name vs number.

## Sources

- [MDN: DNS](https://developer.mozilla.org/en-US/docs/Glossary/DNS) ("DNS (Domain Name System) is a hierarchical and decentralized naming system for Internet-connected resources. DNS maintains a list of domain names along with the resources, such as IP addresses, that are associated with them.")
