---
layout: default
title: CCA Self-Study — Week 7, Day 5
---

# CCA Self-Study — Week 7, Day 5
## Build a Simple Agent — Full Integration

**Date completed:** _____________
**Study time:** 60 mins (extended — this is a full build day)
**Curriculum phase:** Phase 3 — Agentic Architecture
**Exam domain:** Domain 1 · Agentic Architecture & Orchestration (27%)

---

## Core Concept

Today you build one complete, production-quality agent that integrates everything from W7 D1–D4:
- Correct agentic loop structure (D1)
- Plan/Act/Observe phase discipline (D2)
- All five stop conditions (D3)
- Error recovery and the never-crash rule (D4)

This is your reference implementation. Every future agent you build in Weeks 8–12 extends this pattern.

---

## What You're Building

**App Store Research Agent** — A complete research assistant that:

1. Takes a user research question about iOS apps
2. Searches the App Store catalog
3. Gets details on top candidates
4. Checks reviews when needed
5. Checks pricing history when relevant
6. Returns a structured research report
7. Handles all errors gracefully
8. Stops correctly on all five conditions

**This is the Exam Scenario 1 (Customer Support / Research Agent) in miniature.**

---

## The Complete Agent — Full Code

```python
# research_agent.py
# Complete production-quality research agent
# Week 7 Day 5 — Reference Implementation

import anthropic
import json
import time
import logging
import re
from typing import Any, Optional
from dataclasses import dataclass, asdict
from enum import Enum

# ─────────────────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────────────────

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger(__name__)

MODEL = "claude-sonnet-4-6"
MAX_TOKENS = 4096
MAX_ITERATIONS = 10
MAX_TOOL_CALLS = 25
CONFIDENCE_THRESHOLD = 0.85

client = anthropic.Anthropic()

# ─────────────────────────────────────────────────────────
# Error Types
# ─────────────────────────────────────────────────────────

class AgentStopReason(Enum):
    NATURAL_COMPLETION = "natural_completion"
    TASK_COMPLETE_SIGNAL = "task_complete_signal"
    NEEDS_HUMAN = "needs_human"
    MAX_ITERATIONS = "max_iterations"
    HIGH_CONFIDENCE = "high_confidence"
    VALIDATION_PASSED = "validation_passed"
    FATAL_ERROR = "fatal_error"

@dataclass
class AgentResult:
    success: bool
    answer: str
    stop_reason: AgentStopReason
    iterations_used: int
    total_tool_calls: int
    errors_encountered: list
    metadata: dict

# ─────────────────────────────────────────────────────────
# Mock Tools (replace with real APIs in production)
# ─────────────────────────────────────────────────────────

MOCK_CATALOG = {
    "ScreenshotAI": {
        "name": "ScreenshotAI", "developer": "Asif Dev Labs",
        "price": 0.0, "rating": 4.6, "review_count": 1240,
        "category": "Productivity", "size_mb": 28.5,
        "ios_required": "16.0", "last_updated": "2026-03-15",
        "description": "AI-powered screenshot organiser with on-device OCR. "
                       "Find any screenshot by searching its text content.",
        "features": ["On-device AI", "OCR search", "Smart albums", "Privacy-first"]
    },
    "Screenshotter": {
        "name": "Screenshotter", "developer": "Legacy Apps Inc",
        "price": 2.99, "rating": 3.8, "review_count": 456,
        "category": "Utilities", "size_mb": 45.2,
        "ios_required": "14.0", "last_updated": "2024-08-20",
        "description": "Basic screenshot folder organisation.",
        "features": ["Folder organisation", "Tags"]
    },
    "CleanShot X": {
        "name": "CleanShot X", "developer": "CleanShot Team",
        "price": 29.99, "rating": 4.9, "review_count": 8930,
        "category": "Productivity", "size_mb": 62.1,
        "ios_required": "15.0", "last_updated": "2026-04-01",
        "description": "Professional screenshot tool with powerful annotation.",
        "features": ["Annotations", "Scrolling capture", "Cloud sync", "Video recording"]
    }
}

MOCK_REVIEWS = {
    "ScreenshotAI": {
        "average_rating": 4.6,
        "recent_reviews": [
            {"rating": 5, "text": "Finally an app that lets me search screenshots by text!"},
            {"rating": 4, "text": "Great app but occasional sync delays"},
            {"rating": 5, "text": "On-device processing is brilliant for privacy"}
        ],
        "common_praise": ["OCR search accuracy", "Privacy", "Speed"],
        "common_complaints": ["Occasional sync", "No cloud backup option"]
    }
}

MOCK_PRICE_HISTORY = {
    "CleanShot X": {
        "current_price": 29.99,
        "lowest_ever": 14.99,
        "last_sale": "2025-12-25",
        "sale_frequency": "2-3 times per year",
        "verdict": "Consider waiting for a holiday sale"
    },
    "ScreenshotAI": {
        "current_price": 0.0,
        "lowest_ever": 0.0,
        "verdict": "Always free — no price consideration needed"
    }
}

# ─────────────────────────────────────────────────────────
# Tool Definitions
# ─────────────────────────────────────────────────────────

TOOLS = [
    {
        "name": "search_apps",
        "description": (
            "Search the App Store catalog by keyword, category, or use case. "
            "Use as the FIRST step when the user mentions an app type or category "
            "without a specific app name. "
            "Returns: list of matching apps with name, rating, price, and short description. "
            "Do not use if you already have a specific app name — use get_app_details directly."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Search keyword or use case"},
                "limit": {"type": "integer", "description": "Max results (1-10, default 5)"}
            },
            "required": ["query"]
        }
    },
    {
        "name": "get_app_details",
        "description": (
            "Get comprehensive details for one specific app by name. "
            "Use when you have a specific app name and need full information. "
            "Returns: developer, price, rating, size, iOS requirement, "
            "last_updated, description, and feature list. "
            "Do not use for searching — use search_apps first if needed."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "app_name": {"type": "string", "description": "Exact app name"}
            },
            "required": ["app_name"]
        }
    },
    {
        "name": "get_app_reviews",
        "description": (
            "Get recent user reviews and sentiment analysis for an app. "
            "ONLY call when the user specifically asks about reviews, "
            "user opinions, complaints, or reliability. "
            "Returns: average_rating, recent reviews, common praise, common complaints."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "app_name": {"type": "string", "description": "App name"}
            },
            "required": ["app_name"]
        }
    },
    {
        "name": "get_price_history",
        "description": (
            "Get historical pricing and sale information for an app. "
            "Call when the user asks if an app has been on sale, "
            "whether to buy now vs wait, or about pricing trends. "
            "Returns: current_price, lowest_ever_price, sale_frequency, purchase_verdict."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "app_name": {"type": "string", "description": "App name"}
            },
            "required": ["app_name"]
        }
    }
]

# ─────────────────────────────────────────────────────────
# Tool Implementations (with safe error handling)
# ─────────────────────────────────────────────────────────

def execute_tool(name: str, args: dict) -> dict:
    """
    Execute a tool. NEVER raises — always returns a dict.
    Errors are returned as structured dicts for Claude to reason about.
    """
    try:
        if name == "search_apps":
            return _search_apps(**args)
        elif name == "get_app_details":
            return _get_app_details(**args)
        elif name == "get_app_reviews":
            return _get_app_reviews(**args)
        elif name == "get_price_history":
            return _get_price_history(**args)
        else:
            return {
                "status": "error",
                "error_type": "unknown_tool",
                "message": f"Unknown tool: {name}",
                "is_retryable": False
            }
    except Exception as e:
        logger.error(f"Unexpected error in tool {name}: {e}")
        return {
            "status": "error",
            "error_type": "unexpected_error",
            "tool": name,
            "message": str(e),
            "is_retryable": False,
            "suggestion": "Proceed with available information."
        }

def _search_apps(query: str, limit: int = 5) -> dict:
    query_lower = query.lower()
    results = [
        {
            "name": app["name"],
            "rating": app["rating"],
            "price": "Free" if app["price"] == 0 else f"${app['price']:.2f}",
            "short_description": app["description"][:100]
        }
        for app in MOCK_CATALOG.values()
        if query_lower in app["name"].lower()
        or query_lower in app["description"].lower()
        or query_lower in app["category"].lower()
    ]
    
    if not results:
        return {
            "status": "error",
            "error_type": "no_results",
            "query": query,
            "message": f"No apps found matching '{query}'.",
            "suggestion": "Try a broader search term or check the spelling.",
            "is_retryable": False
        }
    
    return {
        "status": "success",
        "query": query,
        "total_found": len(results),
        "results": results[:limit]
    }

def _get_app_details(app_name: str) -> dict:
    app = MOCK_CATALOG.get(app_name)
    if not app:
        similar = [n for n in MOCK_CATALOG if app_name.lower() in n.lower()]
        return {
            "status": "error",
            "error_type": "not_found",
            "searched_for": app_name,
            "message": f"No app named '{app_name}' found.",
            "similar_apps": similar,
            "suggestion": f"Try one of: {similar}" if similar else "Use search_apps to find the correct name.",
            "is_retryable": False
        }
    return {"status": "success", **app}

def _get_app_reviews(app_name: str) -> dict:
    reviews = MOCK_REVIEWS.get(app_name)
    if not reviews:
        return {
            "status": "error",
            "error_type": "not_found",
            "message": f"No reviews available for '{app_name}'.",
            "suggestion": "Reviews may not be available for all apps.",
            "is_retryable": False
        }
    return {"status": "success", "app": app_name, **reviews}

def _get_price_history(app_name: str) -> dict:
    history = MOCK_PRICE_HISTORY.get(app_name)
    if not history:
        return {
            "status": "error",
            "error_type": "not_found",
            "message": f"No price history available for '{app_name}'.",
            "is_retryable": False
        }
    return {"status": "success", "app": app_name, **history}

# ─────────────────────────────────────────────────────────
# Agent Loop
# ─────────────────────────────────────────────────────────

SYSTEM_PROMPT = """
You are an expert iOS App Store research agent.

TASK EXECUTION:
1. Assess what the user needs (plan phase)
2. Gather necessary data using tools
3. Provide a clear, structured answer

TOOL SELECTION RULES:
- Use search_apps FIRST when the user mentions app types or categories
- Use get_app_details for specific app information
- Use get_app_reviews ONLY when user asks about opinions/reliability
- Use get_price_history ONLY when user asks about sales or timing
- Call independent tools in parallel to save time
- Stop calling tools once you have enough to answer

COMPLETION:
When your task is fully complete, output: <task_complete>
When you need user clarification to proceed, output: <needs_human>

CONFIDENCE TRACKING:
After each tool call, include in your text:
<confidence>0.0-1.0</confidence>
where 0.0 = need more data, 1.0 = ready to answer

ERROR HANDLING:
If a tool returns an error, read the 'suggestion' field and act on it.
If is_retryable is false, do not call that tool again.
Provide the best answer possible with available data.

OUTPUT FORMAT:
Structure your final answer with:
- **Recommendation:** [clear recommendation]
- **Key findings:** [bullet points]
- **Caveats:** [any limitations from missing data]
"""

def run_research_agent(research_question: str) -> AgentResult:
    """
    Complete production-quality research agent.
    Returns an AgentResult with full metadata.
    """
    
    logger.info(f"Agent started: {research_question[:80]}...")
    start_time = time.time()
    
    messages = [{"role": "user", "content": research_question}]
    iteration = 0
    total_tool_calls = 0
    errors_encountered = []
    
    while iteration < MAX_ITERATIONS:
        iteration += 1
        logger.info(f"Iteration {iteration}/{MAX_ITERATIONS}")
        
        # Stuck loop detection
        if iteration > 3 and _detect_stuck(messages):
            logger.warning("Stuck loop detected — injecting recovery prompt")
            messages.append({
                "role": "user",
                "content": "You appear to be repeating steps. "
                           "Based on what you've found, please provide your best answer now."
            })
        
        # Claude call
        response = client.messages.create(
            model=MODEL,
            max_tokens=MAX_TOKENS,
            system=SYSTEM_PROMPT,
            tools=TOOLS,
            stop_sequences=["<task_complete>", "<needs_human>"],
            messages=messages
        )
        
        logger.info(f"stop_reason: {response.stop_reason}")
        
        # ── STOP CONDITION 1: Natural completion ────────────
        if response.stop_reason == "end_turn":
            output = _extract_text(response)
            
            # Validate output
            is_valid, validation_error = _validate_output(output)
            if is_valid:
                logger.info("Task complete via end_turn + validation")
                return AgentResult(
                    success=True,
                    answer=output,
                    stop_reason=AgentStopReason.NATURAL_COMPLETION,
                    iterations_used=iteration,
                    total_tool_calls=total_tool_calls,
                    errors_encountered=errors_encountered,
                    metadata={"duration_seconds": time.time() - start_time}
                )
            else:
                # Validation failed — add error and continue
                logger.warning(f"Validation failed: {validation_error}")
                messages.append({"role": "assistant", "content": response.content})
                messages.append({
                    "role": "user",
                    "content": f"Your answer didn't meet requirements: {validation_error}. "
                               f"Please revise with a structured recommendation."
                })
                continue
        
        # ── STOP CONDITION 2: Explicit signal ───────────────
        elif response.stop_reason == "stop_sequence":
            signal = response.stop_sequence
            
            if signal == "<task_complete>":
                output = _extract_text(response)
                logger.info("Task complete via explicit signal")
                return AgentResult(
                    success=True,
                    answer=output,
                    stop_reason=AgentStopReason.TASK_COMPLETE_SIGNAL,
                    iterations_used=iteration,
                    total_tool_calls=total_tool_calls,
                    errors_encountered=errors_encountered,
                    metadata={"duration_seconds": time.time() - start_time}
                )
            
            elif signal == "<needs_human>":
                output = _extract_text(response)
                logger.info("Escalating to human")
                return AgentResult(
                    success=False,
                    answer=f"Human review required: {output}",
                    stop_reason=AgentStopReason.NEEDS_HUMAN,
                    iterations_used=iteration,
                    total_tool_calls=total_tool_calls,
                    errors_encountered=errors_encountered,
                    metadata={"escalation_context": messages}
                )
        
        # ── TOOL USE: Continue loop ──────────────────────────
        elif response.stop_reason == "tool_use":
            tool_uses = [b for b in response.content if b.type == "tool_use"]
            total_tool_calls += len(tool_uses)
            
            # Check total tool call budget
            if total_tool_calls > MAX_TOOL_CALLS:
                logger.error(f"Tool call budget exceeded: {total_tool_calls}")
                break
            
            # Check confidence signal → may stop early
            for block in response.content:
                if block.type == "text":
                    conf = _extract_confidence(block.text)
                    if conf and conf >= CONFIDENCE_THRESHOLD:
                        logger.info(f"High confidence ({conf}) — requesting final answer")
                        messages.append({"role": "assistant", "content": response.content})
                        messages.append({
                            "role": "user",
                            "content": "Your confidence is high. Please provide your final "
                                       "structured answer now, without further tool calls."
                        })
                        # Next iteration Claude should end_turn
                        break
                    break
            else:
                # Normal tool execution
                messages.append({"role": "assistant", "content": response.content})
                
                tool_results = []
                for tool_use in tool_uses:
                    logger.info(f"  Calling: {tool_use.name}({list(tool_use.input.keys())})")
                    
                    result = execute_tool(tool_use.name, tool_use.input)
                    
                    if result.get("status") == "error":
                        errors_encountered.append({
                            "iteration": iteration,
                            "tool": tool_use.name,
                            "error": result["error_type"]
                        })
                    
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": tool_use.id,
                        "content": json.dumps(result),
                        "is_error": result.get("status") == "error"
                    })
                
                messages.append({"role": "user", "content": tool_results})
        
        elif response.stop_reason == "max_tokens":
            logger.error("Response truncated — increase max_tokens")
            break
    
    # ── STOP CONDITION 3: Max iterations ────────────────────
    logger.warning(f"Max iterations ({MAX_ITERATIONS}) reached")
    partial_answer = "Research incomplete — max iterations reached. " \
                     "Based on available data: [partial findings would appear here]"
    
    return AgentResult(
        success=False,
        answer=partial_answer,
        stop_reason=AgentStopReason.MAX_ITERATIONS,
        iterations_used=iteration,
        total_tool_calls=total_tool_calls,
        errors_encountered=errors_encountered,
        metadata={"duration_seconds": time.time() - start_time}
    )

# ─────────────────────────────────────────────────────────
# Helper Functions
# ─────────────────────────────────────────────────────────

def _extract_text(response) -> str:
    text_blocks = [b for b in response.content if b.type == "text"]
    return text_blocks[0].text if text_blocks else "Task completed."

def _extract_confidence(text: str) -> Optional[float]:
    match = re.search(r'<confidence>([\d.]+)</confidence>', text)
    return float(match.group(1)) if match else None

def _validate_output(output: str) -> tuple[bool, str]:
    if len(output.strip()) < 50:
        return False, "Response too short to be a complete answer"
    if "**Recommendation:**" not in output and "recommendation" not in output.lower():
        return False, "Missing recommendation section"
    return True, ""

def _detect_stuck(messages: list) -> bool:
    call_signatures = []
    for msg in messages:
        if msg["role"] == "assistant":
            content = msg["content"]
            if isinstance(content, list):
                for block in content:
                    if isinstance(block, dict) and block.get("type") == "tool_use":
                        sig = (block["name"], json.dumps(block.get("input", {}), sort_keys=True))
                        if sig in call_signatures:
                            return True
                        call_signatures.append(sig)
    return False

# ─────────────────────────────────────────────────────────
# Run It
# ─────────────────────────────────────────────────────────

if __name__ == "__main__":
    
    test_questions = [
        "What's the best free screenshot app for iOS?",
        "Compare ScreenshotAI and Screenshotter — which should I download?",
        "Has CleanShot X ever been on sale? Is now a good time to buy?",
        "What do users think of ScreenshotAI?",
    ]
    
    for question in test_questions[:1]:  # Start with one
        print(f"\n{'='*60}")
        print(f"Question: {question}")
        print('='*60)
        
        result = run_research_agent(question)
        
        print(f"\nSuccess: {result.success}")
        print(f"Stop reason: {result.stop_reason.value}")
        print(f"Iterations: {result.iterations_used}")
        print(f"Tool calls: {result.total_tool_calls}")
        print(f"Errors: {result.errors_encountered}")
        print(f"\nAnswer:\n{result.answer}")
```

