---
layout: default
title: CCA Self-Study — Week 4, Day 2
---

# CCA Self-Study — Week 4, Day 2
## Multi-Turn Conversations

**Date completed:** _____________
**Study time:** 30–45 mins
**Curriculum phase:** Phase 2 — Building with Claude
**Exam domain:** Domain 5 · Context Management & Reliability

---

## Core Concept

Claude has no memory. Every API call starts fresh — Claude knows nothing about previous calls unless you tell it. Multi-turn conversation is the pattern where YOU maintain the conversation history and pass it to Claude on every call. You are the memory. The API is stateless.

This single fact explains the architecture of every production Claude system.

---

## The Analogy — A Whiteboard Meeting with Amnesia

Imagine working with a brilliant consultant who has one quirk: at the end of every meeting, they completely forget everything that was discussed. When they walk in the next day, the whiteboard is blank and they remember nothing.

The solution: before each meeting, you write the summary of all previous meetings on the whiteboard. The consultant reads it, catches up instantly, and continues as if they remembered everything.

You are the person writing on the whiteboard. The `messages` array is the whiteboard. Every API call is a new meeting.

---

## How Multi-Turn Works in the API

### Single Turn (what you built in Week 1)

```python
response = client.messages.create(
    model="claude-haiku-4-5-20251001",
    max_tokens=500,
    messages=[
        {"role": "user", "content": "What is machine learning?"}
    ]
)
```

### Multi-Turn (stateful conversation)

```python
# You manage conversation history in a list
conversation_history = []

def chat(user_message: str) -> str:
    # Add user message to history
    conversation_history.append({
        "role": "user",
        "content": user_message
    })
    
    # Send full history to Claude every time
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=500,
        system="You are a helpful assistant.",
        messages=conversation_history  # ← Full history every call
    )
    
    # Extract Claude's response
    assistant_message = response.content[0].text
    
    # Add Claude's response to history for next turn
    conversation_history.append({
        "role": "assistant",
        "content": assistant_message
    })
    
    return assistant_message

# Usage:
print(chat("My name is Asif."))
print(chat("What did I just tell you my name was?"))  # Claude knows — it's in history
```

---

## The Cost Problem of Naive Multi-Turn

Here's the dark side of multi-turn: every conversation turn sends ALL previous turns to Claude.

```
Turn 1: 100 input tokens
Turn 2: 100 + 120 input tokens (prior turn + response)
Turn 3: 100 + 120 + 130 + 95 input tokens
...
Turn 20: Sum of ALL previous turns = potentially 5,000+ tokens just for history
```

In a long customer support conversation, you might be sending 10,000 tokens of history just to allow Claude to answer a simple new question. This is expensive and approaches context window limits.

---

## Three Strategies to Manage Multi-Turn Cost

### Strategy 1 — Sliding Window
Keep only the last N turns in history:

```python
MAX_HISTORY_TURNS = 10  # Keep last 10 turns (5 user + 5 assistant)

def chat_with_window(user_message: str) -> str:
    conversation_history.append({"role": "user", "content": user_message})
    
    # Trim to last N turns
    windowed_history = conversation_history[-MAX_HISTORY_TURNS:]
    
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=500,
        system=SYSTEM_PROMPT,
        messages=windowed_history
    )
    
    assistant_reply = response.content[0].text
    conversation_history.append({"role": "assistant", "content": assistant_reply})
    return assistant_reply
```

**Trade-off:** Simple and cheap. But early conversation context is lost. Bad for conversations where early constraints matter (e.g., "I have a $500 budget" said in Turn 1 is gone by Turn 15).

---

### Strategy 2 — Summarisation
Periodically compress history into a summary:

```python
def summarise_history(history: list) -> str:
    summary_response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=500,
        messages=[{
            "role": "user",
            "content": f"Summarise this conversation compactly, preserving all key facts, decisions, and constraints:\n\n{format_history(history)}"
        }]
    )
    return summary_response.content[0].text

def chat_with_summarisation(user_message: str) -> str:
    conversation_history.append({"role": "user", "content": user_message})
    
    # If history is getting long, summarise old turns
    if len(conversation_history) > 20:
        old_turns = conversation_history[:-6]  # Everything except last 3 exchanges
        recent_turns = conversation_history[-6:]
        
        summary = summarise_history(old_turns)
        
        # Replace old history with summary
        conversation_history.clear()
        conversation_history.append({
            "role": "user",
            "content": f"[Conversation summary: {summary}]"
        })
        conversation_history.append({
            "role": "assistant", 
            "content": "Understood. Continuing from where we left off."
        })
        conversation_history.extend(recent_turns)
    
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=500,
        messages=conversation_history
    )
    assistant_reply = response.content[0].text
    conversation_history.append({"role": "assistant", "content": assistant_reply})
    return assistant_reply
```

