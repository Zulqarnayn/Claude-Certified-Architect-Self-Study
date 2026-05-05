---
layout: default
title: CCA Self-Study — Week 8, Day 2
---

# CCA Self-Study — Week 8, Day 2
## Hub-and-Spoke Architecture

**Date completed:** _____________
**Study time:** 45–60 mins
**Curriculum phase:** Phase 3 — Agentic Architecture
**Exam domain:** Domain 1 · Agentic Architecture & Orchestration (27%)

---

## Core Concept

Hub-and-spoke is the most common and most exam-tested multi-agent pattern. One coordinator agent (the hub) receives the user's task, decomposes it into sub-tasks, delegates each to a specialist subagent (the spokes), collects results, and assembles the final answer.

This lesson covers the pattern in depth — every design decision, failure mode, and production consideration the CCA exam tests.

---

## The Analogy — An Air Traffic Control System

An air traffic controller (coordinator) doesn't fly any planes. They:
- Receive flight plans (user tasks)
- Assess the airspace (decompose the task)
- Direct each plane to the right runway (delegate to subagents)
- Coordinate sequencing and conflicts (manage dependencies)
- Ensure all planes land safely (aggregate results)

Each pilot (subagent) is a specialist — trained for their aircraft type, route, and conditions. They don't know what the other planes are doing. The controller knows everything.

The controller's value is coordination, not execution.

---

## Hub-and-Spoke Architecture — Full Design

```
┌────────────────────────────────────────────────────────┐
│                   COORDINATOR (HUB)                    │
│                                                        │
│  Receives: user task                                   │
│  Does:     decompose → delegate → aggregate            │
│  Does NOT: execute domain-specific work itself         │
│  Context:  task + subagent results only                │
│  Model:    Sonnet (needs reasoning, not bulk work)     │
└────────┬────────────────────────────┬──────────────────┘
         │ delegates                  │ delegates
         ▼                            ▼
┌────────────────┐          ┌────────────────────┐
│   SUBAGENT A   │          │    SUBAGENT B       │
│  (Research)    │          │   (Analysis)        │
│                │          │                     │
│ Context:       │          │ Context:            │
│  - Its task    │          │  - Its task         │
│  - Its tools   │          │  - Its tools        │
│  NO coordinator│          │  NO coordinator     │
│  NO other sub  │          │  NO other sub       │
│  context       │          │  context            │
│                │          │                     │
│ Model: Haiku   │          │ Model: Haiku        │
└────────┬───────┘          └────────┬────────────┘
         │ returns result            │ returns result
         └──────────────┬────────────┘
                        ▼
              Coordinator aggregates
              and forms final answer
```

---

## The Three Coordinator Responsibilities

### Responsibility 1 — Task Decomposition

The coordinator must convert a complex task into discrete sub-tasks for each subagent.

**Decomposition approaches:**

**Approach A — Fixed decomposition** (task type is known):
```python
def decompose_app_research_task(user_query: str) -> dict:
    """Fixed decomposition for app research tasks."""
    return {
        "research_task": f"Find apps matching: {user_query}",
        "analysis_task": f"Analyse market fit for: {user_query}",
        "writing_task": f"Write recommendation for: {user_query}"
    }
```

**Approach B — Claude decomposes** (task type is variable):
```python
def decompose_with_claude(user_query: str) -> dict:
    """Let Claude decompose the task."""
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=500,
        system=(
            "Decompose the user's task into subtasks for our specialist agents. "
            "Agents available: research_agent, analysis_agent, writer_agent. "
            "Output JSON: {agents_needed: [...], tasks: {agent_name: task_description}}"
        ),
        messages=[{"role": "user", "content": user_query}]
    )
    return json.loads(response.content[0].text)
```

**When to use each:**
- Fixed: When task types are well-understood and consistent
- Claude-based: When tasks vary widely and require intelligent decomposition

### Responsibility 2 — Delegation

The coordinator invokes subagents. Crucially: **the coordinator delegates to subagents via your code, not via Claude tool calls.**

```python
# The coordinator is YOUR orchestration code
# Subagent invocation is a Python function call
# Claude doesn't call subagents — you do

async def run_coordinator(user_task: str) -> str:
    # Step 1: Coordinator decomposes (Claude)
    plan = await decompose_with_claude(user_task)
    
    # Step 2: YOUR CODE invokes subagents
    if "research_agent" in plan["agents_needed"]:
        research_result = await run_research_subagent(plan["tasks"]["research_agent"])
    
    if "analysis_agent" in plan["agents_needed"]:
        analysis_result = await run_analysis_subagent(plan["tasks"]["analysis_agent"])
    
    # Step 3: Coordinator aggregates (Claude)
    return await aggregate_results(research_result, analysis_result, user_task)
```

