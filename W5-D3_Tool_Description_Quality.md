---
layout: default
title: CCA Self-Study — Week 5, Day 3
---

# CCA Self-Study — Week 5, Day 3
## Tool Description Quality

**Date completed:** _____________
**Study time:** 30–45 mins
**Curriculum phase:** Phase 2 — Building with Claude
**Exam domain:** Domain 2 · Tool Design & MCP Integration

---

## Core Concept

Yesterday you learned the formula for tool descriptions. Today you go deeper — understanding that tool description quality is the single highest-leverage variable in multi-tool agent systems. Bad descriptions cause wrong tool selection, unnecessary tool calls, missing tool calls, and hallucinated arguments. Great descriptions make Claude's tool selection feel almost telepathic.

**The description is the only interface Claude has to understand your tool. Make it perfect.**

---

## The Analogy — App Store Listings

When a user searches the App Store for "screenshot organiser," they see app names and descriptions. They choose based on those 2–3 lines of text. A bad description ("organises things") gets scrolled past. A great description ("OCR-powered screenshot sorter — find any screenshot by searching its text content") gets downloaded.

Your tool descriptions work identically. Claude "searches" through your tools looking for the right one. The description is the listing. Bad listing = wrong tool called or skipped.

---

## The Three Failure Modes of Bad Descriptions

### Failure Mode 1 — Under-specification
Claude doesn't know when to use the tool.

```python
# Bad
{
    "name": "query_db",
    "description": "Queries the database."
}
# Claude has no idea WHEN to call this, WHAT database, or WHAT it returns.
# Result: Called for everything or nothing.
```

### Failure Mode 2 — Over-lap (No Disambiguation)
Multiple tools sound similar — Claude picks randomly.

```python
# Bad — both sound the same
{
    "name": "get_user",
    "description": "Gets user information."
},
{
    "name": "fetch_account",
    "description": "Fetches account details."
}
# Claude can't distinguish these. Will call one arbitrarily.
```

### Failure Mode 3 — Missing Return Description
Claude doesn't know what to do with the result.

```python
# Bad
{
    "name": "search_products",
    "description": "Search for products matching a query."
    # Returns... what? IDs? Full objects? A count? A URL?
}
# Claude might call get_product_details unnecessarily because
# it doesn't know search already returns full details.
```

---

## Quality Checklist — For Every Tool Description

Before finalising any tool description, verify:

- [ ] **Trigger clarity:** Would Claude know exactly when to use this from the description alone?
- [ ] **Disambiguation:** If you have similar tools, is this one clearly different?
- [ ] **Return description:** Does it say what the tool returns?
- [ ] **Exclusions:** Are there cases where this tool should NOT be used?
- [ ] **Argument guidance:** Do the arg descriptions explain HOW to fill them, not just WHAT they are?
- [ ] **No jargon:** Could Claude understand this without domain knowledge?
- [ ] **Specific, not vague:** Does it say "customer's subscription tier and billing date" rather than "account info"?

---

## Side-by-Side Comparison — Three Quality Levels

### Level 1 — Poor
```python
{
    "name": "search",
    "description": "Searches for things.",
    "input_schema": {
        "type": "object",
        "properties": {
            "q": {"type": "string", "description": "query"}
        },
        "required": ["q"]
    }
}
```
Problems: What does it search? What does it return? When to use? Argument name `q` is cryptic.

---

### Level 2 — Adequate
```python
{
    "name": "search_products",
    "description": "Search the product catalog. Returns matching products.",
    "input_schema": {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "Search query"
            }
        },
        "required": ["query"]
    }
}
```
Better: name is clear, returns products. Missing: when to use, what "matching" means, return structure detail.

---

### Level 3 — Production-Quality
```python
{
    "name": "search_products",
    "description": (
        "Search the product catalog by name, description, or SKU. "
        "Use when the user mentions a product by name or asks what products "
        "are available for a specific use case. "
        "Returns: list of matching products, each with id, name, price_usd, "
        "in_stock (boolean), and short_description. "
        "Use get_product_details to retrieve full specifications after finding "
        "the product ID here. "
        "Do not use for pricing questions about a specific known product — "
        "use get_product_details directly if you already have the product ID."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": (
                    "Search term — product name, category, or use-case description. "
                    "E.g. 'wireless headphones', 'SKU-12345', 'noise cancelling'"
                )
            },
            "max_results": {
                "type": "integer",
                "description": "Maximum results to return (1-20). Default: 5. Use 1 when you need only the closest match."
            },
            "in_stock_only": {
                "type": "boolean",
                "description": "If true, only return products currently in stock. Default: false."
            }
        },
        "required": ["query"]
    }
}
```

Every element serves a purpose. Claude knows exactly when to use it, what to pass, and what comes back.

---

## Argument Description Quality

Arguments descriptions are just as important as the tool description itself.

