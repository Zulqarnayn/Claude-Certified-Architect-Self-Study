# CCA Self-Study — Week 3, Day 1
## Few-Shot Examples

**Date completed:** _____________
**Study time:** 30–45 mins
**Curriculum phase:** Phase 1 — Claude Fundamentals
**Exam domain:** Domain 4 · Prompt Engineering & Structured Output

---

## Core Concept

Instructions tell Claude what you want. Examples *show* Claude what you want. In most production scenarios, showing outperforms telling — especially for format consistency, tone matching, and reasoning patterns that are difficult to describe in words.

**Few-shot prompting** is the technique of including 2–5 examples of ideal input-output pairs directly in your prompt. Claude pattern-matches to your examples rather than interpreting your abstract instructions.

---

## The Analogy — Training a New Employee

You can train a new employee two ways:

**Method 1 — Instructions:**
*"When a customer complains, acknowledge their frustration, offer a specific solution, and end with a question to confirm resolution."*

**Method 2 — Examples:**
*"Here's how Sarah handled a complaint last week:*
*Customer: 'My order arrived broken.'*
*Sarah: 'I'm really sorry about that — a broken delivery is completely unacceptable. I've already arranged a replacement to ship today. Will that work for you, or would you prefer a refund?'"*

Method 2 is faster to understand and easier to replicate. The new employee sees the tone, the structure, the length, and the exact phrasing — in one example.

Claude works the same way. Examples compress a lot of implicit information that would take paragraphs of instructions to describe.

---

## Zero-Shot vs Few-Shot vs Many-Shot

| Type | Examples given | Best for |
|---|---|---|
| Zero-shot | 0 | Simple, well-defined tasks |
| One-shot | 1 | When one example fully demonstrates the pattern |
| Few-shot | 2–5 | Most production use cases |
| Many-shot | 10–50+ | Complex patterns, high accuracy needs, diverse edge cases |

More examples generally improve accuracy — up to a point. After ~10 high-quality examples, returns diminish. Choose quality over quantity.

---

## What Examples Do That Instructions Can't

### 1. Demonstrate implicit patterns

Some formats are hard to describe but easy to show:

```
❌ Instruction: "Write in a casual but professional tone with moderate sentence length."
✅ Example: Shows exactly what "casual but professional" looks like in practice
```

### 2. Handle ambiguous edge cases

```
Examples can show: "If the review is ambiguous, classify as neutral — like this example..."
No instruction can cover every ambiguity, but a good example set can.
```

### 3. Establish output length implicitly

```
If all your examples are 2 sentences long, Claude outputs 2 sentences.
No length instruction needed.
```

### 4. Pattern-match reasoning style

```
Few-shot examples can show not just the output but the reasoning chain.
Claude learns to reason the same way your examples reason.
```

---

## How to Build Good Examples

### Step 1: Start with real cases
Use actual inputs and outputs from your domain — not made-up ones. Real cases capture the actual distribution of inputs your system will see.

### Step 2: Cover the important variations
If your inputs vary by type, emotion, length, or language — make sure your examples cover the most common variants.

### Step 3: Include at least one negative/tricky case
Show Claude how to handle the edge case that usually breaks things:

```
Example 3 (tricky case):
Input: "Fine." (ambiguous 2-star review)
Output: {"sentiment": "negative", "confidence": 0.6, "flag_for_review": true}
```

### Step 4: Make examples consistent with each other
If Example 1 uses camelCase JSON keys and Example 2 uses snake_case — Claude will be confused. Every example must follow the exact same format you want in production.

---

## The Few-Shot Template

```
[System prompt with role and task]

Here are examples of the correct output format:

---
Example 1:
Input: [example input 1]
Output: [ideal output 1]

---
Example 2:
Input: [example input 2]
Output: [ideal output 2]

---
Example 3:
Input: [example input 3]
Output: [ideal output 3]

---
Now process this input:
Input: [actual user input]
Output:
```

The `Output:` at the end is a soft prefill — it primes Claude to continue in output format immediately.

---

## Few-Shot for Format vs Few-Shot for Reasoning

**Few-shot for format:** Examples show what the output should look like.
Use when: output structure is complex or hard to describe in words.

**Few-shot for reasoning:** Examples show the reasoning process AND the output.
Use when: the correct reasoning pattern is as important as the answer.

```python
# Few-shot for reasoning example:
"""
Example 1:
Customer says: "I've been a customer for 5 years and this is unacceptable."
Reasoning: Long-tenure customer + strong frustration = high priority, personal response
Response: "Five years means a lot to us — this absolutely should not have happened to you..."

Example 2:
Customer says: "first time trying this app and it's buggy"
Reasoning: New customer + frustration = risk of churn, focus on retention
Response: "We want your first experience to be great — let us make this right..."
"""
```

---

## Key Concepts Learned Today

| Term | Definition |
|---|---|
| Few-shot prompting | Including 2–5 input-output examples to demonstrate desired behaviour |
| Zero-shot | No examples — Claude uses only instructions |
| Many-shot | 10+ examples for complex patterns or high accuracy requirements |
| Implicit pattern | Format/tone information conveyed through examples rather than described |
| Example diversity | Covering the main variants your system will encounter |

---

## Hands-On Task 🛠️

Build a few-shot prompt for this task:

**Task:** Classify iOS app crash reports into categories: UI_BUG / PERFORMANCE / DATA_LOSS / AUTH_ISSUE / OTHER — with a confidence score.

**Step 1:** Write a zero-shot prompt. Test it on these 3 reports:
- *"App freezes on the profile screen after I tap my avatar"*
- *"All my saved notes disappeared after the update"*
- *"Login with Apple fails every time on iPhone 15 Pro"*

Note the output format — is it consistent?

