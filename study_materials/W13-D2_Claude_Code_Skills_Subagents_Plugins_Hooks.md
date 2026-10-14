---
layout: default
title: CCA Self-Study — Week 13, Day 2
---

# CCA Self-Study — Week 13, Day 2
## Claude Code 2026: Skills, Subagents, Plugins, Hooks, Headless

**Date completed:** _____________
**Study time:** 60 mins
**Curriculum phase:** Phase 6 — 2026 Platform Update
**Exam domain:** Domain 3 · Claude Code Configuration & Workflows (20%) · CCDV-F: Claude Code (3.1%)
**Last verified:** 2026-10

---

## Core Concept

Week 9 covered CLAUDE.md and `.claude/commands/`. Claude Code now has five extension points. Know which one answers which need.

| Need | Mechanism | Deterministic? |
|---|---|---|
| Always-on project guidance | `CLAUDE.md` | No (advisory context) |
| Task playbook loaded when relevant | **Skill** (`SKILL.md`) | No |
| Isolated worker, own context | **Subagent** (`.claude/agents/*.md`) | No |
| *Guarantee* something happens / is blocked | **Hook** | **Yes** |
| Bundle and share all of the above | **Plugin** | n/a |

**Exam heuristic:** "must always / must never" → hook (or permission rule). "usually should" → CLAUDE.md or skill.

---

## 1. Skills

A skill is a directory with `SKILL.md`: YAML frontmatter + Markdown instructions.

```yaml
---
description: Summarizes uncommitted changes and flags risks. Use when the user asks what changed or wants a commit message.
allowed-tools: Bash(git diff *)
---

## Current changes

!`git diff HEAD`

Summarize the changes above in two or three bullets, then list risks.
```

| Field | Purpose |
|---|---|
| `description` / `when_to_use` | How Claude decides to load it (listing truncated at 1,536 chars) |
| `disable-model-invocation: true` | Only the user can invoke |
| `user-invocable: false` | Only Claude can invoke |
| `allowed-tools` | Pre-approved tools during the skill's turn (does not restrict others) |
| `context: fork` + `agent` | Run in a subagent with fresh context |
| `model`, `effort`, `hooks`, `paths` | Overrides / path-based activation |

**Locations (higher wins):** enterprise (managed) › personal `~/.claude/skills/<name>/` › project `.claude/skills/<name>/`. Plugin skills are namespaced `/plugin-name:skill-name`.

**Progressive disclosure:** only name + description sit in context. Full body loads on invocation; supporting files (`reference.md`) load only when read. Keep `SKILL.md` under ~500 lines.

**Commands vs skills:** `.claude/commands/deploy.md` and `.claude/skills/deploy/SKILL.md` both give `/deploy`. Commands still work; skills add supporting files, auto-loading, invocation control. Same name → skill wins.

---

## 2. Subagents

Markdown file with frontmatter; body = system prompt. Only `name` and `description` required.

```markdown
---
name: code-reviewer
description: Reviews code for quality and best practices. Use proactively after code changes.
tools: Read, Glob, Grep
model: sonnet
---

You are a code reviewer. Analyze the code and give specific, actionable feedback.
```

- **Own context window.** Does not see your conversation or files already read. Only its final summary returns. This is Week 8's *context isolation* as a product feature.
- `tools` allowlist (or `disallowedTools`), `model`, `permissionMode`, `maxTurns`, `skills` (preload), scoped `mcpServers`/`hooks`.
- Scope priority: managed › `--agents` flag › `.claude/agents/` › `~/.claude/agents/` › plugin.
- Built-ins: **Explore** (read-only search), **Plan** (read-only research in plan mode), **general-purpose**.
- Can nest (default up to 3 layers); omit `Agent` from `tools` to stop spawning. Up to 20 run concurrently by default.
- Cost lever: route cheap/read-heavy work to a smaller `model`.

---

## 3. Hooks

User-defined handlers on lifecycle events. Configure in `settings.json` (user `~/.claude/settings.json`, project `.claude/settings.json`, local `.claude/settings.local.json`, managed, plugin `hooks/hooks.json`, or skill/subagent frontmatter).

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          { "type": "command", "if": "Bash(rm *)", "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/block-rm.sh" }
        ]
      }
    ]
  }
}
```

**Key events:** `SessionStart`, `UserPromptSubmit`, `PreToolUse` (can block), `PermissionRequest`, `PostToolUse`, `PostToolUseFailure`, `Stop`, `SubagentStart/Stop`, `PreCompact/PostCompact`, `SessionEnd` (and more: `Notification`, `InstructionsLoaded`, `ConfigChange`, `WorktreeCreate`…).

**Matchers:** `"*"`/empty = all; letters and `|` = exact names (`Edit|Write`); anything else = regex. MCP tools are `mcp__<server>__<tool>`. `if` filters on tool+args using permission-rule syntax.

**Input:** JSON on stdin (`session_id`, `cwd`, `hook_event_name`, `tool_name`, `tool_input`, …).

**Exit codes:** `0` = success (stdout parsed as JSON if a single object) · **`2` = blocking error** (stderr becomes the reason; on `PreToolUse` the call is blocked) · other = non-blocking error. Do not mix exit codes and JSON in one hook.

**JSON control (exit 0):**

```json
{ "hookSpecificOutput": { "hookEventName": "PreToolUse",
  "permissionDecision": "deny",
  "permissionDecisionReason": "Database writes are not allowed" } }
