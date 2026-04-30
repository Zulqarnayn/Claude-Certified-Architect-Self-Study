# CCA Self-Study — Week 9, Day 2
## CLAUDE.md — The Configuration File

**Date completed:** _____________
**Study time:** 45 mins
**Curriculum phase:** Phase 4 — Claude Code & Workflows
**Exam domain:** Domain 3 · Claude Code Configuration & Workflows (20%)

---

## Core Concept

CLAUDE.md is the most important configuration mechanism in Claude Code. It's a Markdown file that Claude reads at the start of every session — before any user message. Think of it as the system prompt for your project: it sets Claude's understanding of your codebase, establishes rules, defines conventions, and constrains what Claude will and won't do.

The CCA exam tests whether you understand the CLAUDE.md hierarchy (global → project → local), what belongs in a CLAUDE.md, and how it differs from system prompts in the raw API.

---

## The Analogy — An Employee Handbook

When you start a new job, you get an employee handbook. Before you do any work, you read the handbook. It tells you:
- How this company operates
- What the dress code is
- What tools you use
- What you should never do
- Who to escalate issues to

CLAUDE.md is Claude Code's employee handbook for your project. Claude reads it before touching a single file.

---

## The CLAUDE.md Hierarchy

CLAUDE.md files exist at three levels, each more specific than the last:

```
Global: ~/.claude/CLAUDE.md
         ↑ Developer's personal preferences
         ↑ Applies to ALL projects
         
Project: ~/your-project/CLAUDE.md
          ↑ Team shared configuration
          ↑ Committed to git
          ↑ Applies to THIS project
          
Local:   ~/your-project/src/components/CLAUDE.md
          ↑ Module-specific rules
          ↑ Can be .gitignored for personal notes
          ↑ Applies to files IN THIS DIRECTORY
```

**Priority:** Local → Project → Global (more specific wins)

**Critical exam distinction:**
- **Global CLAUDE.md** = personal developer preferences, not shared
- **Project CLAUDE.md** = team rules, committed to git, everyone inherits
- **Local CLAUDE.md** = module-specific instructions, can be personal

---

## Anatomy of a Project CLAUDE.md

```markdown
# Project Name — Claude Code Configuration

## Project Overview
[2-3 sentences describing what this project does and its tech stack]

## Architecture
[Key architectural decisions Claude needs to know]

## Coding Standards
[Specific rules Claude must follow when writing code]

## What Claude Should Do
[Affirmative instructions]

## What Claude Should NOT Do
[Explicit prohibitions]

## Testing
[Testing conventions and requirements]

## File Structure
[Key directories and what they contain]

## Commands
[Common commands Claude can run]

## Escalation
[When Claude should stop and ask vs proceed]
```

---

## Complete CLAUDE.md Example — iOS Project

```markdown
# ScreenshotAI iOS App — Claude Code Configuration

## Project Overview
ScreenshotAI is a SwiftUI iOS app that organises screenshots using on-device 
OCR (Apple Vision framework). Target iOS 16+. Uses PHPhotoLibrary, CoreData, 
and StoreKit 2 for freemium paywall. No backend — fully on-device.

## Architecture
- MVVM architecture
- Views: SwiftUI in /Sources/Views/
- ViewModels: ObservableObject conforming classes in /Sources/ViewModels/
- Models: Codable structs in /Sources/Models/
- Services: Singleton classes in /Sources/Services/ (OCRService, StorageService)
- No Combine — use async/await only

## Coding Standards
- 4 spaces indentation (no tabs)
- SwiftDoc comments on all public functions: `/// Description`
- camelCase for properties/variables, PascalCase for types
- Guard early returns over nested if statements
- Maximum function length: 50 lines — extract if longer
- No force unwraps (!) — use guard let / if let / ?? default
- All strings in Localizable.strings, never hardcoded

## What Claude Should Do
- Always run `swift test` after making changes and fix any failures before finishing
- Check SwiftLint compliance: run `swiftlint` and fix all errors (not warnings)
- When adding a new screen, create both a View and a ViewModel
- Update CHANGELOG.md with a brief description of significant changes
- Consider accessibility: add `.accessibilityLabel()` to all interactive elements

