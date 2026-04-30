# CCA Self-Study — Week 9, Day 5
## Prompt Caching

**Date completed:** _____________
**Study time:** 45 mins
**Curriculum phase:** Phase 4 — Claude Code & Workflows
**Exam domain:** Domain 5 · Context Management & Reliability (15%)

---

## Core Concept

Prompt caching is Anthropic's mechanism that allows you to cache static portions of your prompt — saving you from paying full input token prices every time you repeat the same large context. For high-volume production systems with long system prompts, large knowledge bases, or document-heavy workflows, prompt caching can reduce input costs by 80-90%.

The CCA exam tests whether you understand what gets cached, when cache hits occur, and how to design prompts for maximum cache efficiency.

---

## The Analogy — A Law Firm's Standard Contract Templates

A law firm has a 50-page standard contract template that's identical across thousands of deals. Without caching, every lawyer types those 50 pages from scratch for each deal. With caching, the standard template is stored, and lawyers only type the deal-specific details (client name, terms, price).

Prompt caching works the same way. Your system prompt (the 50-page template) is cached after the first call. Subsequent calls pay only for the new user message (the deal-specific details). The large static context is effectively free after the first call.

---

## How Prompt Caching Works

### Without Caching — You Pay Full Price Every Call

```
API Call 1:
  System prompt:    5,000 tokens  ← Paid in full
  User message:       200 tokens  ← Paid in full
  Total input:      5,200 tokens  ← Full price

API Call 2 (same system prompt, new user message):
  System prompt:    5,000 tokens  ← Paid AGAIN
  User message:       180 tokens  ← Paid in full
  Total input:      5,180 tokens  ← Full price again

100 calls/day = 520,000 input tokens just for the repeated system prompt
```

### With Caching — Static Parts Paid Once

```
API Call 1 (cache MISS — first time):
  System prompt:    5,000 tokens  ← Cache write: paid at 125% price
  User message:       200 tokens  ← Paid in full
  Total: 5,200 tokens             ← Slightly more expensive (cache write)

API Call 2 (cache HIT — subsequent calls within cache window):
  System prompt:    5,000 tokens  ← Cache read: paid at 10% price = 500 tokens
  User message:       180 tokens  ← Paid in full
  Total: 680 tokens               ← 87% savings on system prompt

100 calls/day = 52,000 equivalent tokens vs 520,000 without caching
```

**Pricing:**
- Cache write: 125% of normal input price (slightly more expensive)
- Cache read (hit): ~10% of normal input price (90% savings)

---

## Implementing Prompt Caching

```python
import anthropic

client = anthropic.Anthropic()

# System prompt with cache_control
response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    system=[
        {
            "type": "text",
            "text": """
You are an expert iOS app research assistant with deep knowledge of 
the App Store ecosystem, iOS development patterns, and mobile UX.

[... your full 5,000-token system prompt here ...]
""",
            "cache_control": {"type": "ephemeral"}  # ← This marks it for caching
        }
    ],
    messages=[
        {"role": "user", "content": "What's the best free screenshot app?"}
    ]
)

# Check cache performance
print(f"Input tokens: {response.usage.input_tokens}")
print(f"Cache read tokens: {response.usage.cache_read_input_tokens}")
print(f"Cache write tokens: {response.usage.cache_creation_input_tokens}")

# Calculate savings
cache_hits = response.usage.cache_read_input_tokens
cache_writes = response.usage.cache_creation_input_tokens
print(f"Cache hit rate tokens: {cache_hits} (paid at 10%)")
print(f"Cache write tokens: {cache_writes} (paid at 125%)")
```

---

## What Can Be Cached

### Cache-Eligible Content

```python
# Pattern 1: Large system prompt
system=[{
    "type": "text",
    "text": LARGE_SYSTEM_PROMPT,  # 5,000+ tokens
    "cache_control": {"type": "ephemeral"}
}]

# Pattern 2: Multiple static sections
system=[
    {
        "type": "text",
        "text": BASE_INSTRUCTIONS,  # Always the same
        "cache_control": {"type": "ephemeral"}
    },
    {
        "type": "text",
        "text": PRODUCT_KNOWLEDGE_BASE,  # Changes rarely
        "cache_control": {"type": "ephemeral"}
    }
    # Note: dynamic content (user-specific) goes in messages[], not system
]

# Pattern 3: Long documents in messages
messages=[
    {
        "role": "user",
        "content": [
            {
                "type": "text",
                "text": ENTIRE_CODEBASE_CONTENT,  # Large static document
                "cache_control": {"type": "ephemeral"}
            },
            {
                "type": "text",
                "text": "What are the authentication flows?"  # Dynamic question
                # No cache_control — this changes every call
            }
        ]
    }
]
```

