---
layout: note
title: "Exam Scenario 4: Developer Productivity"
id: W11-D4
part: practice
domain: claude_code
order: 6014
kind: scenario
book: true
minutes: "45"
verified: "2026-10"
exam_domain: "All 5 Domains — applied scenario (Claude Code 20%, Tools/MCP 18% heavy)"
---

## Scenario Overview

An internal tool helps engineers **explore unfamiliar codebases, understand legacy systems, generate boilerplate, and automate repetitive tasks**. It is built on the Claude Agent SDK using built-in tools (Read, Edit, Bash, Grep, Glob) plus an internal **MCP server** that exposes ~60 company tools (ticketing, build status, service catalog). Repos are large (up to 2M lines). Teams share conventions through `CLAUDE.md` and project skills.

---

## 8 Exam-Style Questions

**Question 1.**
An engineer asks the agent to "understand how billing works" in a 2M-line monorepo. The agent starts reading files top-down and the context fills quickly. What is the best approach?

A) Read every file in `src/billing`
B) Delegate exploration to a read-only Explore-style subagent that uses Grep/Glob to locate relevant files and returns a concise map; keep the main context for the task
C) Raise the context limit
D) Ask the engineer to paste the relevant files

**Question 2.**
The agent edits a file based on a copy it read minutes ago; the engineer had changed the file meanwhile and the edit clobbered their work. Which design prevents this class of bug?

A) Tell the agent in the prompt to be careful
B) Run the agent on a faster model
C) Use the built-in edit tool (which rejects writes when the file changed since it was read) instead of `sed`/shell redirection via Bash
D) Lower the effort level

**Question 3.**
Security says the agent must never run `git push --force` and never read `.env`. Developers have it in `CLAUDE.md`, but an incident occurred. What should you add?

A) A reminder in every user prompt
B) Deny permission rules and a `PreToolUse` hook that exits with code 2 for matching commands/paths
C) A louder CLAUDE.md rule
D) A `PostToolUse` hook that reports violations

**Question 4.**
The MCP server exposes 60 tools. The agent frequently picks the wrong one. What is the most effective improvement?

A) Rewrite tool descriptions with clear purpose, inputs, and when *not* to use them; split overlapping tools along clear boundaries; load only relevant tools on demand (tool search / deferred loading)
B) Add a long paragraph to the system prompt describing all 60 tools
C) Switch to a larger model only
D) Force `tool_choice` to a single tool

**Question 5.**
In a long session, early grep output clutters the context and the agent starts ignoring the team's conventions. What combination helps most?

A) Repeat the conventions in every message manually
B) Disable Grep
C) Restart the conversation every 5 minutes
D) Keep conventions in `CLAUDE.md`/skills (reloaded reliably), push exploration into subagents, and use context editing/compaction for stale tool output

**Question 6.**
A team wants consistent boilerplate for new microservices (folder layout, logging, health checks). What is the best mechanism?

A) A hook that rewrites code after generation
B) Fine-tune a model
C) A project skill with the template and instructions (plus CLAUDE.md conventions), with generated code verified by the repo's tests/linters
D) A one-off prompt each time

**Question 7.**
An engineer wants an unattended overnight refactor of one service. Which setup is most appropriate?

A) Plan first for review, then run with a narrow `allowed_tools` list and `acceptEdits`/`dontAsk`, in an isolated branch or worktree/sandbox, with a turn or budget cap
B) Give it production credentials so it can verify
C) Default mode and wait for prompts
D) `bypassPermissions` on their laptop with full access

**Question 8.**
A developer types: "make the checkout faster." The agent immediately starts rewriting code. What is the architectural fix?

A) Nothing; autonomy is the point
B) Reduce tool access to read-only permanently
C) Run the agent three times and pick the best diff
D) Use plan mode or a clarifying step, and require a measurable target with a benchmark (e.g., p95 latency) before edits

---

## Full Answer Guide

**Q1 — B.** Exploration is the classic subagent job: own context window, read-only tools, returns a summary. Reading everything wastes context; a bigger window does not fix attention or cost.

**Q2 — C.** A dedicated edit tool can enforce a staleness invariant that opaque Bash cannot. This is the "promote to a dedicated tool when you need to gate/audit" principle.

**Q3 — B.** "Must never" → deterministic enforcement: deny rules and a `PreToolUse` hook (exit 2 blocks, stderr tells Claude why). CLAUDE.md is advisory; `PostToolUse` is too late.

**Q4 — A.** Tool selection quality is mostly description quality and boundary design (W5-D3, W6-D4). Tool search / deferred loading keeps irrelevant schemas out. Forcing one tool breaks the other 59 (and forced `tool_choice` is rejected on newer models).

**Q5 — D.** Layered: durable rules in files that reload, isolation via subagents, and clearing/summarizing within the session. Restarts and manual repetition do not scale.

**Q6 — C.** Skills package repeatable procedures loaded on demand; tests/linters are the external validation. Hooks that rewrite are fragile; fine-tuning is unnecessary.

**Q7 — A.** Unattended work: plan, least privilege, isolation (branch/worktree/sandbox), caps. `bypassPermissions` on a laptop and production credentials are the anti-patterns.

**Q8 — D.** Ambiguous goals need clarification and a measurable success criterion before action. Plan mode exists for exactly this.

---

## Exam Prep Notes

- Pattern: **exploration → subagent**, **rules → files**, **guarantees → hooks/permissions**.
- Pattern: **opaque Bash vs dedicated tools**: gate, audit, staleness checks, parallel safety.
- Pattern: **unattended = isolated + narrow + capped**.
- Cross-refs: W9-D1..D5, W13-D2, W5-D3, W6-D4.

## Status

- [ ] All 8 answered before the guide
- [ ] Score: ___/8

## Coming Up — Week 11, Day 5

**Topic:** Exam Scenario 5: Claude Code for CI.

*CCA Self-Study Log · Asif · Phase 6 · Week 11*
