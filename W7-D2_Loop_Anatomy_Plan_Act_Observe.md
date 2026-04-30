---
layout: default
title: CCA Self-Study — Week 7, Day 2
---

# CCA Self-Study — Week 7, Day 2
## Loop Anatomy — Plan → Act → Observe

**Date completed:** _____________
**Study time:** 45–60 mins
**Curriculum phase:** Phase 3 — Agentic Architecture
**Exam domain:** Domain 1 · Agentic Architecture & Orchestration (27%)

---

## Core Concept

Yesterday you built the loop. Today you understand what happens inside each phase — and how to design prompts and architectures that make each phase reliable. The CCA exam tests whether you understand WHY loops fail, not just how to code them. Understanding the internals of each phase is what gives you that diagnostic ability.

---

## The Analogy — A Surgeon's Operation

A surgery has three phases:

**Pre-op (Plan):** The surgeon reviews the case, patient history, and imaging. Decides the approach. Mentally simulates the procedure. Has a plan before making the first incision.

**Operation (Act):** Makes incisions, performs the procedure step by step. Each action is precise and purposeful.

**Recovery assessment (Observe):** Checks vital signs, confirms the procedure achieved its goal. Decides if additional steps are needed or if the patient can go to recovery.

A surgeon who skips pre-op planning causes chaos. One who doesn't observe results can't adapt when the procedure reveals something unexpected. One who never says "we're done" keeps a patient on the table indefinitely.

Your agent's loop phases work the same way.

---

## Phase 1 — PLAN

The plan phase is everything that happens when Claude first reads the task and decides what to do. This is the most underestimated phase.

### What Claude Does During Planning

When Claude receives a task, it:
1. Parses the task into a goal state ("What does done look like?")
2. Assesses what information it already has
3. Identifies what information it needs
4. Selects the first action to take
5. (Sometimes) maps out a multi-step approach

### How to Make Planning Reliable

**Technique 1 — Explicit goal statement in system prompt:**

```python
system = """
You are a research agent. Before taking any action:
1. State the goal in one sentence: "My goal is to..."
2. List what you already know
3. List what you need to find out
4. State your first action

This structured planning makes your reasoning transparent and auditable.
"""
```

**Technique 2 — Task decomposition instruction:**

```python
system = """
When given a complex task:
- Break it into discrete subtasks
- Complete one subtask fully before starting the next
- After each subtask, assess: is the goal achieved? or what's next?
"""
```

**Technique 3 — Explicit scratchpad for complex planning:**

```python
# Ask Claude to plan in a scratchpad before acting
initial_messages = [
    {
        "role": "user",
        "content": f"""
Task: {user_task}

Before using any tools, think through your plan:
<plan>
Goal: [what does success look like?]
Information I have: [what I know already]
Information I need: [what I must find]
Step 1: [first action]
Estimated total steps: [rough count]
</plan>

Then execute your plan step by step.
"""
    }
]
```

### The Planning Failure Mode

**Under-planning:** Claude jumps to the first available action without assessing the full task. Common result: reaches a dead end at step 4, has to backtrack, wastes iterations.

**Over-planning:** Claude writes an elaborate plan but the plan is based on assumptions that the first tool call disproves. Claude must abandon the plan and re-plan. Solution: make plans provisional — "If step 1 returns X, proceed with Y. If it returns Z, switch to approach B."

---

## Phase 2 — ACT

The act phase is when Claude commits to a tool call and you execute it. This phase is more nuanced than it appears.

### What Claude Communicates During Acting

When Claude produces a `tool_use` block, it communicates:
- **Tool name:** Which capability to invoke
- **Arguments:** Specifically what to request
- **Implicit reasoning:** Why this tool, why these arguments, at this moment

The arguments are not random — they reflect Claude's current understanding of the task. If Claude asks `search_apps(query="screenshot organiser", limit=3)`, the `limit=3` tells you it doesn't need an exhaustive list.

