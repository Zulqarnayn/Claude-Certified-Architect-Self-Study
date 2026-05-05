---
layout: default
title: CCA Self-Study — Week 6, Day 2
---

# CCA Self-Study — Week 6, Day 2
## MCP Server Architecture

**Date completed:** _____________
**Study time:** 30–45 mins
**Curriculum phase:** Phase 2 — Building with Claude
**Exam domain:** Domain 2 · Tool Design & MCP Integration

---

## Core Concept

Yesterday you learned what MCP is and why it exists. Today you learn how it works inside — the architecture of an MCP server, the request lifecycle from Claude to data source and back, and how tool discovery works so Claude knows what tools are available without you hardcoding them.

---

## The Analogy — A Waiter in a Restaurant

You (the customer) ask the waiter: "What can you make tonight?"
The waiter (MCP server) lists the menu (tool discovery).
You order something (tool call).
The waiter goes to the kitchen (data source), gets the dish, and brings it back (tool result).

You never go to the kitchen. The waiter manages everything between you and the kitchen. That's the MCP server's job.

The MCP protocol is the formal language the waiter and customer use — both speak the same language, follow the same ordering procedure, and understand the same menu format.

---

## MCP Server Anatomy

An MCP server is a process that:
1. Listens for MCP protocol messages
2. Declares its capabilities (tools, resources, prompts)
3. Handles execution requests
4. Returns results in the standard format

```python
# Minimal MCP server structure (Python SDK)
from mcp.server import Server
from mcp.server.stdio import stdio_server
import mcp.types as types

# Create server instance
app = Server("my-app-store-server")

# Declare tools (discovery)
@app.list_tools()
async def list_tools() -> list[types.Tool]:
    return [
        types.Tool(
            name="search_apps",
            description="Search the App Store catalog",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search term"}
                },
                "required": ["query"]
            }
        ),
        types.Tool(
            name="get_app_details",
            description="Get full details for a specific app",
            inputSchema={
                "type": "object",
                "properties": {
                    "app_name": {"type": "string"}
                },
                "required": ["app_name"]
            }
        )
    ]

# Handle tool execution
@app.call_tool()
async def call_tool(name: str, arguments: dict) -> list[types.TextContent]:
    if name == "search_apps":
        results = await search_app_store(arguments["query"])
        return [types.TextContent(type="text", text=str(results))]
    
    elif name == "get_app_details":
        details = await get_details(arguments["app_name"])
        return [types.TextContent(type="text", text=str(details))]
    
    else:
        raise ValueError(f"Unknown tool: {name}")

# Start the server
async def main():
    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

---

## The Request Lifecycle

```
1. INITIALISATION
   Claude (client) → connects to MCP server
   Server → sends capabilities/info
   
2. TOOL DISCOVERY
   Claude → sends "tools/list" request
   Server → responds with list of available tools
   Claude → now knows what tools exist and their schemas
   
3. TOOL CALL
   User message → "Find me screenshot apps"
   Claude → reasons about which tool to use
   Claude → sends "tools/call" request to MCP server:
   {
     "method": "tools/call",
     "params": {
       "name": "search_apps",
       "arguments": {"query": "screenshot organiser"}
     }
   }
   
4. EXECUTION
   MCP server → receives request
   MCP server → validates arguments
   MCP server → calls your actual implementation
   MCP server → formats result
   
5. RESULT RETURN
   MCP server → sends result back to Claude:
   {
     "content": [
       {"type": "text", "text": "[{name: ScreenshotAI, rating: 4.6}, ...]"}
     ]
   }
   
6. CLAUDE CONTINUES
   Claude → receives result
   Claude → continues reasoning
   Claude → either calls more tools or gives final answer
```

---

## Tool Discovery — How Claude Learns Your Tools

This is a key difference from inline tools. With inline tools, you manually pass the schema to each API call. With MCP, Claude discovers tools automatically by asking the server.

```
# What Claude sends:
{"method": "tools/list"}

# What your MCP server returns:
{
  "tools": [
    {
      "name": "search_apps",
      "description": "Search the App Store...",
      "inputSchema": {...}
    },
    {
      "name": "get_app_details",
      "description": "Get full details...",
      "inputSchema": {...}
    }
  ]
}
```

Claude uses this to build its internal understanding of what's available. When the user makes a request, Claude selects from the discovered tools — not from a hardcoded list.

**Implication:** If you add a new tool to your MCP server, Claude automatically gets access to it on the next connection — no changes needed in your Claude application code.

---

## Authentication in MCP Servers

MCP servers handle authentication internally — Claude never sees your credentials.

```python
# Pattern 1: Environment variables (most common)
import os

