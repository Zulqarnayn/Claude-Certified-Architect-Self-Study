# CCA Self-Study — Week 10, Day 1
## Handoff Patterns

**Date completed:** _____________
**Study time:** 45 mins
**Curriculum phase:** Phase 4 — Claude Code & Workflows
**Exam domain:** Domain 5 · Context Management & Reliability (15%)

---

## Core Concept

A handoff is the moment when one agent passes work to another, or when a long session must pause and resume later. Handoffs are where multi-agent systems most commonly fail — too much context creates bloat, too little loses critical information. The art is knowing exactly what to carry forward.

The CCA exam tests handoff patterns in two scenarios: agent-to-agent handoffs in multi-agent systems, and session-to-session handoffs in long-running workflows.

---

## The Analogy — A Doctor Handing Off a Patient

When a doctor ends their shift, they don't give the incoming doctor a complete transcript of every conversation with the patient. They write a structured handoff note:

```
Patient: Ahmed Rahman, 45M
Diagnosis: Pneumonia (confirmed via chest X-ray)
Current status: Stable, O2 sat 97% on room air
Active medications: Amoxicillin 500mg TID (Day 2 of 7)
Outstanding: Awaiting culture results (ETA 6 hours)
Next action: Check culture results. If resistant strain, switch to Azithromycin.
Red flags: Alert if O2 drops below 95%
```

This is a structured handoff. The incoming doctor has exactly what they need — no more, no less. They don't read the entire patient chart. They get the state and the next action.

Your agent handoffs work exactly the same way.

---

## The Two Handoff Failure Modes

### Failure Mode 1 — Too Much (Context Dump)

```python
# ❌ WRONG — Passing raw conversation history
def handoff_to_next_agent(messages):
    next_agent_input = str(messages)  # Dump everything
    run_next_agent(next_agent_input)
```

**Problems:**
- Context bloat: 10,000 tokens of history passed where 500 sufficed
- Loss of focus: Next agent reads irrelevant exploration and dead ends
- Cost: Next agent pays for all previous agent's context on every call
- Privacy: Previous customers' data may leak into next session

### Failure Mode 2 — Too Little (Information Loss)

```python
# ❌ WRONG — Only passing the final output
def handoff_to_next_agent(final_answer):
    next_agent_input = final_answer  # Only the conclusion
    run_next_agent(next_agent_input)
```

**Problems:**
- Lost constraints: "The user has a $500 budget" established in Turn 2 is gone
- Lost uncertainty: Next agent doesn't know what the previous agent was unsure about
- Lost alternatives: "I considered X but rejected it because Y" is valuable context
- No continuity: Next agent starts completely fresh when it needed some context

---

## The Five Handoff Patterns

### Pattern 1 — Structured State Object

The most reliable pattern. Extract key state into a typed object.

```python
@dataclass
class AgentHandoffState:
    """Explicit contract for what crosses agent boundaries."""
    
    # Task identity
    session_id: str
    task_description: str
    
    # Decisions and findings
    confirmed_facts: list[str]      # What is definitely true
    rejected_options: list[str]     # What was tried and ruled out
    open_questions: list[str]       # What still needs resolution
    
    # User constraints (MUST carry forward)
    user_constraints: dict          # Budget, preferences, hard requirements
    
    # Progress
    completed_steps: list[str]
    next_step: str
    
    # Uncertainty
    confidence_level: float         # 0.0 = very uncertain, 1.0 = certain
    low_confidence_areas: list[str] # What the previous agent was unsure about

def extract_handoff_state(messages: list, agent_output: str) -> AgentHandoffState:
    """Extract structured state from a completed agent session."""
    
    # Use Claude to extract the state
    extraction_response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1000,
        system=(
            "Extract a structured state summary from this agent session. "
            "Output JSON matching the AgentHandoffState schema exactly."
        ),
        messages=[{
            "role": "user",
            "content": f"Agent messages:\n{json.dumps(messages[-10:])}\n\n"
                       f"Agent final output:\n{agent_output}\n\n"
                       f"Extract state as JSON."
        }]
    )
    
    state_dict = json.loads(extraction_response.content[0].text)
    return AgentHandoffState(**state_dict)
```

