# CCA Self-Study — Week 6, Day 4
## A/B Testing and Experimentation

**Date completed:** _____________
**Study time:** 40–50 mins
**Curriculum phase:** Phase 2 — Advanced Patterns
**Exam domain:** Domain 9 · Optimization & Testing

---

## Core Concept

How do you know if a prompt change actually improves results? A/B testing and rigorous experimentation prevent guessing.

---

## Key Topics

- Statistical significance in A/B tests
- Prompt variant testing
- Model version comparisons
- Experiment design
- Avoiding biased conclusions

## Hands-On Task 🛠️

Design an A/B test comparing two prompt strategies for task accuracy.

**Your implementation:**
> _(write here)_

---

## Q&A — Self-Assessment

**Q1.** How many samples do you need for a statistically significant result?

> **Your answer:**
> _(write here)_

---

**Q2.** Why is randomization critical in A/B testing?

> **Your answer:**
> _(write here)_

---

## Answer Guide

<details>
<summary><b>Q1 — Sample size for significance</b></summary>

Depends on:
- Effect size (big difference = fewer samples needed)
- Variance (high variance = more samples)
- Statistical power (typically 80% power = 0.05 alpha)

Rule of thumb: 100+ samples per variant for robust results.

Use power calculators or run sequential analysis.

</details>

<details>
<summary><b>Q2 — Why randomization matters</b></summary>

Randomization prevents bias:
- Time-of-day effects (weekend ≠ weekday traffic)
- User selection bias (early adopters different from late ones)
- Confounding variables (weather, events, etc.)

Always randomly assign variant, not by user cohort/time.

</details>

---

## Status

- [ ] Concept read and understood
- [ ] Q1 answered
- [ ] Q2 answered
- [ ] Hands-on task completed

---

*CCA Self-Study Log · Asif · Phase 2 of 5 · Week 6 of 12*
