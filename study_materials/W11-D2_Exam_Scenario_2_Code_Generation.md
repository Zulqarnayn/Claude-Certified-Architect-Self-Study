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
A new developer joins the team. They clone the repo and run `claude` in the project directory. They expect to see the team's custom `/review` slash command but it's not available. The command file exists at `.claude/commands/review.md`. What is the most likely cause?

A) The developer needs to install a Claude Code plugin
B) The command file has the wrong file extension — it should be `.txt`
C) The developer's global `~/.claude/CLAUDE.md` overrides project commands
D) The developer is running an older version of Claude Code that doesn't support the commands directory structure — they should update with `npm update -g @anthropic-ai/claude-code`

> **Your answer:**
> _(write here)_

---

**Question 2.**
The team's CLAUDE.md has a rule: "Never use force unwraps (!)." A developer asks Claude Code to fix a crash. Claude Code's fix introduces 2 force unwraps because it's the fastest solution to the crash. What architectural mechanism correctly prevents this?

A) The developer manually reviews Claude Code's changes before accepting
B) The CLAUDE.md rule is enforced — Claude Code reads this rule and should not produce force unwraps
C) A pre-output validation hook in the CI pipeline that scans for `!` in Swift code
D) Both B and C — CLAUDE.md reduces occurrence, CI validation catches any that slip through

> **Your answer:**
> _(write here)_

---

**Question 3.**
Your CI pipeline runs Claude Code review on every PR. The review step takes 45 seconds on average. Engineers complain about slow CI. The review covers 15 Swift files per PR on average, but 80% of the review time is spent on unchanged files that were already reviewed. What is the correct fix?

A) Switch to Claude Haiku for all CI reviews to reduce response time
B) Only pass changed files (from `git diff`) to Claude Code — not the entire codebase
C) Run Claude Code reviews in parallel using multiple GitHub Actions runners
D) Increase the CI runner's CPU allocation for faster processing

> **Your answer:**
> _(write here)_

---

**Question 4.**
A developer runs `/scaffold PaymentFlow` which should create View, ViewModel, and Test files. The command creates all three files but the ViewModel is missing the `@Published` properties pattern your team requires. The scaffold command is 200 lines long. What is the most efficient fix?

A) Add more detailed instructions to the 200-line command file
B) Add a concrete example of a correct ViewModel at the top of the command file
C) Create a separate `/scaffold-viewmodel` command that handles only ViewModels
D) Switch to a code template file instead of a Claude Code command

> **Your answer:**
> _(write here)_

---

**Question 5.**
You want Claude Code to run in `--no-interactive` mode in CI but it keeps asking for permission to write files. Which configuration correctly prevents interactive permission prompts in automated runs?

A) Add `--force` flag to the Claude Code command
B) Configure allowed write paths in `.claude/settings.json` before running in CI
C) Set `CLAUDE_AUTO_APPROVE=true` environment variable
D) Run Claude Code as root in the CI container

> **Your answer:**
> _(write here)_

---

**Question 6.**
Your `/review` command outputs a detailed human-readable review. In CI, you need to parse the review programmatically to fail the build if critical issues are found. The current free-text output is hard to parse. What is the best fix?

A) Use regex to extract critical issues from the free-text output
B) Create a separate `/review-json` command that outputs structured JSON, used only in CI
C) Modify `/review` to always output JSON — the human review can parse JSON
D) Both B and C are valid, but B is preferred to keep the human review readable

> **Your answer:**
> _(write here)_

---

**Question 7.**
A CLAUDE.md rule says "run `swift test` after every code change." A developer asks Claude Code to "refactor the naming conventions across 40 files." Claude Code makes 40 file changes and then runs `swift test`. The test run takes 4 minutes. Is this the right behaviour?

A) No — Claude Code should run tests after each individual file change
B) Yes — running tests once after all related changes is correct behaviour
C) No — the CLAUDE.md rule should specify "run tests after every file" to be more explicit
D) No — refactoring naming conventions shouldn't require running tests at all

> **Your answer:**
> _(write here)_

---

**Question 8.**
The team's CI review gate uses Claude Code to detect security vulnerabilities. After deployment, a SQL injection vulnerability that Claude Code missed causes a production incident. What should you add to your security review approach?

A) Upgrade from Haiku to Sonnet for the security review
B) Add a dedicated security-focused SAST tool (like Semgrep) alongside Claude Code — use Claude Code for logic/architecture review and SAST for security pattern detection
C) Add more security patterns to your CLAUDE.md file
D) Increase the Claude Code review timeout to allow more thorough analysis

> **Your answer:**
> _(write here)_

---

**Question 9.**
A developer has a global `~/.claude/CLAUDE.md` that says "prefer verbose explanations." The project CLAUDE.md says "be concise." When Claude Code is used in this project, which instruction wins and why?

A) Global CLAUDE.md wins — personal preferences take precedence
B) Project CLAUDE.md wins — more specific always overrides less specific
C) They are merged — Claude tries to be both verbose and concise
D) The most recently modified file wins

> **Your answer:**
> _(write here)_

---

**Question 10.**
Your team wants to standardise: every PR must have a Claude Code review, a human review, and passing tests before merge. Branch protection rules enforce tests and human review. How do you enforce Claude Code review as a required check?

