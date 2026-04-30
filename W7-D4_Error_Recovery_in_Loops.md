# CCA Self-Study — Week 7, Day 4
## Error Recovery in Loops

**Date completed:** _____________
**Study time:** 45–60 mins
**Curriculum phase:** Phase 3 — Agentic Architecture
**Exam domain:** Domain 1 · Agentic Architecture & Orchestration (27%)

---

## Core Concept

Errors in agentic loops are inevitable. External APIs fail, data is malformed, tools time out, Claude makes wrong tool calls. The question is not IF errors will happen — it's WHETHER YOUR LOOP HANDLES THEM GRACEFULLY or crashes and gives the user nothing.

Error recovery in agents is architecturally different from error handling in traditional code. In traditional code, an error throws an exception and execution stops. In an agentic loop, an error is just another piece of information — you pass it to Claude as a tool result, and Claude DECIDES what to do next.

This is the most elegant aspect of agentic design: Claude is both the executor and the error recovery system.

---

## The Analogy — A GPS Rerouting After a Missed Turn

A GPS doesn't crash when you miss a turn. It says "Recalculating..." and finds a new route from your current position.

Your agentic loop works the same way. When a tool fails, you don't crash — you tell Claude what happened, and Claude recalculates. Claude knows the task, knows what it tried, knows what failed, and can choose a different path.

This only works if you give Claude enough information to recalculate. A GPS that says "ERROR" and stops is useless. A GPS that says "Missed turn on Street A — taking alternate route via Street B" is invaluable.

---

## Error Classification for Agents

Not all errors deserve the same treatment. Classify before responding.

```python
class AgentErrorType:
    RETRYABLE    = "retryable"      # Try the same tool again (transient)
    ALTERNATE    = "alternate"      # Try a different approach
    ESCALATE     = "escalate"       # Human must handle this
    FATAL        = "fatal"          # Task cannot be completed
    DEGRADED     = "degraded"       # Partial success — continue with less data

ERROR_CLASSIFICATION = {
    # Retryable — transient infrastructure issues
    "timeout":           AgentErrorType.RETRYABLE,
    "connection_error":  AgentErrorType.RETRYABLE,
    "rate_limited":      AgentErrorType.RETRYABLE,
    "server_error_500":  AgentErrorType.RETRYABLE,
    
    # Alternate — data/input issues Claude can work around
    "not_found":         AgentErrorType.ALTERNATE,
    "no_results":        AgentErrorType.ALTERNATE,
    "permission_denied": AgentErrorType.ALTERNATE,
    
    # Escalate — requires human judgment
    "ambiguous_intent":  AgentErrorType.ESCALATE,
    "conflicting_data":  AgentErrorType.ESCALATE,
    "approval_required": AgentErrorType.ESCALATE,
    
    # Fatal — cannot proceed
    "auth_failed":       AgentErrorType.FATAL,
    "data_corrupted":    AgentErrorType.FATAL,
    
    # Degraded — partial data, continue with caveat
    "partial_data":      AgentErrorType.DEGRADED,
    "stale_data":        AgentErrorType.DEGRADED,
}
```

---

## The Error-as-Information Pattern

The key insight: **return errors as rich tool results, not as exceptions.**

```python
# BAD — exception crashes the loop
def execute_tool(name, args):
    try:
        return call_external_api(name, args)
    except Exception as e:
        raise  # ← crashes your agent loop

# GOOD — error becomes Claude's information
def execute_tool_safe(name, args):
    try:
        result = call_external_api(name, args)
        return {"status": "success", "data": result}
    
    except TimeoutError:
        return {
            "status": "error",
            "error_type": "timeout",
            "tool": name,
            "message": f"Tool {name} timed out after 10 seconds.",
            "suggestion": "This is likely transient. You can retry this tool or try an alternative approach.",
            "retry_recommended": True
        }
    
    except NotFoundError as e:
        return {
            "status": "error",
            "error_type": "not_found",
            "tool": name,
            "searched_for": args,
            "message": str(e),
            "suggestion": "Try searching with different terms or check if the item exists.",
            "retry_recommended": False
        }
    
    except Exception as e:
        return {
            "status": "error",
            "error_type": "unknown",
            "tool": name,
            "message": f"Unexpected error: {str(e)}",
            "suggestion": "This may be a temporary issue. If it persists, this task may need manual review.",
            "retry_recommended": False
        }
```

