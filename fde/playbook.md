---
layout: default
title: FDE Playbook
---

# FDE Playbook
## Discovery → Scope → POC → Production → Handover

**Last verified:** 2026-10 · Reuses: [W7-D1 Evals](../study_materials/W7-D1_Evaluation_Frameworks.md), [W7-D5 Rollout](../study_materials/W7-D5_Deployment_and_Rollout_Strategy.md), [W10-D1 Handoffs](../study_materials/W10-D1_Handoff_Patterns.md), [W13-D1 Build paths](../study_materials/W13-D1_Agent_SDK_and_Four_Ways_to_Build_Agents.md)

An FDE's job is turning an ambiguous business problem into a production system the customer keeps running after you leave. Technical skill is table stakes; **scoping, evidence, and communication** are the differentiators.

---

## 1. Discovery Questions

**Problem**
- What decision or task is slow, costly, or error-prone today? Who does it, how often, how long?
- What does "good" look like in a number (time saved, error rate, cost per case)?
- What happens when it is wrong? Who is hurt, how fast is it noticed?

**Data and systems**
- Where does the input live (docs, tickets, DBs, APIs)? Who owns access? Quality and volume?
- Which systems must the agent read/write? Auth model? Rate limits? Sandbox/test environments?

**Constraints**
- Data residency, retention, PII, regulatory regimes, audit needs?
- Latency expectations, peak load, budget per unit?
- Who approves actions the system takes? Which actions are irreversible?

**People**
- Who is the champion, the skeptic, the security reviewer, the day-to-day operator?
- How will users actually use it (UI, chat, API, email)?

## 2. Build-Path Decision (30 seconds)

| If… | Then |
|---|---|
| Single transformation (classify/extract/summarize) | One API call + structured outputs, no agent |
| Fixed multi-step pipeline | Workflow in code with model calls |
| Open-ended, tool-using task you will host | Tool Runner / manual loop (or Agent SDK for file/code work) |
| Long-running, scheduled, sandboxed, versioned | Managed Agents |

Start at the simplest rung that can meet the success metric.

## 3. Scoping Template (one page)

```
Problem statement:
Users / operators:
Success metric (baseline → target):
In scope / out of scope:
Inputs and systems (owners):
Actions the system may take (reversible / approval needed):
Risks (accuracy, injection, PII, cost, adoption):
Eval plan (dataset source, grader, pass bar):
Cost envelope (per unit / per month):
Milestones: POC (date) · Pilot (date) · Production (date)
Open questions / assumptions:
```

## 4. POC → Production Checklist

**POC (days to 2 weeks)**
- [ ] Labeled eval set from real data (50–200 items), baseline measured
- [ ] Simplest working system; ugly UI is fine
- [ ] Cost and latency per item recorded
- [ ] Demo on the customer's data, with failures shown honestly

**Pilot**
- [ ] Guardrails: least-privilege tools, approval gates for irreversible actions, hooks/permissions for hard rules
- [ ] Error handling (typed errors, retries with backoff), timeouts, idempotent writes
- [ ] Structured outputs + semantic validation + escalation path to a human
- [ ] Logging/observability: request IDs, usage, stop reasons, tool traces; PII redaction
- [ ] Prompt/versioning in source control; caching enabled; model chosen via eval
- [ ] Prompt-injection tests; secrets in a vault, not prompts

**Production**
- [ ] Staged rollout (shadow → % traffic → full) with kill switch
- [ ] Regression eval in CI for every prompt/model/tool change
- [ ] Budgets and alerts per tenant
- [ ] Runbook: top 5 failure modes and what to do
- [ ] Model migration plan (breaking changes are real: prefill, forced tool choice, thinking params)

## 5. Evals: What to Show the Customer

| Chart | Why |
|---|---|
| Accuracy by category vs baseline | Where it works, where it does not |
| Cost per correct item by model/effort | Decision support, not opinion |
| Latency p50/p95 | UX fit |
| Error taxonomy with examples | Builds trust through honesty |
| Human-escalation rate over time | Adoption and risk |

## 6. Communication Habits

- **Demo script:** problem (30s) → live on their data (3 min) → failure case and how it is handled (1 min) → numbers (1 min) → next step.
- **Written update (weekly):** shipped · metrics · risks · decisions needed from them.
- **Disagree with evidence:** show the eval, not an opinion.
- **Handover:** docs, runbook, recorded walkthrough, named owner on their side, 30-day support window.
- **Postmortem (blameless):** timeline · impact · root cause · what we changed.

## 7. Red Flags to Raise Early

- No access to real data, or no one who can judge outputs
- Success metric undefined, or "make it smarter"
- Irreversible actions with no approval path
- Unrealistic accuracy expectations on tasks humans disagree on
- No owner after launch

*Back to [roadmap](./roadmap.md).*