### Cache Duration

- **Ephemeral cache:** Lasts approximately 5 minutes
- **Cache invalidates** when: the cached content changes, 5 minutes pass without a hit, or you don't use cache_control

**Implication for design:** If your system makes API calls less than once every 5 minutes with the same prompt, caching may not help (cache expires between calls). Caching is most valuable for high-frequency applications.

---

## Cache Key Design

The cache key is the EXACT byte sequence of cached content. Any change — even a single character — creates a new cache entry.

```python
# These hit the SAME cache entry (identical content)
system_prompt = "You are a research assistant. [... exact text ...]"

call_1 = {"system": [{"type": "text", "text": system_prompt, "cache_control": ...}]}
call_2 = {"system": [{"type": "text", "text": system_prompt, "cache_control": ...}]}  # ← CACHE HIT

# These create DIFFERENT cache entries (different content)
system_v1 = "You are a research assistant with expertise in iOS..."
system_v2 = "You are a research assistant with expertise in iOS."  # Trailing period added
# Even this tiny difference = cache MISS
```

**Practical implications:**
- Store your system prompt in a constant, not a formatted string
- Don't inject timestamps or request IDs into cached content
- Cache the static parts; put dynamic parts in messages[]

---

## The Cache-Worthy vs Cache-Unworthy Pattern

```python
# ❌ WRONG — caching dynamic content that changes per request
def make_api_call(user_id, user_name, current_time, user_query):
    response = client.messages.create(
        system=[{
            "type": "text",
            # This changes EVERY call — caching is useless
            "text": f"""
You are helping user {user_name} (ID: {user_id}).
Current time: {current_time}
[large static instructions...]
""",
            "cache_control": {"type": "ephemeral"}
        }],
        messages=[{"role": "user", "content": user_query}]
    )

# ✅ CORRECT — cache the static, put dynamic in messages[]
STATIC_SYSTEM = """
You are a customer support assistant for AcmeCorp.
[... large static instructions ...]
"""  # Identical every call — cache hits every time

def make_api_call(user_id, user_name, current_time, user_query):
    response = client.messages.create(
        system=[{
            "type": "text",
            "text": STATIC_SYSTEM,  # Always identical → always cache hit
            "cache_control": {"type": "ephemeral"}
        }],
        messages=[
            # Dynamic context goes here — not cached, pays full price
            {"role": "user", "content": 
             f"[User: {user_name}, ID: {user_id}, Time: {current_time}]\n{user_query}"}
        ]
    )
```

---

## Calculating Cache ROI

```python
def calculate_cache_savings(
    daily_calls: int,
    cached_tokens: int,
    input_price_per_million: float = 3.0  # Sonnet pricing
):
    # Without caching
    no_cache_daily = daily_calls * cached_tokens * (input_price_per_million / 1_000_000)
    
    # With caching
    write_cost = cached_tokens * (input_price_per_million * 1.25 / 1_000_000)  # 125% for write
    read_cost_per_call = cached_tokens * (input_price_per_million * 0.10 / 1_000_000)  # 10% for read
    cache_daily = write_cost + (daily_calls - 1) * read_cost_per_call  # 1 write, rest reads
    
    savings = no_cache_daily - cache_daily
    return {
        "no_cache_daily": no_cache_daily,
        "cache_daily": cache_daily,
        "daily_savings": savings,
        "monthly_savings": savings * 30,
        "savings_percent": (savings / no_cache_daily) * 100
    }

# Example: 5,000-token system prompt, 1,000 calls/day
result = calculate_cache_savings(1000, 5000)
print(result)
# → {'daily_savings': ~$0.135, 'monthly_savings': ~$4.04, 'savings_percent': ~90%}
```

---

## Key Concepts Learned Today

| Term | Definition |
|---|---|
| Prompt caching | Anthropic mechanism to cache static prompt sections across API calls |
| Cache hit | Subsequent call using already-cached content — paid at 10% price |
| Cache write | First call creating a cache entry — paid at 125% price |
| Ephemeral cache | Cache duration ~5 minutes; refreshes if hit within window |
| cache_control | API parameter that marks content for caching |
| Cache key | Exact byte sequence of cached content — any change = cache miss |
| Static vs dynamic | Static content should be cached; dynamic content in messages[] |

---

## Hands-On Task 🛠️

**Task 1:** Build a simple caching test. Create a 5,000-token system prompt. Make the same call twice. Compare `cache_read_input_tokens` between call 1 and call 2.