### Parallel vs Sequential Actions

Claude decides whether to call tools in parallel or sequentially based on data dependencies:

```
SEQUENTIAL (sequential dependency):
search_apps("screenshot") → [ScreenshotAI, Screenshotter]
                              ↓ needs the names from above
get_app_details("ScreenshotAI")

PARALLEL (no dependency):
get_app_details("ScreenshotAI") ──────┐
                                       ├── both fire simultaneously
get_app_details("Screenshotter") ─────┘
```

Your loop must support both patterns. The code in D1 already does — it processes all `tool_use` blocks in the response regardless of count.

### Designing for Good Act Phase Behaviour

**Tool descriptions that specify argument expectations:**

```python
"query": {
    "type": "string",
    "description": "Search term. Be specific — 'screenshot organiser iOS' "
                   "yields better results than 'screenshot'. "
                   "Use the user's exact phrasing when provided."
}
```

**System prompt guidance on tool selection:**

```python
system = """
Tool selection principles:
- Use search tools before detail tools (find before inspect)
- Call multiple independent tools in parallel to save iterations
- Stop calling tools when you have enough to answer the user
- Never call a tool speculatively "just to have the data"
"""
```

---

## Phase 3 — OBSERVE

The observe phase is what separates a smart agent from a naive one. Claude doesn't just receive tool results — it interprets them, updates its plan, and decides what to do next.

### What Good Observation Looks Like

After receiving tool results, Claude should:

1. **Extract the signal:** What information did this result actually provide?
2. **Compare to expectation:** Did this match what I expected?
3. **Update the plan:** What does this tell me about next steps?
4. **Make a decision:** Is the goal achieved? If not, what's the next action?

### Helping Claude Observe Well

The most powerful technique: **structured tool results.**

```python
# Weak tool result — raw data dump
return {"apps": [...50 app objects with every field...]}

# Strong tool result — pre-interpreted for easy observation
return {
    "query": "screenshot organiser",
    "total_matches": 23,
    "top_results": [
        {"name": "ScreenshotAI", "rating": 4.6, "price": "Free",
         "why_relevant": "Matches 'screenshot' and 'organiser'"},
        {"name": "Screenshotter", "rating": 3.8, "price": "$2.99",
         "why_relevant": "Matches 'screenshot'"}
    ],
    "note": "If you need more results, increase limit parameter"
}
```

The structured result gives Claude what it needs to observe and decide, without requiring it to process raw data.

### The Observation Failure Mode

**Ignoring negative results:** Claude receives `{"result": null}` or `{"error": "not_found"}` and doesn't fully incorporate this into its plan. It might call the same tool again or proceed as if it had data.

**Fix:** Include guidance in the tool result:
```python
return {
    "error": "app_not_found",
    "app_searched": "ScreenshotPro",
    "suggestion": "Did you mean 'ScreenshotAI'? It exists in the catalog.",
    "next_action_hint": "Use search_apps to find the correct name first."
}
```

Claude reads `next_action_hint` and acts on it — you've essentially guided its observation.

---

## The Transition Decision

After the observe phase, Claude makes one decision: **is the goal achieved?**

This decision is the most important in the loop. Get it wrong and you have:

| Wrong decision | Consequence |
|---|---|
| "Done" when not done | User gets incomplete response |
| "Not done" when done | Agent over-calls tools, wastes tokens, inflates latency |
| Stuck deciding | Agent loops indefinitely without making progress |

### Helping Claude Make the Right Transition Decision

**System prompt — define completion criteria:**

```python
system = """
Task completion criteria:
- You have enough information to answer the user's specific question
- You have verified the information is current and accurate
- You have not left any user question unanswered

Do NOT continue calling tools if:
- You already have the answer
- Additional calls would not change your answer
- The user asked a simple factual question answerable from one tool call
"""
```

**Explicit progress tracking in the prompt:**