```

`permissionDecision`: `allow` | `deny` | `ask` | `defer`; `updatedInput` can rewrite arguments.

**Handler types:** `command`, `http`, `mcp_tool`, `prompt` (single-turn model decision), `agent` (experimental, can use tools).

**Trap:** `PostToolUse` cannot undo a tool that already ran. Block in `PreToolUse`.

---

## 4. Plugins

A plugin = one directory installed as a unit: manifest `.claude-plugin/plugin.json`, plus `skills/`, `agents/`, `hooks/hooks.json`, `.mcp.json`. Distributed via a **marketplace** (`.claude-plugin/marketplace.json` catalog). Scopes: user, project (committed `.claude/settings.json`), local. Test locally with `--plugin-dir`.

**Cost note:** for every model-invocable skill/agent in an enabled plugin, name+description is in context every turn. Plugins are not free. Plugins run code as you: review before installing.

FDE angle: a plugin is how you ship a customer's "house rules + tools + guardrails" bundle.

---

## 5. Headless and CI

```bash
claude -p "Find and fix the bug in auth.py" --allowedTools "Read,Edit,Bash"
claude --bare -p "Summarize README.md" --allowedTools "Read"          # CI: skip hooks/skills/MCP/CLAUDE.md discovery
claude -p "Extract function names from auth.py" --output-format json \
  --json-schema '{"type":"object","properties":{"functions":{"type":"array","items":{"type":"string"}}},"required":["functions"]}'
```

| Flag | Use |
|---|---|
| `-p` / `--print` | Non-interactive |
| `--output-format text\|json\|stream-json` | `json` includes `result`, `session_id`, `total_cost_usd`; with `--json-schema` the validated object is in `structured_output` |
| `--allowedTools` | Pre-approve tools; `Bash(git diff *)` prefix rules (space before `*` matters) |
| `--permission-mode` | `acceptEdits`, `auto`, `dontAsk` (deny anything that would prompt: good for locked-down CI) |
| `--permission-prompts none` | Unattended runs: nothing waits on a human |
| `--bare` | Reproducible CI; recommended for scripted calls, ignores teammate's `~/.claude` |
| `--append-system-prompt` | Add instructions, keep defaults |
| `--continue` / `--resume <id>` | Multi-step flows |

Exit code 0 on success, non-zero on failure. Without `--bare`, a `-p` run executes the repo's hooks and MCP servers even in an untrusted folder: security consideration for reviewing untrusted PRs.

GitHub Actions and GitLab CI integrations wrap the same loop.

---

## Exam Traps

| Trap | Reality |
|---|---|
| Put a "never touch prod" rule in CLAUDE.md | Advisory only. Use `PreToolUse` hook or a deny permission rule |
| `PostToolUse` to block a command | Too late: tool already ran |
| Skill body always in context | Only description is; body loads on use |
| Subagent inherits conversation | It does not: self-contained delegation prompt |
| `allowed-tools` in a skill restricts other tools | It only pre-approves; use `disallowed-tools` to remove |
| CI parsing free text from `claude -p` | Use `--output-format json` + `--json-schema` |

---

## Hands-On Task 🛠️

1. Create `.claude/skills/commit-msg/SKILL.md` (use the example) and invoke it both ways.
2. Create `.claude/agents/code-reviewer.md`; ask Claude to review a diff and watch which context it receives.
3. Write a `PreToolUse` hook script that exits `2` when a Bash command contains `git push --force`; confirm Claude is blocked and sees the reason.
4. Run `claude --bare -p ... --output-format json --json-schema ...` and pipe through `jq .structured_output`.

## Q&A — Self-Assessment

**Q1.** Compliance requires that `.env` is never read. Which mechanism?
**Q2.** What does a subagent's parent receive back?
**Q3.** Why use `--bare` in CI?
**Q4.** Skill vs subagent: when does `context: fork` blur them?

<details><summary>Answers</summary>

1. Deny permission rule and/or `PreToolUse` hook on `Read` matching `.env` (exit 2). CLAUDE.md alone is not a guarantee.
2. Only its final summary.
3. Same result on every machine: skips hooks, skills, MCP, plugins, auto memory, CLAUDE.md from the host.
4. `context: fork` runs the skill body as the prompt of a fresh subagent (type via `agent`), isolated from conversation history.
</details>

## Status

- [ ] Skill, subagent, hook each built once
- [ ] Headless JSON run done
- [ ] Q&A done

*CCA Self-Study Log · Asif · Phase 6 · Week 13*
