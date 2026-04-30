---
layout: default
title: CCA Self-Study — Week 9, Day 3
---

# CCA Self-Study — Week 9, Day 3
## Slash Commands & .claude/commands/

**Date completed:** _____________
**Study time:** 45 mins
**Curriculum phase:** Phase 4 — Claude Code & Workflows
**Exam domain:** Domain 3 · Claude Code Configuration & Workflows (20%)

---

## Core Concept

Slash commands turn repeated Claude Code workflows into reusable, one-line invocations. Instead of typing the same detailed prompt every time you want to do a code review, you type `/review` and Claude executes a carefully crafted workflow. Commands are stored as Markdown files in `.claude/commands/` and can be version-controlled with your project.

---

## The Analogy — Keyboard Shortcuts

A designer who uses Photoshop daily has memorised dozens of keyboard shortcuts. Instead of clicking through menus (File → Export → Export As → Configure → Save), they press Cmd+Shift+Alt+S. The shortcut encodes an entire workflow into one keystroke.

Slash commands are keyboard shortcuts for Claude Code workflows. You define the workflow once, precisely, and invoke it with a single command whenever needed.

---

## Slash Command Structure

Commands live in two locations:

```
Project commands (shared with team):
.claude/commands/
├── review.md          → /review
├── test-coverage.md   → /test-coverage
├── fix-lint.md        → /fix-lint
└── release-notes.md   → /release-notes

Personal commands (yours only):
~/.claude/commands/
├── explain-verbose.md → /explain-verbose
└── my-workflow.md     → /my-workflow
```

The command filename (without `.md`) becomes the slash command name.

---

## Anatomy of a Slash Command

A command file is Markdown with a specific structure:

```markdown
# Command Name

Brief description of what this command does.

---

## Instructions

[Detailed instructions Claude will follow when this command is invoked]

$ARGUMENTS
```

The special token `$ARGUMENTS` is replaced with whatever the user types after the slash command.

**Example:**
```bash
/review src/auth/LoginView.swift
```
The `$ARGUMENTS` in the command file becomes `src/auth/LoginView.swift`.

---

## Real-World Command Examples

### /review — Code Review

```markdown
# Code Review

Perform a thorough code review of the specified file(s).

---

## Instructions

Review the following file(s) for:

**Code Quality:**
- Swift best practices and idioms
- Memory management (retain cycles, weak/unowned usage)
- Error handling completeness
- Function length (flag anything over 50 lines)
- Force unwraps (flag ALL uses of !)

**Architecture:**
- MVVM compliance (Views have no business logic)
- Proper use of async/await
- No Combine (project uses async/await only)
- Service layer separation

**Security:**
- No sensitive data logged
- No hardcoded secrets
- Proper data validation

**Tests:**
- Is this code testable?
- Are there missing test cases?

Format your review as:
## Summary
[1-2 sentences: overall quality assessment]

## Critical Issues (must fix)
- [issue]: [file:line] — [why it matters]

## Suggestions (nice to have)
- [suggestion]: [why]

## Positive Observations
- [what was done well]

$ARGUMENTS
```

---

### /test-generate — Generate Tests

```markdown
# Generate Tests

Generate comprehensive unit tests for the specified file or function.

---

## Instructions

Generate XCTest unit tests for:

$ARGUMENTS

Requirements:
1. Test every public function with at least one happy-path test
2. Test error conditions and edge cases
3. Use descriptive test names: `test_[function]_[scenario]_[expectedOutcome]`
4. Mock external dependencies using protocol-based injection
5. No third-party testing frameworks — XCTest only
6. Group tests by function using `// MARK: - functionName`

Before generating tests:
- Read the file to understand what it does
- Identify all public interfaces
- Identify dependencies that need mocking

After generating:
- Run `swift test` to verify tests compile and pass
- Fix any compilation errors before presenting results
```

---

### /fix-issue — Fix a GitHub Issue

```markdown
# Fix Issue

Analyse and fix the specified GitHub issue.

---

## Instructions

Fix GitHub issue: $ARGUMENTS

