# The smallest useful MCP server: one tool, served over stdio.
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("demo")

@mcp.tool()
def add(a: int, b: int) -> int:
    """Add two integers."""
    return a + b

if __name__ == "__main__":
    mcp.run()  # stdio transport: JSON-RPC messages, one per line, on stdin/stdout
