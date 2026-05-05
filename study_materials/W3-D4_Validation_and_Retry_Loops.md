---
layout: default
title: CCA Self-Study — Week 3, Day 4
---

# CCA Self-Study — Week 3, Day 4
## Validation & Retry Loops

**Date completed:** _____________
**Study time:** 30–45 mins
**Curriculum phase:** Phase 1 — Claude Fundamentals
**Exam domain:** Domain 4 · Prompt Engineering & Structured Output

---

## Core Concept

Yesterday you built schema validation. Today you build the complete production pattern around it — the retry loop that makes your Claude integration resilient to the inevitable failures that happen at scale.

A retry loop is not just "try again." It is a feedback system — you tell Claude exactly what went wrong so it can correct the specific failure, not just regenerate randomly.

---

## The Analogy — Code Review

When a developer submits code for review, the reviewer doesn't say:
> *"This is wrong. Please resubmit."*

They say:
> *"Line 47: you're mutating state inside a render function. Line 83: this async call has no error handling. Line 102: this variable is unused."*

Specific feedback produces targeted fixes. Vague feedback produces random rewrites.

Your retry message to Claude is a code review — specific, actionable, targeted at the exact failure.

---

## The Complete Retry Loop Architecture

```
┌─────────────────────────────────────────────────┐
│                   INPUT                         │
└─────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│              CALL CLAUDE (Attempt 1)            │
└─────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│           LAYER 1: JSON PARSE CHECK             │
│  ✅ Pass → go to Layer 2                        │
│  ❌ Fail → append parse error, retry            │
└─────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│          LAYER 2: SCHEMA VALIDATION             │
│  ✅ Pass → go to Layer 3                        │
│  ❌ Fail → append field errors, retry           │
└─────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│         LAYER 3: BUSINESS LOGIC CHECK           │
│  ✅ Pass → return result                        │
│  ❌ Fail → append logic error, retry            │
└─────────────────────────────────────────────────┘
                       ↓
              MAX RETRIES EXCEEDED?
                 ↓             ↓
              ESCALATE      RETURN
```

---

## The Three Validation Layers

### Layer 1 — JSON Parse
Can `json.loads()` parse the output at all?

```python
try:
    data = json.loads(raw_output)
except json.JSONDecodeError as e:
    error_msg = f"Your output was not valid JSON. Parse error: {str(e)}\n"
    error_msg += "Return ONLY a valid JSON object, no other text."
    # → retry with this error
```

### Layer 2 — Schema Validation
Do the fields match the expected types, enums, and constraints?

```python
is_valid, field_errors = validate_schema(data)
if not is_valid:
    error_msg = "Your JSON had these schema errors:\n"
    for err in field_errors:
        error_msg += f"- {err}\n"
    error_msg += "Correct these specific fields and return the full JSON object."
    # → retry with this error
```

### Layer 3 — Business Logic
Is the data internally consistent and logically valid?

```python
def validate_business_logic(data: dict) -> tuple[bool, list[str]]:
    errors = []
    
    # Example: if severity is "critical", is_urgent must be true
    if data["severity"] == "critical" and not data["is_urgent"]:
        errors.append("severity=critical requires is_urgent=true")
    
    # Example: if confidence < 0.5, flag_for_review should be true
    if data["confidence"] < 0.5 and not data.get("flag_for_review"):
        errors.append("confidence < 0.5 requires flag_for_review=true")
    
    return len(errors) == 0, errors
```

---

## The Full Production Retry Loop

```python
import json
import time
import logging

logger = logging.getLogger(__name__)

def call_with_retry(
    client,
    system_prompt: str,
    user_message: str,
    validator_fn,
    max_retries: int = 3,
    base_delay: float = 1.0
) -> dict:
    
    messages = [{"role": "user", "content": user_message}]
    last_error = None
    
    for attempt in range(max_retries):
        
        # Exponential backoff after first attempt
        if attempt > 0:
            delay = base_delay * (2 ** (attempt - 1))  # 1s, 2s, 4s
            logger.info(f"Retry {attempt}/{max_retries}, waiting {delay}s")
            time.sleep(delay)
        
        try:
            response = client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=1000,
                system=system_prompt,
                messages=messages
            )
            
            raw = response.content[0].text
            logger.debug(f"Attempt {attempt+1} raw output: {raw[:200]}")
            
            # Layer 1: JSON parse
            try:
                data = json.loads(raw.strip())
            except json.JSONDecodeError as e:
                last_error = f"JSON parse error: {e}"
                messages.extend([
                    {"role": "assistant", "content": raw},
                    {"role": "user", "content": 
                     f"Invalid JSON. Error: {e}\nReturn ONLY valid JSON, no other text."}
                ])
                continue
            
            # Layer 2 & 3: Schema + business logic
            is_valid, errors = validator_fn(data)
            if not is_valid:
                last_error = f"Validation errors: {errors}"
                error_list = "\n".join(f"- {e}" for e in errors)
                messages.extend([
                    {"role": "assistant", "content": raw},
                    {"role": "user", "content": 
                     f"Fix these errors and return corrected JSON:\n{error_list}"}
                ])
                continue
            
            # Success
            logger.info(f"Success on attempt {attempt+1}")
            return data
        
        except Exception as e:
            last_error = str(e)
            logger.error(f"Attempt {attempt+1} failed: {e}")
    
    # All retries exhausted
    raise RuntimeError(
        f"Failed after {max_retries} attempts. Last error: {last_error}"
    )
```

