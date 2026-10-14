---
layout: default
title: P2 SwiftUI App with Agent Backend
---

# P2 — SwiftUI App + Python Agent Backend

**Phase:** 1 · **Hits:** Applications & Integration (CCDV-F 33.1%), agents, guardrails, streaming · **Stack:** SwiftUI client, FastAPI backend, Claude · **Status:** [ ] not started

## Problem

A customer-support assistant inside a mobile app: answers account/order questions, can perform bounded actions (e.g., cancel an order), escalates to a human. Mirrors exam scenario 1 and a typical FDE deliverable.

## Architecture

```
SwiftUI app ──(HTTPS, SSE)──► FastAPI backend ──► Claude (Tool Runner / manual loop)
                                   │                      │
                                   ├── auth, per-user limits, logging
                                   └── tools: get_customer, lookup_order, cancel_order*, escalate_to_human
                                        (* gated by approval)
```

- API key lives only on the backend; app authenticates users.
- Streaming via Server-Sent Events; Swift side uses `URLSession.bytes(for:)` and line parsing.
- Conversation state in SQLite/Postgres; resend history each turn.

## Requirements

| Area | Requirement |
|---|---|
| Tools | Typed, least-privilege; `cancel_order` requires explicit user confirmation in the UI |
| Guardrails | Hook-like checks in code: refund/cancel limits, prompt-injection tests, PII redaction in logs |
| Reliability | Typed error chain, retries with jitter, timeouts, idempotency keys on writes |
| Output | Structured escalation payload (customer ID, summary, actions taken, reason) |
| Observability | Per-request usage, cost, stop_reason, tool trace; cost dashboard screen in the app |
| Cost | Caching on the static system prompt; Haiku 5.5 triage vs Sonnet 5.5 resolution, chosen by eval |

## Build Plan

1. Backend chat endpoint, no tools, streaming; Swift chat UI.
2. Tools + Tool Runner; fixture "company" data.
3. Approval flow for `cancel_order` (UI sheet → confirmation token → backend executes).
4. Escalation handoff; guardrail tests; injection tests.
5. Eval set (40 conversations) and model/effort comparison.
6. Cost dashboard and README.

## Deliverables Checklist

- [ ] Public repo (app + backend), pytest + a few XCTest cases
- [ ] Architecture diagram and threat model (1 page)
- [ ] Eval table: resolution rate, escalation rate, cost per resolved conversation
- [ ] Screen recording of happy path, approval path, injection attempt blocked
- [ ] Write-up: "Streaming Claude into SwiftUI"

## Retrospective (fill after)

Metrics · surprises · what I'd change.
