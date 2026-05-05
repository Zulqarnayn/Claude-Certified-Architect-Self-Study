---
layout: default
title: CCA Self-Study — Week 1, Day 3
---

# CCA Self-Study — Week 1, Day 3
## The Context Window

**Date completed:** _____________
**Study time:** 30–45 mins
**Curriculum phase:** Phase 1 — Claude Fundamentals
**Exam domain:** Domain 5 · Context Management & Reliability

---

## Core Concept

You learned in D1 that the context window is Claude's working memory. Today we go deeper — because **the context window is the single most important architectural constraint you will design around for the entire CCA curriculum.**

Almost every production AI failure traces back to one of three things:
1. Context overflowed silently
2. The wrong things were in context
3. Context was passed inefficiently (wasting cost)

---

## The Analogy — A Whiteboard in a Meeting Room

Imagine Claude is a brilliant consultant who works in a room with a whiteboard. Everything relevant to your project gets written on that whiteboard — your question, the conversation history, documents you've shared, tool results, instructions.

The consultant can only see what's on the whiteboard. They have no filing cabinet, no notebook, no memory of last week's meeting. **The whiteboard is everything.**

Now imagine the whiteboard has a size limit. When it fills up — the oldest things get erased to make room for new ones. The consultant keeps working, but is now missing context from earlier in the conversation. They don't tell you things were erased. They just work with what's there.

That silent erasure is the #1 cause of subtle, hard-to-debug failures in production AI systems.

---

## What Lives Inside the Context Window

Every token Claude processes in a conversation consumes context window space:

```
┌─────────────────────────────────────┐
│         CONTEXT WINDOW              │
│  ┌─────────────────────────────┐   │
│  │ System prompt               │   │
│  │ (your instructions + rules) │   │
│  ├─────────────────────────────┤   │
│  │ Conversation history        │   │
│  │ (all prior messages)        │   │
│  ├─────────────────────────────┤   │
│  │ Tool call results           │   │
│  │ (data from external tools)  │   │
│  ├─────────────────────────────┤   │
│  │ Documents / files injected  │   │
│  ├─────────────────────────────┤   │
│  │ Current user message        │   │
│  └─────────────────────────────┘   │
│              ↓                      │
│         Claude's response           │
└─────────────────────────────────────┘
```

Everything above the response counts against your limit. Claude's response itself also consumes tokens — that's why `max_tokens` is a parameter you set.

---

## Context Window Sizes — What You're Working With

| Model | Context window | Practical meaning |
|---|---|---|
| Claude Haiku | 200,000 tokens | ~150,000 words |
| Claude Sonnet 4.6 | 200,000 tokens | ~150,000 words |
| Claude Opus | 200,000 tokens | ~150,000 words |

200,000 tokens sounds enormous. But consider a real production scenario:

- System prompt with detailed rules: 2,000 tokens
- 50-message conversation history: 15,000 tokens
- A PDF document injected for analysis: 40,000 tokens
- Tool call results from 3 API calls: 8,000 tokens
- **Total used: 65,000 tokens** — still fine

But add a large codebase, a long conversation, and multiple documents — and you approach the limit fast.

---

## What Happens When Context Overflows

This is the critical thing most beginners don't know:

**Claude does not stop and warn you when context is full.**

Instead, one of two things happens depending on how you've set things up:

1. **API returns an error** — `context_length_exceeded` — your system crashes unless you handle it
2. **Truncation** — older messages get dropped silently — Claude continues but has lost earlier context

The truncation case is the dangerous one. Your system keeps running. Claude keeps responding. But it's working with incomplete information and you may not notice until something goes subtly wrong downstream.

---

## The Three Architect Responses to Context Limits

### 1. Summarisation
Before context fills up, summarise the conversation so far into a compact form. Replace the full history with the summary. Continue with the new, smaller context.

```
Full history (15,000 tokens)
→ Summarise to key facts (1,500 tokens)
→ Continue with summary + new messages
```

