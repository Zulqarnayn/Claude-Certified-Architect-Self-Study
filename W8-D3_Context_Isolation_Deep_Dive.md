# CCA Self-Study — Week 8, Day 3
## Context Isolation — Deep Dive

**Date completed:** _____________
**Study time:** 45–60 mins
**Curriculum phase:** Phase 3 — Agentic Architecture
**Exam domain:** Domain 1 · Agentic Architecture & Orchestration (27%)

---

## Core Concept

Context isolation is the single most tested property of multi-agent systems on the CCA exam. Every exam scenario involving multi-agent systems will test whether you understand what should and should not cross agent boundaries. Violations cause data leakage, cross-contamination, privacy failures, and incorrect outputs — often silently, which makes them the most dangerous class of bug.

**Definition:** Context isolation means each agent operates in its own independent context window, containing only the information specifically required for its task. No agent inherits another agent's context unless explicitly and intentionally designed to do so.

---

## The Analogy — Hospital Patient Privacy

A cardiologist treating Patient A should only know Patient A's cardiac history. They should not know Patient B's psychiatric records, Patient C's financial situation, or last week's cases unless directly relevant.

The hospital enforces this through access control — records are compartmentalised. The cardiologist's "context" is scoped to what they need.

When this breaks — when records are shared without purpose — it's called a HIPAA violation. In AI systems, the equivalent is context contamination. The consequences range from wrong answers to serious privacy violations.

---

## What Violates Context Isolation

### Violation 1 — Shared Messages Array

The most common mistake. A single `messages` list is shared across multiple agent calls.

```python
# ❌ WRONG — One messages array for multiple agents
messages = []

def run_agent_a(task_a):
    messages.append({"role": "user", "content": task_a})
    response = client.messages.create(messages=messages, ...)
    messages.append({"role": "assistant", "content": response.content})

def run_agent_b(task_b):
    messages.append({"role": "user", "content": task_b})
    # Agent B now has Agent A's full history!
    response = client.messages.create(messages=messages, ...)
```

**What happens:** Agent B reads Agent A's task, Agent A's tool calls, and Agent A's results. It may incorporate Agent A's findings into Agent B's output — or worse, generate responses that mix both agents' work.

```python
# ✅ CORRECT — Fresh messages for each agent
def run_agent_a(task_a):
    messages = [{"role": "user", "content": task_a}]  # Local, fresh
    response = client.messages.create(messages=messages, ...)
    return response.content[0].text

def run_agent_b(task_b):
    messages = [{"role": "user", "content": task_b}]  # Independent fresh context
    response = client.messages.create(messages=messages, ...)
    return response.content[0].text
```

---

### Violation 2 — Passing Coordinator Context to Subagents

The coordinator accumulates context over time. Passing this to subagents contaminates them.

```python
# ❌ WRONG — Subagent gets coordinator's full context
coordinator_messages = [
    {"role": "user", "content": "Research 3 apps for a user with budget $5"},
    {"role": "assistant", "content": "I'll coordinate this research..."},
    # ... many more coordinator messages ...
]

def run_research_subagent(task):
    # Subagent inherits coordinator's full context
    subagent_messages = coordinator_messages + [
        {"role": "user", "content": task}
    ]
    response = client.messages.create(messages=subagent_messages, ...)

# ✅ CORRECT — Subagent gets only its specific task
def run_research_subagent(task, context_data=None):
    subagent_messages = [
        {"role": "user", "content": 
         f"Task: {task}\n" + 
         (f"Context: {json.dumps(context_data)}" if context_data else "")}
    ]
    response = client.messages.create(messages=subagent_messages, ...)
```

---

### Violation 3 — Cross-Session State

Using a class or global variable that persists between different users' sessions.