```python
user_content = f"""
Task: {task}

After each tool call, track your progress:
<progress>
✅ Completed: [list]
⏳ In progress: [current step]
📋 Remaining: [list]
🎯 Ready to answer: [yes/no — if yes, stop calling tools]
</progress>
"""
```

---

## The Full Annotated Loop With Phase Labels

```python
def run_agent_with_phase_logging(task, tools, executor):
    messages = [{"role": "user", "content": task}]
    
    for iteration in range(10):
        print(f"\n{'='*50}")
        print(f"ITERATION {iteration + 1}")
        
        # ── PLAN / OBSERVE PHASE ──────────────────────────
        # (Plan on iteration 1, Observe on subsequent iterations)
        print(f"Phase: {'PLAN' if iteration == 0 else 'OBSERVE'}")
        print(f"Context size: {len(messages)} messages")
        
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=4096,
            tools=tools,
            messages=messages
        )
        
        print(f"Stop reason: {response.stop_reason}")
        
        # Extract and log any text Claude produced
        text_blocks = [b for b in response.content if b.type == "text"]
        if text_blocks:
            print(f"Claude reasoning: {text_blocks[0].text[:200]}...")
        
        if response.stop_reason == "end_turn":
            print("Phase: COMPLETE → Returning final answer")
            return text_blocks[0].text if text_blocks else "Done."
        
        elif response.stop_reason == "tool_use":
            # ── ACT PHASE ─────────────────────────────────
            print("Phase: ACT")
            
            tool_uses = [b for b in response.content if b.type == "tool_use"]
            print(f"Tools requested: {[t.name for t in tool_uses]}")
            
            messages.append({"role": "assistant", "content": response.content})
            
            # Execute tools (parallel in production)
            tool_results = []
            for tool_use in tool_uses:
                result = executor(tool_use.name, tool_use.input)
                print(f"  {tool_use.name} → {str(result)[:100]}")
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": tool_use.id,
                    "content": json.dumps(result)
                })
            
            messages.append({"role": "user", "content": tool_results})
            
            # Loop continues → next iteration starts with OBSERVE phase
    
    raise RuntimeError("Max iterations exceeded")
```

---

## Key Concepts Learned Today

| Term | Definition |
|---|---|
| Plan phase | Claude assessing the task and deciding the first action |
| Act phase | Claude committing to tool calls; you executing them |
| Observe phase | Claude reading tool results and updating its plan |
| Transition decision | Claude deciding: goal achieved (end_turn) or more needed (tool_use) |
| Provisional plan | A plan that accounts for multiple possible tool result outcomes |
| Structured tool results | Pre-interpreted results that make Claude's observation faster and more reliable |
| Completion criteria | Explicit conditions in the system prompt that tell Claude when to stop |

---

## Hands-On Task 🛠️

**Task 1:** Add phase logging to your agent from D1. Run the same research task and observe which phase triggers at each iteration.

**Task 2:** Test under-planning. Give Claude a complex task with NO system prompt guidance. Observe whether it makes unnecessary tool calls or backtracks.

**Task 3:** Add completion criteria to your system prompt. Re-run the same task. Count the total tool calls — do they decrease?

**Task 4:** Improve your tool results to include structured observation hints. Re-run. Does Claude reach `end_turn` faster?

**Task 5:** Test the transition decision failure. Ask Claude a question that one tool call fully answers. Without completion criteria, does it call a second tool unnecessarily?

**Your observations and measurements:**
> _(write here)_

---

## Q&A — Self-Assessment (8 Questions)

---

**Q1.** Claude is on iteration 3. It has the data it needs to answer the user. But its system prompt says "always call get_app_reviews before answering." The user didn't ask about reviews. Should Claude call get_app_reviews? What does this reveal about system prompt design?

> **Your answer:**
> _(write here)_

---

**Q2.** What is the difference between a "plan" and a "provisional plan"? Give a concrete example where a provisional plan prevents an agent from getting stuck.

