# CCA Self-Study — Week 8, Day 4
## Lifecycle Hooks & Guardrails

**Date completed:** _____________
**Study time:** 45–60 mins
**Curriculum phase:** Phase 3 — Agentic Architecture
**Exam domain:** Domain 1 · Agentic Architecture & Orchestration (27%)

---

## Core Concept

This is the most important distinction the CCA exam tests on agent reliability:

> **When something MUST happen — use programmatic enforcement. When something SHOULD happen — use prompting.**

Lifecycle hooks are the programmatic enforcement layer. They intercept every tool call before execution, inspect it, and either allow it, modify it, block it, or escalate it — deterministically, every single time, with zero reliance on Claude's judgment.

A prompt that says "never spend more than $100" will be followed 99% of the time. That 1% failure can cost real money. A lifecycle hook that checks `if total_spend + estimated_cost > 100: raise CostLimitExceeded()` will work 100% of the time. For compliance-critical rules, 100% is the only acceptable number.

---

## The Analogy — Airport Security

Airport security doesn't rely on passengers being honest. "Please don't bring weapons" is a prompt. Metal detectors are a lifecycle hook — they intercept every passenger, inspect deterministically, and block if the check fails.

The security effectiveness doesn't come from hoping passengers follow the rule. It comes from the mechanical inspection that happens regardless of what passengers intend.

Your lifecycle hooks are the metal detectors of your agentic system.

---

## What Lifecycle Hooks Intercept

In an agentic loop, hooks intercept at defined points in the lifecycle:

```
User message arrives
        ↓
[PRE-REQUEST HOOK] ← Validate input, check rate limits, authenticate
        ↓
Claude generates response
        ↓
[PRE-TOOL-EXECUTION HOOK] ← Inspect tool call, check cost, check permissions
        ↓
Tool executes
        ↓
[POST-TOOL-EXECUTION HOOK] ← Validate result, log, detect anomalies
        ↓
Claude reads result and continues
        ↓
Claude generates final response
        ↓
[PRE-OUTPUT HOOK] ← Validate output, check compliance, redact PII
        ↓
Response delivered to user
```

---

## Implementing Lifecycle Hooks

### Hook Architecture

```python
from typing import Callable, Any
from dataclasses import dataclass
from enum import Enum

class HookDecision(Enum):
    ALLOW    = "allow"     # Proceed normally
    BLOCK    = "block"     # Prevent this action
    MODIFY   = "modify"    # Change the action before execution
    ESCALATE = "escalate"  # Route to human review

@dataclass
class HookContext:
    tool_name: str
    tool_input: dict
    agent_id: str
    session_id: str
    iteration: int
    total_cost_so_far: float
    metadata: dict

@dataclass
class HookResult:
    decision: HookDecision
    modified_input: dict = None  # Used if decision == MODIFY
    reason: str = ""
    escalation_data: dict = None  # Used if decision == ESCALATE

# Type alias for hook functions
Hook = Callable[[HookContext], HookResult]
```

### The Hook Registry

```python
class HookRegistry:
    """Manages a chain of hooks that run in order."""
    
    def __init__(self):
        self._pre_tool_hooks: list[Hook] = []
        self._post_tool_hooks: list[Hook] = []
        self._pre_output_hooks: list[Hook] = []
    
    def register_pre_tool(self, hook: Hook, priority: int = 0):
        """Register a hook that runs before tool execution."""
        self._pre_tool_hooks.append((priority, hook))
        self._pre_tool_hooks.sort(key=lambda x: x[0], reverse=True)
    
    def run_pre_tool_hooks(self, context: HookContext) -> HookResult:
        """Run all pre-tool hooks. First BLOCK or ESCALATE decision wins."""
        for _, hook in self._pre_tool_hooks:
            result = hook(context)
            if result.decision in (HookDecision.BLOCK, HookDecision.ESCALATE):
                return result  # Stop chain on blocking decision
            if result.decision == HookDecision.MODIFY:
                context.tool_input = result.modified_input  # Modify and continue
        return HookResult(decision=HookDecision.ALLOW)
    
    def run_post_tool_hooks(self, context: HookContext, result: dict) -> dict:
        """Run post-tool hooks. Can modify the result."""
        for _, hook in self._post_tool_hooks:
            hook_result = hook(context)
            # Post-tool hooks can modify result but don't block
        return result

hooks = HookRegistry()
```

