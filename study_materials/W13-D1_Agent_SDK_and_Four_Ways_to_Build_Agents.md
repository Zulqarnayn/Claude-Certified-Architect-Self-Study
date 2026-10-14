---
layout: default
title: CCA Self-Study — Week 13, Day 1
---

# CCA Self-Study — Week 13, Day 1
## Agent SDK and the Four Ways to Build an Agent

**Date completed:** _____________
**Study time:** 45–60 mins
**Curriculum phase:** Phase 6 — 2026 Platform Update
**Exam domain:** Domain 1 · Agentic Architecture & Orchestration (27%) · CCDV-F: Agents & Workflows (14.7%)
**Last verified:** 2026-10

---

## Core Concept

"Agent" now has four distinct build paths. The exam (and FDE customer calls) reward choosing the right one. Two questions separate them:

1. **Who supplies the harness** (the loop + context management)?
2. **Who supplies the deployment** (where it runs)?

| # | Approach | Harness | Deployment | Tools | Pick when |
|---|---|---|---|---|---|
| 1 | Messages API + **manual loop** | You | You | Only yours | You need total control, no beta dependency |
| 2 | Messages API + **Tool Runner** (`client.beta.messages.tool_runner`) | SDK | You | Only yours | Custom-tool agent, no hand-written loop |
| 3 | **Managed Agents** (beta) | Anthropic | Anthropic (per-session sandbox) | Hosted sandbox + MCP + Skills + yours | You want Anthropic to run loop and workspace → [W13-D4](./W13-D4_Managed_Agents.md) |
| 4 | **Claude Agent SDK** | Claude Code harness | You | Built-in Read/Edit/Bash/Glob/Grep/Web + MCP + subagents | Batteries-included coding/file agent on your infra |

**Trap:** Tool Runner ≠ Agent SDK. Tool Runner lives in the regular `anthropic` SDK and only loops over tools *you* define. Agent SDK is Claude Code packaged as a library, with built-in tools.

---

## Claude Agent SDK in 30 Lines

Install: `pip install claude-agent-sdk` or `npm install @anthropic-ai/claude-agent-sdk`. Both bundle a native Claude Code binary. Auth: `ANTHROPIC_API_KEY` in the environment (SDK does not load `.env` for you). Bedrock, Vertex, Foundry, Claude Platform on AWS supported via env flags.

```python
import asyncio
from claude_agent_sdk import query, ClaudeAgentOptions, AssistantMessage, ResultMessage

async def main():
    async for message in query(
        prompt="Review utils.py for bugs that would cause crashes. Fix any issues you find.",
        options=ClaudeAgentOptions(
            allowed_tools=["Read", "Edit", "Glob"],  # auto-approved tools
            permission_mode="acceptEdits",           # auto-approve file edits
        ),
    ):
        if isinstance(message, AssistantMessage):
            for block in message.content:
                if hasattr(block, "text"):
                    print(block.text)
                elif hasattr(block, "name"):
                    print(f"Tool: {block.name}")
        elif isinstance(message, ResultMessage):
            print(f"Done: {message.subtype}")

asyncio.run(main())
```

What `query()` gives you: the **same agent loop as Claude Code** (plan → tool call → observe → repeat) as an async stream of messages. You consume the stream; SDK handles orchestration, tool execution, context management, retries.

### Capabilities you inherit

| Capability | Why an architect cares |
|---|---|
| Built-in tools (Read, Edit, Bash, Glob, Grep, WebSearch, WebFetch) | No tool implementation, but a larger blast radius → permissions matter |
| Hooks | Deterministic guardrails at lifecycle points (see W8-D4, [W13-D2](./W13-D2_Claude_Code_Skills_Subagents_Plugins_Hooks.md)) |
| Subagents | Context isolation + parallel work (see W8-D1..D3) |
| MCP | External tools/data |
| Permissions | `allowed_tools` + `permission_mode` (`default`, `acceptEdits`, `auto`, `dontAsk`, `bypassPermissions`, `plan`) |
| Sessions | Resume / fork conversations |
| Skills, memory, plugins | Loaded from `.claude/` and `~/.claude/` like Claude Code |

**CLI equivalent:** any language can drive the same loop with `claude -p "..." --output-format json` (see W13-D2).

**Policy trap:** third-party products may not offer claude.ai login or its rate limits through the Agent SDK. Use API-key (or cloud provider) auth.

---

## Decision Guide (FDE-style)

| Customer says… | Choose |
|---|---|
| "We need classification / extraction in our pipeline" | Single Messages API call (+ structured outputs). No agent. |
| "Support bot calling our CRM and billing APIs, we host it" | Tool Runner (or manual loop if you need custom control flow) |
| "Agent that edits our repo / runs tests, in our CI" | Agent SDK or `claude -p` |
| "Long-running research agent, we don't want to run infra, needs sandbox + audit trail" | Managed Agents |
| "Runs nightly, produces one report" | Managed Agents scheduled deployment + outcome |

**Start simple.** Complexity ladder: single call → workflow (code-controlled steps) → agent. Only build an agent when the task is multi-step, hard to specify upfront, high enough value, Claude is capable, and errors are recoverable.

---

## Exam Traps

| Trap | Reality |
|---|---|
| "Tool Runner is the Agent SDK" | Different packages, different scope |
| "Managed Agents and Agent SDK both host your agent" | Agent SDK = you host. Managed Agents = Anthropic hosts loop + sandbox |
| "More autonomy = better" | Prefer least privilege: narrow `allowed_tools`, gate irreversible actions |
| "Use bash for everything" | Promote to a dedicated tool when you must gate, render, audit, or parallelize an action |

---

## Hands-On Task 🛠️

1. `uv add claude-agent-sdk`, create a `utils.py` with two bugs, run the script above.
2. Change `allowed_tools` to read-only (`Read`, `Grep`, `Glob`) and `permission_mode="plan"`. What changes?
3. Rebuild the same task with Tool Runner and one `@beta_tool` file reader. Compare code size, control, and cost (check `usage`).

## Q&A — Self-Assessment

**Q1.** Name the one approach among the four that supplies both harness and deployment.
**Q2.** Why is `Bash` a poor primitive for a "send customer email" action?
**Q3.** A client wants an agent in their VPC with no Anthropic-hosted compute. Which options remain?
**Q4.** When should you stay at "single call"?

<details><summary>Answers</summary>

1. Managed Agents.
2. Opaque command string: harness cannot gate, audit, or render it. A typed `send_email` tool can require confirmation.
3. Manual loop, Tool Runner, Agent SDK (all you-host). Managed Agents also supports self-hosted sandboxes for tool execution (see D4), but Anthropic still runs the loop.
4. Classification, extraction, summarization, Q&A: one request, one response, nothing to orchestrate.
</details>

## Status

- [ ] Agent SDK script ran
- [ ] Four-approaches table memorized
- [ ] Q&A done

*CCA Self-Study Log · Asif · Phase 6 · Week 13*