**Task 2:** Calculate: if your system makes 2,000 API calls/day with a 3,000-token system prompt (Claude Sonnet pricing), how much does caching save per month?

**Task 3:** Build the wrong pattern — inject a timestamp into the system prompt and verify cache always misses. Then fix it to get cache hits.

**Task 4:** Design a caching strategy for this scenario: an agent that answers questions about a large codebase (50,000 tokens of context). The codebase changes weekly. Users ask questions 100x/day.

**Your work and calculations:**
> _(write here)_

---

## Q&A — Self-Assessment (6 Questions)

---

**Q1.** Your system prompt has two sections: a 4,000-token base instruction (always identical) and a 1,000-token user-specific section (different per user). How do you cache only the base instruction?

> **Your answer:**
> _(write here)_

---

**Q2.** You cache a 10,000-token knowledge base document. Your system makes 500 calls/day with this document. After 3 weeks, the knowledge base is updated with 50 new tokens. What happens to your cache, and what is the cost impact of the update?

> **Your answer:**
> _(write here)_

---

**Q3.** Prompt caching has a 5-minute TTL. Your system makes one API call every 10 minutes. Will caching help? What's the effective hit rate, and is there a design change that would make caching worthwhile?

> **Your answer:**
> _(write here)_

---

**Q4.** You're building a multi-agent system with 5 subagents. Each subagent has the same base system prompt (3,000 tokens) plus agent-specific instructions (500 tokens). All 5 run in parallel. How many cache writes and reads occur in one parallel run?

> **Your answer:**
> _(write here)_

---

**Q5.** A developer says "I'll cache everything including the user's question to save tokens." Why doesn't this work, and what fundamental misunderstanding does it reveal?

> **Your answer:**
> _(write here)_

---

**Q6 — Exam Scenario.** A production customer support system handles 10,000 conversations/day. Each conversation has: a 5,000-token system prompt (identical), a 2,000-token product knowledge base (updated daily), and an average of 8 turns with 150 tokens per user message. Design the optimal caching strategy and calculate the monthly savings vs no caching using Sonnet pricing ($3/M input tokens).

> **Your answer:**
> _(write here)_

---

## Answer Guide — Claude's Reference Answers

---

**Q1 — Partial caching: base only**

```python
response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    system=[
        {
            "type": "text",
            "text": BASE_INSTRUCTIONS,  # 4,000 tokens — identical every call
            "cache_control": {"type": "ephemeral"}  # ← Cache this
        },
        {
            "type": "text",
            "text": user_specific_section  # 1,000 tokens — changes per user
            # No cache_control — don't cache this
        }
    ],
    messages=[...]
)
```

The `cache_control` marks only the base instructions for caching. The user-specific section pays full input price but is only 1,000 tokens (manageable). The 4,000-token base gets cached, producing hits at 10% price for all subsequent calls within the 5-minute window.

---

**Q2 — Cache invalidation on knowledge base update**

When you update the knowledge base (adding 50 tokens), the cached content changes — even by one byte. The old cache entry is no longer valid. The next API call generates a **cache miss** and a new **cache write** at 125% price.

**Cost impact of the weekly update:**
- 1 cache write: 10,050 tokens × 125% price = once per week cost spike
- All subsequent calls: cache hits at 10% price
- 499 calls that day after the first: all cache hits

The update cost is negligible (one cache write per week) compared to the savings from 3,499 cache reads per week. The update essentially resets the cache clock — expensive for one call, then back to cheap hits.

**Design implication:** Schedule knowledge base updates during low-traffic periods to minimise the number of users who experience the cache miss. If updated at 3 AM with 5 calls, the cost spike is tiny. Updated during peak hours, you might have hundreds of cache misses before the first hit stabilises the cache.

---

**Q3 — 10-minute call interval, 5-minute TTL**

**Caching will NOT help.** Every call is a cache miss because the 5-minute TTL expires before the next call arrives. You pay 125% price for the cache write on every call, but never get a cache read. Net result: every call costs more than without caching.

**Hit rate: ~0%** (the cache expires between calls)

**Design change to make caching worthwhile:**

Option 1 — **Increase call frequency:** If you can batch or pre-warm the cache, send a "dummy" call every 4 minutes to keep the cache alive. This only makes economic sense if the dummy calls cost less than the savings from reads.

Option 2 — **Increase calls per session:** If you're doing 1 call per 10 minutes, consider whether the workflow can be redesigned to do 3-4 calls in a burst (keeping cache warm) rather than 1 call spread out.

Option 3 — **Use a different optimisation:** For low-frequency, high-cost scenarios, token reduction (shorter prompts) or model selection (Haiku instead of Sonnet) may save more than caching.

