---
layout: default
title: CCA Self-Study — Week 2, Day 1
---

# CCA Self-Study — Week 2, Day 1
## What Makes a Good Prompt

**Date completed:** _____________
**Study time:** 30–45 mins
**Curriculum phase:** Phase 1 — Claude Fundamentals
**Exam domain:** Domain 4 · Prompt Engineering & Structured Output

---

## Core Concept

Prompt engineering is the most misunderstood skill in AI development. Most people think it means finding magic words that make Claude behave. It doesn't.

**Prompt engineering is the practice of removing ambiguity.**

Claude is not guessing what you want — it is predicting the most likely useful continuation of your input. The more precisely you define what "useful" looks like, the more reliably Claude produces it. A vague prompt produces a vague response. Not because Claude is bad — because you gave it nothing to be specific about.

---

## The Analogy — A Brief to a Contractor

Imagine hiring a contractor to renovate your kitchen.

**Bad brief:** *"Make it nicer."*
The contractor does their best interpretation — maybe they repaint when you wanted new cabinets.

**Good brief:** *"Replace the cabinet doors with white shaker-style panels. Keep the existing layout. Budget is $3,000. Finish by Friday. Don't touch the appliances."*
The contractor has constraints, a goal, a format, and a deadline. They can execute without guessing.

Claude is the contractor. Your prompt is the brief. Every word of ambiguity is a decision you're leaving to Claude — and Claude will make a decision, just not necessarily the one you wanted.

---

## The 5 Elements of a Strong Prompt

### 1. Role
Tell Claude who it is in this context.

```
❌ Weak:  "Help me with this email."
✅ Strong: "You are a senior sales executive with 15 years of B2B experience."
```

Role shapes the vocabulary, assumptions, and perspective Claude brings to the task.

### 2. Task
State exactly what you want done — not what you want to talk about.

```
❌ Weak:  "My email to a client."
✅ Strong: "Rewrite the following email to be more concise and persuasive. 
            The goal is to get a meeting booked within 48 hours."
```

### 3. Context
Give Claude the information it needs that isn't in its training data.

```
❌ Weak:  "Write a feature for my app."
✅ Strong: "My app is a SwiftUI iOS app for tracking daily water intake. 
            Users are health-conscious adults aged 25-45. The feature should 
            add a streak counter that shows consecutive days of hitting the goal."
```

Context is what you were doing naturally when you built iOS apps — describing your specific situation. Now formalise it.

### 4. Format
Tell Claude exactly how you want the output structured.

```
❌ Weak:  "Give me some ideas."
✅ Strong: "Return exactly 5 ideas. Format each as:
            **Idea name:** [one line]
            **Why it works:** [one sentence]
            **Risk:** [one sentence]"
```

### 5. Constraints
Tell Claude what NOT to do — often more powerful than telling it what to do.

```
❌ Weak:  "Write a short summary."
✅ Strong: "Summarise in exactly 3 bullet points. 
            Do not include specific numbers or statistics. 
            Do not use the word 'however'."
```

---

## The Prompt Quality Test

After you write a prompt, ask yourself these four questions:

1. **Could a smart human misunderstand this?** If yes — add specificity.
2. **Does Claude know what format success looks like?** If not — add format instructions.
3. **Is there information Claude needs that it won't have?** If yes — add context.
4. **What's the worst plausible interpretation of this prompt?** If it's bad — add a constraint.

---

## Reading Claude's Output as Feedback

This is the skill that separates good prompt engineers from great ones.

When Claude gives you a bad response, most people blame Claude. Architects blame their prompt.

| Claude's output | What it tells you about your prompt |
|---|---|
| Too generic / vague | You didn't give enough specific context |
| Wrong format | You didn't specify output format |
| Too long | You didn't constrain length |
| Missing the point | Your task description was ambiguous |
| Hallucinated details | You asked for things Claude can't verify — add a constraint |
| Inconsistent tone | You didn't specify role or audience |

Every bad Claude output is a signal. Read it as a bug report on your prompt.

---

## The Iteration Model

Good prompts are built through iteration, not written perfectly first try.

```
Draft prompt
     ↓
Run it → Read output critically
     ↓
Identify the weakest element (role / task / context / format / constraint)
     ↓
Fix that element only
     ↓
Run again → Compare
     ↓
Repeat until output matches intent
```

Change **one thing at a time**. If you change everything at once, you don't know what fixed the problem.

---

## Key Concepts Learned Today

| Term | Definition |
|---|---|
| Prompt engineering | The practice of removing ambiguity from Claude instructions |
| Role | The persona or expertise Claude should embody for the task |
| Task | The specific action Claude should take — not just the topic |
| Context | Information Claude needs that isn't in its training data |
| Format | The explicit structure of Claude's expected output |
| Constraint | What Claude should NOT do — often more powerful than positive instructions |
| Prompt iteration | Changing one element at a time to systematically improve output |

---

## Hands-On Task 🛠️

Take this weak prompt and improve it through 3 iterations:

**Starting prompt:**
> *"Help me write something for my app users."*

**Your task:**
1. Identify all 5 missing elements (role, task, context, format, constraint)
2. Write Version 2 — add role and task only. Run it. Note the output.
3. Write Version 3 — add context. Run it. Note the improvement.
4. Write Version 4 — add format and constraints. Run it. Note the final output.

Compare V1 output to V4 output side by side.

**Your 4 versions and observations:**
> _(write here)_

---

## Q&A — Self-Assessment

---

**Q1.** What is the difference between a "task" and a "topic" in a prompt? Give an example of a prompt that states a topic but not a task.

> **Your answer:**
> _(write here)_

---

**Q2.** Claude returns a response that's far too long and covers things you didn't ask about. Without changing the topic of your prompt — what specific element would you add or change, and how?

> **Your answer:**
> _(write here)_

---

**Q3.** You ask Claude to write a product description and it hallucinate features your product doesn't have. Which of the 5 elements was missing or weak, and how would you fix it?

> **Your answer:**
> _(write here)_

---

**Q4.** Take this prompt and rewrite it applying all 5 elements:
*"Write a blog post about AI."*
Your rewritten version should be for a specific audience, a specific angle, a specific format, and have at least one constraint.

> **Your answer:**
> _(write here)_

---

**Q5 — Architect Thinking.** In a production system, you can't manually iterate prompts every time — the system runs automatically. How do you "bake in" good prompt quality so it works reliably across thousands of calls without you watching?

> **Your answer:**
> _(write here)_

---

## Answer Guide — Claude's Reference Answers

---

**Q1 — Task vs topic**

A **topic** tells Claude what the conversation is about. A **task** tells Claude what action to take.

Example of topic without task: *"My company's onboarding process."*
Claude doesn't know if you want to analyse it, improve it, document it, summarise it, critique it, or compare it to industry standards.

Adding a task: *"Write a 5-step onboarding checklist for new engineers joining my company's iOS team."*
Now Claude knows the action (write a checklist), the format (5 steps), the audience (new engineers), and the context (iOS team).

---

**Q2 — Response too long**

Add a **constraint** specifically targeting length and scope:

*"Respond in exactly 3 sentences. Cover only [specific aspect]. Do not include background information or caveats."*

Also consider adding a **format** specification: *"Use bullet points, maximum 3 bullets, each under 15 words."*

Length problems are almost always format and constraint problems — Claude defaults to thoroughness unless you explicitly constrain it.

---

**Q3 — Hallucinated product features**

The missing element is **context**. Claude doesn't know your actual product — it invented features based on pattern-matching against similar products it's seen.

Fix: Provide explicit product facts in the prompt.

```
"Write a product description for our app called ScreenshotAI.
Here are the ONLY features it has — do not mention anything else:
- Organises screenshots by OCR-detected text
- Runs entirely on-device (no internet required)
- Supports iOS 16+
- Free with a one-time $4.99 unlock for unlimited storage"
```

By providing the exact facts and adding "do not mention anything else," you eliminate the hallucination surface.

---

**Q4 — Rewritten blog post prompt**

```
You are a senior iOS developer with 5 years of experience shipping indie apps.

Write a blog post aimed at iOS developers who are curious about integrating 
AI features into their apps but have never done it before.

The post should:
- Be exactly 400 words
- Have 3 sections with short headers
- Use a practical, conversational tone — not academic
- Include one specific code example in Swift
- End with one actionable next step the reader can do today

Do not use the words "revolutionary," "game-changing," or "powerful."
Do not include a generic introduction paragraph about AI trends.
```

---

**Q5 — Reliable prompts at scale**

Three strategies architects use:

1. **Invest heavily in system prompt design upfront.** Test it against 50+ varied inputs before deployment. The system prompt is your production contract with Claude — treat it like code, not like a chat message.

2. **Add output validation as a programmatic layer.** Don't rely on Claude always producing the right format — validate the output in code. If it fails, retry with an error message added to the prompt (Week 3).

3. **Use few-shot examples.** Put 2–3 examples of perfect outputs directly in your system prompt. Examples outperform instructions for format consistency because Claude pattern-matches to examples rather than interpreting abstract rules.

The prompt is the first line of quality. Validation is the second. Both are required in production.

---

## Status

- [ ] Concept read and understood
- [ ] Hands-on 4-version iteration completed
- [ ] Q1 answered
- [ ] Q2 answered
- [ ] Q3 answered
- [ ] Q4 answered
- [ ] Q5 answered
- [ ] Answer guide reviewed
- [ ] Day 2 started — Role Prompting & Persona

---

## Coming Up — Week 2, Day 2

**Topic:** Role Prompting & Persona
How giving Claude a specific role changes its outputs. The difference between a persona (what Claude acts like) and a constraint (what Claude won't do). How to use role prompting to get expert-level outputs.

---

*CCA Self-Study Log · Asif · Phase 1 of 5 · Week 2 of 12*