```python
# ❌ WRONG — Class instance reused across sessions
class ResearchAgent:
    def __init__(self):
        self.messages = []  # Persists between sessions!
    
    def research(self, task):
        self.messages.append({"role": "user", "content": task})
        response = client.messages.create(messages=self.messages, ...)
        self.messages.append({"role": "assistant", "content": response.content})
        return response.content[0].text

agent = ResearchAgent()  # Created once, reused for all users

# User 1 researches "ScreenshotAI"
agent.research("Research ScreenshotAI for user1@example.com")

# User 2 researches something different
# But agent.messages still has User 1's data!
agent.research("Research Screenshotter for user2@example.com")
# User 2's result may reference User 1's data

# ✅ CORRECT — Fresh instance per session
def research_for_session(task):
    messages = [{"role": "user", "content": task}]  # Never persisted
    response = client.messages.create(messages=messages, ...)
    return response.content[0].text
```

---

### Violation 4 — Tool Results Carrying Hidden Context

Tool results that embed context from other sources contaminate the receiving agent.

```python
# ❌ WRONG — Tool result embeds other users' data
def get_user_profile(user_id):
    # Database query — but returns too much
    profile = db.query(f"""
        SELECT u.*, r.recent_queries, r.other_users_who_bought_same
        FROM users u
        JOIN recommendations r ON u.id = r.user_id
        WHERE u.id = '{user_id}'
    """)
    return profile  # Contains other users' data in recommendations!

# ✅ CORRECT — Tool result scoped to only what Claude needs
def get_user_profile(user_id):
    profile = db.query(f"""
        SELECT name, email, subscription_plan, created_at
        FROM users WHERE id = '{user_id}'
    """)
    return profile  # Only this user's data
```

---

## The Isolation Verification Tests

Before deploying a multi-agent system, run these tests:

### Test 1 — Context Independence Test

```python
def test_context_isolation():
    """Verify that subagent output doesn't change based on coordinator history."""
    
    # Run subagent without coordinator context
    result_isolated = run_research_subagent("Research ScreenshotAI")
    
    # Build a coordinator context (simulate a long coordinator session)
    coordinator_context = [
        {"role": "user", "content": "Process 5 different user requests"},
        # ... 20 more messages ...
    ]
    
    # Run subagent with coordinator context LEAKED (wrong way)
    result_contaminated = run_research_subagent_wrong(
        "Research ScreenshotAI",
        leaked_context=coordinator_context
    )
    
    # If results differ significantly, isolation is broken
    similarity = compute_similarity(result_isolated, result_contaminated)
    assert similarity > 0.95, f"Context leak detected! Similarity: {similarity}"
    
    print("✅ Context isolation verified")
```

### Test 2 — Cross-Session Test

```python
def test_cross_session_isolation():
    """Verify that Session 2 cannot access Session 1's data."""
    
    # Session 1: User with specific data
    session1_result = run_agent_for_session(
        user_id="user_001",
        task="What is my account balance?",
        inject_data={"balance": "$5,000", "account_id": "ACC-001"}
    )
    
    # Session 2: Different user, different task
    session2_result = run_agent_for_session(
        user_id="user_002", 
        task="What is my account balance?",
        inject_data={"balance": "$3,200", "account_id": "ACC-002"}
    )
    
    # Session 2 result must NOT mention Session 1's data
    assert "ACC-001" not in session2_result
    assert "$5,000" not in session2_result
    assert "user_001" not in session2_result
    
    print("✅ Cross-session isolation verified")
```

### Test 3 — Boundary Test

```python
def test_what_crosses_boundaries():
    """Explicitly verify what information is allowed to cross agent boundaries."""
    
    # These SHOULD cross boundaries (legitimate handoffs)
    legitimate_handoffs = [
        "Task description for the subagent",
        "Structured output from previous subagent (formatted summary)",
        "User preferences explicitly provided",
        "Configuration values from system setup"
    ]
    
    # These should NEVER cross boundaries
    prohibited_crossings = [
        "Full coordinator conversation history",
        "Other users' data",
        "Subagent A's raw tool call history (only its conclusions)",
        "Database credentials or API keys",
        "Internal system state not relevant to the task"
    ]
    
    # Document and enforce these rules in code review
```

---

