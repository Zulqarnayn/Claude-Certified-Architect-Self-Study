---
layout: default
title: CCA Self-Study — Week 7, Day 1
---

# CCA Self-Study — Week 7, Day 1
## What Is an Agentic Loop?

**Date completed:** _____________
**Study time:** 45–60 mins (extended — this is exam core)
**Curriculum phase:** Phase 3 — Agentic Architecture
**Exam domain:** Domain 1 · Agentic Architecture & Orchestration (27% of exam)

---

## ⚠️ Why This Week Matters

Domain 1 is 27% of the CCA exam — the single largest domain. Every question in this domain puts you inside a production failure scenario and asks what went wrong architecturally. The failures are almost always:
1. A loop that never ends
2. A loop that ends too early
3. A loop where Claude makes decisions based on incomplete context
4. A loop where errors aren't handled so the whole thing crashes

This week you learn to design agentic loops that are robust, predictable, and production-ready.

---

## Core Concept

An **agentic loop** is the pattern where Claude repeatedly:
1. Decides what to do
2. Takes an action (tool call)
3. Observes the result
4. Decides the next step

This continues until Claude determines the task is complete. The loop is the fundamental unit of agent execution — everything from a simple research assistant to a complex multi-agent pipeline is built from this loop.

---

## The Analogy — A Detective Investigating a Case

A detective doesn't solve a case in one step. They:

1. **Assess** — what do I know? What do I need to find out?
2. **Act** — interview a witness, examine evidence, pull records
3. **Observe** — what did I learn? Does it change my theory?
4. **Decide** — is the case solved? Do I need another step?
5. **Repeat** — until the case is closed or stuck

Claude in an agentic loop is the detective. Your tools are the investigative methods. The loop is the investigation. The `end_turn` signal is the case being closed.

The detective doesn't know upfront how many steps it will take. Neither does your agent. That's what makes loops different from simple API calls.

---

## The Three-Phase Loop Model

Every agentic loop follows this pattern, regardless of complexity:

```
┌─────────────────────────────────────────────────────────┐
│                    PLAN PHASE                           │
│  Claude receives the task. Thinks about what it needs.  │
│  Decides the first action to take.                      │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    ACT PHASE                            │
│  Claude calls a tool (or multiple tools).               │
│  YOU execute the tool.                                  │
│  Results come back.                                     │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   OBSERVE PHASE                         │
│  Claude reads the tool results.                         │
│  Updates its understanding of the task.                 │
│  Decides: is this done? or what's next?                 │
└─────────────────────────┬───────────────────────────────┘
                          │
              ┌───────────┴───────────┐
              ▼                       ▼
         DONE → end_turn         MORE NEEDED → tool_use
         Return final answer     Loop back to ACT
```

---

## The Minimal Agentic Loop — Annotated

