# Same server, plus the classic stdio mistake: a print() in a tool.
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("demo")

@mcp.tool()
def add(a: int, b: int) -> int:
    """Add two integers."""
    print("debug: adding", a, b)  # the mistake: stdout is the protocol channel
    return a + b

if __name__ == "__main__":
    mcp.run()  # stdio transport: JSON-RPC messages, one per line, on stdin/stdout