---

## Hands-On Task 🛠️

**Task 1:** Run the agent on all 4 test questions. Record which stop condition fired for each.

**Task 2:** Introduce a 60% failure rate to `_get_app_details`. Run the comparison question. Confirm graceful degradation.

**Task 3:** Add a fifth tool `check_compatibility(app_name, ios_version)`. Test it with: "Will ScreenshotAI work on iOS 15?"

**Task 4:** Time each question. Calculate cost estimate using token counts from `response.usage`.

**Task 5 — Exam prep:** Explain in writing (without looking at the code) the sequence of events when a tool returns an error result. Start from "Claude receives user message" and end at "user sees the answer."

**Your results and explanation:**
> _(write here)_

---

## Q&A — Self-Assessment (6 Questions — Integration Level)

---

**Q1.** The agent's stuck detection fires at iteration 4. The recovery prompt is: "Based on what you've found, provide your best answer now." Claude produces end_turn. The answer is correct. Was stuck detection the right call? Could it be a false positive?

> **Your answer:**
> _(write here)_

---

**Q2.** The agent runs 8 iterations. `total_tool_calls` is 22. Each tool call averages 300 input tokens for tool result. How much additional cost did tool results add beyond the initial message? (Use Sonnet pricing: $3/1M input tokens)

> **Your answer:**
> _(write here)_