**Trade-off:** Preserves key information. More complex. Summary quality determines what's remembered.

---

### Strategy 3 — Structured State Object
Store conversation state as a structured object instead of raw history:

```python
conversation_state = {
    "user_name": None,
    "budget": None,
    "preferences": [],
    "decisions_made": [],
    "open_questions": []
}

def update_state(history: list) -> dict:
    """Extract structured state from conversation"""
    # Use Claude to extract state from latest exchange
    ...

def build_context_from_state(state: dict) -> str:
    """Convert state to a context summary for the prompt"""
    return f"""
    User: {state['user_name']}
    Budget: {state['budget']}
    Preferences: {', '.join(state['preferences'])}
    Decisions made: {'; '.join(state['decisions_made'])}
    """
```

**Trade-off:** Most token-efficient. High engineering effort. Best for well-defined domains (booking systems, configuration tools) where you know what state matters.

---

## Handling Conversation State Across Sessions

Sessions end. Users return. How do you maintain context across days?

```python
# Save conversation to database when session ends
def save_session(user_id: str, history: list):
    db.save(user_id, {
        "history": history,
        "saved_at": datetime.now().isoformat()
    })

# Load conversation when user returns
def load_session(user_id: str) -> list:
    saved = db.get(user_id)
    if saved and is_recent(saved["saved_at"]):
        return saved["history"]
    return []  # Fresh start if session is old

# On new session start:
conversation_history = load_session(current_user_id)
```

This is the pattern that Claude.ai uses for its memory feature — but you're implementing it yourself for your production system.

---

## Key Concepts Learned Today

| Term | Definition |
|---|---|
| Stateless API | Every Claude call starts fresh with no memory of prior calls |
| Conversation history | The messages array you maintain and pass on every call |
| Sliding window | Keeping only last N turns to limit context size |
| Summarisation | Compressing old history into a compact summary |
| Structured state | Extracting key facts from conversation into a typed object |
| Session persistence | Storing and reloading conversation history across sessions |

---

## Hands-On Task 🛠️

Build a multi-turn chatbot with conversation memory.

**Step 1:** Build the basic version — maintain full history, test that Claude remembers information from earlier turns.

**Step 2:** Run a 25-turn conversation. Log the `input_tokens` on each turn. Plot (or just write down) how token usage grows.

**Step 3:** Implement sliding window (last 8 turns). Compare token usage on the same 25-turn conversation.

**Step 4:** Test the sliding window's weakness — say your name in Turn 1, then ask "what's my name?" in Turn 15. Does Claude remember?

**Your results:**
> _(write here)_

---

## Q&A — Self-Assessment

---

**Q1.** A user starts a support conversation, solves their issue, then returns 3 days later with a related problem. Should you load the 3-day-old conversation history for context? What factors would influence your decision?

> **Your answer:**
> _(write here)_

---

**Q2.** You're using the sliding window strategy with the last 10 turns. A user says "remember, I'm on the basic plan" in Turn 2. They ask a billing question in Turn 15. Will Claude know they're on the basic plan? How do you fix this?

> **Your answer:**
> _(write here)_

---

**Q3.** Why does each new turn cost more tokens than the previous one in a naive multi-turn implementation? Calculate the input tokens for Turn 5 if each turn is 100 tokens and each response is 150 tokens.

> **Your answer:**
> _(write here)_

---

**Q4.** You're building a travel booking chatbot. Users have long conversations — 30+ turns. Which history management strategy would you choose and why? What specific information must never be lost?

> **Your answer:**
> _(write here)_

---

**Q5 — Architect Scenario.** Your multi-turn chatbot is deployed. Users report that Claude sometimes "forgets" constraints they set earlier in the conversation. Your sliding window is 12 turns. You notice failures happen most often around Turn 15–20. What is happening and how do you fix it architecturally?

> **Your answer:**
> _(write here)_

---

## Answer Guide — Claude's Reference Answers

---

**Q1 — Loading 3-day-old conversation history**

**Factors to consider:**

1. **Relevance:** Is the old conversation about the same issue? A 3-day-old conversation about a billing problem is irrelevant to a new question about a technical bug.

2. **User expectation:** Do your users expect continuity? A customer support tool where users expect agents to "know their history" should load it. A general Q&A tool probably shouldn't.

3. **Token cost:** Loading a long old conversation adds significant token cost to every turn in the new session. Is the continuity worth the cost?