```python
import anthropic
import json

client = anthropic.Anthropic()

def run_agent(
    task: str,
    tools: list,
    tool_executor: callable,
    system: str = "You are a helpful agent. Complete the task given to you.",
    max_iterations: int = 10
) -> str:
    """
    The minimal, correct agentic loop.
    
    Args:
        task: The user's task in natural language
        tools: List of tool definitions Claude can use
        tool_executor: Function that executes tool calls
        system: System prompt for the agent
        max_iterations: Hard limit to prevent infinite loops
    
    Returns:
        Claude's final response as a string
    """
    
    # ── INITIALISE ────────────────────────────────────────
    # The messages array is the agent's memory.
    # Every tool call and result gets added here.
    messages = [{"role": "user", "content": task}]
    iteration = 0
    
    while iteration < max_iterations:
        iteration += 1
        
        # ── PLAN / OBSERVE PHASE ──────────────────────────
        # Claude reads everything in messages (task + all prior 
        # tool calls + all prior results) and decides next step.
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=4096,
            system=system,
            tools=tools,
            messages=messages
        )
        
        # ── DECISION POINT ────────────────────────────────
        # stop_reason tells us what Claude decided.
        
        if response.stop_reason == "end_turn":
            # ─ DONE ─
            # Claude has finished. Extract the text response.
            # This is the final answer returned to the user.
            text_blocks = [b for b in response.content if b.type == "text"]
            if text_blocks:
                return text_blocks[0].text
            return "Task completed."
        
        elif response.stop_reason == "tool_use":
            # ─ ACT PHASE ─
            # Claude wants to call one or more tools.
            
            # Add Claude's full response to messages (REQUIRED)
            # Without this, the tool results have no context.
            messages.append({
                "role": "assistant",
                "content": response.content  # Full content, not just text
            })
            
            # Find all tool_use blocks in the response
            tool_uses = [b for b in response.content if b.type == "tool_use"]
            
            # Execute each tool and collect results
            tool_results = []
            for tool_use in tool_uses:
                print(f"  → Calling: {tool_use.name}({tool_use.input})")
                
                # Execute the tool (your code, not Claude's)
                result = tool_executor(tool_use.name, tool_use.input)
                
                # Format result for the messages array
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": tool_use.id,  # Must match Claude's request ID
                    "content": json.dumps(result) if not isinstance(result, str) else result
                })
            
            # Add all tool results to messages as a user turn
            # (Tool results are always in the user role)
            messages.append({
                "role": "user",
                "content": tool_results
            })
            
            # Loop continues → Claude reads the results → decides next step
        
        elif response.stop_reason == "max_tokens":
            # Response was truncated — this is a configuration error
            # Increase max_tokens or redesign the task
            raise RuntimeError(
                f"Agent response truncated at iteration {iteration}. "
                f"Increase max_tokens (currently 4096)."
            )
        
        else:
            # Unexpected stop reason — should not happen in normal operation
            raise RuntimeError(
                f"Unexpected stop_reason: '{response.stop_reason}' "
                f"at iteration {iteration}"
            )
    
    # ── LOOP LIMIT EXCEEDED ───────────────────────────────
    # If we get here, the agent ran for max_iterations without
    # reaching end_turn. This is almost always a problem:
    # - Task is genuinely too complex (increase limit carefully)
    # - Agent is stuck in a loop (fix tool descriptions or prompt)
    # - Infinite loop bug (fix the agent's goal definition)
    raise RuntimeError(
        f"Agent loop exceeded max_iterations ({max_iterations}). "
        f"Last stop_reason: {response.stop_reason}"
    )
```

---

## What Lives in the Messages Array

The messages array is the agent's entire working memory. After 3 iterations it looks like:

```python
messages = [
    # Iteration 0 — Initial task
    {"role": "user", "content": "Research the top 3 screenshot apps"},
    
    # Iteration 1 — Claude's first action
    {"role": "assistant", "content": [
        {"type": "text", "text": "I'll search for screenshot apps."},
        {"type": "tool_use", "id": "tu_1", "name": "search_apps",
         "input": {"query": "screenshot organiser", "limit": 5}}
    ]},
    
    # Iteration 1 — Tool result
    {"role": "user", "content": [
        {"type": "tool_result", "tool_use_id": "tu_1",
         "content": '[{"name": "ScreenshotAI"}, {"name": "Screenshotter"}]'}
    ]},
    
    # Iteration 2 — Claude's second action (parallel tools)
    {"role": "assistant", "content": [
        {"type": "text", "text": "Now I'll get details on both."},
        {"type": "tool_use", "id": "tu_2", "name": "get_app_details",
         "input": {"app_name": "ScreenshotAI"}},
        {"type": "tool_use", "id": "tu_3", "name": "get_app_details",
         "input": {"app_name": "Screenshotter"}}
    ]},
    
    # Iteration 2 — Tool results (both)
    {"role": "user", "content": [
        {"type": "tool_result", "tool_use_id": "tu_2", "content": "..."},
        {"type": "tool_result", "tool_use_id": "tu_3", "content": "..."}
    ]},
    
    # Iteration 3 — Claude's final answer (end_turn)
    # → "Here are the top 3 screenshot apps: ..."
]
```

**Every single exchange is recorded.** Claude can see the full history of what it did and what it learned. This is how it builds on previous results without external memory.

---

## The Four Stop Reasons — Decision Matrix

| stop_reason | What it means | What you do |
|---|---|---|
| `end_turn` | Task complete, Claude has a final answer | Extract text, return to user, exit loop |
| `tool_use` | Claude needs to execute tools | Execute all tool_use blocks, append results, continue loop |
| `max_tokens` | Response was cut off mid-generation | Raise error or increase max_tokens — never silently continue |
| `stop_sequence` | Custom stop signal triggered | Handle per your design (completion signal, escalation signal) |

