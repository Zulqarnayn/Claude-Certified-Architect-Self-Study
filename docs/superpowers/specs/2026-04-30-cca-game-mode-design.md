# CCA Game Mode Design

## Summary

Add a separate GitHub Pages-safe study tracker page for the existing Claude Certified Architect self-study site. The tracker will live outside the markdown home page, link back to existing lesson notes, and provide a gamified progress system without introducing any backend or paid dependency.

## Goals

- Add a dedicated `Game Mode` or `Study Tracker` page reachable from the home page.
- Track progress across the canonical curriculum lesson set surfaced on the home page, with persistent client-side state.
- Make progress visible through XP, levels, gem counts, streaks, and domain mastery.
- Keep implementation static so it works on GitHub Pages.
- Preserve current markdown study hub as the canonical content index.

## Non-Goals

- No server-side storage or authentication.
- No Claude API integration.
- No adaptive quiz engine in v1.
- No flashcard duel system in v1.
- No boss-battle exam mechanics in v1 beyond status handling for mock exam lessons.

## Repo Context

- Site is already structured as a GitHub Pages/Jekyll-style static site.
- Current home page lives in `index.md` and contains week-by-week lesson tables.
- Existing lesson content is already present as markdown files in repo root, including some paired quick/deep or practice/reference files.
- Tracker should use an explicit curated lesson catalog rather than infer lessons from every root markdown file.
- Existing styling is minimal and theme-based via `assets/css/style.scss`.

## User Experience

### Entry Point

Home page adds a visible link to a separate tracker page. Recommended path is `tracker/index.html`, linked as `./tracker/`.

### Page Structure

Tracker page contains five main areas:

1. Header dashboard with level title, total XP, XP progress bar, current streak, and weekly completion summary.
2. Gem inventory panel showing all gem types and current counts.
3. Domain mastery panel showing five domain progress bars.
4. Lesson grid grouped by week, with each lesson card linking to its markdown note.
5. Utility controls for reset and future import/export expansion.

### Visual Direction

Tracker should feel like a compact study command center rather than a toy game or marketing page. It can use a stronger visual identity than the existing home page, but it should stay dense, legible, and calm enough for daily use. Theme should follow user-preferred direction at implementation time.

### Lesson Cards

Each lesson card shows:

- lesson ID
- lesson title
- domain badge
- current state
- XP potential or earned status
- direct link to source lesson note
- controls for state transitions

Cards are grouped by week and may be collapsible if scanning gets noisy.

## Information Architecture

### Lesson Catalog

Tracker uses one static lesson catalog defined in JavaScript. This catalog should mirror the canonical curriculum entries intentionally chosen for tracking, rather than all markdown files in repo root. Each record contains:

- `id`
- `title`
- `week`
- `day`
- `href`
- `domain`
- `xpValue` or status-based XP mapping
- `isMockExam` flag where relevant

This catalog is read-only and ships with page.

### User State

Persistent user state lives in `localStorage` and stores only mutable progress data:

- per-lesson state
- streak metadata
- last study date
- schema version

Derived values are not stored as source of truth.

### Derived Stats

App recomputes these on load and after every update:

- total XP
- current level
- gem counts
- weekly completion
- mastery by domain
- studied/completed/mastered totals

This prevents counter drift and makes reset/recovery logic simpler.

## Progression Rules

### Lesson States

Each lesson supports:

- `not_started`
- `studied`
- `completed`
- `mastered`

### State Meaning

- `studied`: lesson reviewed
- `completed`: lesson plus associated task or note work completed
- `mastered`: available only after `completed`, confirmed by user with a brief mastery confirmation step

For mock exam lessons, mastery confirmation text should explicitly reference reaching at least 80 percent.

### XP Model

Initial v1 XP values:

- `studied`: 25 XP
- `completed`: 75 XP
- `mastered`: 125 XP

XP is awarded by highest achieved lesson state, not cumulatively stacked across all prior states unless implementation deliberately models it that way. Recommended rule for v1: each lesson contributes XP based on its final state only. This keeps scoring easy to reason about and prevents inflated totals.

### Levels

Use named levels aligned with CCA subject matter:

1. Prompt Sender
2. API Caller
3. Tool Builder
4. Agent Crafter
5. MCP Architect
6. Multi-Agent Designer
7. Claude Certified Architect

Level thresholds should be encoded in one config object for easy tuning.

### Gems

V1 gem rules:

- Knowledge Gem: lesson reaches `completed`
- Architect Gem: lesson reaches `mastered`
- Streak Gem: streak milestones
- Battle Gem: mock exam lesson reaches qualifying mastery
- Master Gem: all lessons in a week reach `completed` or above

Builder Gem is intentionally deferred until tracker has explicit build-task semantics.

## Domain Mastery

Tracker models five domains:

- Agentic
- MCP
- Claude Code
- Prompting
- Context

Each lesson maps to one primary domain. Domain mastery is derived from achieved lesson states and normalized to a percentage. For v1, use horizontal progress bars instead of a radar chart because bars are easier to read, simpler to build, and more robust on mobile.

## Architecture

### Files

Expected implementation shape:

- `tracker/index.html`
- `tracker/tracker.css`
- `tracker/tracker.js`

Optional later extraction:

- `tracker/lessons.js` or `tracker/lessons.json`

### Runtime

Vanilla JavaScript is sufficient. No framework required. This keeps GitHub Pages deployment simple and avoids build tooling churn in a content-oriented repo.

### Rendering Model

Page initializes by:

1. loading lesson catalog
2. loading persisted state
3. normalizing or migrating state
4. computing derived stats
5. rendering dashboard and lesson grid
6. attaching event handlers for lesson actions and reset control

After user actions, app updates stored lesson state, recomputes derived totals, then re-renders relevant UI.

## Persistence and Recovery

### Local Storage

Use one namespaced storage key for tracker state. Store schema version alongside payload.

### Migration

If stored schema version does not match current version:

- attempt minimal migration if shape differences are known
- otherwise discard invalid state and start fresh

### Failure Handling

If `localStorage` is unavailable or corrupted:

- show non-blocking warning banner
- continue with in-memory empty state for current session
- avoid breaking lesson navigation

### Reset

Reset control clears tracker progress only. It must never affect markdown lesson files or any other repo content.

## Interaction Details

### State Changes

Recommended controls:

- `Studied`
- `Completed`
- `Mastered`

`Mastered` requires a confirmation prompt or compact modal. It should be unavailable until lesson is `completed`.

### Weekly Overview

Each week section shows:

- number of lessons completed
- number mastered
- week completion percent
- whether Master Gem earned

### Links

Lesson cards link to existing lesson markdown files using relative paths that work on GitHub Pages.

## Accessibility and Responsiveness

- Layout must work on desktop and mobile widths.
- Text must remain readable in compact cards.
- Buttons must be keyboard reachable.
- Color alone should not carry all state meaning.
- Progress labels should include visible numeric text where helpful.

## Testing Strategy

### Manual Verification

Verify:

- page loads from local static preview and GitHub Pages-relative paths
- every lesson link opens correct markdown note
- state transitions update cards and summary panels correctly
- reload preserves progress
- reset clears state cleanly
- malformed storage does not break page
- mobile layout remains usable

### Risk Areas

- relative path mistakes between tracker page and root lesson files
- inconsistent domain mapping across canonical tracked lessons
- XP or gem drift if derived-stat logic is mixed with incremental mutation
- overly noisy visual styling that conflicts with practical study use

## Rollout

Initial release should:

1. add tracker page
2. add home-page link
3. support all current lessons
4. persist progress locally

Future iterations can add:

- export/import
- flashcards
- mock exam battle framing
- animated gem unlock moments
- mini tracker summary on home page

## Open Decisions Already Resolved

- host on GitHub Pages: yes
- tracker as separate page: yes
- include all lessons in v1: yes
- use user-preferred theme: yes
- use mastery bars instead of radar chart in v1: yes
- `mastered` is self-assessed but gated behind completion and confirmation: yes

## Implementation Boundary

This design is intentionally scoped to one static tracker experience that wraps existing study content. It should not restructure the lesson markdown files, change current study content, or introduce build tooling beyond what repo already uses.