## What Claude Should NOT Do
- Do NOT modify Package.swift or Package.resolved without asking
- Do NOT add third-party dependencies without confirming with the user first
- Do NOT modify any file in /Secrets/ directory
- Do NOT push to any branch directly — all changes stay local
- Do NOT change the minimum iOS version (currently 16.0)
- Do NOT add Combine — async/await only per architecture decision

## Testing
- Test files: /Tests/ directory, mirroring /Sources/ structure
- Naming: `test_[function]_[scenario]_[expectedResult]`
- Every new public function needs at least one happy-path test
- Use XCTest — no third-party testing frameworks
- Run: `swift test --parallel` for all tests

## Key Files
- `/Sources/App/ScreenshotAIApp.swift` — App entry point
- `/Sources/Services/OCRService.swift` — Core OCR functionality
- `/Sources/Services/StorageService.swift` — CoreData interface
- `/Sources/Views/MainDashboard.swift` — Primary screen
- `/CHANGELOG.md` — Update when making significant changes

## Common Commands
```
swift build        # Build the project
swift test         # Run all tests
swiftlint          # Run linter
git status         # Check working directory
git diff           # See changes made
```

## When to Ask vs Proceed
Ask before:
- Making architectural changes (new services, changing MVVM patterns)
- Adding dependencies
- Changing public API signatures
- Modifying test infrastructure

Proceed without asking:
- Bug fixes within existing architecture
- Adding UI elements consistent with existing patterns
- Writing new tests
- Documentation improvements
```

---

## Global CLAUDE.md — Personal Preferences

```markdown
# Global Claude Code Settings — Asif's Personal Config

## My Preferences
- I prefer concise explanations — don't repeat what I already know
- Show me the diff/summary of changes before making them on large edits
- I am an experienced Swift developer — don't explain basic Swift concepts
- Always explain WHY a change is being made, not just what

## My Workflow
- I use git with conventional commits: feat:, fix:, docs:, refactor:
- I prefer descriptive branch names: feature/ocr-search-improvement
- I review changes before committing — don't auto-commit

## Style Preferences
- I prefer functional style over imperative when readability is equal
- I like extracting magic numbers into named constants
- Comments should explain WHY, not WHAT (code shows the what)
```

---

## Local CLAUDE.md — Module-Specific Rules

```markdown
# /Sources/Services/CLAUDE.md

## This Directory
Contains singleton service classes. Each service has one responsibility.

## Rules for This Directory
- All methods must be async/await
- Services must be testable — no singletons that can't be injected
- Error types must be defined as enums conforming to LocalizedError
- All network/database operations must handle errors explicitly

## Current Services
- OCRService: Apple Vision text recognition — do not change the recognition request parameters without A/B testing
- StorageService: CoreData CRUD — all writes must happen on viewContext, reads can use background context
```

---

## CLAUDE.md Anti-Patterns

Avoid these common mistakes:

```markdown
# ❌ BAD — Too vague
## Coding Standards
Write good code. Follow best practices.

# ✅ GOOD — Specific and actionable
## Coding Standards
- Maximum 50 lines per function
- All async functions must use async/await (no completion handlers)
- Every public function needs XCTest coverage
```

```markdown
# ❌ BAD — Contradictory rules
## What to Do
Always add comprehensive error handling.

## What Not to Do
Don't make functions too complex.

# ✅ GOOD — Consistent rules
## Error Handling
Use guard statements with early return. Log errors with os_log.
Never use do-catch for control flow — only for genuine error handling.
Maximum 2 levels of error handling nesting.
```

```markdown
# ❌ BAD — Instructions Claude can't verify
## Quality
Make sure the code is high quality.

