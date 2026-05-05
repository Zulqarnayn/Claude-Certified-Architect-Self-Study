---
layout: default
title: CCA Self-Study — Week 9, Day 1
---

# CCA Self-Study — Week 9, Day 1
## What Is Claude Code?

**Date completed:** _____________
**Study time:** 45 mins
**Curriculum phase:** Phase 4 — Claude Code & Workflows
**Exam domain:** Domain 3 · Claude Code Configuration & Workflows (20%)

---

## Core Concept

Claude Code is a command-line tool (CLI) that gives Claude direct access to your codebase — it can read files, write and edit code, run terminal commands, execute tests, and interact with git. Instead of copying and pasting code into a chat window, Claude Code lives inside your project and acts as an AI pair programmer with full filesystem access.

For the CCA exam, Claude Code represents Domain 3 (20% of the exam). You need to understand: installation, configuration via CLAUDE.md, slash commands, CI/CD integration, and how Claude Code differs architecturally from the raw API.

---

## The Analogy — A Contractor With Keys to Your House

When you use claude.ai to help with code, it's like calling a contractor on the phone and reading them your code over the phone. They give advice, you implement it.

Claude Code is like giving that contractor keys to your house and letting them work directly. They can walk through every room (every file), move furniture (edit code), test the plumbing (run tests), and report back what they found — all without you having to describe everything to them over the phone.

The power is direct access. The responsibility is knowing which rooms to let them into.

---

## How Claude Code Works Architecturally

```
Your Terminal
     ↓
Claude Code CLI
     ↓ reads your files
     ↓ runs your commands
     ↓
Anthropic API (Claude Sonnet)
     ↓
Response + tool calls
(read_file, write_file, bash, etc.)
     ↓
Claude Code executes them
     ↓
Results shown in terminal
```

Claude Code is an **agentic loop** (Week 7) running in your terminal. The "tools" are filesystem operations and shell commands. The loop continues until Claude determines the task is done or you press Ctrl+C.

---

## Installation and First Run

```bash
# Install globally via npm
npm install -g @anthropic-ai/claude-code

# Verify installation
claude --version

# Run in your project directory
cd ~/your-ios-project
claude

# You'll see the Claude Code prompt:
# ✻ Welcome to Claude Code!
# > _
```

### What Happens on First Run

1. Claude Code reads your project structure (files and directories)
2. It looks for a `CLAUDE.md` file (your project configuration — covered in D3)
3. It enters the interactive loop waiting for your task

### Your First Task

```bash
# Start Claude Code
claude

# Ask it to explore your codebase
> Explain the overall architecture of this project

# Ask it to make a change
> Add error handling to the network layer

# Ask it to run tests
> Run the test suite and summarise any failures
```

---

## Claude Code vs Raw API — Key Differences

| Dimension | Raw API | Claude Code |
|---|---|---|
| Where it runs | Your server code | Your terminal |
| File access | You pass content in prompts | Direct filesystem read/write |
| Command execution | You execute, pass results | Claude Code executes directly |
| Memory | You manage messages array | Claude Code manages it |
| Use case | Building products | Developer productivity |
| Configuration | System prompts in code | CLAUDE.md files |
| Slash commands | Not applicable | Custom /commands |
| CI/CD | You integrate manually | Built-in `--no-interactive` flag |

**Critical exam point:** Claude Code is a developer tool for building and maintaining software. The raw API is for building products that use Claude. You use Claude Code to build with, and you use the API to build for.

---

## Built-In Tools Claude Code Has

Claude Code comes with these tools pre-configured — you don't define them:

| Tool | What it does |
|---|---|
| `read_file` | Read any file in your project |
| `write_file` | Create or overwrite a file |
| `edit_file` | Make targeted edits to specific lines |
| `bash` | Execute shell commands (git, npm, python, etc.) |
| `list_directory` | See directory structure |
| `search_files` | Search for text patterns across files |
| `web_fetch` | Fetch content from URLs |

