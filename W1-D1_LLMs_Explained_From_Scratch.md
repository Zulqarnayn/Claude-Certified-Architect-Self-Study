# CCA Self-Study — Week 1, Day 1
## LLMs Explained From Scratch

**Date completed:** April 21, 2026
**Weekday:** Tue
**Study time:** 30–45 mins
**Curriculum phase:** Phase 1 — Claude Fundamentals
**Exam domain:** Foundation (pre-domain concepts)

---

## Executive Summary

Claude is a next-token prediction system, not a human-style reasoning engine. For architecture work, this means reliability comes from explicit context management, external memory, and guardrails rather than trusting model output by default.

---

## Core Concept

Claude is not thinking. Claude is **predicting**.

Every word Claude writes is the result of one question asked millions of times:
> *"Given everything written so far — what word should come next?"*

Claude was trained on an enormous amount of human writing and learned the patterns of how words, ideas, and reasoning flow together. Reasoning itself **emerged by accident** — Anthropic didn't program it in. Claude learned to mimic reasoning because reasoning is a pattern in human writing.

---

## Key Mental Model — Autocomplete on Steroids

| | Phone keyboard | Claude |
|---|---|---|
| Trained on | Your last 500 messages | Hundreds of billions of words |
| Predicts | 1 word at a time | Reasons across paragraphs |
| Understands context | Last few words | Entire long conversations |
| Can reason | No | Yes — emergently |

---

## Tokens — The Real Unit of Currency

Claude doesn't see words. Claude sees **tokens** (~3–4 characters each).

- "Hello" → 1 token
- "unbelievable" → 3 tokens
- "I built an iOS app" → 5 tokens
- A full page of text → ~400–500 tokens

**Everything in Claude's world is measured in tokens** — cost, speed, memory, and limits.

The maximum tokens Claude can hold in one conversation = **context window** = Claude's working memory. When exceeded, earlier parts get dropped.

---

## What Claude Is NOT

| Common belief | Reality |
|---|---|
| Claude searches the internet | ❌ Generates from training data |
| Claude knows today's news | ❌ Has a knowledge cutoff date |
| Claude "understands" like humans | ❌ Predicts patterns, not meaning |
| Claude remembers past conversations | ❌ Each conversation starts blank |
| Claude is always right | ❌ Can confidently hallucinate |

### Hallucination
When Claude makes something up confidently — that is not a traditional bug. It is the model predicting a plausible-sounding continuation that happens to be false. Architects design systems to **catch and handle** hallucinations, not trust output blindly.

---

## Claude.ai (Product) vs Claude API (Raw Model)

A critical distinction discovered during the hands-on task:

| | Claude.ai (the product) | Claude API (the raw model) |
|---|---|---|
| Web search | ✅ Built in | ❌ You build it |
| Memory across chats | ✅ Optional feature | ❌ You build it |
| File reading | ✅ Built in | ❌ You build it |
| Tools | ✅ Pre-built | ❌ You define them |
| Who controls it | Anthropic | You |

**Rule of thumb:**
- Use **claude.ai** to learn and experiment
- Use the **raw API** to build production systems

---

## Why This Matters for Architecture

Three root causes of almost every production AI system failure:

1. **Probabilistic output** — Claude can be confidently wrong
2. **Token limits** — context window overflow causes silent failures
3. **No memory** — every conversation starts blank

These three concepts underpin every architectural decision in the entire CCA curriculum.

---

## Hands-On Task — Observations

Tested Claude.ai with three questions:

1. *"What is today's date and what happened in the news today?"*
   → Claude answered correctly using **web search tool** (built into claude.ai product)

2. *"Do you remember what I asked you yesterday?"*
   → Claude had no memory of previous sessions

3. Started new conversation: *"What did we just talk about?"*
   → Claude had no context — blank slate confirmed

**Key insight from task:** Claude.ai added web search on top of the raw model. The raw model itself has no internet access. This is the product vs model distinction made visible.

---

## Q&A — Self-Assessment

**Q1. Was Claude "understanding" your iOS feature ideas, or doing something else?**

> A: No, it's not understanding. It predicts patterns without truly reasoning about my feature ideas — it has seen similar patterns before in training data.

✅ Correct. Claude doesn't "understand" the way a human colleague would. It recognizes patterns from millions of similar technical conversations and predicts a useful continuation.

---

**Q2. A customer asks about "this week's pricing update." What could go wrong?**

> A: It shouldn't know the price due to knowledge cutoff.

✅ Correct — plus one extra risk: Claude may state outdated pricing **with full confidence**, not with uncertainty. Confident wrongness is more dangerous than silence. This is why architects add guardrails.

---

**Q3. Where does memory need to live if Claude has none?**

> A: Memory should live outside the model. I am responsible for building it. Each conversation is blank and Claude has no context.

✅ Exactly right. Memory lives in a database, file, or session store — and you pass relevant pieces back into the context window each time. Claude never reaches out to grab it. You feed it.

**Technical name for this pattern:** Retrieval Augmented Generation (RAG) — covered in Week 4.

---

## Architect Patterns You Already Knew (Without the Names)

Discovered through discussion — these instincts from iOS app building map directly to real architecture patterns:

| What you did instinctively | The architect term | When we build it |
|---|---|---|
| Clear specific context | Context injection | Week 4 |
| Restrict hallucination | Output validation & guardrails | Week 3 & 8 |
| Global and local rules | CLAUDE.md hierarchy | Week 9 |
| Breaking features into tasks | Task decomposition | Week 7 |
| PRD → task list → build | Agentic planning loop | Week 7 |

**Key insight:** You were acting as the memory layer and the orchestrator manually. This curriculum teaches you how to make Claude do that loop automatically.

---

## Key Terms Learned Today

| Term | Definition |
|---|---|
| LLM | Large Language Model — predicts next token from training data |
| Token | ~3–4 characters; the unit Claude processes and costs are measured in |
| Context window | Maximum tokens Claude can hold at once — its working memory |
| Hallucination | Claude generating confident but false output |
| Knowledge cutoff | The date after which Claude has no training data |
| RAG | Retrieval Augmented Generation — feeding external memory into context |
| Prompt engineering | Crafting clear, specific inputs to get reliable Claude output |
| Guardrails | Programmatic checks that catch and handle bad Claude output |

---

## Status

- [x] Status: Completed
- [x] Concept read and understood
- [x] Hands-on task completed
- [x] Q&A answered
- [x] Instructor feedback received
- [x] Next target: W1-D2 — Claude vs other AI models (Completed)

---

*CCA Self-Study Log · Asif · Phase 1 of 5*
