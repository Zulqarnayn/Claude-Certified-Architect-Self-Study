# CCA Self-Study — Week 5, Day 4
## Handling Tool Results

**Date completed:** _____________
**Study time:** 30–45 mins
**Curriculum phase:** Phase 2 — Building with Claude
**Exam domain:** Domain 2 · Tool Design & MCP Integration

---

## Core Concept

Tool use is a loop, not a single call. Claude requests a tool. You execute it. You return the result. Claude decides what to do next — use another tool, ask a follow-up, or give a final answer. Handling this loop correctly is the core of agentic programming.

Today you master the complete loop: sending results, handling errors in results, supporting parallel tool calls, and knowing when the loop should end.

---

## The Analogy — A Research Assistant

You ask your research assistant: "Find the best iPhone camera apps under $10 with ratings above 4.5."

The assistant says: "I'll need to search the App Store, then check pricing, then verify ratings."

They come back with a list, but one of the apps returns a pricing error. A good assistant says: "I couldn't verify pricing for CameraApp X — it may have been removed. Here are the others."

A bad assistant crashes or silently skips it.

Your tool result handling is the difference between a good and bad assistant.

---

## The Complete Loop Structure

```python
import anthropic
import json

client = anthropic.Anthropic()

def run_agent_loop(
    system: str,
    user_message: str,
    tools: list,
    tool_executor: callable,
    max_iterations: int = 10
) -> str:
    
    messages = [{"role": "user", "content": user_message}]
    iteration = 0
    
    while iteration < max_iterations:
        iteration += 1
        
        # Call Claude
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=2048,
            system=system,
            tools=tools,
            messages=messages
        )
        
        # Handle stop reasons
        if response.stop_reason == "end_turn":
            # Extract final text response
            text_blocks = [b for b in response.content if b.type == "text"]
            if text_blocks:
                return text_blocks[0].text
            return "Task complete."
        
        elif response.stop_reason == "tool_use":
            # Add Claude's response to history
            messages.append({"role": "assistant", "content": response.content})
            
            # Find all tool_use blocks (Claude can request multiple at once)
            tool_use_blocks = [b for b in response.content if b.type == "tool_use"]
            
            # Execute all requested tools and collect results
            tool_results = []
            for tool_use in tool_use_blocks:
                result = tool_executor(tool_use.name, tool_use.input)
                tool_results.append(build_tool_result(tool_use.id, result))
            
            # Send all results back in one message
            messages.append({"role": "user", "content": tool_results})
        
        elif response.stop_reason == "max_tokens":
            # Response was cut off — this is a configuration error
            raise Exception("Response truncated. Increase max_tokens.")
        
        else:
            raise Exception(f"Unexpected stop_reason: {response.stop_reason}")
    
    raise Exception(f"Agent loop exceeded max_iterations ({max_iterations})")
```

---

## Building Tool Result Objects

The tool result must be formatted correctly for the API:

```python
def build_tool_result(tool_use_id: str, result: any) -> dict:
    """Build a correctly formatted tool result for the messages array."""
    
    if isinstance(result, dict) and "error" in result:
        # Error result — signal failure to Claude
        return {
            "type": "tool_result",
            "tool_use_id": tool_use_id,
            "content": json.dumps(result),
            "is_error": True  # Optional but helpful signal
        }
    else:
        # Success result
        return {
            "type": "tool_result",
            "tool_use_id": tool_use_id,
            "content": json.dumps(result) if not isinstance(result, str) else result
        }
```

**Key rules:**
1. `tool_use_id` must match the ID from Claude's tool_use block exactly
2. `content` must be a string (JSON-encode dicts/lists)
3. Each tool call gets its own result object
4. All results for one Claude response go in one `user` message

---

## Handling Parallel Tool Calls

Claude can request multiple tools in a single response. You must handle all of them:

```python
# Claude's response content might look like:
[
    {"type": "text", "text": "Let me check both apps for you..."},
    {"type": "tool_use", "id": "tu_1", "name": "get_app_details", 
     "input": {"app_name": "ScreenshotAI"}},
    {"type": "tool_use", "id": "tu_2", "name": "get_app_details",
     "input": {"app_name": "Screenshotter"}}
]

# You must return results for BOTH tool calls:
tool_results = [
    {
        "type": "tool_result",
        "tool_use_id": "tu_1",
        "content": json.dumps({"name": "ScreenshotAI", "rating": 4.6})
    },
    {
        "type": "tool_result",
        "tool_use_id": "tu_2",
        "content": json.dumps({"name": "Screenshotter", "rating": 3.8})
    }
]

messages.append({"role": "user", "content": tool_results})
```

**Critical:** If Claude requests 3 tools and you only return 2 results, the API will return an error. Always process every tool_use block.

---

## Parallel Execution for Speed

When Claude requests multiple tools, you can execute them in parallel:

