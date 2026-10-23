---
layout: note
title: "Applications and Integration"
id: DEV-D1
part: developer
domain: context
order: 8011
kind: note
book: true
minutes: "90"
verified: "2026-10"
exam_domain: "CCDV-F · Applications & Integration (33.1%)"
---

## Why This Is a Third of the Exam

The Developer exam is about **building**: calling the API correctly, surviving failure, streaming to users, and keeping cost and secrets under control. Most of the architect-track notes were about *design*; this one is *plumbing*. It is also exactly an FDE's first-week deliverable.

---

## 1. The Request Lifecycle You Must Handle

```
client ──► your backend ──► Messages API ──► response / stream
            │ auth, limits, logging         │ stop_reason, usage, request id
```

Every response: check `stop_reason` **before** using `content`.

| `stop_reason` | You should |
|---|---|
| `end_turn` | Use the answer |
| `tool_use` | Run tools, return `tool_result`s, continue |
| `max_tokens` | Output truncated: raise limit, stream, or continue; never parse partial JSON |
| `pause_turn` | Server tool hit its cap: re-send to continue |
| `refusal` | Safety decline: read `stop_details.category`, log, use fallback path |
| `stop_sequence` | Your custom stop hit |

Log per call: model, `usage` (input/output/cache read/write tokens), `stop_reason`, latency, and the response **request ID**: support will ask for it.

---

## 2. Errors and Retries (Python)

```python
import anthropic, random, time
client = anthropic.Anthropic(max_retries=2, timeout=60.0)   # SDK already retries 408/409/429/5xx/connection errors

def ask(messages):
    try:
        return client.messages.create(model="claude-sonnet-5-5", max_tokens=16000, messages=messages)
    except anthropic.NotFoundError:          # 404: bad model ID, fix config, do not retry
        raise
    except anthropic.RateLimitError as e:    # 429: back off (honor retry-after), maybe queue
        raise Retryable(e)
    except anthropic.APIStatusError as e:    # other non-2xx; e.type distinguishes overloaded_error etc.
        if e.status_code >= 500: raise Retryable(e)
        raise
    except anthropic.APIConnectionError as e:  # network failure before response
        raise Retryable(e)
```

Rules:
- Catch **most specific first**. A single `except APIError` loses retryable vs non-retryable.
- 400/401/403/404 are **not** retryable: they are your bug or config.
- Defaults: `max_retries=2`, timeout 10 min (Python seconds, TypeScript milliseconds). Timeouts are retried, so worst-case wall clock is `timeout × (retries+1)`: set timeouts deliberately.
- App-level retries (queues, circuit breakers) should use exponential backoff **with jitter** and a cap; make retried work idempotent.
- Rate limits: shed or queue load; spread bursts; use Batches for non-urgent volume; use caching to reduce input tokens per request.

---

## 3. Streaming to Users

Stream when: long outputs, high `max_tokens`, interactive UX. (The SDK requires streaming for very large `max_tokens`, e.g. 128K, to avoid HTTP timeouts.)

```python
# server-side generator feeding Server-Sent Events (FastAPI)
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import anthropic

app = FastAPI()
aclient = anthropic.AsyncAnthropic()

@app.post("/chat")
async def chat(body: ChatIn):
    async def sse():
        async with aclient.messages.stream(
            model="claude-sonnet-5-5", max_tokens=4096,
            system=SYSTEM, messages=body.messages,
        ) as stream:
            async for text in stream.text_stream:
                yield f"data: {json.dumps({'t': text})}\n\n"
            final = await stream.get_final_message()
            log_usage(final.usage, final.stop_reason)
            yield "event: done\ndata: {}\n\n"
    return StreamingResponse(sse(), media_type="text/event-stream")
```

- If you do not need token-level events, use `get_final_message()` and keep non-streaming code paths simple.
- On adaptive-thinking models, `display` defaults to `omitted`: set `thinking={"type":"adaptive","display":"summarized"}` if you want to show reasoning progress, otherwise users see a long pause before text.
- Handle disconnects: stop work when the client goes away (cancel the stream context).

**iOS note (your differentiator):** a SwiftUI client consumes this with `URLSession.bytes(for:)` and parses `data:` lines line-by-line; keep your backend as the only holder of API keys.

---

## 4. Conversation State

The API is **stateless**. Every request resends the history you want the model to see.

- Store messages server-side (DB/Redis) keyed by conversation ID; the client sends only the new turn.
- First message must be `user`; consecutive same-role messages are merged.
- Budget the window: use `messages.count_tokens` before sending; apply context editing/compaction (W13-D5) or your own summarization; never silently truncate user content.
- Tool-using conversations: store the **full assistant content** (including `tool_use` blocks) and matching `tool_result`s, or the next request is invalid.
- With thinking models, pass thinking blocks back unchanged on the same model (see W13-D5); do not edit earlier turns on models that bind thinking to history.

---

## 5. Secrets, Config, Observability

| Concern | Do |
|---|---|
| API key | Environment/secret manager; server-side only; never in a mobile app, repo, prompt, or log |
| Model IDs | Config, not constants scattered in code; use the exact ID strings (no invented date suffixes); look up capabilities with `client.models.retrieve(id)` |
| Cost | Compute from `usage`; alert on per-tenant spikes; per-request `max_tokens` caps |
| Logging | Redact PII; log IDs and token counts, not raw prompts, unless required and protected |
| Per-user limits | Enforce in your backend before calling Claude |
| Timeouts | Set explicit client + gateway timeouts; surface partial streams on disconnect |

---

## 6. Which Call Shape?

| Need | Use |
|---|---|
| Interactive answer | `messages.create` / stream |
| Typed output | Structured outputs (`messages.parse`) |
| Tools in your code | Tool Runner or manual loop |
| Bulk, no latency need | Message Batches (~50% cost) |
| Reuse a big document | Files API + caching |
| Hosted long-running agent | Managed Agents |

---

## Exam Traps

| Trap | Reality |
|---|---|
| Retry every exception | 4xx (other than 408/409/429) are not retryable |
| Parse JSON when `stop_reason == "max_tokens"` | Truncated: handle first |
| Keep the key in the mobile app | Proxy through your backend |
| Assume the API remembers the conversation | Stateless |
| `except Exception` around the call | Loses retryable vs not |
| Non-streaming for a 100K-token output | Timeout risk: stream |

## Hands-On Lab

Build a FastAPI service with:
1. `POST /chat` streaming SSE; conversation stored in SQLite.
2. A retry wrapper with the error chain above; unit tests that simulate 429 and 500 with a fake client.
3. Per-request cost logging from `usage` and a daily total endpoint.
4. A SwiftUI view that renders the stream (your portfolio piece P2).

## Q&A — Self-Assessment

**Q1.** A request returns 404 `model not found`. Retry?
**Q2.** Where does conversation history live?
**Q3.** The response has `stop_reason: "max_tokens"` and invalid JSON. What happened and what do you do?
**Q4.** Why not call Claude directly from the iOS app?

<details><summary>Answers</summary>

1. No: config bug (bad model ID). Fail fast, alert.
2. In your datastore; you resend it each call.
3. Output was truncated. Raise `max_tokens`/stream/continue; use structured outputs and check `stop_reason` before parsing.
4. The API key would ship in the binary and be extractable; proxy via your backend, which also enforces per-user limits and logging.
</details>

*CCDV-F Track · Asif*
