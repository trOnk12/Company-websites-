---
title: Which process answers the phone?
short: Which process answers the phone?
summary: Follow one bookmark from a client to the process that owns it.
takeaway: A route matches the method and path before a handler runs.
---

## The problem

Your Android screen already calls a repository. Move the write behind a network connection. Which program now decides whether the requested bookmark exists?

## See it

```diagram request
```

## The building block

A **route** pairs a request method and path with the code that handles it. Start the lab server in one terminal. In another, send the first write from the lab guide. The server listens on port 8080. Its handler receives the method and path and checks the name. A valid write returns a status and the saved name. Change only the path to /unknown. The server can answer 404 because the request reached it. Stop the process and repeat. Now the client cannot connect to that port, so there is no response status.

## Try it

Compare the wrong-path response with the stopped-process result. Save both outputs.

[Open the runnable bookmark lab](https://github.com/trOnk12/Company-websites-/tree/main/labs/bookmark-service)

## Check yourself

- After stopping the only listener, what arrives?::*A connection error||A response with status 404 >> Only a running server can send that response. >> the-building-block::A route matches the method and path before a handler runs.

## Sources

- [Technical reference](https://docs.python.org/3/library/http.server.html)
