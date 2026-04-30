# CCA Self-Study — Week 6, Day 5
## MCP in Production

**Date completed:** _____________
**Study time:** 30–45 mins
**Curriculum phase:** Phase 2 — Building with Claude
**Exam domain:** Domain 2 · Tool Design & MCP Integration

---

## Core Concept

Building an MCP server that works in development is one thing. Building one that handles real production conditions — partial failures, timeouts, authentication edge cases, high load, and mid-loop server failures — is a different challenge entirely.

Today you learn the production hardening patterns that make MCP servers reliable.

---

## The Analogy — A Restaurant During a Dinner Rush

During a quiet Tuesday lunch, the restaurant runs perfectly. On Saturday night with 200 covers — orders back up, a supplier is late, the dishwasher breaks, one waiter calls in sick.

A fragile restaurant shuts down. A resilient one has contingency plans: backup supplier, paper plates if needed, one waiter covering two sections, manager on the floor.

Your MCP server will face its own dinner rushes. Production hardening is building the contingency plans before they're needed.

---

## Production Challenge 1 — Authentication

Authentication in production MCP servers goes beyond environment variables.

### OAuth for User-Specific Data

When your MCP server accesses data on behalf of specific users (their Google Drive, their GitHub repos), you need per-user tokens.

```python
# Token storage (use a real database in production)
token_store = {}  # user_id → {access_token, refresh_token, expires_at}

async def get_valid_token(user_id: str) -> str:
    """Get a valid access token, refreshing if expired."""
    tokens = token_store.get(user_id)
    
    if not tokens:
        raise AuthError(f"User {user_id} not authenticated. Complete OAuth flow first.")
    
    if is_expired(tokens["expires_at"]):
        # Refresh the token
        new_tokens = await refresh_oauth_token(tokens["refresh_token"])
        token_store[user_id] = new_tokens
        return new_tokens["access_token"]
    
    return tokens["access_token"]

@app.call_tool()
async def call_tool(name: str, arguments: dict):
    user_id = arguments.get("user_id")
    
    try:
        token = await get_valid_token(user_id)
    except AuthError as e:
        return [types.TextContent(
            type="text",
            text=json.dumps({"error": "auth_required", "message": str(e)})
        )]
    
    # Use token for API calls
    ...
```

### API Key Rotation

```python
import os

class RotatingApiKeyManager:
    """Manages multiple API keys with automatic rotation on rate limit."""
    
    def __init__(self):
        # Load multiple keys from environment
        self.keys = [
            os.environ[f"API_KEY_{i}"] 
            for i in range(1, 4)  # API_KEY_1, API_KEY_2, API_KEY_3
            if f"API_KEY_{i}" in os.environ
        ]
        self.current_index = 0
        self.exhausted = set()
    
    def get_key(self) -> str:
        available = [k for i, k in enumerate(self.keys) if i not in self.exhausted]
        if not available:
            raise Exception("All API keys exhausted")
        return available[0]
    
    def mark_rate_limited(self, key: str):
        idx = self.keys.index(key)
        self.exhausted.add(idx)
```

---

## Production Challenge 2 — Timeouts

Tools that call external APIs can hang indefinitely without timeouts.

```python
import asyncio

async def call_external_api(url: str, params: dict, timeout_seconds: float = 10.0) -> dict:
    """Call external API with timeout protection."""
    try:
        async with asyncio.timeout(timeout_seconds):
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        return await response.json()
                    else:
                        raise APIError(f"HTTP {response.status}")
    
    except asyncio.TimeoutError:
        raise TimeoutError(f"API call timed out after {timeout_seconds}s")

@app.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "search_apps":
        try:
            result = await call_external_api(
                APP_STORE_URL, 
                {"query": arguments["query"]},
                timeout_seconds=8.0  # Fail fast — user is waiting
            )
            return [types.TextContent(type="text", text=json.dumps(result))]
        
        except TimeoutError:
            return [types.TextContent(
                type="text",
                text=json.dumps({
                    "error": "timeout",
                    "message": "App Store API is slow right now. Please try again.",
                    "retry_suggested": True
                })
            )]
```

**Timeout strategy:**
- User-facing tools: 5–10 seconds (user is waiting)
- Background tools: 30–60 seconds (no user waiting)
- Read tools: shorter timeouts (data is already there)
- Write tools: longer timeouts (transactions need time)

---

## Production Challenge 3 — Mid-Loop Server Failure

What happens when your MCP server crashes while Claude is mid-agent-loop?

```
Claude calls tool A → success
Claude calls tool B → MCP server crashes mid-response
Claude receives connection error → ??
```

**In Claude Code:** Claude detects the connection failure and tells the user the tool is unavailable.