Claude reads the `suggestion` field and incorporates it into its recovery decision.

---

## Recovery Patterns by Error Type

### Pattern 1 — Retry (RETRYABLE errors)

```python
async def execute_with_retry(name: str, args: dict, max_retries: int = 3) -> dict:
    """For transient errors — retry with exponential backoff."""
    
    for attempt in range(max_retries):
        result = await execute_tool_safe(name, args)
        
        if result["status"] == "success":
            return result
        
        if result.get("retry_recommended") and attempt < max_retries - 1:
            wait = 2 ** attempt  # 1s, 2s, 4s
            await asyncio.sleep(wait)
            continue
        
        break
    
    # After all retries — return final error to Claude
    return {
        "status": "error",
        "error_type": "max_retries_exceeded",
        "attempts": max_retries,
        "message": f"Tool {name} failed after {max_retries} attempts.",
        "suggestion": "This tool is unavailable. Try an alternative approach or inform the user."
    }
```

**Important:** Retry is transparent to Claude. Claude requested the tool once. You retry internally. Claude receives either a success or a "max_retries_exceeded" error. Claude never knows about the retries.

---

### Pattern 2 — Alternate Path (ALTERNATE errors)

Tell Claude the error and let it decide the alternate approach:

```python
# Tool result when not found
not_found_result = {
    "status": "error",
    "error_type": "not_found",
    "searched_for": "ScreenshotPro",
    "message": "No app named 'ScreenshotPro' exists in our catalog.",
    "alternatives": ["ScreenshotAI", "Screenshotter"],  # ← Give Claude options
    "suggestion": "Try one of the alternatives listed, or ask the user to confirm the app name."
}
```

Claude reads `alternatives` and decides: call `get_app_details("ScreenshotAI")` next.

You gave Claude the information it needs to choose the alternate path. You didn't have to write the recovery logic — Claude wrote it.

---

### Pattern 3 — Graceful Degradation (DEGRADED errors)

Continue with less data rather than failing entirely:

```python
def build_degraded_result(available_data: dict, missing: list) -> dict:
    return {
        "status": "partial",
        "data": available_data,
        "missing_data": missing,
        "message": f"Retrieved partial data. Could not obtain: {', '.join(missing)}.",
        "caveat": "Answer based on partial information. Inform the user of limitations.",
        "confidence_impact": "Reduce confidence by 20% for each missing data point."
    }

# Example: hotel API is down, but flight data is available
result = build_degraded_result(
    available_data={"flights": flight_results},
    missing=["hotel_options"]
)
```

Claude reads this and continues with available data, adding an appropriate caveat to the user: "I found flights but hotel search is currently unavailable."

---

### Pattern 4 — Escalation (ESCALATE errors)

Some errors require human judgment. Stop the loop and hand off:

```python
ESCALATION_TRIGGERS = {
    "ambiguous_customer_identity",
    "conflicting_account_records",
    "refund_exceeds_auto_approval_limit",
    "potential_fraud_detected"
}

def handle_tool_result(tool_use_id: str, result: dict) -> dict:
    """Check if result requires escalation before returning to Claude."""
    
    if result.get("error_type") in ESCALATION_TRIGGERS:
        # Build escalation package and stop the agent loop
        raise EscalationRequired({
            "reason": result["error_type"],
            "tool_that_triggered": result.get("tool"),
            "data_at_escalation": result,
            "recommended_action": result.get("human_action_required", "Manual review needed")
        })
    
    return build_tool_result(tool_use_id, result)
```

