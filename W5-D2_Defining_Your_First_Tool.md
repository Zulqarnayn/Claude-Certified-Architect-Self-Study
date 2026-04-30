---
layout: default
title: CCA Self-Study — Week 5, Day 2
---

# CCA Self-Study — Week 5, Day 2
## Defining Your First Tool

**Date completed:** _____________
**Study time:** 30–45 mins
**Curriculum phase:** Phase 2 — Building with Claude
**Exam domain:** Domain 2 · Tool Design & MCP Integration

---

## Core Concept

A tool definition is not just plumbing — it is a contract between you and Claude. Every word of the description shapes Claude's decisions: when to call the tool, what arguments to pass, and what to do with the result. Poorly defined tools produce wrong, inefficient, or unreliable agent behaviour.

Today you learn to write tool definitions with precision.

---

## The Analogy — A Function Signature with a User Manual

In Swift, a function signature tells the compiler what types to expect:
```swift
func fetchUser(id: String, includeHistory: Bool = false) -> User
```

But the compiler doesn't know *when* to call this function or *why*. Your tool description is the user manual that tells Claude both the signature AND the intent:

> "Call this function when you need to look up user details. Use `includeHistory: true` only when the user has asked about past activity — it significantly increases response time."

The description is what transforms a function into a tool Claude can reason about.

---

## Tool Definition Anatomy

```python
{
    "name": "search_app_store",          # ← Identifier (snake_case)
    "description": "...",                # ← Intent + when-to-use + what-it-returns
    "input_schema": {                    # ← JSON Schema for arguments
        "type": "object",
        "properties": {
            "query": {...},
            "category": {...},
            "max_results": {...}
        },
        "required": ["query"]            # ← Which args are mandatory
    }
}
```

---

## Part 1 — Naming Conventions

| Convention | Example | Why |
|---|---|---|
| Use snake_case | `get_user_profile` | Consistent with JSON conventions |
| Start with a verb | `search_`, `get_`, `create_`, `update_`, `delete_`, `send_` | Makes intent clear |
| Be specific | `search_app_store` not `search` | Claude knows what it's searching |
| No abbreviations | `get_product_details` not `get_prod_dtls` | Claude reads descriptions, not code |

---

## Part 2 — The Description Formula

A great tool description answers four questions:

```
1. WHAT does this tool do?
2. WHEN should Claude use it (trigger conditions)?
3. WHAT does it return?
4. WHAT should Claude NOT use it for?
```

**Template:**
```
"[WHAT it does]. Use this when [WHEN to use]. 
Returns [WHAT it returns]. 
Do not use for [EXCLUSIONS - optional but powerful]."
```

**Example:**
```python
"description": (
    "Search the iOS App Store catalog by keyword, category, or developer name. "
    "Use this when the user asks about apps, app recommendations, app pricing, "
    "or wants to find apps for a specific purpose. "
    "Returns a list of matching apps with name, developer, price, rating, and description. "
    "Do not use for questions about app development or publishing — "
    "this only searches existing published apps."
)
```

---

## Part 3 — Input Schema Design

The input schema is JSON Schema format. Every property needs a type and description.

### Basic Types

```python
"properties": {
    # String
    "query": {
        "type": "string",
        "description": "Search term. Can be app name, category, or keyword."
    },
    
    # Integer
    "max_results": {
        "type": "integer",
        "description": "Maximum number of results to return. Default: 10, max: 50.",
        "default": 10
    },
    
    # Boolean
    "include_paid": {
        "type": "boolean",
        "description": "Whether to include paid apps. Default: true."
    },
    
    # Enum
    "category": {
        "type": "string",
        "enum": ["productivity", "utilities", "games", "health", "finance", "other"],
        "description": "App category filter. Omit to search all categories."
    },
    
    # Number (float)
    "min_rating": {
        "type": "number",
        "description": "Minimum average rating (0.0-5.0). Omit to include all ratings."
    },
    
    # Array
    "tags": {
        "type": "array",
        "items": {"type": "string"},
        "description": "Filter by tags. e.g. ['offline', 'no-ads']"
    }
}
```

### Required vs Optional

```python
"required": ["query"]  # Only query is mandatory
# All others are optional — Claude decides whether to include them
```

**Design rule:** Make the minimum set required. Optional parameters give Claude flexibility to use them only when relevant to the user's query.

---

## Part 4 — Connecting Tool to Function