### Responsibility 3 — Aggregation

The coordinator receives subagent outputs and synthesises a final answer.

```python
async def aggregate_results(results: dict, original_task: str) -> str:
    """Coordinator aggregates subagent results."""
    
    results_text = "\n\n".join([
        f"=== {agent.upper()} FINDINGS ===\n{result}"
        for agent, result in results.items()
        if result is not None
    ])
    
    response = client.messages.create(
        model="claude-sonnet-4-6",  # Better model for synthesis
        max_tokens=3000,
        system=(
            "You are a synthesis coordinator. Combine findings from multiple specialist "
            "agents into a coherent, actionable final answer for the user. "
            "Do not add new information — only synthesise what's provided. "
            "Highlight agreements across agents. Note disagreements explicitly."
        ),
        messages=[{
            "role": "user",
            "content": f"Original task: {original_task}\n\n"
                       f"Specialist findings:\n{results_text}\n\n"
                       f"Synthesise into a final recommendation."
        }]
    )
    
    return response.content[0].text
```

---

## Context Isolation — The Most Critical Property

This is what separates correct hub-and-spoke from broken hub-and-spoke.

### What subagents must NOT have:
- The coordinator's full context
- Other subagents' results (unless explicitly designed to receive them)
- Prior sessions' context
- User data from other sessions

### What subagents MUST have:
- Only their specific sub-task
- Only their specific tools
- Only their specific system prompt

```python
def run_subagent_isolated(
    sub_task: str,
    system_prompt: str,
    tools: list = None,
    model: str = "claude-haiku-4-5-20251001"
) -> str:
    """
    Run a subagent with full context isolation.
    Each call is a completely fresh conversation.
    No state persists between calls.
    """
    
    kwargs = {
        "model": model,
        "max_tokens": 2000,
        "system": system_prompt,
        "messages": [{"role": "user", "content": sub_task}]
        # ← NO prior messages. Fresh context every time.
    }
    
    if tools:
        kwargs["tools"] = tools
    
    response = client.messages.create(**kwargs)
    return response.content[0].text
```

**The isolation test:** Could you run this subagent in a completely different application, with a different coordinator, and get the same result? If yes — it's properly isolated. If it depends on global state, shared context, or coordinator-specific knowledge — it's not isolated.

---

## Dependency Management

Some subagents depend on other subagents' outputs. The coordinator manages these dependencies.

```python
async def run_with_dependencies(user_task: str) -> str:
    """
    Example: Writer needs Research output.
    Research and Analysis can run in parallel.
    Writer must wait for Research.
    """
    
    # Phase 1: Independent subagents (parallel)
    research_task = asyncio.create_task(
        run_research_subagent(f"Research apps for: {user_task}")
    )
    analysis_task = asyncio.create_task(
        run_analysis_subagent(f"Analyse market for: {user_task}")
    )
    
    # Wait for both to complete
    research_result, analysis_result = await asyncio.gather(
        research_task, analysis_task
    )
    
    # Phase 2: Dependent subagent (must wait for research)
    writer_result = await run_writer_subagent(
        f"Write recommendation based on:\n"
        f"Research: {research_result}\n"
        f"Analysis: {analysis_result}"
    )
    
    # Phase 3: Coordinator aggregates
    return await aggregate_results({
        "research": research_result,
        "analysis": analysis_result,
        "recommendation": writer_result
    }, user_task)
```

---

## Coordinator-Subagent Communication Contract

Define a clear interface for subagent inputs and outputs.

```python
from dataclasses import dataclass
from typing import Optional

@dataclass
class SubagentInput:
    task_description: str
    context_data: dict           # Any data subagent needs (not full coordinator context)
    output_format: str           # Expected output format
    max_length: Optional[int]    # Optional output length constraint

@dataclass  
class SubagentOutput:
    success: bool
    result: str
    confidence: float            # Subagent's confidence in its output
    caveats: list[str]           # Any limitations or uncertainties
    data_sources_used: list[str] # For auditing

def run_research_subagent(input: SubagentInput) -> SubagentOutput:
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=2000,
        system=f"Research specialist. Output format: {input.output_format}",
        messages=[{"role": "user", "content": 
                   f"Task: {input.task_description}\n"
                   f"Context: {json.dumps(input.context_data)}"}]
    )
    
    # Parse structured output
    try:
        data = json.loads(response.content[0].text)
        return SubagentOutput(
            success=True,
            result=data["findings"],
            confidence=data.get("confidence", 0.7),
            caveats=data.get("caveats", []),
            data_sources_used=data.get("sources", [])
        )
    except:
        return SubagentOutput(
            success=False,
            result=response.content[0].text,
            confidence=0.5,
            caveats=["Output not in expected format"],
            data_sources_used=[]
        )
```

