---
layout: default
title: CCA Self-Study — Week 11, Day 2
---

# CCA Self-Study — Week 11, Day 2
## Exam Scenario 2: Code Generation with Claude Code

**Date completed:** _____________
**Study time:** 60 mins
**Curriculum phase:** Phase 5 — Exam Preparation
**Exam domain:** Domain 3 · Claude Code + Domain 4 · Prompt Engineering
**Last verified:** 2026-10

---

## Scenario Overview

**System:** A development team uses Claude Code to accelerate iOS feature development. They have CLAUDE.md configured, custom slash commands, and a CI/CD pipeline that uses Claude Code for automated code review.

**Stack:**
- Claude Code CLI (latest)
- Project CLAUDE.md with Swift/SwiftUI standards
- `.claude/commands/` with `/review`, `/test`, `/scaffold` commands
- GitHub Actions CI pipeline with Claude Code review gate

---

## 10 Exam-Style Questions

---

**Question 1.**
A new developer clones the repo and runs `claude`. They expect the team's `/review` command, which exists at `.claude/commands/review.md` on a teammate's machine, but it is not available. What is the most likely cause?

A) The `.claude/` directory was never committed (or is gitignored), so the clone does not contain the command file
B) Their global `~/.claude/CLAUDE.md` overrides project commands
C) The command file must use a `.txt` extension
D) Commands must first be installed as a Claude Code plugin

> **Your answer:**
> _(write here)_

---

**Question 2.**
The team's CLAUDE.md says "Never use force unwraps (!)." Asked to fix a crash, Claude Code introduces 2 force unwraps because it is the fastest fix. What mechanism correctly prevents this?

A) Rely on CLAUDE.md: Claude reads the rule, so it will comply
B) Rely on the developer manually reviewing every change
C) Both: CLAUDE.md to reduce how often it happens, plus a deterministic check (CI scan or hook) to catch what slips through
D) Write a longer CLAUDE.md with more examples and nothing else

> **Your answer:**
> _(write here)_

---

**Question 3.**
Your CI runs Claude Code review on every PR and takes 45 seconds on average. Most of the time goes to files unchanged since the last review. What is the correct fix?

A) Review only the diff (changed files), not the whole codebase
B) Increase the CI runner's CPU allocation
C) Run reviews in parallel on more GitHub Actions runners
D) Switch every CI review to Haiku

> **Your answer:**
> _(write here)_

---

**Question 4.**
A `/scaffold PaymentFlow` command creates View, ViewModel and Test files, but the ViewModel lacks the team's required `@Published` pattern. The command file is 200 lines. What is the most efficient fix?

A) Add one concrete example of a correct ViewModel near the top of the command (or in a skill supporting file)
B) Stop using Claude for scaffolding and use a static template only
C) Add three more paragraphs of detailed rules to the 200-line file
D) Create a separate `/scaffold-viewmodel` command and keep the old one

> **Your answer:**
> _(write here)_

---

**Question 5.**
In CI you run `claude -p` and it stops to ask permission before writing files. Which approach is correct for unattended runs?

A) Set a `CLAUDE_AUTO_APPROVE=true` environment variable
B) Pre-approve what the job needs with `--allowedTools` or `permissions.allow` rules (and/or `--permission-mode acceptEdits`)
C) Add a `--force` flag to the command
D) Run Claude Code as root in the CI container

> **Your answer:**
> _(write here)_

---

**Question 6.**
Your `/review` command prints a detailed human-readable review. In CI you must fail the build on critical issues, but the free text is hard to parse. What is the best fix?

A) Make `/review` always print JSON for everyone
B) In CI, run `claude -p --output-format json --json-schema '<schema>'` and read `structured_output`; keep `/review` human-readable
C) Extract critical issues from the free text with regex
D) Add a `/review-json` command that asks Claude to print JSON and `json.loads` the text

> **Your answer:**
> _(write here)_

---

**Question 7.**
A CLAUDE.md rule says "run `swift test` after every code change." Asked to rename conventions across 40 files, Claude Code edits all 40 and then runs `swift test` once (4 minutes). Is this right?

A) No: renames never need tests
B) No: it should run tests after each of the 40 file edits
C) No: the rule must be reworded to "after every file"
D) Yes: running tests once after the related set of changes is complete is reasonable behavior

> **Your answer:**
> _(write here)_

---

**Question 8.**
The CI review gate, which uses Claude Code to find security vulnerabilities, missed a SQL injection that caused a production incident. What should you add?

A) Increase the review timeout
B) Upgrade the review model and call it done
C) A dedicated SAST tool (such as Semgrep or CodeQL) alongside Claude's review
D) Add more security patterns to CLAUDE.md and nothing else

> **Your answer:**
> _(write here)_

---

