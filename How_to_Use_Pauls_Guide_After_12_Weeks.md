# How to Use Paul's Guide After the 12-Week Curriculum
## Integration & Gap-Fill Plan for CCA Exam Readiness

**Author:** Asif (based on curriculum comparison analysis)
**Purpose:** You've completed the 12-week self-study vault. This file tells you exactly which parts of Paul Larionov's guide to read, in what order, and why — so you're not re-reading things you already know.

**Paul's guide:** https://github.com/paullarionov/claude-certified-architect/blob/main/guide_en.MD

---

## The Honest Summary

Your 12-week curriculum covers **~80-85%** of Paul's guide. The conceptual foundations for Domains 1, 2, 4, and 5 are equivalent or deeper in your vault. Paul's advantage is **hands-on exam specificity** — he knows the exact CLI flags, SDK class names, built-in commands, and Domain 3 nuances that come from actually sitting the exam.

**Your strategy:** Don't re-read Paul's guide cover to cover. Use it surgically for the gaps only.

---

## Reading Priority Map

```
SKIP (already covered deeply)   → ~60% of Paul's guide
SKIM (covered, refresh only)    → ~20% of Paul's guide
READ CAREFULLY (genuine gap)    → ~20% of Paul's guide — THIS IS YOUR FOCUS
```

---

## PHASE 1 — READ CAREFULLY (Genuine Gaps)
### Estimated time: 90 minutes total

These are sections where Paul covers things your curriculum either missed entirely or treated too lightly.

---

### 1A. Claude Code Specifics — Domain 3 (20% of exam)
**From Paul's guide:** Chapter 5 — "Claude Code Configuration and Workflows"

**Read these subsections carefully:**

**5.3 — `.claude/rules/` Directory with YAML Frontmatter**
Your curriculum covered CLAUDE.md hierarchy but NOT this specific mechanism.
Key concept to learn:
```yaml
---
paths: ["src/api/**/*"]
---
Rules that only load when Claude edits files matching this pattern.
```
This is how you apply conventions to files scattered across the codebase (e.g., all test files) without a monolithic CLAUDE.md. The exam tests whether you know WHEN to use `.claude/rules/` with `paths:` vs a directory-level CLAUDE.md.

**The rule to memorise:**
- `.claude/rules/` with `paths:` → conventions that apply to files spread across many directories (tests, migrations, API files)
- Directory-level `CLAUDE.md` → conventions tied to one specific directory

---

**5.2 — `@path` Syntax in CLAUDE.md**
Your curriculum didn't cover this at all.
```markdown
# Project CLAUDE.md
Coding standards: @./standards/coding-style.md
Testing requirements: @./standards/testing-requirements.md
```
This makes CLAUDE.md modular — each package imports only relevant standards. The exam may present a scenario where a monolithic CLAUDE.md is growing too large and ask for the best solution.

---

**5.4 — Skills with SKILL.md Frontmatter (context: fork, allowed-tools)**
Your curriculum covered slash commands but missed the SKILL.md frontmatter parameters.

Key parameters to know:
```yaml
---
context: fork        # Runs skill in isolated subagent — verbose output doesn't pollute main session
allowed-tools: ["Read", "Grep", "Glob"]  # Restricts tools available to this skill
argument-hint: "Path to directory"       # Prompts developer when no argument given
---
```

**When to use `context: fork`:** When the skill produces a lot of output (exploration, analysis) and you don't want it filling the main session's context window.

---

**5.6 — Planning Mode vs Direct Execution**
This is the BIGGEST gap in your curriculum. Paul emphasises it heavily.

| Use Planning Mode | Use Direct Execution |
|---|---|
| Changes touch many files | Single-file fix with clear stack trace |
| Multiple viable approaches exist | Well-understood, unambiguous change |
| Architectural decisions (service boundaries) | Adding one validation check |
| Unfamiliar codebase | Previously understood code pattern |
| Library migrations affecting 45+ files | Documentation improvement |

