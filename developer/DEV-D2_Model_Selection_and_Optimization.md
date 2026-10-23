---
layout: note
title: "Model Selection and Optimization"
id: DEV-D2
part: developer
domain: context
order: 8012
kind: note
book: true
minutes: "60"
verified: "2026-10"
exam_domain: "CCDV-F · Model Selection & Optimization (16.8%)"
---

## Core Concept

Model choice is an **engineering trade-off you measure**, not a brand preference. The levers, in the order to pull them:

1. **Prompt caching** (free-ish win)
2. **Input hygiene** (send less)
3. **Batch** for non-urgent work (~50% off)
4. **Effort** (thoroughness vs tokens within one model)
5. **Model tier** (and routing between tiers)
6. **Fast mode / priority** (speed for money, narrow availability)

Judge by **cost per *completed task***, not per request: a cheaper request that needs three retries is not cheaper.

---

## Current Lineup (cached 2026-10-06; verify before quoting)

| Model | ID | Context | Input / Output per 1M | Use for |
|---|---|---|---|---|
| Fable 5.1 | `claude-fable-5-1` | 1M | $10 / $50 | Hardest reasoning, long-horizon agents; thinking always on |
| Opus 5.5 | `claude-opus-5-5` | 1M | $4 / $20 | Default for complex work, coding agents |
| Sonnet 5.5 | `claude-sonnet-5-5` | 1M | $2 / $10 | Everyday coding, agents, enterprise workloads |
| Haiku 5.5 | `claude-haiku-5-5` | 1M | $0.10 / $0.50 (prompts ≤100K) | Classification, routing, extraction, high-volume, subagents |
| Haiku 4.5 (legacy) | `claude-haiku-4-5` | 200K | $1 / $5 | Existing deployments |

Always look up current facts: `client.models.retrieve("claude-sonnet-5-5")` returns `max_input_tokens`, `max_tokens`, `capabilities`. Never construct model IDs from memory; use the exact strings (no date suffixes).

---

## Decision Framework

```
Is the task simple, high-volume, latency-sensitive? ──► Haiku 5.5 (verify on an eval)
Is it multi-step reasoning / coding / agentic? ──────► Sonnet 5.5 or Opus 5.5 (start lower, measure)
Does the hardest 5% fail on those? ──────────────────► route those to Opus 5.5 / Fable 5.1
Not interactive? ────────────────────────────────────► Batches
Repeating a large prefix? ───────────────────────────► caching
```

**Routing beats one-size-fits-all:** classify with a cheap model; escalate only what needs more. Caches are model-scoped, so route with **subagents or separate requests**, not mid-conversation model swaps.

**Before building a cascade**, test the simpler alternative: the stronger model at **lower effort**. Lower effort on newer models often matches higher effort on older ones, with one model = one cache namespace.

---

## Effort and Thinking

- `output_config: {effort: "low"|"medium"|"high"|"xhigh"|"max"}`; thinking is adaptive (`budget_tokens` removed).
- Defaults differ: `medium` on Opus 5.5 and Haiku 5.5, `high` on Sonnet 5.5. Set it explicitly.
- Rough guide: `low` chat/classification/subagents · `medium` cost-saving step-down where quality holds · `high` balanced · `xhigh` coding/agentic · `max` only when measurement shows headroom.
- Lower effort ⇒ fewer, more consolidated tool calls and terser output.
- Opus 5.5 / Fable 5.1: thinking cannot be disabled. Sonnet 5.5: send `thinking: {type: "between_tools"}` to turn it off (effort `high` or below).

## Cost Levers: Mechanics

| Lever | Mechanics | Watch out |
|---|---|---|
| Caching | reads ≈ 0.1× input, writes ≈ 1.25×; 5 min default TTL, `1h` option; min prefix size by model | Prefix must be byte-stable |
| Batches | ~50% cost; async; keyed by `custom_id` | No interactive use; not with fast mode |
| Input hygiene | Trim tool results, dedupe, summarize history, count with `count_tokens` | Don't silently truncate user data |
| Output hygiene | Ask for concise formats, structured outputs; set sane `max_tokens` | Hitting `max_tokens` truncates |
| Fast mode | Same model, up to 2.5× output speed, premium price; Opus 5.5 / Opus 5 / Opus 4.8; Claude API only; beta flag `fast-mode-2026-02-01` + `speed: "fast"` | Own rate limit; switching speed invalidates cache |
| Priority Tier | Capacity commitment | Not available on every current model |

## Migration Gotchas When Changing Models

| Change | Breaks |
|---|---|
| To Opus 5.5 / Fable 5.1 / Sonnet 5.5 | `thinking: disabled` and `budget_tokens` → 400; forced `tool_choice` any/tool → 400; prefill → 400; non-default `temperature`/`top_p`/`top_k` → 400 (on models where removed) |
| Tokenizer generation change | Token counts shift ~1–1.35×: re-baseline budgets and cost with `count_tokens` |
| Effort defaults differ | Re-run an effort sweep |
| Thinking-block binding | Do not edit earlier turns; keep harness append-only |

## Exam Traps

| Trap | Reality |
|---|---|
| "Use the biggest model; cost is the user's problem" | Right-size with evals |
| "Switch models mid-conversation to save money" | Cache invalidation; use subagents/routing |
| "Raise `budget_tokens`" | Removed; raise `effort` |
| "Batches for the chat UI" | Async only |
| "Cheapest per request = cheapest" | Per completed task |
| "200K context" | Current models are 1M (Haiku 4.5 legacy: 200K) |

## Hands-On Lab

Build `bench.py`: 100 labeled items → run Haiku 5.5 / Sonnet 5.5 / Opus 5.5 at 2 effort levels → table of accuracy, p50 latency, tokens, cost per correct answer. Recommend a routing policy with numbers. (This is also FDE portfolio P3.)

## Q&A — Self-Assessment

**Q1.** Classification of 5M short texts overnight: model + call shape?
**Q2.** Why not swap to a cheaper model for the second half of a long conversation?
**Q3.** Sonnet 5.5 `thinking: disabled` returns 400. Fix?
**Q4.** What is the first thing to try before a multi-model cascade?

<details markdown="1">
<summary markdown="span">Answers</summary>


1. Haiku 5.5 via Batches (+ cached instruction prefix), validated on an eval.
2. Caches are model-scoped (loses the cached prefix) and thinking blocks may not transfer; use a subagent/separate request.
3. Use `thinking: {type: "between_tools"}` (effort `high` or lower) or leave adaptive thinking and lower effort.
4. Same strong model at lower effort, measured on your eval.
</details>

*CCDV-F Track · Asif*
