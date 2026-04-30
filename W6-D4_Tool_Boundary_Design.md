# CCA Self-Study — Week 6, Day 4
## Tool Boundary Design

**Date completed:** _____________
**Study time:** 30–45 mins
**Curriculum phase:** Phase 2 — Building with Claude
**Exam domain:** Domain 2 · Tool Design & MCP Integration

---

## Core Concept

The most common MCP mistake is building tools that do too much. A "fat" tool with 15 parameters and 5 different modes of operation forces Claude to reason about a complex surface area on every call. This leads to wrong arguments, unexpected behaviour, and unreliable agents.

**Tool boundary design** is the discipline of deciding exactly where one tool ends and another begins — giving each tool the smallest surface area that makes it useful.

---

## The Analogy — Unix Philosophy

Unix commands follow one rule: do one thing and do it well.

- `ls` lists files. It doesn't edit them.
- `grep` searches text. It doesn't list files.
- `sort` sorts lines. It doesn't search.
- But `ls | grep | sort` combines them to do complex things.

The power comes from composability — small, focused tools combined in sequences. Claude is the composer. Your tools are the commands.

A single tool that does `ls + grep + sort + edit + delete` is not a tool — it's an application. Applications are hard to reason about. Tools are easy.

---

## The Fat Tool Anti-Pattern

```python
# FAT TOOL — Too many responsibilities
{
    "name": "manage_app",
    "description": "Manage app store data. Can search, get details, post reviews, "
                   "update pricing, check compatibility, and compare apps.",
    "input_schema": {
        "type": "object",
        "properties": {
            "action": {
                "type": "string",
                "enum": ["search", "get_details", "post_review", 
                         "update_price", "check_compatibility", "compare"]
            },
            "query": {"type": "string"},
            "app_name": {"type": "string"},
            "app_name_2": {"type": "string"},
            "new_price": {"type": "number"},
            "review_text": {"type": "string"},
            "review_rating": {"type": "integer"},
            "ios_version": {"type": "string"},
            "device_model": {"type": "string"}
        },
        "required": ["action"]
    }
}
```

**Problems with this:**
1. Claude must learn what `action` values exist and when to use each
2. Required fields change depending on `action` — schema can't enforce this
3. Claude might pass `new_price` when doing a search (wasted tokens)
4. Testing is complex — 6 modes to test vs 6 separate tools
5. If one mode breaks, the entire tool breaks

---

## The Focused Tool Pattern

```python
# FOCUSED TOOLS — Each does exactly one thing
[
    {
        "name": "search_apps",
        "description": "Search app catalog by keyword. Returns matching apps.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string"},
                "limit": {"type": "integer"}
            },
            "required": ["query"]
        }
    },
    {
        "name": "get_app_details",
        "description": "Get full details for one specific app.",
        "input_schema": {
            "type": "object",
            "properties": {
                "app_name": {"type": "string"}
            },
            "required": ["app_name"]
        }
    },
    {
        "name": "post_review",
        "description": "Post a user review for an app. Only call after user confirms they want to post.",
        "input_schema": {
            "type": "object",
            "properties": {
                "app_name": {"type": "string"},
                "rating": {"type": "integer", "description": "1-5"},
                "review_text": {"type": "string"}
            },
            "required": ["app_name", "rating", "review_text"]
        }
    }
    # etc.
]
```

---

## The Boundary Design Framework

When designing tool boundaries, apply these five tests:

### Test 1 — Single Responsibility
Can you describe the tool in one sentence starting with a verb?
```
✅ "Searches the app catalog by keyword"
❌ "Searches apps and can also get details and post reviews"
```

### Test 2 — Minimal Required Parameters
Does every required parameter contribute to the single function?
```
✅ search_apps requires: query — that's it
❌ search_apps requires: query, app_name, action, mode — some only apply in certain modes
```