---

### Pattern 2 — Compressed Summary Handoff

Summarise the session into a concise, structured narrative.

```python
def create_session_summary(messages: list, task: str) -> str:
    """Create a compressed summary for handoff."""
    
    summary_response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=800,
        system=(
            "Create a concise handoff summary. "
            "Include: what was accomplished, key decisions made, "
            "constraints established, open questions, and recommended next step. "
            "Be specific and factual. Maximum 500 words."
        ),
        messages=[{
            "role": "user",
            "content": f"Original task: {task}\n\n"
                       f"Session history (last 10 messages):\n"
                       f"{format_messages(messages[-10:])}\n\n"
                       f"Create handoff summary."
        }]
    )
    
    return summary_response.content[0].text

# Usage:
summary = create_session_summary(agent_a_messages, original_task)

# Agent B starts with only the summary, not the full history
agent_b_messages = [{
    "role": "user",
    "content": f"Continuing from previous session:\n\n{summary}\n\n"
               f"Your task: {agent_b_task}"
}]
```

---

### Pattern 3 — Checkpoint/Resume for Long Sessions

For sessions that might run for hours or days, save checkpoints.

```python
class SessionCheckpoint:
    def __init__(self, session_id: str, storage_backend):
        self.session_id = session_id
        self.storage = storage_backend
    
    def save(self, messages: list, metadata: dict):
        """Save checkpoint after each significant step."""
        checkpoint = {
            "session_id": self.session_id,
            "timestamp": datetime.now().isoformat(),
            "messages": self.compress_messages(messages),  # Compress old turns
            "metadata": metadata,
            "resume_context": self.extract_resume_context(messages)
        }
        self.storage.save(self.session_id, checkpoint)
    
    def compress_messages(self, messages: list) -> list:
        """Keep recent messages verbatim; compress older ones."""
        if len(messages) <= 6:
            return messages
        
        # Keep last 6 messages verbatim
        recent = messages[-6:]
        
        # Summarise everything before
        older = messages[:-6]
        summary = self.summarise(older)
        
        return [{"role": "user", "content": f"[Previous session summary]: {summary}"}] + recent
    
    def resume(self) -> tuple[list, dict]:
        """Load checkpoint and resume the session."""
        checkpoint = self.storage.load(self.session_id)
        if not checkpoint:
            return [], {}
        
        return checkpoint["messages"], checkpoint["metadata"]
```

---

### Pattern 4 — Explicit Next-Action Handoff

The previous agent specifies exactly what the next agent should do.

```python
# Previous agent ends with an explicit handoff instruction
HANDOFF_SYSTEM = """
At the end of your task, output a handoff block:

<handoff>
{
  "summary": "What I accomplished in 2 sentences",
  "state": {
    "key_findings": [...],
    "user_constraints": {...},
    "open_questions": [...]
  },
  "next_action": {
    "agent": "writer_agent",
    "task": "Write a 500-word recommendation based on state above",
    "must_include": [...],
    "must_not_include": [...]
  }
}
</handoff>
"""

# Coordinator parses the handoff and routes to next agent
def parse_and_route_handoff(agent_output: str) -> None:
    import re
    match = re.search(r'<handoff>(.*?)</handoff>', agent_output, re.DOTALL)
    if match:
        handoff = json.loads(match.group(1))
        next_agent = handoff["next_action"]["agent"]
        next_task = (
            f"Task: {handoff['next_action']['task']}\n\n"
            f"Context from previous agent:\n{json.dumps(handoff['state'])}\n\n"
            f"Must include: {handoff['next_action']['must_include']}"
        )
        route_to_agent(next_agent, next_task)
```

---

### Pattern 5 — RAG-Based Handoff

For very long sessions, don't pass context linearly. Store findings in a retrieval system and let the next agent query what it needs.

