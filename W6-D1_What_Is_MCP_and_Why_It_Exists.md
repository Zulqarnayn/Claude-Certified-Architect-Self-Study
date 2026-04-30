# CCA Self-Study — Week 6, Day 1
## What Is MCP and Why It Exists

**Date completed:** _____________
**Study time:** 30–45 mins
**Curriculum phase:** Phase 2 — Building with Claude
**Exam domain:** Domain 2 · Tool Design & MCP Integration

---

## Core Concept

In Week 5 you defined tools inline — Python dicts passed directly to the API. This works for small systems. It doesn't scale. When you have 50 tools, multiple teams, multiple Claude applications, and external data sources — you need a standard way to connect Claude to the world.

**MCP (Model Context Protocol)** is that standard. It is an open protocol that defines how AI models connect to external tools and data sources in a structured, reusable, and secure way.

---

## The Analogy — USB-C

Before USB-C, every device had its own connector. Laptops had proprietary chargers. Phones had micro-USB or Lightning. Hard drives had their own cables. Every combination required a different adapter.

USB-C solved this with one standard: any USB-C device connects to any USB-C port. Laptop, phone, monitor, hard drive — one cable.

Before MCP: every AI application had to write custom tool integrations for every data source. Claude wanted to read a Google Doc? You wrote custom code. Access a database? More custom code. Call a GitHub API? Even more.

MCP is USB-C for AI. One standard protocol, and any MCP-compatible tool connects to any MCP-compatible model. Write the MCP server once, use it with Claude, with other models, with other applications.

---

## The Problem MCP Solves

### Without MCP — Custom Everything
```
App 1 (Customer Support)    → Custom code → Database
App 1 (Customer Support)    → Custom code → Zendesk API
App 1 (Customer Support)    → Custom code → Email service

App 2 (Internal Tool)       → Custom code → Same Database
App 2 (Internal Tool)       → Custom code → Same Zendesk API
App 2 (Internal Tool)       → Custom code → GitHub API

Total: 6 custom integrations, 5 data sources, maintained separately
```

### With MCP — Write Once, Use Everywhere
```
MCP Server: Database    ← Written once, reusable
MCP Server: Zendesk     ← Written once, reusable
MCP Server: Email       ← Written once, reusable
MCP Server: GitHub      ← Written once, reusable

App 1 → connects to: Database MCP, Zendesk MCP, Email MCP
App 2 → connects to: Database MCP, Zendesk MCP, GitHub MCP

Total: 4 MCP servers, unlimited apps
```

---

## MCP Architecture — Three Components

```
┌─────────────────────────────────────────────┐
│              MCP CLIENT                     │
│  (Claude / your application)                │
│  - Sends requests to MCP servers            │
│  - Receives tool results                    │
└──────────────────┬──────────────────────────┘
                   │ MCP Protocol
                   │ (JSON-RPC over stdio/HTTP)
┌──────────────────▼──────────────────────────┐
│              MCP SERVER                     │
│  (your tool implementation)                 │
│  - Exposes tools, resources, prompts        │
│  - Handles execution                        │
│  - Returns results                          │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│            DATA SOURCE                      │
│  (Database, API, File system, etc.)         │
└─────────────────────────────────────────────┘
```

### The Three MCP Primitives

| Primitive | What it is | Example |
|---|---|---|
| **Tools** | Functions Claude can call | `search_database`, `send_email` |
| **Resources** | Data Claude can read | File contents, database records, API responses |
| **Prompts** | Reusable prompt templates | "Summarise this document", "Explain this error" |

You've been working with tools. Resources and Prompts are MCP-specific additions that make servers richer than raw tool use.

---

## MCP vs Inline Tool Definitions

| Aspect | Inline Tools (Week 5) | MCP Server |
|---|---|---|
| Where defined | Python dict in your code | Separate server process |
| Reusability | One application | Any application |
| Maintenance | Coupled to your app | Independent versioning |
| Discovery | You write the definition | Server declares its tools |
| Authentication | Your code handles it | Server handles it |
| Best for | Small, app-specific tools | Shared tools across apps |

**When to use each:**
- Inline tools: prototypes, app-specific logic, tools that only make sense for one application
- MCP servers: shared data sources, reusable integrations, tools used by multiple Claude applications

---

## The MCP Ecosystem

MCP is an open standard — anyone can build MCP servers. This creates an ecosystem:

**Official servers (from Anthropic and partners):**
- GitHub MCP server
- Google Drive MCP server
- Slack MCP server
- PostgreSQL MCP server
- Filesystem MCP server

**Community servers:**
- Jira, Linear, Notion, Stripe, Twilio, and hundreds more
- See: github.com/modelcontextprotocol/servers

**You can build your own:**
- Your proprietary database
- Your internal APIs
- Your company's specific data sources

This is why MCP matters for the CCA exam — enterprise Claude deployments use MCP servers to connect Claude to existing company infrastructure without writing custom integration code for every Claude application.

---

## MCP Transport — How Client and Server Communicate

MCP uses two transport mechanisms:

### stdio (Standard I/O)
For local tools — the MCP server is a process running on the same machine.
```
Claude Code → launches MCP server as subprocess → communicates via stdin/stdout
```
Best for: developer tools, local file access, command-line integrations.

### HTTP with SSE (Server-Sent Events)
For remote tools — the MCP server is a networked service.
```
Claude application → HTTP POST to MCP server → SSE stream of responses
```
Best for: shared team tools, cloud services, production deployments.

---

## Key Concepts Learned Today

| Term | Definition |
|---|---|
| MCP | Model Context Protocol — open standard for AI-to-tool connections |
| MCP Client | The AI model or application that consumes MCP servers |
| MCP Server | The service that implements and exposes tools/resources/prompts |
| Tools (MCP) | Functions exposed by an MCP server that Claude can call |
| Resources (MCP) | Data sources an MCP server exposes for Claude to read |
| Prompts (MCP) | Reusable prompt templates exposed by an MCP server |
| stdio transport | Local MCP communication via process stdin/stdout |
| HTTP/SSE transport | Remote MCP communication via HTTP |

---

## Hands-On Task 🛠️

**Task 1 — Explore the MCP specification:**
Read the overview at modelcontextprotocol.io. Note: what are the three primitives? What is the transport layer? How does tool discovery work?

**Task 2 — Browse existing MCP servers:**
Go to github.com/modelcontextprotocol/servers. Find 3 servers that would be useful in a real product you might build. Note what tools each exposes.

**Task 3 — Connect Claude Desktop to an existing MCP server:**
If you have Claude Desktop installed, add the filesystem MCP server to your config:
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"]
    }
  }
}
```
Ask Claude to list files in /tmp. Observe how it uses the MCP tool.

**Your observations:**
> _(write here)_

---

## Q&A — Self-Assessment

---

**Q1.** What is the core problem MCP solves? Before MCP, what did every Claude application have to do to connect to a database?

> **Your answer:**
> _(write here)_

---

**Q2.** You're building a company's internal AI assistant. It needs to access: the customer database, the support ticket system, and internal documentation. Should you build inline tools or MCP servers? Justify your answer.

> **Your answer:**
> _(write here)_

---

**Q3.** What are the three MCP primitives? Give a real-world example of each in the context of a code review assistant.

> **Your answer:**
> _(write here)_

---

**Q4.** When would you use stdio transport vs HTTP/SSE transport for an MCP server? Give one use case for each.

> **Your answer:**
> _(write here)_

---

**Q5 — Architect Scenario.** A startup has 3 Claude-powered products: a customer support bot, an internal knowledge base assistant, and a developer productivity tool. All three need to access the company's PostgreSQL database. Design the MCP architecture — how many MCP servers, what they expose, and how each product connects.

> **Your answer:**
> _(write here)_

---

## Answer Guide — Claude's Reference Answers

---

**Q1 — The problem MCP solves**

Before MCP, every Claude application that wanted to connect to a database had to write custom integration code — Python functions that called the database, formatted the results, and passed them to Claude as tool results. If two different Claude applications needed the same database, they each wrote separate custom integrations.

The problem compounds at scale: 5 Claude applications × 10 data sources = 50 custom integrations, all maintained separately, all potentially drifting out of sync, all requiring separate authentication handling.

MCP solves this by standardising the interface. Write the database integration once as an MCP server. Any Claude application connects to it using the same protocol. The integration is maintained in one place, versioned independently, and reused everywhere.

---

**Q2 — Inline tools vs MCP servers for internal assistant**

**MCP servers — strongly recommended.**

Three separate data sources (database, tickets, docs) that other Claude applications might also need = classic MCP use case.

Specifically:
- `database-mcp` server — exposes customer lookup, order history, account status
- `tickets-mcp` server — exposes ticket creation, search, status update
- `docs-mcp` server — exposes documentation search and retrieval

**Why not inline tools:**
1. If you build a second Claude application (say, a developer tool) that also needs the customer database, you'd duplicate the inline integration. With MCP, the second app just connects to the same `database-mcp` server.
2. Authentication to the database is handled in the MCP server — not in every application's code.
3. You can update the database schema and only update the MCP server, not every application.

**The rule:** If it might be reused, make it MCP.

---

**Q3 — Three MCP primitives for code review assistant**

**Tools** — functions Claude can call:
- `get_pull_request(pr_id)` — fetch PR diff and metadata
- `post_review_comment(file, line, comment)` — post a comment on a specific line
- `approve_pr(pr_id)` — approve the pull request
- `run_linter(file_path)` — trigger linting and return results

**Resources** — data Claude can read:
- `repo://main/src/` — current codebase files as readable resources
- `docs://coding-standards` — team coding standards document
- `history://commit/{sha}` — commit history for context