---

## Key Concepts Learned Today

| Term | Definition |
|---|---|
| Hub | The coordinator agent — orchestrates, does not execute |
| Spoke | A specialist subagent — executes one specific type of work |
| Decomposition | Converting a complex task into discrete sub-tasks |
| Delegation | Your code invoking subagents (not Claude calling Claude) |
| Aggregation | Coordinator synthesising subagent outputs into a final answer |
| Context isolation | Each subagent starts with a blank context — no shared state |
| Dependency management | Controlling which subagents can run in parallel vs sequentially |

---

## Hands-On Task 🛠️

Build a complete hub-and-spoke system for the app research use case.

**System:** "App Research Hub"
- **Coordinator:** Decomposes task, manages agents, synthesises answer
- **ResearchAgent:** Searches and retrieves app data (tools: search_apps, get_app_details)
- **ReviewAgent:** Analyses user sentiment (tools: get_app_reviews)
- **PriceAgent:** Evaluates pricing and value (tools: get_price_history)

**Requirements:**
1. Coordinator decomposes each user query into appropriate sub-tasks
2. Subagents have full context isolation (fresh context each call)
3. Research and Review can run in parallel; Price waits for Research result
4. Coordinator aggregates with structured output
5. Each subagent returns `SubagentOutput` dataclass

**Test with:** "Is ScreenshotAI worth buying compared to CleanShot X? I care about price and user satisfaction."

**Your implementation:**
> _(write here)_

---

## Q&A — Self-Assessment (8 Questions)

---

**Q1.** The coordinator in hub-and-spoke delegates to subagents. Does the coordinator Claude instance directly invoke subagents as tool calls, or does your application code invoke them? Why does this distinction matter?

> **Your answer:**
> _(write here)_

---

**Q2.** Your ResearchAgent is told: "Find apps matching the user's query AND check their pricing." Is this appropriate for a specialist subagent? What should you do instead?

> **Your answer:**
> _(write here)_

---

**Q3.** Subagent A returns a result. The coordinator passes this result to Subagent B. What is the minimum information from A's result that B should receive? What should be omitted?

> **Your answer:**
> _(write here)_

---

**Q4.** Your coordinator uses Claude to decompose tasks. The decomposition Claude call costs 200 tokens. Your subagent calls cost 500 tokens each. You have 3 subagents. What percentage of total cost is decomposition overhead? Is this acceptable?

> **Your answer:**
> _(write here)_

---

**Q5.** Two subagents return contradictory findings: Research says "ScreenshotAI has 4.6 rating" and Review says "Users report mostly negative experiences." How should the coordinator handle this contradiction in its aggregation step?

> **Your answer:**
> _(write here)_

---

**Q6.** Your hub-and-spoke system processes user queries. One subagent takes on average 8 seconds. The other two take 2 seconds each. You run all three in parallel. A user complains about 8-second response times. What's your optimisation strategy?

> **Your answer:**
> _(write here)_

---

**Q7 — Exam Scenario.** A coordinator receives: "Research ScreenshotAI and compare it with Screenshotter." It decomposes into: ResearchAgent("ScreenshotAI") and ResearchAgent("Screenshotter") — calling the same subagent type twice in parallel. Is this valid hub-and-spoke? What are the benefits and risks?

> **Your answer:**
> _(write here)_

---

**Q8 — Deep Architecture.** You're asked to build a hub-and-spoke system where one subagent needs to query the coordinator for additional information mid-task. For example: ResearchAgent is researching apps but needs to ask the coordinator "What price range did the user specify?" because it wasn't in the initial sub-task. Design this bidirectional communication pattern without violating context isolation principles.

> **Your answer:**
> _(write here)_

---

## Answer Guide — Claude's Reference Answers

---

**Q1 — Who invokes subagents**

**Your application code invokes subagents — not the coordinator's Claude instance.**

The coordinator's Claude might produce text like "I'll delegate app research to the ResearchAgent" — but this is Claude reasoning, not execution. Your Python code reads this reasoning (or follows a fixed decomposition plan) and actually calls `run_research_subagent()`.

