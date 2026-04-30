# CCA Self-Study — Week 5, Day 5
## Multi-Tool Conversations

**Date completed:** _____________
**Study time:** 30–45 mins
**Curriculum phase:** Phase 2 — Building with Claude
**Exam domain:** Domain 2 · Tool Design & MCP Integration

---

## Core Concept

Single-tool systems are a stepping stone. Real production agents have 5, 10, or 20+ tools — and Claude must reason about which tools to use, in what order, and whether some queries need no tools at all. Today you study how Claude reasons across a rich tool set and how to design that tool set for optimal selection behaviour.

---

## The Analogy — A Swiss Army Knife

A Swiss Army knife has many tools — blade, scissors, screwdriver, bottle opener, saw. The value isn't having the most tools. The value is knowing which tool to reach for in each situation — and not using the screwdriver when the scissors are right.

Your agent's tool set is the Swiss Army knife. Tool description quality is the labelling that tells Claude which blade to reach for. The agent loop is the hand that uses the chosen tool.

---

## Tool Selection Patterns Claude Uses

### Pattern 1 — Direct Answer (No Tool)
Claude has enough information from training/context. Best choice: answer directly.

```
User: "What is Swift's async/await pattern?"
→ Claude answers from training knowledge. No tool needed.
```

### Pattern 2 — Single Tool
One tool provides everything needed.

```
User: "What's the rating of ScreenshotAI?"
→ Claude calls get_app_details("ScreenshotAI")
→ Returns rating in result
→ Claude answers
```

### Pattern 3 — Sequential Tools
Output of Tool A determines input to Tool B.

```
User: "Find me the best app for organising screenshots and tell me its reviews"
→ Step 1: search_apps("screenshot organiser") → ["ScreenshotAI", "Screenshotter"]
→ Step 2: get_app_reviews("ScreenshotAI")  ← uses result from step 1
→ Claude answers with combined information
```

### Pattern 4 — Parallel Tools
Multiple independent pieces of information needed simultaneously.

```
User: "Compare ScreenshotAI and Screenshotter"
→ Claude calls BOTH get_app_details in parallel:
  - get_app_details("ScreenshotAI")
  - get_app_details("Screenshotter")
→ Both results arrive → Claude compares
```

### Pattern 5 — Conditional Tool Use
Claude calls Tool A, evaluates result, decides whether Tool B is needed.

```
User: "Tell me about the most popular screenshot app"
→ search_apps("screenshot") → top result is "ScreenshotAI"
→ Claude evaluates: do I have enough info? No.
→ get_app_details("ScreenshotAI") → full details
→ Claude evaluates: do I have enough info? Yes.
→ Claude answers (skips reviews tool since user didn't ask)
```

---

## Building a Rich Tool Set — Full Example