---

## The Six Essential Production Hooks

### Hook 1 — Cost Enforcement

```python
class CostEnforcementHook:
    """Prevents agent from exceeding budget. NEVER relies on prompting."""
    
    def __init__(self, max_cost_per_session: float, cost_estimator: callable):
        self.max_cost = max_cost_per_session
        self.estimate_cost = cost_estimator
        self.session_costs: dict[str, float] = {}
    
    def __call__(self, ctx: HookContext) -> HookResult:
        session_spent = self.session_costs.get(ctx.session_id, 0.0)
        estimated = self.estimate_cost(ctx.tool_name, ctx.tool_input)
        
        if session_spent + estimated > self.max_cost:
            return HookResult(
                decision=HookDecision.BLOCK,
                reason=f"Cost limit exceeded. Spent: ${session_spent:.3f}, "
                       f"Limit: ${self.max_cost:.3f}, "
                       f"This call would cost: ${estimated:.3f}"
            )
        
        # Update running cost estimate
        self.session_costs[ctx.session_id] = session_spent + estimated
        return HookResult(decision=HookDecision.ALLOW)

hooks.register_pre_tool(
    CostEnforcementHook(max_cost_per_session=1.00, cost_estimator=estimate_tool_cost),
    priority=100  # Highest priority — run first
)
```

---

### Hook 2 — Permission Check

```python
def permission_check_hook(ctx: HookContext) -> HookResult:
    """Verify this agent has permission to call this tool."""
    
    TOOL_PERMISSIONS = {
        "research_agent": ["search_apps", "get_app_details", "get_app_reviews"],
        "support_agent":  ["get_customer_info", "create_ticket", "send_email"],
        "admin_agent":    ["*"],  # All tools
    }
    
    allowed_tools = TOOL_PERMISSIONS.get(ctx.agent_id, [])
    
    if "*" in allowed_tools:
        return HookResult(decision=HookDecision.ALLOW)
    
    if ctx.tool_name not in allowed_tools:
        return HookResult(
            decision=HookDecision.BLOCK,
            reason=f"Agent '{ctx.agent_id}' is not permitted to call '{ctx.tool_name}'. "
                   f"Permitted tools: {allowed_tools}"
        )
    
    return HookResult(decision=HookDecision.ALLOW)

hooks.register_pre_tool(permission_check_hook, priority=90)
```

---

### Hook 3 — Dangerous Action Guard

```python
DANGEROUS_TOOLS = {
    "delete_record":       "IRREVERSIBLE data deletion",
    "process_payment":     "Financial transaction",
    "send_mass_email":     "Mass communication",
    "deploy_to_production":"Production deployment",
    "update_all_records":  "Bulk data modification"
}

def dangerous_action_hook(ctx: HookContext) -> HookResult:
    """Block or escalate dangerous tool calls for human review."""
    
    if ctx.tool_name in DANGEROUS_TOOLS:
        return HookResult(
            decision=HookDecision.ESCALATE,
            reason=f"Tool '{ctx.tool_name}' is classified as dangerous: "
                   f"{DANGEROUS_TOOLS[ctx.tool_name]}. "
                   f"Human approval required before execution.",
            escalation_data={
                "tool": ctx.tool_name,
                "input": ctx.tool_input,
                "agent": ctx.agent_id,
                "session": ctx.session_id,
                "requires": "HUMAN_APPROVAL"
            }
        )
    
    return HookResult(decision=HookDecision.ALLOW)

hooks.register_pre_tool(dangerous_action_hook, priority=95)
```

---

### Hook 4 — Rate Limiting

```python
import time
from collections import deque

class RateLimitHook:
    """Prevents agents from making too many tool calls too quickly."""
    
    def __init__(self, max_calls: int, window_seconds: float):
        self.max_calls = max_calls
        self.window = window_seconds
        self.call_times: dict[str, deque] = {}
    
    def __call__(self, ctx: HookContext) -> HookResult:
        session_id = ctx.session_id
        now = time.time()
        
        if session_id not in self.call_times:
            self.call_times[session_id] = deque()
        
        calls = self.call_times[session_id]
        
        # Remove calls outside the window
        while calls and now - calls[0] > self.window:
            calls.popleft()
        
        if len(calls) >= self.max_calls:
            wait_time = self.window - (now - calls[0])
            return HookResult(
                decision=HookDecision.BLOCK,
                reason=f"Rate limit: {self.max_calls} calls per {self.window}s. "
                       f"Wait {wait_time:.1f}s before next call."
            )
        
        calls.append(now)
        return HookResult(decision=HookDecision.ALLOW)

hooks.register_pre_tool(RateLimitHook(max_calls=20, window_seconds=60), priority=85)
```