This is why Claude Code is so powerful for coding tasks — it doesn't need you to copy-paste. It reads the source directly.

---

## Modes of Operation

### Interactive Mode (default)
You type tasks, Claude responds, continues working until done.

```bash
claude
> Refactor the authentication module to use async/await
# Claude reads files, makes changes, runs tests, shows results
```

### Non-Interactive Mode (for automation)
Pass a task directly, Claude runs to completion and exits.

```bash
claude --no-interactive "Run all tests and fix any failures"

# Or pipe input
echo "Generate JSDoc comments for all public functions" | claude --no-interactive
```

### Print Mode (output only)
Returns Claude's response without executing — useful for review.

```bash
claude --print "What are the main security risks in this codebase?"
```

---

## Understanding Permissions and Safety

Claude Code asks for permission before taking certain actions:

```
Claude wants to:
  - Edit: src/auth/login.swift
  - Run: swift test

Allow? [y/n/always/never]
```

Permission levels:
- **`y`** — allow this one time
- **`n`** — deny this one time
- **`always`** — always allow this type of action
- **`never`** — never allow this type of action

You can pre-configure permissions in CLAUDE.md to avoid repeated prompts in trusted projects.

---

## Claude Code in Your iOS Project Context

Since you've been building iOS apps with Swift, here's what Claude Code looks like in your workflow:

```bash
# In your iOS project
claude

# Ask it to review your current code
> Review ContentView.swift for SwiftUI best practices

# Ask it to add a feature
> Add a dark mode toggle to the settings screen

# Ask it to fix a bug
> The photo picker crashes on iOS 16. Find and fix it.

# Ask it to write tests
> Write XCTest unit tests for the UserViewModel

# Ask it to explain unfamiliar code
> Explain what the combine pipeline in NetworkManager.swift does
```

Claude Code reads your actual Swift files, understands your existing architecture, and makes targeted edits — no copy-pasting.

---

## Key Concepts Learned Today

| Term | Definition |
|---|---|
| Claude Code CLI | Command-line tool that gives Claude filesystem and shell access |
| Interactive mode | Claude Code runs in a terminal session, waiting for tasks |
| Non-interactive mode | Claude Code runs a task to completion and exits (for automation) |
| Built-in tools | Pre-configured tools for file I/O and shell commands (no definition needed) |
| Permission system | Claude Code asks before modifying files or running commands |
| CLAUDE.md | Project configuration file that Claude Code always reads (covered in D3) |

---

## Hands-On Task 🛠️

**Task 1:** Install Claude Code: `npm install -g @anthropic-ai/claude-code`

**Task 2:** Create a small test project (or use an existing one). Run `claude` in it. Ask it to explain the project structure.

**Task 3:** Ask Claude Code to add a simple feature. Watch how it reads files, proposes changes, and waits for permission.

**Task 4:** Try non-interactive mode: `claude --no-interactive "List all functions longer than 50 lines"`. Observe the output format.

**Task 5:** Compare the experience to using claude.ai for the same task. Note what's easier, what's harder.

**Your observations:**
> _(write here)_

---

## Q&A — Self-Assessment (6 Questions)

---

**Q1.** A developer says "I'll just use claude.ai to help with my coding — it's the same as Claude Code." What can Claude Code do that claude.ai cannot, and why does this matter for a developer's workflow?

> **Your answer:**
> _(write here)_

---

**Q2.** Claude Code uses the same Claude model (Sonnet) as the raw API. If the underlying model is the same, what makes Claude Code more effective for coding tasks than pasting code into a chat window?

> **Your answer:**
> _(write here)_

---

**Q3.** You run Claude Code in `--no-interactive` mode in a CI/CD pipeline. A test fails and Claude Code tries to fix it. Should Claude Code have permission to modify source files in CI/CD? Design the permission strategy.

