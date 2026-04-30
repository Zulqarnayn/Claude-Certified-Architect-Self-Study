# CCA Self-Study — Week 4, Day 5
## Rate Limits & Error Handling

**Date completed:** _____________
**Study time:** 30–45 mins
**Curriculum phase:** Phase 2 — Building with Claude
**Exam domain:** Domain 5 · Context Management & Reliability

---

## Core Concept

Production systems fail. The API returns errors. Servers go down. Rate limits are hit. The difference between a hobbyist project and a production system is not whether failures happen — it's whether the system handles them gracefully.

Today you build the error handling layer that sits between your application and the Claude API. This layer makes your system resilient to the inevitable failures that happen at scale.

---

## The Analogy — A Reliable Post Office

A naive postal system: if the delivery truck breaks down, packages are lost forever.

A resilient postal system: if the truck breaks down, packages are held at the depot, a backup truck is dispatched after a delay, and if that fails, the package is rerouted through a different hub.

Your Claude API wrapper is the resilient postal system. When a call fails, it doesn't just throw an error — it classifies the failure, decides the right response, and either retries intelligently or escalates gracefully.

---

## The Error Taxonomy

Not all errors are created equal. Each requires a different response.

### Category 1 — Transient Errors (Retry)
Temporary issues that resolve on their own. Retry with backoff.

| Error | HTTP Code | Cause | Strategy |
|---|---|---|---|
| Rate limit exceeded | 429 | Too many requests | Exponential backoff |
| Server overloaded | 529 | Anthropic capacity | Exponential backoff |
| Internal server error | 500 | Transient server issue | Retry 1-2 times |
| Gateway timeout | 504 | Request took too long | Retry with longer timeout |

### Category 2 — Permanent Errors (Don't Retry)
Issues that won't resolve by retrying. Fix the underlying problem.

| Error | HTTP Code | Cause | Strategy |
|---|---|---|---|
| Invalid API key | 401 | Wrong/expired key | Check credentials |
| Permission denied | 403 | Key lacks permissions | Check API key settings |
| Invalid request | 400 | Malformed request | Fix the request |
| Context too long | 400 | Exceeds context window | Reduce input size |
| Model not found | 404 | Wrong model name | Check model ID |

### Category 3 — Partial Failures
The call succeeded but the response is unusable.

- `stop_reason == "max_tokens"` — response truncated
- JSON parse failure — response doesn't match expected format
- Schema validation failure — response has wrong structure

These are handled by your validation + retry loop (Week 3 D4) — not by error handling.

---

## Rate Limits — What They Are

Anthropic enforces rate limits at several levels:

| Limit type | What it measures |
|---|---|
| RPM (Requests Per Minute) | Number of API calls per minute |
| TPM (Tokens Per Minute) | Total tokens (input + output) per minute |
| TPD (Tokens Per Day) | Daily token budget |

When you exceed a limit, the API returns a `429` error with a `retry-after` header indicating how many seconds to wait.

**Typical limits for new accounts:**
- Free tier: very limited (good for learning, not production)
- Tier 1 ($5 spent): ~50 RPM, 50,000 TPM
- Tier 2 ($500 spent): ~1,000 RPM, 500,000 TPM

As you build production systems, you'll need to request limit increases through the Anthropic console.

---

## The Resilient API Wrapper

