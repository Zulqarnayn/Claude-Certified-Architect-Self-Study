---
layout: default
title: CCA Self-Study — Week 6, Day 3
---

# CCA Self-Study — Week 6, Day 3
## Build Your First MCP Server

**Date completed:** _____________
**Study time:** 30–45 mins
**Curriculum phase:** Phase 2 — Building with Claude
**Exam domain:** Domain 2 · Tool Design & MCP Integration

---

## Core Concept

Today is pure build day. You go from understanding MCP to having a working MCP server that Claude can connect to and use. By the end of this lesson you'll have a real server running, tested through the MCP inspector, and connected to Claude.

This is the most important hands-on build in Week 6.

---

## What You're Building

An App Store Research MCP server with:
- 3 tools: `search_apps`, `get_app_details`, `get_app_reviews`
- 1 resource: `appstore://featured` (featured apps list)
- Mock data (no real API needed for learning)
- Proper error handling
- Connection to Claude via Claude Desktop or API

---

## Step 1 — Project Setup

```bash
# Create project directory
mkdir app-store-mcp
cd app-store-mcp

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install mcp anthropic

# Create main server file
touch server.py
```

---

## Step 2 — The Complete MCP Server

```python
# server.py
import asyncio
import json
from mcp.server import Server
from mcp.server.stdio import stdio_server
import mcp.types as types

# ─────────────────────────────────────────
# Mock Data
# ─────────────────────────────────────────
MOCK_APPS = {
    "ScreenshotAI": {
        "name": "ScreenshotAI",
        "developer": "Asif Dev",
        "price": 0.0,
        "rating": 4.6,
        "review_count": 1240,
        "size_mb": 28.5,
        "ios_required": "16.0",
        "last_updated": "2026-03-15",
        "description": "AI-powered screenshot organiser using on-device OCR",
        "category": "Productivity"
    },
    "Screenshotter": {
        "name": "Screenshotter",
        "developer": "Legacy Apps Inc",
        "price": 2.99,
        "rating": 3.8,
        "review_count": 456,
        "size_mb": 45.2,
        "ios_required": "14.0",
        "last_updated": "2024-08-20",
        "description": "Basic screenshot organiser",
        "category": "Utilities"
    },
    "CleanShot X": {
        "name": "CleanShot X",
        "developer": "CleanShot Team",
        "price": 29.99,
        "rating": 4.9,
        "review_count": 8930,
        "size_mb": 62.1,
        "ios_required": "15.0",
        "last_updated": "2026-04-01",
        "description": "Professional screenshot tool with annotations",
        "category": "Productivity"
    }
}

MOCK_REVIEWS = {
    "ScreenshotAI": [
        {"rating": 5, "text": "Finally an app that finds my screenshots by text!", "date": "2026-04-10"},
        {"rating": 4, "text": "Great concept, occasional sync issues", "date": "2026-04-05"},
        {"rating": 5, "text": "The on-device processing is a game changer for privacy", "date": "2026-03-28"},
    ],
    "Screenshotter": [
        {"rating": 3, "text": "Does the job but feels outdated", "date": "2026-02-14"},
        {"rating": 2, "text": "Crashes on iOS 17, needs update", "date": "2026-01-30"},
    ],
    "CleanShot X": [
        {"rating": 5, "text": "Best screenshot tool I've ever used", "date": "2026-04-15"},
        {"rating": 5, "text": "Annotation features are incredible", "date": "2026-04-12"},
        {"rating": 4, "text": "Expensive but worth it for power users", "date": "2026-04-08"},
    ]
}

FEATURED_APPS = ["ScreenshotAI", "CleanShot X"]

# ─────────────────────────────────────────
# Server Implementation
# ─────────────────────────────────────────
app = Server("app-store-research")

@app.list_tools()
async def list_tools() -> list[types.Tool]:
    """Declare all tools this server offers."""
    return [
        types.Tool(
            name="search_apps",
            description=(
                "Search the App Store catalog by keyword or use case. "
                "Use as the FIRST step when the user asks for recommendations "
                "or mentions an app type without a specific name. "
                "Returns: list of matching apps with name, rating, and price. "
                "Do not use if you already have a specific app name."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search keyword or use case description"
                    },
                    "max_results": {
                        "type": "integer",
                        "description": "Maximum results (1-10, default 5)"
                    }
                },
                "required": ["query"]
            }
        ),
        types.Tool(
            name="get_app_details",
            description=(
                "Get full details for a specific app by its exact name. "
                "Use when the user mentions a specific app, or after search_apps "
                "to get full information about a result. "
                "Returns: developer, price, rating, size, iOS requirement, "
                "last_updated, description, and category. "
                "Do not use to search — use search_apps first if needed."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "app_name": {
                        "type": "string",
                        "description": "Exact app name as listed on App Store"
                    }
                },
                "required": ["app_name"]
            }
        ),
        types.Tool(
            name="get_app_reviews",
            description=(
                "Get recent user reviews for a specific app. "
                "ONLY call this when the user explicitly asks about reviews, "
                "user opinions, complaints, or reliability. "
                "Returns: recent reviews with text, rating, and date. "
                "Do not call for general app information."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "app_name": {
                        "type": "string",
                        "description": "Exact app name"
                    }
                },
                "required": ["app_name"]
            }
        )
    ]

@app.list_resources()
async def list_resources() -> list[types.Resource]:
    """Declare all resources this server offers."""
    return [
        types.Resource(
            uri="appstore://featured",
            name="Featured Apps",
            description="Currently featured apps on the App Store homepage",
            mimeType="application/json"
        )
    ]

@app.read_resource()
async def read_resource(uri: str) -> str:
    """Handle resource read requests."""
    if uri == "appstore://featured":
        featured = [MOCK_APPS[name] for name in FEATURED_APPS if name in MOCK_APPS]
        return json.dumps(featured, indent=2)
    raise ValueError(f"Unknown resource: {uri}")

@app.call_tool()
async def call_tool(name: str, arguments: dict) -> list[types.TextContent]:
    """Handle all tool execution requests."""
    
    try:
        if name == "search_apps":
            query = arguments.get("query", "").lower()
            max_results = min(arguments.get("max_results", 5), 10)
            
            # Simple keyword matching against mock data
            results = []
            for app_name, details in MOCK_APPS.items():
                if (query in app_name.lower() or 
                    query in details["description"].lower() or
                    query in details["category"].lower()):
                    results.append({
                        "name": app_name,
                        "rating": details["rating"],
                        "price": details["price"],
                        "short_description": details["description"][:80]
                    })
            
            if not results:
                # Return all apps if no match (demo behaviour)
                results = [
                    {"name": n, "rating": d["rating"], "price": d["price"]}
                    for n, d in MOCK_APPS.items()
                ]
            
            return [types.TextContent(
                type="text",
                text=json.dumps(results[:max_results], indent=2)
            )]
        
        elif name == "get_app_details":
            app_name = arguments.get("app_name", "")
            
            # Try exact match first, then case-insensitive
            if app_name in MOCK_APPS:
                details = MOCK_APPS[app_name]
            else:
                # Case-insensitive search
                match = next(
                    (v for k, v in MOCK_APPS.items() 
                     if k.lower() == app_name.lower()), 
                    None
                )
                if not match:
                    return [types.TextContent(
                        type="text",
                        text=json.dumps({
                            "error": "app_not_found",
                            "message": f"No app named '{app_name}' found. "
                                      f"Available: {list(MOCK_APPS.keys())}"
                        })
                    )]
                details = match
            
            return [types.TextContent(
                type="text",
                text=json.dumps(details, indent=2)
            )]
        
        elif name == "get_app_reviews":
            app_name = arguments.get("app_name", "")
            
            reviews = MOCK_REVIEWS.get(app_name)
            if not reviews:
                # Try case-insensitive
                reviews = next(
                    (v for k, v in MOCK_REVIEWS.items() 
                     if k.lower() == app_name.lower()),
                    None
                )
            
            if not reviews:
                return [types.TextContent(
                    type="text",
                    text=json.dumps({
                        "error": "reviews_not_found",
                        "message": f"No reviews found for '{app_name}'"
                    })
                )]
            
            return [types.TextContent(
                type="text",
                text=json.dumps({
                    "app_name": app_name,
                    "review_count": len(reviews),
                    "average_rating": round(
                        sum(r["rating"] for r in reviews) / len(reviews), 1
                    ),
                    "recent_reviews": reviews
                }, indent=2)
            )]
        
        else:
            raise ValueError(f"Unknown tool: {name}")
    
    except Exception as e:
        return [types.TextContent(
            type="text",
            text=json.dumps({"error": "execution_error", "message": str(e)})
        )]

# ─────────────────────────────────────────
# Entry Point
# ─────────────────────────────────────────
async def main():
    async with stdio_server() as (read_stream, write_stream):
        await app.run(
            read_stream,
            write_stream,
            app.create_initialization_options()
        )

if __name__ == "__main__":
    asyncio.run(main())
```