**Why this matters:**

1. **Control:** Your code is deterministic. If Claude's reasoning decides to delegate, it might sometimes delegate to the wrong subagent or add extra steps. Code-side invocation guarantees the right subagent is called every time.

2. **Security:** Claude can't directly invoke processes, APIs, or functions. If you implemented subagent invocation as Claude tool calls, you'd have to expose subagents as tools — which means Claude could call them with arbitrary arguments, bypassing your orchestration logic.

3. **Testing:** Code-side invocation means each subagent call is testable independently. You can mock the subagent and test coordinator logic without running real Claude instances.

---

**Q2 — Over-burdened specialist**

"Find apps AND check pricing" violates single responsibility. The ResearchAgent is now doing two things, which means:

1. Its system prompt must cover two domains — diluting its specialisation
2. If pricing is unavailable (API error), does it still return app data? Half-failure handling is complex.
3. You can't use ResearchAgent in contexts where pricing isn't needed without extra configuration

**The fix — split into two specialist agents:**
- ResearchAgent: "Find apps matching query. Return names, ratings, descriptions."
- PriceAgent: "Get pricing for a specific app. Return current price, history, and purchase recommendation."

The coordinator decides whether PriceAgent is needed based on the user's query ("Is it worth buying?" → yes; "What apps exist?" → no).

---

**Q3 — Minimum information for Subagent B**

Pass only what B needs to do its work — not A's full output.

**Example: Research → Writer pipeline:**

A's full output: `{search_results: [...50 apps...], raw_data: {...}, intermediate_steps: [...], confidence: 0.87, sources: [...]}`

**What Writer (B) actually needs:** The refined finding — not the raw search process.

```python
# What to pass to Writer
writer_input = {
    "top_apps": research_output["top_results"][:3],  # Just top 3
    "key_features": research_output["feature_comparison"],
    "recommendation_angle": research_output["suggested_angle"]
    # Omit: raw_data, intermediate_steps, all_50_results, sources
}
```

**What to omit:** Intermediate reasoning, raw API responses, data not relevant to B's task, information that might bias B's independent judgment.

Rule: **Pass the conclusions, not the process.** B needs to know what A found, not how A found it.

---

**Q4 — Decomposition overhead cost**

**Calculation:**
- Decomposition: 200 tokens
- 3 subagents × 500 tokens each = 1,500 tokens
- Total: 1,700 tokens
- Decomposition overhead: 200/1,700 = **11.8%**

**Is this acceptable?** Yes — 12% overhead for intelligent task routing is entirely reasonable.

Compare to the alternative — no decomposition (single agent handles everything):
- Might use all 3 sub-tasks' tools in one agent
- System prompt is complex (all 3 domains)
- Context isolation impossible
- Parallel execution impossible

The 12% decomposition cost buys you: specialisation, parallelism, isolation, and cost-optimised model routing. The ROI is strong.

**When overhead becomes unacceptable:** If decomposition costs 500+ tokens and your subagents are very simple (50 tokens each), overhead might be 70%+. In that case, use fixed decomposition (your code, no Claude call) instead.

---

**Q5 — Contradictory subagent findings**

The coordinator should NOT silently pick one and ignore the other. Both findings have evidential weight.

**Coordinator aggregation with contradiction handling:**

```python
system = """
You synthesise findings from multiple specialist agents.
When agents disagree or produce contradictory findings:
1. Explicitly note the contradiction
2. Explain possible reasons for the discrepancy
3. Assess which finding is more credible (based on methodology and source)
4. Give a nuanced answer that acknowledges the uncertainty
Never suppress contradictions — they are important information for the user.
"""

# The contradiction itself becomes part of the answer:
# "Our data shows a 4.6 average rating, but recent user reviews report 
#  negative experiences. This discrepancy may reflect: the app's average 
#  includes older, positive reviews while recent experience has declined. 
#  We recommend checking reviews from the last 30 days before purchasing."
```

Contradictions are valuable signals — they often reveal exactly the nuanced truth the user needs.

---

**Q6 — 8-second bottleneck with parallel subagents**

The 8-second subagent is the critical path — even with parallelism, the user waits 8 seconds.

**Strategy 1 — Optimise the slow subagent:**
Why does it take 8 seconds? Profile:
- Is it making too many tool calls?
- Is it using a slower model than needed?
- Is the external API it calls slow?
- Can its task be simplified?

