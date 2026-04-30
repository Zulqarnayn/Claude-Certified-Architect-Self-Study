# CCA Self-Study — Week 3, Day 2
## Structured Output — JSON Basics

**Date completed:** _____________
**Study time:** 30–45 mins
**Curriculum phase:** Phase 1 — Claude Fundamentals
**Exam domain:** Domain 4 · Prompt Engineering & Structured Output

---

## Core Concept

When Claude's output feeds into another system — a database, a UI component, another API call — prose doesn't work. You need structured, machine-readable data. JSON is the lingua franca of structured output in Claude systems.

Today you learn: how to get Claude to output JSON, why it sometimes fails, and your first attempt at schema enforcement.

---

## The Analogy — A Form vs a Conversation

When you go to a doctor, they don't just chat with you and write a narrative note. They fill in a structured form: patient name, date of birth, symptoms (checkboxes), diagnosis code, prescription. Every field has a type. Every required field must be completed.

This structure exists because the data feeds other systems — the pharmacy, the insurance company, the hospital records system. A narrative note can't be processed programmatically.

Your Claude API output is the same. When the output feeds another system, you need a form — not a conversation.

---

## The Problem: Claude Wants to Be Helpful, Not Structured

Claude was trained on human writing — which is almost never raw JSON. Claude's default is to be helpful and communicative:

```
User: "Extract the sentiment from: 'This app is amazing!'"

Claude (default): "The sentiment of this review is clearly positive. 
                   The user expresses strong enthusiasm with the word 'amazing,' 
                   indicating a high level of satisfaction with the product.
                   
                   Sentiment: Positive
                   Confidence: High"
```

This is helpful prose. It completely breaks any code that does `JSON.parse(response)`.

---

## Level 1: Ask for JSON in the Prompt

The simplest approach — just ask:

```python
system = "Extract sentiment from the text. Return a JSON object with keys: 
          sentiment (positive/negative/neutral) and confidence (0.0 to 1.0).
          Return only the JSON object — no other text."

user = "This app is amazing!"
```

**Output (usually):**
```json
{"sentiment": "positive", "confidence": 0.97}
```

This works most of the time. But "most of the time" is not good enough for production. Sometimes Claude adds an explanation. Sometimes it wraps JSON in markdown code fences. Sometimes it uses different key names.

---

## Level 2: Add Schema Definition

Tell Claude exactly what structure to produce:

```python
system = """Extract sentiment from the given text.

Return ONLY a valid JSON object with this exact structure:
{
  "sentiment": "positive" | "negative" | "neutral",
  "confidence": <float between 0.0 and 1.0>,
  "key_phrases": [<array of strings that drove the sentiment>]
}

Rules:
- sentiment must be exactly one of: positive, negative, neutral
- confidence must be a float, not a string
- key_phrases must be an array, even if empty
- No text before or after the JSON object
- No markdown code fences"""
```

**Output (much more consistent):**
```json
{
  "sentiment": "positive",
  "confidence": 0.97,
  "key_phrases": ["amazing"]
}
```

---

## Level 3: Assistant Prefill (Most Reliable)

From D4, you know about assistant prefill. For JSON, it's extremely powerful:

```python
messages = [
    {"role": "user", "content": "Extract sentiment from: 'This app is amazing!'"},
    {"role": "assistant", "content": "{"}  # Force Claude to start with opening brace
]
```

Claude cannot output an introduction paragraph because it's already started the JSON object. It must complete a valid JSON structure.

**Gotcha:** When using prefill, you need to prepend `{` back to Claude's response since it continues from the prefill:
```python
raw_response = response.content[0].text
full_json = "{" + raw_response  # Add back the prefill character
parsed = json.loads(full_json)
```

---

## Why JSON Hallucination Happens

Even with good prompting, Claude sometimes produces malformed JSON. The reasons:

### 1. Invented keys
Claude adds keys you didn't ask for: `"analysis": "The user seems satisfied..."` — helpful but schema-breaking.

### 2. Type mismatches
You asked for `"confidence": 0.97` and got `"confidence": "high"` — different data type.