> **Your answer:**
> _(write here)_

---

**Q3.** A tool returns 500 records. Claude must extract 3 specific records from this result. What happens to the messages array, and why is this an architectural problem? What's the fix?

> **Your answer:**
> _(write here)_

---

**Q4.** Your observe phase is failing — Claude keeps calling the same tool after getting a successful result, as if it didn't see the result. What are three possible causes?

> **Your answer:**
> _(write here)_

---

**Q5.** Claude's plan phase produces this text: "I'll search for apps, then get details on all results, then get reviews for all, then compare them." The user asked "Is ScreenshotAI free?" How do you fix Claude's over-planning for simple queries without removing planning guidance?

> **Your answer:**
> _(write here)_

---

**Q6.** You add `<progress>` tracking to your agent's prompt. After 5 iterations, the progress tracker correctly shows all steps complete and "Ready to answer: yes." But Claude still calls one more tool. What is happening and how do you enforce stop behaviour?

> **Your answer:**
> _(write here)_

---

**Q7 — Exam Scenario.** An agent processes insurance claims. The plan phase correctly identifies it needs: (1) customer verification, (2) policy lookup, (3) claim history, (4) fraud check. The act phase executes all four. The observe phase reads: claim looks valid, no fraud flags. But the agent then calls the fraud check tool a second time. What is the likely cause and the correct fix?

> **Your answer:**
> _(write here)_

---

**Q8 — Deep Architecture.** You need an agent that processes tasks of wildly varying complexity: some complete in 1 tool call, some need 15. You can't use a fixed max_iterations that works for both (too low cuts off complex tasks, too high wastes time on simple ones). Design an adaptive stopping mechanism.

> **Your answer:**
> _(write here)_

---

## Answer Guide — Claude's Reference Answers

---

**Q1 — System prompt vs user need conflict**

This reveals a fundamental system prompt design flaw: **prescriptive process instructions that override user needs.**

"Always call get_app_reviews before answering" is a process rule, not a completion criterion. When the user didn't ask about reviews, this rule forces Claude into unnecessary work that doesn't serve the user.

**Fix — replace prescriptive process with judgment criteria:**

```python
# Bad — prescriptive process
"Always call get_app_reviews before answering."

# Good — judgment criteria
"Call get_app_reviews when the user specifically asks about reviews, 
user feedback, or app reliability. Skip it if the user's question 
doesn't require review data."
```

The lesson: system prompts should tell Claude WHEN to do things, not ALWAYS do things. Hard process rules in system prompts are a common source of unnecessary tool calls and agent inefficiency.

---

**Q2 — Plan vs provisional plan**

A **plan** assumes the first tool call will succeed and return exactly what's expected.

A **provisional plan** accounts for multiple outcomes:

```
Provisional plan for "Find the best screenshot app":

Step 1: search_apps("screenshot organiser")
  → If results found: proceed to get details on top 3
  → If no results: broaden to search_apps("screenshot") or search_apps("image organiser")
  → If API error: tell user and ask them to specify an app name directly

Step 2: get_app_details(top result)
  → If details found: check if this answers the user's question
  → If app not found: try the second search result
  → If API error: return partial answer with caveat
```

**Concrete example where provisional plan prevents getting stuck:**

Without provisional: Claude searches for "ScreenshotPro", gets not_found, has no plan for this case → calls get_app_details("ScreenshotPro") again (same error) → stuck.

With provisional: "If search returns no results, try alternate search terms before calling get_app_details" → Claude searches "screenshot" → finds ScreenshotAI → proceeds.

---

**Q3 — 500 records in tool result**

The messages array now contains a 500-record JSON blob in the tool result. This:

1. **Consumes massive context window space** — 500 records might be 50,000+ tokens, consuming 25% of the context budget for data Claude mostly doesn't need.