```python
# Bad argument descriptions
"city": {"type": "string", "description": "City"}
"date": {"type": "string", "description": "Date"}
"limit": {"type": "integer", "description": "Limit"}

# Good argument descriptions
"city": {
    "type": "string",
    "description": "City name as commonly known. E.g. 'Dhaka', 'New York', 'London'. "
                   "Include country if ambiguous: 'Dublin, Ireland' vs 'Dublin, Ohio'."
},
"date": {
    "type": "string",
    "description": "Date in ISO 8601 format: YYYY-MM-DD. E.g. '2026-05-15'. "
                   "Use today's date if the user says 'today' or 'now'."
},
"limit": {
    "type": "integer",
    "description": "Maximum number of records to return (1-100). Default: 10. "
                   "Use a higher limit only when the user explicitly asks for 'all' results."
}
```

Good argument descriptions tell Claude HOW to fill the field, not just what type it is.

---

## Testing Tool Description Quality

The best test: give Claude a set of prompts and observe whether it picks the right tool.

```python
test_cases = [
    ("Find me screenshot apps", "search_app_store"),           # Should call search
    ("What's the rating of ScreenshotAI?", "get_app_details"), # Should call details
    ("Compare two apps for me", "compare_apps"),               # Should call compare
    ("What is machine learning?", None),                        # Should NOT call any tool
    ("How much does CleanShot cost?", "get_app_details"),      # Should call details
]

for user_message, expected_tool in test_cases:
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1024,
        tools=YOUR_TOOLS,
        messages=[{"role": "user", "content": user_message}]
    )
    
    if response.stop_reason == "tool_use":
        called_tool = response.content[0].name
        status = "✅" if called_tool == expected_tool else "❌"
        print(f"{status} '{user_message}' → called {called_tool} (expected {expected_tool})")
    else:
        status = "✅" if expected_tool is None else "❌"
        print(f"{status} '{user_message}' → no tool called (expected {expected_tool})")
```

Run this test after every description change. It's your regression suite.

---

## Key Concepts Learned Today

| Term | Definition |
|---|---|
| Tool description quality | The precision and completeness of the text Claude uses to decide tool selection |
| Disambiguation | Making similar tools clearly distinct in their descriptions |
| Return description | Documenting what the tool returns so Claude knows what to do with it |
| Argument guidance | Descriptions that tell Claude HOW to fill a field, not just its type |
| Tool selection test suite | A set of prompts with expected tool calls to validate description quality |

---

## Hands-On Task 🛠️

Build a tool description quality test.

**Step 1:** Take the three-level tool descriptions above (poor, adequate, production).
Create three separate tool sets, each with the same underlying implementation but different description quality.

**Step 2:** Run these 5 test messages against all three description levels:
1. *"Find photography apps under $5"*
2. *"What does ScreenshotAI do?"*
3. *"Is CleanShot X worth the price?"*
4. *"What's the capital of Bangladesh?"*
5. *"Compare ScreenshotAI and Screenshotter"*

**Step 3:** Record which tool Claude calls for each message at each quality level.

**Step 4:** Calculate a "precision score" — percentage of messages where the correct tool was called.

**Your results table:**

| Message | Poor | Adequate | Production |
|---|---|---|---|
| Photography apps | ? | ? | ? |
| ScreenshotAI details | ? | ? | ? |
| CleanShot worth price | ? | ? | ? |
| Capital of Bangladesh | ? | ? | ? |
| Compare apps | ? | ? | ? |
| **Score** | ?/5 | ?/5 | ?/5 |

> _(write observations here)_

---

## Q&A — Self-Assessment

---

**Q1.** You have two tools: `get_customer_info` and `get_order_history`. A user asks "Has my last order shipped?" Which tool should Claude call? What descriptions would make this unambiguous?

> **Your answer:**
> _(write here)_

---

**Q2.** Your tool description says "Returns customer data." Claude calls the tool, gets `{name, email, plan, created_at, last_login, payment_method, address}`, and then calls `get_payment_details` unnecessarily because it didn't know `payment_method` was already in the first response. How do you fix this?

> **Your answer:**
> _(write here)_

---

**Q3.** You have a tool that takes a `date` parameter. A user says "What happened yesterday?" How should your description tell Claude to handle relative date references?

> **Your answer:**
> _(write here)_

---

**Q4.** You add a 6th tool to a system that previously had 5. After adding it, Claude starts calling the wrong tools for previously-working queries. What might have happened, and how do you diagnose it?

> **Your answer:**
> _(write here)_

---

**Q5 — Architect Scenario.** You're handing your tool set to a team of junior developers who will maintain and extend it over time. Write a one-page "Tool Description Standards Guide" — the rules they must follow when adding new tools.

> **Your answer:**
> _(write here)_

---

## Answer Guide — Claude's Reference Answers

---

**Q1 — Shipping question disambiguation**

A user asking "Has my last order shipped?" needs order tracking information, not general customer info.