DATABASE_URL = os.environ.get("DATABASE_URL")  # Set in server environment
API_KEY = os.environ.get("THIRD_PARTY_API_KEY")

@app.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "query_database":
        # Claude passes the query, your code uses the credentials Claude never sees
        conn = await connect(DATABASE_URL)
        result = await conn.execute(arguments["query"])
        return [types.TextContent(type="text", text=str(result))]
```

```python
# Pattern 2: OAuth for user-specific access
# The MCP server manages OAuth tokens, not Claude

@app.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "get_user_emails":
        user_token = token_store.get(arguments["user_id"])  # Stored server-side
        emails = await gmail_api.list(token=user_token)
        return [types.TextContent(type="text", text=str(emails))]
```

**Security principle:** Claude never receives API keys, passwords, or tokens. The MCP server is the security boundary. Claude only receives the data you choose to return.

---

## Resources — Reading Data Without Tool Calls

MCP Resources let Claude read data without making explicit tool calls. Think of them as "files" Claude can open and read.

```python
@app.list_resources()
async def list_resources() -> list[types.Resource]:
    return [
        types.Resource(
            uri="appstore://catalog",
            name="App Store Catalog",
            description="Full catalog of available iOS apps",
            mimeType="application/json"
        )
    ]

@app.read_resource()
async def read_resource(uri: str) -> str:
    if uri == "appstore://catalog":
        catalog = await load_full_catalog()
        return json.dumps(catalog)
    raise ValueError(f"Unknown resource: {uri}")
```

**When to use Resources vs Tools:**
- Resources: static or semi-static data Claude should read (documentation, configuration, reference data)
- Tools: dynamic operations with side effects or parameters (search, create, update)

---

## Key Concepts Learned Today

| Term | Definition |
|---|---|
| Tool discovery | MCP protocol for Claude to learn what tools a server offers |
| tools/list | MCP request Claude sends to get available tools |
| tools/call | MCP request Claude sends to execute a tool |
| Server authentication | Credentials stored in the MCP server, never exposed to Claude |
| MCP Resources | Static/semi-static data Claude can read from MCP server |
| Initialisation | Handshake between Claude and MCP server at connection time |

---

## Hands-On Task 🛠️

**Task 1:** Install the MCP Python SDK:
```bash
pip install mcp
```

**Task 2:** Build the minimal App Store MCP server above. Start it and verify it runs without errors.

**Task 3:** Add a third tool: `get_app_reviews`. Confirm tool discovery returns all three tools.

**Task 4:** Add a Resource: `appstore://featured` that returns a hardcoded list of 5 featured apps.

**Task 5:** Read the MCP inspector tool documentation (github.com/modelcontextprotocol/inspector). Use it to test your server's tool listing and tool execution without connecting Claude.

**Your implementation and observations:**
> _(write here)_

---

## Q&A — Self-Assessment

---

**Q1.** What is the difference between tool discovery in MCP vs inline tool definitions? What is the advantage of MCP's discovery approach for large teams?

> **Your answer:**
> _(write here)_

---

**Q2.** Your MCP server needs to access your company's PostgreSQL database with admin credentials. Where do those credentials live, and why must Claude never see them?

> **Your answer:**
> _(write here)_

---

**Q3.** You add a new tool to your MCP server and deploy the updated server. Do you need to update any of the Claude applications that connect to this server? Why or why not?

> **Your answer:**
> _(write here)_

---

**Q4.** What is the difference between an MCP Resource and an MCP Tool? Give a concrete example where you'd use each in a document management system.

> **Your answer:**
> _(write here)_

---

**Q5 — Architect Scenario.** Your company's MCP server currently handles 100 req/min. A new Claude-powered product will add 500 req/min of load. Design the scaling strategy for the MCP server — what changes, what stays the same from Claude's perspective?

> **Your answer:**
> _(write here)_

---

## Answer Guide — Claude's Reference Answers

---

**Q1 — Discovery vs inline tools**

**Inline tools:** You hardcode the tool schema as a Python dict and pass it in every API call. If you add a new tool, you update the dict in your application code and redeploy. Every application maintains its own copy of the tool definitions.

**MCP discovery:** Claude sends `tools/list` to the server. The server responds with current tool schemas. Claude learns what's available at connection time — not from hardcoded application code.

**Advantage for large teams:**

1. **Single source of truth:** Tool schemas live in the MCP server. 10 Claude applications all get the same tool definitions from the same place.

2. **Decoupled deployments:** Add a new tool to the MCP server — all connected Claude applications automatically get access to it at next connection. No application code changes needed.

