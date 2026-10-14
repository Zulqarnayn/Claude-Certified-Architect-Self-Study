---
layout: default
title: CCA Self-Study — Week 13, Day 5
---

# CCA Self-Study — Week 13, Day 5
## Context Management: Effort, Adaptive Thinking, Editing, Compaction, Memory, Caching

**Date completed:** _____________
**Study time:** 60 mins
**Curriculum phase:** Phase 6 — 2026 Platform Update
**Exam domain:** Domain 5 · Context Management & Reliability (15%) · CCDV-F: Model Selection & Optimization (16.8%), Prompt & Context Engineering (11.0%)
**Last verified:** 2026-10

---

## Core Concept

Week 1 taught "the window is limited". With 1M-token windows, the problem changed: **long-running agents drown in stale context, and cost scales with what you resend.** Five levers, in the order to reach for them:

| Lever | Scope | What it does | Trade-off |
|---|---|---|---|
| **Prompt caching** | request prefix | Re-reads of a stable prefix cost ~0.1× | Any byte change in the prefix invalidates everything after it |
| **Effort + adaptive thinking** | per request | Controls thinking depth / token spend | Lower effort = fewer tool calls, terser |
| **Context editing** | within session | **Clears** old tool results / thinking blocks | Loses that detail; no summary |
| **Compaction** | within session | **Summarizes** earlier context server-side near the limit | Lossy summary; must echo compaction blocks |
| **Memory tool** | across sessions | Claude reads/writes a `/memories` directory | You implement storage |

Editing and compaction are *within* a session. Memory is *across* sessions. Long-running agents often use all three.

---

## 1. Prompt Caching