---

### Hook 5 — Input Sanitisation

```python
def input_sanitisation_hook(ctx: HookContext) -> HookResult:
    """Detect and block prompt injection attempts in tool inputs."""
    
    INJECTION_PATTERNS = [
        "ignore previous instructions",
        "forget your system prompt",
        "you are now",
        "disregard all",
        "override your",
        "new instructions:",
        "system:",
    ]
    
    # Stringify all input values for scanning
    input_text = json.dumps(ctx.tool_input).lower()
    
    for pattern in INJECTION_PATTERNS:
        if pattern in input_text:
            return HookResult(
                decision=HookDecision.BLOCK,
                reason=f"Potential prompt injection detected in tool input. "
                       f"Pattern: '{pattern}'"
            )
    
    # Check for excessively long inputs (potential flooding attack)
    if len(input_text) > 10_000:
        return HookResult(
            decision=HookDecision.BLOCK,
            reason=f"Tool input exceeds maximum length (10,000 chars). "
                   f"Got: {len(input_text)} chars."
        )
    
    return HookResult(decision=HookDecision.ALLOW)

hooks.register_pre_tool(input_sanitisation_hook, priority=88)
```

---

### Hook 6 — Output PII Redaction

```python
import re

def pii_redaction_hook(output: str) -> str:
    """Redact PII from agent output before returning to user."""
    
    # SSN pattern
    output = re.sub(r'\b\d{3}-\d{2}-\d{4}\b', '[SSN REDACTED]', output)
    
    # Credit card numbers
    output = re.sub(r'\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b', '[CC REDACTED]', output)
    
    # Email addresses (if agent shouldn't echo them)
    # output = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[EMAIL REDACTED]', output)
    
    return output

# Applied as post-output hook
hooks.register_pre_output(pii_redaction_hook)
```

---

## Integrating Hooks into the Agent Loop

```python
def run_agent_with_hooks(
    task: str, tools: list, executor: callable,
    hook_registry: HookRegistry
) -> str:
    
    messages = [{"role": "user", "content": task}]
    session_id = str(uuid.uuid4())
    
    for iteration in range(10):
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=4096,
            tools=tools,
            messages=messages
        )
        
        if response.stop_reason == "end_turn":
            output = extract_text(response)
            # Run pre-output hooks (PII redaction, compliance check)
            output = hook_registry.run_pre_output_hooks(output)
            return output
        
        elif response.stop_reason == "tool_use":
            messages.append({"role": "assistant", "content": response.content})
            tool_uses = [b for b in response.content if b.type == "tool_use"]
            
            tool_results = []
            for tool_use in tool_uses:
                
                # Build hook context
                ctx = HookContext(
                    tool_name=tool_use.name,
                    tool_input=tool_use.input,
                    agent_id="research_agent",
                    session_id=session_id,
                    iteration=iteration,
                    total_cost_so_far=0.0,  # Track separately
                    metadata={}
                )
                
                # ── RUN PRE-TOOL HOOKS ─────────────────────
                hook_result = hook_registry.run_pre_tool_hooks(ctx)
                
                if hook_result.decision == HookDecision.BLOCK:
                    # Tool was blocked — return error to Claude
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": tool_use.id,
                        "content": json.dumps({
                            "error": "blocked_by_guardrail",
                            "reason": hook_result.reason,
                            "message": "This action was blocked by a system guardrail. "
                                       "Try a different approach."
                        }),
                        "is_error": True
                    })
                    continue
                
                elif hook_result.decision == HookDecision.ESCALATE:
                    # Escalate to human — stop the loop
                    handle_escalation(hook_result.escalation_data)
                    return f"This action requires human review: {hook_result.reason}"
                
                elif hook_result.decision == HookDecision.MODIFY:
                    # Use modified input
                    tool_use.input = hook_result.modified_input
                
                # ── EXECUTE TOOL ───────────────────────────
                result = executor(tool_use.name, tool_use.input)
                
                # ── RUN POST-TOOL HOOKS ────────────────────
                result = hook_registry.run_post_tool_hooks(ctx, result)
                
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": tool_use.id,
                    "content": json.dumps(result)
                })
            
            messages.append({"role": "user", "content": tool_results})
    
    raise RuntimeError("Max iterations exceeded")
```