```python
{
    "name": "get_customer_info",
    "description": (
        "Look up a customer's account details: name, email, subscription plan, "
        "account status, and contact information. "
        "Use when you need to identify the customer or check their account standing. "
        "Do NOT use for order history, shipping status, or transaction details — "
        "use get_order_history for those."
    )
},
{
    "name": "get_order_history",
    "description": (
        "Retrieve a customer's order history including order status, "
        "shipping tracking numbers, delivery dates, and item details. "
        "Use when the customer asks about orders, shipping, deliveries, "
        "returns, or any transaction history. "
        "Returns: list of orders with order_id, date, status "
        "(pending/shipped/delivered/returned), tracking_number, and items."
    )
}
```

The DO NOT use in `get_customer_info` explicitly directs Claude to `get_order_history` for shipping questions.

---

**Q2 — Unnecessary follow-up tool call**

Fix the return description in `get_customer_info` to be explicit:

```python
"description": (
    "...Returns a complete customer record including: "
    "name, email, subscription plan, created_at, last_login, "
    "payment_method (card type and last 4 digits), and billing_address. "
    "You do NOT need to call any other tool to get payment or address information "
    "— this tool returns all account-level data in one call."
)
```

The explicit list of returned fields plus the "You do NOT need to call any other tool" sentence prevents unnecessary follow-up calls. Claude now knows what it has after the first call.

---

**Q3 — Relative date references**

```python
"date": {
    "type": "string",
    "description": (
        "Date in ISO 8601 format: YYYY-MM-DD. "
        "Convert relative references: "
        "'today' → current date, "
        "'yesterday' → current date minus 1 day, "
        "'last week' → start of previous 7-day period. "
        "Example: if today is 2026-04-30 and user says 'yesterday', use '2026-04-29'."
    )
}
```

Giving Claude explicit conversion rules with an example eliminates ambiguity. Without this, Claude might pass "yesterday" as a string, which your date parser would reject.

---

**Q4 — New tool breaks existing tool selection**

**What likely happened:** The new tool's description overlaps with an existing tool's description. Claude now has two plausible options for queries that previously had one clear choice, and is selecting inconsistently.

**Diagnosis steps:**
1. Run your test suite (from the hands-on task) immediately after adding the new tool
2. Identify which previously-passing tests now fail
3. Read the new tool's description and compare it to the descriptions of the tools that are now being mis-selected
4. Look for overlapping "when to use" language

**Fix:**
- Add disambiguation to both the new tool and the conflicting existing tool
- Add "Do not use for [X] — use [new_tool_name] for that" to the existing tool
- Add "Use this ONLY when [specific condition] — do not use for [existing_tool_use_case]" to the new tool

**Process lesson:** Run your full test suite every time you add or modify a tool. Tool description changes are never isolated — they affect the whole system's selection behaviour.

---

**Q5 — Tool Description Standards Guide**

---

**Tool Description Standards — Team Guide**

**1. Naming**
- Always use `snake_case` with a verb prefix: `get_`, `search_`, `create_`, `update_`, `delete_`, `send_`
- Be specific: `get_customer_subscription` not `get_info`
- No abbreviations

**2. Description — Required Elements**

Every tool description MUST include:
- **WHAT** it does (first sentence)
- **WHEN** to use it (trigger conditions — "Use when the user asks about...")
- **WHAT it returns** (explicit list of returned fields)
- **DO NOT use for** (disambiguation from similar tools)

Template:
```
"[ACTION] [DATA] from [SOURCE]. 
Use when [TRIGGER CONDITIONS]. 
Returns: [FIELD LIST]. 
Do not use for [EXCLUSIONS] — use [OTHER_TOOL] for those."
```

**3. Argument Descriptions**
- Explain HOW to fill the field, not just what type it is
- Include examples: `"E.g. 'Dhaka', 'New York'"`
- Specify format for strings: dates must be ISO 8601, IDs must be UUIDs, etc.
- State defaults and valid ranges for numbers

**4. Testing (Mandatory)**
- Before merging any new tool: run the full test suite (minimum 10 test cases)
- Add 3 new test cases for every new tool: one that SHOULD call it, one that should NOT, one ambiguous
- Test suite must pass at ≥90% before deployment

**5. Maintenance**
- When changing a tool's implementation, update its description immediately
- When adding a new tool, update descriptions of similar existing tools to add disambiguation
- Never remove a tool — deprecate it with "DEPRECATED: Use [new_tool] instead"

**6. Review Process**
- All tool description changes require review from one other team member
- Reviewer must run the test suite independently
- Tool description changes are treated as API changes — they require version bumping

---

## Status

- [ ] Concept read and understood
- [ ] Three-level tool descriptions built
- [ ] 5 test messages run against all 3 levels
- [ ] Precision scores calculated
- [ ] Q1 answered
- [ ] Q2 answered
- [ ] Q3 answered
- [ ] Q4 answered
- [ ] Q5 answered
- [ ] Answer guide reviewed
- [ ] Day 4 started — Handling Tool Results

---

## Coming Up — Week 5, Day 4

**Topic:** Handling Tool Results
Send tool results back correctly. Continue the loop. Understand stop_reason: tool_use vs end_turn. Handle errors in tool results. Build a complete multi-tool agent that runs to completion.

---

*CCA Self-Study Log · Asif · Phase 2 of 5 · Week 5 of 12*