## What CAN Cross Agent Boundaries (Legitimate Handoffs)

Context isolation doesn't mean agents are completely siloed. Specific, intentional information transfer is legitimate.

| Crosses boundary | Does NOT cross |
|---|---|
| Task description | Full conversation history |
| Structured summary of findings | Raw tool call results |
| Specific data fields needed for task | All data from source agent |
| User preferences (provided by user) | Data from other users |
| Configuration (set by system) | Coordinator's reasoning process |
| Explicit handoff object | Implicit context accumulation |

### The Handoff Object Pattern

```python
@dataclass
class AgentHandoff:
    """Explicitly defines what crosses agent boundaries."""
    
    # Core task
    task_description: str
    
    # Only the specific data the next agent needs
    relevant_findings: dict    # NOT the full previous agent's output
    
    # User-provided context (safe to pass)
    user_preferences: dict
    
    # Configuration (safe to pass)
    output_format: str
    max_length: int
    
    # Explicitly excluded (document what NOT to include)
    # excluded: full_coordinator_history, other_user_data, raw_tool_results

def create_writer_handoff(research_result: dict, user_query: str) -> AgentHandoff:
    """
    Build a handoff from researcher to writer.
    Intentionally extracts only what writer needs.
    """
    return AgentHandoff(
        task_description=f"Write a recommendation based on: {user_query}",
        relevant_findings={
            "top_apps": research_result["top_3_apps"],  # Curated, not raw
            "key_comparison_points": research_result["comparison"],
            "price_summary": research_result["price_range"]
            # NOT: research_result["raw_search_results"]
            # NOT: research_result["intermediate_steps"]
            # NOT: research_result["all_50_apps_found"]
        },
        user_preferences={"tone": "casual", "length": 500},
        output_format="markdown",
        max_length=600
    )
```

---

## Privacy-Critical Isolation Patterns

For systems handling sensitive data (PII, financial, medical), isolation becomes a compliance requirement.

### Pattern 1 — Data Minimisation in Tool Results

```python
# Before passing tool results to any agent, strip PII
def sanitise_for_agent(data: dict, fields_to_include: list) -> dict:
    """Only return fields the agent actually needs."""
    return {k: v for k, v in data.items() if k in fields_to_include}

# Customer support agent only needs these fields
SUPPORT_AGENT_FIELDS = ["name", "plan", "support_history", "open_tickets"]
# Never include: SSN, payment_method_details, full_address

customer_data = get_customer_data(customer_id)
sanitised = sanitise_for_agent(customer_data, SUPPORT_AGENT_FIELDS)
```

### Pattern 2 — Agent-Specific Context Scoping

```python
class ScopedAgentContext:
    """
    Enforces what data an agent can access.
    Raises an error if agent tries to access out-of-scope data.
    """
    
    def __init__(self, allowed_data: dict, agent_name: str):
        self._data = allowed_data
        self._agent = agent_name
        self._access_log = []
    
    def get(self, key: str):
        if key not in self._data:
            raise PermissionError(
                f"Agent '{self._agent}' attempted to access '{key}' "
                f"which is not in its allowed scope. "
                f"Allowed keys: {list(self._data.keys())}"
            )
        self._access_log.append(key)
        return self._data[key]
    
    @property
    def access_log(self):
        return self._access_log
```

---

## Key Concepts Learned Today

| Term | Definition |
|---|---|
| Context isolation | Each agent has its own fresh context window, only its needed data |
| Shared messages array | Most common isolation violation — one list reused across agents |
| Cross-session contamination | Agent retaining state between different users' sessions |
| Handoff object | Explicit, intentional data structure that crosses agent boundaries |
| Data minimisation | Only including the fields an agent actually needs in its context |
| Context independence test | Verifying subagent output doesn't change based on coordinator history |
| Boundary crossing | What information legitimately moves between agents vs what must stay isolated |

---

## Hands-On Task 🛠️

