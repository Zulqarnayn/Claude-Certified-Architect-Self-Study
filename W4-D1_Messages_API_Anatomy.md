# CCA Self-Study — Week 4, Day 1
## Messages API Anatomy

**Date completed:** _____________
**Study time:** 30–45 mins
**Curriculum phase:** Phase 2 — Building with Claude
**Exam domain:** Domain 4 & 5 · API + Context Management

---

## Core Concept

You made your first API call in Week 1. Now you understand prompts, structure, and validation. Today you go deep on the API itself — every parameter, what it does, why it exists, and what happens architecturally when you change it.

The Messages API is the foundation of everything. Every tool call, every agent loop, every multi-turn conversation is built on top of this single endpoint.

---

## The Analogy — A Professional Camera vs Auto Mode

A phone camera in auto mode makes all the decisions for you — aperture, shutter speed, ISO. It works fine for casual photos.

A professional camera exposes every setting. Each parameter gives you control over a specific dimension of the output. Knowing what each dial does — and when to touch it — is what separates a professional photographer from someone pointing and shooting.

The Messages API is the professional camera. Every parameter is a dial. Today you learn what every dial does.

---

## The Complete API Request

```python
response = client.messages.create(
    model="claude-sonnet-4-6",           # Which model
    max_tokens=1024,                      # Output limit
    system="You are a helpful assistant", # System prompt
    messages=[                            # Conversation
        {"role": "user", "content": "Hello"}
    ],
    temperature=1.0,                      # Randomness
    top_p=0.999,                          # Nucleus sampling
    top_k=...,                            # Top-k sampling
    stop_sequences=["</output>"],         # Custom stop signals
    stream=False,                         # Streaming on/off
    metadata={"user_id": "user_123"}      # Request metadata
)
```

---

## Every Parameter — Deep Dive

### `model` — Which Engine

```python
model="claude-haiku-4-5-20251001"   # Fast, cheap, simple tasks
model="claude-sonnet-4-6"           # Balanced, most production use
model="claude-opus-4-6"             # Powerful, complex reasoning
```

**Architect decision:** Match model to task complexity and volume. Don't set this once and forget — different steps in an agentic pipeline should use different models.

---

### `max_tokens` — Output Budget

The maximum number of tokens Claude can produce in its response. This is NOT the context window limit — it's the output cap.

```python
max_tokens=100    # Short responses: classification, labels
max_tokens=1024   # Medium: analysis, summaries
max_tokens=4096   # Long: documents, code files
max_tokens=8192   # Very long: detailed reports
```

**Critical:** If Claude hits `max_tokens`, it stops mid-sentence. Always check `stop_reason == "max_tokens"` in production.

**Architect mistake:** Setting `max_tokens` too low to save cost. The output tokens are a tiny fraction of total cost vs input tokens. Set it high enough for the task.

---

### `system` — The Briefing

The system prompt. Sets persona, rules, format, constraints. Persists for the entire conversation. Already covered in depth in Week 1 D4.

**New detail:** In the API, `system` is a top-level parameter — not part of the `messages` array. This is different from how some other LLM APIs handle it.

---

### `messages` — The Conversation

An array of alternating user/assistant turns:

```python
messages=[
    {"role": "user", "content": "What is 2+2?"},
    {"role": "assistant", "content": "4"},
    {"role": "user", "content": "And 4+4?"}
]
```

**Rules:**
- Must start with a `user` message
- Must alternate user/assistant
- Last message must be `user` (Claude continues the assistant turn)
- Content can be a string OR a list of content blocks (for images, documents)

**Multi-modal content:**
```python
{"role": "user", "content": [
    {"type": "image", "source": {"type": "base64", "media_type": "image/png", "data": "..."}},
    {"type": "text", "text": "What's in this screenshot?"}
]}
```

---

### `temperature` — Randomness Control

Controls how "random" or "creative" Claude's outputs are.

```python
temperature=0.0   # Deterministic — same input → same output (almost)
temperature=0.5   # Balanced — some variation
temperature=1.0   # Default — natural language variation
temperature=1.5+  # More creative — useful for brainstorming, poetry
```

**Architect use cases:**

| temperature | Use for |
|---|---|
| 0.0–0.3 | Classification, extraction, code — consistency matters |
| 0.7–1.0 | Conversation, analysis — some variation is fine |
| 1.0–1.5 | Creative writing, brainstorming — variation is desired |

**Warning:** Low temperature does NOT guarantee identical outputs — it reduces variation, doesn't eliminate it. For true determinism, use structured output + validation.

---

### `stop_sequences` — Custom Stop Signals

Tell Claude to stop generating when it produces a specific string.

```python
stop_sequences=["</answer>", "###END###", "\n\n"]
```

**Use cases:**

**1. Structured output parsing:**
```python
system="Wrap your answer in <answer> tags."
stop_sequences=["</answer>"]
# Claude stops immediately after producing </answer>
# You know exactly where the answer ends
```

