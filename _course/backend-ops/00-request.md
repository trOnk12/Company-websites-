---
title: What happens when a client sends a request?
short: What happens when a client sends a request?
summary: Follow one bookmark from a client to the process that owns it.
takeaway: A route matches the method and path before a handler runs.
---

## The problem

A client is a program asking another program to do something. A server is the program receiving that request. Both can run on your own computer. If you ask it to save a bookmark called river, which program owns the result?

## See it

```diagram request
```

## The building block

A **route** pairs a request method and path with the code that handles it. **Hypertext Transfer Protocol** (HTTP) is the set of rules the programs use for requests and responses. The method names the action. The path identifies the requested resource. A port is the number the operating system uses to deliver the connection to the listening program. Start the lab server in one terminal. In another, send the first write from the lab guide. The server listens on port 8080. Its handler receives the method and path and checks the name. A **status code** is a number describing the outcome. A valid write returns a status and the saved name. Change only the path to /unknown. The server can answer 404 because the request reached it. Stop the process and repeat. Now the client cannot connect to that port, so there is no response status.

## Try it

Compare the wrong-path response with the stopped-process result. Save both outputs.

[Open the runnable bookmark lab](https://github.com/trOnk12/Company-websites-/tree/main/labs/bookmark-service)

## Check yourself

- After stopping the only listener, what arrives?::*A connection error||A response with status 404 >> Only a running server can send that response. >> the-building-block::A route matches the method and path before a handler runs.

## Sources

- [Technical reference](https://docs.python.org/3/library/http.server.html)
