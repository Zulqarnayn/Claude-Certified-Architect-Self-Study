---
layout: note
title: "Structured Outputs, Strict Tools, Tool Runner"
id: W13-D3
part: update
domain: prompting
order: 5013
kind: note
book: true
minutes: "60"
verified: "2026-10"
exam_domain: "Domain 4 · Prompt Engineering & Structured Output (20%) + Domain 2 · Tool Design & MCP (18%) · CCDV-F: Applications & Integration (33.1%)"
---

## Core Concept

Earlier weeks taught JSON-by-prompting, prefill, and hand-rolled retry. The platform now enforces schemas. Pick the weakest tool that guarantees what you need:

| Goal | Use |
|---|---|
| Valid JSON matching a schema **in the reply** | Structured outputs: `output_config.format` (or `messages.parse()` with Pydantic) |
| Valid **tool arguments** | `strict: true` on the tool |
| Model must act through a tool | `tool_choice: auto` + prompt instruction (+ `strict`). Forced `any`/`tool` returns **400** on Opus 5.5 / Sonnet 5.5 / Fable 5.1 |
| Loop over tool calls without writing the loop | **Tool Runner** |

**Syntax ≠ semantics.** A schema guarantees shape, not truth. You still validate business rules (range, referential integrity, "is this order ID real?") and keep retry/escalation from W3-D4.

---

## 1. Structured Outputs

```python
from pydantic import BaseModel
import anthropic

class ContactInfo(BaseModel):
    name: str
    email: str
    plan: str
    interests: list[str]
    demo_requested: bool

client = anthropic.Anthropic()
response = client.messages.parse(
    model="claude-sonnet-5-5",
    max_tokens=16000,
    messages=[{"role": "user", "content":
        "Extract: Jane Doe (jane@co.com) wants Enterprise, interested in API and SDKs, wants a demo."}],
    output_format=ContactInfo,          # the parse() helper takes your Pydantic class
)
contact = response.parsed_output        # validated ContactInfo
```

Raw schema form (works on `messages.create`):

```python
response = client.messages.create(
    model="claude-sonnet-5-5", max_tokens=16000, messages=[...],
    output_config={"format": {"type": "json_schema", "schema": {
        "type": "object",
        "properties": {"name": {"type": "string"}, "email": {"type": "string"}},
        "required": ["name", "email"], "additionalProperties": False}}},
)
data = json.loads(next(b.text for b in response.content if b.type == "text"))
```

Rules:
- Use `output_config: {format: ...}`. The old top-level `output_format` on `create()` is deprecated.
- **Check `stop_reason` first**: `max_tokens` truncation or `refusal` means the JSON may be incomplete or absent.
- Incompatible with citations (`citations.enabled` + `output_config.format` → 400).
- Replaces assistant **prefill** (removed on current models, HTTP 400).

---

## 2. Strict Tool Use

```python
tools=[{
    "name": "book_flight",
    "description": "Book a flight to a destination",
    "strict": True,                                   # top-level on the tool, not on tool_choice
    "input_schema": {
        "type": "object",
        "properties": {
            "destination": {"type": "string"},
            "date": {"type": "string", "format": "date"},
            "passengers": {"type": "integer", "enum": [1, 2, 3, 4, 5, 6, 7, 8]},
        },
        "required": ["destination", "date", "passengers"],
        "additionalProperties": False,                # required with strict
    },
}]
```

`strict: true` guarantees `tool_use.input` validates exactly: no missing required fields, no wrong types. It does not make the *choice* of tool or the *values* correct.

Also remember: always parse tool input with `json.loads`, never string-match the serialized form (escaping differs across models).

---

## 3. Tool Runner (SDK beta helper)

```python
import anthropic
from anthropic import beta_tool

client = anthropic.Anthropic()

@beta_tool
def get_order(order_id: str) -> str:
    """Look up an order by ID.

    Args:
        order_id: The order identifier, e.g. ORD-1042.
    """
    return lookup(order_id)   # your code

runner = client.beta.messages.tool_runner(
    model="claude-sonnet-5-5",
    max_tokens=16000,
    tools=[get_order],
    messages=[{"role": "user", "content": "Where is order ORD-1042?"}],
)
for message in runner:        # each iteration = one model turn; stops when no tool calls remain
    print(message)
```

- Schema is generated from type hints + docstring: **the docstring is the tool description**, so W5-D3 (description quality) now lives in your docstrings.
- Async: `@beta_async_tool`. TypeScript: `betaZodTool`.
- Human approval does **not** require a manual loop: gate inside the tool (return "user declined") or inspect pending `tool_use` blocks in the loop body.
- Runner is beta; drop to a manual loop only for control it cannot express.

### Manual loop invariants (still tested)

```python
while True:
    response = client.messages.create(model=M, max_tokens=16000, tools=tools, messages=messages)
    if response.stop_reason == "end_turn": break
    if response.stop_reason == "pause_turn":              # server tool hit its iteration cap: re-send to continue
        messages = [messages[0], {"role": "assistant", "content": response.content}]; continue
    messages.append({"role": "assistant", "content": response.content})
    results = [{"type": "tool_result", "tool_use_id": b.id, "content": run(b.name, b.input)}
               for b in response.content if b.type == "tool_use"]
    messages.append({"role": "user", "content": results})   # ALL results in ONE user message
```

- `tool_use_id` must match the block id.
- Parallel calls: execute concurrently, return all `tool_result`s together. Splitting them across messages teaches Claude to stop parallelizing.
- Failure: return `tool_result` with `is_error: true`. Never drop the result.
- Also guard `stop_reason in ("max_tokens", "refusal")` before executing tools.

---

## Decision Table

| Situation | Best choice |
|---|---|
| Extract fields from invoices | Structured outputs (schema), then semantic validation |
| Route a ticket to one of 5 queues | Structured output with an `enum` field |
| Agent calls internal APIs | Tool Runner + `strict` tools |
| Must call tool X first | `tool_choice: auto` + "call `lookup_customer` first" in prompt; or enforce in code/hooks |
| Free-form explanation | **No** structured output (W3-D5: don't over-constrain) |

## Exam Traps

| Trap | Reality |
|---|---|
| "Schema guarantees correct data" | Guarantees shape only |
| "Use prefill to force JSON" | Removed; use `output_config.format` |
| "Force a tool with `tool_choice: tool`" | 400 on 5.5-gen models |
| `strict` set on `tool_choice` | It goes on the tool definition |
| Tool Runner = Agent SDK | No (W13-D1) |
| Return tool results one per message | One user message, all results |

## Hands-On Task

1. Build an invoice extractor with Pydantic + `messages.parse`; feed 5 messy invoices.
2. Add a semantic validator (totals must sum) with one retry that passes the error back.
3. Implement the same support agent twice: Tool Runner vs manual loop. Count lines; log `usage`.

## Q&A — Self-Assessment

**Q1.** Output must be valid JSON with 4 fields, using Sonnet 5.5. Prefill `{`?
**Q2.** What does `strict: true` not guarantee?
**Q3.** Two tools are called in parallel. How do you return results?
**Q4.** Where does a Tool Runner tool's description come from?

<details><summary>Answers</summary>

1. No: prefill 400s. Use `output_config.format` / `messages.parse()`.
2. That the model picks the right tool or supplies correct values.
3. Both `tool_result` blocks in one user message, matching `tool_use_id`s.
4. The function docstring (and type hints for the schema).
</details>

## Status

- [ ] parse() extractor built
- [ ] Runner vs manual loop compared
- [ ] Q&A done

*CCA Self-Study Log · Asif · Phase 6 · Week 13*