```python
import anthropic
import time
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class ResilientClaudeClient:
    
    def __init__(self, api_key: str):
        self.client = anthropic.Anthropic(api_key=api_key)
        self.total_calls = 0
        self.failed_calls = 0
    
    def create(
        self,
        max_retries: int = 3,
        initial_delay: float = 1.0,
        **kwargs
    ) -> anthropic.types.Message:
        
        last_exception = None
        
        for attempt in range(max_retries):
            try:
                self.total_calls += 1
                response = self.client.messages.create(**kwargs)
                
                if attempt > 0:
                    logger.info(f"Succeeded on attempt {attempt + 1}")
                
                return response
            
            except anthropic.RateLimitError as e:
                # 429 — wait and retry
                retry_after = self._get_retry_after(e)
                delay = max(retry_after, initial_delay * (2 ** attempt))
                logger.warning(f"Rate limited. Waiting {delay:.1f}s (attempt {attempt+1}/{max_retries})")
                time.sleep(delay)
                last_exception = e
            
            except anthropic.InternalServerError as e:
                # 500/529 — transient, retry with backoff
                delay = initial_delay * (2 ** attempt)
                logger.warning(f"Server error {e.status_code}. Waiting {delay:.1f}s")
                time.sleep(delay)
                last_exception = e
            
            except anthropic.APITimeoutError as e:
                # Timeout — retry
                delay = initial_delay * (2 ** attempt)
                logger.warning(f"Request timed out. Waiting {delay:.1f}s")
                time.sleep(delay)
                last_exception = e
            
            except anthropic.AuthenticationError as e:
                # 401 — permanent, don't retry
                logger.error("Authentication failed — check your API key")
                self.failed_calls += 1
                raise  # Re-raise immediately, no retry
            
            except anthropic.BadRequestError as e:
                # 400 — permanent (usually), don't retry
                logger.error(f"Bad request: {e.message}")
                self.failed_calls += 1
                raise  # Re-raise immediately
            
            except anthropic.APIConnectionError as e:
                # Network issue — retry
                delay = initial_delay * (2 ** attempt)
                logger.warning(f"Connection error. Waiting {delay:.1f}s")
                time.sleep(delay)
                last_exception = e
        
        # All retries exhausted
        self.failed_calls += 1
        logger.error(f"All {max_retries} attempts failed. Last error: {last_exception}")
        raise last_exception
    
    def _get_retry_after(self, error: anthropic.RateLimitError) -> float:
        """Extract retry-after seconds from rate limit error headers"""
        try:
            # The SDK may expose headers on the error
            retry_after = error.response.headers.get("retry-after", "1")
            return float(retry_after)
        except (AttributeError, ValueError):
            return 1.0  # Default 1 second if header not available
    
    @property
    def success_rate(self) -> float:
        if self.total_calls == 0:
            return 1.0
        return (self.total_calls - self.failed_calls) / self.total_calls
```

---

## Timeout Configuration

Default API timeouts may not suit your use case:

```python
client = anthropic.Anthropic(
    api_key=api_key,
    timeout=anthropic.Timeout(
        connect=5.0,    # 5 seconds to establish connection
        read=120.0,     # 120 seconds to read response (long for large outputs)
        write=10.0,     # 10 seconds to send request
        pool=5.0        # 5 seconds to get connection from pool
    )
)
```

**Guidelines:**
- Short tasks (classification): read timeout 15–30 seconds
- Medium tasks (summaries): read timeout 60 seconds
- Long tasks (large code gen): read timeout 120–300 seconds
- Streaming: read timeout should be very long or disabled (tokens arrive continuously)

---

## Circuit Breaker Pattern

For high-volume systems, a circuit breaker prevents cascade failures:

```python
class CircuitBreaker:
    def __init__(self, failure_threshold: int = 5, recovery_timeout: float = 60.0):
        self.failure_count = 0
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.state = "CLOSED"  # CLOSED=normal, OPEN=blocking, HALF_OPEN=testing
        self.last_failure_time = None
    
    def call(self, fn, *args, **kwargs):
        if self.state == "OPEN":
            if time.time() - self.last_failure_time > self.recovery_timeout:
                self.state = "HALF_OPEN"
            else:
                raise Exception("Circuit breaker OPEN — API calls blocked")
        
        try:
            result = fn(*args, **kwargs)
            if self.state == "HALF_OPEN":
                self.state = "CLOSED"
                self.failure_count = 0
            return result
        
        except Exception as e:
            self.failure_count += 1
            self.last_failure_time = time.time()
            if self.failure_count >= self.failure_threshold:
                self.state = "OPEN"
                logger.critical(f"Circuit breaker OPEN after {self.failure_count} failures")
            raise
```

---

## Key Concepts Learned Today

| Term | Definition |
|---|---|
| Rate limit (429) | Too many requests — wait and retry |
| Transient error | Temporary failure — retry with backoff |
| Permanent error | Structural failure — don't retry, fix the cause |
| Exponential backoff | Increasing delay between retries (1s, 2s, 4s, 8s...) |
| Circuit breaker | Stops all calls after repeated failures to prevent cascade |
| retry-after header | API's instruction on how long to wait before retrying |