---

**Q3.** A user asks: "Tell me everything about all apps in the Productivity category." This could require 10+ tool calls. How should the agent handle this to avoid hitting max_iterations?

> **Your answer:**
> _(write here)_

---

**Q4.** The `AgentResult` dataclass has `errors_encountered` — a list of errors from tool calls. The agent still returned `success=True`. How is this possible, and why is it the right design?

> **Your answer:**
> _(write here)_

---

**Q5 — Exam Scenario.** A production research agent with this architecture processes 500 queries/day. Monitoring shows: iteration count is rising week over week (Week 1 avg: 3.2, Week 4 avg: 5.8). Tool call errors are flat (2%). What is the most likely cause of rising iterations, and what do you investigate?

> **Your answer:**
> _(write here)_

---

**Q6 — Architecture Reflection.** You've now built and understand a complete agentic loop. Looking at the full `research_agent.py`, identify the three architectural decisions that most affect production reliability. For each, explain what would break if you changed it.

> **Your answer:**
> _(write here)_

---

## Answer Guide — Claude's Reference Answers

---

**Q1 — Stuck detection: right call or false positive?**

It was correct in effect (the agent completed successfully) but may have been a false positive in cause. Stuck detection fires when the same tool+args appears twice. But "twice" can mean:
1. Genuinely stuck (same call, no progress)
2. Legitimately needed (comparison queries call the same tool for different apps, or Claude re-verified data)

