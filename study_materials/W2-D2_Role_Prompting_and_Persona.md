---
layout: default
title: CCA Self-Study — Week 2, Day 2
---

# CCA Self-Study — Week 2, Day 2
## Role Prompting & Persona

**Date completed:** _____________
**Study time:** 30–45 mins
**Curriculum phase:** Phase 1 — Claude Fundamentals
**Exam domain:** Domain 4 · Prompt Engineering & Structured Output

---

## Core Concept

Role prompting is one of the most powerful and most misused techniques in prompt engineering. Done right, it transforms Claude from a general assistant into a specialist with a defined perspective, vocabulary, and set of assumptions. Done wrong, it's just a costume — Claude says "as a doctor..." but behaves identically to without the role.

Today you learn the difference.

---

## The Analogy — Method Acting vs Costume Party

A **method actor** fully inhabits a character. They adopt the character's mannerisms, thinking patterns, emotional responses, and worldview. When Daniel Day-Lewis played a 19th-century oil baron, he didn't just wear the outfit — he thought differently.

A **costume party** participant just wears a hat. Underneath, they're still themselves.

Bad role prompting = costume party. You say "you are a doctor" but Claude still responds like a generic assistant who happens to say "as a doctor..."

Good role prompting = method acting. Claude adopts the specialist's actual reasoning patterns, vocabulary, concerns, and blind spots.

---

## Why Role Prompting Works

Remember from Day 1 — Claude was trained on vast human writing. That writing includes the output of doctors, lawyers, engineers, marketers, teachers, and thousands of other specialisations. When you assign Claude a role, you are activating the subset of patterns associated with that role.

**This means:** The more specifically you define the role, the more precisely Claude activates the right patterns.

```
❌ "You are a doctor."
   → Activates generic medical knowledge

✅ "You are a board-certified emergency physician with 10 years of experience 
    in a busy urban trauma centre. You are direct, prioritise triage decisions, 
    and communicate in plain language to non-medical staff."
   → Activates specific: ER context, triage thinking, plain-language communication
```

---

## The 4 Dimensions of a Strong Role

### 1. Expertise Level
What does this person know deeply?

```
"You are a Swift developer with 8 years of experience, specialising in 
UIKit to SwiftUI migrations."
```

### 2. Context / Domain
Where do they work? What kind of problems do they typically solve?

```
"You work at a 10-person indie app studio where shipping fast matters more 
than perfect architecture."
```

### 3. Communication Style
How do they speak? To whom?

```
"You explain things clearly to non-technical stakeholders. 
You use analogies liberally and avoid jargon."
```

### 4. Values / Priorities
What do they care about? What do they optimise for?

```
"You always consider performance implications first, security second, 
and developer experience third."
```

---

## Persona vs Constraint — Critical Distinction

This is tested on the CCA exam.

| | Persona | Constraint |
|---|---|---|
| **Definition** | What Claude acts like | What Claude will/won't do |
| **Example** | "You are a formal British butler" | "Never use contractions. Never say 'I'" |
| **Effect** | Shapes tone, vocabulary, perspective | Enforces specific behaviour rules |
| **Reliability** | Probabilistic — Claude may drift | More reliable — but still not absolute |

A persona shapes probability. A constraint enforces rules.

**Architect rule:** For anything that MUST happen, use a constraint — not just a persona. A persona that "usually" behaves a certain way is not a valid production guarantee.

---

## Role Drift — The Production Problem

In long conversations, Claude can gradually drift away from its assigned role. This is called **role drift**.

Example: You set Claude as a strict "legal document analyser that only summarises facts." After 20 messages, Claude starts offering opinions and recommendations — behaviour it was told not to do.

**Why it happens:** As the conversation history grows, the system prompt (where the role is defined) becomes a smaller proportion of the total context. The role signal weakens relative to the conversation patterns.

**How to fix it:**
1. Keep system prompts concise — don't dilute the role with too much other content
2. Periodically reinforce the role in the conversation: *"Remember, your role is X. Continue accordingly."*
3. Use programmatic output validation to catch role violations (Week 3)
4. For long agent sessions, include the role reminder in your summarisation step (Week 7)

---

## Key Concepts Learned Today

| Term | Definition |
|---|---|
| Role prompting | Assigning Claude a specific identity to activate specialist patterns |
| Persona | The character Claude embodies — shapes tone, vocabulary, priorities |
| Constraint | A hard rule about what Claude will or won't do |
| Role drift | Gradual degradation of role adherence in long conversations |
| Method acting | The target — Claude fully inhabiting the role, not just wearing it |

---

## Hands-On Task 🛠️

Build three different versions of the same prompt with different roles. Use this base task:

**Base task:** *"Review my app's onboarding flow and tell me what's wrong with it."*

**Your app's onboarding:** New users sign up with email, verify email, then see a blank home screen with no instructions.

**Version 1:** Give Claude the role of a frustrated first-time user (not a specialist)
**Version 2:** Give Claude the role of a senior UX designer at a top mobile agency
**Version 3:** Give Claude the role of a growth hacker focused purely on conversion rates

Run all three. Compare how differently the same feedback is framed, prioritised, and communicated.

**Your observations:**
> _(write here)_

---

## Q&A — Self-Assessment

---

