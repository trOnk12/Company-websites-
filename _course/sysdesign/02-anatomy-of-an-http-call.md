---
title: Anatomy of an HTTP call
short: Methods, headers, status codes
summary: Retrofit hides the request behind an annotation and hands you an object back. The rest of this course reads the parts it hides. Here they are, once, mapped to the Retrofit code you already write.
takeaway: An HTTP request is a method (GET to read, POST for resource-defined processing, PUT to create or replace, DELETE to remove), a path, headers (name: value pairs about the message) and an optional body. The response has a status code, headers and an optional body. Status codes come in families: 2xx worked, 3xx look elsewhere or use what you have, 4xx client-side conditions, 5xx the server failed.
---

## The problem

You write `@GET("users/42")` and get a `User`. When something fails, Retrofit gives you a code like 404 or 503, and later puzzles talk about parts of the request it hides. What exactly travels, and what do those numbers mean?

## See it

```diagram http
```

## The building block

An HTTP request can carry these parts; its body is optional:

| Part | Example | In Retrofit |
|---|---|---|
| **HTTP method** | `GET`, `POST`, `PUT`, `DELETE` | `@GET`, `@POST`… |
| **path** | `/users/42` | the annotation's string |
| **headers** | `Authorization: Bearer …` | `@Header`, or an interceptor |
| **body** | JSON of a new order | `@Body` |

The method says what you want: `GET` reads, `POST` submits input for the resource to handle (often creating a new item), `PUT` creates or replaces the representation at that path, `DELETE` removes it. **Headers** are name–value pairs about the message, not the data itself: who you are, what format you accept, how long something may be cached.

The response comes back with a **status code**, headers, and an optional body. Status codes come in families, by their first digit:

| Family | Meaning | Examples |
|---|---|---|
| 2xx | it worked | 200 OK, 201 Created |
| 3xx | look elsewhere, or use what you have | 301 Moved Permanently |
| 4xx | client-side condition | 400 Bad Request, 401, 404, 429 Too Many Requests |
| 5xx | the server failed | 500, 503 |

The exact code and operation determine the response. An unknown user may warrant showing a missing record; 429 can invite a delayed retry. Even a server error does not make replaying a payment safe.

## The analogy

A letter to an office: the method is what you're asking for ("please file this", "please send me that"), the path is which department, the headers are the notes on the envelope, the body is the letter. The reply comes with a stamp: approved, see the other office, your form is wrong, or we're closed.

## Check yourself

- Your app gets a 404 from `GET /users/42`. Should it retry the same request?::*Usually no: show the missing record for this lookup||Yes, since almost any network error might pass if you try again >> An ordinary missing-record lookup has no reason for an immediate retry. >> s4||Yes, but sending it as a POST instead of a GET this time >> Changing the method changes the meaning; it doesn't fix a missing user. >> s4::Handle the specific status and operation.
- Where does the server say "this response can be cached for a minute"?::*In a header, a name–value pair about the message||In the status code, as part of the 2xx family >> Status codes say how it went; caching rules travel in headers. >> s2||In the body, next to the JSON data >> The body is the data; notes about the message go in headers. >> s2::Notes about the message: headers.
- What's the difference between GET and POST?::*GET requests a representation, while POST submits input for processing||GET submits input for processing, while POST requests a representation >> That's the two swapped. >> the-building-block::Read versus submit for processing.

## Sources

- [RFC 9110 · HTTP method definitions](https://www.rfc-editor.org/rfc/rfc9110.html#section-9.3)

- [MDN: An overview of HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview) ("HTTP headers make this protocol easy to extend and experiment with"; requests and responses as HTTP messages)
- [MDN: HTTP response status codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status) ("Responses are grouped in five classes: Informational responses (100 – 199), Successful responses (200 – 299), Redirection messages (300 – 399), Client error responses (400 – 499), Server error responses (500 – 599)")