If the agent was making genuine progress (each call returning new data that informed later decisions), the stuck detection was a false positive. The answer came out correct because Claude, asked to "give your best answer now," had enough data — but it might have gathered more useful data in the next iteration.

**The fix:** Make stuck detection smarter (same call + same result = stuck, not just same call). For now, if the answer is correct, the false positive just cost 1-2 iterations — acceptable.

---

**Q2 — Tool result token cost**

Tool results add to input tokens because they become part of the messages array sent on every subsequent call.

**Calculation:**
- 22 tool calls × 300 tokens each = 6,600 tool result tokens
- But these accumulate: result 1 is sent on calls 2-8 (7 times), result 2 sent 6 times, etc.
- Average re-sends: ~4x per result on average for 8 iterations
- Effective tokens: 22 × 300 × 4 = 26,400 additional input tokens (rough estimate)
- Cost: 26,400 / 1,000,000 × $3 = **$0.079 additional**

For 500 queries/day: $0.079 × 500 = **$39.60/day** just from accumulated tool results.

This is why context management matters for cost — tool results stay in the messages array and multiply the input token count on every subsequent call.

---

**Q3 — "Everything about all Productivity apps"**

The agent should NOT attempt to retrieve everything. Instead:

1. **Scope clarification in system prompt:** "If a query would require more than 8 tool calls to answer fully, scope it to the most relevant 3-5 items and note the limitation."

