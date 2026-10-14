---
layout: default
title: CCA Self-Study — Week 13, Day 4
---

# CCA Self-Study — Week 13, Day 4
## Managed Agents (Beta)

**Date completed:** _____________
**Study time:** 45–60 mins
**Curriculum phase:** Phase 6 — 2026 Platform Update
**Exam domain:** Domain 1 · Agentic Architecture & Orchestration (27%) · CCDV-F: Agents & Workflows (14.7%)
**Last verified:** 2026-10

---

## Core Concept

**Managed Agents** = Anthropic runs the agent loop *and* hosts the per-session container where tools execute (bash, files, code). You define a persisted, **versioned Agent**, then start **Sessions** against it and consume an event stream.

This is the only option supplying harness **and** deployment ([W13-D1](./W13-D1_Agent_SDK_and_Four_Ways_to_Build_Agents.md)).

```
Agent (once, versioned)  ──►  Session (every run)  ──►  event stream (SSE)
  model, system, tools,         pins agent version,        agent.* events out,
  mcp_servers, skills           gets a container           user.* events in
```

**Mandatory flow:** `model`, `system`, `tools`, `mcp_servers`, `skills` live on the **agent**. A session takes only a pointer (`agent={"type":"agent","id":...,"version":...}`) plus `environment_id`.

**Why versioning:** change the prompt → new immutable version. Running sessions keep their pinned version, new ones get latest (or pin explicitly), rollback and A/B are trivial. Creating a fresh agent per request orphans agents and wastes latency.

---

## Minimal Shape (Python)

```python
import anthropic
client = anthropic.Anthropic()

# setup (once; or define as files and sync with `ant apply`)
environment = client.beta.environments.create(
    name="dev-env",
    config={"type": "cloud",
            "networking": {"type": "limited", "allow_package_managers": True, "allow_mcp_servers": True}},
)
agent = client.beta.agents.create(
    name="Coding Assistant",
    model="claude-opus-5-5",
    system="You are a senior code reviewer.",
    tools=[{
        "type": "agent_toolset_20260401",
        "default_config": {"enabled": True, "permission_policy": {"type": "auto"}},
        "configs": [{"name": "web_fetch", "enabled": False}, {"name": "web_search", "enabled": False}],
    }],
)

# every run
session = client.beta.sessions.create(
    agent={"type": "agent", "id": agent.id, "version": agent.version},
    environment_id=environment.id,
)
```

Beta header `managed-agents-2026-04-01` is set by the SDK. Memory stores use `agent-memory-2026-07-22` instead. Not available on Bedrock, Vertex, or Foundry.

---

## Feature Map (know what exists, and when to reach for it)

| Feature | What it does | Reach for it when |
|---|---|---|
| **Environments** | `cloud` container config, networking policy (`limited` + allowed hosts) | Always: sandbox boundary. Default to least network access |
| **Tools: agent toolset + custom** | Hosted bash/file/code tools; your own `custom` tools return results via events | Mix hosted breadth with your private APIs |
| **Permission policies** | `always_allow` / `always_ask` / `auto` per tool | Gate dangerous tools; `auto` lets the server evaluate, may pause |
| **Vaults** | Stored credentials (`mcp_oauth`, `static_bearer`, `environment_variable`), substituted at egress, never visible to the sandbox | Any secret. MCP `mcp_servers` carry no auth inline |
| **MCP servers** | Declared on agent as `{type, name, url}` | External systems |
| **Skills** | Loaded into the agent | Reusable procedures |
| **Outcomes** | `user.define_outcome` + rubric; a separate grader iterates until it passes | One checkable deliverable (report, PR, dataset) |
| **Multiagent** | Coordinator roster; child threads; `self` copies; cheaper worker agents | Fan-out research, reading-heavy subtasks |
| **Dynamic workflows** | Background workflow runs for work too big for a roster | Hundreds of documents/records |
| **Memory stores** | Persistent memory across sessions | Cross-session learning |
| **Scheduled deployments** | Cron-fired sessions with run records, pause/auto-pause | "Every night", weekly reports |
| **Session budgets** | Hard dollar cap per session (`budget_reached` pause) | Cost control (distinct from advisory task budgets) |
| **Webhooks** | Notify on state change | No polling |
| **Self-hosted sandbox** | Tool execution in your infra/VPC | Data-residency / network constraints |

## Client-Side Pitfalls (exam-adjacent, FDE-critical)

- **SSE stream has no replay.** If it drops while a tool call awaits your confirmation/result, the session deadlocks. On every (re)connect: open the stream, **fetch event list, dedupe by event id**, then proceed.
- **Stream first**, then send the message, so you never miss early events.
- A session `requires_action` accepts only settle events (confirmations / custom tool results). A `user.message` there is a 400.
- **Messages queue** while the session runs or is idle; processed in order.
- **Archive is permanent.** Never archive a production agent/environment as "cleanup".
- **Reconcile before first run**: every action in the task maps to a configured tool/MCP server, every MCP server has a vault credential, every referenced file/host is mounted/reachable. Missing resources make agents flail mid-run.
- Don't treat HTTP client read timeouts as wall-clock caps; track `time.monotonic()` yourself.

## Choosing: Managed Agents vs the rest

| Need | Choose |
|---|---|
| Run in my process, my compute, my custom tool runtime | Tool Runner / manual loop |
| Coding/file agent embedded in my app | Agent SDK |
| Anthropic-hosted loop + sandbox, long-running, versioned, scheduled | **Managed Agents** |
| One-shot extraction | Plain API |

Rule of thumb for FDE scoping: if the customer would otherwise need you to build a scheduler, a state store, a sandbox, and an event pipeline, Managed Agents is usually the least code you own.

---

## Exam Traps

| Trap | Reality |
|---|---|
| `sessions.create(model=..., system=...)` | Not allowed: those live on the agent |
| Call `agents.create()` at the top of each request | Create once; store id and version |
| Credentials in the agent's `mcp_servers` | Auth goes through vaults |
| Outcomes for a Q&A bot | Outcomes are for one deliverable; chat uses `user.message` |
| Session budget = task budget | Session budget: hard, dollar-denominated, enforced. Task budget: advisory token pacing for the model |

## Hands-On Task 🛠️

1. Create an environment + agent as above; start a session; stream events and print each `agent.*` event type.
2. Update the agent's system prompt; confirm the old session keeps its version while a new one gets the new version.
3. Add an outcome rubric (5 gradeable criteria) to a "write a 1-page summary" task.
4. Kill your stream mid-run and implement reconnect-with-consolidation.

## Q&A — Self-Assessment

**Q1.** Where does the system prompt belong?
**Q2.** Stream dropped while a tool confirmation is pending. What happens, and the fix?
**Q3.** How do secrets reach an MCP server?
**Q4.** Customer wants a nightly compliance report meeting a rubric. Features?

<details><summary>Answers</summary>

1. On the agent (versioned), not the session.
2. Deadlock (session idles awaiting you). Reconnect, list events, dedupe, resolve the pending confirmation.
3. Vault credential attached via `vault_ids`; Anthropic refreshes OAuth tokens.
4. Scheduled deployment + outcome with rubric (+ session budget, + vault for credentials).
</details>

## Status

- [ ] Agent → session flow run
- [ ] Reconnect pattern understood
- [ ] Q&A done

*CCA Self-Study Log · Asif · Phase 6 · Week 13*
