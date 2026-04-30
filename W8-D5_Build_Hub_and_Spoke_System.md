---
layout: default
title: CCA Self-Study — Week 8, Day 5
---

# CCA Self-Study — Week 8, Day 5
## Build a Hub-and-Spoke System — Full Integration

**Date completed:** _____________
**Study time:** 60 mins
**Curriculum phase:** Phase 3 — Agentic Architecture
**Exam domain:** Domain 1 · Agentic Architecture & Orchestration (27%)

---

## Core Concept

Today you build a complete, production-quality multi-agent hub-and-spoke system that integrates everything from Week 8:
- Coordinator with intelligent task decomposition
- Specialist subagents with full context isolation
- Lifecycle hooks for guardrails and cost control
- Parallel execution for performance
- Structured handoff objects
- Error recovery across agent boundaries

This is the reference implementation for CCA Exam Scenario 3 (Multi-Agent Research System).

---

## What You're Building

**App Research Hub** — A multi-agent system that answers complex iOS app research questions.

**Architecture:**
```
User Query
    ↓
COORDINATOR (claude-sonnet-4-6)
  - Decomposes task
  - Manages agent lifecycle
  - Aggregates results
    ↓           ↓          ↓
RESEARCH     REVIEW     PRICE
AGENT        AGENT      AGENT
(haiku)      (haiku)    (haiku)
  ↓             ↓          ↓
Results → COORDINATOR → Final Answer
```

---

## Complete Implementation