3. **Versioning:** You can version the MCP server independently of Claude applications. Roll back a bad tool definition without touching application code.

4. **Ownership separation:** The team that owns the database maintains the database MCP server. The team building Claude applications just consumes it. No cross-team coupling.

---

**Q2 — Database credentials in MCP**

Credentials live in the MCP server's environment — typically as environment variables set by your infrastructure (Kubernetes secrets, AWS Secrets Manager, `.env` file in development).

```
DATABASE_URL=postgresql://admin:secret@db.company.com/production
```

The MCP server reads this at startup. When Claude calls a database tool, the server uses the credentials internally to make the database connection. Claude only sees the query result — never the connection string.

**Why Claude must never see them:**

1. **Security:** Claude conversations may be logged. If credentials appear in Claude's context, they appear in logs.

2. **Prompt injection:** A malicious input could try to extract information from Claude's context. Credentials in context = credentials one injection away from exposure.

3. **Principle of least privilege:** Claude doesn't need database credentials to do its job. The MCP server needs them. Give each component only what it needs.

---

**Q3 — Updating MCP server without updating applications**

**No — you do not need to update Claude applications.**

This is one of MCP's core advantages. The tool discovery happens at connection time. When Claude next connects to the updated MCP server, it sends `tools/list`, receives the new tool list (including the new tool), and can use it immediately.

**Caveat:** If the new tool completely replaces an old tool (renamed, different schema), the old tool no longer appears in discovery. Claude won't call it. You may need to handle in-flight conversations that expected the old tool name — but for fresh connections, it's automatic.

**Deployment pattern:**
1. Deploy updated MCP server (new tool added)
2. Existing Claude connections still work (old tools still available)
3. New Claude connections get all tools including the new one
4. Zero changes to application code

This is the versioning benefit of the server-side architecture.

---

**Q4 — Resource vs Tool in document management**

**Resource** — `documents://policy/hr-handbook`:
The HR handbook is a large, semi-static document. Claude might need to read it to answer questions about company policy. It doesn't change often. Claude reads it the way you'd open a file — it's data, not an action.

```python
@app.read_resource()
async def read_resource(uri: str) -> str:
    if uri == "documents://policy/hr-handbook":
        return load_file("hr-handbook.pdf")  # Returns the full document
```

**Tool** — `search_documents(query, folder)`:
Searching documents is an action with parameters. It queries an index, applies filters, and returns a dynamic result set. Each call with different parameters returns different results.

```python
@app.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "search_documents":
        results = await search_index(
            query=arguments["query"],
            folder=arguments.get("folder")
        )
        return [types.TextContent(type="text", text=str(results))]
```

**Rule:** If it's "read this specific thing" → Resource. If it's "do something with parameters" → Tool.

---

**Q5 — Scaling MCP server to 600 req/min**

**What changes on the server side:**

1. **Horizontal scaling:** Run multiple instances of the MCP server behind a load balancer. Each instance is stateless (credentials in environment, no session state) — so you can run 3-5 instances and distribute load.

2. **Database connection pooling:** If the MCP server queries a database, use a connection pool (PgBouncer for PostgreSQL). At 600 req/min, naive connection-per-request will exhaust database connections.

3. **Caching:** Add a cache layer (Redis) for frequently-requested data that doesn't change often. `get_app_details("ScreenshotAI")` returns the same data 1,000 times/day — cache it for 5 minutes.

4. **Rate limiting per client:** Prevent one Claude application from starving others with server-side rate limiting per client ID.

**What stays the same from Claude's perspective:**

- The MCP protocol is identical
- Tool schemas are identical  
- Tool names and behaviours are identical
- Claude connects to the same endpoint (load balancer URL)

From Claude's point of view, the server scaled invisibly. This is the infrastructure abstraction benefit of MCP — scaling is the server's problem, not Claude's.

---

## Status

- [ ] MCP Python SDK installed
- [ ] Minimal MCP server built and running
- [ ] Third tool added, discovery confirmed
- [ ] Resource added
- [ ] MCP Inspector used to test server
- [ ] Q1 answered
- [ ] Q2 answered
- [ ] Q3 answered
- [ ] Q4 answered
- [ ] Q5 answered
- [ ] Answer guide reviewed
- [ ] Day 3 started — Build Your First MCP Server

---

## Coming Up — Week 6, Day 3

**Topic:** Build Your First MCP Server
From theory to working code. Build a complete MCP server with 3 tools, connect it to Claude, and make real tool calls through the MCP protocol.

---

*CCA Self-Study Log · Asif · Phase 2 of 5 · Week 6 of 12*