---

## Step 3 — Test with MCP Inspector

```bash
# Install MCP inspector
npx @modelcontextprotocol/inspector python server.py

# This opens a browser UI at localhost:5173
# Test: list tools, call search_apps, call get_app_details
```

---

## Step 4 — Connect to Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

```json
{
  "mcpServers": {
    "app-store-research": {
      "command": "python",
      "args": ["/absolute/path/to/your/server.py"]
    }
  }
}
```

Restart Claude Desktop. Open a new conversation. You should see a hammer icon — click it to see your tools.

Test by asking: "Find me the best screenshot apps" or "Tell me about ScreenshotAI".

---

## Step 5 — Connect via API (Alternative)

If you don't have Claude Desktop, connect via the Anthropic API with MCP servers using HTTP transport (or use the mcp Python SDK client):

```python
# Test your server tools manually via the MCP Python client
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

async def test_server():
    server_params = StdioServerParameters(
        command="python",
        args=["server.py"]
    )
    
    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            
            # List tools
            tools = await session.list_tools()
            print("Available tools:", [t.name for t in tools.tools])
            
            # Call a tool
            result = await session.call_tool(
                "search_apps",
                arguments={"query": "screenshot"}
            )
            print("Search result:", result.content[0].text)

asyncio.run(test_server())
```