**Q1.** What is role drift, and why does it happen specifically in long conversations (hint: think about context window proportions)?

> **Your answer:**
> _(write here)_

---

**Q2.** You're building a medical triage chatbot. You write: *"You are a doctor. Be helpful."* Why is this role definition dangerously weak? Rewrite it with all 4 dimensions.

> **Your answer:**
> _(write here)_

---

**Q3.** A persona says "you are extremely concise — never write more than 2 sentences." A constraint says "maximum 2 sentences per response." Which is more architecturally reliable in a production system, and why?

> **Your answer:**
> _(write here)_

---

**Q4.** You're building a multi-agent system (preview of Week 8). You have a coordinator agent and a writer subagent. The writer keeps producing outputs that are too long. Which is more effective: telling the coordinator to instruct the writer to be concise, or putting a length constraint directly in the writer's system prompt?

> **Your answer:**
> _(write here)_

---

**Q5 — Architect Scenario.** Your customer-facing chatbot has been assigned the role of a "friendly, helpful brand ambassador." After 3 weeks in production, you notice it occasionally responds to frustrated customers with toxic positivity — aggressively cheerful responses that make angry users angrier. What is happening and how do you fix it?

> **Your answer:**
> _(write here)_

---

## Answer Guide — Claude's Reference Answers

---

**Q1 — Role drift in long conversations**

Role drift happens because Claude's system prompt (where the role is defined) is a fixed size — let's say 500 tokens. Early in the conversation, the system prompt represents 80% of the context and the role signal is strong. After 40 messages, the conversation history might be 8,000 tokens — and the role definition is now only 6% of what Claude is "looking at." The role signal gets diluted by sheer volume of conversation patterns, and Claude's output gradually gravitates toward what the conversation pattern suggests rather than what the role definition demands.

---

**Q2 — Rewriting the medical triage role**

**Why it's dangerous:** "Be helpful" and "you are a doctor" gives Claude no constraints on what kind of doctor, what context, what communication style, or what NOT to do. In a medical context, an overly helpful Claude might give specific diagnostic opinions it isn't qualified to give, causing real harm.

**Stronger version:**
```
You are a triage nurse assistant operating within a hospital's pre-screening system. 
Your role is ONLY to collect symptoms systematically using the OPQRST framework 
and assign a triage category (1-5). 

You do NOT: diagnose conditions, recommend medications, or provide medical opinions.
You always: ask one question at a time, use plain non-medical language, 
and end every interaction with "A medical professional will review your case."

If a patient reports chest pain, difficulty breathing, or loss of consciousness — 
immediately output: PRIORITY 1 — ALERT STAFF NOW.
```

---

**Q3 — Persona vs constraint reliability**

The **constraint** is more architecturally reliable.

A persona ("you are extremely concise") shapes probability — Claude will tend toward conciseness but may write 3 sentences when it "feels" a topic needs more. It's a nudge.

A constraint ("maximum 2 sentences per response") is a hard rule that Claude will apply consistently because it's explicit and unambiguous. If your system prompt says "maximum 2 sentences" and Claude writes 3, that's a clear, detectable violation — you can validate against it programmatically. You can't easily validate against "is this concise enough?"

**Architect rule:** Personas shape character. Constraints enforce behaviour. For production guarantees, use constraints.

---

**Q4 — Coordinator instruction vs subagent system prompt**

**Subagent system prompt — always.**

Putting a constraint in the writer subagent's system prompt means it applies on every single call to that subagent, regardless of what the coordinator says. It's enforced at the architectural level.

Relying on the coordinator to instruct the writer means: (a) the coordinator must remember to include the instruction every time, (b) the instruction travels through the coordinator's reasoning (adding a failure point), and (c) if the coordinator's prompt drifts or changes, the length constraint disappears.

Core principle: Constraints that must hold should be enforced as close to the output source as possible — in the subagent's own system prompt.

---

**Q5 — Toxic positivity chatbot**

**What's happening:** The "friendly, helpful brand ambassador" persona was too loosely defined. Claude interpreted "friendly" as maximally positive — which in the training data correlates with enthusiastic, upbeat language. For happy users, this works. For frustrated users, it reads as dismissive and tone-deaf.

**How to fix it:**
1. Add an explicit constraint: *"Match the emotional register of the user. If they express frustration or anger, acknowledge it directly before offering solutions. Never use exclamation marks when a user has expressed a complaint."*
2. Add few-shot examples showing the correct response to an angry user vs a happy user.
3. Add a programmatic sentiment classifier — if the user message scores as angry/frustrated, prepend a different instruction block to the system prompt before Claude responds.

The persona was right. The constraint layer was missing.

---

## Status

- [ ] Concept read and understood
- [ ] 3-version role experiment completed
- [ ] Q1 answered
- [ ] Q2 answered
- [ ] Q3 answered
- [ ] Q4 answered
- [ ] Q5 answered
- [ ] Answer guide reviewed
- [ ] Day 3 started — Chain of Thought Prompting

---

## Coming Up — Week 2, Day 3

**Topic:** Chain of Thought Prompting
Why asking Claude to "think step by step" dramatically improves accuracy on complex tasks. When it helps, when it hurts, and how to use it architecturally in multi-step reasoning pipelines.

---

*CCA Self-Study Log · Asif · Phase 1 of 5 · Week 2 of 12*
