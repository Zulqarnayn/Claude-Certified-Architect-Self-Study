# CCA Self-Study — Week 4, Day 4
## Token Counting & Cost

**Date completed:** _____________
**Study time:** 30–45 mins
**Curriculum phase:** Phase 2 — Building with Claude
**Exam domain:** Domain 5 · Context Management & Reliability

---

## Core Concept

Token awareness is the difference between a system that scales economically and one that becomes prohibitively expensive as it grows. Every architect decision you make — model choice, context strategy, prompt length, retry count — has a direct token cost. Understanding that cost before you build saves money and prevents scaling surprises.

---

## The Analogy — AWS Cloud Costs

A developer who builds without understanding AWS costs often gets a shock at month end. Every S3 GET request, every Lambda invocation, every data transfer has a price. The developer who understands the cost model designs differently — they cache aggressively, batch small operations, choose the right instance type.

Token costs work the same way. Every design decision has a cost implication. Architects who understand token economics make fundamentally different design choices than those who don't.

---

## Token Pricing (as of mid-2025)

> Note: Prices change — always verify at console.anthropic.com/settings/billing

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|---|---|---|
| Claude Haiku | ~$0.80 | ~$4.00 |
| Claude Sonnet | ~$3.00 | ~$15.00 |
| Claude Opus | ~$15.00 | ~$75.00 |

**Key insight:** Output tokens cost significantly more than input tokens (3–5x). This means:
- Long responses are expensive
- Retry loops (which repeat input + add output) compound cost quickly
- Summarising output before storing is worth doing

---

## Counting Tokens Before Sending

The Anthropic API has a token counting endpoint:

```python
import anthropic

client = anthropic.Anthropic()

# Count tokens BEFORE making the actual API call
token_count = client.messages.count_tokens(
    model="claude-sonnet-4-6",
    system="You are a helpful assistant.",
    messages=[
        {"role": "user", "content": "Explain the entire history of computing."}
    ]
)

print(f"This request will use {token_count.input_tokens} input tokens")
print(f"Estimated input cost: ${token_count.input_tokens / 1_000_000 * 3:.4f}")
```

Use this to:
- Gate requests that would exceed your cost budget
- Warn users when their input is very long
- Choose which model to use based on input size
- Monitor cost trends before they become problems

---

## Building a Cost Calculator

```python
PRICING = {
    "claude-haiku-4-5-20251001":  {"input": 0.80,  "output": 4.00},
    "claude-sonnet-4-6":           {"input": 3.00,  "output": 15.00},
    "claude-opus-4-6":             {"input": 15.00, "output": 75.00},
}

def calculate_cost(model: str, input_tokens: int, output_tokens: int) -> float:
    prices = PRICING[model]
    input_cost = (input_tokens / 1_000_000) * prices["input"]
    output_cost = (output_tokens / 1_000_000) * prices["output"]
    return input_cost + output_cost

def log_call_cost(response, model: str):
    cost = calculate_cost(
        model,
        response.usage.input_tokens,
        response.usage.output_tokens
    )
    print(f"Call cost: ${cost:.5f} | "
          f"Input: {response.usage.input_tokens} tokens | "
          f"Output: {response.usage.output_tokens} tokens")
    return cost

# Track cumulative cost
session_cost = 0.0

response = client.messages.create(model="claude-sonnet-4-6", ...)
session_cost += log_call_cost(response, "claude-sonnet-4-6")
print(f"Session total: ${session_cost:.4f}")
```

---

## Cost Implications of Every Architectural Decision

### Decision 1 — Model Choice

```
Same task, different models:
Input: 1,000 tokens | Output: 500 tokens | 10,000 calls/day

Haiku:    $0.000280/call × 10,000 = $2.80/day   = $84/month
Sonnet:   $0.010500/call × 10,000 = $105/day    = $3,150/month
Opus:     $0.052500/call × 10,000 = $525/day    = $15,750/month
```

Choosing the wrong model for a high-volume task is a $15,000/month mistake.

---

### Decision 2 — System Prompt Length

```
Short system prompt (500 tokens) vs Long system prompt (5,000 tokens):
10,000 calls/day using Claude Sonnet

Short: 500 tokens × 10,000 × $3/1M = $15/day
Long:  5,000 tokens × 10,000 × $3/1M = $150/day

Extra cost of long system prompt: $135/day = $4,050/month
```

Every token in your system prompt multiplies by your daily call volume. Concise system prompts are not just clean engineering — they're a financial decision.

---

### Decision 3 — Retry Loops

```
3-retry loop with 5% initial failure rate:
Average calls per request ≈ 1.05 + 0.05×1.05 + 0.0025×1.05 ≈ 1.103

Each retry adds: original input tokens + error message tokens + new output tokens
If a retry costs 30% more than the original call:
Effective cost multiplier: ~1.13x

At $1,000/month baseline: retries add ~$130/month
```

Improving your prompt to reduce failure rate from 5% to 1% saves more than reducing your retry count.

---

### Decision 4 — Conversation History Length