### Test 3 — Consistent Return Shape
Does the tool always return the same structure regardless of inputs?
```
✅ search_apps always returns: list of {name, rating, price}
❌ manage_app returns different shapes depending on action parameter
```

### Test 4 — Independent Testability
Can you write a unit test for this tool without mocking any other tools?
```
✅ search_apps: mock the catalog, test keyword matching, done
❌ manage_app: must set up 6 different test contexts for 6 modes
```

### Test 5 — Clear Failure Mode
If the tool fails, is the error message specific and actionable?
```
✅ "App 'ScreenshotAI' not found in catalog" — clear, fixable
❌ "Action 'get_details' failed in manage_app" — where exactly?
```

---

## Read vs Write Tool Separation

A critical design principle: **always separate read tools from write tools.**

```python
# READ (safe to call freely, no side effects)
"get_customer_info"     # Just reads
"search_products"       # Just reads
"check_availability"    # Just reads

# WRITE (has consequences, requires confirmation)
"update_customer_email" # Changes data
"process_refund"        # Moves money
"delete_account"        # Irreversible
```

Write tools need explicit guards in their descriptions:

```python
{
    "name": "process_refund",
    "description": (
        "Process a customer refund. "
        "ONLY call this after the user has explicitly confirmed they want a refund. "
        "This action is IRREVERSIBLE and immediately initiates the payment reversal. "
        "Do not call speculatively or for informational queries about refunds."
    )
}
```

Claude respects explicit guardrails in descriptions. Write tools should be harder to call accidentally than read tools.

---

## The Granularity Dial

Too narrow → too many sequential tool calls, slow, high latency
Too broad → reasoning overload, wrong arguments, unreliable

```
Too narrow:
get_app_name()
get_app_developer()
get_app_price()
get_app_rating()
(4 calls to answer "tell me about ScreenshotAI")

Right granularity:
get_app_details()
(1 call, returns all relevant info)

Too broad:
manage_app(action="get_details") 
(1 call but reasoning overload, wrong action selection)
```

**The sweet spot:** One tool call provides everything Claude needs for one logical step in its reasoning. Not every field, not a subset — everything for that step.

---

## Key Concepts Learned Today

| Term | Definition |
|---|---|
| Tool boundary | The line between what one tool does and what another does |
| Fat tool | A tool that does multiple logically distinct things via an action parameter |
| Single responsibility | Each tool does exactly one thing, described in one verb phrase |
| Read/write separation | Read tools have no side effects; write tools do and need explicit guards |
| Granularity dial | The trade-off between too many narrow calls and too few broad calls |
| Minimal surface area | The fewest parameters needed to perform the tool's single function |

---

## Hands-On Task 🛠️

**Refactoring exercise:** You inherit this fat tool. Redesign it as focused tools.

**Fat tool to refactor:**
```python
{
    "name": "user_manager",
    "description": "Manages user accounts. Supports: get profile, update email, "
                   "upgrade plan, cancel subscription, get billing history, send reset email.",
    "input_schema": {
        "type": "object",
        "properties": {
            "action": {"type": "string", "enum": [
                "get_profile", "update_email", "upgrade_plan", 
                "cancel_subscription", "get_billing", "send_reset_email"
            ]},
            "user_id": {"type": "string"},
            "new_email": {"type": "string"},
            "new_plan": {"type": "string", "enum": ["basic", "pro", "enterprise"]},
            "cancellation_reason": {"type": "string"}
        },
        "required": ["action", "user_id"]
    }
}
```

**Your task:**
1. Identify how many focused tools this should become
2. Separate reads from writes
3. Write full tool definitions (name + description + schema) for each
4. Identify which tools need write guards in their descriptions
5. Test: does every tool pass all 5 boundary design tests?

**Your refactored design:**
> _(write here)_

---

## Q&A — Self-Assessment

---

**Q1.** What is "reasoning overload" and how does a fat tool cause it?

> **Your answer:**
> _(write here)_

---