**Combined approach:**
1. Planning mode → explore + propose a plan
2. User approves the plan
3. Direct execution → implement the approved plan

The **Explore subagent** is a specialist for codebase exploration. It isolates verbose discovery output from the main context.

---

**5.7 — `/compact` Command**
Built-in command that compresses context during long sessions.
- Summarises prior history to free up context window
- Risk: exact numeric values, dates, and specific details can be lost
- Use during long investigations when context fills with verbose tool output

---

**5.8 — `/memory` Command**
Built-in command for managing memory between sessions.
- Opens CLAUDE.md for editing directly from the CLI
- Information persists across sessions
- Use to store: project conventions, current work context, frequently used commands

---

**5.9 — `-p` Flag for CI/CD (IMPORTANT)**
Your curriculum used `--no-interactive`. Paul uses `-p` (or `--print`). These are related but the exam likely tests `-p` specifically.

```bash
# Non-interactive mode for CI/CD — the correct flag
claude -p "Analyze this pull request for security issues"

# With structured output
claude -p "Review this PR" --output-format json --json-schema '{"type":"object",...}'
```

The `-p` flag: processes the prompt, prints to stdout, exits. No waiting for user input.

---

### 1B. Claude Agent SDK — Specific Class Names
**From Paul's guide:** Chapter 3 — "Claude Agent SDK"

**Read these subsections:**

**3.2 — `AgentDefinition` Configuration**
Your curriculum taught the concept but not the SDK class name. The exam uses this terminology.

```python
agent = AgentDefinition(
    name="customer_support",
    description="Handles customer requests",
    system_prompt="You are a customer support agent...",
    allowed_tools=["get_customer", "lookup_order", "process_refund"]
)
```

Key point: `allowed_tools` enforces the **principle of least privilege** — each agent only gets the tools it needs.

**3.4 — The `Task` Tool for Spawning Subagents**
Your curriculum called this "coordinator invoking subagents via Python code." The SDK calls it the `Task` tool.

```python
# Coordinator's allowedTools must include "Task"
coordinator = AgentDefinition(
    allowed_tools=["Task", "get_customer"]
)
```

**Critical:** Subagents do NOT automatically inherit coordinator context. ALL context must be explicitly passed:
```
# Bad
Task: "Analyze the document"

# Good
Task: "Analyze the following document.
Document: [full document text]
Prior search results: [web search results]
Output format: [schema]"
```

**3.6 — `fork_session` and `--resume`**
```bash
# Resume a named session
claude --resume investigation-auth-bug

# fork_session creates an independent branch from shared context
# Both forks inherit context up to the branch point, then diverge
```

When to resume vs start new session:
- Resume: files haven't changed, context is still valid
- New session: files changed since last session, context is stale

---

### 1C. Batch API — Deeper Specifics
**From Paul's guide:** Chapter 7 — "Message Batches API"

**Read carefully:**

**7.3 — `custom_id` for correlation**
```json
{
  "custom_id": "doc-invoice-2024-001",
  "params": { "model": "...", "messages": [...] }
}
```
`custom_id` lets you: link results to original documents, re-submit ONLY failed documents on retry, avoid re-processing successful ones.

**7.4 — Handling failures in batches**
Pattern: submit 100, 95 succeed, 5 fail → identify failures by `custom_id` → fix strategy → re-submit only the 5 failed.

**7.5 — SLA Planning Math**
If you need a result in 30 hours and Batch API takes up to 24 hours:
- Submission window = 30 - 24 = **6 hours**
- Must submit batches no later than 24 hours before the deadline

---

### 1D. Context Management — Production Patterns
**From Paul's guide:** Chapters 11-12 — "Context Management" and "Preserving Provenance"

**Read these specific patterns:**