**In your API application:** You must handle `MCPConnectionError` in your agent loop:

```python
async def run_agent_loop_with_mcp_resilience(messages, tools):
    mcp_available = True
    
    for iteration in range(10):
        response = await claude_call(messages, tools if mcp_available else [])
        
        if response.stop_reason == "end_turn":
            return extract_text(response)
        
        elif response.stop_reason == "tool_use":
            messages.append({"role": "assistant", "content": response.content})
            
            tool_results = []
            for tool_use in get_tool_uses(response):
                try:
                    result = await mcp_client.call_tool(tool_use.name, tool_use.input)
                    tool_results.append(build_result(tool_use.id, result))
                
                except MCPConnectionError:
                    # MCP server is down
                    mcp_available = False
                    tool_results.append(build_result(tool_use.id, {
                        "error": "service_unavailable",
                        "message": "The tool service is temporarily unavailable. "
                                   "I'll continue with the information I have."
                    }))
            
            messages.append({"role": "user", "content": tool_results})
```

---

## Production Challenge 4 — Error Classification

Not all errors should be handled the same way in tool results:

```python
class ToolError:
    RETRYABLE = "retryable"        # Transient — client should retry
    PERMANENT = "permanent"        # Bad input — client should not retry
    AUTH_REQUIRED = "auth_required" # Needs user authentication
    UNAVAILABLE = "unavailable"    # Service down — graceful degradation

def classify_error(exception: Exception) -> str:
    if isinstance(exception, (TimeoutError, ConnectionError)):
        return ToolError.RETRYABLE
    elif isinstance(exception, AuthError):
        return ToolError.AUTH_REQUIRED
    elif isinstance(exception, (ValueError, KeyError)):
        return ToolError.PERMANENT
    else:
        return ToolError.UNAVAILABLE

@app.call_tool()
async def call_tool(name: str, arguments: dict):
    try:
        result = await execute(name, arguments)
        return success_response(result)
    except Exception as e:
        error_type = classify_error(e)
        return [types.TextContent(
            type="text",
            text=json.dumps({
                "error": error_type,
                "message": str(e),
                "retry_after_seconds": 5 if error_type == ToolError.RETRYABLE else None
            })
        )]
```

---

## Production Challenge 5 — Observability

You can't fix what you can't see. Production MCP servers need structured logging.

```python
import logging
import time
import uuid

# Structured logger
logging.basicConfig(
    format='{"time": "%(asctime)s", "level": "%(levelname)s", '
           '"message": %(message)s}',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

@app.call_tool()
async def call_tool(name: str, arguments: dict):
    request_id = str(uuid.uuid4())[:8]
    start = time.time()
    
    logger.info(json.dumps({
        "event": "tool_call_start",
        "request_id": request_id,
        "tool": name,
        "arg_keys": list(arguments.keys())  # Log keys, not values (may be sensitive)
    }))
    
    try:
        result = await execute(name, arguments)
        duration_ms = (time.time() - start) * 1000
        
        logger.info(json.dumps({
            "event": "tool_call_success",
            "request_id": request_id,
            "tool": name,
            "duration_ms": round(duration_ms, 1)
        }))
        
        return success_response(result)
    
    except Exception as e:
        duration_ms = (time.time() - start) * 1000
        
        logger.error(json.dumps({
            "event": "tool_call_error",
            "request_id": request_id,
            "tool": name,
            "error_type": type(e).__name__,
            "duration_ms": round(duration_ms, 1)
        }))
        
        return error_response(e)
```

---

## Production Readiness Checklist

Before deploying an MCP server to production:

- [ ] All tools have timeouts configured
- [ ] All exceptions are caught and returned as error results
- [ ] Authentication tokens are never logged
- [ ] Structured logging on every tool call (start, success, error)
- [ ] Health check endpoint responds (for load balancer probing)
- [ ] Credentials in environment variables (never hardcoded)
- [ ] Tool descriptions include error handling guidance for Claude
- [ ] Server tested under concurrent load (not just single-user)
- [ ] Graceful shutdown handled (in-flight requests complete)
- [ ] Alerting configured for error rate > threshold

---

## Key Concepts Learned Today

| Term | Definition |
|---|---|
| OAuth token management | Per-user token storage and refresh in MCP servers |
| Tool timeout | Maximum time to wait for external API before failing gracefully |
| Mid-loop failure | MCP server crashes while agent is mid-execution |
| Error classification | Categorising errors as retryable, permanent, auth_required, or unavailable |
| Observability | Structured logging that enables debugging and monitoring in production |
| Production readiness | The set of hardening requirements before deploying an MCP server |

---

## Hands-On Task 🛠️

