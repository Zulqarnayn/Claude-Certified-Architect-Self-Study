# CCA Self-Study — Week 2, Day 3
## Chain of Thought Prompting

**Date completed:** _____________
**Study time:** 30–45 mins
**Curriculum phase:** Phase 1 — Claude Fundamentals
**Exam domain:** Domain 4 · Prompt Engineering & Structured Output

---

## Core Concept

Chain of Thought (CoT) prompting is a technique where you ask Claude to reason through a problem step-by-step before giving a final answer. It sounds simple. Its effects are dramatic.

On complex reasoning tasks — logic problems, multi-step analysis, code debugging, ethical decisions — CoT can improve Claude's accuracy by 30–50%. On simple tasks, it adds unnecessary tokens and slows responses.

Knowing when to use it is an architect skill.

---

## The Analogy — Showing Your Working in Maths

Remember in school when teachers said *"show your working"?*

A student who jumps straight to the answer might get it right by luck or wrong by a small error. A student who writes out each step catches their own mistakes mid-process and builds a logical chain from problem to solution.

Claude works the same way. When asked to jump straight to an answer, it predicts the most likely answer token. When asked to reason step by step, it builds a logical chain — and each step constrains what comes next, dramatically reducing the chance of arriving at a wrong conclusion.

---

## How Chain of Thought Works

### Without CoT

```
User: "A customer bought 3 items at $12.99 each, used a 15% discount, 
       and lives in a state with 8.5% sales tax. What's the total?"

Claude: "$37.89"  ← May be wrong — jumped to answer
```

### With CoT

```
User: "A customer bought 3 items at $12.99 each, used a 15% discount, 
       and lives in a state with 8.5% sales tax. What's the total?
       Think through this step by step."

Claude:
Step 1: Base price = 3 × $12.99 = $38.97
Step 2: Discount = $38.97 × 15% = $5.85
Step 3: Price after discount = $38.97 - $5.85 = $33.12
Step 4: Sales tax = $33.12 × 8.5% = $2.82
Step 5: Total = $33.12 + $2.82 = $35.94

Answer: $35.94  ← Correct, auditable
```

The step-by-step process is visible, checkable, and each step constrains the next.

---

## Three Ways to Trigger CoT

### Method 1 — Simple instruction
```
"Think through this step by step before answering."
```
Best for: Ad hoc use, simple reasoning chains.

### Method 2 — Explicit structure
```
"Before giving your answer:
1. Restate the problem in your own words
2. Identify what information you have
3. Identify what information you need
4. Solve step by step
5. State your final answer clearly"
```
Best for: Complex multi-step problems where you want to control the reasoning structure.

### Method 3 — Scratchpad pattern (most powerful)
```
"Think through this problem in a <scratchpad> tag. 
After your scratchpad, give your final answer in an <answer> tag."
```

Example output:
```xml
<scratchpad>
The user wants to know if their business is profitable...
Revenue: $120,000
Costs: $95,000 + $18,000 = $113,000
Profit: $120,000 - $113,000 = $7,000
Margin: $7,000 / $120,000 = 5.8%
This is a thin margin for a product business...
</scratchpad>

<answer>
Your business is profitable with a 5.8% margin, though this is thin for 
a product business. Industry standard is typically 10-20%.
</answer>
```

The scratchpad pattern lets you extract just the final answer while Claude does full reasoning — useful when you don't want to show reasoning to end users.

---

## When to Use CoT — The Decision Framework

### Use CoT when:
- The task involves multiple steps or calculations
- The answer depends on conditional logic ("if X then Y, else Z")
- You need an auditable reasoning trail (compliance, legal, medical)
- Claude is getting wrong answers on a task and you need to debug why
- The task requires weighing trade-offs across multiple factors

### Skip CoT when:
- The task is simple and factual ("What's the capital of France?")
- You need fast, high-volume responses (Haiku classifying 10,000 emails)
- The task is creative and reasoning steps would constrain imagination
- You're paying per token and the reasoning adds significant cost with no accuracy benefit

---

## CoT in Production — Architectural Patterns

### Pattern 1: Separate reasoning from output
Run CoT in a first API call to generate reasoning. Extract the conclusion. Pass only the conclusion to a second call that formats the final response. Users see clean output, not raw reasoning.

### Pattern 2: CoT as a debugging tool
If your system is producing wrong outputs, add CoT temporarily. Read the reasoning chain to find where Claude goes wrong. Fix the prompt at that step. Remove CoT once fixed (to save tokens).

### Pattern 3: CoT for confidence calibration
Ask Claude to reason through its own confidence level:
```
"Before answering, reason through how confident you are and why. 
If your confidence is below 80%, flag the answer as 'uncertain'."
```
This surfaces low-confidence answers for human review rather than silently passing them downstream.

---

## Key Concepts Learned Today

| Term | Definition |
|---|---|
| Chain of Thought (CoT) | Technique asking Claude to reason step-by-step before answering |
| Scratchpad pattern | Hidden reasoning in a tag, clean answer extracted separately |
| CoT for debugging | Using reasoning traces to find where Claude's logic fails |
| Confidence calibration | Using CoT to surface uncertain answers for human review |
| Reasoning cost | CoT adds tokens — use only when accuracy benefit justifies it |

---

## Hands-On Task 🛠️

**Test 1:** Send Claude this WITHOUT CoT:
> *"I have a SaaS app with 150 monthly subscribers at $29/month, 8% monthly churn, and $45 average customer acquisition cost. Am I growing or shrinking, and what's my net revenue change this month?"*

Note the answer and whether you trust it.

**Test 2:** Send the SAME question WITH CoT:
> *"...Think through this step by step, showing each calculation."*

Compare: Is the answer different? Is it more trustworthy? Count the extra tokens used.