**11.1 — Extract Facts into a Separate Block**
Instead of relying on conversation history that degrades during summarisation, extract key facts into a persistent structured block:
```
=== CASE FACTS (always include in every prompt) ===
Customer ID: CUST-12345
Order: ORD-67890, Amount: $89.99
Issue: Damaged item
Request: Full refund
Status: Pending approval
===
```
This block goes in EVERY subsequent prompt, not just the first one.

**11.2 — PostToolUse Hook for Trimming Tool Results**
When a tool returns 40+ fields but you only need 5:
```python
@hook("PostToolUse", tool="lookup_order")
def trim_order_fields(result):
    return {
        "order_id": result["order_id"],
        "status": result["status"],
        "total": result["total"],
        "items": result["items"],
        "return_eligible": result["return_eligible"]
    }
```
This conserves context and reduces noise before Claude ever sees the result.

**11.3 — Position-aware Input (Lost-in-the-Middle)**
Place critical information deliberately:
```
[KEY FINDINGS — at the top]      ← Claude reads this reliably
[DETAILED RESULTS — middle]      ← May be missed in very long contexts
[ACTION ITEMS — at the end]      ← Claude reads this reliably
```

**11.4 — Scratchpad Files**
During long investigations, agent writes key findings to a file:
```markdown
# investigation-scratchpad.md
- PaymentProcessor inherits from BaseProcessor
- refund() called from 3 places: OrderController, AdminPanel, CronJob
- Migration #47 added refund_reason (NOT NULL) — 2024-12-01
```
When context degrades or in a new session, the agent consults the scratchpad instead of re-running discovery.

**12.1-12.4 — Provenance Preservation**
When synthesising from multiple sources, preserve source attribution:
```json
{
  "claim": "AI music market estimated at $3.2B",
  "source_url": "https://example.com/report",
  "source_name": "Global AI Music Report 2024",
  "publication_date": "2024-06-15",
  "confidence": 0.9
}
```

When two sources conflict — preserve BOTH with attribution, never pick one arbitrarily:
```json
{
  "conflict_detected": true,
  "values": [
    {"value": "12%", "source": "Spotify Report 2024", "methodology": "Automated"},
    {"value": "8%", "source": "Industry Survey", "methodology": "Survey of 500 labels"}
  ],
  "possible_explanation": "Different methodology and time period"
}
```

Include dates — temporal differences get misread as contradictions without them.

---

## PHASE 2 — SKIM (Covered, Quick Refresh)
### Estimated time: 45 minutes total

These are areas your curriculum covered well. Just skim Paul's version to confirm alignment and catch any terminology differences.

---

**Chapter 1 — Claude API Fundamentals**
You covered this in W1 and W4. Paul's version is clear but adds nothing new except one nuance:

> **System prompt wording can create unintended tool associations.** An instruction like "always verify the customer" can cause the model to overuse `get_customer` even when unnecessary.

Skim the tables in sections 1.3 (stop_reason) and 1.5 (context window problems). Confirm you know all 4 stop_reason values and what to do for each.

---

**Chapter 2 — Tools and tool_use**
You covered this in W5. Skim section 2.3 on `tool_choice` parameter:

| Value | Behaviour |
|---|---|
| `{"type": "auto"}` | Claude decides — default |
| `{"type": "any"}` | Must call SOME tool — guarantees structured output |
| `{"type": "tool", "name": "X"}` | Must call THIS specific tool — forces execution order |

The forced selection pattern (`tool_choice: {"type": "tool", "name": "extract_metadata"}`) is tested on the exam as a way to guarantee a specific first step in a pipeline.

---

**Chapter 3 — Agent SDK (partially)**
Skim sections 3.1 and 3.3. Confirm your mental model matches Paul's description of the coordinator-subagent pattern. Pay attention to one sentence:

> **"All communication flows through the coordinator (for observability and error control)."**

This is the exam answer whenever a question asks about direct subagent-to-subagent communication.

---

**Chapter 4 — MCP**
You covered this in W6. Skim sections 4.3 (configuration via `.mcp.json`) and 4.4 (`isError` flag).