```python
# hub_and_spoke.py
# Complete multi-agent research system
# Week 8 Day 5 — Reference Implementation

import anthropic
import asyncio
import json
import logging
import time
import uuid
from dataclasses import dataclass, field
from typing import Optional, Any
from enum import Enum

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(name)s] %(message)s')

client = anthropic.Anthropic()

# ─────────────────────────────────────────────────────────
# Data Contracts
# ─────────────────────────────────────────────────────────

@dataclass
class SubagentHandoff:
    """Explicit contract for what crosses agent boundaries."""
    task: str
    context: dict = field(default_factory=dict)
    output_schema: dict = field(default_factory=dict)
    
@dataclass
class SubagentResult:
    agent_id: str
    success: bool
    data: dict
    confidence: float
    caveats: list
    duration_seconds: float
    error: Optional[str] = None

@dataclass
class CoordinatorResult:
    success: bool
    answer: str
    sub_results: list[SubagentResult]
    total_duration: float
    cost_estimate: float

# ─────────────────────────────────────────────────────────
# Mock Data
# ─────────────────────────────────────────────────────────

APPS = {
    "ScreenshotAI": {
        "name": "ScreenshotAI", "developer": "Asif Dev Labs",
        "price": 0.0, "rating": 4.6, "reviews": 1240,
        "category": "Productivity", "updated": "2026-03-15",
        "description": "AI-powered screenshot organiser with on-device OCR"
    },
    "Screenshotter": {
        "name": "Screenshotter", "developer": "Legacy Apps Inc",
        "price": 2.99, "rating": 3.8, "reviews": 456,
        "category": "Utilities", "updated": "2024-08-20",
        "description": "Basic screenshot folder organisation"
    },
    "CleanShot X": {
        "name": "CleanShot X", "developer": "CleanShot Team",
        "price": 29.99, "rating": 4.9, "reviews": 8930,
        "category": "Productivity", "updated": "2026-04-01",
        "description": "Professional screenshot tool with annotations"
    }
}

REVIEWS = {
    "ScreenshotAI": {
        "avg": 4.6, "count": 1240,
        "praise": ["OCR accuracy", "Privacy", "Speed"],
        "complaints": ["No cloud backup", "Occasional sync delay"],
        "recent": [
            {"stars": 5, "text": "Incredible — finds screenshots by searching text"},
            {"stars": 4, "text": "Love it but needs cloud sync"}
        ]
    },
    "CleanShot X": {
        "avg": 4.9, "count": 8930,
        "praise": ["Annotations", "Scrolling capture", "Regular updates"],
        "complaints": ["Expensive", "Overkill for casual users"],
        "recent": [
            {"stars": 5, "text": "Best screenshot tool I've ever used"},
            {"stars": 5, "text": "Worth every penny for developers"}
        ]
    }
}

PRICING = {
    "ScreenshotAI": {
        "current": 0.0, "lowest": 0.0,
        "verdict": "Always free — no timing consideration"
    },
    "CleanShot X": {
        "current": 29.99, "lowest": 14.99,
        "sale_freq": "2-3x/year", "last_sale": "2025-12-25",
        "verdict": "Consider waiting for a holiday sale"
    },
    "Screenshotter": {
        "current": 2.99, "lowest": 0.99,
        "sale_freq": "Rarely", "verdict": "Buy now if needed"
    }
}

# ─────────────────────────────────────────────────────────
# Tool Implementations
# ─────────────────────────────────────────────────────────

def search_apps(query: str, limit: int = 5) -> dict:
    q = query.lower()
    results = [
        {"name": a["name"], "rating": a["rating"],
         "price": "Free" if a["price"]==0 else f"${a['price']:.2f}",
         "desc": a["description"][:80]}
        for a in APPS.values()
        if q in a["name"].lower() or q in a["description"].lower()
    ]
    return {"status": "success", "results": results[:limit]} if results else {
        "status": "error", "error_type": "no_results",
        "message": f"No apps found for '{query}'",
        "suggestion": "Try broader terms"
    }

def get_app_details(app_name: str) -> dict:
    app = APPS.get(app_name)
    if not app:
        similar = [n for n in APPS if app_name.lower() in n.lower()]
        return {"status": "error", "error_type": "not_found",
                "searched": app_name, "similar": similar}
    return {"status": "success", **app}

def get_app_reviews(app_name: str) -> dict:
    reviews = REVIEWS.get(app_name)
    if not reviews:
        return {"status": "error", "message": f"No reviews for '{app_name}'"}
    return {"status": "success", "app": app_name, **reviews}

def get_price_history(app_name: str) -> dict:
    price = PRICING.get(app_name)
    if not price:
        return {"status": "error", "message": f"No pricing data for '{app_name}'"}
    return {"status": "success", "app": app_name, **price}

def safe_execute(fn, **kwargs) -> dict:
    """Execute tool safely — never raises."""
    try:
        return fn(**kwargs)
    except Exception as e:
        return {"status": "error", "error_type": "unexpected", "message": str(e)}

# ─────────────────────────────────────────────────────────
# Lifecycle Hooks
# ─────────────────────────────────────────────────────────

class HookDecision(Enum):
    ALLOW = "allow"
    BLOCK = "block"

@dataclass
class HookResult:
    decision: HookDecision
    reason: str = ""

class GuardrailLayer:
    """Simple hook layer for this demo."""
    
    def __init__(self, max_tool_calls: int = 15):
        self.max_tool_calls = max_tool_calls
        self.call_counts: dict[str, int] = {}
    
    def check(self, agent_id: str, tool_name: str) -> HookResult:
        count = self.call_counts.get(agent_id, 0)
        
        if count >= self.max_tool_calls:
            return HookResult(
                decision=HookDecision.BLOCK,
                reason=f"Agent {agent_id} exceeded {self.max_tool_calls} tool calls"
            )
        
        self.call_counts[agent_id] = count + 1
        return HookResult(decision=HookDecision.ALLOW)

guardrails = GuardrailLayer(max_tool_calls=10)

# ─────────────────────────────────────────────────────────
# Specialist Subagents
# ─────────────────────────────────────────────────────────

RESEARCH_TOOLS = [
    {
        "name": "search_apps",
        "description": "Search App Store catalog. Use first when looking for apps by type or keyword.",
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
        "description": "Get full details for a specific app by name.",
        "input_schema": {
            "type": "object",
            "properties": {"app_name": {"type": "string"}},
            "required": ["app_name"]
        }
    }
]

REVIEW_TOOLS = [
    {
        "name": "get_app_reviews",
        "description": "Get user reviews and sentiment for an app.",
        "input_schema": {
            "type": "object",
            "properties": {"app_name": {"type": "string"}},
            "required": ["app_name"]
        }
    }
]

PRICE_TOOLS = [
    {
        "name": "get_price_history",
        "description": "Get pricing history and purchase recommendation for an app.",
        "input_schema": {
            "type": "object",
            "properties": {"app_name": {"type": "string"}},
            "required": ["app_name"]
        }
    }
]

def execute_subagent_tool(agent_id: str, tool_name: str, tool_input: dict) -> dict:
    """Execute a tool with guardrail check."""
    
    hook_result = guardrails.check(agent_id, tool_name)
    if hook_result.decision == HookDecision.BLOCK:
        return {"status": "error", "error_type": "blocked",
                "reason": hook_result.reason}
    
    dispatch = {
        "search_apps": lambda: safe_execute(search_apps, **tool_input),
        "get_app_details": lambda: safe_execute(get_app_details, **tool_input),
        "get_app_reviews": lambda: safe_execute(get_app_reviews, **tool_input),
        "get_price_history": lambda: safe_execute(get_price_history, **tool_input),
    }
    
    executor = dispatch.get(tool_name)
    if not executor:
        return {"status": "error", "message": f"Unknown tool: {tool_name}"}
    
    return executor()

def run_subagent(
    agent_id: str,
    handoff: SubagentHandoff,
    tools: list,
    system_prompt: str,
    model: str = "claude-haiku-4-5-20251001"
) -> SubagentResult:
    """
    Run a subagent with FULL CONTEXT ISOLATION.
    Each call creates a completely fresh context — no shared state.
    """
    logger = logging.getLogger(agent_id)
    start = time.time()
    
    # Fresh context — only this handoff's task
    messages = [{
        "role": "user",
        "content": f"Task: {handoff.task}\n\n"
                   f"Context: {json.dumps(handoff.context) if handoff.context else 'None'}"
    }]
    
    try:
        for iteration in range(8):  # Subagents get fewer iterations than coordinator
            response = client.messages.create(
                model=model,
                max_tokens=2000,
                system=system_prompt,
                tools=tools,
                messages=messages
            )
            
            if response.stop_reason == "end_turn":
                text = next((b.text for b in response.content if b.type == "text"), "")
                return SubagentResult(
                    agent_id=agent_id,
                    success=True,
                    data={"raw_output": text},
                    confidence=0.8,
                    caveats=[],
                    duration_seconds=time.time() - start
                )
            
            elif response.stop_reason == "tool_use":
                messages.append({"role": "assistant", "content": response.content})
                
                tool_results = []
                for tool_use in [b for b in response.content if b.type == "tool_use"]:
                    logger.info(f"  Tool: {tool_use.name}({list(tool_use.input.keys())})")
                    result = execute_subagent_tool(agent_id, tool_use.name, tool_use.input)
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": tool_use.id,
                        "content": json.dumps(result),
                        "is_error": result.get("status") == "error"
                    })
                
                messages.append({"role": "user", "content": tool_results})
        
        return SubagentResult(
            agent_id=agent_id, success=False,
            data={}, confidence=0.0, caveats=["Max iterations reached"],
            duration_seconds=time.time() - start,
            error="max_iterations"
        )
    
    except Exception as e:
        logger.error(f"Error: {e}")
        return SubagentResult(
            agent_id=agent_id, success=False,
            data={}, confidence=0.0, caveats=[],
            duration_seconds=time.time() - start,
            error=str(e)
        )

# ─────────────────────────────────────────────────────────
# Subagent System Prompts
# ─────────────────────────────────────────────────────────

RESEARCH_SYSTEM = """
You are a research specialist for iOS apps.
Your ONLY job: find apps matching the query and return structured findings.
Do NOT write recommendations or opinions — only facts.

Return findings as:
{
  "apps_found": [{"name": ..., "rating": ..., "price": ..., "key_features": [...]}],
  "search_terms_used": [...],
  "confidence": 0.0-1.0
}
"""

REVIEW_SYSTEM = """
You are a user sentiment analyst.
Your ONLY job: get reviews for specified apps and summarise user sentiment.

Return as:
{
  "app": ...,
  "sentiment": "positive/mixed/negative",
  "top_praise": [...],
  "top_complaints": [...],
  "recommendation_signal": "strong_buy/buy/neutral/avoid",
  "confidence": 0.0-1.0
}
"""

PRICE_SYSTEM = """
You are a pricing analyst.
Your ONLY job: retrieve pricing data and give a purchase timing recommendation.

Return as:
{
  "app": ...,
  "current_price": ...,
  "best_known_price": ...,
  "purchase_recommendation": "buy_now/wait_for_sale/overpriced",
  "reasoning": ...,
  "confidence": 0.0-1.0
}
"""

# ─────────────────────────────────────────────────────────
# Coordinator
# ─────────────────────────────────────────────────────────

COORDINATOR_DECOMPOSE_SYSTEM = """
You are a task coordinator for an app research system.
Decompose the user's query into specific tasks for our three specialist agents.

Output JSON only:
{
  "needs_research": true/false,
  "needs_reviews": true/false,
  "needs_pricing": true/false,
  "research_task": "specific instruction for research agent",
  "review_task": "specific instruction for review agent (or null)",
  "price_task": "specific instruction for price agent (or null)",
  "target_apps": ["app names if known, or empty if search needed"]
}
"""

COORDINATOR_AGGREGATE_SYSTEM = """
You are a synthesis coordinator. Combine specialist agent findings into a clear, 
helpful answer for the user. Structure your response as:

**Recommendation:** [clear, direct recommendation]

**Key Findings:**
- [bullet point 1]
- [bullet point 2]

**Details:** [paragraph with supporting information]

**Caveats:** [any limitations or missing data]

Be honest about data gaps. Do not fabricate information not in the provided findings.
"""

async def run_coordinator(user_query: str) -> CoordinatorResult:
    """
    Coordinator: decomposes task, runs subagents, aggregates.
    Uses async for parallel subagent execution.
    """
    logger = logging.getLogger("coordinator")
    start = time.time()
    
    logger.info(f"Query: {user_query[:80]}")
    
    # ── STEP 1: Decompose ─────────────────────────────────
    decomp_response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=500,
        system=COORDINATOR_DECOMPOSE_SYSTEM,
        messages=[{"role": "user", "content": user_query}]
    )
    
    try:
        plan = json.loads(decomp_response.content[0].text)
    except json.JSONDecodeError:
        plan = {
            "needs_research": True, "needs_reviews": False, "needs_pricing": False,
            "research_task": user_query, "review_task": None, "price_task": None,
            "target_apps": []
        }
    
    logger.info(f"Plan: research={plan['needs_research']}, "
                f"reviews={plan['needs_reviews']}, pricing={plan['needs_pricing']}")
    
    # ── STEP 2: Run subagents in parallel ─────────────────
    tasks = []
    
    if plan["needs_research"]:
        handoff = SubagentHandoff(
            task=plan["research_task"],
            context={"target_apps": plan.get("target_apps", [])}
        )
        tasks.append(asyncio.to_thread(
            run_subagent,
            "research_agent", handoff, RESEARCH_TOOLS, RESEARCH_SYSTEM
        ))
    
    if plan["needs_reviews"]:
        handoff = SubagentHandoff(
            task=plan["review_task"] or f"Get reviews for apps related to: {user_query}",
            context={"target_apps": plan.get("target_apps", [])}
        )
        tasks.append(asyncio.to_thread(
            run_subagent,
            "review_agent", handoff, REVIEW_TOOLS, REVIEW_SYSTEM
        ))
    
    if plan["needs_pricing"]:
        handoff = SubagentHandoff(
            task=plan["price_task"] or f"Get pricing for: {user_query}",
            context={"target_apps": plan.get("target_apps", [])}
        )
        tasks.append(asyncio.to_thread(
            run_subagent,
            "price_agent", handoff, PRICE_TOOLS, PRICE_SYSTEM
        ))
    
    if not tasks:
        return CoordinatorResult(
            success=False, answer="Could not determine what research to perform.",
            sub_results=[], total_duration=time.time()-start, cost_estimate=0.0
        )
    
    # Execute all subagents in parallel
    sub_results = await asyncio.gather(*tasks)
    
    # ── STEP 3: Aggregate ─────────────────────────────────
    findings_text = ""
    for result in sub_results:
        if result.success:
            findings_text += f"\n\n=== {result.agent_id.upper()} FINDINGS ===\n"
            findings_text += json.dumps(result.data, indent=2)
        else:
            findings_text += f"\n\n=== {result.agent_id.upper()} FAILED ===\n"
            findings_text += f"Error: {result.error}"
    
    agg_response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=3000,
        system=COORDINATOR_AGGREGATE_SYSTEM,
        messages=[{
            "role": "user",
            "content": f"User query: {user_query}\n\n"
                       f"Specialist findings:{findings_text}"
        }]
    )
    
    final_answer = agg_response.content[0].text
    
    logger.info(f"Completed in {time.time()-start:.1f}s with {len(sub_results)} subagents")
    
    return CoordinatorResult(
        success=True,
        answer=final_answer,
        sub_results=list(sub_results),
        total_duration=time.time() - start,
        cost_estimate=0.0  # Implement proper cost tracking
    )

# ─────────────────────────────────────────────────────────
# Run It
# ─────────────────────────────────────────────────────────

async def main():
    queries = [
        "What's the best free screenshot app for iOS?",
        "Compare ScreenshotAI and Screenshotter for a developer who cares about ratings and price",
        "Should I buy CleanShot X now or wait for a sale?",
        "What do users complain about most with ScreenshotAI?",
    ]
    
    for query in queries[:2]:  # Start with first 2
        print(f"\n{'='*60}")
        print(f"QUERY: {query}")
        print('='*60)
        
        result = await run_coordinator(query)
        
        print(f"\nSuccess: {result.success}")
        print(f"Duration: {result.total_duration:.1f}s")
        print(f"Subagents: {[r.agent_id for r in result.sub_results]}")
        print(f"\nAnswer:\n{result.answer}")

if __name__ == "__main__":
    asyncio.run(main())
```