Harden your App Store MCP server from Day 3.

**Task 1:** Add a configurable timeout to every tool call (8 seconds default).

**Task 2:** Implement error classification — each exception type returns a different error structure.

**Task 3:** Add structured logging to every tool call (start, success, error with duration).

**Task 4:** Simulate a mid-execution timeout — make `get_app_reviews` sleep for 15 seconds, confirm your timeout handler returns a clean error result.

**Task 5:** Write a production readiness checklist for your server and mark each item.

**Your implementation:**
> _(write here)_

---

## Q&A — Self-Assessment

---

**Q1.** A tool call to an external weather API takes 12 seconds. Your timeout is 10 seconds. The tool returns a timeout error to Claude. Claude tells the user "The weather service is slow." Is this the right outcome? What would happen without a timeout?

> **Your answer:**
> _(write here)_

---

**Q2.** Your MCP server processes user authentication tokens in tool arguments. A developer suggests logging the full `arguments` dict for debugging. Why is this a serious security risk, and what should you log instead?

> **Your answer:**
> _(write here)_

---

**Q3.** Your MCP server handles 200 concurrent requests. The external API you depend on has a rate limit of 60 req/min. How do you prevent your MCP server from hammering the external API and getting rate limited?

> **Your answer:**
> _(write here)_

---

**Q4.** Claude is mid-agent-loop when your MCP server crashes and restarts. By the time the server comes back up (30 seconds), the agent loop has given up and returned an error to the user. How could you design the system to handle this more gracefully?

> **Your answer:**
> _(write here)_

---

**Q5 — Architect Scenario.** Your company's MCP server has been in production for 3 months. A post-mortem from last week's incident shows: 3 tool calls took > 60 seconds (caused user-facing timeouts), 1 tool returned success but with corrupted data (caused downstream errors), and authentication tokens were found in a debug log. Design the three specific changes that would have prevented this incident.

> **Your answer:**
> _(write here)_

---

## Answer Guide — Claude's Reference Answers

---

**Q1 — Timeout outcome**

**Yes — this is the right outcome.**

Without a timeout, your MCP server waits indefinitely for the weather API. The user stares at a loading state potentially forever. If the weather API never responds, the connection eventually times out at the TCP layer (90–120 seconds typically), causing a worse error. The agent loop holds resources for the entire duration.

With a 10-second timeout: the tool fails fast, Claude receives the error, Claude tells the user clearly what happened, and the user can try again. Total degraded experience: ~10 seconds instead of 90+ seconds.

**What happens without a timeout (worst case):**
1. Tool call hangs for 90 seconds
2. Agent loop exceeds `max_iterations` waiting
3. Entire session aborts with an unhelpful error
4. User sees nothing for 90 seconds then gets a crash

Fast failure with a clear error message is dramatically better than slow failure with an ambiguous crash.

---

**Q2 — Logging full arguments**

**Why it's a serious security risk:**

If a tool receives `{"user_id": "user_123", "auth_token": "eyJhbGc..."}` and you log the full arguments dict, the token appears in your log files. Log files are often:
- Stored in less-secure systems than your database
- Accessible to more people (all ops/dev team vs only auth service)
- Forwarded to third-party logging services (Datadog, Splunk, etc.)
- Retained longer than session data

A leaked authentication token in logs means any log reader can impersonate that user.

**What to log instead:**

```python
# Bad
logger.info(f"Tool called with args: {arguments}")

# Good — log keys, not values
safe_args = {k: "[REDACTED]" if k in SENSITIVE_KEYS else v 
             for k, v in arguments.items()}
logger.info(f"Tool called: {name} | Keys: {list(arguments.keys())}")

SENSITIVE_KEYS = {"auth_token", "api_key", "password", "secret", "token"}
```

Log argument **names** (to understand what was passed) but not argument **values** for sensitive fields.

---

**Q3 — Rate limit protection with 200 concurrent requests**

Implement a rate limiter in your MCP server that enforces the external API's limit:

```python
import asyncio
from asyncio import Semaphore
import time

class RateLimiter:
    def __init__(self, max_requests: int, window_seconds: float):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = []
        self.lock = asyncio.Lock()
    
    async def acquire(self):
        async with self.lock:
            now = time.time()
            # Remove requests outside the window
            self.requests = [t for t in self.requests if now - t < self.window_seconds]
            
            if len(self.requests) >= self.max_requests:
                # Wait until oldest request falls out of window
                wait_time = self.window_seconds - (now - self.requests[0])
                await asyncio.sleep(wait_time)
            
            self.requests.append(time.time())

# 60 requests per 60 seconds = 1/second
external_api_limiter = RateLimiter(max_requests=55, window_seconds=60)  # 55 for safety margin

@app.call_tool()
async def call_tool(name, arguments):
    await external_api_limiter.acquire()  # Wait if rate limit would be exceeded
    result = await call_external_api(...)
    ...
```

