---
title: A local MCP server is JSON-RPC lines over stdin and stdout
date: 2026-11-13
status: budding
tags: [ai-agents, mcp]
summary: Under the SDKs, a local MCP server is a process that reads JSON-RPC messages from stdin and writes them to stdout, one per line. That's also why one stray print() can break it.
---

## The gap

I had built MCP servers with an SDK, but I couldn't say what actually travels between the AI client and my server, or why a debug print could break it.

## The pieces

- MCP encodes every message as JSON-RPC 2.0: a request has an `id` and expects a reply, a notification has no `id` and gets none.
- With the stdio transport, the client starts the server as a child process. Messages go over its stdin and stdout, one per line.
- A session starts with `initialize`, then the client sends a `notifications/initialized` notification. After that come requests like `tools/list` and `tools/call`.
- Logs belong on stderr. The spec says a server must not write anything to stdout that isn't a valid MCP message.

## The click

stdout isn't the server's console, it's the wire. Anything printed there is read by the client as a protocol message. A `print("debug")` is like shouting into the middle of a phone call between two machines.

## How I checked it

A one-tool server (`add`) on the official Python SDK 1.30.0, and a client of about 30 lines that sends raw JSON-RPC lines, with no MCP library:

- `initialize` came back with the server's capabilities, `tools/list` with the tool and a JSON Schema built from the Python type hints, and `tools/call` with `"text":"42"` for 2 + 40.
- The same server with a `print()` in the tool: the reply line was `debug: adding 2 40`, which my client couldn't parse. The real response never arrived.
- The SDK's own log line ("Processing request…") went to stderr and didn't disturb anything.

I didn't check how each real MCP client copes with a stray line; the spec simply forbids it.

The experiment and a script that reruns it are in [this site's repository](https://github.com/trOnk12/Company-websites-/tree/main/_learning/experiments/mcp-wire).

## Check yourself

- Does `notifications/initialized` get a reply?::No. It has no `id`, so it's a notification, and JSON-RPC notifications get no response.
- Where should a stdio MCP server write its logs?::To stderr. stdout carries only protocol messages.
- Where does the tool's input schema come from in the Python SDK?::It's generated from the function's type hints, so `a: int` becomes `"type": "integer"`.

## Sources

- [MCP specification: transports (stdio)](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports)
- [MCP specification: lifecycle](https://modelcontextprotocol.io/specification/2025-06-18/basic/lifecycle)
- [MCP specification: tools](https://modelcontextprotocol.io/specification/2025-06-18/server/tools)