---

## Exponential Backoff — Why It Matters

When you hit an error, retrying immediately often hits the same error (rate limits, transient issues). Waiting longer between each retry gives the system time to recover.

```
Attempt 1: immediate
Attempt 2: wait 1 second
Attempt 3: wait 2 seconds
Attempt 4: wait 4 seconds
Attempt 5: wait 8 seconds
```

For Claude API specifically, exponential backoff matters for:
- Rate limit errors (429) — waiting is the only fix
- Transient server errors (529) — usually resolve in seconds
- NOT for validation failures — those need to retry immediately with corrected context

---

## Retry Message Design — The Critical Skill

| Error type | Bad retry message | Good retry message |
|---|---|---|
| Wrong enum | "Try again" | "category must be 'bug'\|'feature'\|'other'. You returned 'issue' which is invalid." |
| Wrong type | "Fix the types" | "confidence must be a float like 0.87, not a string like '0.87'" |
| Missing field | "Missing fields" | "Required field 'summary' is absent. Add it with a string value max 100 chars." |
| Parse error | "Invalid JSON" | "JSON parse failed at position 47: unexpected '}'. Check your brackets." |

The more specific your error message, the faster Claude corrects it.

---

## Key Concepts Learned Today

| Term | Definition |
|---|---|
| Retry loop | Re-prompting Claude with error feedback after validation failure |
| Three validation layers | JSON parse → schema → business logic |
| Exponential backoff | Increasing wait time between retries for rate limit / server errors |
| Specific error feedback | Telling Claude exactly what failed and how to fix it |
| Escalation | What happens when all retries fail — human review, default, exception |

---

## Hands-On Task 🛠️

Build the complete retry loop for your iOS crash report classifier from D3.

**Requirements:**
1. Implement all 3 validation layers
2. Use exponential backoff between attempts
3. Log every attempt with its error
4. After max retries: raise a custom `ClassificationError` exception
5. Test by deliberately introducing failures:
   - Send a prompt that makes Claude add markdown fences (Layer 1 failure)
   - Make Claude output a wrong enum value (Layer 2 failure)
   - Set `is_urgent=false` for a `severity=critical` case (Layer 3 failure)

**Your implementation:**
> _(write here)_

---

## Q&A — Self-Assessment

---

**Q1.** Why is a specific retry error message better than just re-running the same prompt? What information does Claude use from the error message to produce a better output?

> **Your answer:**
> _(write here)_

---

**Q2.** You're retrying due to a JSON parse error. Should you use exponential backoff before the retry? What about retrying due to a 429 rate limit error?

> **Your answer:**
> _(write here)_

---

**Q3.** Your retry loop has max_retries=3 and your failure rate is 5%. At 10,000 calls/day, how many calls will exhaust all retries and escalate? Show your calculation.

> **Your answer:**
> _(write here)_

---

**Q4.** A colleague suggests using `max_retries=10` to make the system more reliable. What are the hidden costs of a high retry count, and what's a more effective approach?

> **Your answer:**
> _(write here)_

---

**Q5 — Architect Scenario.** Your retry loop is in production. You notice that Attempt 2 succeeds 90% of the time when Attempt 1 fails. But Attempt 3 almost never succeeds after Attempt 2 fails. What does this pattern tell you, and how should you adjust your architecture?

> **Your answer:**
> _(write here)_

---

## Answer Guide — Claude's Reference Answers

---

**Q1 — Specific retry messages**

When you re-run the same prompt after failure, Claude has no new information. Its output distribution is the same as the first attempt — it might produce a different response, but not a specifically corrected one. You're relying on random variation.

When you append the specific error, Claude uses it to:
1. Identify which fields were wrong (not just that something was wrong)
2. Apply targeted correction rather than regenerating everything
3. Keep the rest of the output stable (only fix what was broken)