2. **Dilutes Claude's attention** — the 3 records Claude needs are buried in 497 irrelevant ones. Claude may extract them correctly, or may miss nuances.

3. **Increases cost** — you pay input tokens for all 500 records on this call AND every subsequent call (since all of this stays in messages).

**Fixes:**

1. **Server-side filtering:** Your tool implementation filters to only return relevant records. `search_apps` returns top 5, not all 500.

2. **Pre-extraction:** Before adding to messages, your code extracts just what Claude needs:
```python
# Filter tool result before adding to messages
raw_result = call_tool(...)
filtered_result = extract_top_3_relevant(raw_result, user_query)
# Add filtered_result, not raw_result
```

3. **Pagination pattern:** Tool returns a page of 10 with a cursor. Claude can request more pages if needed — but most queries won't need all 500.

---

**Q4 — Claude ignoring tool results (three causes)**

**Cause 1 — Missing assistant message before tool results:**
You appended tool results without first appending Claude's response. The tool_use_id in your results doesn't match any tool_use block in the conversation. Claude can't connect results to requests. Fix: always `messages.append(assistant_message)` before `messages.append(tool_results)`.

**Cause 2 — Tool result format error:**
Content must be a string, not a dict. If you pass `"content": {"data": "..."}` instead of `"content": json.dumps({"data": "..."})`, the API may reject it or Claude may not parse it correctly. Fix: always `json.dumps()` non-string content.

**Cause 3 — Tool result associated with wrong tool_use_id:**
You're sending `tool_use_id: "tu_5"` but Claude's request had `id: "tu_3"`. The IDs don't match — Claude can't find the result for its request. Fix: always use `tool_use.id` from the response, never hardcode IDs.

---

**Q5 — Over-planning for simple queries**

Add query complexity detection to your planning guidance:

```python
system = """
Before planning, assess query complexity:

SIMPLE query (answer in 1-2 tool calls):
- User asks about one specific thing (e.g., "Is X free?", "What's Y's rating?")
- One or two tool calls will fully answer it
- Plan: call the minimum tools needed, then answer

COMPLEX query (may need 3+ tool calls):
- User asks for comparison, research, or multi-step analysis
- Multiple tools needed to gather a complete answer
- Plan: decompose into steps, execute sequentially

For the query: {current_query}
Complexity assessment: [SIMPLE or COMPLEX]
If SIMPLE: state the single tool you'll call and then answer.
If COMPLEX: outline the full plan.
"""
```

This injection of complexity-sensitivity prevents Claude from applying a full research protocol to simple factual questions.

---

**Q6 — Progress tracker shows complete but Claude calls another tool**

**What's happening:** The progress tracker is in Claude's output text — it's Claude's own assessment. But Claude's next token prediction is probabilistic. Despite saying "Ready to answer: yes," the momentum of the conversation pattern (tool calls followed by results followed by more tool calls) can lead Claude to generate another `tool_use` block rather than an `end_turn` response.

**The system prompt said "use tools to gather information" — Claude is following that pattern even when its own tracker says it's done.**

**Fix — explicit stop instruction tied to the completion signal:**

```python
system = """
...progress tracking instructions...

CRITICAL: When your progress tracker shows "Ready to answer: yes":
- Do NOT call any more tools
- Immediately write your final answer
- Your response must be text only — no tool_use blocks
- Violating this rule wastes the user's time and money
"""
```

Additionally, add a programmatic check:

```python
# After observe phase — check if Claude marked completion
for block in response.content:
    if block.type == "text" and "Ready to answer: yes" in block.text:
        if response.stop_reason == "tool_use":
            # Claude marked completion but still called tools
            # Programmatic intervention: ignore the tool calls, ask for final answer
            messages.append({"role": "assistant", "content": response.content})
            messages.append({
                "role": "user",
                "content": "Your progress tracker shows the task is complete. "
                           "Please provide your final answer now without any tool calls."
            })
```

---

**Q7 — Duplicate fraud check**