- **Prefix match.** Render order: `tools` → `system` → `messages`. Stable content first, volatile content (timestamps, per-request IDs, the user's question) **after** the last breakpoint.
- Top-level automatic caching: `cache_control={"type": "ephemeral"}` on `messages.create()` caches the last cacheable block. Max **4** breakpoints per request. Default TTL 5 min; `ttl: "1h"` available.
- Minimum cacheable prefix is model-dependent (roughly 512–4096 tokens). Shorter prefixes silently do not cache.
- **Verify:** `usage.cache_read_input_tokens` > 0 on repeat calls. Zero = a silent invalidator (`datetime.now()` in the system prompt, unsorted JSON keys, varying tool set).
- Cost shape: writes ≈ 1.25× input, reads ≈ 0.1× input.

**Agent-specific traps that break the cache:**

| Action | Effect | Workaround |
|---|---|---|
| Edit system prompt mid-session | Invalidates everything | Append a `{"role": "system", ...}` message to `messages[]` (supported on newer models; no beta header) |
| Switch models mid-session | Caches are model-scoped | Subagent with the cheaper model; keep main loop on one model |
| Add/remove tools mid-session | Invalidates | Tool search (appends schemas instead of swapping) |
| Change top-level `effort` mid-conversation | Invalidates the messages cache | Per-message effort system message (beta `mid-conversation-output-config-2026-07-01`, supported models) |

```python
response = client.messages.create(
    model="claude-sonnet-5-5", max_tokens=16000,
    cache_control={"type": "ephemeral"},
    system=large_policy_document,                     # stable → cached
    messages=[{"role": "user", "content": question}], # volatile → after the breakpoint
)
print(response.usage.cache_read_input_tokens)
```

---

## 2. Adaptive Thinking and Effort

```python
response = client.messages.create(
    model="claude-opus-5-5", max_tokens=16000,
    thinking={"type": "adaptive", "display": "summarized"},
    output_config={"effort": "high"},     # low | medium | high | xhigh | max
    messages=[...],
)
```

- `budget_tokens` is **removed** (400) on current models; use adaptive thinking + effort.
- On Opus 5.5 and Haiku 5.5 the default effort is `medium` (set it explicitly). Opus 5.5 / Fable 5.1: thinking cannot be disabled.
- `display` defaults to `omitted` (empty thinking text, but you still pay for thinking). Set `summarized` if you stream reasoning to users, else the UI shows a long pause.
- Tuning: `low` for subagents / chat / classification; `high`/`xhigh` for coding and long-horizon agents; `max` only where measured headroom exists. Judge **cost per completed task**, not per request.
- Task budgets (beta `task-budgets-2026-03-13`, min 20,000 tokens): advisory pacing for an agentic loop, not a hard cap.

---

## 3. Context Editing (beta `context-management-2025-06-27`)

```python
client.beta.messages.create(
    model="claude-opus-5-5", max_tokens=4096,
    betas=["context-management-2025-06-27"],
    context_management={"edits": [{"type": "clear_tool_uses_20250919"}]},   # or clear_thinking_20251015
    tools=[...], messages=[...],
)
```

Clears old tool results (optionally their inputs) or thinking blocks. **Not** compaction.

## 4. Compaction (beta `compact-2026-01-12`)

```python
response = client.beta.messages.create(
    betas=["compact-2026-01-12"],
    model="claude-opus-5-5", max_tokens=16000, messages=messages,
    context_management={"edits": [{"type": "compact_20260112"}]},
)
messages.append({"role": "assistant", "content": response.content})   # FULL content, not just text
```

Server summarizes earlier context when it nears the trigger (default 150K tokens). **Critical:** append `response.content`, never only the text. The compaction block is how the API replaces history on the next request; dropping it silently loses state.

## 5. Memory Tool

Client-side tool `{"type": "memory_20250818", "name": "memory"}`. Claude reads/writes a `/memories` directory; you implement the backend (Python/TS SDKs ship helper base classes). Use for cross-session facts (preferences, project state). Treat contents as untrusted input (prompt-injection path).

## 6. Scaling the Tool Set

**Tool search** (`tool_search_tool_regex_20251119` / `..._bm25_...`, mark tools `defer_loading: true`): load only relevant schemas on demand. Never defer *every* tool: the search tool itself and at least one other must be non-deferred (400 otherwise). **Skills** do the same for instructions (description in context, body on demand). **Programmatic tool calling** (`allowed_callers`) lets Claude script many tool calls in code execution so intermediate results never hit context.

---

## Decision Table

| Symptom | Fix |
|---|---|
| Same 20K-token system prompt every call, bill high | Caching (verify `cache_read_input_tokens`) |
| Agent loop 80 turns, old tool output irrelevant | Context editing |
| Single conversation will pass the window | Compaction |
| User expects the agent to remember last week | Memory tool / Managed Agents memory stores |
| 100 tools, 5 relevant per request | Tool search |
| Latency/cost high on simple routing | Lower effort, or Haiku 5.5 |
| Agent re-reads same docs every session | Cache + memory, not bigger context |

## Exam Traps

| Trap | Reality |
|---|---|
| "1M context removes the need for management" | Cost, latency, and attention degradation still scale with context |
| Compaction = context editing | Summarize vs clear |
| Echo only `response.content[0].text` after compaction | Lose state: append the full content |
| Put timestamps at the top of the system prompt | Kills caching |
| Raise `budget_tokens` to think more | Removed; raise `effort` |
| Cache across models | Caches are model-scoped |
| Count tokens with `tiktoken` | Use `messages.count_tokens` |

## Hands-On Task 🛠️

1. Take a 5K-token system prompt; call 3×; log `cache_creation_input_tokens` vs `cache_read_input_tokens`. Then add `datetime.now()` at the top and observe the miss.
2. Run one task at `effort` low / medium / high; tabulate tokens, turns, cost, quality.
3. Build a 30-turn tool loop; compare final context with and without `clear_tool_uses_20250919`.

## Q&A — Self-Assessment

**Q1.** Cache hit rate is zero on identical-looking requests. First three suspects?
**Q2.** What must you append after a compaction response?
**Q3.** Why use a subagent with a cheaper model instead of switching models mid-session?
**Q4.** Context editing or compaction for stale tool output you will never need again?

<details><summary>Answers</summary>

1. Timestamp/UUID in prefix; non-deterministic JSON key order; changing tool set (also: prefix below the minimum size).
2. The entire `response.content` including the compaction block.
3. Switching models invalidates the cache (caches are model-scoped); a subagent leaves the main loop's cache intact.
4. Context editing: clear it; no summary needed.
</details>

## Status

- [ ] Cache hit/miss observed
- [ ] Effort sweep done
- [ ] Q&A done

*CCA Self-Study Log · Asif · Phase 6 · Week 13*