```
Multi-turn conversation, growing history:
Average turn: 500 tokens input + 300 tokens output
By Turn 10: input is 500 + (10 × 800) = 8,500 tokens per call

Cost of Turn 1: $0.00255
Cost of Turn 10: $0.03045

If users average 10 turns per session and you have 1,000 sessions/day:
Turn 1-10 cost = ~$120/day just for history overhead
```

Sliding window or summarisation strategies aren't just about context limits — they directly control cost.

---

## The Cost-Optimised Architecture Pattern

```python
class CostAwareClaudeClient:
    
    def __init__(self, daily_budget_usd: float):
        self.daily_budget = daily_budget_usd
        self.daily_spend = 0.0
        self.call_count = 0
    
    def create(self, model: str, messages: list, **kwargs) -> dict:
        
        # Pre-flight: estimate cost
        token_count = client.messages.count_tokens(
            model=model, messages=messages, **kwargs
        )
        estimated_cost = calculate_cost(model, token_count.input_tokens, 500)
        
        # Gate: check budget
        if self.daily_spend + estimated_cost > self.daily_budget:
            raise BudgetExceededException(
                f"Request would exceed daily budget. "
                f"Spent: ${self.daily_spend:.2f}, Budget: ${self.daily_budget:.2f}"
            )
        
        # Execute
        response = client.messages.create(model=model, messages=messages, **kwargs)
        
        # Track
        actual_cost = calculate_cost(
            model,
            response.usage.input_tokens,
            response.usage.output_tokens
        )
        self.daily_spend += actual_cost
        self.call_count += 1
        
        return response
```

---

## Key Concepts Learned Today

| Term | Definition |
|---|---|
| Token economics | Understanding and designing around the cost of every token |
| Input vs output pricing | Output tokens cost 3–5x more than input tokens |
| Cost per call | input_tokens × input_rate + output_tokens × output_rate |
| Cost multiplier | How architectural decisions (model, history, retries) multiply base cost |
| Budget gating | Blocking API calls that would exceed a cost threshold |

---

## Hands-On Task 🛠️

**Task 1:** Count tokens on three prompts:
- A 1-sentence user message
- Your D4 system prompt from Week 1
- A 500-word document

**Task 2:** Calculate the monthly cost of this system:
- 5,000 calls/day
- Claude Sonnet
- Average 800 input tokens, 400 output tokens per call

**Task 3:** Find the break-even point — at what call volume does switching from Sonnet to Haiku save $1,000/month? (Same token counts, just different model)

**Task 4:** Implement the `CostAwareClaudeClient` above with a $10/day budget. Test that it blocks calls when the budget is exceeded.

**Your calculations and implementation:**
> _(write here)_

---

## Q&A — Self-Assessment

---

**Q1.** You have a system prompt that's 8,000 tokens. You run 5,000 calls/day with Claude Sonnet. How much does the system prompt alone cost per month? What would you do to reduce this cost without shortening the prompt?

> **Your answer:**
> _(write here)_

---

**Q2.** A product manager asks: "Should we use Opus for our new feature to get the best quality?" The feature will run 2,000 times per day with ~1,500 tokens input and ~800 tokens output. Calculate the monthly cost for Opus vs Sonnet. What's your recommendation?

> **Your answer:**
> _(write here)_

---

**Q3.** Your retry loop runs 3 retries on failure. Your initial failure rate is 8%. On average, a retry adds 500 input tokens (error message) and generates the same output as the original. What is the effective cost multiplier of your retry loop?

> **Your answer:**
> _(write here)_

---

**Q4.** Output tokens cost ~5x more than input tokens for Claude Sonnet. You're building a summarisation feature. Would you rather: (a) have Claude produce a 2,000-token summary, or (b) have Claude produce a 500-token summary and then expand specific sections on request? Which is more cost-efficient, and does it affect quality?

> **Your answer:**
> _(write here)_

---

**Q5 — Architect Scenario.** Your startup's Claude API bill was $500 last month. Your user base is projected to 10x over the next 6 months. Without any architectural changes, what would your monthly bill be at 10x users? Design three specific changes to keep the bill under $2,000/month at 10x scale.

> **Your answer:**
> _(write here)_

---

## Answer Guide — Claude's Reference Answers

---

**Q1 — System prompt cost + reduction**

**Calculation:**
8,000 tokens × 5,000 calls/day × 30 days × $3/1M tokens
= 8,000 × 5,000 × 30 × 0.000003
= **$3,600/month** just for the system prompt

**How to reduce without shortening:**

**Prompt caching** (covered in Week 10) — Anthropic's API can cache static prompt sections. A cached prompt costs ~90% less per call. At $3,600/month baseline, caching could reduce system prompt cost to ~$360/month — saving $3,240/month.

This single optimisation is often the highest-ROI change in any high-volume Claude system. The system prompt is identical across calls — it's the perfect candidate for caching.

---

**Q2 — Opus vs Sonnet for 2,000 calls/day**

**Calculation:**

Input cost: 1,500 tokens × 2,000 calls × 30 days
Output cost: 800 tokens × 2,000 calls × 30 days