The 200 incoming requests queue internally. Your rate limiter feeds them to the external API at ≤60/min. Users experience slightly more latency but no rate limit errors from the external API.

---

**Q4 — Mid-loop server crash recovery**

The current architecture has a fundamental limitation: if the MCP server crashes, the in-flight agent loop is lost. Solutions:

**Solution 1 — Checkpoint/resume pattern:**
Save agent loop state (messages array, iteration count, partial results) to persistent storage (Redis, database) after each successful iteration. On reconnection, resume from the last checkpoint.

```python
async def run_resumable_agent_loop(session_id: str, messages: list):
    state = load_checkpoint(session_id) or {"messages": messages, "iteration": 0}
    
    for _ in range(10 - state["iteration"]):
        response = await claude_call(state["messages"])
        # ... handle response ...
        
        # Save checkpoint after every successful iteration
        state["iteration"] += 1
        save_checkpoint(session_id, state)
    
    clear_checkpoint(session_id)
```

**Solution 2 — Client-side retry with state:**
The user-facing application detects the error, shows "Reconnecting...", waits for the MCP server to recover (with polling), and resumes the agent loop from the last successful state.

**Solution 3 — Redundant MCP servers:**
Run multiple MCP server instances behind a load balancer. If one crashes, in-flight requests fail (unavoidable), but new requests route to healthy instances immediately. Recovery time: seconds not minutes.

---

**Q5 — Three changes from post-mortem**

**Change 1 — Fix the 60-second tool calls:**

Add strict per-tool timeouts, far shorter than 60 seconds:

```python
TOOL_TIMEOUTS = {
    "get_weather": 8.0,
    "search_apps": 10.0,
    "get_reviews": 15.0,
    "default": 10.0
}

timeout = TOOL_TIMEOUTS.get(name, TOOL_TIMEOUTS["default"])
async with asyncio.timeout(timeout):
    result = await execute(name, arguments)
```

The 60-second call would have failed at 8–15 seconds with a clean error instead of silently hanging.

**Change 2 — Fix the corrupted data:**

Add output validation before returning any tool result:

```python
def validate_tool_result(name: str, result: dict) -> tuple[bool, str]:
    """Validate result matches expected schema before returning to Claude."""
    if name == "get_app_details":
        required = ["name", "rating", "price", "developer"]
        for field in required:
            if field not in result:
                return False, f"Missing required field: {field}"
        if not 0 <= result["rating"] <= 5:
            return False, f"Invalid rating: {result['rating']}"
    return True, ""
```

Corrupted data caught here returns an error result to Claude rather than invalid data passed downstream.

**Change 3 — Fix the token logging:**

Implement a log sanitiser applied to all logging calls:

```python
REDACTED_KEYS = {"token", "auth_token", "api_key", "secret", "password", "credential"}

def sanitise_for_logging(data: dict) -> dict:
    return {
        k: "[REDACTED]" if any(sensitive in k.lower() for sensitive in REDACTED_KEYS) else v
        for k, v in data.items()
    }

# Replace all direct logging of arguments with:
logger.info(json.dumps({
    "tool": name,
    "args": sanitise_for_logging(arguments)
}))
```

This prevents tokens from appearing in any log output regardless of which developer writes the logging call.

---

## Week 6 Complete — What You Now Know

| Day | Concept | Production skill |
|---|---|---|
| D1 | What MCP is | Protocol, ecosystem, when to use |
| D2 | MCP architecture | Client/server, discovery, auth boundaries |
| D3 | Build MCP server | Working server with tools and resources |
| D4 | Tool boundary design | Single responsibility, read/write separation |
| D5 | MCP in production | Timeouts, auth, observability, resilience |

---

## Status

- [ ] Timeouts added to all tools
- [ ] Error classification implemented
- [ ] Structured logging added
- [ ] Timeout simulation tested
- [ ] Production readiness checklist completed
- [ ] Q1 answered
- [ ] Q2 answered
- [ ] Q3 answered
- [ ] Q4 answered
- [ ] Q5 answered
- [ ] Answer guide reviewed
- [ ] Week 6 complete 🎉

---

## Coming Up — Week 7, Day 1

**Topic:** What Is an Agentic Loop?
The step from "tool use" to "agent." Claude calls a tool → gets result → decides next step → repeats. This loop is the heart of every AI agent. You've built pieces — now you build the whole thing.

---

*CCA Self-Study Log · Asif · Phase 2 of 5 · Week 6 of 12*