```python
class RAGHandoff:
    """Store findings; let next agent retrieve what's relevant."""
    
    def __init__(self, vector_store):
        self.store = vector_store
    
    def store_findings(self, session_id: str, findings: list[dict]):
        for finding in findings:
            self.store.upsert(
                id=f"{session_id}_{finding['id']}",
                text=finding['content'],
                metadata={"session_id": session_id, "type": finding['type']}
            )
    
    def retrieve_for_next_agent(self, session_id: str, next_task: str) -> list:
        """Retrieve only findings relevant to the next task."""
        relevant = self.store.search(
            query=next_task,
            filter={"session_id": session_id},
            top_k=5
        )
        return [r.text for r in relevant]

# Usage:
rag = RAGHandoff(vector_store)
rag.store_findings(session_id, agent_a_findings)

# Next agent only gets relevant context
relevant_context = rag.retrieve_for_next_agent(session_id, next_task)
agent_b_context = "\n".join(relevant_context)
```

---

## Choosing the Right Pattern

| Scenario | Best Pattern |
|---|---|
| Agent A → Agent B (same session) | Structured State Object |
| Long session pause/resume | Checkpoint/Resume |
| Complex multi-step pipeline | Explicit Next-Action Handoff |
| Very long research session (100+ turns) | RAG-Based Handoff |
| Quick summary needed | Compressed Summary |

---

## Key Concepts Learned Today

| Term | Definition |
|---|---|
| Handoff | Transfer of state between agents or across session boundaries |
| Context dump | Anti-pattern: passing raw conversation history to the next agent |
| Information loss | Anti-pattern: passing only the final output with no context |
| Structured state | Explicit typed object containing exactly what the next agent needs |
| Checkpoint | Saved session state enabling pause and resume |
| Compressed summary | Structured narrative of key findings, decisions, and next steps |
| RAG-based handoff | Storing findings in a retrieval system for on-demand access |

---

## Hands-On Task 🛠️

**Task 1:** Implement `AgentHandoffState`. Build an extractor that takes the last 10 messages of an agent session and produces a populated state object.

**Task 2:** Build a two-agent pipeline: Agent A researches a topic, creates a handoff state, Agent B receives only the state and writes a report. Verify B never accesses A's raw messages.

**Task 3:** Implement the Checkpoint pattern. Run a 20-turn agent. Save a checkpoint every 5 turns. Simulate a crash at turn 12. Resume from the last checkpoint (turn 10).

**Task 4:** Deliberately create the "context dump" failure. Pass raw messages from Agent A to Agent B. Measure the token difference vs the structured handoff. Calculate the monthly cost difference at 1,000 sessions/day.

**Your work:**
> _(write here)_

---

## Q&A — Self-Assessment (6 Questions)

---

**Q1.** Agent A researches app store data for 8 turns. At turn 3, the user said "my budget is $10 maximum." At turn 8, Agent A finishes. The handoff goes to Agent B which writes a recommendation. How do you ensure Agent B knows about the $10 budget constraint even though it was established early in Agent A's session?

> **Your answer:**
> _(write here)_

---

**Q2.** Your checkpoint system saves every 5 turns. The agent crashes at turn 23. You resume from the turn-20 checkpoint. What happened to the work done in turns 21-23? How do you minimise this loss?

> **Your answer:**
> _(write here)_

---

**Q3.** Agent A's session contains 50 turns of exploration, dead ends, and corrections. The final 5 turns contain the actual useful findings. You need to hand off to Agent B. Should you pass all 50 turns or extract from the last 5? What might you miss either way?

> **Your answer:**
> _(write here)_

---

**Q4.** You use the Compressed Summary pattern. The summary was written by Claude Haiku and is 400 words. Agent B reads the summary and asks a question that requires information from the original session that wasn't captured in the summary. How do you handle this?

> **Your answer:**
> _(write here)_

---

**Q5.** A handoff state object has a `confidence_level: 0.3` field (very uncertain). Agent B is the decision-making agent. How should Agent B interpret and act on this low confidence signal?

> **Your answer:**
> _(write here)_

---

**Q6 — Exam Scenario.** A legal research system has three agents: CaseResearchAgent (finds relevant cases), AnalysisAgent (analyses implications), WritingAgent (drafts the memo). The full research session produces 8,000 tokens of case research. Design the handoff from CaseResearchAgent to AnalysisAgent, and then from AnalysisAgent to WritingAgent. What crosses each boundary and why?

