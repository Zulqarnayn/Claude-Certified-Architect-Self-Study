---
layout: note
title: "Files, Batches, Citations, Server Tools, Security"
id: W13-D6
part: update
domain: context
order: 5016
kind: note
book: true
minutes: "60"
verified: "2026-10"
exam_domain: "Domain 5 · Context Management & Reliability (15%) + Domain 2 · Tool Design (18%) · CCDV-F: Applications & Integration (33.1%), Security & Safety (8.1%)"
---

## Core Concept

The remaining "application plumbing" an FDE ships in week one of an engagement: getting documents in, getting answers you can **trust and trace**, running volume cheaply, and letting Claude reach the web or a sandbox without you hosting it.

---

## 1. Documents In: PDFs, Images, Files API

- **Inline PDF:** `{"type": "document", "source": {"type": "base64", "media_type": "application/pdf", "data": b64}}`; put it **before** the text block. Base64 must contain no newlines. Limits: 32 MB request, 600 pages (100 pages on 200K-context models).
- **Files API** (GA, no beta header): `client.files.upload(...)` → `file_id`; reference as `{"type": "document", "source": {"type": "file", "file_id": "..."}}`. Upload once, reuse across requests. The block type must match the MIME type (`image` for images, `document` for PDF/text).
- Don't truncate silently when content exceeds the window: tell the user, then chunk/summarize deliberately.

## 2. Citations (no beta)

Set `citations: {"enabled": True}` on **each** `document` block (all or none). The response splits into several `text` blocks; cited ones carry `citations` with `cited_text`, `document_index`, `document_title`, and a location:

| Document type | Location type |
|---|---|
| Plain text | `char_location` (start/end char index) |
| PDF | `page_location` (1-indexed pages) |
| Custom content | `content_block_location` |

**Incompatible with `output_config.format`** (400). If you need both structure and traceability, put a `quote`/`source` field in your schema and verify it against the source in code, or run two calls.

This is the primary hallucination-control tool for document Q&A: answers you can click back to the source.

## 3. Message Batches: Volume at Half Price

For non-latency-sensitive bulk work (nightly classification, backfills, evals). Async, ~50% cost.

```python
batch = client.messages.batches.create(requests=[
    {"custom_id": f"doc-{i}", "params": {"model": "claude-haiku-5-5", "max_tokens": 1024,
                                          "messages": [{"role": "user", "content": text}]}}
    for i, text in enumerate(docs)
])
# poll until batch.processing_status == "ended", then:
for entry in client.messages.batches.results(batch.id):
    if entry.result.type == "succeeded":
        handle(entry.custom_id, entry.result.message)
    # errored | canceled | expired → retry those ids
```

- Results come back in **any order**: key by `custom_id`, never position.
- Per-request result types: `succeeded`, `errored`, `canceled`, `expired`. Retry the failures only.
- Not for interactive UX. Not combinable with fast mode. Server-side `fallbacks` parameter is rejected on Batches.
- Pair with caching for repeated prefixes; pair with Haiku 5.5 for cheap classification.

## 4. Server Tools: Anthropic Executes, You Don't Host

| Tool | Type | Notes |
|---|---|---|
| Web search | `web_search_20260209` | `max_uses`, `allowed_domains`/`blocked_domains`, `user_location` |
| Web fetch | `web_fetch_20260209` | Fetches only URLs already present in the conversation |
| Code execution | `code_execution_20260521` | Sandbox with bash + file sub-tools; results arrive as `bash_code_execution_tool_result` |
| Tool search | `tool_search_tool_*_20251119` | See D5 |

- The `_20260209` versions have **dynamic filtering** (code execution under the hood): do **not** also declare `code_execution`.
- **Server-tool errors do not raise.** HTTP 200 with a result block whose `content` is an error object (e.g. `max_uses_exceeded`). Success `content` is a list; error `content` is an object: branch before indexing.
- `stop_reason: "pause_turn"`: the server hit its iteration cap; re-send to continue.

## 5. Token Counting and Model Discovery

- `client.messages.count_tokens(...)`: authoritative; never use `tiktoken` for Claude. Tokenizer changed across generations (Opus 4.7+ tokenizer uses ~1–1.35× more tokens than older ones): re-baseline estimates when migrating.
- Models API: `client.models.retrieve(id)` → `max_input_tokens`, `max_tokens`, `capabilities`. There is no `context_window` field.

## 6. Security and Safety Basics (CCDV-F Domain: 8.1%)

| Threat | Control |
|---|---|
| **Prompt injection** via documents, web pages, tool results | Treat all retrieved content as data; keep instructions in system prompt; least-privilege tools; gate irreversible actions (hooks, `always_ask`, human approval) |
| Secrets exposure | Vaults / env credentials at egress; never put keys in prompts or tool results; sandbox networking `limited` |
| PII | Minimize what you send; redact before logging; mind data retention (Fable 5.1 requires 30-day retention, no ZDR unless authorized) |
| Over-broad agent permissions | Narrow `allowed_tools`, `dontAsk` in CI, deny rules on secrets paths |
| Safety classifier declines | Handle `stop_reason: "refusal"` (`stop_details.category`): enable server-side `fallbacks` where supported, log, never loop-retry blindly |
| Unattended runs | Session budgets, `max_turns`, kill switches |

---

## Decision Table

| Task | Pick |
|---|---|
| Q&A over a 200-page contract, must show source | Document block + citations |
| Same PDF queried 50× | Files API `file_id` + caching |
| Classify 2M support tickets overnight | Batches + Haiku 5.5 |
| "What's the latest on X?" | `web_search_20260209` |
| Analyze a CSV and chart it, no infra | `code_execution_20260521` |
| Strict JSON from documents | Structured outputs (no citations) |

## Exam Traps

| Trap | Reality |
|---|---|
| Read batch results by index | Order is arbitrary; use `custom_id` |
| Enable citations and JSON schema together | 400 |
| Expect an exception on web-search failure | HTTP 200 + error block |
| Declare code execution alongside `*_20260209` web tools | Don't: it confuses the model |
| Files API needs a beta header | GA now |
| Web fetch any URL Claude invents | Only URLs already in the conversation |

## Hands-On Task

1. Upload a PDF to the Files API; ask three questions with citations enabled; print `cited_text` and page numbers.
2. Run 200 classification requests through Batches with Haiku 5.5; compare cost with synchronous calls.
3. Make a web-search request that exceeds `max_uses`; handle the error block gracefully.
4. Plant an injection ("ignore previous instructions…") in a document; show your guardrails neutralize it.

## Q&A — Self-Assessment

**Q1.** Why can't you combine citations and a JSON schema, and what do you do instead?
**Q2.** Batch results arrive out of order. How do you map them?
**Q3.** A web search fails. What does your code see?
**Q4.** Name three controls against prompt injection in an agent that reads emails.

<details><summary>Answers</summary>

1. API returns 400. Add a verified `quote` field to the schema, or do a citations call then a structuring call.
2. By `custom_id`.
3. HTTP 200; the result block's `content` is an error object, not a list.
4. Treat email as data not instructions; least-privilege tools (no send/delete without approval); human confirmation or hook for irreversible actions; scope credentials; log and monitor.
</details>

## Status

- [ ] Citations demo done
- [ ] Batch run done
- [ ] Injection test done
- [ ] Q&A done

*CCA Self-Study Log · Asif · Phase 6 · Week 13*
