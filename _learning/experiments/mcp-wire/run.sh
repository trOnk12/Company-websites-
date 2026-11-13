#!/usr/bin/env bash
# Reproduces the claims in _learning/mcp-is-json-rpc-over-a-pipe.md.
# Needs Python 3.10+ and network access to PyPI for the MCP SDK (1.x, as pinned below).
set -eu
cd "$(dirname "$0")"
[ -d .venv ] || { python3 -m venv .venv && .venv/bin/pip install -q "mcp==1.30.0"; }
echo "== well-behaved server =="
.venv/bin/python talk.py server.py 2>/dev/null
echo
echo "== server whose tool prints to stdout =="
.venv/bin/python talk.py noisy_server.py 2>/dev/null || true