**Task 1 — Reproduce a violation:**
Build a shared messages array between two agents. Ask Agent A to research "ScreenshotAI pricing" and Agent B to research "weather in Dhaka." Confirm that Agent B's response references ScreenshotAI data (violation confirmed).

**Task 2 — Fix the violation:**
Refactor to give each agent a fresh messages array. Confirm Agent B's response no longer references Agent A's task.

**Task 3 — Build the HandoffObject:**
Implement the `AgentHandoff` dataclass. Build `create_writer_handoff()`. Verify the handoff contains only the intended fields.

**Task 4 — Run the isolation tests:**
Implement all three test functions above. Run them against your hub-and-spoke system from D2. Fix any failures.

**Task 5 — Privacy audit:**
Review your tool implementations. For each tool, document: what data it returns, what fields the agent actually needs, and what should be stripped before passing to Claude.

**Your work:**
> _(write here)_

---

## Q&A — Self-Assessment (8 Questions)

---

**Q1.** You have a coordinator that runs 3 subagents sequentially. After Subagent A completes, the coordinator wants to pass A's key findings to Subagent B. How do you do this while maintaining isolation? What exactly should and should not be in B's context?

> **Your answer:**
> _(write here)_

---

**Q2.** A developer says: "I'll just pass the full coordinator messages array to every subagent — that way each subagent has maximum context." List four specific harms this causes.

> **Your answer:**
> _(write here)_

---

**Q3.** Your multi-agent system processes customer support tickets. Agent A handles Ticket 123 (billing issue). Agent B handles Ticket 456 (technical issue) for a different customer. They run concurrently using async code. What is the isolation risk with async concurrency, and how do you prevent it?

> **Your answer:**
> _(write here)_

---

**Q4.** An agent receives a tool result that contains a field `similar_users_who_had_this_issue: [user_id_1, user_id_2, ...]`. Should this cross into the agent's context? What privacy risk does it create, and how do you mitigate it?

> **Your answer:**
> _(write here)_

---

**Q5.** You're building a system where three subagents debate a decision (peer-to-peer). Each agent produces an independent recommendation. Should Agent B know what Agent A recommended before forming its own recommendation? Defend your answer with reasoning about isolation vs collaboration.

> **Your answer:**
> _(write here)_

---

**Q6.** Your subagent is a Python class instance that's created once and reused for all requests. It has a `self.context` attribute that accumulates data. At what point does this become an isolation violation, and how do you fix the class design?

> **Your answer:**
> _(write here)_

---

**Q7 — Exam Scenario.** A financial services multi-agent system has three agents: DataAgent (retrieves account data), AnalysisAgent (analyses risk), and ReportAgent (writes the report). A compliance audit finds that the DataAgent's raw query results — including account numbers, SSNs, and transaction histories — appear in the ReportAgent's context. This is a violation. Trace exactly how this violation occurred and redesign the data flow to prevent it.

> **Your answer:**
> _(write here)_

---

**Q8 — Deep Architecture.** Design an isolation architecture for a multi-agent medical diagnosis assistant. The system has: PatientHistoryAgent (reads patient records), SymptomAnalysisAgent (analyses current symptoms), DiagnosisAgent (proposes differential diagnoses), and TreatmentAgent (recommends treatment). Each agent handles sensitive medical data. Define: what data each agent receives, what crosses each boundary, what never crosses any boundary, and how you verify isolation at each step.

> **Your answer:**
> _(write here)_

---

## Answer Guide — Claude's Reference Answers

---

**Q1 — Passing A's findings to B while maintaining isolation**

The key is selective extraction — not forwarding A's full context, only its conclusions.

```python
# After Subagent A completes
raw_a_output = run_subagent_a(task_a)

# Extract only what B needs (your code, not Claude)
a_findings_for_b = {
    "top_result": raw_a_output["top_app"],
    "key_metric": raw_a_output["average_rating"],
    "recommendation": raw_a_output["recommendation"]
    # NOT included: raw_a_output["tool_calls"], a's messages, a's reasoning
}

# B gets a fresh context with only this summary
b_task = f"""
Analyse and expand on this research finding:
App: {a_findings_for_b['top_result']}
Rating: {a_findings_for_b['key_metric']}
Initial recommendation: {a_findings_for_b['recommendation']}

Your task: [B's specific task]
"""
b_messages = [{"role": "user", "content": b_task}]  # Fresh, no A history
result_b = run_subagent_b(b_messages)
```