---

## Hands-On Task 🛠️

**Task 1:** Run the system on all 4 test queries. Note which subagents were invoked for each.

**Task 2:** Measure parallel vs sequential performance. Remove `asyncio.gather` and run sequentially. Compare total times.

**Task 3:** Verify context isolation. Add logging to each subagent that prints the number of messages in its context. Confirm each starts with exactly 1 message.

**Task 4:** Trigger the guardrail. Force a subagent to make 11 tool calls (exceed the limit). Confirm the hook blocks and the agent degrades gracefully.

**Task 5 — Exam prep:** Without looking at the code, write a paragraph describing how context isolation is maintained in this system. Then verify against the code.

**Your results:**
> _(write here)_

---

## Q&A — Self-Assessment (6 Questions)

---

**Q1.** The coordinator uses Haiku for decomposition and Sonnet for aggregation. Why different models for each step? What would happen if you used Haiku for aggregation?

> **Your answer:**
> _(write here)_

---

**Q2.** All three subagents run in parallel. But what if the user asked: "Search for the best screenshot app, then get detailed reviews of the top result"? Can these two tasks still run in parallel? If not, how do you handle this?

> **Your answer:**
> _(write here)_

---

**Q3.** The coordinator's decomposition uses Claude (Haiku). A simpler approach: use code-based routing rules. When would you choose each, and what's the risk of each approach?

