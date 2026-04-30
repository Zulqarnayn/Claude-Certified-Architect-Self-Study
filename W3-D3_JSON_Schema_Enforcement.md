# CCA Self-Study — Week 3, Day 3
## JSON Schema Enforcement

**Date completed:** _____________
**Study time:** 30–45 mins
**Curriculum phase:** Phase 1 — Claude Fundamentals
**Exam domain:** Domain 4 · Prompt Engineering & Structured Output

---

## Core Concept

Yesterday you learned to ask Claude for JSON. Today you go one level deeper — formally specifying your schema so Claude knows not just the keys, but the exact types, allowed values, required fields, and nested structure your downstream system expects.

The difference between asking for JSON and enforcing a schema is the difference between "please be on time" and "the meeting starts at 9:00 AM sharp and the door locks at 9:01."

---

## The Analogy — A Database Table Definition

When you create a database table, you don't just say "store user data." You define:

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  age INTEGER CHECK (age >= 0 AND age <= 150),
  role ENUM('admin', 'user', 'guest') DEFAULT 'user',
  created_at TIMESTAMP NOT NULL
);
```

Every column has a type. Constraints are enforced. Invalid data is rejected at the database level.

Your JSON schema definition in a Claude prompt is the same thing — you're telling Claude the equivalent of `NOT NULL`, `ENUM`, `CHECK`, and `DEFAULT` for every field it must produce.

---

## The Full Schema Definition Toolkit

### 1. Required Fields
```
Required fields (all must be present):
- category (string)
- confidence (number)
- tags (array)
```

### 2. Type Constraints
```
Types:
- category: string
- confidence: number (float, not string)
- count: integer (whole number only)
- is_urgent: boolean (true or false, not "true" or "false")
- tags: array of strings
- metadata: object
```

### 3. Enum Values
```
category must be exactly one of: "bug" | "feature" | "question" | "other"
No other values are allowed.
```

### 4. Range Constraints
```
confidence: float between 0.0 and 1.0 inclusive
priority: integer between 1 and 5 inclusive
```

### 5. Array Constraints
```
tags: array of strings, minimum 0 items, maximum 5 items
Each tag must be lowercase, no spaces
```

### 6. Nested Objects
```
location: object with required keys:
  - city: string
  - country: string (ISO 3166-1 alpha-2 code, e.g. "US", "BD")
  - timezone: string (e.g. "Asia/Dhaka")
```

### 7. Nullable Fields
```
resolved_at: string (ISO 8601 datetime) or null if not yet resolved
```

---

## Putting It All Together — A Full Schema Prompt

```
You are a support ticket classifier.

Analyse the support message and return ONLY a valid JSON object 
matching this exact schema:

{
  "category": <"bug" | "feature_request" | "billing" | "other">,
  "severity": <"low" | "medium" | "high" | "critical">,
  "confidence": <float, 0.0–1.0>,
  "is_urgent": <boolean>,
  "summary": <string, maximum 100 characters>,
  "tags": <array of strings, 0–5 items, lowercase>,
  "requires_human": <boolean>,
  "estimated_resolution_hours": <integer or null>
}

Schema rules:
- All fields are required
- category must be exactly one of the four values listed
- severity must be exactly one of the four values listed  
- confidence must be a float (e.g. 0.87, not "0.87" or "high")
- is_urgent and requires_human must be boolean (true/false, not strings)
- summary must not exceed 100 characters
- tags must be lowercase strings with no spaces (use underscores)
- estimated_resolution_hours: integer if known, null if unknown

Output ONLY the JSON object. No other text.
```

---

## Validation in Code — The Second Layer

The prompt enforces schema in Claude. Code enforces schema in your system. Both layers are required.

```python
from dataclasses import dataclass
from typing import Literal
import json

def validate_ticket_schema(data: dict) -> tuple[bool, list[str]]:
    errors = []
    
    # Check required fields
    required = ["category", "severity", "confidence", "is_urgent", 
                "summary", "tags", "requires_human", "estimated_resolution_hours"]
    for field in required:
        if field not in data:
            errors.append(f"Missing required field: {field}")
    
    if errors:  # Stop early if required fields missing
        return False, errors
    
    # Validate enum values
    valid_categories = {"bug", "feature_request", "billing", "other"}
    if data["category"] not in valid_categories:
        errors.append(f"Invalid category: {data['category']}")
    
    valid_severities = {"low", "medium", "high", "critical"}
    if data["severity"] not in valid_severities:
        errors.append(f"Invalid severity: {data['severity']}")
    
    # Validate types
    if not isinstance(data["confidence"], (int, float)):
        errors.append(f"confidence must be a number, got {type(data['confidence'])}")
    elif not 0.0 <= data["confidence"] <= 1.0:
        errors.append(f"confidence must be 0.0–1.0, got {data['confidence']}")
    
    if not isinstance(data["is_urgent"], bool):
        errors.append(f"is_urgent must be boolean, got {type(data['is_urgent'])}")
    
    if not isinstance(data["tags"], list):
        errors.append(f"tags must be an array")
    elif len(data["tags"]) > 5:
        errors.append(f"tags array exceeds max 5 items")
    
    if len(data["summary"]) > 100:
        errors.append(f"summary exceeds 100 chars: {len(data['summary'])}")
    
    return len(errors) == 0, errors