**Step 2:** Build 3 few-shot examples using the format you want. Run again. Compare consistency.

**Step 3:** Add a tricky example: *"The app is slow"* — show Claude how to handle low-specificity reports.

**Your prompts and comparison:**
> _(write here)_

---

## Q&A — Self-Assessment

---

**Q1.** You have a task where the output format is simple (just "positive" / "negative" / "neutral") but the reasoning about *why* something is positive or negative is complex. Should your examples include reasoning steps or just the final label? Justify.

> **Your answer:**
> _(write here)_

---

**Q2.** You have 50 perfect examples from your production logs. Should you include all 50 in your prompt? What are the trade-offs?

> **Your answer:**
> _(write here)_

---

**Q3.** Your few-shot examples all show English inputs. Your system will receive inputs in 10 different languages. Does few-shot still help for non-English inputs, or do you need language-specific examples?

> **Your answer:**
> _(write here)_

---

**Q4.** You notice that adding Example 4 to your 3-example set actually makes outputs *worse* — Claude starts following Example 4's format instead of the more common pattern. What is happening, and what should you do?

> **Your answer:**
> _(write here)_

---

**Q5 — Architect Scenario.** You're handing over a Claude-powered system to a client. The system uses 5 few-shot examples. The client wants to update the examples themselves as their business evolves. What risks does this create, and how would you design the system to allow safe example updates?

> **Your answer:**
> _(write here)_

---

## Answer Guide — Claude's Reference Answers

---

**Q1 — Include reasoning in examples?**

Yes — include reasoning steps even though the final label is simple.

When the classification task is complex (nuanced sentiment, domain-specific logic), the reasoning steps in your examples teach Claude *how to think* about the problem — not just what answer to produce. Without reasoning examples, Claude might correctly classify easy cases but fail on ambiguous ones because it's pattern-matching to the label without understanding the logic.

Include reasoning in a scratchpad tag, extract only the final label for your pipeline output:
```
Example reasoning: <think>The phrase "disappointed but not surprised" signals repeated negative experience — that's a strong negative signal despite the hedging language</think>
Label: negative
```

---

**Q2 — 50 examples trade-offs**

**Don't include all 50.** The trade-offs:

*Benefits of more examples:* Better coverage of edge cases, more accurate pattern matching, fewer surprises in production.

*Costs of more examples:*
1. **Token cost:** 50 examples might add 5,000–10,000 tokens to every API call. At 10,000 calls/day, that's 50–100 million extra tokens daily.
2. **Context dilution:** Very long example sets push your actual instructions further from the end of the system prompt, potentially weakening them.
3. **Overfitting to examples:** Claude might start pattern-matching so rigidly to your 50 examples that it handles genuinely novel inputs poorly.

**Best practice:** Select the 5–10 most representative and diverse examples. Use many-shot only when accuracy requirements justify the token cost.

---

**Q3 — Few-shot for non-English inputs**

Few-shot still helps significantly, even with English-only examples. Claude's multilingual training means it understands the output pattern from English examples and applies it to inputs in other languages.

However, language-specific examples improve accuracy further — especially for:
- Languages with different cultural norms around expressing sentiment
- Technical terms that don't translate directly
- Edge cases specific to one language's grammar or idiom

**Practical approach:** Use your English examples as the base. Add 1–2 examples in the most common non-English languages your system handles. Test accuracy on a sample of real non-English inputs before deploying.

---

**Q4 — Example 4 makes things worse**

What's happening: Example 4 introduced a pattern that Claude weighted heavily — perhaps it had a unique format, unusual phrasing, or an edge case structure that Claude is now applying too broadly.

Claude treats all examples as roughly equal demonstrations of the correct behaviour. If one example is an outlier, Claude may "average" toward it.

**What to do:**
1. Remove Example 4 and confirm the problem disappears
2. Diagnose what's unique about Example 4 that Claude is latching onto
3. If Example 4 represents a real edge case you need to handle, add 1–2 *counter-examples* that show the common case more clearly — diluting Example 4's weight
4. Alternatively, add a brief instruction: *"Example 4 is only for [specific condition] — use the format from Examples 1–3 for all other cases"*

---

**Q5 — Client-safe example updates**

**Risks of client editing examples:**
1. Client introduces inconsistent formatting — Claude starts producing malformed output
2. Client adds a poorly-crafted example that becomes the dominant pattern
3. Client removes an example that was handling a critical edge case
4. Client accidentally creates contradictory examples

**Design for safe updates:**
1. **Store examples separately from the prompt template** — in a database or config file, not hardcoded in the prompt string. The prompt template assembles examples at runtime.
2. **Add example validation** — when a new example is saved, run it through Claude and check the output matches the expected format before activating it in production.
3. **Version control examples** — keep history so you can roll back if a new example breaks things.
4. **Test on a sample** — before activating new examples in production, automatically test the updated prompt against 20 known-good inputs and flag regressions.
5. **Lock the format contract** — even if clients can change content, enforce that examples must follow the exact input/output structure your parser expects.

---

## Status

- [ ] Concept read and understood
- [ ] Zero-shot test completed
- [ ] Few-shot examples built and tested
- [ ] Tricky example added
- [ ] Q1 answered
- [ ] Q2 answered
- [ ] Q3 answered
- [ ] Q4 answered
- [ ] Q5 answered
- [ ] Answer guide reviewed
- [ ] Day 2 started — Structured Output: JSON Basics

---

## Coming Up — Week 3, Day 2

**Topic:** Structured Output — JSON Basics
Getting Claude to return machine-readable JSON consistently. Why LLMs sometimes hallucinate structure. Your first attempt at schema enforcement.

---

*CCA Self-Study Log · Asif · Phase 1 of 5 · Week 3 of 12*