The fundamental truth: **caching is for high-frequency systems.** For 1 call/10 minutes, optimise the prompt itself, not caching.

---

**Q4 — Cache behaviour in parallel multi-agent run**

**Setup:** 5 agents, each with 3,000-token base system prompt + 500 agent-specific instructions. All 5 start simultaneously.

**What happens:**

When 5 parallel calls arrive nearly simultaneously with identical 3,000-token base prompts:
- Call 1 arrives: cache MISS — **1 cache write** (3,000 tokens at 125%)
- Calls 2-5 arrive milliseconds later: the cache write from Call 1 may not have propagated yet

In practice, with truly parallel simultaneous calls, all 5 may experience cache misses on the first batch. This is a known limitation — the cache is not instantly available between parallel calls.

**On the second parallel batch** (assuming calls completed and 5 minutes haven't elapsed):
- All 5: cache HIT — **5 cache reads** (3,000 tokens at 10% each)

**Design implication:** For parallel multi-agent systems where cache hits are critical, consider a "warm-up" call before launching the parallel batch. One warm-up call writes the cache. All parallel agents then hit the warm cache.

---

**Q5 — Caching the user's question**

**Why it doesn't work:**

The user's question changes every conversation — that's the entire point. Caching it would require:
1. The cache key to be the user's question
2. Every future call to have the EXACT same question

In practice, every user asks different questions. The cache hit rate would be near 0%, and every call would pay the 125% cache write price — making caching actively more expensive than no caching.

**The misunderstanding:** Caching is designed for content that's STATIC across many calls — your instructions, knowledge bases, large documents that don't change. The user's question is by definition dynamic. It cannot benefit from caching because it's never repeated identically.

**The correct model:**
- Cache: System prompts, product knowledge, coding standards, large reference documents
- Don't cache: User messages, dynamic context, user-specific data, timestamps

---

**Q6 — Customer support caching strategy**

**Setup:**
- 10,000 conversations/day
- 5,000-token system prompt (identical)
- 2,000-token knowledge base (updated daily)
- 8 turns/conversation average
- 150 tokens/user message

**Total API calls:** 10,000 conversations × 8 turns = 80,000 calls/day

**Without caching — daily cost:**
- Per call input: 5,000 (system) + 2,000 (knowledge) + conversation history (grows) + 150 (user msg)
- Average per call input (accounting for growing history): ~8,500 tokens
- Daily input tokens: 80,000 × 8,500 = 680,000,000 tokens
- Daily cost: 680M × $3/1M = **$2,040/day**

**With caching — optimal strategy:**

Cache structure:
```python
system=[
    {"type": "text", "text": SYSTEM_PROMPT_5000,    # Static — cache
     "cache_control": {"type": "ephemeral"}},
    {"type": "text", "text": KNOWLEDGE_BASE_2000,   # Daily update — still cache
     "cache_control": {"type": "ephemeral"}},
]
messages=[
    {"role": "user", "content": user_message}        # Dynamic — no cache
    # conversation history also dynamic — no cache
]
```

**Cached tokens per call:** 7,000 (system + knowledge)
- Cache writes: ~2 per day (one write per cache refresh, knowledge updates daily)
- Cache reads: 80,000 - 2 ≈ 79,998 reads/day

**Cached daily cost:**
- Cache write cost: 2 × 7,000 × ($3.75/1M) = $0.05 (negligible)
- Cache read cost: 79,998 × 7,000 × ($0.30/1M) = **$168/day**
- Dynamic tokens (conversation history + user msg): 80,000 × 1,500 × ($3/1M) = **$360/day**
- **Total with caching: $528/day**

**Monthly savings:**
- Without: $2,040 × 30 = $61,200/month
- With: $528 × 30 = $15,840/month
- **Savings: $45,360/month (74% reduction)**

Note: The knowledge base updates daily, causing one cache miss per day — negligible compared to the savings.

---

## Status

- [ ] Caching test built (cache miss vs hit comparison)
- [ ] Monthly savings calculated for your scenario
- [ ] Timestamp-injection failure verified, then fixed
- [ ] Large codebase caching strategy designed
- [ ] All 6 questions answered
- [ ] Answer guide reviewed
- [ ] Week 9 complete 🎉

---

## Coming Up — Week 10, Day 1

**Topic:** Handoff Patterns
How to pass state between agents or sessions. Summarise, don't dump. Structured handoff objects vs raw history. The patterns that prevent context overflow and data loss in long-running agent workflows.

---

*CCA Self-Study Log · Asif · Phase 4 of 5 · Week 9 of 12*