**Question 9.**
A developer's global `~/.claude/CLAUDE.md` says "prefer verbose explanations." The project CLAUDE.md says "be concise." Which instruction wins in this project, and why?

A) Whichever file was modified most recently
B) The global file, because personal preferences take precedence
C) Both are merged, so Claude tries to be verbose and concise at once
D) The project CLAUDE.md: both files load, and the more specific project instruction takes precedence on conflict (still advisory)

> **Your answer:**
> _(write here)_

---

**Question 10.**
Every PR must have a Claude Code review, a human review and passing tests before merge. Branch protection already enforces tests and human review. How do you enforce the Claude Code review?

A) Add a bot that comments reminders on every PR
B) A CI job that fails on critical findings, configured as a required status check in branch protection
C) Document in the team wiki that developers must run `/review` first
D) Add a PR template checkbox confirming they ran it

> **Your answer:**
> _(write here)_

---

## Full Answer Guide

---

**Q1 Answer: A**

Project commands (and skills) are plain files discovered from the repository. If the clone lacks the file, check `git ls-files .claude` and `.gitignore`. Plugins are an optional way to bundle and share commands, skills, agents and hooks, not a prerequisite. Command files are Markdown (`.md`), and a global CLAUDE.md adds guidance; it does not hide project commands. Note: `.claude/skills/<name>/SKILL.md` is the newer format and behaves the same way.

---

**Q2 Answer: C**

Defense in depth. CLAUDE.md is advisory context: it lowers the probability of violations but cannot guarantee zero. A deterministic scan for `!` patterns (a CI step or a `PostToolUse`/pre-commit style check) catches the rest. Manual-only review defeats the automation; more prompt text is still probabilistic.

---

**Q3 Answer: A**

The problem is stated: time is spent on unchanged files. Remove that work by scoping input to `git diff` (pipe the diff in, or pass only changed paths). A smaller model still reads everything, parallel runners add cost without reducing work, and CPU does not affect API-bound time. Scope the input before optimizing the processor.

---

**Q4 Answer: A**

One concrete example beats pages of abstract rules because the model pattern-matches to examples more reliably than it interprets prose. Show a correct ViewModel (`@Published var isLoading`, `items`, `errorMessage`, an async load function). Piling on rules lengthens the file without fixing the miss, and splitting commands treats the symptom.

---

**Q5 Answer: B**

Permissions are configured with allow rules (`--allowedTools "Read,Edit,Bash(git diff *)"` or `permissions.allow` in `.claude/settings.json`) and permission modes: `acceptEdits` auto-approves file edits, and `dontAsk` denies anything that would prompt, which suits locked-down CI. `--force` and `CLAUDE_AUTO_APPROVE` are not real controls, and running as root is a security anti-pattern unrelated to prompts.

---

**Q6 Answer: B**

The CLI can return a schema-validated object (`structured_output`), and the pipeline decides the exit status from that data. Regex on free text breaks when phrasing changes. Forcing JSON on `/review` degrades the human experience. Asking for JSON in a prompt is better than regex, but without schema enforcement it still fails occasionally. Design separately for human and machine consumers.

---

**Q7 Answer: D**

Intermediate states of a multi-file rename may not even compile, so 40 separate runs would be slow and noisy. CLAUDE.md is guidance, interpreted at task granularity. If the exact timing must be guaranteed (say, tests must run before the turn ends), enforce it deterministically with a hook (for example `Stop`) rather than prose. Renames can break call sites, so skipping tests is wrong.

---

**Q8 Answer: C**

LLM review is valuable for logic, design and context but is probabilistic. Purpose-built scanners are deterministic for known vulnerability classes. Use both: SAST for pattern detection, Claude for broader reasoning. A bigger model, longer prompts or a longer timeout do not give a guarantee.

---

**Q9 Answer: D**

CLAUDE.md files from several levels are loaded into context, and more specific locations take precedence over broader ones when they conflict. That lets a team set project standards over individual preferences. Recency of modification is irrelevant. Remember it is still guidance, not enforcement.

---

**Q10 Answer: B**

Only technical enforcement is enforcement: a CI job whose failure blocks the merge via required status checks. Wikis, checkboxes and reminders rely on voluntary compliance.

---

## Exam Prep Notes

Write the 3 key principles this scenario tests:

> _(write here)_

---

## Status

- [ ] All 10 questions attempted before reading answers
- [ ] Answers reviewed
- [ ] Failure modes noted
- [ ] Key principles written
- [ ] Scenario described from memory

---

## Coming Up — Week 11, Day 3

**Topic:** Exam Scenario 3 — Multi-Agent Research System
Hub-and-spoke, context isolation, and lifecycle hooks applied to a production research pipeline.

---

*CCA Self-Study Log · Asif · Phase 5 of 5 · Week 11 of 12*