**Never assume stop_reason.** Always check it explicitly. Code that assumes `end_turn` without checking will silently break when `tool_use` fires.

---

## Loop Invariants — Rules That Must Always Hold

These are the properties your loop must maintain to be correct:

### Invariant 1 — Complete assistant turns
Every `assistant` message must contain the full `response.content`, not just the text blocks. If Claude called 3 tools, the assistant message must include all 3 `tool_use` blocks. Breaking this corrupts the conversation.

```python
# ✅ Correct
messages.append({"role": "assistant", "content": response.content})

# ❌ Wrong — loses tool_use blocks
messages.append({"role": "assistant", "content": response.content[0].text})
```

### Invariant 2 — All tool results returned
If Claude called 3 tools, you must return results for all 3. Missing a result causes an API error on the next call.

```python
# ✅ Correct — return result for every tool_use
for tool_use in tool_uses:
    result = execute(tool_use.name, tool_use.input)
    tool_results.append({"tool_use_id": tool_use.id, "content": result})

# ❌ Wrong — skipping failed tools silently
for tool_use in tool_uses:
    try:
        result = execute(tool_use.name, tool_use.input)
        tool_results.append({"tool_use_id": tool_use.id, "content": result})
    except:
        pass  # Missing result! API will error.
```

### Invariant 3 — Strict alternation
Messages must alternate user → assistant → user → assistant. Never two consecutive user messages or two consecutive assistant messages.

```python
# ✅ Correct sequence
user: "Task"
assistant: [tool_use blocks]
user: [tool_results]
assistant: [more tool_use OR end_turn text]

# ❌ Wrong — two consecutive user messages
user: "Task"
user: [tool_results]  # Missing the assistant turn between!
```

---

## Common Loop Bugs — Exam Tested

### Bug 1 — Missing assistant message before tool results
```python
# WRONG — tool results have no preceding assistant message
messages.append({"role": "user", "content": tool_results})

# RIGHT — always append the assistant turn first
messages.append({"role": "assistant", "content": response.content})
messages.append({"role": "user", "content": tool_results})
```

### Bug 2 — Extracting text instead of full content
```python
# WRONG — loses all tool_use blocks
messages.append({"role": "assistant", "content": response.content[0].text})

# RIGHT — full content preserves tool_use blocks
messages.append({"role": "assistant", "content": response.content})
```

### Bug 3 — No max_iterations guard
```python
# WRONG — can loop forever
while True:
    response = client.messages.create(...)
    if response.stop_reason == "end_turn":
        break

# RIGHT — always have a hard limit
for iteration in range(MAX_ITERATIONS):
    response = client.messages.create(...)
    if response.stop_reason == "end_turn":
        return extract_text(response)
raise Exception("Max iterations exceeded")
```

### Bug 4 — Ignoring max_tokens stop_reason
```python
# WRONG — silently continues with truncated response
if response.stop_reason in ("end_turn", "max_tokens"):
    return extract_text(response)

# RIGHT — handle max_tokens as an error
if response.stop_reason == "end_turn":
    return extract_text(response)
elif response.stop_reason == "max_tokens":
    raise RuntimeError("Response truncated. Increase max_tokens.")
```

---

## Key Concepts Learned Today

| Term | Definition |
|---|---|
| Agentic loop | The plan → act → observe cycle that repeats until task completion |
| stop_reason | Claude's signal about why it stopped generating (end_turn, tool_use, max_tokens) |
| Messages array | The agent's working memory — accumulates all turns and tool results |
| Loop invariant | A property that must hold on every iteration for the loop to be correct |
| Max iterations | Hard limit preventing infinite loops — always required |
| end_turn | Claude's signal that the task is complete and a final answer is ready |
| tool_use | Claude's signal that it needs to execute a tool before continuing |

---

## Hands-On Task 🛠️

Build the complete agentic loop and test every stop_reason path.

**Task 1:** Implement `run_agent()` exactly as shown above.

**Task 2:** Build a 3-tool set: `search_apps`, `get_app_details`, `get_app_reviews`. Write a dispatcher.