Process:
1. Read the issue description carefully
2. Search the codebase for relevant files using search_files
3. Understand the root cause before making any changes
4. Implement the minimal fix that resolves the issue
5. Write a regression test that would have caught this bug
6. Run `swift test` and fix any failures
7. Summarise: what was the bug, what caused it, what you changed

Constraints:
- Fix only the reported issue — do not refactor unrelated code
- Do not introduce new dependencies
- Maintain existing code style
```

---

### /release-notes — Generate Release Notes

```markdown
# Release Notes Generator

Generate App Store release notes from recent git commits.

---

## Instructions

Generate App Store release notes for the latest release.

Steps:
1. Run `git log --oneline $(git describe --tags --abbrev=0 HEAD^)..HEAD`
   to get commits since the last tag
2. Categorise commits into: Bug Fixes, New Features, Improvements
3. Write user-facing release notes (not developer notes)
4. Tone: friendly, non-technical, focusing on user benefit
5. Length: 100-200 words maximum (App Store limit consideration)
6. Do NOT mention internal refactors, test changes, or CI updates

Format:
**What's New**
[New features in bullet points]

**Bug Fixes**
[Fixed issues in bullet points]

**Improvements**
[Performance/UX improvements]

$ARGUMENTS
```

---

### /scaffold — Create New Feature Scaffold

```markdown
# Scaffold New Feature

Create the boilerplate structure for a new feature.

---

## Instructions

Create a complete feature scaffold for: $ARGUMENTS

Create these files (following project MVVM architecture):

1. `/Sources/Views/[FeatureName]View.swift` — SwiftUI View
   - Empty body with placeholder Text
   - @StateObject binding to ViewModel
   
2. `/Sources/ViewModels/[FeatureName]ViewModel.swift` — ViewModel
   - Conforms to ObservableObject
   - @Published properties for UI state
   - async functions for business logic
   
3. `/Tests/[FeatureName]ViewModelTests.swift` — Unit Tests
   - Test class conforming to XCTestCase
   - One placeholder test that passes
   
4. Update `/CHANGELOG.md` with "Added [FeatureName] feature scaffold"

After creating files:
- Run `swift build` to verify everything compiles
- Fix any compilation errors
```

---

## Using Commands

```bash
# Basic usage
/review

# With arguments
/review src/auth/LoginViewModel.swift

# Multiple files
/review src/auth/ src/models/