**Likely cause:** The fraud check tool result didn't clearly signal that the check was complete and passed. Claude's observe phase read something ambiguous and concluded it needed another check for confidence.

Possible tool result that causes this:
```json
{"status": "processing", "result": "no_flags_detected"}
```

"processing" suggests the check is ongoing. Claude sees this and calls again.

**Fix — unambiguous completion signal in tool result:**

```json
{
  "status": "complete",
  "check_id": "fraud_chk_123",
  "result": "PASSED",
  "confidence": 0.97,
  "checks_performed": ["identity", "claim_history", "behavioral_pattern"],
  "recommendation": "Proceed with claim processing — no fraud indicators.",
  "do_not_recheck": true
}
```

The `do_not_recheck: true` field and explicit `status: complete` give Claude clear signals that this check is done. Pair with system prompt: "The fraud_check tool performs a complete analysis. Do not call it more than once per claim."

---

**Q8 — Adaptive stopping for variable-complexity tasks**

```python
def run_adaptive_agent(task: str, tools: list, executor: callable) -> str:
    
    messages = [{"role": "user", "content": task}]
    
    # Step 1: Estimate complexity upfront
    complexity_response = client.messages.create(
        model="claude-haiku-4-5-20251001",  # Cheap model for classification
        max_tokens=100,
        system="Classify this task as SIMPLE (1-3 steps) or COMPLEX (4+ steps). "
               "Respond with only: {\"complexity\": \"SIMPLE\", \"estimated_steps\": N} "
               "or {\"complexity\": \"COMPLEX\", \"estimated_steps\": N}",
        messages=[{"role": "user", "content": task}]
    )
    
    complexity_data = json.loads(complexity_response.content[0].text)
    
    # Set adaptive limits
    if complexity_data["complexity"] == "SIMPLE":
        max_iterations = 3
        model = "claude-haiku-4-5-20251001"
    else:
        max_iterations = min(complexity_data["estimated_steps"] + 3, 20)
        model = "claude-sonnet-4-6"
    
    # Step 2: Run the loop with adaptive limits
    for iteration in range(max_iterations):
        response = client.messages.create(
            model=model, max_tokens=4096, tools=tools, messages=messages
        )
        
        if response.stop_reason == "end_turn":
            return extract_text(response)
        
        elif response.stop_reason == "tool_use":
            # Check for early completion signal in Claude's text
            for block in response.content:
                if block.type == "text" and "TASK_COMPLETE" in block.text:
                    # Claude signalled completion in text — trust it
                    return extract_final_answer(response)
            
            messages.append({"role": "assistant", "content": response.content})
            tool_results = execute_all_tools(response, executor)
            messages.append({"role": "user", "content": tool_results})
    
    # If we hit the limit for a simple task — escalate
    if complexity_data["complexity"] == "SIMPLE":
        raise RuntimeError(f"Simple task exceeded {max_iterations} iterations — check tool descriptions")
    else:
        raise RuntimeError(f"Complex task exceeded {max_iterations} iterations")
```

The key innovations: upfront complexity classification (cheap), adaptive model selection (cost-efficient), adaptive iteration limits (quality-appropriate), and differentiated error handling (simple task overrun signals a bug; complex task overrun may just need more steps).

---

## Status

- [ ] Phase logging added to D1 agent
- [ ] Under-planning tested without system prompt
- [ ] Completion criteria added, tool calls counted
- [ ] Structured tool results tested
- [ ] Transition decision tested (simple question)
- [ ] All 8 questions answered
- [ ] Answer guide reviewed

---

## Coming Up — Week 7, Day 3

**Topic:** Stop Conditions
How does an agent know it's done? Explicit completion signals, confidence thresholds, max iteration guards, and the critical difference between "task done" and "stuck." The CCA exam tests all of these.

---

*CCA Self-Study Log · Asif · Phase 3 of 5 · Week 7 of 12*