---

## Communicating Error Severity to Claude

Use a consistent error structure that tells Claude both what happened and what to do next:

```python
def rich_error_result(
    error_type: str,
    message: str,
    tool_name: str,
    args_used: dict,
    can_recover: bool,
    recovery_options: list = None,
    severity: str = "medium"  # low, medium, high, critical
) -> dict:
    
    return {
        "status": "error",
        "severity": severity,
        "error_type": error_type,
        "tool": tool_name,
        "args_used": args_used,
        "message": message,
        "can_recover": can_recover,
        "recovery_options": recovery_options or [],
        "recommended_next_action": (
            recovery_options[0] if recovery_options else
            "Inform the user about this limitation and provide the best answer with available data."
        )
    }
```

---

## The "Never Crash the Loop" Rule

The single most important rule for error handling in agents:

> **Never let a tool execution error propagate as a Python exception to the loop level. Always return a structured error dict instead.**

```python
# The loop itself should NEVER crash due to a tool error
for iteration in range(MAX_ITER):
    response = client.messages.create(...)
    
    if response.stop_reason == "tool_use":
        messages.append({"role": "assistant", "content": response.content})
        
        tool_results = []
        for tool_use in [b for b in response.content if b.type == "tool_use"]:
            # This NEVER raises — always returns a dict
            result = execute_tool_safe(tool_use.name, tool_use.input)
            tool_results.append({
                "type": "tool_result",
                "tool_use_id": tool_use.id,
                "content": json.dumps(result),
                "is_error": result.get("status") == "error"
            })
        
        messages.append({"role": "user", "content": tool_results})
```

The loop only crashes for:
- Genuine infrastructure failures (Claude API down)
- Your code bugs (not tool failures)
- Explicit escalation triggers

Everything else becomes information for Claude.

---

## Key Concepts Learned Today

| Term | Definition |
|---|---|
| Error-as-information | Returning errors as structured tool results instead of exceptions |
| Retryable error | Transient failure where the same call may succeed if retried |
| Alternate path | Claude choosing a different approach when one tool/approach fails |
| Graceful degradation | Continuing with partial data rather than failing entirely |
| Escalation | Stopping the loop and handing off to a human when errors exceed automation |
| "Never crash the loop" | Tool errors must be caught and returned as data, never as exceptions |
| rich_error_result | Structured error format with severity, recovery options, and next action |

---

## Hands-On Task 🛠️

Build a fault-tolerant agent.

**Task 1:** Implement `execute_tool_safe()` that wraps any exception and returns a structured error dict.

**Task 2:** Create a flaky tool that fails 50% of the time with a timeout. Implement `execute_with_retry()`. Confirm the agent succeeds despite flaky tools.

**Task 3:** Create a tool that returns `{"error": "not_found", "alternatives": [...]}`. Run the agent on a query that triggers this. Observe Claude using the alternatives.

**Task 4:** Implement graceful degradation — if `get_app_reviews` fails (simulate with an exception), the agent should still answer with data from `get_app_details`, noting that reviews are unavailable.

**Task 5:** Add escalation for a specific trigger ("refund_exceeds_limit"). Test that the loop stops and returns a proper escalation package rather than crashing.

**Your implementation:**
> _(write here)_

---

## Q&A — Self-Assessment (8 Questions)

---

**Q1.** Tool A times out. You retry 3 times, all timeout. You return a "max_retries_exceeded" error to Claude. Claude's next action is to call Tool B which doesn't depend on Tool A's data. Is this correct? What does it show about the agent's error recovery design?

> **Your answer:**
> _(write here)_

---

**Q2.** Your tool returns `{"error": "permission_denied"}` with no additional context. Claude calls the same tool again with the same arguments. Why did this happen and how do you fix the error result?

> **Your answer:**
> _(write here)_

---

