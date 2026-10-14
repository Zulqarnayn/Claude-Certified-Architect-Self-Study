---
layout: default
title: CCDV-F Track — Day 3
---

# CCDV-F Track — Day 3
## Evals, Testing, and Debugging LLM Applications

**Date completed:** _____________
**Study time:** 60 mins
**Exam domain:** CCDV-F · Eval, Testing & Debugging (2.6%) — small on the exam, **central to FDE work**
**Last verified:** 2026-10

---

## Core Concept

You cannot unit-test "is the answer good" with `assert ==`. You need an **eval**: a fixed set of inputs, a grader, and a number you can track across prompt/model changes. Without one, every prompt tweak is a coin flip and every model migration is a leap of faith.

## 1. Build an Eval

| Step | Guidance |
|---|---|
| Source inputs | Real (anonymized) production traffic > synthetic. Cover easy, hard, edge, adversarial. 50–200 items beats 5 |
| Expected outputs | Exact labels where possible (classification, extraction fields) |
| Grader | **Code** first (exact match, field-level, schema, sum checks) → **LLM judge** for subjective criteria (with a rubric, pairwise or scored, calibrated against human labels) → human review for gold sets |
| Splits | Train/dev (tune prompts) vs held-out test (report). Tuning on the test set = overfitting |
| Metrics | Accuracy/precision/recall per field or class, cost per item, p50/p95 latency, refusal/error rate |
| Variance | Run multiple times when sampling or tools introduce randomness; compare distributions, not single runs |
| Regression | Run on every prompt/model/tool change in CI |

LLM-as-judge pitfalls: position bias, verbosity bias, self-preference, rubric drift. Mitigate with explicit rubrics, randomized order, a different judge model than the generator, and spot-checking against human labels.

**Agent evals:** grade the **outcome** (state changed correctly, tests pass) and the **trajectory** (tools used, steps, cost, forbidden actions). Cap steps so a stuck agent fails fast.

## 2. Test the Plumbing Deterministically

- Fake the client (or record/replay) to unit-test: error chain, retries, `stop_reason` branches, tool loop invariants, schema validators, cost math.
- Contract-test tools (inputs/outputs/error shape) independent of the model.
- Property tests for validators (totals sum, enums valid).
- Keep a small set of live "smoke" calls against the real API behind a flag.

## 3. Debug Systematically

| Symptom | First checks |
|---|---|
| Wrong/inconsistent answers | Is the failing input in your eval? Check prompt assembly (print the final request), few-shot quality, ambiguous instructions |
| 400 errors after model change | Removed params: prefill, forced `tool_choice`, `budget_tokens`, sampling params, disabled thinking |
| Truncated output | `stop_reason == "max_tokens"` |
| Tool never called / wrong tool | Tool descriptions, overlapping tools, `tool_choice`, result shape |
| Agent loops | Missing stop conditions, repeated identical calls, tool errors not returned as `is_error` |
| Cost spike | `usage` per request: cache misses (`cache_read_input_tokens == 0`), bloated tool results, retry storms |
| Cache not hitting | Timestamps/UUIDs in prefix, unstable JSON order, changing tools, prefix below minimum size |
| Missing JSON field | Schema enforcement not enabled, or `stop_reason` truncation |

Always keep the **request ID** from responses, and log (securely) the exact assembled request for failures.

Use the traces: Managed Agents sessions have a console viewer (transcript, per-tool stats, cost); Claude Code `--output-format stream-json` exposes every event.

## 4. Hill-Climbing Loop (How FDEs Improve a Prompt)

```
baseline eval ─► inspect failures ─► hypothesize ─► one change ─► re-run dev eval
      ▲                                                                │
      └───────── keep if better, revert if not; check held-out test ◄──┘
```

One change at a time; record every run; stop when the test set stops improving or budget is hit.

## Exam Traps

| Trap | Reality |
|---|---|
| "Eyeball 5 outputs" | Not an eval |
| Tune and report on the same set | Overfit; hold out a test set |
| LLM judge = ground truth | Needs calibration against humans |
| Debug only the prompt | Check request assembly, params, stop_reason, tools |

## Hands-On Lab 🛠️

1. Take the invoice extractor from W13-D3; write 40 labeled cases; code-grade per field.
2. Add a regression test that fails if field accuracy drops >2 points.
3. Introduce a bug (timestamp in the system prompt) and detect it through `cache_read_input_tokens` in a test.

## Q&A — Self-Assessment

**Q1.** Why a held-out test set?
**Q2.** Name two biases of LLM judges and a mitigation each.
**Q3.** Agent passes outcome checks but costs 5× more than last week. Which signal did you need?

<details><summary>Answers</summary>

1. To measure generalization; tuning against the same set inflates scores.
2. Position bias (randomize order); verbosity bias (rubric that rewards correctness, length-controlled comparison). Also self-preference (use a different judge model).
3. Trajectory metrics: steps, tool calls, tokens, cache hits, per-run cost.
</details>

*CCDV-F Track · Asif*