> **Your answer:**
> _(write here)_

---

**Q4.** A subagent returns `success=False` with `error="max_iterations"`. The coordinator still has results from the other two subagents. How should the coordinator handle this in the aggregation step?

> **Your answer:**
> _(write here)_

---

**Q5 — Exam Scenario.** You deploy this system. After 2 weeks, the review_agent is called for 90% of all queries — including simple factual queries like "What's the price of ScreenshotAI?" The review agent is adding unnecessary latency and cost. What is the root cause and how do you fix it?

> **Your answer:**
> _(write here)_

---

**Q6 — Architecture Reflection.** Looking at the complete system, identify the three places where a production failure could cause the user to receive wrong information (not an error, but an incorrect answer). For each, what is the specific failure mode and how would you detect it?

> **Your answer:**
> _(write here)_

---

## Answer Guide — Claude's Reference Answers

---

**Q1 — Different models for decomposition vs aggregation**

**Decomposition (Haiku):** The decomposition task is classification — "what agents are needed?" This is a simple, well-structured task with a small output (JSON with 7 fields). Haiku handles classification tasks reliably and is 5x cheaper than Sonnet. The decomposition doesn't require deep reasoning, just pattern matching against known task types.

**Aggregation (Sonnet):** Synthesis is fundamentally different — it requires understanding nuance, handling contradictions between subagent outputs, structuring a readable recommendation, and applying judgment about what matters to the user. This is a reasoning task, not classification. Sonnet's superior reasoning produces noticeably better synthesis quality.