2. **Proactive scoping in response:** Claude should answer: "There are multiple Productivity apps. I'll cover the top 3 by rating — ScreenshotAI (4.6★), CleanShot X (4.9★). For a complete catalog, please specify which apps interest you most."

3. **Pagination approach:** Agent returns top 3 with a note: "I found 12 Productivity apps. Here are the top 3 — ask me for more specifics."

4. **Hard tool call budget:** `MAX_TOOL_CALLS = 25` prevents runaway tool calls even if Claude tries to cover everything.

The agent should never silently time out on an over-broad query — always scope and explain.

---

**Q4 — success=True with errors_encountered**

This is correct design. `success=True` means the agent completed its task and produced a useful answer — not that every intermediate step succeeded.

Errors in `errors_encountered` represent recoverable failures along the way. For example:
- `get_price_history("Screenshotter")` → not_found error
- Claude adapted: answered based on available data, noted CleanShot X has price history

The user gets a useful, accurate answer. The fact that one tool call failed is operational detail — not a user-facing failure.

`success=False` should mean: the agent could not produce a useful answer (max_iterations, fatal error, needs_human).

`errors_encountered` is engineering telemetry — used for monitoring, debugging, and prompt improvement. Not used to determine user-visible success/failure.

---

**Q5 — Rising iterations week over week**