### 3. Markdown wrapping
```
```json
{"sentiment": "positive"}
```
```
The backticks are valid markdown, invalid JSON.parse() input.

### 4. Trailing text
```json
{"sentiment": "positive"}

Note: This was a clearly positive review.
```

### 5. Nested structure errors
Missing commas, unclosed brackets — especially in complex nested JSON.

---

## Handling JSON Parse Failures

**Never trust that Claude's output is valid JSON.** Always wrap your parser:

```python
import json

def safe_parse_json(text: str) -> dict | None:
    # Strip markdown code fences if present
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]  # Remove ```json
    if text.startswith("```"):
        text = text[3:]  # Remove ```
    if text.endswith("```"):
        text = text[:-3]  # Remove trailing ```
    text = text.strip()
    
    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        print(f"JSON parse failed: {e}")
        print(f"Raw text: {text}")
        return None

result = safe_parse_json(response.content[0].text)
if result is None:
    # Handle failure — retry, log, fallback
    pass
```

---

## Key Concepts Learned Today

| Term | Definition |
|---|---|
| Structured output | Machine-readable response format (JSON, XML, CSV) |
| Schema definition | Explicit specification of expected JSON structure in the prompt |
| JSON hallucination | Claude inventing keys, wrong types, or invalid JSON structure |
| Assistant prefill for JSON | Starting Claude's response with `{` to force JSON continuation |
| Safe JSON parsing | Always wrapping `json.loads()` in try/catch with cleanup logic |

---

## Hands-On Task 🛠️

Build a JSON extractor for iOS crash reports.

**Target schema:**
```json
{
  "category": "UI_BUG | PERFORMANCE | DATA_LOSS | AUTH_ISSUE | OTHER",
  "severity": "LOW | MEDIUM | HIGH | CRITICAL",
  "device_mentioned": true | false,
  "reproducible": true | false | null,
  "summary": "<one sentence summary>"
}
```

**Step 1:** Write a prompt that extracts this schema from crash reports.

**Step 2:** Test on these reports:
- *"App crashes every time I try to upload a photo on my iPhone 15 Pro"*
- *"Sometimes slow"*
- *"Lost all my data after the update!!! This is unacceptable"*

**Step 3:** Deliberately break your parser — send Claude a message that makes it add extra text. Then fix it with negative prompting.

**Step 4:** Write the `safe_parse_json` function and test it.

**Your work:**
> _(write here)_

---

## Q&A — Self-Assessment

---

**Q1.** What are three ways Claude's JSON output can be valid-looking but fail `json.loads()`? Give a specific example of each.

> **Your answer:**
> _(write here)_

---

**Q2.** You need Claude to return a field called `tags` that is always an array — even if there are no tags. Why might Claude sometimes return `"tags": null` or `"tags": "none"` instead, and how do you fix it?

> **Your answer:**
> _(write here)_

---

**Q3.** What is the advantage of using assistant prefill (`{"`) over just instructing Claude to return JSON? When might prefill cause problems?

> **Your answer:**
> _(write here)_

---

**Q4.** Your JSON output consistently has the right keys but wrong types — confidence comes back as `"0.97"` (string) instead of `0.97` (float). What causes this and how do you fix it in both the prompt and the code?

> **Your answer:**
> _(write here)_

---

**Q5 — Architect Scenario.** Your structured output pipeline runs fine 98% of the time but fails 2% of the time due to malformed JSON. At 10,000 calls/day, that's 200 failures. Design a complete failure handling strategy — what happens when JSON parsing fails?

> **Your answer:**
> _(write here)_

---

## Answer Guide — Claude's Reference Answers

---

**Q1 — Three JSON failure modes**

**1. Markdown wrapping:**
```
```json
{"sentiment": "positive"}
```
```
`json.loads()` fails because the input starts with backtick, not `{`.

**2. Trailing explanation:**
```
{"sentiment": "positive"}

The analysis shows the user is satisfied with the product.
```
`json.loads()` fails because content after `}` makes the string invalid JSON.

**3. String instead of number:**
```json
{"confidence": "0.97"}
```
`json.loads()` actually succeeds here — but downstream code that does `result["confidence"] * 100` fails because you can't multiply a string by a number. Valid JSON, wrong type.

---

**Q2 — tags always an array**

Claude sometimes outputs `null` or `"none"` for empty arrays because in human writing, "no tags" is often expressed as "none" or nothing. Claude pattern-matches to that.

**Prompt fix:**
```
"tags" must always be a JSON array. If there are no tags, return an empty array: []
Never return null, "none", or omit the field entirely.
```

**Code fix (defensive):**
```python
tags = result.get("tags", [])
if not isinstance(tags, list):
    tags = []  # Coerce to empty array if Claude got it wrong
```

Defense in depth: fix it in the prompt AND handle it in code.

---

**Q3 — Prefill vs instruction**

**Advantage of prefill:** Claude cannot write an introduction paragraph because it's already mid-JSON object. The format is enforced by the model's continuation mechanism, not just by instruction. It's more reliable for eliminating preamble.

**When prefill causes problems:**
1. You forget to prepend the prefill character back to the response before parsing
2. If Claude needs to think before producing the JSON (like with CoT), prefill forces immediate JSON output — removing the thinking space that might improve accuracy
3. Some API configurations don't support assistant prefill — check your API version

**Best practice:** Use prefill for high-reliability structured output where preamble is the main failure mode. Skip prefill when CoT reasoning before the JSON would improve accuracy.

---

**Q4 — String vs float type mismatch**

**Why it happens:** Claude was trained on text where numbers often appear as strings in context. When the prompt says "confidence (0.0 to 1.0)," Claude might generate `"0.97"` because in many training examples numbers appear quoted.

**Prompt fix:**
```
confidence: a floating point number between 0.0 and 1.0
Example correct: "confidence": 0.97
Example incorrect: "confidence": "0.97"
Do not quote numeric values.
```

**Code fix:**
```python
confidence = result.get("confidence", 0.0)
if isinstance(confidence, str):
    confidence = float(confidence)  # Coerce string to float
```

Both fixes are needed — the prompt reduces occurrence, the code handles remaining failures.

---

**Q5 — 200 JSON failures/day handling strategy**

A complete failure handling system has four layers:

**Layer 1 — Prevention (reduce failures)**
- Strong prompt with schema, negative prompting, few-shot examples
- Assistant prefill to eliminate preamble
- Target: reduce failure rate from 2% to <0.5%

**Layer 2 — Recovery (fix parseable failures)**
```python
def recover_json(text):
    # Strip markdown fences
    # Try to find JSON between { and last }
    start = text.find('{')
    end = text.rfind('}') + 1
    if start != -1 and end > start:
        try:
            return json.loads(text[start:end])
        except:
            pass
    return None
```

**Layer 3 — Retry (re-ask Claude)**
```python
if result is None:
    # Send error back to Claude with the malformed output
    retry_messages = messages + [
        {"role": "assistant", "content": raw_response},
        {"role": "user", "content": f"Your previous response was not valid JSON. 
         The parse error was: {parse_error}. Please respond with only valid JSON."}
    ]
    result = call_claude(retry_messages)
```

**Layer 4 — Escalation (human review)**
If retry also fails: log the input, log both failed outputs, route to human review queue. Never silently drop or assume a default value for business-critical data.

**Monitoring:** Track JSON failure rate as a metric. Alert if it rises above 1%. A rising failure rate often signals a change in input distribution or a model update that affected your prompt.

---

## Status

- [ ] Concept read and understood
- [ ] Level 1, 2, 3 prompts tested
- [ ] Crash report extractor built
- [ ] safe_parse_json function written and tested
- [ ] Q1 answered
- [ ] Q2 answered
- [ ] Q3 answered
- [ ] Q4 answered
- [ ] Q5 answered
- [ ] Answer guide reviewed
- [ ] Day 3 started — JSON Schema Enforcement

---

## Coming Up — Week 3, Day 3

**Topic:** JSON Schema Enforcement
Moving beyond asking for JSON to formally specifying your schema in the prompt. Type constraints, required fields, enum values, nested objects. Making Claude's output reliably match what your database expects.

---

*CCA Self-Study Log · Asif · Phase 1 of 5 · Week 3 of 12*