**Task 3:** Run the agent on this task: *"Find the highest-rated free screenshot app and summarise its most recent reviews."* Observe every iteration — log the stop_reason and which tools were called.

**Task 4 — Force max_tokens:** Set `max_tokens=10`. Run the agent. Confirm your code raises a RuntimeError rather than silently continuing.

**Task 5 — Bug reproduction:** Deliberately introduce Bug 1 (missing assistant message before tool results). Observe what error the API returns.

**Task 6 — Logging:** Add iteration-level logging: "Iteration N: stop_reason=X, tools_called=[Y, Z]"

**Your implementation and observations:**
> _(write here)_

---

## Q&A — Self-Assessment (8 Questions — Exam Level)

---

**Q1.** Claude is in iteration 4 of an agent loop. It calls `get_app_details` which returns an error: `{"error": "app_not_found"}`. Claude reads this error and calls `search_apps` to find the right app name. This adds a 5th iteration. Is this correct behaviour? What architectural property makes this possible?

> **Your answer:**
> _(write here)_

---

**Q2.** Your agent loop hits `max_iterations=10` on a complex research task. A junior developer says "just increase it to 50." Why is this the wrong first response? What should you investigate before changing the limit?

> **Your answer:**
> _(write here)_

---

**Q3.** Explain the difference between `response.content` and `response.content[0].text`. Why must you always append `response.content` (not the text) to the messages array when Claude calls tools?

> **Your answer:**
> _(write here)_

---

**Q4.** Claude calls two tools in parallel in iteration 3: `get_weather("Dhaka")` and `get_weather("London")`. The first succeeds, the second times out. What is the correct content for the `tool_results` list you append to messages? Write it out.

> **Your answer:**
> _(write here)_

---

**Q5.** You are designing an agent that autonomously sends emails. After composing the email content, Claude calls `send_email`. You want the user to review the email before it's sent. How do you modify the agentic loop to insert a human review step without breaking the loop structure?

> **Your answer:**
> _(write here)_

---

**Q6.** Your agent loop is running. At iteration 6, Claude produces a response with `stop_reason = "end_turn"` but `response.content` is an empty list. What should your code do?

> **Your answer:**
> _(write here)_

---

**Q7 — Exam Scenario.** A production agent loop processes customer support tickets. It searches the customer database, reads ticket history, and drafts responses. After 3 weeks, you notice that some responses reference information from the wrong customer's ticket. What loop design flaw causes this, and how do you fix it?

> **Your answer:**
> _(write here)_

---

**Q8 — Deep Architecture.** Your agent loop is token-efficient: it uses Claude Haiku and short prompts. However, for complex 15-step tasks, it consistently fails on step 8–10. Adding more context to the system prompt doesn't help. What is the architectural explanation for why complex tasks fail mid-loop, and what is the correct architectural response?

> **Your answer:**
> _(write here)_

---

## Answer Guide — Claude's Reference Answers

---

**Q1 — Error recovery adding an iteration**

Yes, this is correct and desirable behaviour. The loop's job is to reach the goal, not to minimise iterations. Claude reading an error result and choosing a corrective action (searching for the correct name) is exactly what a good agent should do.

The architectural property that makes this possible: **the messages array contains the full history including the error.** Claude at iteration 5 can read:
- Iteration 4 request: `get_app_details("ScreenshotPro")`
- Iteration 4 result: `{"error": "app_not_found"}`
- This context informs: "I need to search for the correct name"

This is called **context-driven recovery** — the agent uses its own action history to correct course. It requires no special error handling code beyond returning error information in the tool result.

---

**Q2 — Investigating before increasing max_iterations**

Increasing to 50 without investigation risks making a stuck loop run 5x longer before failing — wasting tokens, time, and money while still eventually failing.

**Investigate first:**

1. **Log every iteration:** What tools are called? Are they making progress or repeating?
2. **Look for loops:** Is Claude calling the same tool with the same arguments repeatedly? If yes, it's stuck — increasing the limit won't help.
3. **Check task complexity:** Is the task genuinely 10+ steps? If it legitimately needs 12 steps and you cap at 10, increase makes sense. If it's a 5-step task that should be done in 5, something is wrong.
4. **Check tool results:** Are tool errors confusing Claude into unproductive paths?