# Usage
raw = response.content[0].text
try:
    data = json.loads(raw)
    is_valid, errors = validate_ticket_schema(data)
    if not is_valid:
        print(f"Schema validation failed: {errors}")
        # trigger retry
except json.JSONDecodeError as e:
    print(f"JSON parse failed: {e}")
    # trigger retry
```

---

## The Retry Loop

When validation fails, send the errors back to Claude:

```python
def classify_ticket_with_retry(message: str, max_retries: int = 3) -> dict:
    messages = [{"role": "user", "content": message}]
    
    for attempt in range(max_retries):
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=500,
            system=SCHEMA_SYSTEM_PROMPT,
            messages=messages
        )
        
        raw = response.content[0].text
        
        try:
            data = json.loads(raw)
            is_valid, errors = validate_ticket_schema(data)
            
            if is_valid:
                return data  # Success
            
            # Append error feedback and retry
            messages.append({"role": "assistant", "content": raw})
            messages.append({
                "role": "user", 
                "content": f"Your response had schema errors: {errors}. "
                          f"Please fix and return valid JSON only."
            })
            
        except json.JSONDecodeError as e:
            messages.append({"role": "assistant", "content": raw})
            messages.append({
                "role": "user",
                "content": f"Your response was not valid JSON. "
                          f"Parse error: {e}. Return only the JSON object."
            })
    
    raise Exception(f"Failed to get valid output after {max_retries} attempts")
```

---

## Key Concepts Learned Today

| Term | Definition |
|---|---|
| Schema enforcement | Formally specifying types, enums, ranges, and required fields in the prompt |
| Enum constraint | Restricting a field to an exact set of allowed values |
| Type validation | Code-side check that Claude's output types match your schema |
| Retry loop | Re-prompting Claude with its validation errors when output is invalid |
| Defense in depth | Enforcing schema in both the prompt AND in code |

---

## Hands-On Task 🛠️

Design and implement a schema for an iOS app review analyser.

**Schema requirements:**
- `app_version` — string or null (if not mentioned)
- `os_version` — string or null
- `device` — string or null
- `issue_type` — enum: crash / performance / ui_bug / missing_feature / positive_feedback / other
- `sentiment_score` — float -1.0 to 1.0
- `would_recommend` — boolean or null (if can't determine)
- `key_complaint` — string, max 80 chars, or null if positive review

**Your tasks:**
1. Write the full schema definition prompt
2. Write the Python validation function
3. Test on 5 varied reviews (crash, positive, vague, feature request, angry)
4. Trigger at least one validation failure and confirm your retry loop works

**Your implementation:**
> _(write here)_

---

## Q&A — Self-Assessment

---

**Q1.** What is the difference between JSON parse failure and schema validation failure? Why do you need to handle both separately?

> **Your answer:**
> _(write here)_

---

**Q2.** Your schema has `severity: "low" | "medium" | "high" | "critical"`. Claude returns `"severity": "moderate"`. Your validator catches this. What do you put in the retry message to Claude to maximise the chance it returns a valid value?

> **Your answer:**
> _(write here)_

---

**Q3.** You're validating a field `confidence: float 0.0–1.0`. Claude returns `"confidence": 1`. Is this valid? What about `"confidence": true`? Explain your reasoning.

> **Your answer:**
> _(write here)_

---

**Q4.** Your retry loop has `max_retries = 3`. After 3 failures, what should your system do? Give a specific answer for a high-stakes system (medical records) vs a low-stakes system (product review tags).

> **Your answer:**
> _(write here)_

---

**Q5 — Architect Scenario.** Your schema changes — you add a new required field `language_code` (ISO 639-1, e.g. "en", "bn"). Your prompt is updated. But your validation code isn't updated yet. What happens, and what process should you have in place to prevent schema/code drift?

> **Your answer:**
> _(write here)_

---

## Answer Guide — Claude's Reference Answers

---

<details>
<summary><b>Q1 — Parse failure vs schema validation failure</b></summary>

**JSON parse failure:** Claude's output is not valid JSON at all — missing brackets, extra text, markdown fences, broken string escaping. `json.loads()` throws a `JSONDecodeError`. You can't access any fields.

**Schema validation failure:** Claude's output IS valid JSON — it parses successfully — but the content doesn't match your schema. `json.loads()` succeeds but `data["category"]` returns `"moderate"` instead of an allowed enum value, or `data["confidence"]` is a string `"0.87"` instead of a float.

**Why handle separately:**
- Parse failure → send JSON formatting error back to Claude
- Schema failure → send specific field errors back to Claude

Sending a schema error message for a parse failure confuses Claude (it thinks the structure was fine). Sending a parse error for a schema failure loses the specific field information Claude needs to fix. Precise error messages = faster recovery.

</details>

---

<details>
<summary><b>Q2 — Retry message for invalid enum</b></summary>

```python
retry_message = f"""Your previous response had this schema error:
severity must be exactly one of: "low", "medium", "high", "critical"
You returned: "moderate"

"moderate" is not a valid value. Choose the closest match:
- If minor issue: "low"
- If noticeable but not blocking: "medium"  
- If significantly impacts usage: "high"
- If system is unusable or data loss: "critical"

Return only the corrected JSON object."""
```

Key principles: state the exact error, show exactly what's allowed, give decision guidance for the ambiguous case (moderate → medium or high?), and remind Claude of the output format.

</details>

---

<details>
<summary><b>Q3 — Confidence: 1 vs true</b></summary>

**`"confidence": 1`** → Valid. In Python, `isinstance(1, (int, float))` returns `True` — integers are valid numbers. `1` is within the 0.0–1.0 range. Your validator should accept it. Coerce to float if needed: `float(data["confidence"])`.

**`"confidence": true`** → Invalid. In Python, `isinstance(True, (int, float))` actually returns `True` because Python's `bool` is a subclass of `int`. This is a gotcha! You need to explicitly check: `isinstance(data["confidence"], bool)` and reject booleans before checking for numeric type.

```python
if isinstance(data["confidence"], bool):
    errors.append("confidence must be a number, not a boolean")