**Prompts** — reusable prompt templates:
- `review-security-focus` — a prompt template that instructs Claude to focus on security vulnerabilities
- `explain-change` — a prompt that explains what a diff changes in plain English
- `generate-test-cases` — a prompt for generating unit tests for a given function

---

**Q4 — stdio vs HTTP/SSE transport**

**stdio transport:**
Use case: A developer installs Claude Code on their laptop. They configure an MCP server that gives Claude access to their local file system and local git repository. The MCP server runs as a subprocess on the same machine.

Best for: Local tools, developer machines, tools that need access to local resources (files, local databases, local network).

**HTTP/SSE transport:**
Use case: A company runs a shared MCP server that gives all employees' Claude instances access to the company's Salesforce CRM. The MCP server is deployed as a cloud service accessible over HTTPS.

Best for: Shared team tools, cloud services, production deployments where the MCP server is centralised infrastructure rather than per-user installation.

---

**Q5 — MCP architecture for 3 products**

**Architecture: 1 shared MCP server + product-specific servers**

```
┌─────────────────────────────────────────────────┐
│         SHARED: database-mcp (PostgreSQL)        │
│  Tools: query_customers, get_orders, get_account │
│  Auth: service account credentials               │
│  Deployed: internal cloud service (HTTP/SSE)     │
└────────────┬───────────────────┬─────────────────┘
             │                   │
             │            (connects)
             │                   │
┌────────────▼───┐  ┌────────────▼────────────────┐
│ Customer       │  │ Internal KB                 │
│ Support Bot    │  │ Assistant                   │
│                │  │                             │
│ + tickets-mcp  │  │ + docs-mcp (Confluence)     │
│   (Zendesk)    │  │ + search-mcp (Elasticsearch)│
└────────────────┘  └─────────────────────────────┘
                              ↑
             ┌────────────────┘
             │
┌────────────▼────────────────┐
│ Developer Productivity      │
│ Tool                        │
│                             │
│ + github-mcp                │
│ + ci-mcp (CircleCI)         │
│ + jira-mcp                  │
└─────────────────────────────┘
```

**Key decisions:**
1. `database-mcp` is shared — all 3 products connect to it. Maintained once. Auth in one place.
2. Each product has its own additional MCP servers for its specific needs.
3. `database-mcp` uses HTTP/SSE (remote shared service). Developer tool local MCPs (github, ci) use stdio.
4. Access control: `database-mcp` has read-only tools for the KB assistant, read-write for support bot.

---

## Status

- [ ] Concept read and understood
- [ ] MCP specification overview read
- [ ] 3 existing MCP servers found and documented
- [ ] Claude Desktop MCP connection attempted (optional)
- [ ] Q1 answered
- [ ] Q2 answered
- [ ] Q3 answered
- [ ] Q4 answered
- [ ] Q5 answered
- [ ] Answer guide reviewed
- [ ] Day 2 started — MCP Server Architecture

---

## Coming Up — Week 6, Day 2

**Topic:** MCP Server Architecture
Client vs server roles. The request lifecycle from Claude to MCP to data source. How tool discovery works. How authentication is handled in an MCP server.

---

*CCA Self-Study Log · Asif · Phase 2 of 5 · Week 6 of 12*
