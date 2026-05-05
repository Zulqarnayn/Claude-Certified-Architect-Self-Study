---
layout: default
title: CCA Self-Study — Week 9, Day 4
---

# CCA Self-Study — Week 9, Day 4
## Claude Code in CI/CD

**Date completed:** _____________
**Study time:** 45 mins
**Curriculum phase:** Phase 4 — Claude Code & Workflows
**Exam domain:** Domain 3 · Claude Code Configuration & Workflows (20%)

---

## Core Concept

Claude Code's `--no-interactive` flag transforms it from a developer tool into an automation engine. In CI/CD pipelines, Claude Code can review every PR, generate missing tests, catch security issues, update documentation, and enforce coding standards — automatically, on every commit, without human involvement.

This is Domain 3's most production-relevant topic: how Claude Code becomes part of your software delivery pipeline rather than just a developer assistant.

---

## The Analogy — A Quality Inspector on a Production Line

A factory quality inspector doesn't check products only when a worker remembers to ask. They check every single item coming off the line, automatically, using standardised criteria. Products that fail don't proceed.

Claude Code in CI/CD is that inspector. Every PR gets checked. Every build gets reviewed. Consistent, automated, on every commit.

---

## The --no-interactive Flag

This flag is the key to CI/CD integration.

```bash
# Interactive (developer mode) — waits for your input
claude

# Non-interactive (automation mode) — runs task and exits
claude --no-interactive "Your task here"

# Pipe task from stdin
echo "Task description" | claude --no-interactive

# From a command file
claude --no-interactive "$(cat .claude/commands/review.md)" "$CHANGED_FILES"
```

**Differences from interactive mode:**

| | Interactive | Non-interactive |
|---|---|---|
| Waits for user input | Yes | Never |
| Asks permission for file changes | Yes | Uses pre-configured permissions |
| Continues after completion | Waits for next command | Exits with status code |
| Exit code | Always 0 | 0 = success, 1 = failure |
| Output | Terminal with formatting | Plain text to stdout |

**The exit code is critical for CI/CD:** Your pipeline fails the build if Claude Code exits with code 1. You can use this to gate deployments.

---

## Setting Up Permissions for CI/CD

In CI/CD, there's no human to approve file changes. You must pre-configure permissions.

**Option 1 — Environment variables:**
```bash
# Allow Claude Code to make changes without asking
CLAUDE_ALLOW_WRITE=true
CLAUDE_ALLOW_BASH=true
claude --no-interactive "Fix all lint errors"
```

**Option 2 — settings.json:**
```json
// .claude/settings.json (committed to git)
{
  "permissions": {
    "allow_write": ["src/**", "tests/**"],
    "deny_write": ["*.lock", "Secrets/**", "*.pem"],
    "allow_bash": ["swift build", "swift test", "swiftlint"],
    "deny_bash": ["rm -rf*", "git push", "curl *"]
  }
}
```

**Option 3 — Scoped task instruction:**
```bash
claude --no-interactive \
  "Review only — do NOT modify any files. Output findings as JSON only."
```

For review-only tasks, no write permission is needed. The task instruction itself constrains Claude's behaviour.

---

## CI/CD Integration Patterns

### Pattern 1 — PR Review Gate

```yaml
# .github/workflows/claude-review.yml
name: Claude Code Review

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  claude-review:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Need full history for git diff
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install Claude Code
        run: npm install -g @anthropic-ai/claude-code
      
      - name: Get changed files
        id: changes
        run: |
          CHANGED=$(git diff --name-only origin/${{ github.base_ref }}...HEAD \
                   | grep '\.swift$' | tr '\n' ' ')
          echo "files=$CHANGED" >> $GITHUB_OUTPUT
      
      - name: Run Claude Code review
        if: steps.changes.outputs.files != ''
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          claude --no-interactive \
            "Review these changed Swift files for critical issues only. 
             Output ONLY a JSON object: 
             {\"has_critical_issues\": true/false, \"issues\": [{\"file\": \"...\", \"line\": N, \"issue\": \"...\"}]}
             Do not modify any files.
             Files to review: ${{ steps.changes.outputs.files }}" \
            > review_output.json
      
      - name: Parse review results
        id: review
        run: |
          HAS_ISSUES=$(cat review_output.json | python3 -c "import json,sys; print(json.load(sys.stdin)['has_critical_issues'])")
          echo "has_issues=$HAS_ISSUES" >> $GITHUB_OUTPUT
      
      - name: Post review comment
        uses: actions/github-script@v7
        with:
          script: |
            const output = require('fs').readFileSync('review_output.json', 'utf8');
            const review = JSON.parse(output);
            const body = review.has_critical_issues 
              ? `## ❌ Claude Code Review: Issues Found\n\`\`\`json\n${output}\n\`\`\``
              : `## ✅ Claude Code Review: No Critical Issues`;
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: body
            });
      
      - name: Fail if critical issues found
        if: steps.review.outputs.has_issues == 'True'
        run: |
          echo "Claude Code found critical issues. Fix them before merging."
          exit 1