elif not isinstance(data["confidence"], (int, float)):
    errors.append("confidence must be a number")
```

Always check for bool before checking for int/float in Python.

</details>

---

<details>
<summary><b>Q4 — After max retries</b></summary>

**High-stakes system (medical records):**
Never silently fail or use a default value. After 3 failures:
1. Log all 3 attempts with full input/output for audit trail
2. Raise an exception that halts processing of this record
3. Route to a human review queue with all context
4. Alert on-call engineer if failure rate exceeds threshold
5. The record waits for human classification — data integrity > throughput

**Low-stakes system (product review tags):**
After 3 failures:
1. Log the failure
2. Assign a default/fallback classification: `{"category": "other", "confidence": 0.0, "flag": "auto_classified_failed"}`
3. Continue processing — don't block the pipeline for a review tag
4. Monitor failure rate — investigate if it rises
5. Human reviews flagged items in batch at end of day

**The principle:** Failure handling must match the cost of being wrong. Medical record misclassification could harm a patient. Review tag failure is annoying but recoverable.

</details>

---

<details>
<summary><b>Q5 — Schema/code drift</b></summary>

**What happens:** Claude now returns `language_code: "en"` in its output. Your validator doesn't check for it, so it passes validation even if absent. Downstream code that expects `data["language_code"]` throws a `KeyError`. Your pipeline breaks — but only for records where Claude doesn't include the field, which might not be all of them (intermittent failures are the hardest to debug).

**Prevention process:**

1. **Schema as single source of truth:** Define your schema in one place (a Pydantic model, a JSON Schema file, a dataclass) that is used by both the prompt generator AND the validator. When you update the schema, both update automatically.

```python
from pydantic import BaseModel
from typing import Literal, Optional

class TicketClassification(BaseModel):
    category: Literal["bug", "feature_request", "billing", "other"]
    language_code: str  # New field — add here, validator updates automatically
    confidence: float

# Generate prompt schema from model
schema_description = TicketClassification.schema_json(indent=2)

# Validate using model
result = TicketClassification(**data)  # Raises ValidationError if invalid
```

2. **Schema versioning:** Version your schemas. When schema changes, bump the version. Log which schema version produced each output.

3. **Integration tests:** Maintain a test suite that runs your full prompt + validator against known inputs after every schema change.

</details>

---

## Status

- [ ] Concept read and understood
- [ ] Full schema prompt written
- [ ] Python validator implemented
- [ ] Retry loop implemented and tested
- [ ] Q1 answered
- [ ] Q2 answered
- [ ] Q3 answered
- [ ] Q4 answered
- [ ] Q5 answered
- [ ] Answer guide reviewed
- [ ] Day 4 started — Validation & Retry Loops

---

## Coming Up — Week 3, Day 4

**Topic:** Validation & Retry Loops
The complete production pattern for handling Claude's structured output. Multi-layer validation, intelligent retry messages, exponential backoff, and when to escalate vs retry.

---

*CCA Self-Study Log · Asif · Phase 1 of 5 · Week 3 of 12*
