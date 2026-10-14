---
layout: default
title: P1 MCP Server for iOS Teams
---

# P1 — MCP Server for iOS Teams

**Phase:** 0–1 · **Hits:** Tools & MCP (CCAR-F 18%, CCDV-F 10.6%) · **Language:** Python · **Status:** [ ] not started

## Problem

iOS teams lose time hopping between Xcode build logs, crash reports, TestFlight feedback, and App Store Connect. Give Claude Code (or any MCP client) safe, typed access to those sources so it can answer "why did build 412 fail?" or "what are the top crashes in the latest release?"

## Scope (v1)

| Tool | Reads/Writes | Notes |
|---|---|---|
| `list_builds(app, limit)` | read | App Store Connect API |
| `get_build_log_summary(build_id)` | read | Parses `xcodebuild` output into errors/warnings; returns IDs + compact summary, not the full log |
| `top_crashes(app, version, limit)` | read | Group by signature, count, first/last seen |
| `get_crash_detail(crash_id)` | read | Symbolicated stack, trimmed |
| `testflight_feedback(app, since)` | read | Returns feedback items with PII redacted |

Out of scope: any write action (submitting builds, replying to reviews). Add later behind explicit approval.

## Design Rules (exam-aligned)

- One tool per action, clear descriptions with "use when / do not use when" (W5-D3, W6-D4).
- Results bounded and paginated; IDs + summaries first, detail on request (W5-D4).
- Errors returned as structured results with `retryable` flag.
- Credentials from environment/secret store; never in tool args or logs.
- Read-only by construction; tests assert no write endpoints are called.

## Build Plan

1. Skeleton with the Python MCP SDK; stdio transport; one tool end-to-end against a fixture.
2. Real App Store Connect auth (JWT) behind an interface; fixtures for tests.
3. Log parser with unit tests on 5 real (sanitized) failures.
4. Evals: 20 natural-language questions with expected tool calls (tool selection accuracy) and answers.
5. Package, README with architecture diagram, install snippet for Claude Code (`.mcp.json`).

## Deliverables Checklist

- [ ] Repo with tests (pytest) and CI
- [ ] README: problem, architecture diagram, security model
- [ ] Eval: tool-selection accuracy and answer correctness table
- [ ] Cost table (tokens per typical question)
- [ ] 2-minute demo recording
- [ ] Blog post: "What I learned designing an MCP server for iOS teams"

## Retrospective (fill after)

What worked · what I'd change · metrics.