**Q2.** You're debating whether to make `search_apps` return just names/IDs, or full details including description, rating, price, size, and developer. What factors determine the right level of detail to return?

> **Your answer:**
> _(write here)_

---

**Q3.** A user asks: "Cancel my subscription if the price is going up next month." This requires: check billing schedule, check upcoming price changes, confirm with user, then cancel. Should this be one tool or multiple? Design the tool set.

> **Your answer:**
> _(write here)_

---

**Q4.** You separate `get_customer_profile` (read) from `update_customer_email` (write). A developer on your team says "why not combine them? Claude can just call with null for the email if it only wants to read." What's wrong with this reasoning?

> **Your answer:**
> _(write here)_

---

**Q5 — Architect Scenario.** You're building an agent that manages a software deployment pipeline. Tools needed: check deployment status, trigger new deployment, roll back deployment, get deployment logs, notify team on Slack, update deployment config. Apply the boundary design framework and design the complete tool set with read/write separation and appropriate guards.

> **Your answer:**
> _(write here)_

---

## Answer Guide — Claude's Reference Answers

---

**Q1 — Reasoning overload**

Reasoning overload happens when a tool presents Claude with too many choices and too much complexity per call. Claude must simultaneously decide: which action to use, which parameters are relevant for that action, which parameters to omit, and what the return shape will look like.

With a fat tool like `manage_app(action="search", query="screenshot")`, Claude must:
1. Know all 6 action values
2. Know which parameters each action needs
3. Correctly omit irrelevant parameters (e.g. `new_price` when searching)
4. Know what shape the result will take for each action

This multiplies cognitive load. With 6 focused tools, Claude's per-call reasoning is simple: "I need search — call search_apps(query='screenshot')." No action selection, no parameter filtering, no ambiguity.

At scale with 20+ tool calls per session, reasoning overload compounds — Claude makes more mistakes, produces wrong arguments, and takes more iterations to complete tasks.

---

**Q2 — Right level of detail in search results**

The question is: what does Claude need from search results to decide its next step?

**Case for minimal results (name + ID only):**
- If Claude will always call `get_app_details` for the top result, summary data is enough
- Reduces tokens in tool result
- Cleaner: search finds, details retrieves

**Case for rich results (full details):**
- If Claude might be able to answer from search results alone ("What's the cheapest screenshot app?"), rich results eliminate an extra tool call
- For recommendation queries, rating and price are needed to rank — not just names

**The answer: include just enough for the likely next decision:**
```python
# Search results — include fields needed for ranking/selection
{
    "name": "ScreenshotAI",
    "rating": 4.6,
    "price": 0.0,
    "short_description": "AI-powered screenshot organiser"  # 80 chars max
}
# Omit: size, developer, iOS required, last_updated — not needed to choose an app
```

Full details are only needed when the user wants to know specifics about a particular app. Keep search results to the minimum needed to make the selection decision.

---

**Q3 — Multi-step cancellation flow**

This should be multiple tools — never a single "cancel if condition" tool.

```python
tools = [
    {
        "name": "get_billing_schedule",
        "description": "Get upcoming billing events including price changes, "
                       "renewal dates, and scheduled rate adjustments.",
        # READ — safe to call
    },
    {
        "name": "check_price_changes",
        "description": "Check if there are any upcoming price changes for the user's plan. "
                       "Returns: has_price_change (boolean), new_price, effective_date.",
        # READ — safe to call
    },
    {
        "name": "cancel_subscription",
        "description": "Cancel the user's subscription. "
                       "ONLY call after: (1) confirming a price change exists, "
                       "AND (2) the user has explicitly confirmed they want to cancel. "
                       "This action takes effect immediately and is irreversible without admin intervention.",
        # WRITE — strong guard
    }
]
```

The agent flow:
1. Call `get_billing_schedule` → confirms billing date
2. Call `check_price_changes` → confirms price going up
3. Tell user: "Your price is going up on [date]. Do you want me to cancel?"
4. User confirms → call `cancel_subscription`
5. User declines → no action