# With context
/fix-issue #47 "Photo picker crashes on iOS 16"
```

---

## Project vs Personal Commands

| | Project commands | Personal commands |
|---|---|---|
| Location | `.claude/commands/` | `~/.claude/commands/` |
| Committed to git | Yes | No |
| Shared with team | Yes | No |
| Scope | Team workflows | Personal workflows |
| Example | `/review` (everyone uses) | `/my-debug-style` (personal) |

**Design rule:** If you'd want a teammate to use the same command, make it a project command. If it's your personal style, make it global.

---

## Key Concepts Learned Today

| Term | Definition |
|---|---|
| Slash command | A reusable Claude Code workflow invoked with `/commandname` |
| `.claude/commands/` | Project commands directory (committed to git) |
| `~/.claude/commands/` | Personal commands directory (not committed) |
| `$ARGUMENTS` | Token replaced with user-provided arguments |
| Command file | A Markdown file defining a slash command's workflow |
| Project command | Team-shared command, version controlled |
| Personal command | Individual command, not shared |

---

## Hands-On Task 🛠️

**Task 1:** Create `.claude/commands/` in your project. Build the `/review` command above.

**Task 2:** Run `/review` on a real file. Evaluate the quality of the review. Improve the command prompt based on what you observe.

**Task 3:** Create a `/scaffold` command for your iOS project that generates the correct boilerplate for your architecture.

**Task 4:** Create a personal command `~/.claude/commands/explain.md` that explains code at your preferred verbosity level.

**Task 5:** Create a `/preflight` command that runs all your quality checks (build, test, lint) and reports the results in a standardised format.

**Your commands:**
> _(write here)_

---

## Q&A — Self-Assessment (6 Questions)

---

**Q1.** A developer creates a `/review` command in `.claude/commands/`. Their colleague clones the repo and runs `/review`. Does the colleague's Claude Code session see the command? Why or why not?

> **Your answer:**
> _(write here)_

---

**Q2.** You want a `/deploy` command that triggers an actual deployment to production. Should this be a slash command? What guardrails would you add?

> **Your answer:**
> _(write here)_

---

**Q3.** Your `/review` command is 300 lines long with exhaustive review criteria. Is this better than a 50-line version? What trade-offs are involved?

> **Your answer:**
> _(write here)_

---

**Q4.** A new developer joins and asks "How do I do a code review with Claude Code?" Where should the answer live — in documentation, in CLAUDE.md, or in a slash command? Defend your choice.

> **Your answer:**
> _(write here)_

---

**Q5.** Your `/test-generate` command runs `swift test` after generating tests. The test run takes 3 minutes. The developer runs `/test-generate` 10 times in a day. Is this efficient? How would you optimise?

> **Your answer:**
> _(write here)_

---

**Q6 — Exam Scenario.** A team uses Claude Code for development. They want consistent code review quality across all PRs. Currently some developers use `/review`, some don't. The review quality varies significantly between developers. Design a workflow that makes high-quality Claude Code review a mandatory, standard part of their PR process.

> **Your answer:**
> _(write here)_

---

## Answer Guide — Claude's Reference Answers

---

**Q1 — Colleague sees project commands after cloning**

**Yes — the colleague's Claude Code sees the commands.**

`.claude/commands/` is a directory in the project. When the colleague clones the repo and runs `claude` in the project directory, Claude Code scans `.claude/commands/` and loads all command files. The `/review` command is immediately available.

This is by design — project commands are team infrastructure. Just like the project's build scripts or CI configuration, they're part of the project and should work for everyone who works on the project.

**The colleague does NOT inherit the original developer's personal commands** (`~/.claude/commands/`). Those live on the original developer's machine and are never committed.

**Exam point:** Project commands are version-controlled team tooling. Personal commands are private preferences. Understanding this distinction is exam-tested.

---

**Q2 — /deploy command for production**

Yes, you can create a `/deploy` command — but it needs substantial guardrails:

```markdown
# Deploy to Production

CAUTION: This deploys to production. Requires explicit confirmation.

## Instructions

BEFORE DOING ANYTHING:
1. Run `git status` and confirm working directory is clean
2. Run `swift test` and confirm ALL tests pass
3. Run `swiftlint --strict` and confirm zero errors
4. Confirm you are on the `main` branch: `git branch --show-current`
5. Confirm the version in Package.swift matches the intended release

If ANY of the above checks fail, STOP and tell the user what failed.

ONLY if all checks pass, show the user this summary:
- Current branch: [branch]
- Tests: [pass/fail]
- Lint: [pass/fail]
- Version: [version]

Then say: "All checks passed. Type 'confirm deploy [version]' to proceed."
WAIT for the user to type confirmation. Do NOT proceed without it.

If the user confirms:
$ARGUMENTS