---

## Hands-On Task 🛠️

**Task 1:** Deliberately trigger a 400 error. Try sending a message array that doesn't alternate user/assistant roles. Read the error object — what fields does it have?

**Task 2:** Implement the `ResilientClaudeClient` above. Test by mocking a 429 response (you can temporarily set an invalid API key to generate 401s, or use a try/except to simulate the error).

**Task 3:** Add cost logging to your `ResilientClaudeClient` from D4. Every successful call logs tokens and cost. Every failed call logs the error type.

**Task 4:** Write a function `is_retryable(error)` that takes an Anthropic exception and returns True if it should be retried, False if it's permanent.

**Your implementation:**
> _(write here)_

---

## Q&A — Self-Assessment

---

**Q1.** You receive a 429 error with `retry-after: 30` in the header. Your exponential backoff formula says wait 4 seconds (attempt 3). What delay do you use?

> **Your answer:**
> _(write here)_

---

**Q2.** Your system sends a request with a 250,000-token input (exceeding Claude's 200,000 token context window). You get a 400 error. Should your retry logic retry this request? What should happen instead?

> **Your answer:**
> _(write here)_

---

**Q3.** What is the difference between `max_retries` in a validation retry loop (Week 3) and `max_retries` in an infrastructure retry loop (today)? Can they be combined in the same function?

> **Your answer:**
> _(write here)_

---

**Q4.** You build a system that makes 100 API calls per second during peak load. Your rate limit is 60 RPM. What architectural change do you make — not to the retry logic, but to the request pattern?

> **Your answer:**
> _(write here)_

---

**Q5 — Architect Scenario.** Your Claude-powered system is integrated into a customer-facing app with 10,000 active users. At 2 PM on a Tuesday, Anthropic has a service incident and returns 529 errors for 15 minutes. Design a complete degraded-mode strategy — what does your system do during and after the outage?

> **Your answer:**
> _(write here)_

---

## Answer Guide — Claude's Reference Answers

---

<details>
<summary><b>Q1 — retry-after vs exponential backoff</b></summary>

Use whichever is **longer**: `max(retry_after_header, exponential_backoff_value)`.

In this case: `max(30, 4) = 30 seconds`.

The `retry-after` header is the API's authoritative signal — it tells you exactly when the rate limit window resets. Your backoff formula is a fallback for when no header is present. Ignoring the header and retrying in 4 seconds would just get another 429 immediately, wasting a retry attempt.

```python
retry_after = float(error.response.headers.get("retry-after", "1"))
backoff = initial_delay * (2 ** attempt)
delay = max(retry_after, backoff)
time.sleep(delay)
```

</details>

---

<details>
<summary><b>Q2 — Context window exceeded (400)</b></summary>

**Do NOT retry this request.** The 400 error means your input is structurally invalid — too long. Retrying the same request produces the same error. This is a permanent failure for this input.

**What should happen instead:**

1. Detect the specific error: `"context_length_exceeded"` in the error message
2. Truncate or summarise the input to fit within the context window
3. Retry with the reduced input

```python
except anthropic.BadRequestError as e:
    if "context_length_exceeded" in str(e):
        # Reduce input and retry — but this is a different call, not a retry
        reduced_messages = truncate_to_fit(messages)
        return client.messages.create(messages=reduced_messages, **other_kwargs)
    else:
        raise  # Other 400 errors are truly permanent
```

Context overflow is a special case of 400 — it's recoverable, but only by changing the input, not by waiting.

</details>

---

<details>
<summary><b>Q3 — Validation retry vs infrastructure retry</b></summary>

**Validation retry (Week 3):**
- Triggered by: Claude's output doesn't match your schema
- What changes between retries: the error feedback added to the conversation
- Purpose: Guide Claude to produce better output
- Context: Grows with each retry (error messages accumulate)

**Infrastructure retry (today):**
- Triggered by: API/network failure — no response received
- What changes between retries: only the timing (backoff)
- Purpose: Recover from transient infrastructure failures
- Context: Identical to original request

**Can they be combined?** Yes, but carefully — they should be separate layers:

```python
def call_with_full_resilience(messages, system, **kwargs):
    # Layer 1: Infrastructure retry (handles 429, 500, timeouts)
    def make_api_call():
        return resilient_client.create(
            messages=messages, system=system, **kwargs
        )
    
    # Layer 2: Validation retry (handles bad schema output)
    for attempt in range(3):
        response = make_api_call()  # Infrastructure resilience built in
        
        is_valid, errors = validate(response.content[0].text)
        if is_valid:
            return response
        
        messages = append_error_feedback(messages, errors)
    
    raise ValidationError("Max validation retries exceeded")
```

Infrastructure retry is transparent to the validation loop — the validation loop just sees a response (or an exception if all infrastructure retries fail).

</details>

---

<details>
<summary><b>Q4 — 100 calls/second vs 60 RPM limit</b></summary>

The solution is a **request queue with rate limiting** — not retry logic.

```python
import asyncio
from asyncio import Semaphore

# Allow max 1 request per second (60 RPM = 1 per second)
rate_limiter = Semaphore(1)

async def rate_limited_call(messages):
    async with rate_limiter:
        result = await make_api_call(messages)
        await asyncio.sleep(1.0)  # Ensure 1 second between releases
        return result

# Queue all 100 requests — they'll process at 60 RPM
tasks = [rate_limited_call(msg) for msg in all_messages]
results = await asyncio.gather(*tasks)
```

**Alternative approaches:**
- **Batch API:** For offline workloads, use Anthropic's batch API which has higher limits
- **Queue service:** Use a message queue (SQS, Redis) to smooth out spikes
- **Request limit increase:** Contact Anthropic to increase your RPM limit for production systems

Retry logic doesn't help here — you'd just be retrying requests that immediately hit the limit again. The solution is to not exceed the limit in the first place.

</details>

---

<details>
<summary><b>Q5 — 15-minute outage degraded mode</b></summary>

**During the outage:**

**Immediate detection (< 30 seconds):**
- Circuit breaker trips after 5 consecutive 529 errors
- All new Claude API calls are blocked (fail fast — no timeout waiting)
- Status page / internal monitoring alerts team

**User experience during outage:**
- Requests that can be deferred: queue them with a message: "We're experiencing high demand. Your request is queued and will complete shortly."
- Requests that cannot be deferred (real-time user interaction): show a friendly degraded message: "Our AI features are temporarily unavailable. Basic [app feature] still works."
- Never show raw API errors to users

**Background:**
- Log all failed/queued requests with their payloads
- Monitor Anthropic status page for recovery signal
- Alert on-call engineer

**After recovery (circuit half-opens):**
- Test with one request — if succeeds, circuit closes
- Drain the queue in controlled bursts (don't send 10,000 queued requests simultaneously — that's a new rate limit problem)
- Use exponential ramp-up: 10 req/min → 30 → 60 → normal volume
- Log the incident: duration, affected users, queued requests count

**Post-incident:**
- Review which features were most impacted
- Consider: which features could use cached/pre-generated responses as a fallback?
- Update runbook with what worked and what didn't

</details>

---

## Week 4 Complete — What You Now Know

| Day | Concept | Production skill |
|---|---|---|
| D1 | Messages API anatomy | Every parameter and when to change it |
| D2 | Multi-turn conversations | Managing stateful context across turns |
| D3 | Streaming responses | Real-time UX for user-facing systems |
| D4 | Token counting & cost | Designing economically at scale |
| D5 | Rate limits & error handling | Building resilient production systems |

---

## Status

- [ ] Concept read and understood
- [ ] Task 1 completed (400 error triggered)
- [ ] Task 2 completed (ResilientClaudeClient built)
- [ ] Task 3 completed (cost logging added)
- [ ] Task 4 completed (is_retryable function written)
- [ ] Q1 answered
- [ ] Q2 answered
- [ ] Q3 answered
- [ ] Q4 answered
- [ ] Q5 answered
- [ ] Answer guide reviewed
- [ ] Week 4 complete 🎉
- [ ] Week 5 ready to start

---

## Coming Up — Week 5, Day 1

**Topic:** What Is Tool Use?
Claude can call functions you define. The request-response loop. Why this turns Claude from a chatbot into an agent. Your first tool definition and your first tool call.

---

*CCA Self-Study Log · Asif · Phase 2 of 5 · Week 4 of 12*