```python
TOOLS = [
    {
        "name": "search_apps",
        "description": (
            "Search the App Store catalog by keyword or use case. "
            "Use as the FIRST step when the user asks for app recommendations "
            "or mentions an app type without a specific name. "
            "Returns: list of app names, IDs, and short descriptions. "
            "Do not use if you already have a specific app name — use get_app_details."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Search term or use case"},
                "limit": {"type": "integer", "description": "Max results (1-10, default 5)"}
            },
            "required": ["query"]
        }
    },
    {
        "name": "get_app_details",
        "description": (
            "Get full details for a specific app by name. "
            "Use when the user mentions a specific app name or after search_apps "
            "returns an app ID. "
            "Returns: name, developer, price, rating, size, last_updated, "
            "ios_version_required, description, and screenshot_count. "
            "Do not use to search for apps — use search_apps first if you need to find one."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "app_name": {"type": "string", "description": "Exact app name as listed on App Store"}
            },
            "required": ["app_name"]
        }
    },
    {
        "name": "get_app_reviews",
        "description": (
            "Get recent user reviews for a specific app. "
            "Use when the user asks about user opinions, complaints, praise, "
            "or wants to know if an app is reliable. "
            "Returns: average_rating, review_count, recent_reviews (last 5), "
            "common_complaints, and common_praise. "
            "Only call this if the user specifically asks about reviews or user feedback."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "app_name": {"type": "string", "description": "App name"},
                "sort_by": {
                    "type": "string",
                    "enum": ["recent", "helpful", "critical"],
                    "description": "Sort order for reviews. Default: recent"
                }
            },
            "required": ["app_name"]
        }
    },
    {
        "name": "get_price_history",
        "description": (
            "Get the historical pricing data for an app, including sale events. "
            "Use when the user asks if an app has ever been on sale, "
            "wants to know if now is a good time to buy, "
            "or asks about price changes. "
            "Returns: current_price, historical_prices (last 12 months), "
            "lowest_ever_price, and sale_frequency."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "app_name": {"type": "string", "description": "App name"}
            },
            "required": ["app_name"]
        }
    },
    {
        "name": "check_compatibility",
        "description": (
            "Check whether a specific app is compatible with a given device or iOS version. "
            "Use when the user mentions their device model or iOS version "
            "and wants to know if an app will work. "
            "Returns: is_compatible (boolean), minimum_ios_required, "
            "supported_devices, and any known issues with the specified configuration."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "app_name": {"type": "string", "description": "App name"},
                "ios_version": {"type": "string", "description": "iOS version e.g. '17.4'"},
                "device_model": {"type": "string", "description": "Device model e.g. 'iPhone 13 Pro'"}
            },
            "required": ["app_name"]
        }
    }
]
```

---

## Observing Tool Selection Behaviour

Run these 8 prompts and observe which tools Claude calls:

```python
test_prompts = [
    "What's a good app for organising screenshots?",           # search → details
    "Tell me about ScreenshotAI",                              # details only
    "What do users think of CleanShot X?",                    # details + reviews
    "Has Darkroom ever been on sale?",                         # price_history
    "Compare ScreenshotAI and Screenshotter",                  # parallel details
    "Will ScreenshotAI work on my iPhone 13 with iOS 16?",    # details + compatibility
    "What is the SwiftUI @StateObject property wrapper?",      # NO TOOL (training knowledge)
    "Find me the best paid photo editor with good reviews under $15", # search → details → reviews → price
]
```

---

## The Over-Calling Problem

A common issue: Claude calls tools it doesn't need, inflating cost and latency.

**Cause:** Tool descriptions that say "use when..." but don't clearly say "do not use when..."

**Fix:** Add explicit "Only call this if..." language:

```python
# Without exclusion — Claude may call reviews for every app question
"description": "Get user reviews for an app."

# With exclusion — Claude only calls when explicitly needed
"description": "Get user reviews for an app. "
               "Only call this if the user specifically asks about "
               "reviews, user feedback, complaints, or opinions. "
               "Do not call for general app information questions."
```

Track your tool call rate per query type in production. If `get_reviews` is called for 80% of queries but users only ask about reviews 30% of the time — your description needs exclusion language.

---

## Key Concepts Learned Today

| Term | Definition |
|---|---|
| Tool selection patterns | Direct / single / sequential / parallel / conditional |
| Over-calling | Claude calling tools unnecessarily, inflating cost |
| Tool call rate | Percentage of queries that trigger a specific tool |
| Sequential dependency | Tool B needs output from Tool A |
| Parallel independence | Tools A and B can run simultaneously (no dependency) |

---

## Hands-On Task 🛠️

Build the 5-tool App Store research system above.

**Task 1:** Implement mock functions for all 5 tools.

**Task 2:** Run all 8 test prompts. Record which tools were called for each.