```

---

### Pattern 2 — Auto-Fix Lint Errors

```yaml
# .github/workflows/auto-fix.yml
name: Auto-Fix Lint

on:
  push:
    branches: [feature/**, fix/**]

jobs:
  auto-fix:
    runs-on: macos-14
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Install Claude Code
        run: npm install -g @anthropic-ai/claude-code
      
      - name: Run lint check
        id: lint
        run: |
          swiftlint 2>&1 > lint_output.txt || true
          ERROR_COUNT=$(grep -c "error:" lint_output.txt || echo "0")
          echo "error_count=$ERROR_COUNT" >> $GITHUB_OUTPUT
      
      - name: Auto-fix lint errors
        if: steps.lint.outputs.error_count != '0'
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          LINT_ERRORS=$(cat lint_output.txt)
          claude --no-interactive \
            "Fix these SwiftLint errors. Modify only the files mentioned in the errors.
             Do not change any logic — only fix the style issues.
             Errors to fix:
             $LINT_ERRORS"
      
      - name: Verify fixes
        run: |
          ERROR_COUNT=$(swiftlint 2>&1 | grep -c "error:" || echo "0")
          if [ "$ERROR_COUNT" -gt "0" ]; then
            echo "Lint errors remain after auto-fix attempt"
            exit 1
          fi
      
      - name: Commit fixes
        run: |
          git config --global user.name "Claude Code Bot"
          git config --global user.email "claude-code@yourcompany.com"
          git add -A
          git commit -m "fix: auto-fix SwiftLint errors via Claude Code [skip ci]"
          git push
```

---

### Pattern 3 — Test Coverage Guard

```yaml
# Run after PR merge to main — ensures tests exist for new code
- name: Check test coverage for new code
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
  run: |
    NEW_FILES=$(git diff HEAD~1 --name-only | grep '\.swift$' | grep -v 'Tests')
    
    claude --no-interactive \
      "Check if unit tests exist for each of these new Swift files.
       For each file without tests, generate comprehensive XCTest unit tests.
       Save each test file to the appropriate location in /Tests/.
       Run swift test to verify all tests compile and pass.
       Files to check: $NEW_FILES"
```

---

### Pattern 4 — Documentation Update

```yaml
# Automatically update docs when public API changes
- name: Update API documentation
  run: |
    CHANGED_PUBLIC_API=$(git diff HEAD~1 -- 'Sources/**/*.swift' \
                        | grep '^+.*public ' | head -20)
    
    if [ -n "$CHANGED_PUBLIC_API" ]; then
      claude --no-interactive \
        "The following public API has changed. 
         Update README.md and any relevant documentation files 
         to reflect these changes. Do not change any Swift files.
         Changes:
         $CHANGED_PUBLIC_API"
    fi
```

---

## Output Formats for CI/CD

In CI/CD, Claude Code's output must be machine-parseable. Always instruct Claude to output structured formats:

```bash
# JSON output for parsing
claude --no-interactive \
  "Review this code. Output ONLY valid JSON: 
   {\"pass\": true/false, \"issues\": [{\"severity\": \"critical/warning\", \"message\": \"...\"}]}"

# Exit code control via output
claude --no-interactive \
  "If you find security vulnerabilities, exit with 'SECURITY_ISSUE_FOUND' at the end.
   Otherwise end with 'SECURITY_CHECK_PASSED'."
# Then check: if grep -q "SECURITY_ISSUE_FOUND" output.txt; then exit 1; fi
```

---

## Cost Management in CI/CD

CI/CD runs Claude Code on every PR. Costs can accumulate.

```bash
# Scope to only changed files (not entire codebase)
CHANGED=$(git diff --name-only origin/main...HEAD | grep '\.swift$')
claude --no-interactive "Review only: $CHANGED"

# Skip Claude Code for certain change types
if git diff --name-only | grep -q '\.swift$'; then
  claude --no-interactive "Review Swift changes"
else
  echo "No Swift changes — skipping Claude Code review"
fi

# Use Haiku for simple checks, Sonnet for complex review
CLAUDE_MODEL=claude-haiku-4-5-20251001 claude --no-interactive "Check lint compliance"
CLAUDE_MODEL=claude-sonnet-4-6 claude --no-interactive "Full security review"
```

---

## Key Concepts Learned Today

| Term | Definition |
|---|---|
| `--no-interactive` | Flag that makes Claude Code run a task and exit without waiting for input |
| Exit code | 0 = success, 1 = failure — used by CI to pass/fail the pipeline |
| settings.json | Pre-configured permissions for automated runs |
| PR review gate | CI step that blocks merge if Claude Code finds critical issues |
| Auto-fix workflow | CI step that uses Claude Code to automatically fix issues |
| Structured output | Instructing Claude to output JSON for machine parsing |
| Cost scoping | Limiting Claude Code to changed files only to control CI costs |

---

## Hands-On Task 🛠️

**Task 1:** Write a local script that uses `--no-interactive` to review a Swift file and output JSON. Parse the JSON with Python and print a summary.

**Task 2:** Create a GitHub Actions workflow (or equivalent) that runs Claude Code review on every PR's changed files.

**Task 3:** Implement a `settings.json` that allows writes to `src/` but denies writes to `Secrets/` and `*.lock` files.

**Task 4:** Write a CI script that fails the build if Claude Code reports any critical issues. Test it by introducing a deliberate issue.

**Task 5 — Cost calculation:** Estimate the monthly cost of running Claude Code on every PR if your team makes 20 PRs/week, each touching an average of 5 Swift files (avg 200 lines each).

**Your work:**
> _(write here)_

---

## Q&A — Self-Assessment (6 Questions)

---

**Q1.** Your CI Claude Code review exits with code 1. The build fails. The developer complains that Claude is too strict and blocking legitimate code. How do you balance automation with developer autonomy?

> **Your answer:**
> _(write here)_

---

**Q2.** Claude Code's auto-fix workflow commits directly to the developer's feature branch. A developer has uncommitted changes when the CI runs. What happens, and how do you prevent conflicts?

> **Your answer:**
> _(write here)_

---

**Q3.** Your PR review CI step runs Claude Code on every PR, including documentation-only PRs and config file changes. What's the problem, and how do you fix it?

> **Your answer:**
> _(write here)_

---

**Q4.** You want Claude Code in CI to catch security vulnerabilities. However, false positives cause developer frustration. Design a two-tier approach: automated blocking for obvious issues, human review for uncertain ones.

> **Your answer:**
> _(write here)_

---

**Q5.** Claude Code reviews a PR and finds 3 critical issues and 12 suggestions. Your CI fails the build for any critical issues. The developer fixes the 3 critical issues and pushes again. Claude Code now finds 2 new critical issues it didn't flag before. Why might this happen, and how do you make reviews deterministic?

> **Your answer:**
> _(write here)_

---

**Q6 — Exam Scenario.** A startup integrates Claude Code into their CI/CD pipeline. After 3 months, their CI costs have tripled due to Claude Code API usage. Diagnose the likely causes and design a cost-optimised CI/CD setup that maintains quality coverage while reducing costs by 60%.

> **Your answer:**
> _(write here)_

---

## Answer Guide — Claude's Reference Answers

---

**Q1 — Balancing automation with developer autonomy**

The solution is tiered severity with human override.

**Tier 1 — Hard blocks (no override):** Safety issues, credential exposure, syntax errors that would crash the app. These block the build unconditionally.

**Tier 2 — Soft blocks (developer can override):** Style violations, suboptimal patterns, missing tests. These fail the build but the developer can add a PR label `claude-review-override` to merge anyway (with the override logged for audit).

**Tier 3 — Informational:** Suggestions, improvements, observations. These post as a PR comment but never block merge.

```yaml
# In the review prompt:
"Classify issues as:
 HARD_BLOCK: security vulnerabilities, crashes, data loss risks
 SOFT_BLOCK: coding standard violations, missing tests
 INFO: suggestions and improvements

Output JSON: {hard_blocks: [...], soft_blocks: [...], info: [...]}"

# In the CI logic:
if [ hard_blocks_count > 0 ]; then exit 1; fi
if [ soft_blocks_count > 0 && no_override_label ]; then exit 1; fi
```

This gives developers autonomy while maintaining non-negotiable quality gates.

---

**Q2 — Auto-fix conflicting with uncommitted changes**

**What happens:** Git cannot commit auto-fixed files if the developer has uncommitted changes in the same files. The CI step will fail with a git conflict error.

**Prevention strategies:**

1. **Run auto-fix on a clean branch:** The CI runs on a fresh checkout — it never touches the developer's local workspace. The CI auto-fix commits to the remote branch, and the developer pulls when they next sync. No local conflict.

2. **Check for clean state before fixing:**
```bash
if ! git diff --quiet; then
  echo "Working directory has uncommitted changes — skipping auto-fix"
  exit 0
fi
```

3. **Fix in a separate branch:** Instead of committing to the feature branch, create a `fix/auto-lint-[branch-name]` branch and open a PR against the feature branch. The developer reviews and merges the fix.

4. **Prefer review-only in CI, fix locally:** CI reports issues. Developer runs `/fix-lint` locally and commits manually. No CI writes to avoid conflicts entirely.

---

**Q3 — Claude Code running on non-Swift PRs**

**The problem:** Running Claude Code review on a PR that only changes `README.md` wastes API tokens and adds latency for no benefit.

**Fix — conditional execution based on changed file types:**

```yaml
- name: Detect Swift changes
  id: detect
  run: |
    SWIFT_CHANGES=$(git diff --name-only origin/main...HEAD | grep '\.swift$' | wc -l)
    echo "swift_count=$SWIFT_CHANGES" >> $GITHUB_OUTPUT

- name: Run Claude Code review
  if: steps.detect.outputs.swift_count != '0'
  run: |
    claude --no-interactive "Review Swift changes..."

- name: Skip notice
  if: steps.detect.outputs.swift_count == '0'
  run: echo "No Swift changes — Claude Code review skipped"
```

**Extended filtering:**
```bash
# Also skip for certain change types
ONLY_DOCS=$(git diff --name-only | grep -v '\.swift$' | grep -v '\.json$' | wc -l)
SWIFT_COUNT=$(git diff --name-only | grep '\.swift$' | wc -l)

if [ "$SWIFT_COUNT" -eq "0" ]; then
  echo "No Swift files changed — skipping"
  exit 0
fi
```

This simple check eliminates Claude Code API calls for all non-code PRs — often 20-30% of all PRs in typical projects.

---

**Q4 — Two-tier security review**

```yaml
# Tier 1: Automated high-confidence security check (blocks immediately)
- name: Security quick scan
  run: |
    claude --no-interactive \
      "Scan these files for HIGH-CONFIDENCE security issues only:
       - Hardcoded credentials (API keys, passwords in source)
       - SQL injection vulnerabilities  
       - Unencrypted sensitive data storage
       
       ONLY flag issues you are > 95% confident are real vulnerabilities.
       Output: {definite_vulnerabilities: [{file, line, issue, severity: 'critical'}]}
       If none found, output: {definite_vulnerabilities: []}
       Files: $CHANGED_FILES"
    
    DEFINITE=$(cat output.json | python3 -c "import json,sys; print(len(json.load(sys.stdin)['definite_vulnerabilities']))")
    if [ "$DEFINITE" -gt "0" ]; then
      echo "Definite security vulnerabilities found"
      exit 1  # Hard block
    fi

# Tier 2: Uncertain issues go to human review (non-blocking)
- name: Security advisory scan
  run: |
    claude --no-interactive \
      "Scan for POTENTIAL security concerns that need human review.
       Include issues where you are 60-95% confident.
       Do NOT include issues already caught in the definite scan.
       Output as PR comment suggestions only.
       Files: $CHANGED_FILES"
    
    # Post as informational comment — does not fail the build
    gh pr comment --body "$(cat advisory_output.txt)"
```

Tier 1 blocks confidently. Tier 2 informs without blocking. False positives from Tier 2 don't frustrate developers because they don't block anything — they're informational flags for the human reviewer to assess.

---

**Q5 — Non-deterministic review results**

**Why new issues appear on the second run:**

Claude is probabilistic. The same files reviewed twice may produce different results because:
1. Temperature/sampling variation in the model
2. Different context on the second run (the PR now has the developer's fixes, changing the total context)
3. The fixes may have introduced new code patterns that trigger different checks
4. Claude's attention to different sections varies between runs

**Making reviews more deterministic:**

1. **Set temperature to 0 for review tasks:**
```bash
CLAUDE_TEMPERATURE=0 claude --no-interactive "Review..."
```
Lower temperature = less variation = more consistent results.

2. **Use a fixed, exhaustive checklist:**
```bash
"Check EXACTLY these items, in this order: [exhaustive list]
 For each item: PASS or FAIL with file/line.
 Do not check anything not on this list."
```
Structured checklists reduce variation more than open-ended "find issues" prompts.

3. **Review files independently:**
Review each file in isolation. File A's review is not affected by File B being in context.

4. **Cache reviews per file hash:**
If a file's SHA hasn't changed between runs, reuse the previous review result. Only re-review changed files.

The fundamental truth: Claude reviews will never be 100% deterministic. Design your CI to handle this — be strict about confirmed issues, lenient about uncertain ones.

---

**Q6 — CI costs tripled: diagnosis and fix**

**Likely causes:**

1. **Running on every commit, not just PRs:** If Claude Code runs on every push to any branch, costs multiply by commit frequency vs PR frequency.

2. **No file filtering:** Claude Code reviews the entire codebase on every run, not just changed files.

3. **Wrong model:** Using Sonnet for simple lint checks that Haiku could handle.

4. **No caching:** Re-reviewing unchanged files that were reviewed last run.

5. **Multiple CI steps calling Claude:** Three separate Claude Code calls (review, test check, docs update) where one integrated call would suffice.

**Cost-optimised redesign:**

```yaml
# BEFORE: Runs on every push, reviews everything, uses Sonnet for all
# Estimated cost: $150/month

# AFTER: Optimised setup
# Step 1: Only on PRs (not every commit push)
on: [pull_request]

# Step 2: Only on Swift file changes
- if: contains(github.event.pull_request.changed_files, '.swift')

# Step 3: Only changed files
CHANGED=$(git diff --name-only origin/main...HEAD | grep '\.swift$')

# Step 4: Haiku for lint/style, Sonnet only for security/architecture
CLAUDE_MODEL=claude-haiku-4-5-20251001 claude --no-interactive \
  "Check lint compliance only. Output pass/fail per file." # $0.001/run

CLAUDE_MODEL=claude-sonnet-4-6 claude --no-interactive \
  "Security and architecture review" # $0.05/run — only if Haiku found no issues

# Step 5: Cache per file hash — skip unchanged files
CACHED_HASH=$(cat .claude_review_cache/$FILE_HASH 2>/dev/null)
if [ "$CACHED_HASH" = "PASS" ]; then
  echo "Cached pass — skipping $FILE"
  continue
fi
```

**Expected savings:**
- Filter to PRs only: -40% (many commits, fewer PRs)
- File filtering: -30% (non-Swift PRs skipped)
- Haiku for simple checks: -60% on simple check cost
- Caching unchanged files: -25% on repeated reviews

Combined: ~60-70% cost reduction while maintaining the same quality gates.

---

## Status

- [ ] --no-interactive script built and tested
- [ ] GitHub Actions workflow created
- [ ] settings.json configured
- [ ] Failing build test completed
- [ ] Cost calculation done
- [ ] All 6 questions answered
- [ ] Answer guide reviewed

---

## Coming Up — Week 9, Day 5

**Topic:** Context Management & Reliability — Prompt Caching
The most cost-impactful optimisation for high-volume Claude systems. How prompt caching works, when cache hits occur, and how to design your prompts to maximise cache efficiency.

---

*CCA Self-Study Log · Asif · Phase 4 of 5 · Week 9 of 12*
