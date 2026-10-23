---
layout: note
title: "P3 Extraction Pipeline and Eval Harness"
id: FDE-P3
part: fde
order: 9015
kind: note
book: true
---

**Phase:** 2 · **Hits:** Model Selection & Optimization (CCDV-F 16.8%), structured outputs, evals, batches · **Language:** Python · **Status:** [ ] not started

## Problem

Extract structured fields from messy documents (open dataset of invoices/receipts or public filings), prove accuracy, and recommend the cheapest model/effort that meets the bar. The deliverable is a **customer-style report**, not just code. Mirrors exam scenario 6.

## Scope

| Component | Detail |
|---|---|
| Schema | Pydantic model; nullable fields; `evidence` (quote + page) per field |
| Extraction | `messages.parse()` with document blocks; Files API for reuse |
| Validation | Semantic checks (sums, dates, enums); bounded retry with error feedback; escalation list |
| Bulk path | Message Batches + cached instruction prefix, `custom_id` mapping, per-item retry |
| Eval harness | 100+ labeled docs, field-level precision/recall, code graders, train/dev vs held-out test |
| Comparison grid | Haiku 5.5 / Sonnet 5.5 / Opus 5.5 × effort low/medium/high |
| Report | Accuracy by field, cost per correct document, latency, error taxonomy, recommendation |

## Build Plan

1. Dataset and labels (spend time here; this is the product).
2. Baseline extractor; first eval run.
3. Validation + retry; measure the lift.
4. Batch path; measure cost reduction.
5. Comparison grid with a script; chart results.
6. Write the report (2 pages) as if for a customer VP.

## Deliverables Checklist

- [ ] Repo with `bench.py`, tests, CI running a small eval on every change
- [ ] Results table + 3 charts
- [ ] 2-page report with recommendation and risks
- [ ] Regression test: fails if field accuracy drops more than 2 points
- [ ] Write-up: "Choosing a Claude model with an eval, not a hunch"

## Retrospective (fill after)

Which assumption was wrong · biggest cost lever · what I'd measure next.