A) Add a CI step that runs Claude Code and fails the job if critical issues are found — configure this as a required status check in GitHub branch protection settings
B) Add instructions to the team wiki that developers must run `/review` locally before opening a PR
C) Use a GitHub PR template that asks developers to confirm they ran Claude Code review
D) Set up a GitHub bot that comments on every PR reminding developers to run Claude Code

> **Your answer:**
> _(write here)_

---

## Full Answer Guide

---

**Q1 Answer: D**

The `.claude/commands/` directory structure support was added in newer versions of Claude Code. If the developer installed an older version and hasn't updated, the commands directory isn't recognised. The fix is `npm update -g @anthropic-ai/claude-code`.

The other options are wrong: command files use `.md` extension (B is backwards), global CLAUDE.md doesn't override project commands (C is wrong hierarchy), and there are no Claude Code plugins (A doesn't exist).

---

**Q2 Answer: D**

This is a defence-in-depth question. CLAUDE.md rules reduce probability (Claude reads and follows "no force unwraps" most of the time) but don't guarantee 100% compliance — Claude is probabilistic. A CI validation scan for `!` patterns in Swift code is deterministic and catches what slips through.

B alone is insufficient for a hard rule. A alone (manual review) defeats the purpose of automation. D is the architecturally sound answer: probabilistic reduction at the prompt level + deterministic enforcement at the code level.

---

**Q3 Answer: B**

The problem is clearly stated: 80% of time is spent on unchanged files. The fix must eliminate unchanged file review. B directly addresses this by scoping Claude Code to only `git diff` output — only changed files.

Haiku (A) speeds up processing but you still review all 15 files, not 3 changed ones. Parallel runners (C) add cost and complexity but don't reduce the work. CPU allocation (D) doesn't affect Claude API throughput.

The general principle: scope the input before optimising the processor.

---

**Q4 Answer: B**

One concrete example beats 200 lines of instructions. Claude pattern-matches to examples faster than it interprets abstract rules. Add a correct ViewModel example at the top of the command:

```markdown
Example correct ViewModel:
class ExampleViewModel: ObservableObject {
    @Published var isLoading = false
    @Published var items: [Item] = []
    @Published var errorMessage: String?
    
    func loadItems() async { ... }
}
```

Claude will generate ViewModels that match this pattern. 200 lines of rules saying "use @Published" is less reliable than one concrete example showing it.

---

**Q5 Answer: B**

Pre-configuring write permissions in `.claude/settings.json` is the correct CI solution. The `settings.json` file tells Claude Code which paths it's allowed to write to without prompting — this is the designed mechanism for automated runs.

There's no `--force` flag in Claude Code (A). `CLAUDE_AUTO_APPROVE` doesn't exist (C). Running as root (D) is a security anti-pattern and unrelated to the permission prompts.

---

**Q6 Answer: D**

B is the preferred approach. Modify `/review` to output human-readable text (for developers running locally), and create a separate `/review-json` command that outputs structured JSON (used in CI). This separates concerns: human UX in one command, machine UX in another.

C (always output JSON) degrades the human review experience — engineers want readable text, not JSON. A (regex on free-text) is brittle — Claude's phrasing varies, breaking the regex unpredictably.

The exam lesson: don't make humans consume machine formats or machines consume human formats. Design for each consumer separately.

---

**Q7 Answer: B**

Running `swift test` once after all 40 related changes is correct behaviour. The CLAUDE.md rule "after every code change" is interpreted by Claude as "after the complete set of changes for this task" — not after each individual file edit within the same logical change.

A (test after each file) would mean 40 test runs for a naming refactor — extremely inefficient and unnecessary since intermediate states may not compile.

C is wrong — the rule is correctly worded. D is wrong — renaming across files can break call sites and tests should verify nothing broke.

---

**Q8 Answer: B**

Claude Code is good at logic, architecture, and design pattern analysis. It is NOT a purpose-built security analysis tool and will miss specific vulnerability patterns (SQL injection, XSS, insecure deserialization) that SAST tools are trained to detect.

The correct answer is complementary tools: SAST (Semgrep, CodeQL) for security pattern detection, Claude Code for broader code quality and architecture review. Neither alone is sufficient for comprehensive security coverage.

A (Sonnet vs Haiku) doesn't meaningfully improve security vulnerability detection. C and D address the prompt quality, not the fundamental limitation that Claude wasn't trained specifically for security pattern detection.

---

**Q9 Answer: B**

Project CLAUDE.md wins — more specific configuration always overrides less specific. The hierarchy is: local (most specific) → project → global (least specific).

This is by design: teams need to be able to enforce project standards that override individuals' personal preferences. If global preferences could override project settings, there would be no way to enforce team consistency.

The developer's verbose preference applies to projects where no project CLAUDE.md exists. In this project, conciseness is the team standard.

---

**Q10 Answer: A**

The only way to *enforce* a required check is through the technical enforcement mechanism: required status checks in GitHub branch protection. When Claude Code runs as a CI job and the job fails (exit code 1) on critical issues, GitHub blocks the merge.

B (wiki documentation) relies on voluntary compliance — engineers can ignore it. C (PR template checkbox) is also voluntary — can be checked without doing the review. D (bot reminder) is also advisory.

Enforcement requires a technical gate, not a social norm. Required status checks in branch protection are the correct mechanism.

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