> **Your answer:**
> _(write here)_

---

**Q4.** Claude Code reads your entire project before responding. Your project has 200 Swift files totalling 50,000 lines. What is the context window implication, and how does Claude Code handle projects larger than its context window?

> **Your answer:**
> _(write here)_

---

**Q5.** You're working on a feature branch. You ask Claude Code to "implement the new checkout flow." It makes changes across 8 files. You review the changes and want to revert 3 of them. How does Claude Code's git integration help here?

> **Your answer:**
> _(write here)_

---

**Q6 — Architect Scenario.** Your team of 5 iOS developers all use Claude Code. Each developer has different coding standards preferences (tabs vs spaces, naming conventions). The team lead wants consistent Claude Code behaviour across all developers. What mechanism does Claude Code provide for this, and how would you implement it?

> **Your answer:**
> _(write here)_

---

## Answer Guide — Claude's Reference Answers

---

**Q1 — Claude Code vs claude.ai for coding**

**What Claude Code can do that claude.ai cannot:**

1. **Direct file reading:** Claude Code reads your actual source files. With claude.ai, you copy-paste code snippets — often missing context from other files.

2. **Multi-file understanding:** Claude Code can read 20 interdependent files simultaneously to understand how they work together. With claude.ai, you can only share what you paste.

3. **Direct file writing:** Claude Code makes edits directly to your files. With claude.ai, you copy its suggestions and paste them yourself.

4. **Run commands:** Claude Code can run `swift test`, `git diff`, `xcodebuild` and see the actual output. With claude.ai, you run commands yourself and paste results back.

5. **Iterative testing:** Claude Code can write code, run tests, see failures, fix code, run again — all in one loop. With claude.ai, each iteration requires you to manually paste, run, paste results.

**Why this matters for workflow:** A 10-minute task with claude.ai (paste code, get suggestion, copy to editor, run tests, paste failures, get fix, copy to editor, run tests) takes 2 minutes with Claude Code (describe task, watch it work). The productivity multiplier for complex refactoring or debugging tasks is 5-10x.

---

**Q2 — Same model, different effectiveness**

The model is the same but the **tool set and context are dramatically different.**

With chat:
- Context: only what you copy-paste (often incomplete)
- Tools: none — Claude can only suggest, not act
- You: relay text back and forth manually

With Claude Code:
- Context: entire project structure, any file on demand
- Tools: read_file, write_file, bash, search_files — Claude acts directly
- Claude: reads the actual code, runs actual tests, sees actual errors

The effectiveness difference isn't the model — it's that Claude Code gives the model **complete information** (actual files, not excerpts) and **agency** (can execute, not just suggest). A brilliant consultant with full project access and the ability to make changes is more effective than the same consultant limited to reading notes you've written about the project.

---

**Q3 — CI/CD permission strategy**

**Yes, Claude Code should have modify permissions in CI/CD — but scoped carefully.**

In a CI/CD context, Claude Code is running automatically without a human to approve each change. The permission strategy must balance automation with safety:

```yaml
# .github/workflows/claude-fix.yml
- name: Claude Code auto-fix
  run: |
    claude --no-interactive \
           --allow-writes "src/**" \    # Allow writes in src directory only
           --deny-writes "*.lock" \     # Never modify lock files
           --deny-writes "*.pem" \      # Never touch certificates
           --deny-bash "rm -rf*" \      # Block dangerous shell commands
           "Fix failing tests and lint errors. Do not change test assertions."
```

**Principles:**
- **Scope writes:** Only allow Claude to write to source directories, never to deployment configs, credentials, or infrastructure files
- **Deny dangerous commands:** Block `rm`, `git push`, deployment commands
- **Limit scope of changes:** System prompt says what Claude is allowed to change
- **Always create a PR:** Never push directly to main — Claude Code creates a branch, makes changes, opens a PR for human review
- **Run in sandbox:** If possible, run on a clean checkout that's discarded if the PR isn't approved

