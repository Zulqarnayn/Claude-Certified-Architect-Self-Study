---
layout: note
title: "Security and Compliance"
id: W6-D2
part: extras
domain: mcp
order: 7017
kind: extra
book: true
minutes: "40–50"
verified: "2026-10"
exam_domain: "Domain 7 · Security & Governance"
---

## Core Concept

Claude systems handle sensitive data — user messages, business logic, credentials. Security and compliance are non-negotiable requirements.

---

## Key Topics

- Data privacy and retention
- Credential management
- Prompt injection defense
- Audit logging
- Compliance frameworks (GDPR, HIPAA, SOC2)

## Hands-On Task

Design a security checklist for a healthcare chatbot using Claude.

**Your implementation:**
> _(write here)_

---

## Q&A — Self-Assessment

**Q1.** Where should you store API keys, and what's the worst place?

> **Your answer:**
> _(write here)_

---

**Q2.** How do you prevent a user from manipulating Claude into breaking your system rules?

> **Your answer:**
> _(write here)_

---

## Answer Guide

<details>
<summary><b>Q1 — API key storage</b></summary>

Best places: Environment variables, Key Management Service (AWS KMS), HashiCorp Vault

Worst places: Hardcoded in code, in git, in frontend, in database, in logs

Use: `export ANTHROPIC_API_KEY=...` locally, secrets manager in production.

</details>

<details>
<summary><b>Q2 — Defending against prompt injection</b></summary>

- Prompt injection can't be 100% prevented
- Defense layers:
  1. Strong system prompt (not override-able)
  2. Input validation (filter malicious patterns)
  3. Output validation (schema enforcement)
  4. User context isolation (per-user system prompts)
  5. Monitoring (log suspicious patterns)

</details>

---

## Status

- [ ] Concept read and understood
- [ ] Q1 answered
- [ ] Q2 answered
- [ ] Hands-on task completed

---

*CCA Self-Study Log · Asif · Phase 2 of 5 · Week 6 of 12*