Never automate the confirmation step. The user must explicitly confirm before any write tool is called for destructive actions.

---

**Q4 — Why not combine read and write**

The developer's suggestion ("pass null for email if just reading") is wrong for several reasons:

**1. Ambiguity:** What does `null` mean? "No change," "delete the email," or "I only want to read"? Three different interpretations, one tool call.

**2. Accidental writes:** Claude might accidentally pass a non-null email when it only intended to read. Now you've changed the user's email unintentionally. With separate tools, the only way to call `update_customer_email` is deliberately — there's no way to accidentally do it while reading.

**3. Schema enforcement:** Your input schema can enforce that read-only calls don't need write parameters. Combined tools can't enforce this.

**4. Audit trail:** In your logs, `update_customer_email` is explicit — you know a write happened. With a combined tool, you must inspect every call's arguments to determine if it was a read or write.

**5. Permission model:** You might want different access levels. A read-only API key can call `get_customer_profile` but not `update_customer_email`. With a combined tool, you can't distinguish.

The rule: if a function can change state, it must be separate from one that doesn't.

---

**Q5 — Deployment pipeline tool set**

```python
# READ TOOLS (safe, no side effects)
tools = [
    {
        "name": "get_deployment_status",
        "description": "Get current deployment status for a service or environment. "
                       "Returns: version, health, uptime, last_deploy_time, instance_count."
    },
    {
        "name": "get_deployment_logs",
        "description": "Retrieve recent deployment logs. Use when diagnosing issues "
                       "or reviewing what changed in a recent deploy. "
                       "Returns: log lines with timestamps and severity."
    },
    {
        "name": "get_deployment_config",
        "description": "Read the current deployment configuration for a service. "
                       "Returns: environment variables (names only, not values), "
                       "resource limits, scaling rules."
    },
    
    # WRITE TOOLS (consequence, require guards)
    {
        "name": "trigger_deployment",
        "description": "Trigger a new deployment for a service. "
                       "ONLY call after the user has specified the target version "
                       "AND explicitly confirmed they want to deploy. "
                       "This is irreversible — a running deployment cannot be stopped mid-deploy. "
                       "Returns: deployment_id and estimated completion time."
    },
    {
        "name": "rollback_deployment",
        "description": "Roll back a service to the previous stable version. "
                       "ONLY call in response to explicit user instruction to rollback. "
                       "Do not call speculatively based on log analysis alone — "
                       "always confirm with the user first. "
                       "This causes a brief service interruption."
    },
    {
        "name": "notify_team",
        "description": "Send a notification to the team's Slack channel. "
                       "Use to report deployment status, incidents, or completions. "
                       "Keep messages factual and concise. "
                       "Do not send more than one notification per incident unless explicitly asked."
    },
    {
        "name": "update_deployment_config",
        "description": "Update deployment configuration values. "
                       "ONLY call after user provides specific key-value pairs to update "
                       "AND confirms the change. "
                       "Changes take effect on the NEXT deployment, not immediately."
    }
]
```

Note: `notify_team` is technically a write tool (sends a message) but treated with lighter guards since a spurious Slack message is low-stakes compared to an accidental rollback. Calibrate guard strength to consequence severity.

---

## Status

- [ ] Concept read and understood
- [ ] Fat tool refactoring exercise completed
- [ ] All 5 boundary design tests applied
- [ ] Q1 answered
- [ ] Q2 answered
- [ ] Q3 answered
- [ ] Q4 answered
- [ ] Q5 answered
- [ ] Answer guide reviewed
- [ ] Day 5 started — MCP in Production

---

## Coming Up — Week 6, Day 5

**Topic:** MCP in Production
Authentication, error handling, timeouts, and what happens when an MCP server fails mid-agent-loop. Building resilient MCP integrations for production Claude deployments.

---

*CCA Self-Study Log · Asif · Phase 2 of 5 · Week 6 of 12*