**2. Controlling agentic loops:**
```python
stop_sequences=["TASK_COMPLETE", "NEED_HUMAN_INPUT"]
# Claude signals completion or escalation through text
# Your loop detects the signal and acts accordingly
```

**3. Preventing runaway generation:**
```python
stop_sequences=["\n\n\n"]  # Stop on triple newline
# Prevents Claude from generating multiple sections when you only want one
```

---

### `stream` — Streaming Responses

```python
stream=False  # Wait for complete response (default)
stream=True   # Receive tokens as they're generated
```

**Why streaming matters:**
- Without streaming: user waits 5–10 seconds, then sees the full response appear instantly
- With streaming: user sees the response appearing word by word — much better UX

**Architect rule:** Always use streaming for user-facing interfaces. Skip streaming for pipeline/batch processing where UX doesn't matter.

```python
# Streaming example
with client.messages.stream(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Write a haiku"}]
) as stream:
    for text in stream.text_stream:
        print(text, end="", flush=True)  # Print tokens as they arrive
```

---

### `metadata` — Request Tracking

```python
metadata={"user_id": "user_abc123"}
```

Pass metadata Anthropic uses for safety monitoring and rate limiting. Use `user_id` to track which users are making requests — useful for abuse detection and per-user rate limiting.

---

## The Response Object — Every Field

```python
response.id                    # Unique message ID — use for logging
response.type                  # Always "message"
response.role                  # Always "assistant"
response.content               # List of content blocks
response.content[0].type       # "text" | "tool_use"
response.content[0].text       # The actual response (if type=="text")
response.model                 # Confirms which model responded
response.stop_reason           # "end_turn" | "max_tokens" | "tool_use" | "stop_sequence"
response.stop_sequence         # Which stop sequence triggered (if applicable)
response.usage.input_tokens    # Tokens consumed by your input
response.usage.output_tokens   # Tokens consumed by Claude's response
```

---

## Key Concepts Learned Today

| Parameter | Purpose | Default | When to change |
|---|---|---|---|
| model | Which Claude | — | Match to task complexity |
| max_tokens | Output limit | — | Set high enough for task |
| system | Rules + persona | None | Always set in production |
| messages | Conversation history | — | Build carefully |
| temperature | Randomness | 1.0 | Lower for deterministic tasks |
| stop_sequences | Custom stop signals | None | Structured output, loops |
| stream | Streaming on/off | False | Enable for user-facing UIs |
| metadata | Request tracking | None | Always set user_id |

---

## Hands-On Task 🛠️

Experiment with parameters systematically.

**Experiment 1 — Temperature:**
Send: *"Give me a one-sentence tagline for a productivity app."*
Run it 5 times with `temperature=0.0`. Are the outputs identical?
Run it 5 times with `temperature=1.5`. How different are the outputs?

**Experiment 2 — Stop sequences:**
System: *"Think through problems in <thinking> tags, then give your answer in <answer> tags."*
User: *"What's 15% of 340?"*
Add `stop_sequences=["</answer>"]`. Confirm Claude stops immediately after `</answer>`.

**Experiment 3 — max_tokens:**
Set `max_tokens=10`. Ask Claude to write a haiku. What is `stop_reason`?
Now set `max_tokens=100`. Same question. What is `stop_reason` now?

**Experiment 4 — Streaming:**
Implement the streaming example above. Watch tokens appear in real-time.

**Your observations:**
> _(write here)_

---

## Q&A — Self-Assessment

---

**Q1.** You're building a code generation tool. What temperature setting would you use and why? What about a creative story generator?

> **Your answer:**
> _(write here)_

---

**Q2.** You set `max_tokens=50` for a summarisation task. Users complain summaries are always cut off mid-sentence. What's the fix, and should you worry about the cost of increasing max_tokens?

> **Your answer:**
> _(write here)_

---

**Q3.** Your agentic loop needs Claude to signal when it's done vs when it needs more information. How would you use `stop_sequences` to implement this without relying on parsing Claude's full response?

> **Your answer:**
> _(write here)_

---

**Q4.** Why should you always log `response.id` in production? Give two specific debugging scenarios where it would save you.

> **Your answer:**
> _(write here)_

---

**Q5 — Architect Scenario.** You're building an internal tool for your company's 50 employees. Some employees are abusing the tool by sending extremely long messages that inflate costs. How would you use the API parameters and metadata to detect and limit this?

> **Your answer:**
> _(write here)_

---

## Answer Guide — Claude's Reference Answers

---

**Q1 — Temperature for code vs stories**

**Code generation: temperature=0.0 to 0.3**

Code correctness is binary — it either works or it doesn't. Random variation in code generation produces bugs, inconsistent style, and unreliable outputs. Low temperature keeps Claude on the most probable (and therefore most correct) code paths. You want consistency, not creativity, when generating code.