[deployment commands here]
```

**Key guardrails:**
1. Pre-flight checks that can't be bypassed
2. Human confirmation required before any deployment action
3. Explicit version confirmation prevents wrong-version deployments
4. Checks are automated (reliable) but confirmation is human (intentional)

---

**Q3 — Long vs short review command**

**Shorter is usually better, but quality is the primary constraint.**

**300-line command trade-offs:**

Pros:
- Exhaustive criteria — nothing is missed
- Consistent reviews across all reviewers (Claude always checks all 300 lines worth of criteria)

Cons:
- Context window consumption — 300 lines ≈ 1,500+ tokens consumed just for the command
- Claude's attention to criteria weakens for rules buried in line 250
- Maintenance burden — outdated criteria accumulate
- Verbose output — exhaustive criteria produce exhaustive reviews, which developers stop reading

**The optimal design:** A focused 50-line command that covers the 20% of criteria that catch 80% of issues. Use a severity system: "Critical (block PR)" vs "Suggestions (optional)." Developers read focused reviews. Long reviews get skimmed.

For extremely thorough reviews (security audit, pre-release), have a separate `/security-audit` command that's used rarely but comprehensively.

---

**Q4 — Documentation, CLAUDE.md, or slash command**

**All three have a role — use the right tool for the right purpose:**

**Documentation (README or wiki):** "Here's what code review is and why we do it." Background, process, philosophy. Written for humans to read once.

**CLAUDE.md:** "When doing a code review, Claude must check X, Y, Z." Standing instructions that apply to all sessions. Claude follows these automatically.

**Slash command:** "Here's the specific workflow for running a review." Actionable, reproducible, one-command invocation. Claude executes this workflow on demand.

**For your specific scenario** ("How do I do a code review?"):
- The answer is `/review` — the slash command IS the documentation for how to do it. A developer runs `/review MyFile.swift` and Claude does the rest.
- CLAUDE.md has general review principles that apply whenever Claude helps with code
- The README documents that `/review` exists and gives a brief description

The slash command is the most discoverable answer. Running `/review` is simpler than reading documentation about how to review.

---

**Q5 — Optimising /test-generate with 3-minute test runs**

**The problem:** `swift test` runs all tests, not just the new ones. 10 invocations × 3 minutes = 30 minutes of wait time.

**Optimisations:**

**Option 1 — Run only tests for the changed file:**
```markdown
After generating tests for $ARGUMENTS:
- Run: `swift test --filter [FeatureName]Tests`
- This runs ONLY the tests for this feature (seconds, not minutes)
- Report: pass/fail for the new tests only
```

**Option 2 — Compile-only check:**
```markdown
After generating tests:
- Run: `swift build --target [TestTarget]` to verify compilation
- Skip full test run — developer runs `swift test` when ready
- Note: "Tests compile. Run `swift test` for full verification."
```

**Option 3 — Parallel test generation:**
If generating tests for 5 files, generate all 5 before running tests once.

**Option 4 — Test in two phases:**
Phase 1 (immediate): Generate tests, verify compilation.
Phase 2 (background/manual): Full test suite after developer reviews the generated tests.

The `--filter` option is the most practical: it tests exactly what was just created, provides fast feedback (seconds), and doesn't waste time testing unrelated code.

---

**Q6 — Mandatory PR review with Claude Code**

**Design: Enforce in CI, standardise via command, educate via CLAUDE.md.**

**Layer 1 — Required CI check:**
```yaml
# .github/workflows/claude-review.yml
name: Claude Code Review
on: [pull_request]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install Claude Code
        run: npm install -g @anthropic-ai/claude-code
      - name: Run review
        run: |
          claude --no-interactive \
            "Review all changed files in this PR against our coding standards. 
             List all CRITICAL issues (must fix before merge). 
             Post results to PR comments."
      - name: Check for critical issues
        run: |
          # Fail the CI check if CRITICAL issues found
          if grep -q "## Critical Issues" claude_output.txt; then
            echo "Claude Code found critical issues. Review required."
            exit 1
          fi
```

**Layer 2 — Standardised /review command:**
Every developer uses the same `/review` command (project command, committed to git). Reviews are consistent because the workflow is consistent.

**Layer 3 — CLAUDE.md review standards:**
```markdown
## Code Review Standards
When reviewing code, always check against [standards list].
All critical issues must be fixed before PR can merge.
```

**Result:** CI automatically reviews every PR. Critical issues block merge. Human reviewers still review, but Claude Code has already caught the obvious issues. Review quality is consistent across all 8 developers because they all run the same command.

---

## Status

- [ ] /review command created and tested
- [ ] /scaffold command created for iOS architecture
- [ ] Personal explain command created
- [ ] /preflight command created and tested
- [ ] All 6 questions answered
- [ ] Answer guide reviewed

---

## Coming Up — Week 9, Day 4

**Topic:** Claude Code in CI/CD
Using `--no-interactive` mode in automated pipelines. What Claude Code can do in CI that it can't do interactively. Practical CI use cases: code review, test generation, docs, security scans.

---

*CCA Self-Study Log · Asif · Phase 4 of 5 · Week 9 of 12*
