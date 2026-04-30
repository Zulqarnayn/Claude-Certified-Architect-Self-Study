---
layout: default
title: CCA Self-Study — Week 8, Day 1
---

# CCA Self-Study — Week 8, Day 1
## Why Multiple Agents?

**Date completed:** _____________
**Study time:** 45–60 mins
**Curriculum phase:** Phase 3 — Agentic Architecture
**Exam domain:** Domain 1 · Agentic Architecture & Orchestration (27%)

---

## Core Concept

A single agent with many tools can handle complex tasks — you just built one. But single-agent systems have limits: context windows fill up, complex tasks require conflicting instructions, some sub-tasks need specialist capabilities others don't, and a single agent's cost structure doesn't adapt to task complexity.

Multi-agent systems solve these problems by decomposing work across specialised agents — each with focused context, focused tools, and focused instructions.

---

## The Analogy — A Hospital vs a General Practitioner

A general practitioner can treat many conditions. But for complex cases, you go to a hospital. The hospital has:
- A cardiologist (specialist for heart)
- A radiologist (specialist for imaging)
- A surgeon (specialist for procedures)
- A coordinator (routes patients to the right specialist)

The GP is a single agent. The hospital is a multi-agent system. The hospital coordinator is the orchestrator. Each specialist is a subagent.

The GP is cheaper and faster for simple cases. The hospital is more capable and accurate for complex ones. Knowing when to use each is the architect's job.

---

## The Four Reasons for Multiple Agents

### Reason 1 — Specialisation

Some tasks need expert focus. A single agent told to "research apps AND write marketing copy AND analyse market data" will be mediocre at all three. Three specialist agents — each with focused system prompts, focused tools, and focused context — will excel at their specific domain.

```
Single agent doing everything:
"You are an expert researcher, writer, marketer, data analyst, and iOS developer."
→ Jack of all trades, master of none.

Specialist agents:
ResearchAgent: "You are a research specialist. Your only job is to..."
WriterAgent: "You are a copywriter. Your only job is to..."
AnalystAgent: "You are a data analyst. Your only job is to..."
→ Each agent is genuinely expert in its domain.
```

### Reason 2 — Parallelism

Sequential is slow. Parallel is fast.

```
Sequential (single agent):
Research apps → Wait for result → Analyse market → Wait → Write copy
Total: 30 seconds

Parallel (multi-agent):
ResearchAgent ─────────────────────┐
MarketAgent ─────────────────────── ├── All run simultaneously
WriterAgent (after Research) ──────┘
Total: ~12 seconds
```

For user-facing systems, parallelism is often the difference between acceptable and unacceptable latency.

### Reason 3 — Context Isolation

Each agent has its own context window — a blank slate with only the information relevant to its task. This prevents:

1. **Cross-contamination:** Agent A's findings don't influence Agent B's independent analysis
2. **Context overflow:** Each agent handles only its portion of a large task
3. **Focus:** Each agent stays on topic without distraction from other sub-tasks

```
Without isolation (single agent doing customer support):
Context has: Customer A's data + Customer B's data + Customer C's data
→ Claude might accidentally reference Customer A's history when answering Customer C

With isolation (separate agent per customer session):
Agent for Customer C has ONLY Customer C's data
→ No cross-contamination possible
```

### Reason 4 — Cost Optimisation

Different sub-tasks need different model capabilities.

```
Task: "Research apps and write a 1000-word marketing article"

Naive single agent: Use Opus for everything
Cost: $0.15 (all Opus)

Optimised multi-agent:
ResearchAgent (Haiku): Search and gather data → $0.003
WriterAgent (Sonnet): Write the article with research data → $0.04
Total: $0.043 — 3.5x cheaper with same quality
```

---

## When NOT to Use Multiple Agents

Multi-agent adds complexity. Don't use it when a single agent suffices.

| Use single agent when | Use multi-agent when |
|---|---|
| Task fits in one context window | Task exceeds one context window |
| One type of expertise needed | Multiple distinct expertise areas |
| Sequential steps are fine | Parallelism meaningfully reduces latency |
| Task is simple or well-defined | Task is complex with distinct phases |
| Prototype or MVP | Production system at scale |
| Less than 5 tool calls expected | 10+ tool calls expected |

**The complexity cost of multi-agent:**
- More code to write and maintain
- Harder to debug (failures span multiple agents)
- Orchestration logic can be complex
- Data flow between agents must be designed carefully

---

## The Three Multi-Agent Patterns

