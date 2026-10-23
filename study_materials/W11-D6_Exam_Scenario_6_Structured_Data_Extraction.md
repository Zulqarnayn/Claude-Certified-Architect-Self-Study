---
layout: note
title: "Exam Scenario 6: Structured Data Extraction"
id: W11-D6
part: practice
domain: prompting
order: 6016
kind: scenario
book: true
minutes: "45"
verified: "2026-10"
exam_domain: "All 5 Domains — applied scenario (Prompt/Structured Output 20%, Context/Reliability 15% heavy)"
---

## Scenario Overview

A finance-operations team extracts fields (vendor, invoice number, dates, line items, totals, tax) from **~2 million PDFs and scans**, including multi-page tables. Output feeds an ERP. Errors cost money; some documents are missing fields; auditors want to know where each value came from. Volume is overnight batch plus a small interactive "fix this one" UI.

---

## 8 Exam-Style Questions

**Question 1.**
The extractor occasionally prepends "Here is the JSON:" before the object, breaking the ERP loader. What is the best fix?

A) Use structured outputs (`output_config.format` json_schema, or `messages.parse()` with a Pydantic model) so the response is schema-valid
B) Add "output only JSON" in capitals
C) Pre-fill the assistant turn with `{`
D) Strip text before the first `{` with regex

**Question 2.**
Output is valid JSON, but line items do not sum to the invoice total in ~2% of documents. What do you add?

A) Lower temperature
B) Increase `max_tokens`
C) Trust the model's `confidence` field
D) Semantic validation in code (sum check, date sanity, vendor lookup) with a bounded retry that feeds the specific error back, then escalate to human review

**Question 3.**
Some invoices have no tax ID. The model sometimes invents plausible ones. How do you reduce fabrication?

A) Add more examples of invoices that all have tax IDs
B) Make every field required
C) Mark fields nullable/optional, instruct "return null when absent; never infer", and add an `evidence` field (quote or page) you verify in code
D) Use a larger model

**Question 4.**
The 2M-document backlog must finish overnight at the lowest cost. No one waits on results. What is the right setup?

A) Message Batches with a small model (e.g., Haiku 5.5), a cached shared instruction prefix, results mapped by `custom_id`, and only failed/expired items retried
B) Run the interactive UI path for everything
C) Synchronous calls on the largest model
D) One giant request with all documents

**Question 5.**
Auditors need each extracted value tied to a location in the source PDF. Citations and `output_config.format` cannot be enabled on the same request. What do you do?

A) Enable both anyway
B) Include `source_quote` and `page` in the schema and verify them against the document text in code, or run a citations pass and a structuring pass
C) Ask Claude to promise accuracy
D) Skip traceability

**Question 6.**
A model response contains `payment_terms: "NET-45"` but the ERP enum only allows `NET-30`, `NET-60`, `DUE-ON-RECEIPT`. What schema design prevents silent corruption?

A) Force the model to pick the closest enum value
B) Free-text string and clean up later
C) Enum including an `OTHER` value plus `payment_terms_raw` text, and route `OTHER` to review
D) Reject the document

**Question 7.**
Leadership asks whether to use Haiku 5.5 or Sonnet 5.5 for extraction. How do you decide?

A) Ask each model which is better
B) Build a labeled evaluation set, measure field-level precision/recall and cost per correct document for each model (and effort level), then choose the cheapest that meets the accuracy bar; re-run when prompts or models change
C) Always choose the cheapest
D) Pick the newest

**Question 8.**
Scanned invoices contain multi-page tables; the current pipeline OCRs to text and loses column alignment. A good redesign is:

A) Convert everything to CSV by hand
B) Skip tables
C) Increase OCR resolution only
D) Send pages to Claude as PDF/image document blocks (vision), upload via the Files API for reuse, split very long documents by page ranges (limit 600 pages / 32 MB per request), and validate totals

---

## Full Answer Guide

**Q1 — A.** Schema-enforced output removes the whole failure class. Prefill is removed on current models (400); prompt shouting and regex are patches.

**Q2 — D.** A schema guarantees shape, not truth. Validate semantics in code, retry with the *specific* error, cap attempts, escalate (W3-D4). Self-reported confidence is poorly calibrated (W10-D2).

**Q3 — C.** Absent data must have a legal representation (null) plus an instruction not to infer; evidence fields make fabrication detectable. Required fields *force* invention.

**Q4 — A.** Async, half-price batch fits a non-interactive backlog; small model for extraction; cache the shared prefix; `custom_id` mapping since order is arbitrary; retry only failures.

**Q5 — B.** Keep traceability by design: quote + page in the schema, verified against the source. Citations + `output_config.format` → 400.

**Q6 — C.** Never coerce unknown values into valid-looking ones. Give an escape hatch (`OTHER` + raw text) and route it to review.

**Q7 — B.** Model choice is an empirical question: eval set, per-field metrics, cost per correct document. "Newest" and "cheapest" are not decisions.

**Q8 — D.** Vision on page images/PDFs preserves layout; Files API avoids re-upload; respect page/size limits by chunking; totals validation closes the loop.

---

## Exam Prep Notes

- Pattern: **shape by schema, truth by validation, uncertainty by null + evidence**.
- Pattern: **bulk & async → Batches + small model + caching**.
- Pattern: **choose models with an eval, not a hunch**.
- Cross-refs: W3-D1..D5, W13-D3, W13-D6, W7-D1.

## Status

- [ ] All 8 answered before the guide
- [ ] Score: ___/8

## Coming Up — Week 13, Day 7

**Topic:** Mock Exam 3 (60 questions, weighted to the five domains).

*CCA Self-Study Log · Asif · Phase 6 · Week 11*
