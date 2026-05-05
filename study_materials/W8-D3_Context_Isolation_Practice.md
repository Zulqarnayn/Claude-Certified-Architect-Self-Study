---
layout: default
title: CCA Self-Study — Week 8, Day 3
---

# CCA Self-Study — Week 8, Day 3
## Context Isolation Practice

**Date completed:** _____________
**Study time:** 40–50 mins
**Curriculum phase:** Phase 3 — Agentic Architecture
**Exam domain:** Domain 1 · Agentic Architecture & Orchestration

---

## Core Concept

Context isolation keeps subagents independent by giving each agent only the data, tools, and instructions needed for its own sub-task.

---

## Key Topics

- Fresh message context per subagent call
- Preventing cross-agent data leakage
- Task-scoped prompts and tool access
- Isolation checks in orchestration code
- Common isolation anti-patterns

## Hands-On Task 🛠️

Write pseudocode for a coordinator that runs two subagents with fully isolated contexts.

**Your implementation:**
> _(write here)_

---

## Q&A — Self-Assessment

**Q1.** What is the fastest way to break context isolation in code?

> **Your answer:**
> _(write here)_

---

**Q2.** What data should a subagent receive by default?

> **Your answer:**
> _(write here)_

---

## Answer Guide

<details>
<summary><b>Q1 — Fastest isolation failure</b></summary>

Reusing a shared `messages` array across multiple subagents or sessions.

</details>

<details>
<summary><b>Q2 — Default subagent input</b></summary>

Only the sub-task instruction, relevant system prompt, and required tools for that specific step.

</details>

---

## Status

- [ ] Concept read and understood
- [ ] Q1 answered
- [ ] Q2 answered
- [ ] Hands-on task completed

---

*CCA Self-Study Log · Asif · Phase 3 of 5 · Week 8 of 12*