Key exam point from this chapter: `.mcp.json` at project root for team use (committed to git), `~/.claude.json` for personal/experimental servers (not shared).

---

**Chapter 6 — Prompt Engineering**
You covered this in W2-W3. Skim section 6.1 (few-shot) and 6.2 (explicit criteria vs vague instructions). Paul's explicit vs vague table is a good exam reminder:

```
BAD:  "Be conservative — report only high-confidence findings"
GOOD: "Flag only if: comment contradicts actual code behaviour, OR
       comment references a non-existent function, OR
       TODO refers to a bug already fixed in code"
```

---

**Chapter 8 — Task Decomposition**
You covered this in W7. Skim the comparison between fixed pipelines vs dynamic decomposition. Memorise when to use each:
- Fixed pipeline → predictable, repeatable tasks
- Dynamic decomposition → open-ended investigations where subtasks emerge from results

---

**Chapter 9 — Escalation**
You covered this in W11 scenarios. Skim Paul's escalation trigger table and the nuanced pattern:

> Acknowledge emotion → propose concrete solution → escalate ONLY if customer reiterates desire for human.

Do NOT escalate on first expression of dissatisfaction. Escalate when they explicitly ask for a human.

---

**Chapter 10 — Error Handling**
You covered this in W7-D4. Skim the error category table (transient/validation/business/permission). Confirm you know which are retryable.

---

## PHASE 3 — SKIP (Already Covered Deeply)
### No reading needed

These sections in Paul's guide are equivalent to or less detailed than what's in your curriculum. Skipping saves time without losing coverage.

| Paul's Chapter | Your Equivalent | Verdict |
|---|---|---|
| Ch.1 API request structure | W1-D5, W4-D1 | Skip — yours is more detailed |
| Ch.2 JSON schema design | W3-D3 | Skip — yours covers all schema rules |
| Ch.2 syntax vs semantic errors | W3-D3, W3-D4 | Skip |
| Ch.3 agentic loop pattern | W7-D1 through W7-D5 | Skip — your coverage is deeper |
| Ch.3 hooks theory | W8-D4 | Skip — your 8-question lesson is more thorough |
| Ch.4 MCP primitives overview | W6-D1, W6-D2 | Skip |
| Ch.5 CLAUDE.md hierarchy | W9-D2 | Skip — yours is equivalent |
| Ch.5 slash commands | W9-D3 | Skip — yours is equivalent |
| Ch.6 chain-of-thought | W2-D3 | Skip |
| Ch.6 validation + retry | W3-D4 | Skip |
| Ch.7 Batch API overview | W10-D5 | Skip — read 7.3-7.5 only (above) |
| Ch.8 decomposition strategies | W7-D2 | Skip |
| Ch.11 context basics | W10-D1 | Skip — read 11.1-11.4 only (above) |

---

## Paul's Practice Exam — How to Use It

Paul's guide ends with a 60-question practice test focused on 2 scenarios: Multi-Agent Research System and Claude Code for CI/CD.

**Your approach:**

**Step 1:** Do Paul's practice exam COLD first — no looking at answers. Time yourself.

**Step 2:** For each wrong answer, identify which chapter in Paul's guide explains it. Go read THAT section.

**Step 3:** Pay special attention to questions about:
- Planning mode (your gap)
- `-p` flag (your gap)
- `.claude/rules/` with paths (your gap)
- `Task` tool / `AgentDefinition` (terminology gap)
- `fork_session` (your gap)

**Step 4:** Cross-reference with your mock exam files (W12-D1 and Mock Exam 2). Questions that appear in BOTH exams are high-priority exam topics.

---

## Combined Study Plan — Final Days

Assuming you have 5-7 days before the exam:

| Day | Activity | Time |
|---|---|---|
| Day 1 | Phase 1A: Read Claude Code gaps (1C through 1D above) | 60 mins |
| Day 1 | Phase 1B: Read Agent SDK specifics | 30 mins |
| Day 2 | Phase 2: Skim the 8 chapters listed above | 45 mins |
| Day 2 | Paul's practice exam — cold attempt, no answers | 90 mins |
| Day 3 | Review Paul's practice exam answers | 60 mins |
| Day 3 | Re-read any Paul chapter that explains your wrong answers | 30 mins |
| Day 4 | Your Mock Exam 1 — timed (90 min) | 90 mins |
| Day 4 | Wrong answer analysis from Mock 1 | 45 mins |
| Day 5 | Your Mock Exam 2 — timed (90 min) | 90 mins |
| Day 5 | Wrong answer analysis from Mock 2 | 45 mins |
| Day 6 | Review weakest domain only (check your scores) | 60 mins |
| Day 7 | Light review of key tables and principles. Rest. | 30 mins |

---

## The 10 Things to Know That Paul Confirmed Are Exam-Tested

These appeared repeatedly in Paul's practice exam questions and explanations. Make sure you can answer these instinctively:

1. **Hooks vs prompts for financial rules** — hooks are deterministic (100%), prompts are probabilistic (>90%). For compliance: hooks. Always.

2. **Tool description is the primary selection mechanism** — when Claude picks the wrong tool, fix the description first. Not the model, not the system prompt.

3. **Subagents get isolated context** — they do NOT inherit coordinator history. Always pass context explicitly in the `Task` prompt.

4. **`-p` flag for CI/CD** — not `--no-interactive`. The exam uses `-p` (print mode).

5. **Planning mode for large/architectural changes** — exploration without side effects, then user approves before execution.

6. **`.claude/rules/` with `paths:` glob** — for conventions that apply to file types across the whole codebase, not one directory.

7. **`tool_choice: "any"`** guarantees a tool call. `tool_choice: {"type": "tool", "name": "X"}` forces a SPECIFIC tool first.

8. **Batch API = 50% savings + up to 24h wait** — use for overnight/weekly workloads, NOT for PR checks that block developers.

9. **Coordinator owns all communication** — subagents never talk to each other directly. Always through the coordinator.

10. **`custom_id` in Batch API** — for correlating results to inputs and re-submitting ONLY failed documents.

---

## Quick Reference: Our Lessons vs Paul's Chapters

| Paul's Chapter | Your Lesson File(s) |
|---|---|
| Ch.1 API Fundamentals | W1-D5, W4-D1, W4-D2, W4-D3 |
| Ch.2 Tools & tool_use | W5-D1 through W5-D5 |
| Ch.3 Agent SDK | W7-D1 through W7-D5, W8-D1 through W8-D5 |
| Ch.4 MCP | W6-D1 through W6-D5 |
| Ch.5 Claude Code | W9-D1 through W9-D4 |
| Ch.6 Prompt Engineering | W2-D1 through W2-D5, W3-D1 through W3-D5 |
| Ch.7 Batch API | W10-D5 (Batch API lesson) |
| Ch.8 Task Decomposition | W7-D2 |
| Ch.9 Escalation | W11-D1 (Exam Scenario 1) |
| Ch.10 Error Handling | W7-D4 |
| Ch.11 Context Management | W10-D1, W10-D2 |
| Ch.12 Provenance | W10-D1 (Handoff Patterns) |
| Ch.13 Built-in Tools | W6-D3, W6-D4 |
| Paul's Practice Exam | W12-D1 + Mock Exam 2 |

---

## Final Note

Paul's guide is based on actually passing the exam. Your curriculum is based on systematic first-principles learning. Together they're stronger than either alone.

Paul tells you WHAT the exam tests. Your curriculum explains WHY it works that way. When you understand the WHY (from your 12 weeks), the WHAT (from Paul's exam questions) becomes obvious — not just memorisation.

The gaps are real but small. One focused reading session fills them. You're ready.

---

*Integration guide created for Asif's CCA self-study vault*
*Paul's guide: github.com/paullarionov/claude-certified-architect*