> **Your answer:**
> _(write here)_

---

## Answer Guide — Claude's Reference Answers

---

**Q1 — Preserving early constraints across handoff**

User constraints established at any point in a session must be explicitly captured and carried forward. They don't appear in Agent B's context unless you put them there.

**The fix — constraint extraction in handoff state:**

```python
@dataclass
class AgentHandoffState:
    user_constraints: dict  # Explicitly extracted, not discovered by reading history
    # ...

# When building the handoff state, SEARCH for constraints explicitly
def extract_user_constraints(messages: list) -> dict:
    constraint_response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=300,
        system="Extract ALL user-stated constraints from this conversation. "
               "Budget limits, preferences, requirements, exclusions. "
               "Output JSON: {budget_max: ..., preferences: [...], requirements: [...]}",
        messages=[{"role": "user", "content": format_messages(messages)}]
    )
    return json.loads(constraint_response.content[0].text)

# Budget $10 appears in turn 3 — the extractor finds it regardless
state = AgentHandoffState(
    user_constraints={"budget_max": 10, "currency": "USD"},
    # ...
)

# Agent B starts with this
"User constraints to respect: Budget maximum $10 USD. Do not recommend anything above this price."
```

**General principle:** User-stated constraints are the most critical handoff data. They should be actively extracted and explicitly labeled in the handoff — never left to be "remembered" from context.

---

**Q2 — Work lost between last checkpoint and crash**

Turns 21-23 represent 3 turns of work that is lost. The agent re-executes from turn 20.

**Minimising loss strategies:**

1. **Increase checkpoint frequency:** Check every turn instead of every 5. Cost: slightly more storage writes. Benefit: maximum 1 turn of work lost vs 4.

2. **Checkpoint on significant events, not intervals:** Save after each tool call result arrives, not on a timer. A turn with 3 tool calls gets 3 checkpoints.

3. **Make lost turns cheap to redo:** Design tool calls to be idempotent (safe to call again). If `get_app_details("ScreenshotAI")` was called in turn 22 and can be safely called again at resume, the "lost" work is trivial.

4. **Incremental state updates:** Instead of checkpointing the full messages array, checkpoint only the new state delta (what changed since last checkpoint). Then reconstruction is `checkpoint + deltas`.

For a 3-turn loss in a research session, re-execution costs more than the extra checkpoint storage. Checkpoint every turn for important sessions.

---

**Q3 — 50 turns vs last 5 turns**

**Extract from the full session, not just the last 5 — but intelligently.**

**What you miss with only last 5 turns:**
- The reasoning behind why certain approaches were rejected (turns 1-45 contain dead ends that matter — "I tried X but it failed because Y. B should not try X again.")
- Constraints established early ("budget $10" in turn 3 is gone)
- Confidence-building evidence (turn 15's finding that reinforced turn 30's conclusion)

**What you miss with all 50 turns:**
- Nothing factually — but Agent B must process 50 turns of noise to find signal

**The right approach — structured extraction from all 50:**

```python
# Don't pass 50 turns raw, but DO extract from all 50
state = AgentHandoffState(
    confirmed_facts=extract_all_confirmed_facts(all_50_turns),     # From everywhere
    rejected_options=extract_all_rejected_options(all_50_turns),   # Critical — B shouldn't retry
    user_constraints=extract_all_constraints(all_50_turns),        # May be early in session
    key_findings=extract_key_findings(last_10_turns),              # Usually in recent turns
    next_step=extract_next_step(last_5_turns)                      # Always most recent
)
```

The extraction reads all 50 turns but produces a concise, structured output for Agent B. B gets the signal without the noise.

---

**Q4 — Summary missing required information**

This is the fundamental limitation of compressed summaries — they're lossy by design.

**Handling the gap:**

**Option 1 — Escalate to source:** If the original session is still accessible (stored in database), fetch the relevant portion: "Summary doesn't have X — retrieving from original session archive."

**Option 2 — State uncertainty:** Agent B acknowledges the gap: "I don't have this information from the handoff. Based on what I do know: [answer with caveat]."