### 2. Retrieval (RAG)
Don't put everything in context upfront. Store documents externally. When Claude needs information, retrieve only the relevant chunks and inject them. This is Retrieval Augmented Generation — you built this intuitively with your iOS apps.

### 3. Sliding Window
Keep only the last N messages in context. Drop the oldest when new ones come in. Simple but lossy — fine for short-term tasks, dangerous for long conversations where early context matters.

---

## The Cost Dimension

Context isn't just a technical limit — it's a cost driver.

Every token in your context window costs money on every API call. If you have a 10,000 token system prompt and make 1,000 API calls per day — that's 10 million tokens just for the system prompt, every single day.

**Prompt caching** (Week 10) solves this — but understanding the cost model now shapes how you design prompts from day one.

**Architect rule:** Every token in your context should earn its place. If it's not helping Claude produce a better response, it's costing you money for nothing.

---

## Key Concepts Learned Today

| Term | Definition |
|---|---|
| Context window | The total tokens Claude can process in one request — input + output |
| Context overflow | When input exceeds the limit — causes error or silent truncation |
| Silent truncation | Oldest context dropped without warning — most dangerous failure mode |
| Summarisation | Compressing conversation history to free up context space |
| RAG | Retrieval Augmented Generation — inject only relevant chunks, not everything |
| Sliding window | Keep only last N messages — simple context management strategy |
| Prompt caching | Caching static prompt sections to reduce token costs |

---

## Hands-On Task 🛠️

No coding yet — but a thinking exercise with real numbers.

You're designing a customer support bot. It needs:
- A system prompt explaining the bot's rules and product info: **~3,000 tokens**
- Access to your full product manual (for answering questions): **~80,000 tokens**
- Conversation history kept for context: **~500 tokens per message**
- The bot handles conversations up to 30 messages long

**Calculate:**
1. If you inject the full product manual every call — how many tokens are used after 10 messages?
2. After 30 messages — are you still within 200,000 tokens?
3. What strategy would you use instead of injecting the full manual?

Work through the numbers and write your answer below. Then answer the questions.

**Your working:**
> _(write here)_

---

## Q&A — Self-Assessment

Write your answers before reading the Answer Guide below.

---

**Q1.** In your own words — what is the difference between a context overflow that causes an API error vs one that causes silent truncation? Which is more dangerous in a production system and why?

> **Your answer:**
> _(write here)_

---

**Q2.** You're building an agent that helps users plan long projects — conversations can run for hours with 100+ messages. Which context management strategy would you use and why? Is there a risk with your chosen strategy?

> **Your answer:**
> _(write here)_

---

**Q3.** A junior developer on your team says: *"I'll just put our entire company knowledge base (500,000 tokens) into the system prompt so Claude always has everything it needs."* What's wrong with this plan — give at least two problems.

> **Your answer:**
> _(write here)_

---

**Q4.** You have a system prompt that is 8,000 tokens long and stays identical across every API call. You make 2,000 API calls per day. Roughly how many tokens per day are spent just on the system prompt? What feature (covered briefly today) would dramatically reduce this cost?

> **Your answer:**
> _(write here)_

---

**Q5 — Architect Scenario.** Your production system has been running fine for 3 weeks. Suddenly users report that the bot "forgets" things they said at the start of the conversation. No errors in your logs. What is most likely happening, and what would you do to diagnose and fix it?

> **Your answer:**
> _(write here)_

---

## Answer Guide — Claude's Reference Answers

> Read this **after** writing your own answers above.

---

**Q1 — API error vs silent truncation**

**API error:** Your system gets a clear signal that something went wrong — `context_length_exceeded`. It crashes or triggers your error handler. This is actually the *safer* failure because it's visible. You know something is wrong immediately.

**Silent truncation:** Your system keeps running. Claude keeps responding. But it's working with an incomplete picture — early instructions, constraints, or user context have been quietly dropped. The bot might give subtly wrong answers, forget rules from the system prompt, or contradict things the user said earlier. You may not notice for days.