4. **Privacy and data retention:** Storing and loading conversation history raises GDPR/privacy questions. Do you have a retention policy?

**Practical approach:** Store a structured summary of key facts from each session (account type, issue category, resolution outcome), not the full history. Load the summary (50 tokens) rather than the full transcript (2,000+ tokens) when the user returns.

---

**Q2 — Sliding window loses early context**

Claude will NOT know they're on the basic plan — Turn 2 has been dropped by Turn 15 in a 10-turn window.

**Fix — Persistent context extraction:**
After each turn, extract "persistent facts" that must always be in context:

```python
persistent_context = {
    "plan": "basic",           # Extracted from Turn 2
    "account_age": "2 years",  # Extracted from Turn 4
    "open_issue": "billing"    # Current topic
}

# Always prepend to system prompt:
system = f"""
User account context (always apply):
- Plan: {persistent_context['plan']}
- Account age: {persistent_context['account_age']}

{BASE_SYSTEM_PROMPT}
"""
```

The persistent context lives in the system prompt — always in context regardless of conversation length. The sliding window handles the recent conversation flow.

---

**Q3 — Token growth calculation**

Each turn sends the full history. Assuming 100 tokens per user message and 150 tokens per assistant response:

```
Turn 1 input:  100 tokens (just the first user message)
Turn 2 input:  100 + 150 + 100 = 350 tokens
Turn 3 input:  100 + 150 + 100 + 150 + 100 = 600 tokens
Turn 4 input:  850 tokens
Turn 5 input:  100 + (150+100) × 4 = 100 + 1000 = 1,100 tokens
```

By Turn 5, you're paying 11x the tokens of Turn 1, just for the history. By Turn 20, this is 20+ times more. This is why naive multi-turn is expensive at scale and why history management is an architect concern, not just a code detail.

---

**Q4 — Travel booking chatbot strategy**

**Best strategy: Structured state object**

Travel booking has a well-defined state space: departure city, destination, dates, passengers, budget, preferences, selected flights/hotels, payment status. This information is what matters — not the conversational flow that produced it.

```python
booking_state = {
    "origin": "Dhaka",
    "destination": "Dubai",
    "departure_date": "2026-06-15",
    "passengers": 2,
    "budget_usd": 800,
    "preferences": ["window_seat", "vegetarian_meal"],
    "selected_flight": None,
    "selected_hotel": None,
    "payment_status": "pending"
}
```

**Information that must never be lost:**
- Budget constraint (turning this off would be catastrophic)
- Passenger count (affects all pricing)
- Dates (time-sensitive)
- Payment information (legal requirement)

After every turn, update the state object. On every API call, inject the state as context. Keep only the last 4–6 turns of conversation flow for natural dialogue. State never ages out — it's the source of truth.

---

**Q5 — Failures around Turn 15–20**

**What's happening:** Your sliding window is 12 turns. The user set a constraint in Turn 3 or 4. By Turn 15, that turn has been dropped from the window. Claude no longer knows the constraint exists. It answers as if the constraint was never set.

**Why Turn 15–20 specifically:** With 12-turn window and constraints typically set in the first 3–5 turns: Turn 15 is where Turn 3 falls out of the window (15 - 12 = 3). This matches the failure pattern exactly.

**Architectural fix:**

1. **Extract constraints into persistent context** (same as Q2 fix) — identify what information the user explicitly sets (budget, preferences, account type) and pin it in the system prompt.

2. **Increase window size selectively** — not all turns are equal. Keep all "constraint-setting" turns (detected by a classifier or keyword match) regardless of position.

3. **Summarisation with constraint preservation** — when summarising, specifically instruct Claude: "Always preserve: budget constraints, timeline constraints, and any explicit user requirements."

4. **Monitor the failure pattern** — log which Turn number failures occur. If they consistently cluster around Turn N, your window is N - (average constraint-setting turn number). Adjust accordingly.

---

## Status

- [ ] Concept read and understood
- [ ] Basic multi-turn chatbot built
- [ ] Token growth measured over 25 turns
- [ ] Sliding window implemented and tested
- [ ] Sliding window weakness demonstrated
- [ ] Q1 answered
- [ ] Q2 answered
- [ ] Q3 answered
- [ ] Q4 answered
- [ ] Q5 answered
- [ ] Answer guide reviewed
- [ ] Day 3 started — Streaming Responses

---

## Coming Up — Week 4, Day 3

**Topic:** Streaming Responses
What streaming is, why it dramatically improves UX, how to implement it correctly, and the architectural differences between streamed and non-streamed responses in production systems.

---

*CCA Self-Study Log · Asif · Phase 2 of 5 · Week 4 of 12*