**Sonnet:**
Input: 1,500 × 2,000 × 30 × $3/1M = $270
Output: 800 × 2,000 × 30 × $15/1M = $720
**Total: $990/month**

**Opus:**
Input: 1,500 × 2,000 × 30 × $15/1M = $1,350
Output: 800 × 2,000 × 30 × $75/1M = $3,600
**Total: $4,950/month**

**Difference: $3,960/month** for Opus over Sonnet.

**Recommendation:** Start with Sonnet. Run A/B tests comparing output quality between Sonnet and Opus for your specific use case. If Opus provides measurable quality improvement that drives better user outcomes (higher retention, conversion, etc.), the $3,960/month might be justified. If the difference is marginal — as it often is for well-structured tasks — stick with Sonnet.

Never pay for Opus without first proving the quality difference is worth the cost.

---

**Q3 — Retry loop cost multiplier**

**Setup:**
- Initial failure rate: 8% (0.08)
- Each retry adds 500 extra input tokens
- Output tokens same as original call

**Expected calls per request:**
- 92% succeed on attempt 1: 1 call
- 8% × 92% succeed on attempt 2: 0.0736 calls
- 8% × 8% × 100% attempt 3: 0.0064 calls
- Average calls per request: 1 + 0.0736 + 0.0064 = **1.08 calls**

**Token multiplier:**
- 92% of calls: normal tokens
- 7.36% of calls: normal + 500 extra input tokens (retry 1)
- 0.64% of calls: normal + 1000 extra input tokens (retry 2)
- If normal call is 1,000 input tokens:
  - Extra tokens: 0.0736 × 500 + 0.0064 × 1000 = 36.8 + 6.4 = 43.2 tokens
  - Effective input: 1,043.2 / 1,000 = **~1.04x input multiplier**

**Combined cost multiplier: ~1.08x** (extra calls dominate over extra tokens per call)

Reducing failure rate from 8% to 2% halves the retry overhead. Better prompts are more cost-effective than optimising retry logic.

---

**Q4 — 2,000-token summary vs 500-token on-demand**

**Cost comparison (Claude Sonnet):**

Option A (2,000-token summary, always):
Output: 2,000 tokens × $15/1M = $0.030 per call

Option B (500-token summary + 300-token expansions, 3 expansions per session):
Summary output: 500 × $15/1M = $0.0075
Expansions: 3 × 300 × $15/1M = $0.0135
Total: $0.021 per call

Option B is ~30% cheaper per session.

**But** — Option B requires 4 API calls (1 summary + 3 expansions) vs Option A's 1 call. At high volume, the extra round-trips add latency.

**Quality impact:** Option B often produces higher quality because it allows Claude to go deep on the specific sections the user actually needs, rather than trying to compress everything into a fixed-length summary. The user gets breadth from the summary and depth on demand.

**Architect recommendation:** Option B for user-interactive systems (users choose what to expand). Option A for automated pipelines where you need the full summary immediately.

---

**Q5 — 10x scale cost control**

**Current: $500/month at 1x**
**Projected without changes: $5,000/month at 10x**
**Target: Under $2,000/month at 10x**
**Required reduction: 60% cost reduction while handling 10x volume**

**Change 1 — Model routing (est. 40% cost reduction):**
Classify requests by complexity. Route simple queries (60% of volume) to Haiku, complex queries to Sonnet. Haiku is ~4x cheaper than Sonnet.
Mixed fleet cost ≈ 60% × Haiku + 40% × Sonnet ≈ 55% of all-Sonnet cost.

**Change 2 — Prompt caching (est. 30% additional reduction):**
Cache your system prompt (likely 1,000–3,000 tokens). At 90% cache discount on input tokens, and if system prompt is 30% of your input tokens, this saves 27% on input costs.

**Change 3 — Sliding window / summarisation (est. 20% additional reduction):**
If users have multi-turn conversations, implementing a sliding window or summarisation reduces history tokens per call significantly. Assume 20% reduction in average input tokens per call.

**Combined effect:**
$5,000 × 0.55 (routing) × 0.73 (caching) × 0.80 (history) ≈ **$1,606/month**

Under the $2,000 target. These three changes, implemented in order of ROI, keep your bill predictable as you scale.

---

## Status

- [ ] Concept read and understood
- [ ] Task 1 completed (token counting)
- [ ] Task 2 completed (monthly cost calculation)
- [ ] Task 3 completed (break-even calculation)
- [ ] Task 4 completed (CostAwareClaudeClient)
- [ ] Q1 answered
- [ ] Q2 answered
- [ ] Q3 answered
- [ ] Q4 answered
- [ ] Q5 answered
- [ ] Answer guide reviewed
- [ ] Day 5 started — Rate Limits & Error Handling

---

## Coming Up — Week 4, Day 5

**Topic:** Rate Limits & Error Handling
What happens when you hit API limits. Retry with exponential backoff. Build a resilient API wrapper. The difference between transient errors and permanent errors — and how to handle each.

---

*CCA Self-Study Log · Asif · Phase 2 of 5 · Week 4 of 12*