# ✅ GOOD — Verifiable instructions
## Quality Gates
After every change, verify:
1. `swift build` succeeds with zero warnings
2. `swift test` passes all tests
3. `swiftlint` reports zero errors (warnings acceptable)
Do not mark a task complete until all three pass.
```

---

## Key Concepts Learned Today

| Term | Definition |
|---|---|
| CLAUDE.md | Markdown config file Claude reads at start of every session |
| Global CLAUDE.md | `~/.claude/CLAUDE.md` — personal preferences, all projects |
| Project CLAUDE.md | `./CLAUDE.md` — team rules, committed to git, this project |
| Local CLAUDE.md | `./subdir/CLAUDE.md` — module-specific rules |
| Hierarchy | Local overrides project which overrides global |
| Quality gates | Verifiable conditions Claude checks before marking task complete |

---

## Hands-On Task 🛠️

**Task 1:** Create a global CLAUDE.md at `~/.claude/CLAUDE.md` with your personal preferences.

**Task 2:** Create a project CLAUDE.md for your iOS app (or a test project). Include all sections from the template above.

**Task 3:** Create a local CLAUDE.md in one subdirectory with specific rules for that module.

**Task 4:** Run `claude` and ask it: "What are the coding standards for this project?" Confirm it reads from your CLAUDE.md.

**Task 5:** Add a quality gate: "After every change, run `swift build` and fix any errors." Ask Claude Code to add a function. Confirm it runs the build check automatically.

**Your CLAUDE.md files:**
> _(write here)_

---

## Q&A — Self-Assessment (6 Questions)

---

**Q1.** A project CLAUDE.md says "use 4-space indentation." A developer's global CLAUDE.md says "use 2-space indentation." Which rule does Claude follow, and how does the hierarchy work?

> **Your answer:**
> _(write here)_

---

**Q2.** Your project CLAUDE.md says "don't add third-party dependencies." A new developer joins and asks Claude Code to "add Alamofire for networking." What should Claude Code do?

> **Your answer:**
> _(write here)_

---

**Q3.** Should CLAUDE.md be committed to git? What are the implications of committing vs not committing?

> **Your answer:**
> _(write here)_

---

**Q4.** You want Claude Code to always verify its changes with tests. Write the specific CLAUDE.md instruction that makes this verifiable, and explain why vague instructions like "write good code" fail.

> **Your answer:**
> _(write here)_

---

**Q5.** A CLAUDE.md has 500 lines of detailed rules. Is more always better? What is the risk of an extremely long CLAUDE.md?

> **Your answer:**
> _(write here)_

---

**Q6 — Exam Scenario.** A team of 8 developers uses Claude Code. The team lead wants: (1) everyone follows company Swift standards, (2) each developer can have personal preferences, (3) the payments module has stricter rules than the rest of the app. Design the complete CLAUDE.md hierarchy for this setup.

> **Your answer:**
> _(write here)_

---

## Answer Guide — Claude's Reference Answers

---

**Q1 — Hierarchy resolution: project overrides global**

The **project CLAUDE.md wins** — local → project → global, with more specific overriding less specific.

When Claude Code starts in a project directory:
1. Reads global `~/.claude/CLAUDE.md` — baseline preferences
2. Reads project `./CLAUDE.md` — project rules override global
3. Reads any local `./subdir/CLAUDE.md` in the current working area — most specific wins

For the indentation conflict: project says 4 spaces, global says 2 spaces. In this project, Claude uses 4 spaces. The project rule is more authoritative because it represents team agreement.

**The design principle:** Global is for personal preferences that apply when you have no project-specific instruction. Project is for team standards that everyone must follow. Project always wins over personal preference — otherwise team consistency is impossible.

---

**Q2 — CLAUDE.md says no third-party dependencies**

Claude Code should **not add Alamofire** and should **explain why** to the developer.

The CLAUDE.md is Claude's instruction set. It explicitly prohibits adding third-party dependencies. Claude Code follows this even if the user requests it.

Claude Code's response:
```
I can't add Alamofire — the project's CLAUDE.md specifies:
"Do NOT add third-party dependencies without confirming with the user first."

This likely means the team has a policy requiring approval before adding dependencies.
Options:
1. Ask the team lead for approval, then update CLAUDE.md to allow it
2. I can implement the networking functionality you need using URLSession (built-in)

Which would you prefer?
```

This is a key exam point: CLAUDE.md instructions are enforced by Claude Code the same way system prompt instructions are enforced by the raw API. Users cannot override CLAUDE.md rules by simply asking.

---

**Q3 — Committing CLAUDE.md to git**

**Project CLAUDE.md: YES — always commit.**

Reasons:
- All team members get the same Claude Code behaviour
- Configuration is versioned with the codebase
- New developers automatically get the right setup when they clone
- Changes to Claude's behaviour are tracked and reviewable via git history

**Global CLAUDE.md: NO — never commit.**

It's in `~/.claude/` (your home directory), not in any project. It contains personal preferences. It's machine-specific.

**Local CLAUDE.md in subdirectories:** Depends on purpose.
- If it contains team rules for that module → commit
- If it contains personal notes or WIP instructions → add to `.gitignore`

**Practical tip:** Add this to your project `.gitignore`:
```
# Ignore personal Claude Code notes
**/CLAUDE_PERSONAL.md
```
Use `CLAUDE.md` for team rules (committed) and `CLAUDE_PERSONAL.md` for personal notes (gitignored).

---

**Q4 — Verifiable quality gate instruction**

```markdown
## Quality Gates — REQUIRED Before Marking Any Task Complete