**What should be in B's context:** A's structured output (the conclusions), the new task description, any user preferences relevant to B's work.

**What should NOT be in B's context:** A's full messages array, A's tool call history, A's intermediate reasoning, A's raw tool results, coordinator history.

---

**Q2 — Four harms of passing full coordinator context to subagents**

**Harm 1 — Privacy leakage across agents:** If the coordinator processed Customer A's data in a previous step, Customer A's data is now in the context of an agent working on Customer B. Customer B's agent may produce outputs referencing Customer A's information.

**Harm 2 — Context window inflation:** The coordinator's history may be 5,000–10,000 tokens. Each subagent call now costs 5,000 extra tokens of input. At 100 subagent calls/day, that's 500,000 wasted tokens daily — inflating cost with no benefit.

**Harm 3 — Reasoning bias:** Subagent B is supposed to independently analyse something. But it has Agent A's reasoning in context. B's "independent" analysis is now influenced by A's conclusions — you've lost the independence that makes multi-agent systems valuable.

**Harm 4 — Instruction conflict:** The coordinator's system instructions may conflict with the subagent's system instructions. When both are in context, Claude may follow the wrong one — producing unpredictable behaviour.

---

**Q3 — Async concurrency isolation risk**

The risk: if agents share any mutable state — a class attribute, a module-level variable, a cache — concurrent execution creates race conditions where Agent A's write to shared state is read by Agent B (and vice versa).

```python
# WRONG — shared mutable state with async
results_cache = {}  # Module-level, shared across all async tasks

async def run_agent(task, task_id):
    results_cache["current_task"] = task_id  # A writes
    response = await claude_call(task)
    # By this await, B may have overwritten results_cache["current_task"]
    log_completion(results_cache["current_task"])  # Logs B's task_id, not A's!
```

**Prevention:**

```python
# CORRECT — no shared mutable state
async def run_agent(task, task_id):
    # All state is local to this coroutine
    local_task_id = task_id  # Local variable, not shared
    response = await claude_call(task)
    log_completion(local_task_id)  # Always correct

# If you need coordination, use asyncio primitives:
async def run_agents_safely():
    results = await asyncio.gather(
        run_agent("task_a", "T001"),
        run_agent("task_b", "T002")
    )
    # Results returned as values, not written to shared state
```

The golden rule for async agent isolation: no mutable state shared between concurrent agent tasks. All state local to each coroutine or passed as return values.

---

**Q4 — similar_users field in tool result**

**Should NOT cross into the agent's context.** This field contains other users' IDs — data that belongs to a different user's record appearing in the current user's agent context.

**Privacy risk:** The agent might reference "users who had similar issues" by their IDs, incorporate their resolution paths, or — in a poorly designed system — fetch those users' data. Even just having their IDs in context creates a data retention issue (User B's ID is stored in User A's session log).

**Mitigation — strip before passing:**

```python
def get_support_context(ticket_id: str) -> dict:
    raw_data = fetch_ticket_data(ticket_id)
    
    # Explicitly exclude cross-user fields
    return {
        "issue_type": raw_data["issue_type"],
        "resolution_steps": raw_data["resolution_steps"],
        "escalation_history": raw_data["escalation_history"]
        # EXCLUDED: similar_users, related_tickets_from_others, 
        #           cross_user_patterns
    }
```

If you need the insight that "similar issues were resolved by X," extract only the resolution pattern — not the user IDs: `"common_resolution": "Reinstall the app and clear cache (resolved 47 similar cases)"`.

---

**Q5 — Peer-to-peer: should B know A's recommendation?**

**For genuine independence: No — B should NOT know A's recommendation.**