**Creative story generator: temperature=1.0 to 1.5**

Stories benefit from unexpected word choices, surprising metaphors, and varied sentence structure. Low temperature produces predictable, generic prose. Higher temperature enables the kind of linguistic variation that makes writing interesting. Set to 1.0 for natural variation, up to 1.5 for more experimental creative output.

**Important caveat:** Temperature is not the only creativity lever. Prompt design, few-shot examples, and the nature of the task all affect output variety. Temperature tuning is fine-tuning, not the primary control.

---

**Q2 — max_tokens too low**

**The fix:** Increase `max_tokens`. A good starting point for summaries is 500–1000 tokens. Test with your actual content to find where summaries naturally end.

**Should you worry about cost?** No — not significantly. Output tokens are a small fraction of total API cost compared to input tokens. If your typical summary input is 2000 tokens and output is 300 tokens, doubling max_tokens to 600 adds minimal cost while solving a real UX problem.

**The general rule:** Set max_tokens to 2x the expected output length. This gives headroom without risking runaway generation. Never set it to exactly what you expect — edge cases will exceed your estimate.

---

**Q3 — Stop sequences for loop signalling**

Design Claude to produce specific terminal strings when it reaches completion states:

```python
system = """
When you have completed the task, output: TASK_COMPLETE
When you need more information from the user, output: NEED_INPUT:<question>
When you encounter an error you cannot recover from, output: ESCALATE:<reason>
"""

stop_sequences = ["TASK_COMPLETE", "NEED_INPUT:", "ESCALATE:"]

# In your loop:
if response.stop_reason == "stop_sequence":
    if response.stop_sequence == "TASK_COMPLETE":
        finalize()
    elif response.stop_sequence.startswith("NEED_INPUT:"):
        ask_user(extract_question(response))
    elif response.stop_sequence.startswith("ESCALATE:"):
        escalate(extract_reason(response))
```

This is cleaner than parsing Claude's full prose for completion signals because `stop_reason` and `stop_sequence` are structured fields in the response object — no text parsing needed.

---

**Q4 — Logging response.id**

`response.id` is a unique identifier for each API call, generated by Anthropic's servers.

**Debugging scenario 1 — Reproducing a specific bad output:** A user reports that Claude said something wrong at 3:47 PM yesterday. If you logged `response.id` with each user interaction, you can search your logs for that timestamp and find the exact message ID. You can then trace the exact input that produced that output. Without the ID, you're guessing from partial information.

**Debugging scenario 2 — Anthropic support:** If you encounter a systematic issue (wrong outputs for a specific input type, unexpected model behaviour), Anthropic support can use the `response.id` to look up the exact model state and processing for that request. Without IDs, support can't investigate specific incidents.

**Bonus:** Use `response.id` for deduplication — if your system retries a failed request, you might accidentally process the same response twice. Checking for duplicate IDs prevents this.

---

**Q5 — Detecting and limiting abuse**

**Detection:**

```python
# Log every request with metadata
metadata = {
    "user_id": employee_id,
    "department": department,
    "tool": "internal_assistant"
}

# Log input token count after every call
log_usage(
    user_id=employee_id,
    input_tokens=response.usage.input_tokens,
    output_tokens=response.usage.output_tokens,
    timestamp=datetime.now()
)
```

**Limiting:**

```python
def check_rate_limit(user_id: str) -> bool:
    tokens_today = db.get_tokens_used_today(user_id)
    if tokens_today > DAILY_LIMIT:  # e.g. 100,000 tokens/day per user
        return False  # Block the request
    return True

# Before every API call:
if not check_rate_limit(employee_id):
    return "You've reached your daily AI usage limit. Resets at midnight."
```

**Input size limit:**
```python
# Count tokens before sending
estimated_tokens = len(user_message.split()) * 1.3  # Rough estimate
if estimated_tokens > 5000:  # e.g. 5k token input limit per message
    return "Message too long. Please summarise your request."
```

**Dashboard:** Build a simple usage dashboard showing tokens per user per day. Anomalous usage (one person using 10x the average) becomes visible quickly.

---

## Status

- [ ] Concept read and understood
- [ ] Experiment 1 completed (temperature)
- [ ] Experiment 2 completed (stop sequences)
- [ ] Experiment 3 completed (max_tokens)
- [ ] Experiment 4 completed (streaming)
- [ ] Q1 answered
- [ ] Q2 answered
- [ ] Q3 answered
- [ ] Q4 answered
- [ ] Q5 answered
- [ ] Answer guide reviewed
- [ ] Day 2 started — Multi-Turn Conversations

---

## Coming Up — Week 4, Day 2

**Topic:** Multi-Turn Conversations
How to pass conversation history correctly. Why Claude has no memory — you are the memory. Building a stateful chat loop that maintains context across turns without ballooning cost.

---

*CCA Self-Study Log · Asif · Phase 2 of 5 · Week 4 of 12*