After every code change, you MUST run these commands in order:

1. `swift build` — must exit with code 0 (zero warnings required)
2. `swift test --parallel` — all tests must pass (zero failures)
3. `swiftlint --strict` — zero errors (warnings acceptable)

If any command fails:
- Fix all failures before proceeding
- Do not mark the task complete until all three pass
- Report the fix you made in your summary

NEVER mark a task complete if any quality gate fails.
```

**Why vague instructions fail:** "Write good code" gives Claude no way to verify compliance. Claude cannot introspect whether code is "good" — it can only observe command exit codes and test results. Verifiable instructions are binary: the build either passes or fails. Non-verifiable instructions are probabilistic: Claude might think it wrote good code, but you can't know.

The pattern: **every quality requirement should have a terminal command that verifies it.**

---

**Q5 — Risk of extremely long CLAUDE.md**

A 500-line CLAUDE.md has several risks:

**Risk 1 — Context window consumption:** Claude reads the CLAUDE.md on every session start. 500 lines ≈ 2,000-3,000 tokens consumed before you even type your first command. This leaves less context for the actual task.

**Risk 2 — Attention dilution:** Just like with long system prompts in the API, Claude's attention weakens on instructions buried in the middle of a very long file. Rules on line 400 are less reliably followed than rules on line 10.

**Risk 3 — Contradiction probability:** 500 lines increases the chance of contradictory rules. "Always use early return guards" and "minimize nesting" might give conflicting guidance in specific edge cases.

**Risk 4 — Maintenance burden:** A 500-line CLAUDE.md becomes stale. Rules that were valid 6 months ago may no longer apply. Nobody reads 500 lines carefully before making changes.

**Best practice:** Keep CLAUDE.md under 150 lines. Use concise bullet points. Put the most important rules at the top and bottom (highest attention zones). If you need module-specific rules, use local CLAUDE.md files for that module rather than bloating the project root.

---

**Q6 — Multi-level CLAUDE.md for 8-developer team**

```
Company standards + Project rules + Payments strict rules
↓
~/.claude/CLAUDE.md          ← Each developer's personal file
(not committed, personal)     personal style, preferred verbosity, etc.

/project/CLAUDE.md           ← Committed. All 8 developers inherit.
(committed to git)            Company Swift standards:
                               - 4-space indentation
                               - SwiftDoc on all public funcs
                               - async/await only
                               - No force unwraps
                               - swift test must pass before done
                               
/project/Sources/Payments/CLAUDE.md  ← Committed. Stricter rules.
(committed to git)                     Additional requirements:
                                       - All changes need 2-person code review note
                                       - Never log payment data (even for debug)
                                       - All functions must have error handling
                                       - Stricter test coverage: every branch tested
                                       - Do NOT modify without mentioning to team lead
                                       - PCI compliance: no card numbers in variables
```

**The design:**
- Company standards go in the project root CLAUDE.md (inherited by all)
- The payments module gets additional stricter constraints via local CLAUDE.md
- Personal preferences stay in global (not shared, not committed)
- Developers can't override team standards with their global file (project wins over global)

The payments CLAUDE.md doesn't replace the project CLAUDE.md — it adds to it. Claude follows both: project rules + payments rules when working in the payments directory.

---

## Status

- [ ] Global CLAUDE.md created
- [ ] Project CLAUDE.md created with all sections
- [ ] Local CLAUDE.md created for one module
- [ ] Claude Code reads CLAUDE.md verified
- [ ] Quality gate tested
- [ ] All 6 questions answered
- [ ] Answer guide reviewed

---

## Coming Up — Week 9, Day 3

**Topic:** Slash Commands & .claude/commands/
Create reusable commands for repetitive tasks. Understand project vs personal commands. Version-control your Claude Code workflows.

---

*CCA Self-Study Log · Asif · Phase 4 of 5 · Week 9 of 12*
