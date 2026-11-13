# Usage: python talk.py [server.py | noisy_server.py]
# Talks to the server with raw JSON-RPC lines, no MCP client library, and prints both sides.
import json, subprocess, sys, os

here = os.path.dirname(os.path.abspath(__file__))
proc = subprocess.Popen([sys.executable, os.path.join(here, sys.argv[1] if len(sys.argv) > 1 else "server.py")],
                        stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True)

def send(msg):
    line = json.dumps(msg)
    print("client →", line)
    proc.stdin.write(line + "\n"); proc.stdin.flush()

def receive():
    line = proc.stdout.readline()
    print("server ←", line.strip()[:400])
    try:
        return json.loads(line)
    except json.JSONDecodeError:
        print("        ^ not a JSON-RPC message: the client can't read the stream any more")
        sys.exit(1)

send({"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {
    "protocolVersion": "2025-06-18", "capabilities": {},
    "clientInfo": {"name": "raw-client", "version": "0"}}})
receive()
send({"jsonrpc": "2.0", "method": "notifications/initialized"})   # no id: a notification, no reply
send({"jsonrpc": "2.0", "id": 2, "method": "tools/list"})
receive()
send({"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {"name": "add", "arguments": {"a": 2, "b": 40}}})
receive()
proc.stdin.close(); proc.wait()