---

## Prompt-Based vs Hook-Based Enforcement

This table is directly exam-tested:

| Rule type | Prompt approach | Hook approach |
|---|---|---|
| Cost limit | "Never spend more than $100" | `if cost > 100: block` |
| Reliability | ~99% — Claude may comply | 100% — code enforces |
| For compliance | Insufficient | Required |
| For preferences | Good enough | Overkill |
| Debuggable | Hard — why did it fail? | Easy — hook log shows exactly why |
| Performance | No overhead | Tiny overhead |

**The exam rule:** Anything that MUST happen (compliance, safety, cost) goes in a hook. Anything that SHOULD happen (style, tone, format preferences) can be in a prompt.

---

## Key Concepts Learned Today

| Term | Definition |
|---|---|
| Lifecycle hook | Code that intercepts agent actions at defined points |
| Pre-tool hook | Runs before tool execution — can block, modify, or escalate |
| Post-tool hook | Runs after tool execution — can modify results, log |
| Pre-output hook | Runs before response delivery — can redact, validate |
| Guardrail | A hook specifically designed to enforce safety or compliance rules |
| Hook chain | Multiple hooks run in priority order — first block/escalate wins |
| Programmatic vs prompt enforcement | Hooks are deterministic; prompts are probabilistic |

---

## Hands-On Task 🛠️

**Task 1:** Implement the `HookRegistry` and `HookContext` classes above.

**Task 2:** Implement and register all 6 essential hooks.

**Task 3:** Integrate hooks into your agent from W7-D5. Run the research agent and confirm:
- Cost hook blocks when limit is reached
- Permission hook blocks when wrong agent calls wrong tool
- Rate limit hook blocks rapid consecutive calls

**Task 4:** Test the dangerous action hook: add a `delete_app_listing` tool. Confirm the hook escalates rather than executes.

**Task 5:** Add an audit log hook that records every tool call (name, input hash, decision, duration). Review the log after a full agent run.

**Your implementation:**
> _(write here)_

---

## Q&A — Self-Assessment (8 Questions)

---

**Q1.** Your system prompt says "never call delete_record." Your dangerous action hook blocks delete_record. Which enforcement is sufficient for a production compliance requirement? Why?

> **Your answer:**
> _(write here)_

---

**Q2.** A hook blocks a tool call and returns an error to Claude. Claude's next action is to call a different tool that achieves the same end goal through an indirect path. Is this a hook failure? How do you address it?

> **Your answer:**
> _(write here)_

---

**Q3.** Your cost enforcement hook has a $1.00 session limit. An agent calls 50 small tools at $0.02 each, hitting the limit at tool 50. Another session needs to process a single expensive operation that costs $0.85. Should both use the same hook configuration? What design does this suggest?

> **Your answer:**
> _(write here)_

---

**Q4.** You have 8 hooks in your chain. The first 3 all need to read `session_total_cost` from a database. What performance problem does this create, and how do you fix it?

> **Your answer:**
> _(write here)_

---