```python
import anthropic
import json
from typing import Any

client = anthropic.Anthropic()

# Tool definition
TOOLS = [
    {
        "name": "search_app_store",
        "description": (
            "Search the iOS App Store catalog by keyword or category. "
            "Use when the user asks about apps, recommendations, or pricing. "
            "Returns matching apps with name, price, rating, and description."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Search term — app name, category, or purpose"
                },
                "category": {
                    "type": "string",
                    "enum": ["productivity", "utilities", "games", "health", "other"],
                    "description": "Filter by category (optional)"
                },
                "max_results": {
                    "type": "integer",
                    "description": "Max results to return (1-20, default 5)"
                }
            },
            "required": ["query"]
        }
    }
]

# Tool implementation (your actual code)
def search_app_store(query: str, category: str = None, max_results: int = 5) -> list:
    # In production: call real App Store API
    # Mock data for learning:
    mock_results = [
        {"name": "ScreenshotAI", "price": 0.0, "rating": 4.6, 
         "description": "AI-powered screenshot organiser"},
        {"name": "CleanShot X", "price": 29.99, "rating": 4.8,
         "description": "Screenshot tool for Mac"},
    ]
    return mock_results[:max_results]

# Tool dispatcher — maps tool names to functions
def execute_tool(tool_name: str, tool_input: dict) -> Any:
    tool_registry = {
        "search_app_store": search_app_store,
    }
    
    if tool_name not in tool_registry:
        return {"error": f"Unknown tool: {tool_name}"}
    
    try:
        return tool_registry[tool_name](**tool_input)
    except Exception as e:
        return {"error": str(e)}

# Complete agent loop
def run_agent(user_message: str) -> str:
    messages = [{"role": "user", "content": user_message}]
    
    while True:
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1024,
            tools=TOOLS,
            messages=messages
        )
        
        if response.stop_reason == "end_turn":
            # Extract final text response
            return next(
                block.text for block in response.content 
                if block.type == "text"
            )
        
        elif response.stop_reason == "tool_use":
            # Find all tool_use blocks
            tool_uses = [b for b in response.content if b.type == "tool_use"]
            
            # Add Claude's response to messages
            messages.append({"role": "assistant", "content": response.content})
            
            # Execute each tool and collect results
            tool_results = []
            for tool_use in tool_uses:
                result = execute_tool(tool_use.name, tool_use.input)
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": tool_use.id,
                    "content": json.dumps(result)
                })
            
            # Send all results back
            messages.append({"role": "user", "content": tool_results})
        
        else:
            raise Exception(f"Unexpected stop_reason: {response.stop_reason}")

# Test it
result = run_agent("Find me the best screenshot apps for iOS")
print(result)
```

---

## Key Concepts Learned Today

| Term | Definition |
|---|---|
| Tool description formula | What + When + Returns + Exclusions |
| Input schema | JSON Schema defining parameter types, constraints, and required fields |
| Required vs optional params | Required = always needed; optional = Claude decides when to include |
| Tool dispatcher | Code that maps tool names to implementation functions |
| Tool registry | Dictionary of available tool implementations |

---

## Hands-On Task 🛠️

Design and implement a 3-tool system for an iOS app research assistant.

**Tool 1:** `get_app_details` — given an app name, returns version, size, requirements, last update
**Tool 2:** `get_app_reviews` — given an app name, returns recent reviews with ratings
**Tool 3:** `compare_apps` — given two app names, returns a side-by-side comparison

**Requirements:**
1. Write a high-quality description for each tool using the 4-question formula
2. Design input schema with appropriate types and required/optional split
3. Implement mock functions for each tool
4. Build a tool dispatcher
5. Test with: *"Should I use ScreenshotAI or Screenshotter? I care most about ratings and recent updates."*

**Your implementation:**
> _(write here)_

---

## Q&A — Self-Assessment

---

**Q1.** You have two tools: `search_products` and `get_product_details`. A user asks: "Tell me everything about the iPhone 15 Pro." Which tool should Claude call first, and why does the description determine this?

> **Your answer:**
> _(write here)_

---

**Q2.** Your tool has an optional parameter `include_reviews: boolean`. If Claude doesn't include it in a tool call, what value does it receive in your Python function? How do you handle this?

> **Your answer:**
> _(write here)_

---

**Q3.** A user asks a question that could use either `search_products` OR `get_product_details`. Both descriptions are vague. What happens, and how do you fix it?

> **Your answer:**
> _(write here)_

---

**Q4.** Should your tool implementation validate the arguments Claude passes, or can you trust that Claude will always pass valid arguments per your schema?

> **Your answer:**
> _(write here)_

---

**Q5 — Architect Scenario.** You're building a customer support tool for a SaaS company. You need Claude to: look up customer account info, check subscription status, create support tickets, and send emails. Design the tool set — how many tools, what names, what the descriptions say about when NOT to use each one.

> **Your answer:**
> _(write here)_

---

## Answer Guide — Claude's Reference Answers

---

**Q1 — Which tool Claude calls first**

Claude should call `search_products` first — it finds the product and returns its ID or identifier. Then call `get_product_details` with that identifier to get full information.

**But this only happens reliably if the descriptions make it clear:**

```
search_products: "Search the catalog by keyword. Use this FIRST to find
a product when you know its name but need its ID. Returns product names 
and IDs only."

get_product_details: "Get full details for a specific product by its ID.
Use AFTER search_products when you have a product ID. Do not use without
a product ID — use search_products first."
```