**Q3.** You're building an agent that writes to a database. Tool call: `insert_record(data)`. It fails with a constraint violation. Should this be retryable? Should you return it to Claude? What's the right response?

> **Your answer:**
> _(write here)_

---

**Q4.** Claude calls `get_customer_profile` and gets a successful result. Then calls `get_order_history` which fails with a timeout. Claude now has partial data (profile only). It reaches `end_turn` with: "I found your profile but couldn't load order history due to a timeout. Your name is [name]." Is this the right behaviour? Should the loop have continued?

> **Your answer:**
> _(write here)_

---

**Q5.** Two tools fail in the same iteration: Tool A times out, Tool B returns not_found. You must return results for both. Write the tool_results list with appropriate error structures for each.

> **Your answer:**
> _(write here)_

---

**Q6.** Your agent's flaky tool (50% failure rate) is being retried up to 3 times internally before returning to Claude. The agent runs 100 times. Expected tool calls: 100. Actual tool calls: approximately how many, and why?

> **Your answer:**
> _(write here)_

---

**Q7 — Exam Scenario.** A financial agent searches for a customer's account, finds multiple accounts with the same name, and gets an error: `{"error": "ambiguous_identity", "accounts_found": 3}`. The agent must not proceed with ambiguous identity. Design the error handling — what does the tool result look like, what does Claude do, and how does the agent loop respond?

> **Your answer:**
> _(write here)_

---

**Q8 — Deep Architecture.** You have a 5-step pipeline agent: steps 1-3 must complete for step 4, step 4 must complete for step 5. Steps 1 and 3 can run in parallel (no dependency on each other). Design the error recovery strategy for each failure scenario: only step 1 fails, only step 3 fails, both steps 1 and 3 fail, step 4 fails, step 5 fails.

> **Your answer:**
> _(write here)_

---

## Answer Guide — Claude's Reference Answers

---

**Q1 — Tool B after Tool A max_retries**

Yes — this is correct and demonstrates good agent error recovery design.

The error recovery works because:
1. Tool A's failure was returned as a structured error result, not a crash
2. The messages array contains the failure information
3. Claude assessed: "Tool A failed, but does my next step depend on it? No — Tool B is independent."
4. Claude called Tool B, which succeeded

This shows **selective recovery** — the agent continues making progress on independent tasks even when one component fails. This is the most important error recovery property for production agents.

The design principle demonstrated: errors are information, not catastrophes. Claude can reason about what to do next given the error information, just as it reasons about successful results.

---

**Q2 — Claude retrying after permission_denied with no context**

**Why it happened:** `{"error": "permission_denied"}` gives Claude no information about why access was denied or what to do differently. Claude interprets the lack of guidance as "maybe try again" — a reasonable inference but the wrong one for a permission error.

**Fix — rich permission error:**
```python
{
    "status": "error",
    "error_type": "permission_denied",
    "resource": "customer_database",
    "reason": "Your access token does not have read permissions for customer records.",
    "is_retryable": False,
    "suggestion": "This action requires elevated permissions that are not available in this context. "
                  "Inform the user that you cannot access this data, or escalate to an administrator.",
    "do_not_retry": True  # Explicit signal
}
```

System prompt addition: "If a tool returns 'is_retryable: false' or 'do_not_retry: true', do not call that tool again. Find an alternative approach or inform the user."

Claude reads `do_not_retry: true` and `suggestion` and chooses a different path instead of retrying.

---

**Q3 — Database constraint violation**

**Not retryable — and Claude should NOT decide the fix.**

A constraint violation (e.g., duplicate key, foreign key violation, check constraint) means the DATA is wrong, not the infrastructure. Retrying with the same data produces the same error every time.

**What to do:**

The violation is a permanent error. But unlike a simple not_found, Claude should NOT try to fix the data (it might corrupt the database):

