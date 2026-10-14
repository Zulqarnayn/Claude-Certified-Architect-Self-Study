---
layout: default
title: CCA Self-Study — Week 11, Day 5
---

# CCA Self-Study — Week 11, Day 5
## Exam Scenario 5: Claude Code for Continuous Integration

**Date completed:** _____________
**Study time:** 45 mins
**Curriculum phase:** Phase 6 — Exam Scenarios (added 2026-10)
**Exam domain:** All 5 Domains — applied scenario (Claude Code 20%, Prompt/Structured Output 20% heavy)
**Last verified:** 2026-10

---

## Scenario Overview

Your platform team runs Claude Code in CI (GitHub Actions) to **review pull requests, generate tests, and post feedback**. Runs are non-interactive (`claude -p`). PRs come from employees and from external forks. Findings must be posted as inline PR comments, and certain severities must fail the build. Finance wants a cost ceiling per run.

---

## 8 Exam-Style Questions

**Question 1.**
The pipeline must post each finding as an inline comment (file, line, severity, message). Parsing Claude's prose with regex breaks weekly. What is the right approach?

A) Ask for "valid JSON only" in the prompt and `json.loads` the text
B) Add few-shot examples of the comment format
C) Use `--output-format text` and a stricter regex
D) Run `claude -p --output-format json --json-schema '<schema>'` and read the validated object from `structured_output`

**Question 2.**
The same PR gets different review behavior on two runners; one has a teammate's `~/.claude` hooks and MCP servers cached. What fixes reproducibility?

A) Use `--bare` so hooks, skills, plugins, MCP servers, auto memory, and CLAUDE.md are not auto-discovered, and pass needed context explicitly (`--append-system-prompt`, `--settings`, `--mcp-config`)
B) Pin the same Claude model on both
C) Delete the runners' home directories nightly
D) Lower temperature

**Question 3.**
The job reviews PRs from external forks. Why is running `claude -p` without `--bare` in the checked-out PR risky, and what is the best mitigation set?

A) Only the final comment is risky
B) It is not risky; Claude refuses malicious instructions
C) Repo-level hooks and `.mcp.json` from the PR can execute during the run (no trust prompt in `-p`). Use `--bare`, run in a sandbox without secrets, restrict to read-only tools, and deny anything that would prompt
D) Use a bigger model

**Question 4.**
Review time on large PRs reaches 4 minutes. Which change helps most without losing coverage?

A) Increase effort to `max`
B) Review only the diff (pipe `git diff` in), shard by file or module in parallel, and keep the review rules in a stable cached prefix
C) Skip files over 500 lines
D) Review once a week instead

**Question 5.**
Engineers complain about noisy, low-value comments. What most improves precision?

A) Add "be careful" to the prompt
B) Limit output to 3 comments always
C) Switch to a cheaper model
D) Define explicit criteria (what qualifies, severity rubric, require evidence in the diff), add few-shot examples of reportable vs non-reportable cases, and measure precision on labeled PRs

**Question 6.**
The build should fail only on `blocking` findings. How do you implement this reliably?

A) Use a schema with a `severity` enum; the pipeline code computes the exit status from the structured findings
B) Fail whenever any comment is posted
C) Search the text for the word "blocking"
D) Ask Claude to exit with code 1

**Question 7.**
Finance wants a per-run ceiling and reporting. What do you use?

A) Run only at night
B) Cap runs with turn/budget limits, read `total_cost_usd` from `--output-format json`, and log it per PR
C) Trust the monthly invoice
D) Disable thinking

**Question 8.**
The pipeline also generates unit tests for changed code. How should correctness be ensured?

A) Ask Claude to review its own tests
B) Generate tests only for new files
C) Run the tests (and lint) as external validation in a bounded fix loop; if still failing, surface to a human. Never auto-merge generated code on model confidence alone
D) Merge tests Claude marks as "high confidence"

---

## Full Answer Guide

**Q1 — D.** `--json-schema` returns a schema-validated object in `structured_output`. Prompted JSON and regex are the fragile path. (W13-D2, W13-D3.)

**Q2 — A.** Non-reproducibility comes from ambient configuration. `--bare` is the recommended scripted mode; supply context explicitly. Model pinning and temperature do not remove hooks/MCP differences.

**Q3 — C.** In `-p` mode there is no trust dialog or per-server approval, so repo hooks and `.mcp.json` run. Combine `--bare`, sandboxing, no secrets, read-only tools, and `dontAsk`/`--permission-prompts none` so anything needing approval is denied.

**Q4 — B.** Reduce input (diff only), parallelize independent shards, and keep stable rules cache-friendly. Skipping files loses coverage; `max` effort slows it.

**Q5 — D.** Precision is a criteria and evaluation problem. Explicit rubric + examples + labeled measurement. Arbitrary caps and cheaper models do not target false positives.

**Q6 — A.** Decisions come from structured data processed by code. Parsing prose or asking the model to set exit codes is unreliable.

**Q7 — B.** Enforce limits (`--max-turns`, `--max-budget-usd`) and record `total_cost_usd` per run (a client-side estimate; reconcile with the usage dashboard).

**Q8 — C.** External validation (tests, lint) in a bounded loop, then human review. Model self-assessed confidence is not evidence (W10-D2).

---

## Exam Prep Notes

- Pattern: **CI = deterministic envelope around a probabilistic core**: structured output in, code decides out.
- Pattern: **`--bare` + explicit config** for reproducibility and trust boundaries.
- Pattern: **bounded loops + external validation + human gate**.
- Cross-refs: W9-D4, W13-D2, W3-D4, W10-D2.

## Status

- [ ] All 8 answered before the guide
- [ ] Score: ___/8

## Coming Up — Week 11, Day 6

**Topic:** Exam Scenario 6: Structured Data Extraction.

*CCA Self-Study Log · Asif · Phase 6 · Week 11*
