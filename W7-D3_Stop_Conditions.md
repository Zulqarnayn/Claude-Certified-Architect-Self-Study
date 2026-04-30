# CCA Self-Study — Week 7, Day 3
## Stop Conditions

**Date completed:** _____________
**Study time:** 45–60 mins
**Curriculum phase:** Phase 3 — Agentic Architecture
**Exam domain:** Domain 1 · Agentic Architecture & Orchestration (27%)

---

## Core Concept

An agent that never stops is as broken as one that stops too early. Stop conditions are the architectural mechanisms that tell your loop: "this task is complete — exit cleanly." Getting stop conditions wrong causes the two most common production agent failures: infinite loops (never stops) and premature termination (stops before the task is complete).

This lesson covers every stop condition pattern you need for the CCA exam.

---

## The Analogy — A Flight's Landing Conditions

A plane lands when ALL of these conditions are met:
1. Runway is clear
2. Wind speed is within limits
3. Fuel is sufficient (don't land short)
4. Altitude and approach angle are correct
5. ATC clearance received

If any condition fails, the plane goes around (loops) and tries again.

Your agent's stop conditions work the same way. Multiple conditions must all be satisfied before the agent lands. A single failing condition sends it around for another pass. The art is defining the right conditions — too strict and the plane never lands, too loose and it lands dangerously early.

---

## The Five Stop Condition Types

### Type 1 — Natural Completion (end_turn)

The primary stop condition. Claude produces `stop_reason == "end_turn"` when it determines the task is complete. This is Claude's own judgment.

```python
if response.stop_reason == "end_turn":
    return extract_text(response)
```

**Reliability:** Moderate. Claude's judgment is good for clear tasks, unreliable for tasks with ambiguous completion criteria. Always supplement with other stop conditions.

---

### Type 2 — Explicit Completion Signal (stop_sequence)

You define a specific string that, when produced by Claude, signals task completion. More reliable than pure end_turn for automated pipelines.

```python
response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=4096,
    stop_sequences=["<task_complete>", "<needs_human>", "<error_unrecoverable>"],
    tools=tools,
    messages=messages
)

# Check which signal fired
if response.stop_reason == "stop_sequence":
    signal = response.stop_sequence
    if signal == "<task_complete>":
        return extract_answer_before_signal(response)
    elif signal == "<needs_human>":
        escalate_to_human(messages)
    elif signal == "<error_unrecoverable>":
        raise AgentError("Task cannot be completed")
```

**System prompt to make Claude use signals:**

```python
system = """
When your task is fully complete, output: <task_complete>
When you need human input to proceed, output: <needs_human>
When you encounter an error you cannot recover from, output: <error_unrecoverable>
Output these signals immediately — do not add text after them.
"""
```

**Reliability:** High. Programmatic detection, not judgment-dependent.

---

### Type 3 — Hard Iteration Limit (max_iterations)

The safety net. Always required. Never rely on the agent naturally stopping.

```python
MAX_ITERATIONS = 10

for iteration in range(MAX_ITERATIONS):
    response = ...
    if response.stop_reason == "end_turn":
        return extract_text(response)
    # ... handle tool_use ...

# If we get here, the loop ran too long
raise MaxIterationsError(f"Agent exceeded {MAX_ITERATIONS} iterations")
```

**Setting the right limit:**
- Simple tasks (1-3 tools): max = 5
- Medium tasks (3-7 tools): max = 10
- Complex research (7+ tools): max = 15
- Never set max > 20 without specific justification

**What to do on limit exceeded:**
- Log the full messages array for debugging
- Return the best partial answer Claude had at that point, if any
- Alert the engineering team (rising limit-hit rate signals a bug)

---

### Type 4 — Confidence Threshold

Claude assesses its own confidence. Low confidence = more research needed. High confidence = ready to answer.

```python
system = """
After each tool call, assess your confidence in the final answer:
Output in your text: <confidence>0.0-1.0</confidence>

Rules:
- 0.0-0.5: Low — definitely need more information
- 0.5-0.8: Medium — could answer but would benefit from verification
- 0.8-1.0: High — ready to answer

Only call additional tools if confidence < 0.8.
"""

# In your loop — extract confidence from Claude's text
import re

def extract_confidence(text: str) -> float:
    match = re.search(r'<confidence>([\d.]+)</confidence>', text)
    if match:
        return float(match.group(1))
    return 0.5  # Default if not found

for iteration in range(10):
    response = ...
    
    if response.stop_reason == "end_turn":
        return extract_text(response)
    
    # Check confidence even during tool_use iterations
    for block in response.content:
        if block.type == "text":
            confidence = extract_confidence(block.text)
            if confidence >= 0.9:
                # High confidence — force completion even if tool_use
                logger.info(f"High confidence ({confidence}) — requesting final answer")
                messages.append({"role": "assistant", "content": response.content})
                # Don't execute tools — ask for final answer instead
                messages.append({
                    "role": "user",
                    "content": "Your confidence is high. Please give your final answer now."
                })
                break
    else:
        # Normal tool_use handling
        ...
```

**Reliability:** Moderate. Claude's confidence is calibrated but not perfect. Use as one signal among several.

---

### Type 5 — External Validation

Your code validates Claude's output against business rules. If validation passes → done. If it fails → retry.

```python
def validate_agent_output(output: str) -> tuple[bool, str]:
    """Validate Claude's final answer meets business requirements."""
    
    try:
        data = json.loads(output)
    except json.JSONDecodeError:
        return False, "Output is not valid JSON"
    
    required_fields = ["recommendation", "confidence", "supporting_data"]
    for field in required_fields:
        if field not in data:
            return False, f"Missing required field: {field}"
    
    if data["confidence"] < 0.7:
        return False, f"Confidence {data['confidence']} below minimum 0.7"
    
    return True, "Valid"

# In the loop — validate before accepting end_turn
if response.stop_reason == "end_turn":
    output = extract_text(response)
    is_valid, error = validate_agent_output(output)
    
    if is_valid:
        return output
    else:
        # Force another iteration with the validation error
        messages.append({"role": "assistant", "content": response.content})
        messages.append({
            "role": "user",
            "content": f"Your answer didn't meet requirements: {error}. "
                       f"Please revise and provide a corrected answer."
        })
        # Loop continues
```

**Reliability:** Highest. Code-based validation is deterministic. Best for structured output agents.

---

## Distinguishing "Done" from "Stuck"

This is a critical diagnostic skill for the exam.

| Symptom | "Done" | "Stuck" |
|---|---|---|
| stop_reason pattern | end_turn after reasonable iterations | Repeated tool_use, never end_turn |
| Tool call pattern | Different tools called each iteration | Same tool called with same arguments |
| Progress in messages | Each iteration adds new information | Tool results repeat similar data |
| Iteration count | Within expected range | Approaching max_iterations |

**Detection code:**

```python
def detect_stuck_loop(messages: list) -> bool:
    """Returns True if the agent appears stuck (same tool called twice with same args)."""
    tool_calls = []
    
    for message in messages:
        if message["role"] == "assistant":
            content = message["content"]
            if isinstance(content, list):
                for block in content:
                    if isinstance(block, dict) and block.get("type") == "tool_use":
                        call = (block["name"], json.dumps(block["input"], sort_keys=True))
                        if call in tool_calls:
                            return True  # Duplicate tool call detected
                        tool_calls.append(call)
    
    return False

# In your loop:
if detect_stuck_loop(messages):
    # Inject a nudge
    messages.append({
        "role": "user",
        "content": "You seem to be repeating steps. What you've found so far: "
                   f"{summarise_findings(messages)}. "
                   "Either provide your final answer or take a different approach."
    })
```

---

## The Complete Stop Condition Architecture

For production agents, use ALL five types in layers:

```python
def production_agent_loop(task, tools, executor):
    messages = [{"role": "user", "content": task}]
    MAX_ITER = 10
    MAX_TOOL_CALLS = 25
    total_tool_calls = 0
    
    for iteration in range(MAX_ITER):        # ← Type 3: Hard limit
        
        # Detect stuck state
        if iteration > 3 and detect_stuck_loop(messages):  # ← Stuck detection
            messages.append({
                "role": "user",
                "content": "You're repeating steps. Summarise what you know and give a final answer."
            })
        
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=4096,
            stop_sequences=["<task_complete>", "<needs_human>"],  # ← Type 2
            tools=tools,
            messages=messages
        )
        
        if response.stop_reason == "end_turn":              # ← Type 1
            output = extract_text(response)
            is_valid, _ = validate_output(output)           # ← Type 5
            if is_valid:
                return output
            # Else: add validation error and continue loop
        
        elif response.stop_reason == "stop_sequence":       # ← Type 2
            if response.stop_sequence == "<task_complete>":
                return extract_before_signal(response)
            elif response.stop_sequence == "<needs_human>":
                return escalate(messages)
        
        elif response.stop_reason == "tool_use":
            tool_uses = [b for b in response.content if b.type == "tool_use"]
            total_tool_calls += len(tool_uses)
            
            if total_tool_calls > MAX_TOOL_CALLS:
                raise TooManyToolCallsError()
            
            # Check confidence signal                        # ← Type 4
            for block in response.content:
                if block.type == "text":
                    conf = extract_confidence(block.text)
                    if conf >= 0.95:
                        return force_final_answer(messages)
            
            messages.append({"role": "assistant", "content": response.content})
            results = execute_all(tool_uses, executor)
            messages.append({"role": "user", "content": results})
    
    raise MaxIterationsError(MAX_ITER)
```

---

## Key Concepts Learned Today

| Term | Definition |
|---|---|
| Natural completion | end_turn stop_reason — Claude's own completion judgment |
| Explicit signal | Custom stop_sequence string Claude outputs when done |
| Hard limit | max_iterations guard — always required |
| Confidence threshold | Claude's self-assessed certainty used to gate further tool calls |
| External validation | Code-based check of Claude's final output before accepting it |
| Stuck detection | Identifying repeated tool calls with same arguments — loop is broken |

---

## Hands-On Task 🛠️

Implement all 5 stop condition types.

**Task 1:** Add `<task_complete>` stop sequence to your D1 agent. Modify system prompt to instruct Claude to output it when done.

**Task 2:** Add confidence tracking — log confidence after each iteration. Track whether it rises toward 1.0 as more tool results arrive.

**Task 3:** Implement `detect_stuck_loop()`. Test it by giving Claude a task where the first tool always returns an error — confirm stuck detection fires before max_iterations.

**Task 4:** Add external validation for your research agent — the final answer must contain at least 3 app names and a recommendation. Test with a task that naturally produces this.

**Task 5:** Combine all layers in `production_agent_loop()`. Run 5 different tasks and log which stop condition fired for each.

**Your implementation and results:**
> _(write here)_

---

## Q&A — Self-Assessment (8 Questions)

---

**Q1.** Your agent has max_iterations=10 and a `<task_complete>` stop sequence. Claude reaches end_turn at iteration 6 without outputting `<task_complete>`. Which stop condition fires, and is this correct?

> **Your answer:**
> _(write here)_

---

**Q2.** Stuck detection fires at iteration 5 because Claude called `search_apps("screenshot")` twice — once at iteration 2 and once at iteration 4. However, the second call returned different results (the API was updated). Is the stuck detection correct to fire? How do you distinguish productive repetition from true stuck loops?

> **Your answer:**
> _(write here)_

---

**Q3.** You set confidence threshold at 0.8. Claude reports 0.82 confidence after 3 iterations but its answer is actually wrong. What does this reveal about using confidence as a stop condition?

> **Your answer:**
> _(write here)_

---

**Q4.** Your external validation requires the final answer to be valid JSON with specific fields. Claude's first end_turn produces invalid JSON. Your loop adds an error and continues. Claude's second end_turn also produces invalid JSON. After 3 failed validation attempts, what should your loop do?

> **Your answer:**
> _(write here)_

---

**Q5.** You have a stop_sequence `<needs_human>`. Claude outputs this at iteration 3 because a customer's refund is above the automated approval limit. What information should you collect from the messages array before escalating to a human, and how do you present it?

> **Your answer:**
> _(write here)_

---

**Q6.** A developer says "I'll use confidence threshold as my only stop condition — if confidence is above 0.9, stop." What are the two failure modes of this approach?

> **Your answer:**
> _(write here)_

---

**Q7 — Exam Scenario.** Your production agent processes 1,000 tasks per day. Analysis shows: 85% stop at end_turn (avg 3 iterations), 10% stop at max_iterations (avg 10 iterations), 5% stop at `<needs_human>`. Your engineering team considers this healthy. Why might the 10% hitting max_iterations be a hidden problem even if those tasks "eventually complete"?

> **Your answer:**
> _(write here)_

---

**Q8 — Deep Architecture.** Design a stop condition system for an agent that autonomously books travel. The agent must: search flights, search hotels, check calendar availability, calculate total cost vs budget, and confirm booking. Each step has potential for partial failure. Define specific stop conditions for: happy path, partial failure, hard failure, user confirmation needed, and budget exceeded.

> **Your answer:**
> _(write here)_

---

## Answer Guide — Claude's Reference Answers

---

**Q1 — end_turn without task_complete signal**

`end_turn` fires — this is correct. `end_turn` is the primary stop condition. `<task_complete>` is a supplementary explicit signal, not a replacement. Claude reaching end_turn means it determined the task is done — that's valid regardless of whether it output the signal.

The stop_sequence fires only if Claude produces the exact string before `end_turn`. If Claude finishes naturally without producing the signal, `end_turn` takes precedence and the response is still valid.

Your code should handle both:
```python
if response.stop_reason in ("end_turn", "stop_sequence"):
    output = extract_text(response)
    # Both mean "Claude is done" — validate and return
```

---

**Q2 — Productive repetition vs stuck**

The stuck detection as written has a **false positive** — it fires when the same tool+arguments appear twice, but doesn't account for legitimate repetition (API returning fresh data on each call).

**Better stuck detection:** Check whether the RESULTS are the same, not just the calls:

```python
def detect_stuck_loop_v2(messages: list) -> bool:
    """Stuck = same tool, same args, AND same result."""
    call_results = []
    
    for i, message in enumerate(messages):
        if message["role"] == "assistant":
            for block in (message["content"] if isinstance(message["content"], list) else []):
                if isinstance(block, dict) and block.get("type") == "tool_use":
                    call_sig = (block["name"], json.dumps(block["input"], sort_keys=True))
                    # Find the corresponding result
                    result = get_tool_result(messages, block["id"])
                    call_with_result = (call_sig, result)
                    
                    if call_with_result in call_results:
                        return True  # Same call AND same result = truly stuck
                    call_results.append(call_with_result)
    
    return False
```

If the API returned different results, the full tuple (call + result) won't match → no false positive.

---

**Q3 — High confidence but wrong answer**

This reveals a critical limitation: **Claude's confidence is calibrated for uncertainty about facts, not for correctness of reasoning.**

Claude might correctly know that "ScreenshotAI has 4.6 rating" (high confidence) but incorrectly conclude "therefore it's the best app for the user's needs" (reasoning error). The confidence reflects data retrieval accuracy, not recommendation quality.

**Implications:**
1. Never use confidence as your only stop condition for reasoning tasks
2. Use external validation for anything with business consequences
3. Consider adding a "reasoning check" — a second Claude call that evaluates whether the conclusion follows logically from the evidence
4. For high-stakes decisions, always require human review regardless of confidence level

---

**Q4 — Three consecutive validation failures**

After 3 failures, escalate — don't keep retrying:

```python
MAX_VALIDATION_RETRIES = 3
validation_failures = 0

for iteration in range(MAX_ITER):
    response = ...
    
    if response.stop_reason == "end_turn":
        output = extract_text(response)
        is_valid, error = validate_output(output)
        
        if is_valid:
            return output
        
        validation_failures += 1
        
        if validation_failures >= MAX_VALIDATION_RETRIES:
            # Three strikes — something is systematically wrong
            logger.error(f"Output validation failed {validation_failures} times")
            logger.error(f"Last output: {output}")
            logger.error(f"Last error: {error}")
            
            # Options depending on system criticality:
            # 1. Raise exception → human review
            raise ValidationError(f"Failed validation {validation_failures}x: {error}")
            # 2. Return best-effort output with warning
            # return {"warning": "unvalidated_output", "content": output}
            # 3. Switch to a more capable model for one final attempt
```

Three failures likely indicate: the model can't produce the required format for this input type, the prompt is flawed, or the validation requirements are unrealistic. Raising rather than silently returning protects downstream systems from bad data.

---

**Q5 — Information to collect before escalating**

```python
def escalate_to_human(messages: list) -> dict:
    """Build a complete escalation package for human review."""
    
    # Extract the original task
    original_task = messages[0]["content"]
    
    # Extract what Claude found (tool results)
    findings = []
    for message in messages:
        if message["role"] == "user" and isinstance(message["content"], list):
            for block in message["content"]:
                if block.get("type") == "tool_result":
                    findings.append(json.loads(block["content"]))
    
    # Extract Claude's reasoning at the point it escalated
    last_assistant = None
    for message in reversed(messages):
        if message["role"] == "assistant":
            last_assistant = message
            break
    
    claude_reasoning = ""
    if last_assistant:
        for block in last_assistant["content"]:
            if isinstance(block, dict) and block.get("type") == "text":
                claude_reasoning = block.get("text", "")
    
    return {
        "escalation_reason": "needs_human",
        "original_task": original_task,
        "what_claude_found": findings,
        "claude_reasoning": claude_reasoning,
        "recommended_next_step": "Review findings and take action",
        "conversation_history": messages  # Full context for human agent
    }
```

Present this as a structured handoff to the human agent — they see the complete context without having to reconstruct what the AI was doing.

---

**Q6 — Two failure modes of confidence-only stopping**

**Failure mode 1 — Never stops (confidence never reaches threshold):**

For genuinely difficult questions, Claude's confidence may plateau at 0.75–0.85 even with extensive tool calls. If your threshold is 0.9, the agent calls tools forever trying to reach a confidence level that the problem structure won't support.

**Failure mode 2 — Stops too early (overconfident on insufficient data):**

Claude can produce high confidence (0.92) after just one tool call if the system prompt or training biases it toward confidence. The answer is wrong — it just isn't calibrated to know it's wrong.

**Why confidence alone is insufficient:**
- No hard limit on iterations (failure mode 1)
- No external validation of correctness (failure mode 2)
- Confidence is Claude's subjective assessment, not ground truth

Confidence works as one signal in a multi-signal system — never as the only stop condition.

---

**Q7 — Hidden problem with 10% hitting max_iterations**

Even if those tasks "complete," they represent systemic problems:

**Problem 1 — Cost:** 10% of tasks running 10 iterations instead of 3 = 3.3x more API calls for those tasks. At 100 tasks/day hitting the limit, that's ~230 extra API calls daily.

**Problem 2 — Latency:** Users in the 10% group wait 3x longer. If your average task is 30 seconds at 3 iterations, limit-hitting tasks take 100+ seconds. This is a severe UX problem.

**Problem 3 — Quality:** Tasks that hit max_iterations were stopped mid-process — their output may be incomplete or inaccurate. 10% of your outputs have degraded quality.

**Problem 4 — What it signals:** A consistently high limit-hit rate indicates either your tasks are genuinely too complex for the model (model upgrade needed) or your agent is stuck in loops for some input class (bug needing diagnosis).

**The right response:** Profile the 10% — are they all the same task type? If yes, a targeted fix for that task type could eliminate most limit hits. If random, your max_iterations may be too low for your task complexity.

---

**Q8 — Travel booking stop conditions**

```python
TRAVEL_AGENT_STOP_CONDITIONS = {
    
    # HAPPY PATH
    "booking_confirmed": {
        "stop_sequence": "<booking_complete>",
        "validation": lambda r: "confirmation_number" in r,
        "description": "All steps completed, booking confirmed"
    },
    
    # PARTIAL FAILURE — can still complete with degraded result
    "partial_results": {
        "trigger": "one_component_failed",  # e.g., hotel API down
        "action": "continue_with_available",
        "user_message": "I found flights but couldn't search hotels (service unavailable). "
                        "Here are the flights — would you like me to try hotels again?"
    },
    
    # HARD FAILURE — cannot complete
    "hard_failure": {
        "stop_sequence": "<cannot_complete>",
        "trigger": "all_flight_options_exhausted OR dates_unavailable",
        "action": "escalate_with_context",
        "user_message": "No flights found matching your criteria for those dates."
    },
    
    # USER CONFIRMATION REQUIRED — high-stakes action
    "confirmation_required": {
        "stop_sequence": "<awaiting_confirmation>",
        "trigger": "before_any_booking_action",
        "payload": {
            "flight": "selected_flight_details",
            "hotel": "selected_hotel_details",
            "total_cost": "calculated_total"
        },
        "user_prompt": "I found: [details]. Total: $X. Shall I confirm the booking?"
    },
    
    # BUDGET EXCEEDED
    "budget_exceeded": {
        "stop_sequence": "<budget_exceeded>",
        "trigger": "total_cost > user_budget",
        "options": [
            "Show cheapest available combination",
            "Ask user to increase budget",
            "Suggest alternative dates"
        ],
        "user_message": "The best options I found total $X, which exceeds your $Y budget. "
                        "Would you like to see these options or explore alternatives?"
    },
    
    # SAFETY NET
    "max_iterations": {
        "limit": 12,  # Generous for complex multi-step booking
        "action": "return_partial_with_status",
        "partial_response": "show_best_found_so_far"
    }
}
```

The key insight: each stop condition has a specific action, not just "stop." The system knows what to do at each stop state — confirm, escalate, offer alternatives, or return partial results.

---

## Status

- [ ] All 5 stop condition types implemented
- [ ] task_complete stop sequence tested
- [ ] Confidence tracking logged
- [ ] detect_stuck_loop() implemented and tested
- [ ] External validation implemented
- [ ] production_agent_loop() built with all layers
- [ ] All 8 questions answered
- [ ] Answer guide reviewed

---

## Coming Up — Week 7, Day 4

**Topic:** Error Recovery in Loops
What happens when a tool fails mid-loop. Retry strategies. Fallback paths. How to tell Claude about failures gracefully so it can adapt. The difference between recoverable and unrecoverable errors in agents.

---

*CCA Self-Study Log · Asif · Phase 3 of 5 · Week 7 of 12*