**What happens with Haiku for aggregation:** The recommendation becomes generic and may miss nuances in the specialist data. "ScreenshotAI is free and well-rated" vs Sonnet's "ScreenshotAI's free price and 4.6 rating make it the clear choice for privacy-conscious users, though power users who need annotations should consider CleanShot X despite its $30 price." The quality difference is meaningful for user decisions.

---

**Q2 — Sequential dependency: search then review**

These tasks CANNOT run in parallel. The review task's input (which specific app to review) depends on the search task's output (which app was found to be best).

**How to handle:**

```python
# Phase 1: Run search subagent alone
search_result = await run_research_subagent(search_task)

# Extract the app name from search results
top_app = extract_top_app(search_result.data)

# Phase 2: Run review subagent with dependency on Phase 1
review_task = SubagentHandoff(
    task=f"Get reviews for {top_app}",
    context={"app_name": top_app}  # From Phase 1 output
)
review_result = await run_review_subagent(review_task)
```

This is the **pipeline pattern** within the hub-and-spoke. Some sub-tasks have sequential dependencies. The coordinator must manage these phases:
- Phase 1: Run all independent tasks in parallel
- Phase 2: Run dependent tasks using Phase 1 outputs

The coordinator's decomposition step should identify dependencies: `"review_depends_on_research": true`.