---

## Key Concepts Learned Today

| Concept | Implementation |
|---|---|
| Server instantiation | `Server("server-name")` |
| Tool declaration | `@app.list_tools()` decorator |
| Tool execution | `@app.call_tool()` decorator |
| Resource declaration | `@app.list_resources()` decorator |
| Resource reading | `@app.read_resource()` decorator |
| Error handling | Return error dict in TextContent, never raise to caller |
| Server startup | `stdio_server()` context manager |

---

## Hands-On Task 🛠️

**You're building it.** The server code above IS the task.

**Step 1:** Copy the server code above and run it without errors.

**Step 2:** Test all 3 tools via MCP Inspector. Confirm expected outputs.

**Step 3:** Test error handling — call `get_app_details` with `app_name: "NonExistentApp"`. Confirm the error response is clean JSON.

**Step 4:** Add a 4th tool: `compare_apps` — takes two app names, returns side-by-side comparison. Implement the mock logic.

**Step 5:** Connect to Claude Desktop (if available) OR test via the Python MCP client. Ask Claude: "Compare ScreenshotAI and Screenshotter. Which should I download?"

**Your results and observations:**
> _(write here)_

---

## Q&A — Self-Assessment

---

**Q1.** Your MCP server has a bug in `get_app_reviews` — it raises an unhandled Python exception for some inputs. What happens to the MCP connection, and how do you fix it?

> **Your answer:**
> _(write here)_

---

**Q2.** You want your MCP server to access a real App Store API (not mock data). Where do you put the API key, and how does it reach your server without Claude ever seeing it?

> **Your answer:**
> _(write here)_

---

**Q3.** A user asks Claude: "What are the featured apps today?" Your server has the `appstore://featured` resource but Claude doesn't automatically read resources — it needs to decide to. How do you ensure Claude uses this resource?

> **Your answer:**
> _(write here)_

---

**Q4.** You deploy your MCP server and 10 users connect to it simultaneously. Each user asks different questions that trigger different tools. Is your `call_tool` handler thread-safe? What could go wrong with the mock data if it were mutable state?

> **Your answer:**
> _(write here)_

---

**Q5 — Architect Scenario.** Your MCP server is in production. You need to add logging to track every tool call (name, arguments, execution time, success/failure) without modifying every individual tool handler. How do you implement this as a cross-cutting concern?

> **Your answer:**
> _(write here)_

---

## Answer Guide — Claude's Reference Answers

---

**Q1 — Unhandled exception in tool handler**

An unhandled exception in your MCP server's tool handler will likely crash the server process, terminating the MCP connection. Claude will receive a connection error and cannot use any tools until the server restarts.

**Fix — always catch exceptions at the handler level:**

```python
@app.call_tool()
async def call_tool(name: str, arguments: dict) -> list[types.TextContent]:
    try:
        # All tool logic here
        result = await execute_specific_tool(name, arguments)
        return [types.TextContent(type="text", text=json.dumps(result))]
    
    except Exception as e:
        # Never let exceptions propagate out of call_tool
        error_response = {
            "error": type(e).__name__,
            "message": str(e),
            "tool": name
        }
        return [types.TextContent(type="text", text=json.dumps(error_response))]
```

The golden rule: `call_tool` should never raise. Always return a TextContent — even if the content describes an error.

---