The value of peer-to-peer architecture is independent analysis. If B knows A recommended "proceed," B's recommendation will be anchored to that — a well-documented cognitive bias called anchoring. You end up with correlated recommendations that appear independent but aren't.

**For collaborative refinement: Yes — with careful design.**

If the use case is debate and refinement (Agent B critiques Agent A's recommendation), then B must know A's output. But this is a different pattern — it's explicitly sequential and collaborative, not independently parallel.

**The exam-correct answer:**
For the purpose of independent verification — keep agents isolated. For the purpose of sequential critique — allow controlled information flow. Document which pattern you're using and why.

**In practice:** Run in two phases. Phase 1: all agents produce independent recommendations (isolated). Phase 2: a synthesis agent receives all Phase 1 outputs and produces a final recommendation (this synthesis agent is allowed to see all Phase 1 outputs).

---

**Q6 — Class instance isolation violation**

The isolation violation occurs the moment `self.context` is modified by one request and that modification persists to the next request — even if the next request is for a different user or task.

```python
# This becomes a violation at request 2
class AgentService:
    def __init__(self):
        self.context = []  # Persists across all calls
    
    def handle_request(self, task):
        self.context.append({"role": "user", "content": task})
        response = client.messages.create(messages=self.context)
        self.context.append({"role": "assistant", "content": response.content})
        # context now has request 1 + request 2 combined
```

**Fix — never store request state in instance attributes:**

```python
class AgentService:
    def __init__(self):
        # Only store configuration, never request state
        self.model = "claude-haiku-4-5-20251001"
        self.system_prompt = "You are a research specialist..."
    
    def handle_request(self, task: str) -> str:
        # Context is LOCAL to this method call
        messages = [{"role": "user", "content": task}]
        response = client.messages.create(
            model=self.model,
            system=self.system_prompt,
            messages=messages
        )
        return response.content[0].text
        # messages is garbage collected after return — no persistence
```

The rule: class instance attributes should contain configuration (model name, system prompts, tool definitions). Request state (messages, user data, tool results) must be local to the method call.

---

**Q7 — Tracing and fixing the financial violation**

**How the violation occurred (trace):**

```
DataAgent (Step 1):
- Calls get_account_data(account_id)
- Tool returns: {name, SSN, account_number, transactions[...500 records...]}
- DataAgent appends this full result to its messages array
- DataAgent returns: its full messages array as "output"

Coordinator:
- Receives DataAgent's full messages array
- Passes it as context to AnalysisAgent

AnalysisAgent (Step 2):
- Receives DataAgent's messages (including raw tool result with SSN, account numbers)
- Does analysis, appends to the same messages context
- Returns its full context

Coordinator:
- Passes AnalysisAgent's full context (which includes DataAgent's raw results) to ReportAgent

ReportAgent (Step 3):
- Has full context from both previous agents
- RAW account numbers, SSNs, transaction histories are all in context
- They appear in the generated report
```

**Fixed data flow:**

```
DataAgent:
- Calls get_account_data() 
- Tool returns raw data (includes PII)
- DataAgent extracts ONLY what it needs: {risk_score, account_age, plan_type}
- Returns structured summary ONLY — NO raw tool results, NO PII

Coordinator → AnalysisAgent handoff:
{
  "risk_indicators": data_agent_output["risk_indicators"],
  "account_standing": data_agent_output["account_standing"]
  # NO account numbers, NO SSN, NO transaction details
}

AnalysisAgent:
- Receives sanitised summary only
- Performs analysis on aggregated metrics
- Returns: {risk_level, recommendation, confidence}

Coordinator → ReportAgent handoff:
{
  "risk_assessment": analysis_output["risk_level"],
  "recommendation": analysis_output["recommendation"],
  "customer_name": "Mr. Ahmed"  # Name only — retrieved separately by coordinator
  # NO account numbers, NO analysis details, NO raw data
}

ReportAgent:
- Receives only what appears in the final report
- Generates report using only provided, appropriate data
```

The fix: each handoff is a curated extraction — only the data that legitimately belongs in the next agent's context and eventually in the output.

---

**Q8 — Medical diagnosis isolation architecture**

```python
# WHAT EACH AGENT RECEIVES:

PatientHistoryAgent = {
    "receives": {
        "patient_id": "anonymised_id_only",  # NOT name, DOB, SSN
        "query": "What relevant history exists for the presenting complaint?"
    },
    "tools": ["read_medical_records"],
    "returns": {
        "relevant_conditions": [...],  # Filtered to relevant only
        "current_medications": [...],
        "relevant_allergies": [...],
        "relevant_family_history": [...]
        # NOT: full record, billing info, insurance, social history irrelevant to complaint
    }
}

SymptomAnalysisAgent = {
    "receives": {
        "current_symptoms": "provided by clinical system",
        "relevant_history": "structured output from PatientHistoryAgent",
        "NOT_included": "PatientHistoryAgent raw tool calls, patient PII"
    },
    "tools": [],  # No external tools — works with provided data only
    "returns": {
        "symptom_clusters": [...],
        "temporal_pattern": "...",
        "severity_assessment": "moderate"
    }
}

DiagnosisAgent = {
    "receives": {
        "symptom_analysis": "from SymptomAnalysisAgent",
        "relevant_history_summary": "condensed from PatientHistoryAgent output",
        "NOT_included": "raw patient records, other patients' data, billing data"
    },
    "tools": ["medical_knowledge_base"],  # Lookup only — no patient data access
    "returns": {
        "differential_diagnoses": [...],
        "confidence_per_diagnosis": {...},
        "recommended_tests": [...]
    }
}

TreatmentAgent = {
    "receives": {
        "confirmed_diagnosis": "from clinical staff review of DiagnosisAgent output",
        "patient_allergies": "specific field from PatientHistoryAgent",
        "current_medications": "specific field — for interaction checking only",
        "NOT_included": "raw patient records, diagnosis agent reasoning, other patients"
    },
    "tools": ["drug_interaction_checker", "treatment_protocol_lookup"],
    "returns": {
        "treatment_options": [...],
        "drug_interactions": [...],
        "contraindications": [...]
    }
}

# WHAT NEVER CROSSES ANY BOUNDARY:
NEVER_CROSSES = [
    "Patient SSN or government ID",
    "Full name (use anonymised ID instead)",
    "Insurance information",
    "Other patients' records",
    "Social history irrelevant to presenting complaint",
    "Billing and financial data",
    "Raw database query results",
    "Full medical record (only relevant subsections)"
]

# VERIFICATION AT EACH STEP:
def verify_handoff(handoff: dict, receiving_agent: str, boundary_rules: dict) -> bool:
    prohibited = boundary_rules[receiving_agent]["prohibited_fields"]
    for field in prohibited:
        if field in str(handoff):
            raise IsolationViolation(
                f"Prohibited field '{field}' found in handoff to {receiving_agent}"
            )
    return True
```

**The key design principles:**
1. Minimum necessary data at each boundary
2. Anonymisation at entry (patient_id not patient_name in most agents)
3. Human clinical review gates high-stakes transitions (diagnosis → treatment)
4. Automated verification of handoff contents
5. Audit log of every data field that crossed every boundary

---

## Status

- [ ] Shared messages violation reproduced
- [ ] Violation fixed and verified
- [ ] HandoffObject implemented
- [ ] All three isolation tests implemented and run
- [ ] Privacy audit of tools completed
- [ ] All 8 questions answered
- [ ] Answer guide reviewed

---

## Coming Up — Week 8, Day 4

**Topic:** Lifecycle Hooks & Guardrails
The most powerful production pattern for multi-agent systems. Intercept every tool call. Enforce cost limits, compliance rules, and safety checks programmatically. The distinction between prompt-based and hook-based enforcement — and why hooks win for critical rules.

---

*CCA Self-Study Log · Asif · Phase 3 of 5 · Week 8 of 12*