---

**Q3 — Claude decomposition vs code routing**

**Claude decomposition:**
- Pros: Handles novel query types gracefully, adapts to natural language variation, no code changes for new task types
- Cons: Adds latency (extra API call), costs tokens, can misclassify ambiguous queries, non-deterministic

**Code routing:**
- Pros: Deterministic, zero latency, free, fully testable
- Cons: Requires code changes for new task types, fails on queries that don't match patterns

**When to choose:**

Choose **code routing** when:
- Query types are well-defined and stable
- You can enumerate all task types
- Routing errors have consequences (wrong agent = wrong answer)
- You need 100% reproducibility for debugging

Choose **Claude decomposition** when:
- Users can ask about anything in natural language
- New query types emerge frequently
- Routing errors are recoverable (coordinator can re-route)
- The flexibility benefit outweighs the cost

**Best practice:** Hybrid. Code routing for known patterns (fast path), Claude decomposition for unrecognised patterns (fallback). The fast path handles 80% of queries; Claude handles novel cases.

---

**Q4 — Subagent fails: coordinator handles gracefully**

The coordinator should never discard all results because one agent failed. Graceful handling:

```python
# In the aggregation prompt, explicitly address partial failure
findings_text = ""
failed_agents = []

for result in sub_results:
    if result.success:
        findings_text += f"\n\n=== {result.agent_id.upper()} ===\n{json.dumps(result.data)}"
    else:
        failed_agents.append(result.agent_id)
        findings_text += f"\n\n=== {result.agent_id.upper()} — UNAVAILABLE ===\n"
        findings_text += f"This specialist could not complete its analysis."

aggregation_prompt = f"""
User query: {user_query}

Specialist findings:{findings_text}

{"NOTE: The following specialists were unavailable: " + ", ".join(failed_agents) + ". " if failed_agents else ""}
{"Provide the best answer from available data, noting what information is missing." if failed_agents else ""}
"""
```