**Strategy 2 — Progressive disclosure:**
Stream the fast subagents' results to the user immediately (2 seconds), show "Still researching [slow component]..." while the 8-second agent completes. At 8 seconds, the full answer appears. User sees progress from second 2, not a blank screen for 8 seconds.

**Strategy 3 — Timeout and degrade:**
Set a 6-second timeout on the slow agent. If it doesn't complete, return the fast agents' results with: "Full analysis is taking longer than expected — here's what we have so far."

**Strategy 4 — Pre-computation:**
If the slow agent works on predictable data (popular apps), pre-compute and cache its results. Cache hit time: ~50ms vs 8 seconds.

---

**Q7 — Same subagent type called twice in parallel**

**Yes, this is valid and is actually a common hub-and-spoke pattern.**

```
Coordinator → ResearchAgent("ScreenshotAI") ─┐
           → ResearchAgent("Screenshotter") ─ ┤ parallel
                                              ↓
                                  Coordinator aggregates both
```

**Benefits:**
- Each invocation has full context isolation — no cross-contamination between the two app researches
- Runs in parallel — total time = max(A, B), not A+B
- Each invocation produces independent, unbiased findings
- The subagent code is reused without modification

**Risks:**
- If the research subagent has state (it shouldn't, but check), parallel calls might conflict
- Both calls hit the same external APIs simultaneously — rate limits could apply
- Cost doubles (two subagent calls vs one)

**The risk management:**
Ensure `run_research_subagent()` is truly stateless (creates a fresh client.messages.create() each time). Add rate limiting if the external API has per-second limits. The double cost is the price of parallel independent analysis — usually worth it.

---

**Q8 — Bidirectional coordinator-subagent communication**

This is a sophisticated pattern that requires careful design to avoid context pollution.

**The wrong way:** Give the subagent a tool that calls back to the coordinator. This creates circular context and violates isolation.

**The right way — structured request/response:**

```python
@dataclass
class SubagentClarificationRequest:
    question: str
    reason: str
    required: bool  # Can proceed without it?

@dataclass
class SubagentInput:
    task: str
    context: dict
    # Allow subagent to request more info
    clarification_callback: callable = None

def run_research_subagent_v2(input: SubagentInput) -> SubagentOutput | SubagentClarificationRequest:
    """
    Subagent can return either a result OR a clarification request.
    The coordinator handles clarification requests by re-calling with more context.
    """
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=500,
        system=(
            "If you need more information to complete the task, output:\n"
            "<need_info>question: [your question], reason: [why], required: true/false</need_info>\n"
            "Otherwise, complete the task and output your findings."
        ),
        messages=[{"role": "user", "content": input.task}]
    )
    
    text = response.content[0].text
    if "<need_info>" in text:
        # Parse clarification request
        return SubagentClarificationRequest(
            question=extract_question(text),
            reason=extract_reason(text),
            required=extract_required(text)
        )
    
    return SubagentOutput(success=True, result=text, confidence=0.8, caveats=[], data_sources_used=[])

# Coordinator handles clarification
async def run_coordinator_v2(user_task: str) -> str:
    sub_input = SubagentInput(task=f"Research apps for: {user_task}", context={})
    
    result = run_research_subagent_v2(sub_input)
    
    if isinstance(result, SubagentClarificationRequest):
        # Coordinator retrieves the information
        clarification = retrieve_from_context(result.question, user_task)
        
        # Re-call subagent with additional context — FRESH context, not appended
        sub_input_2 = SubagentInput(
            task=f"Research apps for: {user_task}",
            context={"additional_info": {result.question: clarification}}
        )
        result = run_research_subagent_v2(sub_input_2)
    
    return result.result
```

**Key isolation principle:** The re-call creates a FRESH subagent context with the additional information embedded. The subagent never "remembers" its previous call — the coordinator provides the additional info as context for the new call. No circular context. No pollution.

---

## Status

- [ ] Hub-and-spoke system built
- [ ] Context isolation verified (each subagent has fresh context)
- [ ] Parallel execution implemented
- [ ] SubagentOutput dataclass implemented
- [ ] Full test run completed
- [ ] All 8 questions answered
- [ ] Answer guide reviewed

---

## Coming Up — Week 8, Day 3

**Topic:** Context Isolation — Deep Dive
The most tested property of multi-agent systems on the CCA exam. What it means, how to verify it, what goes wrong when it's violated, and the production patterns that enforce it.

---

*CCA Self-Study Log · Asif · Phase 3 of 5 · Week 8 of 12*