**Option 3 — Structured summary with appendix:** Design summaries with a "full details archive" attached:
```python
{
    "summary": "... 400-word summary ...",
    "key_data_points": {  # Queryable structured data
        "all_apps_evaluated": [...],
        "all_prices": {...},
        "all_ratings": {...}
    }
}
```
Agent B can query `key_data_points` for specifics not in the narrative summary.

**Prevention:** Before creating the summary, ask: "What questions might the next agent ask?" Ensure those questions are answerable from the summary. Test your summary by asking a sample of likely questions.

---

**Q5 — Low confidence signal (0.3) for decision agent**

**Agent B should treat low confidence as a trigger for verification, not a barrier to action.**

```python
# In Agent B's system prompt:
"""
If handoff state shows confidence < 0.5:
1. Identify which specific findings have low confidence (listed in low_confidence_areas)
2. For each low-confidence finding: either verify it with additional tool calls, or 
   explicitly flag it as uncertain in your output
3. Never make irreversible decisions based solely on low-confidence findings
4. If confidence is too low to make a reliable decision, request human review via <needs_human>
"""

# Agent B's response for confidence 0.3:
# "The previous research has low confidence (0.3/1.0) on the pricing data.
#  I'm verifying this before making a recommendation..."
# → calls get_price_history to verify
# → if verified: proceeds with confidence
# → if conflicting: flags the discrepancy
```

**The confidence level is a signal, not an instruction.** Agent B uses it to allocate additional verification effort — not to refuse to work. A 0.3 confidence on one finding doesn't mean all findings are uncertain.

---

**Q6 — Legal research three-agent handoffs**

**Handoff 1: CaseResearchAgent → AnalysisAgent**

```
CaseResearchAgent produced: 8,000 tokens of case research (raw)

What crosses the boundary (NOT 8,000 tokens):
{
  "relevant_cases": [
    {
      "citation": "Smith v. Jones, 2023",
      "key_holding": "One sentence summary of the holding",
      "relevance": "Why this case matters to our situation",
      "strength": "precedential/persuasive/distinguishable"
    }
    // 10-15 cases, ~100 tokens each = ~1,500 tokens
  ],
  "legal_principles_identified": [...],
  "jurisdiction_notes": "...",
  "research_gaps": ["Areas where no strong precedent found"],
  "confidence": 0.78,
  "research_date": "2026-04-30"
}
```

What does NOT cross: raw case text, search queries used, dead-end searches, full case citations explored and rejected.

**Handoff 2: AnalysisAgent → WritingAgent**

```
AnalysisAgent produced: Legal analysis of the cases

What crosses the boundary:
{
  "memo_structure": {
    "conclusion": "One sentence answer to the legal question",
    "argument_1": {
      "point": "...",
      "supporting_cases": ["Smith v. Jones"],
      "strength": "strong"
    },
    "argument_2": {...},
    "counterarguments": [...],
    "recommended_position": "..."
  },
  "tone": "formal_legal_memo",
  "audience": "senior_partner",
  "key_phrases_to_include": [...],
  "things_to_avoid": ["do not mention the Jones analysis — weak precedent"],
  "length": "5-7 pages"
}
```

What does NOT cross: AnalysisAgent's reasoning process, alternative analytical frameworks considered and rejected, the 8,000 tokens of case research (WritingAgent doesn't need raw cases — it needs the structured argument).

**The principle:** Each handoff gets progressively more curated. Research passes structured case list. Analysis passes structured argument outline. Writing receives a blueprint, not raw materials.

---

## Status

- [ ] AgentHandoffState implemented and tested
- [ ] Two-agent pipeline with handoff built
- [ ] Checkpoint pattern implemented (crash and resume tested)
- [ ] Context dump vs structured handoff token difference calculated
- [ ] All 6 questions answered
- [ ] Answer guide reviewed

---

## Coming Up — Week 10, Day 2

**Topic:** Confidence Calibration
Ask Claude to rate its own confidence. Use low-confidence signals to trigger human review or fallback paths. How to make confidence scores meaningful rather than arbitrary numbers.

---

*CCA Self-Study Log · Asif · Phase 4 of 5 · Week 10 of 12*