Claude's aggregation should then produce: "Based on research findings [uses what succeeded]. Note: User sentiment analysis was unavailable due to a technical issue — I recommend checking recent reviews directly before purchasing."

**The user gets a partial but useful answer, not an error.**

---

**Q5 — review_agent over-called**

**Root cause: The decomposition prompt doesn't clearly define when reviews are needed.**

The decomposition system prompt says something like "determine if reviews are needed" — but without explicit criteria, Claude's Haiku defaults to "reviews might always be useful" and sets `needs_reviews: true` for most queries.

**Fix — explicit criteria in decomposition prompt:**

```python
COORDINATOR_DECOMPOSE_SYSTEM = """
...

WHEN TO USE review_agent (only when explicitly needed):
- User asks about "reviews", "opinions", "user feedback", "complaints", "reliable"
- User asks "is it worth buying" — then reviews help
- DO NOT use for: price queries, feature queries, basic facts

WHEN TO USE price_agent (only when explicitly needed):
- User asks about price, cost, sale, timing, value for money
- DO NOT use for: general recommendations, feature comparisons
"""
```

Additionally, add a test suite for the decomposition step:
```python
DECOMPOSITION_TESTS = [
    ("What's the price of ScreenshotAI?", {"needs_reviews": False}),
    ("What do users think of ScreenshotAI?", {"needs_reviews": True}),
    ("Is CleanShot X worth buying?", {"needs_reviews": True, "needs_pricing": True}),
]
```

Run these after every change to the decomposition prompt to catch regressions.

---

**Q6 — Three ways the system can produce wrong information**

**Failure Mode 1 — Decomposition misclassification:**

The coordinator's Haiku decomposition could misinterpret the user's intent and invoke the wrong subagents. For "What are the best paid screenshot apps?" it might set `needs_pricing: false` (since it's about finding paid apps, not price history) and miss relevant pricing context.

Detection: Log decomposition outputs alongside user queries. Sample and review 5% of sessions weekly. Build a test suite comparing decomposition output to expected agent selection.

**Failure Mode 2 — Subagent hallucination in tool-free steps:**

When Claude subagents reach `end_turn` and produce their structured JSON output, they might invent data not in the tool results. The Review Agent might write "users praise the widget feature" when the tool results never mentioned widgets.

Detection: Implement output validation that cross-references the subagent's claimed facts against the tool results it received. Flag any claim in the output not traceable to a tool result.

**Failure Mode 3 — Aggregation losing important caveats:**

The coordinator's aggregation Sonnet call combines 3 subagent outputs into one answer. In this synthesis, caveats from individual agents may get dropped. If the price agent said "pricing data unavailable for Screenshotter" and the research agent found Screenshotter competitive, the final answer might recommend Screenshotter at "competitive pricing" without the caveat.

Detection: After aggregation, automatically check that all `caveats` fields from SubagentResults are either present in the final answer or explicitly addressed. Log any dropped caveats for manual review.

---

## Week 8 Complete — What You Now Know

| Day | Topic | Exam weight |
|---|---|---|
| D1 | Why multiple agents — 4 reasons, 3 patterns | Core |
| D2 | Hub-and-spoke — decompose, delegate, aggregate | Most tested |
| D3 | Context isolation — violations, tests, handoffs | Most tested |
| D4 | Lifecycle hooks — 6 essential hooks, prompt vs hook | Critical |
| D5 | Full integration — complete multi-agent system | Exam scenario |

---

## Status

- [ ] Full system running on all 4 queries
- [ ] Parallel vs sequential timing measured
- [ ] Context isolation verified (1 message per subagent)
- [ ] Guardrail triggered and tested
- [ ] Architecture paragraph written from memory
- [ ] All 6 questions answered
- [ ] Answer guide reviewed
- [ ] Week 8 complete 🎉

---

## Coming Up — Week 9, Day 1

**Topic:** What Is Claude Code?
A command-line tool that runs Claude inside your codebase. It reads files, writes code, runs tests — from your terminal. Installation, first run, and how it differs from the raw API.

---

*CCA Self-Study Log · Asif · Phase 3 of 5 · Week 8 of 12*