**Only increase max_iterations when:**
- You've verified the task legitimately requires more steps
- You've confirmed the loop is making progress on every iteration
- You've added iteration logging to catch future stuck states

---

**Q3 — response.content vs response.content[0].text**

`response.content` is a list of content blocks — it can contain `text` blocks, `tool_use` blocks, and other block types. Example:

```python
response.content = [
    {"type": "text", "text": "I'll look up both apps."},
    {"type": "tool_use", "id": "tu_1", "name": "get_app_details", "input": {...}},
    {"type": "tool_use", "id": "tu_2", "name": "get_app_details", "input": {...}}
]
```

`response.content[0].text` extracts only the text of the first block. In this example, it's "I'll look up both apps." — losing both `tool_use` blocks entirely.

**Why you must append `response.content`:**

The tool results you return in the next turn reference `tool_use_id` values (tu_1, tu_2). If those `tool_use` blocks aren't in the preceding assistant message, the API doesn't know what `tu_1` and `tu_2` refer to. It returns an error: "tool_use_id not found in conversation."

The assistant message must contain the full content — both the text AND the tool_use blocks — so the subsequent tool results have proper context.

---

**Q4 — One tool succeeds, one times out**

```python
tool_results = [
    # Tool 1 — Success
    {
        "type": "tool_result",
        "tool_use_id": "tu_weather_dhaka",  # Must match Claude's request ID
        "content": json.dumps({
            "city": "Dhaka",
            "temperature": 32,
            "condition": "Humid and cloudy"
        })
    },
    # Tool 2 — Timeout error
    {
        "type": "tool_result",
        "tool_use_id": "tu_weather_london",  # Must match Claude's request ID
        "content": json.dumps({
            "error": "timeout",
            "message": "Weather API for London timed out after 10 seconds. "
                       "This data is temporarily unavailable.",
            "retry_suggested": True
        }),
        "is_error": True  # Optional but helpful signal to Claude
    }
]
```

**Critical:** Both tool_use_ids MUST be present. If you omit the failed tool's result, the API returns an error because `tu_weather_london` was requested but never resolved.

Claude reads both results and typically responds: "I got the weather for Dhaka (32°C, humid) but the London weather service timed out. Please try again for London."

---

**Q5 — Human review step in agentic loop**

The key insight: the loop doesn't have to be fully automated. You can intercept between iterations.

```python
def run_agent_with_human_review(task: str, tools: list, requires_review: callable):
    messages = [{"role": "user", "content": task}]
    
    for iteration in range(10):
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=4096,
            tools=tools,
            messages=messages
        )
        
        if response.stop_reason == "end_turn":
            return extract_text(response)
        
        elif response.stop_reason == "tool_use":
            messages.append({"role": "assistant", "content": response.content})
            
            tool_uses = [b for b in response.content if b.type == "tool_use"]
            tool_results = []
            
            for tool_use in tool_uses:
                
                # ── HUMAN REVIEW INTERCEPT ──────────────────
                if requires_review(tool_use.name):
                    # Pause the loop — show the intended action to the user
                    print(f"\n⚠️  Claude wants to call: {tool_use.name}")
                    print(f"   With arguments: {json.dumps(tool_use.input, indent=2)}")
                    
                    approval = input("Approve? (yes/no): ").strip().lower()
                    
                    if approval != "yes":
                        # User rejected — tell Claude
                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": tool_use.id,
                            "content": json.dumps({
                                "error": "user_rejected",
                                "message": "The user declined this action. "
                                           "Ask for clarification or take a different approach."
                            }),
                            "is_error": True
                        })
                        continue
                # ────────────────────────────────────────────
                
                result = execute_tool(tool_use.name, tool_use.input)
                tool_results.append(build_result(tool_use.id, result))
            
            messages.append({"role": "user", "content": tool_results})

# Usage
requires_review = lambda name: name in {"send_email", "delete_record", "process_payment"}
run_agent_with_human_review(task, tools, requires_review)
```

The loop structure is unchanged — human review is just a conditional check inside the tool execution step.

---

**Q6 — end_turn with empty content**

Your code should handle this gracefully:

```python
if response.stop_reason == "end_turn":
    text_blocks = [b for b in response.content if b.type == "text"]
    
    if text_blocks:
        return text_blocks[0].text
    else:
        # Empty end_turn — rare but possible
        # Log for investigation — this may indicate a prompt design issue
        logger.warning(f"end_turn with empty content at iteration {iteration}")
        return "Task completed."  # Graceful fallback
```

**Why it can happen:** Claude may produce a `tool_use` block followed by an `end_turn` in a single response (rare), or the response may genuinely be empty if Claude determined the task was done with no text to say. Never raise an exception for this — return a graceful default and log it for investigation.

---

**Q7 — Wrong customer data in responses**

**The flaw: shared context between requests.**

If you're reusing the same `messages` array across multiple tickets — either by accident or by design — tool results from Ticket A's customer lookup remain in the messages array when processing Ticket B. Claude reads this history and may reference the wrong customer's data.

**Root cause patterns:**

1. **Global messages list:** `messages = []` defined at module level, not inside the function that processes each ticket
2. **Incomplete reset:** Resetting messages but not clearing all previous tool results
3. **Session reuse:** Reusing a Claude session (messages array) across multiple independent tasks

**Fix:**

```python
def process_ticket(ticket: dict) -> str:
    # ALWAYS start with a fresh messages array per task
    messages = [{"role": "user", "content": format_ticket_task(ticket)}]
    
    # Each ticket gets its own loop with its own context
    return run_agent_loop(messages, tools)

# Process tickets independently — no shared state
for ticket in incoming_tickets:
    response = process_ticket(ticket)
    save_response(ticket["id"], response)
```

**Context isolation** — the principle that each agent task must have its own isolated messages array — is one of the most tested concepts on the CCA exam. We go deep on this in Week 8.

---

**Q8 — Complex tasks failing at iteration 8–10**

**Architectural explanation: Context degradation in long loops.**

As the loop progresses, the messages array grows with every iteration — tool calls, tool results, text snippets. By iteration 8, the context window contains:
- System prompt
- Initial task
- 7 iterations of tool calls and results
- Claude's reasoning text from each iteration

Two things happen:
1. **Context dilution:** The original task description and its constraints are now a small fraction of the total context. Claude's attention on the goal weakens.
2. **Lost in the middle:** Information from earlier iterations (step 2's findings) is "in the middle" of a long context — less attended to than recent information.

For Haiku specifically, its smaller effective reasoning capacity compounds this — it struggles to maintain coherent multi-step plans across 8+ iterations.

**Correct architectural response:**

1. **Task decomposition:** Break the 15-step task into 3 sub-tasks of 5 steps each. Each sub-task has its own agent loop with fresh context. A coordinator assembles the results. (Week 8 pattern)

2. **Structured state handoff:** After every 5 iterations, force a summarisation step — Claude summarises what it found into a structured object. Reset the messages array with only this summary. Continue with clean context.

3. **Upgrade the model:** For complex tasks, use Sonnet or Opus. Haiku's reduced capacity makes it unsuitable for 10+ step reasoning chains.

4. **Explicit progress tracking in system prompt:** "After each tool call, update your progress tracker: [completed_steps], [next_step], [remaining_steps]. This keeps your task focus sharp across many iterations."

---

## Status

- [ ] Agentic loop implemented from scratch
- [ ] 3-tool dispatcher built
- [ ] Research task tested (observed all iterations)
- [ ] max_tokens error tested
- [ ] Bug 1 reproduced (API error confirmed)
- [ ] Iteration logging added
- [ ] Q1 answered
- [ ] Q2 answered
- [ ] Q3 answered
- [ ] Q4 answered
- [ ] Q5 answered
- [ ] Q6 answered
- [ ] Q7 answered
- [ ] Q8 answered
- [ ] Answer guide reviewed
- [ ] Day 2 started

---

## Coming Up — Week 7, Day 2

**Topic:** Loop Anatomy — Plan → Act → Observe
Deep dive into each phase. How Claude plans across multiple steps. What "observing" tool results actually means for Claude's reasoning. How to design prompts that make planning and observation reliable.

---

*CCA Self-Study Log · Asif · Phase 3 of 5 · Week 7 of 12*