**Q5.** Your pre-output PII redaction hook strips SSNs from Claude's response. However, the SSN appears in the raw tool result that's already in the messages array (and thus in Claude's context). Is the pre-output redaction sufficient? What else must you do?

> **Your answer:**
> _(write here)_

---

**Q6.** A hook returns `HookDecision.ESCALATE` and sends a notification to a human reviewer. The human takes 4 hours to respond. Meanwhile, the agent session is waiting. How do you design the system to handle long-wait escalations without hanging the session?

> **Your answer:**
> _(write here)_

---

**Q7 — Exam Scenario.** Your multi-agent financial system has a hook that blocks tool calls costing more than $0.50. One subagent is a document analyser that must process 500-page contracts — this costs $0.75 per call, exceeding the hook limit. The system is blocking legitimate work. Design a solution that maintains the cost guard while allowing legitimate expensive operations.

> **Your answer:**
> _(write here)_

---

**Q8 — Deep Architecture.** Design the complete hook architecture for an autonomous software deployment agent. The agent can: check deployment status, run tests, analyse logs, trigger deployments, roll back deployments, and notify teams. Define: which tools need which hooks, what each hook checks, what decisions it can make, and what the escalation path is for each dangerous action.

> **Your answer:**
> _(write here)_

---

## Answer Guide — Claude's Reference Answers

---

**Q1 — Prompt vs hook for compliance**

**Hook enforcement is the only sufficient approach for production compliance.**

The system prompt approach has a fundamental flaw: Claude follows instructions probabilistically. "Never call delete_record" is followed 99%+ of the time — but a production compliance requirement must be met 100% of the time. The 1% failure rate represents real deleted records, real data loss, real compliance violations.

Additionally:
- Prompt injection attacks can override system prompt instructions
- Edge cases and unusual inputs can cause Claude to misinterpret instructions
- Model updates can change compliance with instructions
- Adversarial users can craft inputs that cause the instruction to be ignored

The hook is deterministic code: `if ctx.tool_name == "delete_record": return BLOCK`. No Claude reasoning involved. No probabilistic failure. 100% enforcement.

**In practice:** Use both. The system prompt sets Claude's understanding ("don't call delete_record — it's irreversible"). The hook enforces it regardless of Claude's understanding.

---

**Q2 — Claude finds an indirect path after hook blocks direct path**

This is not a hook failure — it's a scope limitation. The hook blocked the specific tool. Claude's reasoning about how to achieve the goal using other tools is Claude doing its job.

**Whether this is a problem depends on the rule:**

If the rule is "protect against accidental deletion": Claude finding an indirect deletion path via another tool means your hook coverage is incomplete. The hook should also cover the indirect tools.

If the rule is "this specific tool is too expensive": Claude using a cheaper alternative is exactly what you wanted.

**Addressing indirect paths for critical rules:**

```python
# Instead of blocking one tool, define forbidden outcomes
def outcome_guard_hook(ctx: HookContext) -> HookResult:
    # Block any tool that could modify or delete records
    RECORD_MODIFYING_TOOLS = {
        "delete_record", "bulk_delete", "archive_records", 
        "update_record", "overwrite_data"
    }
    
    if ctx.tool_name in RECORD_MODIFYING_TOOLS:
        return HookResult(decision=HookDecision.ESCALATE, ...)
```

For compliance rules, enumerate all tools that could violate the rule — not just the obvious one.

---

**Q3 — Same hook for different session types**

The $1.00 limit doesn't work for both scenarios. The design is: **configurable hooks with session-type-aware limits.**

```python
SESSION_COST_LIMITS = {
    "standard_user": 1.00,
    "premium_user": 5.00,
    "batch_processing": 10.00,
    "enterprise": 50.00
}

class AdaptiveCostHook:
    def __call__(self, ctx: HookContext) -> HookResult:
        session_type = ctx.metadata.get("session_type", "standard_user")
        limit = SESSION_COST_LIMITS.get(session_type, 1.00)
        
        current_spend = get_session_spend(ctx.session_id)
        estimated = estimate_cost(ctx.tool_name, ctx.tool_input)
        
        if current_spend + estimated > limit:
            return HookResult(
                decision=HookDecision.BLOCK if session_type != "enterprise" 
                         else HookDecision.ESCALATE,
                reason=f"Cost limit ${limit} for session type '{session_type}' reached"
            )
        
        return HookResult(decision=HookDecision.ALLOW)
```

The hook design principle: hooks should be parameterised, not hardcoded. Different contexts need different limits.

---

**Q4 — Database reads in multiple hooks**

**Problem:** 8 hooks each hitting the database = 8 database queries per tool call. At 100 tool calls/day, that's 800 database queries just for hook processing.

**Fix — pre-load shared context before running the chain:**

```python
@dataclass
class HookContext:
    # ... existing fields ...
    shared_state: dict = None  # Pre-loaded before hooks run

def run_agent_with_hooks(task, tools, executor, hook_registry):
    for iteration in range(10):
        # ...
        for tool_use in tool_uses:
            
            # Pre-load all shared data ONCE
            shared_state = {
                "session_total_cost": db.get_session_cost(session_id),
                "user_permissions": db.get_permissions(user_id),
                "rate_limit_count": cache.get_rate_count(session_id)
            }
            
            ctx = HookContext(
                tool_name=tool_use.name,
                tool_input=tool_use.input,
                shared_state=shared_state,
                # ... other fields
            )
            
            # Hooks read from ctx.shared_state — zero DB queries
            hook_result = hook_registry.run_pre_tool_hooks(ctx)
```

Each hook reads from `ctx.shared_state` (in-memory dict). One database query per tool call regardless of how many hooks run.

---

**Q5 — Pre-output redaction insufficient**

**Pre-output redaction is necessary but not sufficient.**

The SSN is in the messages array because it appeared in a tool result. Claude read it, processed it, and potentially incorporated it into its reasoning. Stripping it from the output protects the user from seeing it — but:

1. **It's already in your logs:** The tool result (with SSN) was logged when it arrived.
2. **It's in the messages array:** If this messages array is stored for conversation history, the SSN is in your database.
3. **Claude processed it:** Claude's internal reasoning incorporated the SSN — you can't un-ring that bell.

**What you must also do:**

```python
# 1. Strip PII before it enters the messages array (not just at output)
def sanitise_tool_result(result: dict) -> dict:
    return {k: "[REDACTED]" if is_pii_field(k) else v 
            for k, v in result.items()}

# In your loop:
result = executor(tool_use.name, tool_use.input)
result = sanitise_tool_result(result)  # Strip BEFORE adding to messages
tool_results.append({"content": json.dumps(result), ...})

# 2. Don't log raw tool results (log sanitised versions)
# 3. Don't store messages arrays with PII in conversation history
# 4. Implement data minimisation at the tool level (don't return SSN at all)
```

The correct design: PII should be stripped at the tool output level, before it enters any agent's context. Pre-output redaction is a last-resort backstop, not the primary protection.

---

**Q6 — Long-wait escalation**

Don't block the session waiting for human response. Use async escalation with session checkpoint/resume.

```python
class AsyncEscalationHandler:
    
    async def escalate(self, ctx: HookContext, reason: str) -> None:
        escalation_id = str(uuid.uuid4())
        
        # Save full session state
        await self.store_session_checkpoint(
            session_id=ctx.session_id,
            messages=current_messages,
            pending_tool=ctx.tool_name,
            pending_input=ctx.tool_input,
            escalation_id=escalation_id
        )
        
        # Notify human via multiple channels
        await notify_human(
            channels=["slack", "email", "pagerduty"],
            escalation_id=escalation_id,
            action_needed=f"Approve or deny: {ctx.tool_name}",
            context=ctx.tool_input,
            urgency=self.calculate_urgency(ctx)
        )
        
        # Return immediate response to user
        return "This action requires review. You'll be notified when approved (est. X hours)."
    
    async def handle_approval(self, escalation_id: str, approved: bool):
        """Called by human when they approve/deny."""
        checkpoint = await self.load_checkpoint(escalation_id)
        
        if approved:
            # Resume agent loop from checkpoint
            result = execute_tool(checkpoint.pending_tool, checkpoint.pending_input)
            await self.resume_agent_loop(checkpoint, result)
        else:
            # Resume with rejection — let Claude handle it
            await self.resume_agent_loop(
                checkpoint,
                {"error": "escalation_denied", "reason": "Human reviewer denied this action"}
            )
```

The session doesn't hang — it suspends. The user gets an immediate response. When the human approves/denies (hours later), the loop resumes from where it left off.

---

**Q7 — Contract analyser exceeds cost hook**

**Solution: Role-based hook configuration with explicit overrides.**

```python
class ContractAnalysisOverrideHook:
    """Allows expensive but legitimate operations for specific agent roles."""
    
    ROLE_COST_LIMITS = {
        "standard": 0.50,
        "contract_analyser": 2.00,    # Higher limit for document processing
        "batch_processor": 5.00,
        "admin": float("inf")
    }
    
    TOOL_COST_OVERRIDES = {
        # These tools have higher per-call limits
        "analyse_large_document": 2.00,
        "process_contract": 2.00,
        "ocr_500_pages": 3.00
    }
    
    def __call__(self, ctx: HookContext) -> HookResult:
        agent_role = ctx.metadata.get("agent_role", "standard")
        session_limit = self.ROLE_COST_LIMITS[agent_role]
        
        # Tool-specific override
        tool_override = self.TOOL_COST_OVERRIDES.get(ctx.tool_name)
        if tool_override:
            cost = estimate_cost(ctx.tool_name, ctx.tool_input)
            if cost <= tool_override:
                return HookResult(decision=HookDecision.ALLOW)  # Override allows it
        
        # Normal session limit check
        current = get_session_spend(ctx.session_id)
        estimated = estimate_cost(ctx.tool_name, ctx.tool_input)
        
        if current + estimated > session_limit:
            return HookResult(decision=HookDecision.ESCALATE,
                            reason=f"Cost ${current + estimated:.2f} exceeds role limit ${session_limit}")
        
        return HookResult(decision=HookDecision.ALLOW)
```

The hook is not bypassed — it's configured to allow legitimate expensive operations while still catching runaway costs. The override is explicit and auditable.

---

**Q8 — Deployment agent hook architecture**

```python
DEPLOYMENT_HOOKS = {
    "check_deployment_status": {
        "hooks": ["rate_limit", "permission"],
        "rate_limit": "100/hour",
        "permission": "any_authenticated_agent",
        "decision_on_block": "BLOCK — return error to Claude"
    },
    
    "run_tests": {
        "hooks": ["rate_limit", "permission", "resource_limit"],
        "rate_limit": "20/hour (tests are expensive)",
        "permission": "ci_agent only",
        "resource_limit": "Block if test suite > 10,000 tests (protect infrastructure)",
        "decision_on_block": "BLOCK — return error to Claude"
    },
    
    "analyse_logs": {
        "hooks": ["rate_limit", "permission", "pii_check"],
        "rate_limit": "50/hour",
        "permission": "any authenticated agent",
        "pii_check": "Strip any user data from logs before returning to Claude",
        "decision_on_block": "MODIFY — redact and continue"
    },
    
    "trigger_deployment": {
        "hooks": ["permission", "environment_guard", "test_status_guard", "cost_guard"],
        "permission": "deploy_agent only — not research or support agents",
        "environment_guard": "BLOCK production deployments outside 9am-5pm UTC",
        "test_status_guard": "BLOCK if last test run has failures (read from CI system)",
        "cost_guard": "ESCALATE if deploying to >3 environments simultaneously",
        "decision_on_block": "ESCALATE to on-call engineer — wait for approval"
    },
    
    "rollback_deployment": {
        "hooks": ["permission", "dangerous_action", "confirmation_required"],
        "permission": "deploy_agent or incident_agent",
        "dangerous_action": "ALWAYS escalate — rollback causes downtime",
        "confirmation_required": "Require explicit approval from 2 engineers",
        "escalation_path": "Slack #incidents → PagerDuty → On-call manager",
        "max_wait_time": "5 minutes before auto-rejection (for time-sensitive incidents)"
    },
    
    "notify_teams": {
        "hooks": ["rate_limit", "content_check"],
        "rate_limit": "10 notifications per hour (prevent spam)",
        "content_check": "Block notifications containing passwords, keys, or credentials",
        "decision_on_block": "MODIFY — strip sensitive content, then send"
    }
}
```

**Escalation path summary:**

Read operations: BLOCK → error to Claude → Claude adapts
Write operations: ESCALATE → Slack notification → 5-minute human window → auto-deny if no response
Dangerous operations: ALWAYS ESCALATE → PagerDuty → requires 2 approvals → audit log entry

---

## Status

- [ ] HookRegistry and HookContext implemented
- [ ] All 6 essential hooks implemented
- [ ] Hooks integrated into agent loop
- [ ] Dangerous action hook tested
- [ ] Audit log hook added
- [ ] All 8 questions answered
- [ ] Answer guide reviewed

---

## Coming Up — Week 8, Day 5

**Topic:** Build a Hub-and-Spoke System
Complete integration of everything in Week 8: coordinator, subagents, context isolation, and lifecycle hooks — all in one production-quality multi-agent build.

---

*CCA Self-Study Log · Asif · Phase 3 of 5 · Week 8 of 12*
