# CCA Self-Study — Week 7, Day 2
## Human-in-the-Loop Systems

**Date completed:** _____________
**Study time:** 40–50 mins
**Curriculum phase:** Phase 3 — Evaluation & Optimization
**Exam domain:** Domain 2 · Quality Assurance

---

## Core Concept

For high-stakes decisions, Claude provides a first pass, but humans review and approve. Designing systems that mix automation with human judgment strategically.

---

## Key Topics

- Human review workflows
- Routing confidence-based decisions
- Annotation pipelines
- Cost-quality trade-offs in review
- Feedback loops to improve automation

## Hands-On Task 🛠️

Design a human-in-the-loop system for a medical triage use case.

**Your implementation:**
> _(write here)_

---

## Q&A — Self-Assessment

**Q1.** When should a decision route to human review vs auto-accept?

> **Your answer:**
> _(write here)_

---

**Q2.** How do you avoid human reviewers becoming a bottleneck?

> **Your answer:**
> _(write here)_

---

## Answer Guide

<details>
<summary><b>Q1 — Routing decisions for human review</b></summary>

Route to human when:
- Confidence < threshold (0.7 is common)
- High-stakes domain (medical, legal, financial)
- First encounter with pattern
- User explicitly requests review

Auto-accept when:
- Confidence > 0.95 AND low-stakes
- Well-tested, high-accuracy pattern
- Cost of error is acceptable

</details>

<details>
<summary><b>Q2 — Avoiding human bottleneck</b></summary>

- Batch reviews (don't interrupt per item)
- Prioritize high-confidence items for auto-accept
- Parallelize: distribute review across reviewers
- Build tools to speed review (highlighting, templates)
- Continuously train automation to reduce review burden

Aim: 80% auto-accept, 20% review.

</details>

---

## Status

- [ ] Concept read and understood
- [ ] Q1 answered
- [ ] Q2 answered
- [ ] Hands-on task completed

---

*CCA Self-Study Log · Asif · Phase 3 of 5 · Week 7 of 12*