**Q2 — Real API key in MCP server**

The API key lives in the server's environment variables — set before the server process starts.

```bash
# Set in your shell before running the server
export APP_STORE_API_KEY="your-real-key-here"
python server.py
```

Or in Claude Desktop config:
```json
{
  "mcpServers": {
    "app-store-research": {
      "command": "python",
      "args": ["/path/to/server.py"],
      "env": {
        "APP_STORE_API_KEY": "your-real-key-here"
      }
    }
  }
}
```

In your server code:
```python
import os
API_KEY = os.environ["APP_STORE_API_KEY"]  # Fails fast if not set
```

Claude never sees `APP_STORE_API_KEY`. Claude only sees the results your tool returns after using the key internally.

---

**Q3 — Getting Claude to use Resources**

Resources are not automatically read — Claude must decide to read them. For Claude to use the `appstore://featured` resource, one of these must be true:

1. **Mention it in a tool description:** "To see featured apps, read the resource at appstore://featured."

2. **Add a tool that wraps the resource:**
```python
types.Tool(
    name="get_featured_apps",
    description="Get today's featured apps on the App Store homepage. "
                "Use when the user asks about featured, popular, or recommended apps.",
    inputSchema={"type": "object", "properties": {}}
)
```
This tool internally reads the resource and returns it.

3. **Mention it in the system prompt:** "Available resources include appstore://featured for featured apps."

In practice, wrapping resources in tools (option 2) is the most reliable approach for current Claude versions. Tool selection is Claude's primary decision-making mechanism.

---

**Q4 — Thread safety with 10 simultaneous users**

The server code as written IS thread-safe because:
1. `MOCK_APPS` and `MOCK_REVIEWS` are read-only dictionaries — no mutations
2. Each tool call reads from shared state but never writes to it
3. The `asyncio` event loop handles concurrency single-threadedly — no true parallel execution in a single process

**What could go wrong if state were mutable:**
```python
# Dangerous — shared mutable state
call_counter = 0

@app.call_tool()
async def call_tool(name, arguments):
    call_counter += 1  # Race condition if concurrent
    # User 1 reads counter=5, User 2 reads counter=5,
    # Both increment to 6, one increment is lost
```

**Fix for mutable state:**
```python
import asyncio
counter_lock = asyncio.Lock()
call_counter = 0

async def increment_counter():
    global call_counter
    async with counter_lock:
        call_counter += 1
```

For production servers: prefer stateless handlers that read from external databases (which handle their own concurrency) rather than in-memory mutable state.

---

**Q5 — Cross-cutting logging without modifying each handler**

Use a decorator or middleware pattern:

```python
import time
import logging

logger = logging.getLogger(__name__)

def log_tool_call(handler):
    """Decorator that adds logging to any tool handler."""
    async def wrapper(name: str, arguments: dict):
        start_time = time.time()
        logger.info(f"Tool called: {name} | Args: {arguments}")
        
        try:
            result = await handler(name, arguments)
            duration_ms = (time.time() - start_time) * 1000
            logger.info(f"Tool success: {name} | {duration_ms:.1f}ms")
            return result
        
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            logger.error(f"Tool failed: {name} | {duration_ms:.1f}ms | Error: {e}")
            raise
    
    return wrapper

# Apply to the handler
@app.call_tool()
@log_tool_call
async def call_tool(name: str, arguments: dict) -> list[types.TextContent]:
    # Your tool implementation — unchanged
    ...
```

This gives you:
- Tool name logged on every call
- Arguments logged (consider redacting sensitive fields)
- Execution time measured
- Success/failure distinguished
- Zero changes to individual tool logic

Extend this pattern to add: request IDs for tracing, user IDs from context, cost estimation, and alert thresholds.

---

## Status

- [ ] Project set up (venv, dependencies)
- [ ] server.py built and running
- [ ] All 3 tools tested via MCP Inspector
- [ ] Error handling tested
- [ ] compare_apps tool added
- [ ] Connected to Claude Desktop or tested via Python client
- [ ] Q1 answered
- [ ] Q2 answered
- [ ] Q3 answered
- [ ] Q4 answered
- [ ] Q5 answered
- [ ] Answer guide reviewed
- [ ] Day 4 started — Tool Boundary Design

---

## Coming Up — Week 6, Day 4

**Topic:** Tool Boundary Design
One tool = one responsibility. Why fat tools cause reasoning overload. The principle of minimal surface area. How to scope your MCP tools for maximum Claude reliability.

---

*CCA Self-Study Log · Asif · Phase 2 of 5 · Week 6 of 12*