**Most likely cause: Prompt degradation or model behavior drift combined with query distribution shift.**

Detailed hypotheses:

1. **Query complexity increasing:** If users are asking more complex questions in Week 4 vs Week 1 (more comparisons, more research questions), more tool calls per question are legitimately needed.

2. **Tool result quality degrading:** If a data source started returning less structured data (API changes, different error formats), Claude's observe phase is less efficient and needs more calls to extract the same information.

3. **Model update:** Anthropic periodically updates models. A model update may have changed Claude's tool-calling behaviour (more conservative = fewer calls, more thorough = more calls).

**What to investigate:**
1. Log iteration count PER QUERY TYPE. If complex queries went from 5 to 7 iterations but simple queries stayed at 2 — it's query distribution shift.
2. Log which tools are called most in high-iteration sessions — if one tool is called repeatedly, its result format may have changed.
3. Check if a model update was released during the period of increase.
4. Review system prompt and tool descriptions for any recent changes.

---

**Q6 — Three most important architectural decisions**

**Decision 1 — "Never crash the loop" in `execute_tool()`**

The try/except wrapping every tool call returns structured errors instead of raising. 

If changed: any tool exception would propagate up to the loop, crash `run_research_agent()`, and return nothing to the user. Every tool failure would mean a complete failure for the user. The agent would have 0% error recovery capability.