```python
return {
    "status": "error",
    "error_type": "constraint_violation",
    "constraint": "unique_email",
    "message": "A record with this email already exists.",
    "is_retryable": False,
    "human_action_required": True,
    "suggestion": "Inform the user that a duplicate record exists. "
                  "Do not modify or delete existing records — ask the user how to proceed.",
    "severity": "high"
}
```

Claude tells the user about the conflict. The user decides (update existing? use a different email?). Then the agent can proceed with the user's direction.

For data integrity issues, always route through the user rather than having the agent make autonomous data modification decisions.

---

**Q4 — end_turn with partial data after timeout**

**This is the correct behaviour for this scenario.** The agent gracefully degraded — it provided what it could (profile) and clearly communicated what it couldn't get (order history) and why.

**Should the loop have continued?**

Only if the user's original question specifically required order history. If the user asked "What's my account status?" — the profile alone answers it. If the user asked "Show me my recent orders" — the agent should have retried or escalated before reaching end_turn.

This reveals an important design principle: **stop conditions must match the task's success criteria, not a generic "done" signal.** An end_turn with partial data is appropriate for some queries and inappropriate for others.

Consider adding task-specific validation:
```python
# For "show my orders" tasks — validate order history is present
def validate_order_query(output: str) -> tuple[bool, str]:
    if "order history" not in output.lower() and "couldn't load" not in output.lower():
        return False, "Order history not addressed"
    return True, "OK"
```

---

**Q5 — Two tool failures in one iteration**

```python
tool_results = [
    # Tool A — Timeout (retryable)
    {
        "type": "tool_result",
        "tool_use_id": "tu_tool_a",
        "content": json.dumps({
            "status": "error",
            "error_type": "timeout",
            "tool": "get_weather",
            "args_used": {"city": "Dhaka"},
            "message": "Request timed out after 10 seconds.",
            "is_retryable": True,
            "suggestion": "You may retry this tool or proceed without this data, "
                          "noting that weather information is unavailable."
        }),
        "is_error": True
    },
    # Tool B — Not found (not retryable, alternatives given)
    {
        "type": "tool_result",
        "tool_use_id": "tu_tool_b",
        "content": json.dumps({
            "status": "error",
            "error_type": "not_found",
            "tool": "get_app_details",
            "args_used": {"app_name": "ScreenshotPro"},
            "message": "No app named 'ScreenshotPro' found.",
            "is_retryable": False,
            "alternatives": ["ScreenshotAI", "Screenshotter"],
            "suggestion": "Try one of the alternatives or ask the user to confirm the name."
        }),
        "is_error": True
    }
]
```

Claude reads both errors and makes two independent decisions: retry the weather tool (retryable) AND try "ScreenshotAI" for the app details (not retryable but has alternatives).

---

**Q6 — Expected tool calls with 50% failure rate and 3 retries**

**Setup:** 100 agent runs, each calling the flaky tool once at the agent level. Internally, the tool retries up to 3 times on failure.

**Expected calls per agent run:**
- 50% succeed on attempt 1: 1 call each
- 25% fail attempt 1, succeed attempt 2: 2 calls each
- 12.5% fail attempts 1-2, succeed attempt 3: 3 calls each
- 12.5% fail all 3 attempts: 3 calls each (then return error to Claude)

Average calls per agent run: (0.5×1) + (0.25×2) + (0.125×3) + (0.125×3) = 0.5 + 0.5 + 0.375 + 0.375 = **1.75 calls per agent run**

Total across 100 runs: **~175 actual tool calls** (vs 100 expected naively)

**Cost implication:** The retry mechanism adds 75% overhead to tool calls for a 50% failure rate. For a lower failure rate (5%), the overhead is much smaller: ≈1.05 calls per run.

This is why fixing root cause (improving tool reliability) is more cost-effective than increasing retry counts.

---

**Q7 — Ambiguous customer identity**