The error message is feedback that narrows Claude's output distribution toward valid responses. Without it, Claude is guessing. With it, Claude is correcting.

---

**Q2 — Backoff for parse errors vs rate limits**

**JSON parse error:** No backoff needed. The failure is in Claude's output, not in the API infrastructure. The issue is the prompt-response pattern, and the correction is in the retry message. Retry immediately with better error feedback.

**429 Rate limit error:** Backoff is required. The API is telling you to slow down. Retrying immediately will get another 429. Wait before retrying — use exponential backoff starting at 1–2 seconds. For sustained rate limit issues, implement a token bucket or request queue.

**General rule:** Backoff when the failure is infrastructure/capacity related. Retry immediately (with better context) when the failure is content/format related.

---

**Q3 — Escalation rate calculation**

Initial failure rate: 5% → 0.05
After retry 1: 5% of 5% → 0.0025 (assuming each retry has same independent failure rate)
After retry 2: 5% of 0.25% → 0.000125
After retry 3: 5% of 0.0125% → 0.00000625

Actually the simpler calculation: if each attempt has 95% success:
- P(all 3 fail) = 0.05³ = 0.000125 = 0.0125%
- At 10,000 calls/day: 10,000 × 0.000125 = **1.25 escalations/day**

That's very manageable. This is why even a simple 3-retry loop dramatically reduces escalation rate from 500/day (no retry) to ~1/day.

**Important caveat:** This assumes failures are independent — that a retry has the same probability of success as the first attempt. If a specific input reliably breaks your schema, all 3 retries will fail. Fix the root cause (prompt or validation), don't just increase retries.

---

**Q4 — Hidden costs of max_retries=10**

**Latency:** Each retry adds API round-trip time. At 10 retries × 1 second each = up to 10 seconds of latency for a failing call. For a user-facing system, this is unacceptable.

**Cost:** Each retry is a full API call. If 5% of calls fail and each uses up to 10 retries, you're spending up to 50 API calls for every 100 initial attempts. Cost multiplies.

**Context window growth:** Each retry appends error messages to the conversation history. By retry 10, the context is much longer, costing more tokens per call.

**Masking root problems:** A high retry count masks prompt quality issues. If you need 10 retries to succeed 90% of the time, your prompt is broken. Fix the prompt.

**Better approach:** Keep max_retries=3, but invest in:
1. Better initial prompt (reduce failure rate to <1%)
2. Better retry error messages (make retry 1 succeed 90%+ of the time)
3. Root cause monitoring (track which inputs fail repeatedly)

---

**Q5 — Retry pattern analysis**

**What the pattern tells you:**

Attempt 1 fails, Attempt 2 succeeds 90% of the time → Your retry error message is effective. Claude understands the feedback and corrects successfully on the first retry for most cases.

Attempt 2 fails, Attempt 3 almost never succeeds → After two failed attempts, the context is polluted. You have the original input, first failure, first error message, second failure, second error message — all in one context. Claude may be confused by the accumulated error history, or the input is genuinely ambiguous/malformed.

**Architecture adjustment:**

1. **Improve Attempt 1** — lower the initial failure rate so Attempt 2 is rarely needed.

2. **Reset context on Attempt 3** — instead of accumulating error history, start fresh on the third attempt with just the original prompt but with tighter constraints. Sometimes a clean slate beats corrective feedback.

3. **Rethink Attempt 3** — use a different model (Opus instead of Haiku) for the third attempt. More capable model for hard cases.

4. **Classify failures** — log what inputs fail twice. They likely share a pattern. Fix the prompt for that input class specifically.

---

## Status

- [ ] Concept read and understood
- [ ] Full retry loop implemented
- [ ] All 3 validation layers tested
- [ ] Layer 1 failure triggered and recovered
- [ ] Layer 2 failure triggered and recovered
- [ ] Layer 3 failure triggered and recovered
- [ ] Q1 answered
- [ ] Q2 answered
- [ ] Q3 answered
- [ ] Q4 answered
- [ ] Q5 answered
- [ ] Answer guide reviewed
- [ ] Day 5 started — When NOT to Use Structured Output

---

## Coming Up — Week 3, Day 5

**Topic:** When NOT to Use Structured Output
The exam tests this distinction heavily. Open-ended reasoning, creative tasks, exploratory analysis — these require prose, not JSON. Knowing when structured output constrains Claude's capability is as important as knowing how to enforce it.

---

*CCA Self-Study Log · Asif · Phase 1 of 5 · Week 3 of 12*