```python
import concurrent.futures

def execute_tools_parallel(tool_use_blocks: list, executor: callable) -> list:
    """Execute multiple tool calls in parallel for speed."""
    
    with concurrent.futures.ThreadPoolExecutor() as pool:
        futures = {
            pool.submit(executor, tb.name, tb.input): tb.id
            for tb in tool_use_blocks
        }
        
        results = []
        for future in concurrent.futures.as_completed(futures):
            tool_use_id = futures[future]
            try:
                result = future.result(timeout=30)
                results.append(build_tool_result(tool_use_id, result))
            except Exception as e:
                results.append(build_tool_result(
                    tool_use_id, 
                    {"error": str(e), "tool_use_id": tool_use_id}
                ))
    
    return results
```

Sequential: 3 tools × 500ms each = 1,500ms
Parallel: 3 tools × 500ms max = 500ms

For user-facing systems where latency matters, parallel execution is essential.

---

## What Claude Does With Tool Errors

When you return an error result, Claude typically:

1. Acknowledges the failure to the user
2. Tries an alternative approach if possible
3. Asks the user for clarification if needed
4. Gives a partial answer with a note about what failed

This is automatic — Claude reads your error and reasons about it. Your job is to return useful error information, not handle all recovery yourself.

```python
# Good error result
{"error": "app_not_found", "message": "No app named 'ScreenshotPro' found in catalog. Did you mean 'ScreenshotAI'?"}

# Claude reads this and responds: "I couldn't find 'ScreenshotPro' — 
# did you mean ScreenshotAI? I found that one and can tell you about it."

# Bad error result
{"error": True}  # Claude has no useful information to work with
```

---

## Preventing Infinite Loops

An agent can get stuck calling tools repeatedly without making progress. Protect against this:

```python
def run_safe_agent_loop(system, user_message, tools, executor):
    
    MAX_ITERATIONS = 10
    MAX_TOOL_CALLS = 20  # Total tool calls across all iterations
    
    total_tool_calls = 0
    messages = [{"role": "user", "content": user_message}]
    
    for iteration in range(MAX_ITERATIONS):
        response = client.messages.create(...)
        
        if response.stop_reason == "end_turn":
            return extract_text(response)
        
        if response.stop_reason == "tool_use":
            tool_uses = [b for b in response.content if b.type == "tool_use"]
            total_tool_calls += len(tool_uses)
            
            if total_tool_calls > MAX_TOOL_CALLS:
                # Force stop — something is wrong
                raise Exception(f"Agent exceeded max tool calls ({MAX_TOOL_CALLS})")
            
            # Execute and continue...
    
    raise Exception("Max iterations reached")
```

---

## Key Concepts Learned Today

| Term | Definition |
|---|---|
| Tool result object | Correctly formatted dict with tool_use_id and content |
| Parallel tool calls | Claude requesting multiple tools in one response |
| Parallel execution | Running multiple tool calls simultaneously for speed |
| is_error flag | Signal to Claude that the tool result is an error |
| Infinite loop prevention | Max iteration and max tool call limits |

---

## Hands-On Task 🛠️

Build a complete multi-tool agent with error handling.

**Scenario:** App Store research agent with 3 tools:
- `search_apps` — find apps by query
- `get_app_details` — get details for a specific app
- `get_app_reviews` — get reviews for a specific app

**Requirements:**
1. Implement the complete loop with all stop_reason cases
2. Test parallel tool calls: "Compare ScreenshotAI and Screenshotter"
3. Introduce a deliberate error in `get_app_reviews` (return error dict) and confirm Claude handles it gracefully
4. Add max_iterations guard (10 iterations)
5. Log every tool call: name, input, result summary, duration

**Your implementation and test results:**
> _(write here)_

---

## Q&A — Self-Assessment

---

**Q1.** Claude requests 3 tool calls. Tool 1 succeeds, Tool 2 times out, Tool 3 succeeds. What do you put in the tool results for Tool 2, and what do you expect Claude to do with this information?

> **Your answer:**
> _(write here)_

---

**Q2.** Your agent loop runs 8 iterations. In iteration 8, Claude still requests a tool call — it hasn't reached `end_turn`. Your `max_iterations` is 10. What is likely happening, and should you increase max_iterations?

> **Your answer:**
> _(write here)_

---

**Q3.** Claude requests `get_product_details` with `product_id: "ABC123"`. Your database doesn't have this product. You have two options: return `{"result": null}` or return `{"error": "product_not_found", "message": "No product with ID ABC123"}`. Which is better and why?

> **Your answer:**
> _(write here)_

---

**Q4.** You're building a user-facing agent. A tool call takes 8 seconds. The user is staring at a blank screen. How do you improve the UX without reducing the tool's execution time?

> **Your answer:**
> _(write here)_

---

**Q5 — Architect Scenario.** Your agent loop has been in production for 2 weeks. You notice that 0.3% of sessions hit the `max_iterations` limit. These sessions all involve the same user intent: "Look up X, then find related products, then check if any are on sale." Why might this consistently hit the limit, and how do you redesign the agent to handle it within 3–4 iterations?

> **Your answer:**
> _(write here)_

---

## Answer Guide — Claude's Reference Answers

---

**Q1 — One tool times out**

Return an error result for Tool 2:

```python
tool_results = [
    build_tool_result("tu_1", {"data": "success_data_1"}),  # Success
    build_tool_result("tu_2", {                              # Timeout
        "error": "timeout",
        "message": "Request timed out after 30 seconds. This data is temporarily unavailable."
    }),
    build_tool_result("tu_3", {"data": "success_data_3"}),  # Success
]
```

**What Claude does:** Reads all three results. Uses the successful ones. Acknowledges the timeout: "I was able to get information on items 1 and 3, but the data for item 2 is temporarily unavailable. Here's what I found..."

Claude doesn't crash or hang — it works with what it has and transparently communicates the gap.

---

**Q2 — Still calling tools in iteration 8**

**What's likely happening:** The agent is in a legitimate deep research loop that genuinely needs many steps — look up A, which requires B, which requires C, etc. OR the agent is stuck in a loop calling the same tool repeatedly because the results don't satisfy its goal.

**How to distinguish:**
- Log every tool call with its name and input
- If you see the same tool called with the same input multiple times → stuck loop
- If you see different tools called with different inputs → legitimate multi-step task

**Should you increase max_iterations?**
- If it's a stuck loop: No. Fix the root cause (tool description, prompt, or tool implementation)
- If it's a legitimate deep task: Maybe — but first ask whether the task can be redesigned to require fewer steps

A better pattern for consistently deep tasks: break the task into sub-tasks and call a coordinator agent that spawns specialist subagents (Week 8). Each subagent has its own iteration budget.

---

**Q3 — null vs error result**

**Error result is better.**

`{"result": null}` is ambiguous — Claude doesn't know if null means "not found," "this field doesn't apply," "API returned empty," or "error occurred." It might interpret null as "this product exists but has no details" and try a different tool or make up information.

`{"error": "product_not_found", "message": "No product with ID ABC123"}` is unambiguous. Claude knows the product doesn't exist and can tell the user definitively. It won't waste a tool call trying another approach.

**General rule:** Distinguish "empty result" (empty list, null field) from "error" (something went wrong). Use explicit error objects for the latter.

---

**Q4 — 8-second tool call UX**

Three approaches:

**1. Streaming with status updates:**
While the tool executes, stream status text to the user:
```
"Searching the App Store for matching products..."  ← Appears immediately
[8 seconds pass]
"Found 12 results. Here's what I recommend..."      ← Appears when tool returns
```

**2. Optimistic UI:**
Show a skeleton/placeholder UI immediately. Fill in real data when the tool returns. Common in web apps — shows the structure while data loads.

**3. Background processing:**
For non-time-sensitive tasks, queue the tool call and notify when complete:
"I'm researching that for you — I'll notify you when it's ready (usually 30-60 seconds)."

**4. Parallel execution (if multiple tools):**
If the 8-second tool runs in parallel with other tools, the user doesn't notice the 8-second wait because other results are arriving. Parallelize whenever possible.

---

**Q5 — Consistently hitting max_iterations**

**Why it's hitting the limit:** The 3-step intent (look up X → related products → sale check) is being executed sequentially — 3 tool calls minimum, but each step might require 2-3 tool calls (search, then verify, then check). 3 steps × 2-3 calls each = 6-9 calls, close to your limit.

**Redesign options:**

**Option 1 — Batch tool:**
Create a tool `research_product_full` that does all three steps internally and returns a combined result. One tool call instead of 6-9.

```python
def research_product_full(product_name: str) -> dict:
    details = get_product_details(product_name)
    related = get_related_products(details["category"])
    sales = check_sale_status([p["id"] for p in related])
    return {"product": details, "related": related, "sales": sales}
```

**Option 2 — Smarter tool design:**
Make `get_product_details` optionally return related products and sale status:
```python
def get_product_details(name: str, include_related: bool = False, check_sales: bool = False)
```

**Option 3 — Parallel tool execution:**
Steps 2 and 3 (related + sale check) can run in parallel after step 1. 3 sequential steps becomes 2 parallel phases = 2-3 total iterations instead of 6-9.

The right answer depends on how often this intent occurs. If it's 30% of all sessions, build the batch tool. If it's 3%, adjust max_iterations to 15 and monitor.

---

## Status

- [ ] Concept read and understood
- [ ] Complete agent loop implemented
- [ ] Parallel tool calls tested
- [ ] Error handling tested (tool returns error dict)
- [ ] Max iterations guard added
- [ ] Tool call logging implemented
- [ ] Q1 answered
- [ ] Q2 answered
- [ ] Q3 answered
- [ ] Q4 answered
- [ ] Q5 answered
- [ ] Answer guide reviewed
- [ ] Day 5 started — Multi-Tool Conversations

---

## Coming Up — Week 5, Day 5

**Topic:** Multi-Tool Conversations
Give Claude 5+ tools and watch how it reasons about which to use and when. Understand tool selection patterns. Learn when Claude uses multiple tools sequentially vs in parallel vs not at all.

---

*CCA Self-Study Log · Asif · Phase 2 of 5 · Week 5 of 12*