**Tool result:**
```python
{
    "status": "error",
    "error_type": "ambiguous_identity",
    "severity": "critical",
    "accounts_found": 3,
    "accounts": [
        {"id": "ACC001", "name": "Ahmed Rahman", "email": "ahmed.r1@..."},
        {"id": "ACC002", "name": "Ahmed Rahman", "email": "ahmed.r2@..."},
        {"id": "ACC003", "name": "Ahmed Rahman", "email": "ahmed.r3@..."}
    ],
    "message": "Multiple accounts found with this name. Cannot proceed without verification.",
    "is_retryable": False,
    "human_action_required": True,
    "do_not_proceed": True,
    "required_action": "Ask the user to verify their identity through email, account ID, or phone number."
}
```

**What Claude does:**
Reads `do_not_proceed: true` and `required_action`. Stops all data access. Responds: "I found 3 accounts with your name. To protect your account security, I need you to verify your identity. Could you provide your email address or account ID?"

**Agent loop response:**
The loop does NOT escalate to a human here — the user can resolve this themselves. Escalation is reserved for cases the user can't resolve. Claude pauses the agent task, collects the verification, then continues. This is a "human-in-the-loop" step, not a "human replaces the loop" step.

Add to system prompt: "If you see 'do_not_proceed: true', stop all data access immediately and ask the user for clarification before continuing."

---

**Q8 — 5-step pipeline error recovery**

```
Pipeline: Step1 ──┐
                  ├── (both complete) → Step4 → Step5
Step3 ────────────┘

Step1 and Step3 can run in parallel.
```

**Only Step 1 fails:**
- Step 3 completes → partial parallel success
- Return: `{"step1": error, "step3": success}`
- Claude decision: "Step 4 requires Step 1 data. Step 1 failed. Try alternate approach for Step 1 OR if Step 1 is truly unrecoverable, inform user that pipeline cannot complete."
- Recovery: Retry Step 1 with different approach (alternate path), or escalate if unrecoverable.

**Only Step 3 fails:**
- Step 1 completes → symmetric to above
- Same recovery logic with Step 3 as the failed component.

**Both Steps 1 and 3 fail:**
- Step 4 cannot run (depends on both)
- Do NOT call Step 4 — you have no input data
- Recovery: Retry both concurrently if retryable. If both remain failed:
  - Degrade gracefully: return what you know (nothing in this case)
  - Escalate: "Both upstream data sources failed — manual intervention required"
  - Error response: `{"status": "fatal", "failed_steps": [1, 3], "message": "Cannot proceed without upstream data"}`

**Step 4 fails (Steps 1 and 3 succeeded):**
- You have good input data, but processing failed
- Retry Step 4 (input data is cached in tool results)
- If retry fails: degrade — return Step 1 and Step 3 raw results with caveat "processing failed"
- Claude can format a partial answer from raw data

**Step 5 fails (Steps 1-4 succeeded):**
- 80% of the pipeline succeeded
- Step 5 failure is a delivery failure, not a processing failure
- Retry Step 5 (the data is ready, just needs to be delivered)
- If retry fails: return the output of Step 4 directly with note "delivery to final system failed"
- The value is in the processed data — don't discard it because the last delivery step failed

**Key principle:** In a pipeline with dependencies, fail forward as far as possible. Return partial results with explicit caveats rather than returning nothing. Each completed step has value even if downstream steps fail.

---

## Status

- [ ] execute_tool_safe() implemented
- [ ] Flaky tool + retry tested
- [ ] Alternate path error tested
- [ ] Graceful degradation tested
- [ ] Escalation trigger tested
- [ ] All 8 questions answered
- [ ] Answer guide reviewed

---

## Coming Up — Week 7, Day 5

**Topic:** Build a Simple Agent
Everything from W7 D1-D4 applied in one complete build: research agent with multiple tools, all stop conditions, error recovery, and phase logging. Your first real standalone agent.

---

*CCA Self-Study Log · Asif · Phase 3 of 5 · Week 7 of 12*