The descriptions create a dependency chain that Claude follows. Without "Use AFTER..." and "Use FIRST...", Claude might try to call `get_product_details` directly with the product name, which your implementation doesn't support.

---

**Q2 — Optional parameter not passed**

If Claude doesn't include `include_reviews` in the tool call, your Python function receives no value for that parameter. If you've defined a default:

```python
def get_product(name: str, include_reviews: bool = False) -> dict:
    ...
```

It defaults to `False`. This is correct — optional parameters should always have sensible defaults in your implementation.

**Never use `None` as a default for booleans without handling it:**
```python
# Bad — None is not False
def get_product(name: str, include_reviews: bool = None) -> dict:
    if include_reviews:  # None is falsy but semantically ambiguous
        ...

# Good — explicit default
def get_product(name: str, include_reviews: bool = False) -> dict:
    if include_reviews:
        ...
```

---

**Q3 — Vague descriptions cause ambiguity**

When tool descriptions are vague, Claude makes arbitrary choices — sometimes picking the right tool by luck, sometimes not. You'll see inconsistent behaviour across similar queries.

Claude might:
1. Call the wrong tool and get an error (tool doesn't support that input)
2. Call both tools unnecessarily (wasting tokens and time)
3. Call neither and answer from its training data (potentially wrong)

**Fix:** Add disambiguation language to each description:

```
search_products: "Use when you have a partial name or category and need to 
find matching products. Returns a list."

get_product_details: "Use when you have a specific product name or ID and 
need complete information about that exact product. Returns single record."
```

The key phrases "partial name" vs "specific product name" clearly differentiate the two.

---

**Q4 — Trust Claude's arguments or validate?**

**Never trust blindly — always validate.**

Claude follows your schema most of the time, but:
1. Claude might pass a string where you expect an integer
2. Claude might pass a value outside an enum despite your definition
3. A prompt injection attack might try to manipulate tool arguments
4. Schema enforcement in the prompt is probabilistic, not guaranteed

```python
def execute_tool(tool_name: str, tool_input: dict) -> Any:
    try:
        if tool_name == "search_products":
            # Validate before executing
            query = str(tool_input.get("query", ""))
            if not query or len(query) > 500:
                return {"error": "Invalid query parameter"}
            
            max_results = int(tool_input.get("max_results", 10))
            max_results = max(1, min(50, max_results))  # Clamp to valid range
            
            return search_products(query=query, max_results=max_results)
    
    except (KeyError, ValueError, TypeError) as e:
        return {"error": f"Invalid tool arguments: {e}"}
```

Treat tool inputs like untrusted user input — because Claude's reasoning is probabilistic and tool inputs pass through that reasoning.

---

**Q5 — Customer support tool set design**

```python
tools = [
    {
        "name": "get_customer_account",
        "description": (
            "Look up a customer account by email or account ID. "
            "Use this FIRST in any support interaction to verify the customer "
            "and retrieve their account details. "
            "Returns: account ID, name, email, plan, account status. "
            "Do not use to check subscription or billing — use get_subscription for that."
        )
    },
    {
        "name": "get_subscription_status",
        "description": (
            "Get detailed subscription and billing information for a customer. "
            "Use when the customer asks about their plan, billing date, payment history, "
            "or usage limits. Requires account_id from get_customer_account. "
            "Returns: plan name, billing cycle, next payment date, feature limits, usage."
        )
    },
    {
        "name": "create_support_ticket",
        "description": (
            "Create a new support ticket for a customer issue that cannot be resolved "
            "immediately in this conversation. "
            "Use when: the issue requires engineering investigation, a refund > $50, "
            "or account-level changes requiring manual review. "
            "Do NOT use for: questions you can answer directly, minor billing adjustments. "
            "Returns: ticket ID and estimated response time."
        )
    },
    {
        "name": "send_email_to_customer",
        "description": (
            "Send a transactional email to the customer. "
            "Use ONLY to send: password reset links, ticket confirmation, "
            "or account change notifications. "
            "Do NOT use to send marketing emails, promotional offers, or unsolicited content. "
            "Requires account_id. Returns: delivery confirmation."
        )
    }
]
```

Note the pattern: every tool has explicit DO NOT USE cases. This prevents Claude from using `create_support_ticket` for trivial queries and `send_email` for things it shouldn't send.

---

## Status

- [ ] Concept read and understood
- [ ] 3-tool system designed
- [ ] Descriptions written using 4-question formula
- [ ] Tool dispatcher implemented
- [ ] Full agent loop tested
- [ ] Q1 answered
- [ ] Q2 answered
- [ ] Q3 answered
- [ ] Q4 answered
- [ ] Q5 answered
- [ ] Answer guide reviewed
- [ ] Day 3 started — Tool Description Quality

---

## Coming Up — Week 5, Day 3

**Topic:** Tool Description Quality
The description IS the interface. Write three versions of the same tool description and compare how Claude behaves differently. Master the art of tool disambiguation.

---

*CCA Self-Study Log · Asif · Phase 2 of 5 · Week 5 of 12*
