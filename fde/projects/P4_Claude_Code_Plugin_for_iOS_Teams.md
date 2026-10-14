---
layout: default
title: P4 Claude Code Plugin for iOS Teams
---

# P4 — Claude Code Plugin for iOS Teams

**Phase:** 4 (start earlier if time) · **Hits:** Claude Code (CCAR-F 20%), skills, hooks, subagents, CI · **Status:** [ ] not started

## Problem

Package a team's iOS conventions and guardrails so every engineer's Claude Code behaves consistently, and CI reviews PRs the same way. This is what FDEs deliver: **"house rules + tools + guardrails" as one installable unit**. Mirrors exam scenarios 2, 4, 5.

## Contents

```
ios-team-plugin/
├── .claude-plugin/plugin.json
├── skills/
│   ├── new-feature/SKILL.md        # scaffold SwiftUI feature (View, ViewModel, tests)
│   ├── swiftui-review/SKILL.md     # review checklist (state, accessibility, retain cycles)
│   └── release-notes/SKILL.md
├── agents/
│   ├── code-reviewer.md            # read-only tools
│   └── test-writer.md
├── hooks/hooks.json                # PreToolUse blocks force-push, .env reads; PostToolUse runs swiftformat
├── .mcp.json                       # P1 server
└── README.md
```

## Requirements

| Area | Requirement |
|---|---|
| Skills | Descriptions precise enough for correct auto-invocation; supporting files for long checklists |
| Subagents | Least-privilege tools; cheaper model for read-heavy review |
| Hooks | Deterministic blocks (exit 2 + clear stderr reason); tests for each hook script |
| CI | GitHub Action running `claude --bare -p ... --output-format json --json-schema ...`; findings posted as inline comments; build fails only on `blocking` severity |
| Cost | `--max-turns` / budget caps; log `total_cost_usd` per PR |
| Security | Untrusted fork PRs: `--bare`, no secrets, read-only tools, `dontAsk` |
| Optional | A small Go CLI that validates plugin structure in CI |

## Build Plan

1. Skills and subagents on a real or sample iOS repo.
2. Hooks + tests.
3. Package as plugin; install via `--plugin-dir`, then a private marketplace.
4. CI workflow and precision eval on 30 labeled PR diffs (precision of findings, false-positive rate).
5. README with architecture, threat model, measured results.

## Deliverables Checklist

- [ ] Plugin repo with install instructions
- [ ] CI workflow + sample PR with comments
- [ ] Precision/false-positive table
- [ ] Hook test suite
- [ ] Write-up: "Shipping Claude Code guardrails to an iOS team"

## Retrospective (fill after)

What the team actually used · what noise remained · what I'd change.