**Task 3:** Find one case where Claude over-calls (calls a tool it didn't need). Fix the description and re-run.

**Task 4:** Measure latency improvement from parallel execution on the comparison prompt.

**Task 5:** Add a 6th tool: `get_developer_other_apps`. Observe whether adding it breaks any existing tool selection. Fix any issues.

**Your results:**
> _(write here)_

---

## Q&A — Self-Assessment

---

**Q1.** A user asks: "Is ScreenshotAI worth buying? I'm on an iPhone 15 with iOS 17." List the tools Claude should call, in what order, and whether any can run in parallel.

> **Your answer:**
> _(write here)_

---

**Q2.** You give Claude 15 tools. Response latency increases significantly even for simple queries. What is likely happening and how do you fix it?

> **Your answer:**
> _(write here)_

---

**Q3.** Claude calls `search_apps` and gets back 10 results. Then it calls `get_app_details` for all 10 results. The user asked "What's a good screenshot app?" — they only needed 1-2 recommendations. What caused this and how do you prevent it?

> **Your answer:**
> _(write here)_

---

**Q4.** You want Claude to always call `get_app_details` before `get_app_reviews` (you need the app ID from details to call reviews). How do you enforce this ordering through descriptions rather than code?

> **Your answer:**
> _(write here)_

---

**Q5 — Architect Scenario.** Your 5-tool agent costs $0.08 per session on average. Analysis shows: `search_apps` is called in 90% of sessions, `get_app_details` in 80%, `get_reviews` in 70%, `get_price_history` in 60%, `check_compatibility` in 10%. Users only ask about compatibility in 15% of sessions. Identify the cost problem and redesign the tool set to reduce cost by 30%.

> **Your answer:**
> _(write here)_

---

## Answer Guide — Claude's Reference Answers

---

**Q1 — Tool sequence for "Is ScreenshotAI worth buying?"**

The user wants a purchase recommendation with device context. Claude needs:
1. App details (price, rating, features)
2. User reviews (is it reliable?)
3. Compatibility check (will it work on their device?)
4. Price history (is now a good time to buy?)

**Execution plan:**
```
Step 1: get_app_details("ScreenshotAI")     ← Must be first (get baseline info)
Step 2 (parallel):
  - get_app_reviews("ScreenshotAI")         ← Independent of step 1 result
  - get_price_history("ScreenshotAI")       ← Independent of step 1 result
  - check_compatibility("ScreenshotAI",     ← Uses iOS/device from user message,
      ios_version="17.0",                       not from step 1
      device_model="iPhone 15")
Step 3: Claude synthesises all results and gives recommendation
```

Steps 2a, 2b, 2c are all independent of each other — can run in parallel.
Total: 2 iterations instead of 5 sequential.

---

**Q2 — 15 tools causing latency**

**What's happening:** Claude reads and reasons about all 15 tool descriptions before deciding which to call. More tools = more tokens in context = slower first response.

Additionally, with many tools, Claude's tool selection reasoning is more complex — it's comparing 15 options instead of 5.

**Fixes:**

1. **Tool grouping/filtering:** Only pass the tools relevant to the current context. A customer support query doesn't need developer tools. Filter the tools list before each call.

```python
def get_relevant_tools(query_type: str) -> list:
    if query_type == "app_research":
        return [search_apps, get_details, get_reviews]
    elif query_type == "developer":
        return [get_sdk_docs, check_api_limits]
    return ALL_TOOLS  # Fallback
```

2. **Tool consolidation:** Review whether 15 tools could be 8 well-designed tools without losing capability.

3. **Hierarchical tool design:** One meta-tool that routes to sub-tools internally, rather than exposing all sub-tools to Claude.

---

**Q3 — Claude calls details for all 10 search results**

**Cause:** The `search_apps` description returns 10 results, and `get_app_details` description doesn't say "use for one app, not all results." Claude reasonably interprets "get details for each result" as the right next step.

**Fix 1 — Search tool description:**
```
"Returns top matching apps. For recommendations, typically the top 1-3 results 
are sufficient — you don't need to get details for all results."
```

**Fix 2 — Limit search results:**
```python
"limit": {
    "description": "Max results (1-10, default 3). For recommendations, 3 is usually enough."
}
```

**Fix 3 — System prompt instruction:**
```
"When making recommendations, evaluate the top 2-3 search results — 
do not retrieve details for every search result."
```

**Fix 4 — Code-side limit:**
Your tool implementation can limit results regardless of what Claude requests: `return results[:3]` — overriding Claude's intent with a cost-saving constraint.

---

**Q4 — Enforce tool ordering through descriptions**

```python
{
    "name": "get_app_details",
    "description": (
        "Get full details for a specific app including its unique app_id. "
        "CALL THIS BEFORE get_app_reviews — the app_id returned here is "
        "required as input to get_app_reviews."
    )
},
{
    "name": "get_app_reviews",
    "description": (
        "Get user reviews for an app. "
        "REQUIRES: app_id from get_app_details. "
        "Do not call this without first calling get_app_details to obtain the app_id. "
        "Input: app_id (string, from get_app_details result)"
    )
}
```

By making `app_id` a required parameter of `get_app_reviews` (not `app_name`), you structurally enforce the ordering — Claude physically cannot call `get_app_reviews` without having the `app_id` that only `get_app_details` returns.

This is better than description-only enforcement — it's structural.

---

**Q5 — Reduce agent cost by 30%**

**The problem:** `get_reviews` is called in 70% of sessions but users ask about reviews in only ~30% of sessions. It's being over-called by 40 percentage points. `get_price_history` similar — 60% call rate vs ~25% user need.

**Redesign:**

1. **Fix `get_reviews` description** — add strong exclusion:
"ONLY call this when the user explicitly mentions reviews, user opinions, ratings quality, or asks if an app is reliable. Do not call for general recommendation questions."
Expected result: call rate drops from 70% → ~30%. Saves 40% of review tool costs.

2. **Fix `get_price_history` description** — add exclusion:
"ONLY call when user asks about sale history, whether to buy now, or price trends. Do not call for general 'is it worth it' questions."
Expected result: call rate drops from 60% → ~25%.

3. **Make `search_apps` return more data** — include rating and price in search results so Claude doesn't need `get_app_details` for simple recommendations.

**Estimated impact:**
- Reviews: 40% fewer calls × 15% of total cost = 6% total reduction
- Price history: 35% fewer calls × 10% of total cost = 3.5% total reduction
- Search enrichment: 20% fewer details calls × 20% of total cost = 4% reduction
- **Total: ~13.5% cost reduction** — to hit 30%, you'd also need model routing (use Haiku for simple queries, Sonnet for complex).

---

## Week 5 Complete — What You Now Know

| Day | Concept | Production skill |
|---|---|---|
| D1 | What is tool use | The request-response loop, Claude as actor |
| D2 | Defining tools | Names, descriptions, schemas |
| D3 | Description quality | The interface that determines selection |
| D4 | Handling results | Complete loop, parallel calls, error results |
| D5 | Multi-tool systems | Selection patterns, over-calling, cost optimisation |

---

## Status

- [ ] 5-tool system built
- [ ] All 8 test prompts run and recorded
- [ ] Over-calling case found and fixed
- [ ] Parallel latency measured
- [ ] 6th tool added without breaking existing selection
- [ ] Q1 answered
- [ ] Q2 answered
- [ ] Q3 answered
- [ ] Q4 answered
- [ ] Q5 answered
- [ ] Answer guide reviewed
- [ ] Week 5 complete 🎉

---

## Coming Up — Week 6, Day 1

**Topic:** What Is MCP and Why It Exists
The Model Context Protocol is the standard for connecting Claude to external systems at scale. Think USB-C — one protocol, every device. Why Anthropic built MCP and how it changes tool architecture.

---

*CCA Self-Study Log · Asif · Phase 2 of 5 · Week 5 of 12*