### Pattern 1 — Hub and Spoke (most common, most tested)

One coordinator agent routes tasks to specialist subagents. Coordinator aggregates results.

```
┌─────────────────────────────────────────┐
│           COORDINATOR AGENT             │
│  - Receives user task                   │
│  - Decomposes into sub-tasks            │
│  - Delegates to subagents               │
│  - Aggregates results                   │
│  - Returns final answer                 │
└───────┬──────────────┬──────────────────┘
        │              │
   ┌────▼────┐    ┌────▼────┐    ┌────────┐
   │Research │    │ Writer  │    │Analyst │
   │ Agent   │    │ Agent   │    │ Agent  │
   └─────────┘    └─────────┘    └────────┘
```

### Pattern 2 — Pipeline (sequential handoff)

Output of Agent 1 becomes input to Agent 2. Good for multi-stage processing.

```
User Input → [Classifier] → [Specialist] → [Formatter] → Output
```

### Pattern 3 — Peer-to-Peer (consensus / debate)

Multiple agents work independently and a resolver picks the best or combines their outputs. Good for quality-critical decisions.

```
Agent A: approach 1 ─────┐
Agent B: approach 2 ──── Resolver ── Final answer
Agent C: approach 3 ─────┘
```

---

## The Hub-and-Spoke Deep Dive

Hub-and-spoke is the most exam-tested pattern. Know every aspect.

```python
# Coordinator + 2 subagents — minimal example
import anthropic
import json

client = anthropic.Anthropic()

# ── SUBAGENT DEFINITIONS ──────────────────────────────────

def run_research_subagent(topic: str) -> str:
    """Specialist subagent: only does research."""
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",  # Cheaper model for research
        max_tokens=2000,
        system=(
            "You are a research specialist. Gather key facts about the given topic. "
            "Return structured findings: key facts, statistics, and sources. "
            "Be concise and factual. Do not write marketing copy."
        ),
        messages=[{"role": "user", "content": f"Research: {topic}"}]
    )
    return response.content[0].text

def run_writer_subagent(research_data: str, tone: str, length: int) -> str:
    """Specialist subagent: only writes copy."""
    response = client.messages.create(
        model="claude-sonnet-4-6",  # Better model for writing quality
        max_tokens=3000,
        system=(
            "You are an expert copywriter. Write compelling content based on provided research. "
            "Do not search for or invent new facts — use only what is provided. "
            "Focus entirely on writing quality."
        ),
        messages=[{
            "role": "user",
            "content": f"Write a {tone} article of ~{length} words based on:\n\n{research_data}"
        }]
    )
    return response.content[0].text

# ── COORDINATOR ───────────────────────────────────────────

def run_coordinator(user_task: str) -> str:
    """
    Coordinator: decomposes task, calls subagents, aggregates.
    Note: coordinator does NOT have the subagents' tools.
    Coordinator calls subagents as Python functions (your code, not Claude's tools).
    """
    
    # Step 1: Coordinator decomposes the task
    decomp_response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=500,
        system=(
            "You decompose complex tasks into sub-tasks. "
            "Output JSON: {research_topic, tone, word_count}"
        ),
        messages=[{"role": "user", "content": f"Decompose: {user_task}"}]
    )
    
    plan = json.loads(decomp_response.content[0].text)
    
    # Step 2: Run subagents (could run in parallel with threading)
    print(f"Running research subagent on: {plan['research_topic']}")
    research = run_research_subagent(plan["research_topic"])
    
    print(f"Running writer subagent...")
    article = run_writer_subagent(research, plan["tone"], plan["word_count"])
    
    # Step 3: Coordinator aggregates
    return article

# Test
result = run_coordinator(
    "Write a 500-word casual article about ScreenshotAI app for iOS developers"
)
print(result)
```

---

## Key Concepts Learned Today

| Term | Definition |
|---|---|
| Specialisation | Each agent has focused expertise, system prompt, and tools |
| Parallelism | Multiple agents run simultaneously, reducing total latency |
| Context isolation | Each agent has its own blank-slate context window |
| Cost optimisation | Matching model capability (and cost) to sub-task complexity |
| Hub-and-spoke | One coordinator + multiple specialist subagents |
| Pipeline | Sequential handoff from one agent to the next |
| Peer-to-peer | Multiple agents work independently, resolver combines |

---

## Hands-On Task 🛠️

**Task 1:** Implement the hub-and-spoke example above. Run it with the test task.

**Task 2:** Add a third subagent: `run_seo_subagent(article_content)` that optimises the article for SEO. Connect it to the coordinator after the writer.