**Test 3:** Use the scratchpad pattern on a question of your own choice.

**Your observations:**
> _(write here)_

---

## Q&A — Self-Assessment

---

**Q1.** Explain in your own words why CoT improves accuracy. What is happening mechanically that makes step-by-step reasoning more reliable than direct answering?

> **Your answer:**
> _(write here)_

---

**Q2.** You're building an automated invoice processing system. It needs to extract line items, calculate totals, apply tax rules, and flag discrepancies. Should you use CoT? How specifically would you implement it?

> **Your answer:**
> _(write here)_

---

**Q3.** You have a high-volume sentiment classification system processing 50,000 product reviews per day. Each review needs a label: positive / negative / neutral. Should you use CoT? Justify your answer with token cost reasoning.

> **Your answer:**
> _(write here)_

---

**Q4.** What is the scratchpad pattern and why is it useful in a production system where you don't want end users to see Claude's reasoning?

> **Your answer:**
> _(write here)_

---

**Q5 — Architect Scenario.** Your legal contract analysis system is getting some decisions wrong — classifying a contract as "low risk" when it clearly contains a penalty clause. You can't figure out why from looking at inputs and outputs alone. How would you use CoT as a diagnostic tool?

> **Your answer:**
> _(write here)_

---

## Answer Guide — Claude's Reference Answers

---

**Q1 — Why CoT improves accuracy**

Claude generates text token by token — each token is predicted based on everything before it. When Claude jumps straight to an answer, it predicts what the most statistically likely answer looks like given the question. This can work for simple questions but fails for multi-step problems because the correct answer depends on intermediate calculations that Claude hasn't made explicit.

When Claude is forced to reason step-by-step, each step becomes part of the context that constrains the next token prediction. If Step 1 establishes that revenue is $38.97, Step 2 is now constrained to calculate 15% of $38.97 — not 15% of some other number. The reasoning chain is self-correcting because errors in one step are visible and constrain the chain to recover, rather than silently propagating to a wrong final answer.

---

**Q2 — CoT for invoice processing**

Yes — absolutely use CoT. Invoice processing is exactly the multi-step calculation scenario where CoT is most valuable, and where errors have real financial consequences.

Implementation:
```python
system = """
You are an invoice processing system.

For each invoice, reason through these steps before outputting your result:
<scratchpad>
Step 1: List all line items with quantities and unit prices
Step 2: Calculate each line item subtotal
Step 3: Sum all line item subtotals
Step 4: Apply any discounts
Step 5: Apply the applicable tax rate for the jurisdiction
Step 6: Calculate final total
Step 7: Compare calculated total to invoice's stated total — flag if discrepancy > $0.01
</scratchpad>

Then output ONLY a JSON object with: line_items, subtotal, discount, tax, total, discrepancy_flag
"""
```

The scratchpad reasoning catches errors. Only the structured JSON is extracted for downstream use.

---

**Q3 — CoT for 50,000 review classifications**

**No — do not use CoT here.**

50,000 reviews/day × cost of reasoning tokens = significant unnecessary spend. Sentiment classification (positive/neutral/negative) is not a complex reasoning task — it's pattern recognition. Claude can classify a review accurately without showing its work.

Estimate: A review classification without CoT might use 50–100 tokens per call. With CoT, it might use 200–400 tokens. At 50,000 calls/day, that's 7.5–15 million extra tokens daily — purely wasted on reasoning that doesn't improve a simple classification task.

Reserve CoT for complex, high-stakes decisions. For high-volume simple classification, use Haiku without CoT for maximum cost efficiency.

---

**Q4 — Scratchpad pattern**

The scratchpad pattern asks Claude to put its reasoning inside a specific XML tag (e.g., `<scratchpad>`) and the final answer in another tag (e.g., `<answer>`). Your code then extracts only the content between the answer tags and displays that to users.

Users get a clean, direct response. You get the full reasoning trace in your logs for debugging, auditing, and quality monitoring. It's the best of both worlds — Claude's full reasoning capability with a clean production output.

It's especially useful in compliance-heavy domains (legal, medical, financial) where you need an auditable reasoning trail for internal records but a simple, clear answer for the end user.

---

**Q5 — CoT as diagnostic tool**

1. Take 5–10 examples where the system misclassified a contract as "low risk"
2. Add CoT to your prompt temporarily: *"Before classifying, reason through every clause and explain what risk factors you identified and why."*
3. Read the reasoning traces for the misclassified contracts
4. Find the step where the logic fails — e.g., "I identified the penalty clause but classified it as standard boilerplate"
5. Fix the prompt at that specific point: add context about what makes a penalty clause high-risk, or add a few-shot example showing a high-risk penalty clause correctly classified
6. Test the fix, confirm accuracy improves, then remove CoT (or keep it in scratchpad mode for the audit trail)

CoT is the X-ray of prompt engineering — it shows you what's happening inside Claude's reasoning that you can't see from inputs and outputs alone.

---

## Status

- [ ] Concept read and understood
- [ ] Test 1 completed (without CoT)
- [ ] Test 2 completed (with CoT)
- [ ] Test 3 completed (scratchpad pattern)
- [ ] Q1 answered
- [ ] Q2 answered
- [ ] Q3 answered
- [ ] Q4 answered
- [ ] Q5 answered
- [ ] Answer guide reviewed
- [ ] Day 4 started — Negative Prompting

---

## Coming Up — Week 2, Day 4

**Topic:** Negative Prompting
Why telling Claude what NOT to do often works better than telling it what to do. The psychology of constraints. How negative instructions eliminate Claude's default behaviours that you don't want.

---

*CCA Self-Study Log · Asif · Phase 1 of 5 · Week 2 of 12*