---

**Q4 — Large project and context window**

Claude Code does NOT read all 200 files upfront. It uses **selective reading** — it reads the directory structure first, then reads specific files on demand as the task requires them.

```
Initial scan:
- Read file tree (small: file names and structure)
- Read CLAUDE.md if exists
- Read the specific file you mentioned

As task unfolds:
- read_file("ContentView.swift") when it needs to understand the UI
- read_file("NetworkManager.swift") when investigating networking
- etc.
```

For projects larger than the context window, Claude Code uses search to find relevant files rather than reading everything: `search_files("authentication")` returns only files matching the query.

**The practical limit:** Very large codebases (500k+ lines) will challenge Claude Code — it can't hold everything in context simultaneously. For these, you work in focused sessions: "Focus on the authentication module" rather than "understand the entire codebase."

**Exam point:** Claude Code handles large codebases through selective reading and search, not by loading everything at once.

---

**Q5 — Reverting specific Claude Code changes**

Claude Code creates normal git commits for its changes. When Claude Code modifies 8 files, those changes appear as unstaged or staged modifications in your working directory.

**Your options:**

1. **Review before committing:** Claude Code shows diffs before making changes. Review each file's proposed change and approve selectively.

2. **Git checkout specific files:** After Claude Code commits: `git checkout HEAD -- path/to/file.swift` for the 3 files you want to revert.

3. **Interactive git reset:** `git add -p` to selectively stage only the changes you want to keep.

4. **Claude Code undo:** In some versions, `/undo` in Claude Code reverses the last change.

**Best practice for this workflow:** Before asking Claude Code to implement across many files, ask it to `plan` first: "List which files you'd need to modify to implement the checkout flow." Review the plan, refine the scope, then execute. This reduces the need for selective reverts.

---

**Q6 — Team-wide consistency**

The mechanism is **CLAUDE.md at the project root**, combined with **global CLAUDE.md** in `~/.claude/CLAUDE.md`.

```
Project structure:
├── .claude/
│   └── settings.json       # Shared project permissions
├── CLAUDE.md               # Project-level rules (committed to git)
└── src/

Global (per-developer, not committed):
~/.claude/CLAUDE.md         # Personal preferences
```

**Team lead's CLAUDE.md (committed to git — all developers inherit):**

```markdown
# AcmeCorp iOS Project — Claude Code Configuration

## Coding Standards
- Always use 4 spaces for indentation (no tabs)
- All new functions must have SwiftDoc comments
- Variable names: camelCase for variables, PascalCase for types
- Never force unwrap (!) — use guard let or if let

## Architecture Rules
- New ViewModels must conform to ObservableObject
- Network calls must go through NetworkManager, never directly
- All errors must be handled — no empty catch blocks

## Testing
- Every new public function must have a corresponding test
- Test names: test_[function]_[scenario]_[expectedResult]

## What Claude Should Not Do
- Do not modify Package.swift
- Do not modify .xcconfig files
- Do not add third-party dependencies without mentioning it first
```

Every developer who runs `claude` in the project directory gets these rules automatically. The team lead maintains this file in git. Individual developers can have personal preferences in their global `~/.claude/CLAUDE.md` for things that don't affect the team (like preferred code explanation style).

---

## Status

- [ ] Claude Code installed
- [ ] First run completed in a project
- [ ] Interactive session tested
- [ ] Non-interactive mode tested
- [ ] Comparison to claude.ai completed
- [ ] All 6 questions answered
- [ ] Answer guide reviewed

---

## Coming Up — Week 9, Day 2

**Topic:** Installing & First Run — Deep Dive
Node.js version requirements, configuration files, understanding what Claude Code can see in your project, and setting up your first meaningful coding session.

---

*CCA Self-Study Log · Asif · Phase 4 of 5 · Week 9 of 12*