**Task 3:** Parallelize the research and seo analysis (they're independent). Measure time difference vs sequential.

**Task 4:** Change the researcher to use Haiku and the writer to use Sonnet. Calculate the cost difference vs using Sonnet for everything.

**Task 5 — Design exercise:** Design a multi-agent system for a customer support platform. What are the subagents? What does each specialise in? Draw the flow.

**Your implementation and design:**
> _(write here)_

---

## Q&A — Self-Assessment (8 Questions)

---

**Q1.** A single agent has a 200,000 token context window. Your task requires processing 50 customer support tickets simultaneously. Why would multi-agent help even though the task fits in one context window?

> **Your answer:**
> _(write here)_

---

**Q2.** Your hub-and-spoke coordinator calls 3 subagents. Subagent B takes 12 seconds. Subagents A and C take 3 seconds each. Sequential total: 18 seconds. Parallel total: 12 seconds. What bottleneck limits parallel speedup and how do you address it?

> **Your answer:**
> _(write here)_

---

**Q3.** A subagent's output contains information from a previous task it wasn't supposed to have. What architectural rule was violated? How does proper context isolation prevent this?

> **Your answer:**
> _(write here)_

---

**Q4.** You're building a pipeline: Agent 1 (classifier) → Agent 2 (specialist). Agent 1 produces a classification with 0.65 confidence. Should Agent 2 receive this uncertainty signal? How?

> **Your answer:**
> _(write here)_

---

**Q5.** Your coordinator needs to choose between 5 specialist subagents for each task. Where does this routing logic live — in Claude's reasoning, in your code, or both? What are the risks of each approach?

> **Your answer:**
> _(write here)_

---

**Q6.** A peer-to-peer system has 3 agents produce independent recommendations. Two recommend "proceed," one recommends "reject." How does the resolver decide? Design the resolution logic.

> **Your answer:**
> _(write here)_

---

**Q7 — Exam Scenario.** A production multi-agent system processes loan applications. The coordinator receives the application, routes to: credit_check_agent, income_verification_agent, and fraud_detection_agent in parallel. Then collects results and routes to decision_agent. A junior developer proposes: "Let's just use one agent with all 4 sets of tools — simpler code." Make the architectural case for the multi-agent design.

> **Your answer:**
> _(write here)_

---

**Q8 — Deep Architecture.** Design a multi-agent system for an autonomous iOS app store optimisation tool that: (1) monitors app store reviews daily, (2) categorises issues, (3) prioritises fixes, (4) drafts changelog entries, (5) updates the App Store listing. For each of the 5 functions, decide: own agent or shared agent? What model? Sequential or parallel? What does each agent's system prompt emphasise?

> **Your answer:**
> _(write here)_

---

## Answer Guide — Claude's Reference Answers

---

**Q1 — Multi-agent for 50 tickets even within context window**

Even if 50 tickets fit in one context window, single-agent is wrong for this use case:

**Cross-contamination risk:** Agent reading all 50 tickets might accidentally reference Customer A's data when answering Customer B's question. Tickets share a context — isolation is impossible.

**Sequential processing:** One agent processes tickets one at a time. At 30 seconds per ticket, 50 tickets takes 25 minutes. With 50 parallel agents (one per ticket), it takes 30 seconds total.

**Partial failure scope:** If the single agent fails mid-processing, all 50 tickets fail. With 50 agents, only the failing agent's ticket fails — 49 complete successfully.

**Audit trail:** With separate agents, each ticket has its own isolated conversation that can be logged, audited, and reviewed independently. One big agent makes auditing impossible.

Multi-agent here is about isolation and parallelism, not context capacity.

---

**Q2 — Parallel bottleneck**

The parallel system is only as fast as its slowest agent — 12 seconds (Subagent B). Even if A and C finish in 3 seconds, the coordinator must wait for B before aggregating.

This is called the **critical path** — the longest sequential dependency chain determines total time.

**Addressing the bottleneck:**

1. **Optimise the slow subagent:** Why does B take 12 seconds? Is it making unnecessary tool calls? Can its prompt be tightened? Can it use cached data?

2. **Overlap B with aggregation:** If the coordinator can do partial aggregation using A and C's results while waiting for B, the user sees progressive output.

3. **Timeout and degrade:** If B consistently takes 12 seconds, set a 10-second timeout. Return A and C's results with a note: "B's analysis unavailable (timeout) — recommendation based on A and C."

4. **Pre-warm B:** If B's slowness is cold start (model initialisation), keep a warm instance running.

---

**Q3 — Context contamination**

**Violated rule: Subagent context isolation.**

Proper isolation requires starting each subagent with a fresh context — no shared messages array, no persistent state. If a subagent retains context between tasks (e.g., by reusing a conversation session), prior task information bleeds into subsequent tasks.

**How proper isolation works:**

```python
def run_subagent_isolated(task: str, system: str) -> str:
    """
    Each call creates a fresh context — no memory of previous tasks.
    No messages array persists between calls.
    """
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=2000,
        system=system,  # Same system prompt
        messages=[{"role": "user", "content": task}]  # Only this task
        # ← No prior conversation history
    )
    return response.content[0].text
```

Each call to Claude creates a brand new conversation. No prior task's context is included. The isolation is physical — different API calls, different context windows.

**The contamination happened because:** Someone was maintaining a `messages` list between tasks and passing it to the subagent, or the subagent had access to a global context that accumulated data from multiple tasks.

---

**Q4 — Passing confidence signal between pipeline agents**

Yes — Subagent B (specialist) should receive the confidence signal. It changes how the specialist should frame its work.

```python
# Agent 1 returns structured output with confidence
agent1_output = {
    "classification": "technical_support",
    "confidence": 0.65,
    "reasoning": "Query matches technical support keywords but could be billing"
}

# Agent 2 receives this as context
agent2_prompt = f"""
You are a technical support specialist.

Incoming task classification: {agent1_output['classification']}
Classification confidence: {agent1_output['confidence']} / 1.0

IMPORTANT: Confidence is {agent1_output['confidence']:.0%}. 
{"This is a high confidence classification. Proceed normally." if agent1_output['confidence'] > 0.8 
 else "This is a LOW confidence classification. Handle as technical support but be prepared "
      "to redirect to billing if the user's actual need turns out to be billing-related."}

User query: {user_query}
"""
```

The specialist knows to handle the ambiguity — it might ask a clarifying question or address both possible interpretations. Without the confidence signal, it proceeds as if classification was certain, potentially giving the wrong answer.

---

**Q5 — Routing logic: Claude vs code**

**Best approach: both, with code as the authority for binary decisions.**

**Code-side routing (deterministic, testable):**
```python
# Simple routing — fast, reliable, zero cost
ROUTING_RULES = {
    "billing": billing_agent,
    "technical": tech_agent,
    "sales": sales_agent,
}

def route_task(task_type: str):
    return ROUTING_RULES.get(task_type, general_agent)
```

Use code routing when: task types are discrete and well-defined, routing errors have consequences (wrong specialist = wrong answer), you need auditability.

**Claude-side routing (flexible, handles edge cases):**
```python
# Claude decides based on context
coordinator_response = client.messages.create(
    system="Route user queries to the appropriate specialist...",
    messages=[{"role": "user", "content": user_query}]
)
# Claude's text response says which specialist to use
```

Use Claude routing when: task types are fuzzy, natural language understanding is needed, edge cases are common.

**Risks of code-only:** Rigid, fails on novel task types not in the routing table.
**Risks of Claude-only:** Probabilistic, can route incorrectly for borderline cases, slower, costs tokens.
**Best practice:** Code routing for clear cases, Claude routing with code override for ambiguous cases.

---

**Q6 — Peer-to-peer resolver with 2 proceed, 1 reject**

Simple majority vote is insufficient for high-stakes decisions. Design:

```python
def resolve_recommendations(recommendations: list[dict]) -> dict:
    # recommendations = [
    #   {"agent": "A", "decision": "proceed", "confidence": 0.87, "reasoning": "..."},
    #   {"agent": "B", "decision": "proceed", "confidence": 0.71, "reasoning": "..."},
    #   {"agent": "C", "decision": "reject",  "confidence": 0.93, "reasoning": "Risk detected"}
    # ]
    
    # Weight by confidence
    proceed_score = sum(r["confidence"] for r in recommendations if r["decision"] == "proceed")
    reject_score  = sum(r["confidence"] for r in recommendations if r["decision"] == "reject")
    
    # Check if any reject has very high confidence
    high_confidence_rejects = [r for r in recommendations 
                                if r["decision"] == "reject" and r["confidence"] > 0.85]
    
    if high_confidence_rejects:
        # High-confidence reject overrides majority — safety-first
        return {"decision": "reject", "reason": "high_confidence_rejection",
                "overriding_agent": high_confidence_rejects[0]["agent"],
                "reasoning": high_confidence_rejects[0]["reasoning"]}
    
    if proceed_score > reject_score * 1.5:  # Significant majority
        return {"decision": "proceed", "reason": "weighted_majority"}
    else:
        # Close call — escalate to human
        return {"decision": "escalate", "reason": "insufficient_consensus",
                "scores": {"proceed": proceed_score, "reject": reject_score}}
```

Key principle: for safety-critical decisions, a single high-confidence rejection should override a majority of low-confidence approvals. Safety takes precedence over democracy.

---

**Q7 — Case for multi-agent over single-agent loan processing**

**Credit Check Agent — isolation required:**
Credit check involves sensitive financial data. Isolating it in a separate agent means: the credit data never appears in the fraud agent's context (least privilege), the credit check can be audited independently, and if the credit API changes, only this agent needs updating.

**Income Verification Agent — specialist knowledge:**
Income verification requires specific document parsing logic and verification rules. A specialist system prompt makes it expert. A general agent is mediocre at it.

**Fraud Detection Agent — independent analysis:**
Fraud detection must be INDEPENDENT of the credit check result. If the credit check result is in context when the fraud agent runs, the fraud agent might be biased by it. Isolation guarantees independent assessment.

**Parallelism:**
All three (credit, income, fraud) can run in parallel — 3 seconds total vs 15 sequential. For loan applications, speed matters.

**Single-agent failure:**
If one step fails in a single agent, the entire context is corrupt. With separate agents, credit check failure doesn't affect income verification — it can still complete and be combined with partial results.

**Cost:**
Credit check (simple lookup) → Haiku. Income verification (document parsing) → Sonnet. Fraud detection (complex pattern matching) → Opus. Right model for each task.

---

**Q8 — App Store Optimisation Multi-Agent Design**

```
Agent 1: ReviewMonitorAgent (runs daily, Haiku)
- Tools: fetch_reviews_api, store_new_reviews
- System: "You monitor app store reviews. Collect all new reviews since {last_run}. 
           Store them. Do not analyse — only collect."
- Runs: Independently, triggers pipeline

Agent 2: CategoryAgent (Haiku, parallel with Agent 3)
- Input: batch of reviews from Agent 1
- Tools: none (classification only)
- System: "Classify each review into: crash_bug / ui_issue / feature_request / 
           praise / other. Return JSON array."
- Model: Haiku (classification, high volume)

Agent 3: SentimentAgent (Haiku, parallel with Agent 2)
- Input: same batch of reviews
- Tools: none
- System: "Score each review sentiment -1.0 to 1.0. Identify urgent issues (score < -0.7)."
- Model: Haiku (simple scoring)

Agent 4: PriorityAgent (Sonnet, after Agents 2+3 complete)
- Input: categorised + scored reviews
- System: "Prioritise issues for the development team. Weight: crash_bug > ui_issue > feature_request. 
           Factor in volume (how many reviews mention it) and sentiment intensity."
- Model: Sonnet (needs reasoning)

Agent 5: ChangelogAgent (Sonnet)
- Input: top 3 prioritised issues from Agent 4
- System: "Write App Store changelog entries for resolved issues. 
           Tone: positive, user-focused. Max 500 chars. No technical jargon."
- Model: Sonnet (writing quality matters)

Agent 6: ListingUpdateAgent (Sonnet + tools)
- Input: changelog from Agent 5
- Tools: app_store_connect_api (update listing)
- System: "Update the App Store listing with the provided changelog. 
           Verify the update was successful."
- Model: Sonnet (has write tools — needs judgement)

Coordinator: Orchestrates the pipeline, handles failures, sends summary to team Slack.
```

Agents 2 and 3 run in parallel. Agents 4, 5, 6 run sequentially (each needs the previous output). Each agent's context is clean — only the data it needs, formatted for its specific task.

---

## Status

- [ ] Hub-and-spoke implemented and tested
- [ ] Third subagent added
- [ ] Parallelism implemented and timed
- [ ] Cost comparison calculated
- [ ] Customer support multi-agent design completed
- [ ] All 8 questions answered
- [ ] Answer guide reviewed

---

## Coming Up — Week 8, Day 2

**Topic:** Hub-and-Spoke Architecture
The coordinator/subagent pattern in depth. How the coordinator decomposes tasks. How subagents return results. How the coordinator aggregates. The exam's most frequently tested multi-agent pattern.

---

*CCA Self-Study Log · Asif · Phase 3 of 5 · Week 8 of 12*