**Decision 2 — Append `response.content` (not just text) to messages**

`messages.append({"role": "assistant", "content": response.content})` preserves the full content including `tool_use` blocks.

If changed to `response.content[0].text`: tool_use blocks are lost from the messages array. When tool results are returned, the API can't find the corresponding tool_use_ids. Every tool call after iteration 1 would return an API error.

**Decision 3 — Separate stop_reason handling (all cases explicit)**

Every `stop_reason` value has an explicit handler: end_turn → validate → return or continue, stop_sequence → handle signal type, tool_use → execute tools, max_tokens → error.

If changed to handle only end_turn/tool_use: max_tokens responses are silently continued (returning truncated answers), unknown stop_sequences are ignored (signals missed), and stop_sequence signals cause the loop to hang waiting for more tool calls that never come.

---

## Week 7 Complete — What You Now Know

| Day | Topic | Exam Relevance |
|---|---|---|
| D1 | Agentic loop structure, stop_reasons, loop invariants | Core — every agent question |
| D2 | Plan/Act/Observe phases, planning failures | Diagnostic questions |
| D3 | Five stop conditions, stuck detection | Architecture design questions |
| D4 | Error recovery, error-as-information | Production scenario questions |
| D5 | Complete integration, production patterns | Exam scenario 1 & 3 |

---

## Status

- [ ] Full agent built and running
- [ ] All 4 test questions run
- [ ] Failure simulation tested
- [ ] Fifth tool added
- [ ] Cost calculation done
- [ ] Written explanation of error recovery flow completed
- [ ] All 6 questions answered
- [ ] Answer guide reviewed
- [ ] Week 7 complete 🎉

---

## Coming Up — Week 8, Day 1

**Topic:** Why Multiple Agents?
The case for specialisation, parallelism, and cost optimisation through multi-agent systems. When one agent isn't enough. The hub-and-spoke architecture pattern — the most tested multi-agent pattern on the CCA exam.

---

*CCA Self-Study Log · Asif · Phase 3 of 5 · Week 7 of 12*