**Silent truncation is more dangerous** because it produces wrong outputs that look right. A crash tells you to fix something. Silent corruption lets bad outputs reach users undetected.

---

**Q2 — Context strategy for 100+ message conversations**

**Best strategy: Summarisation + Retrieval hybrid**

After every 20–30 messages, trigger a summarisation step — ask Claude to compress the conversation so far into a structured summary (key decisions made, current state, open questions). Replace the full history with the summary. This keeps context lean while preserving the meaningful content.

Pure sliding window is risky here — if a user established a critical constraint in message 5 ("I have a $10,000 budget") and you're on message 80, that constraint has been dropped. For project planning, early context often matters most.

**Risk:** Summarisation itself costs tokens and time. If your summary loses important nuance, Claude works with an incomplete picture. Always structure summaries with explicit fields rather than free-form prose.

---

**Q3 — Problems with 500,000 token system prompt**

**Problem 1: It exceeds Claude's context window entirely.** Claude Sonnet's limit is 200,000 tokens. 500,000 tokens is 2.5x the maximum. The API call would fail immediately.

**Problem 2: Even if it fit — cost would be catastrophic.** At 500,000 tokens per call × 2,000 calls/day = 1 billion tokens/day just for the prompt. At typical API pricing, this would cost thousands of dollars daily.

**Problem 3: More context ≠ better answers.** Claude's attention degrades over very long contexts — information in the middle of a massive context gets "lost" even if it technically fits. This is called the "lost in the middle" problem.

**Solution:** Use RAG — store the knowledge base externally, retrieve only the 3–5 most relevant chunks per query, inject those. Same quality, fraction of the cost.

---

**Q4 — System prompt token cost**

8,000 tokens × 2,000 calls/day = **16,000,000 tokens/day** just for the system prompt.

At roughly $3 per million input tokens (Sonnet pricing), that's ~$48/day or ~$1,440/month — just for your system prompt being re-read on every call.

**The feature:** Prompt caching. Anthropic's API can cache your static system prompt so it only needs to be processed once per cache period (typically 5 minutes). Cache hits cost ~90% less than regular input tokens. On a high-volume system, this single optimisation can save hundreds of dollars per month.

---

**Q5 — Bot "forgets" things, no errors in logs**

**Most likely cause: Silent context truncation.**

After 3 weeks of operation, if your conversations are getting longer (more messages, more history), you've likely hit the point where the context window fills up and old messages are being silently dropped. The absence of errors in logs is the tell — truncation doesn't throw exceptions.

**Diagnosis steps:**
1. Log the total token count of every API request
2. Check if token counts are approaching 200,000 on the conversations where users report forgetting
3. Check which messages are being truncated — is it early conversation or system prompt content?

**Fix:**
Implement a token counter before every API call. When you approach 80% of the context limit, trigger a summarisation step proactively — don't wait for overflow. Add an alert if any request exceeds your threshold.

---

## Status

- [ ] Concept read and understood
- [ ] Hands-on calculation completed
- [ ] Q1 answered
- [ ] Q2 answered
- [ ] Q3 answered
- [ ] Q4 answered
- [ ] Q5 answered
- [ ] Answer guide reviewed
- [ ] Day 4 started — System Prompts vs User Messages

---

## Connection to Previous Lessons

| Earlier concept | How it connects to D3 |
|---|---|
| Claude has no memory (D1) | Context window IS the memory — when it fills, memory is lost |
| Tokens as currency (D1) | Context window = token budget per request |
| External memory is your job (D1) | RAG is the professional implementation of this |
| Model family cost differences (D2) | Larger context = more cost regardless of model |

---

## Coming Up — Day 4

**Topic:** System Prompts vs User Messages
The two roles in every Claude conversation. How system prompts set the rules of engagement. Why the distinction matters for security, consistency, and architecture.

---

*CCA Self-Study Log · Asif · Phase 1 of 5 · Week 1 of 12*
