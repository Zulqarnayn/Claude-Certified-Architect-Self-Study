# CCA Game Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a separate GitHub Pages-safe tracker page that gamifies the existing CCA study hub with local progress, XP, gems, streaks, and domain mastery.

**Architecture:** Use a standalone `tracker/` page with vanilla HTML, CSS, and one browser module. Keep canonical lesson data in a static in-file catalog derived from the existing home-page curriculum entries, store mutable progress in `localStorage`, and derive all summary stats on render to avoid drift.

**Tech Stack:** GitHub Pages, Jekyll-hosted static files, vanilla JavaScript ES modules, Node built-in test runner, Markdown home page, CSS

---

## File Map

- Create: `tracker/index.html`
- Create: `tracker/tracker.css`
- Create: `tracker/tracker.js`
- Create: `tests/tracker/tracker.test.js`
- Modify: `index.md`

### File Responsibilities

- `tracker/index.html`: app shell, semantic regions, script/style includes, no inline logic
- `tracker/tracker.css`: tracker-only visual system, responsive layout, state styles
- `tracker/tracker.js`: lesson catalog, domain config, pure derivation helpers, storage helpers, DOM rendering, event wiring
- `tests/tracker/tracker.test.js`: Node tests for catalog shape, stat derivation, storage normalization, render helpers
- `index.md`: add visible tracker link near top of home page

### Shared Constants To Use

```js
export const STORAGE_KEY = "cca-game-mode.v1";

export const LESSON_STATES = {
  NOT_STARTED: "not_started",
  STUDIED: "studied",
  COMPLETED: "completed",
  MASTERED: "mastered",
};

export const XP_BY_STATE = {
  [LESSON_STATES.NOT_STARTED]: 0,
  [LESSON_STATES.STUDIED]: 25,
  [LESSON_STATES.COMPLETED]: 75,
  [LESSON_STATES.MASTERED]: 125,
};

export const LEVELS = [
  { title: "Prompt Sender", minXp: 0 },
  { title: "API Caller", minXp: 500 },
  { title: "Tool Builder", minXp: 1500 },
  { title: "Agent Crafter", minXp: 3500 },
  { title: "MCP Architect", minXp: 7000 },
  { title: "Multi-Agent Designer", minXp: 12000 },
  { title: "Claude Certified Architect", minXp: 20000 },
];

export const DOMAIN_BY_WEEK = {
  1: "context",
  2: "prompting",
  3: "prompting",
  4: "context",
  5: "agentic",
  6: "mcp",
  7: "agentic",
  8: "agentic",
  9: "claude_code",
  10: "agentic",
  11: "agentic",
  12: "agentic",
};

export const DOMAIN_LABELS = {
  agentic: "Agentic",
  mcp: "MCP",
  claude_code: "Claude Code",
  prompting: "Prompting",
  context: "Context",
};
```

### Canonical Lesson Catalog To Encode

Use this exact 50-entry curriculum set from the existing home page and README:

```js
export const LESSONS = [
  { id: "W1-D1", week: 1, day: 1, title: "LLMs Explained From Scratch", href: "../W1-D1_LLMs_Explained_From_Scratch.md", isMockExam: false },
  { id: "W1-D2", week: 1, day: 2, title: "Claude vs Other AI Models", href: "../W1-D2_Claude_vs_Other_AI_Models.md", isMockExam: false },
  { id: "W1-D3", week: 1, day: 3, title: "The Context Window", href: "../W1-D3_The_Context_Window.md", isMockExam: false },
  { id: "W1-D4", week: 1, day: 4, title: "System Prompts vs User Messages", href: "../W1-D4_System_Prompts_vs_User_Messages.md", isMockExam: false },
  { id: "W1-D5", week: 1, day: 5, title: "Your First API Call", href: "../W1-D5_Your_First_API_Call.md", isMockExam: false },
  { id: "W2-D1", week: 2, day: 1, title: "What Makes a Good Prompt", href: "../W2-D1_What_Makes_a_Good_Prompt.md", isMockExam: false },
  { id: "W2-D2", week: 2, day: 2, title: "Role Prompting and Persona", href: "../W2-D2_Role_Prompting_and_Persona.md", isMockExam: false },
  { id: "W2-D3", week: 2, day: 3, title: "Chain of Thought Prompting", href: "../W2-D3_Chain_of_Thought_Prompting.md", isMockExam: false },
  { id: "W2-D4", week: 2, day: 4, title: "Negative Prompting", href: "../W2-D4_Negative_Prompting.md", isMockExam: false },
  { id: "W2-D5", week: 2, day: 5, title: "Prompt Iteration Practice", href: "../W2-D5_Prompt_Iteration_Practice.md", isMockExam: false },
  { id: "W3-D1", week: 3, day: 1, title: "Few Shot Examples", href: "../W3-D1_Few_Shot_Examples.md", isMockExam: false },
  { id: "W3-D2", week: 3, day: 2, title: "Structured Output JSON Basics", href: "../W3-D2_Structured_Output_JSON_Basics.md", isMockExam: false },
  { id: "W3-D3", week: 3, day: 3, title: "JSON Schema Enforcement", href: "../W3-D3_JSON_Schema_Enforcement.md", isMockExam: false },
  { id: "W3-D4", week: 3, day: 4, title: "Validation & Retry Loops", href: "../W3-D4_Validation_and_Retry_Loops.md", isMockExam: false },
  { id: "W3-D5", week: 3, day: 5, title: "When NOT to Use Structured Output", href: "../W3-D5_When_NOT_to_Use_Structured_Output.md", isMockExam: false },
  { id: "W4-D1", week: 4, day: 1, title: "Messages API Anatomy", href: "../W4-D1_Messages_API_Anatomy.md", isMockExam: false },
  { id: "W4-D2", week: 4, day: 2, title: "Multi-Turn Conversations", href: "../W4-D2_Multi_Turn_Conversations.md", isMockExam: false },
  { id: "W4-D3", week: 4, day: 3, title: "Streaming Responses", href: "../W4-D3_Streaming_Responses.md", isMockExam: false },
  { id: "W4-D4", week: 4, day: 4, title: "Token Counting & Cost", href: "../W4-D4_Token_Counting_and_Cost.md", isMockExam: false },
  { id: "W4-D5", week: 4, day: 5, title: "Rate Limits & Error Handling", href: "../W4-D5_Rate_Limits_and_Error_Handling.md", isMockExam: false },
  { id: "W5-D1", week: 5, day: 1, title: "Multi-Agent Systems", href: "../W5-D1_Multi_Agent_Systems.md", isMockExam: false },
  { id: "W5-D2", week: 5, day: 2, title: "Agent Reliability and Testing", href: "../W5-D2_Agent_Reliability_and_Testing.md", isMockExam: false },
  { id: "W5-D3", week: 5, day: 3, title: "Retrieval Augmented Generation", href: "../W5-D3_Retrieval_Augmented_Generation.md", isMockExam: false },
  { id: "W5-D4", week: 5, day: 4, title: "Fine-Tuning Considerations", href: "../W5-D4_Fine_Tuning_Considerations.md", isMockExam: false },
  { id: "W5-D5", week: 5, day: 5, title: "Cost Optimization at Scale", href: "../W5-D5_Cost_Optimization_at_Scale.md", isMockExam: false },
  { id: "W6-D1", week: 6, day: 1, title: "Real-World Application Architecture", href: "../W6-D1_Real_World_Application_Architecture.md", isMockExam: false },
  { id: "W6-D2", week: 6, day: 2, title: "Security and Compliance", href: "../W6-D2_Security_and_Compliance.md", isMockExam: false },
  { id: "W6-D3", week: 6, day: 3, title: "Analytics and Observability", href: "../W6-D3_Analytics_and_Observability.md", isMockExam: false },
  { id: "W6-D4", week: 6, day: 4, title: "A/B Testing and Experimentation", href: "../W6-D4_A_B_Testing_and_Experimentation.md", isMockExam: false },
  { id: "W6-D5", week: 6, day: 5, title: "Case Studies and Synthesis", href: "../W6-D5_Case_Studies_and_Synthesis.md", isMockExam: false },
  { id: "W7-D1", week: 7, day: 1, title: "Evaluation Frameworks", href: "../W7-D1_Evaluation_Frameworks.md", isMockExam: false },
  { id: "W7-D2", week: 7, day: 2, title: "Human-in-the-Loop Systems", href: "../W7-D2_Human_in_the_Loop_Systems.md", isMockExam: false },
  { id: "W7-D3", week: 7, day: 3, title: "Prompt Lifecycle Management", href: "../W7-D3_Prompt_Lifecycle_Management.md", isMockExam: false },
  { id: "W7-D4", week: 7, day: 4, title: "Cross-Model Validation", href: "../W7-D4_Cross_Model_Validation.md", isMockExam: false },
  { id: "W7-D5", week: 7, day: 5, title: "Deployment and Rollout Strategy", href: "../W7-D5_Deployment_and_Rollout_Strategy.md", isMockExam: false },
  { id: "W8-D1", week: 8, day: 1, title: "Why Multiple Agents", href: "../W8-D1_Why_Multiple_Agents.md", isMockExam: false },
  { id: "W8-D2", week: 8, day: 2, title: "Hub-and-Spoke Architecture", href: "../W8-D2_Hub_and_Spoke_Architecture.md", isMockExam: false },
  { id: "W8-D3", week: 8, day: 3, title: "Context Isolation Deep Dive", href: "../W8-D3_Context_Isolation_Deep_Dive.md", isMockExam: false },
  { id: "W8-D4", week: 8, day: 4, title: "Lifecycle Hooks and Guardrails", href: "../W8-D4_Lifecycle_Hooks_and_Guardrails.md", isMockExam: false },
  { id: "W8-D5", week: 8, day: 5, title: "Build Hub-and-Spoke System", href: "../W8-D5_Build_Hub_and_Spoke_System.md", isMockExam: false },
  { id: "W9-D1", week: 9, day: 1, title: "What Is Claude Code", href: "../W9-D1_What_Is_Claude_Code.md", isMockExam: false },
  { id: "W9-D2", week: 9, day: 2, title: "CLAUDE.md: The Config File", href: "../W9-D2_CLAUDE_md_The_Config_File.md", isMockExam: false },
  { id: "W9-D3", week: 9, day: 3, title: "Slash Commands and .claude/commands/", href: "../W9-D3_Slash_Commands_and_claude_commands.md", isMockExam: false },
  { id: "W9-D4", week: 9, day: 4, title: "Claude Code in CI/CD", href: "../W9-D4_Claude_Code_in_CICD.md", isMockExam: false },
  { id: "W9-D5", week: 9, day: 5, title: "Prompt Caching", href: "../W9-D5_Prompt_Caching.md", isMockExam: false },
  { id: "W10-D1", week: 10, day: 1, title: "Handoff Patterns", href: "../W10-D1_Handoff_Patterns.md", isMockExam: false },
  { id: "W10-D2", week: 10, day: 2, title: "Confidence Calibration", href: "../W10-D2_Confidence_Calibration.md", isMockExam: false },
  { id: "W11-D1", week: 11, day: 1, title: "Exam Scenario 1: Customer Support", href: "../W11-D1_Exam_Scenario_1_Customer_Support.md", isMockExam: false },
  { id: "W11-D2", week: 11, day: 2, title: "Exam Scenario 2: Code Generation", href: "../W11-D2_Exam_Scenario_2_Code_Generation.md", isMockExam: false },
  { id: "W12-D1", week: 12, day: 1, title: "Full Mock Exam: 60 Questions", href: "../W12-D1_Full_Mock_Exam_60_Questions.md", isMockExam: true },
].map((lesson) => ({
  ...lesson,
  domain: DOMAIN_BY_WEEK[lesson.week],
}));
```

### Commands To Prefer During Implementation

- Unit tests: `node --test tests/tracker/tracker.test.js`
- Syntax check: `node --check tracker/tracker.js`
- Static preview: `ruby -run -e httpd . -p 4000`

### Task 1: Build Tracker Core Model and Failing Tests

**Files:**
- Create: `tracker/tracker.js`
- Create: `tests/tracker/tracker.test.js`

- [ ] **Step 1: Write failing tests for catalog, normalization, XP, levels, and derived stats**

```js
import test from "node:test";
import assert from "node:assert/strict";

import {
  LESSONS,
  LESSON_STATES,
  normalizeProgress,
  getLevelForXp,
  deriveStats,
} from "../../tracker/tracker.js";

test("catalog contains 50 canonical lessons with unique ids", () => {
  assert.equal(LESSONS.length, 50);
  assert.equal(new Set(LESSONS.map((lesson) => lesson.id)).size, 50);
  assert.ok(LESSONS.every((lesson) => lesson.href.startsWith("../")));
  assert.equal(LESSONS.at(-1).id, "W12-D1");
});

test("normalizeProgress sanitizes invalid states", () => {
  const normalized = normalizeProgress({
    schemaVersion: 1,
    lastStudyDate: "2026-04-30",
    lessons: {
      "W1-D1": "completed",
      "W1-D2": "broken",
    },
  });

  assert.equal(normalized.lessons["W1-D1"], LESSON_STATES.COMPLETED);
  assert.equal(normalized.lessons["W1-D2"], LESSON_STATES.NOT_STARTED);
});

test("getLevelForXp returns current and next level metadata", () => {
  const level = getLevelForXp(1600);
  assert.equal(level.current.title, "Tool Builder");
  assert.equal(level.next.title, "Agent Crafter");
});

test("deriveStats recomputes xp, gems, weeks, and mastery from lesson states", () => {
  const progress = normalizeProgress({
    schemaVersion: 1,
    lastStudyDate: "2026-04-30",
    lessons: {
      "W1-D1": "studied",
      "W1-D2": "completed",
      "W1-D3": "mastered",
      "W12-D1": "mastered",
    },
  });

  const stats = deriveStats(LESSONS, progress, "2026-04-30");

  assert.equal(stats.totalXp, 25 + 75 + 125 + 125);
  assert.equal(stats.gems.knowledge, 3);
  assert.equal(stats.gems.architect, 2);
  assert.equal(stats.gems.battle, 1);
  assert.equal(stats.currentStreak, 1);
  assert.ok(stats.domainMastery.context > 0);
  assert.ok(stats.domainMastery.agentic > 0);
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `node --test tests/tracker/tracker.test.js`  
Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `../../tracker/tracker.js`

- [ ] **Step 3: Write `tracker/tracker.js` using shared constants and full `LESSONS` catalog from this plan, plus these core functions**

```js
export const STORAGE_KEY = "cca-game-mode.v1";
export const SCHEMA_VERSION = 1;

export const LESSON_STATES = {
  NOT_STARTED: "not_started",
  STUDIED: "studied",
  COMPLETED: "completed",
  MASTERED: "mastered",
};

export const XP_BY_STATE = {
  [LESSON_STATES.NOT_STARTED]: 0,
  [LESSON_STATES.STUDIED]: 25,
  [LESSON_STATES.COMPLETED]: 75,
  [LESSON_STATES.MASTERED]: 125,
};

export const LEVELS = [
  { title: "Prompt Sender", minXp: 0 },
  { title: "API Caller", minXp: 500 },
  { title: "Tool Builder", minXp: 1500 },
  { title: "Agent Crafter", minXp: 3500 },
  { title: "MCP Architect", minXp: 7000 },
  { title: "Multi-Agent Designer", minXp: 12000 },
  { title: "Claude Certified Architect", minXp: 20000 },
];

export const DOMAIN_BY_WEEK = {
  1: "context",
  2: "prompting",
  3: "prompting",
  4: "context",
  5: "agentic",
  6: "mcp",
  7: "agentic",
  8: "agentic",
  9: "claude_code",
  10: "agentic",
  11: "agentic",
  12: "agentic",
};

export const DOMAIN_LABELS = {
  agentic: "Agentic",
  mcp: "MCP",
  claude_code: "Claude Code",
  prompting: "Prompting",
  context: "Context",
};

const VALID_STATES = new Set(Object.values(LESSON_STATES));

export function normalizeProgress(raw = {}) {
  const normalizedLessons = {};
  const sourceLessons = raw.lessons && typeof raw.lessons === "object" ? raw.lessons : {};

  for (const lesson of LESSONS) {
    const state = sourceLessons[lesson.id];
    normalizedLessons[lesson.id] = VALID_STATES.has(state)
      ? state
      : LESSON_STATES.NOT_STARTED;
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    lastStudyDate: typeof raw.lastStudyDate === "string" ? raw.lastStudyDate : null,
    lessons: normalizedLessons,
  };
}

export function getLevelForXp(totalXp) {
  const current = [...LEVELS].reverse().find((level) => totalXp >= level.minXp) ?? LEVELS[0];
  const currentIndex = LEVELS.findIndex((level) => level.title === current.title);
  const next = LEVELS[currentIndex + 1] ?? null;
  return { current, next };
}

export function getLessonXp(state) {
  return XP_BY_STATE[state] ?? 0;
}

export function deriveStats(lessons, progress, todayIsoDate) {
  const domainPoints = Object.fromEntries(Object.keys(DOMAIN_LABELS).map((key) => [key, 0]));
  const domainMax = Object.fromEntries(Object.keys(DOMAIN_LABELS).map((key) => [key, 0]));
  const gems = { knowledge: 0, architect: 0, streak: 0, battle: 0, master: 0 };
  const weekCompletion = {};
  let totalXp = 0;

  for (const lesson of lessons) {
    const state = progress.lessons[lesson.id] ?? LESSON_STATES.NOT_STARTED;
    const xp = getLessonXp(state);
    totalXp += xp;
    domainPoints[lesson.domain] += xp;
    domainMax[lesson.domain] += XP_BY_STATE[LESSON_STATES.MASTERED];
    weekCompletion[lesson.week] ??= { total: 0, completed: 0, mastered: 0 };
    weekCompletion[lesson.week].total += 1;

    if (state === LESSON_STATES.COMPLETED || state === LESSON_STATES.MASTERED) {
      gems.knowledge += 1;
      weekCompletion[lesson.week].completed += 1;
    }

    if (state === LESSON_STATES.MASTERED) {
      gems.architect += 1;
      weekCompletion[lesson.week].mastered += 1;
      if (lesson.isMockExam) {
        gems.battle += 1;
      }
    }
  }

  for (const week of Object.values(weekCompletion)) {
    if (week.completed === week.total) {
      gems.master += 1;
    }
  }

  const currentStreak = progress.lastStudyDate === todayIsoDate ? 1 : 0;
  if (currentStreak >= 3) gems.streak += 1;

  return {
    totalXp,
    ...getLevelForXp(totalXp),
    currentStreak,
    gems,
    weekCompletion,
    domainMastery: Object.fromEntries(
      Object.keys(DOMAIN_LABELS).map((key) => [
        key,
        domainMax[key] ? Math.round((domainPoints[key] / domainMax[key]) * 100) : 0,
      ]),
    ),
  };
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `node --test tests/tracker/tracker.test.js`  
Expected: PASS with `4 tests` and `0 failures`

- [ ] **Step 5: Commit**

```bash
git add tracker/tracker.js tests/tracker/tracker.test.js
git commit -m "feat: add tracker core model"
```

### Task 2: Build Markup and Render Pipeline

**Files:**
- Create: `tracker/index.html`
- Modify: `tracker/tracker.js`
- Modify: `tests/tracker/tracker.test.js`

- [ ] **Step 1: Add failing render test**

```js
import { renderLessonCard, renderWeekSection } from "../../tracker/tracker.js";

test("render helpers include lesson links and state controls", () => {
  const lesson = LESSONS[0];
  const card = renderLessonCard(lesson, LESSON_STATES.NOT_STARTED);
  assert.match(card, /href="\.\.\/W1-D1_LLMs_Explained_From_Scratch\.md"/);
  assert.match(card, /data-action="studied"/);
  assert.match(card, /data-action="completed"/);
  assert.match(card, /data-action="mastered"/);
});

test("week section groups lessons under heading", () => {
  const html = renderWeekSection(1, LESSONS.slice(0, 5), normalizeProgress());
  assert.match(html, /Week 1/);
  assert.match(html, /W1-D5/);
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `node --test tests/tracker/tracker.test.js`  
Expected: FAIL with missing exports `renderLessonCard` and `renderWeekSection`

- [ ] **Step 3: Create tracker HTML shell and render helpers**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>CCA Study Tracker</title>
    <link rel="stylesheet" href="./tracker.css">
  </head>
  <body>
    <main class="tracker-app">
      <header class="hero">
        <div>
          <p class="eyebrow">Claude Certified Architect</p>
          <h1>Study Tracker</h1>
          <p class="hero-copy">Progress, mastery, streaks, and lesson flow in one GitHub Pages-safe dashboard.</p>
        </div>
        <a class="home-link" href="../">Back to Study Hub</a>
      </header>

      <p id="storage-warning" class="storage-warning" hidden></p>
      <section class="toolbar">
        <button id="reset-progress" type="button">Reset Progress</button>
      </section>
      <section id="dashboard" class="dashboard"></section>
      <section id="weeks" class="weeks"></section>
      <dialog id="mastery-dialog">
        <form method="dialog" class="mastery-dialog-form">
          <h2>Confirm mastery</h2>
          <p id="mastery-dialog-copy"></p>
          <menu>
            <button value="cancel">Cancel</button>
            <button value="confirm">Mark Mastered</button>
          </menu>
        </form>
      </dialog>
    </main>
    <script type="module" src="./tracker.js"></script>
  </body>
</html>
```

```js
export function renderLessonCard(lesson, state) {
  return `
    <article class="lesson-card lesson-state-${state}" data-lesson-id="${lesson.id}">
      <div class="lesson-card-header">
        <p class="lesson-meta">${lesson.id}</p>
        <span class="domain-badge domain-${lesson.domain}">${DOMAIN_LABELS[lesson.domain]}</span>
      </div>
      <h3>${lesson.title}</h3>
      <p class="lesson-state-label">${state.replaceAll("_", " ")}</p>
      <div class="lesson-actions">
        <a class="lesson-link" href="${lesson.href}">Open lesson</a>
        <button type="button" data-action="studied">Studied</button>
        <button type="button" data-action="completed">Completed</button>
        <button type="button" data-action="mastered">Mastered</button>
      </div>
    </article>
  `;
}

export function renderWeekSection(weekNumber, lessons, progress) {
  const cards = lessons
    .map((lesson) => renderLessonCard(lesson, progress.lessons[lesson.id] ?? LESSON_STATES.NOT_STARTED))
    .join("");

  return `
    <section class="week-section" data-week="${weekNumber}">
      <div class="week-header">
        <h2>Week ${weekNumber}</h2>
      </div>
      <div class="lesson-grid">
        ${cards}
      </div>
    </section>
  `;
}

export function renderDashboard(stats) {
  const nextDelta = stats.next ? stats.next.minXp - stats.totalXp : 0;
  return `
    <section class="panel level-panel">
      <p class="panel-label">Level</p>
      <h2>${stats.current.title}</h2>
      <p>${stats.totalXp} XP${stats.next ? ` · ${nextDelta} to ${stats.next.title}` : ""}</p>
    </section>
  `;
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `node --test tests/tracker/tracker.test.js`  
Expected: PASS with `6 tests` and `0 failures`

- [ ] **Step 5: Commit**

```bash
git add tracker/index.html tracker/tracker.js tests/tracker/tracker.test.js
git commit -m "feat: scaffold tracker page"
```

### Task 3: Add Persistence, Styling, and Interaction Logic

**Files:**
- Create: `tracker/tracker.css`
- Modify: `tracker/tracker.js`
- Modify: `tests/tracker/tracker.test.js`

- [ ] **Step 1: Add failing tests for storage and action flow**

```js
import {
  loadProgress,
  clearProgress,
  applyLessonState,
} from "../../tracker/tracker.js";

test("loadProgress falls back to empty normalized state on bad storage payload", () => {
  const fakeStorage = {
    getItem() {
      return "{bad json";
    },
  };

  const { progress, warning } = loadProgress(fakeStorage);
  assert.equal(progress.lessons["W1-D1"], LESSON_STATES.NOT_STARTED);
  assert.match(warning, /starting fresh/i);
});

test("applyLessonState updates lastStudyDate and lesson state", () => {
  const updated = applyLessonState(
    normalizeProgress(),
    "W1-D1",
    LESSON_STATES.COMPLETED,
    "2026-04-30",
  );

  assert.equal(updated.lessons["W1-D1"], LESSON_STATES.COMPLETED);
  assert.equal(updated.lastStudyDate, "2026-04-30");
});

test("clearProgress removes stored tracker payload", () => {
  let removedKey = null;
  const fakeStorage = {
    removeItem(key) {
      removedKey = key;
    },
  };

  clearProgress(fakeStorage);
  assert.equal(removedKey, "cca-game-mode.v1");
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `node --test tests/tracker/tracker.test.js`  
Expected: FAIL with missing exports `loadProgress`, `saveProgress`, or `applyLessonState`

- [ ] **Step 3: Implement storage helpers, boot function, and responsive CSS**

```js
export function loadProgress(storage = globalThis.localStorage) {
  if (!storage?.getItem) {
    return {
      progress: normalizeProgress(),
      warning: "Progress persistence unavailable in this browser. Starting fresh.",
    };
  }

  try {
    const raw = storage.getItem(STORAGE_KEY);
    return {
      progress: raw ? normalizeProgress(JSON.parse(raw)) : normalizeProgress(),
      warning: null,
    };
  } catch {
    return {
      progress: normalizeProgress(),
      warning: "Saved progress could not be read. Starting fresh.",
    };
  }
}

export function saveProgress(progress, storage = globalThis.localStorage) {
  if (!storage?.setItem) return;
  storage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function clearProgress(storage = globalThis.localStorage) {
  if (!storage?.removeItem) return;
  storage.removeItem(STORAGE_KEY);
}

export function applyLessonState(progress, lessonId, nextState, todayIsoDate) {
  return {
    ...progress,
    lastStudyDate: todayIsoDate,
    lessons: {
      ...progress.lessons,
      [lessonId]: nextState,
    },
  };
}

function renderApp(progress) {
  const dashboard = document.querySelector("#dashboard");
  const weeksRoot = document.querySelector("#weeks");
  const stats = deriveStats(LESSONS, progress, new Date().toISOString().slice(0, 10));

  dashboard.innerHTML = `
    <div class="dashboard-grid">
      ${renderDashboard(stats)}
      <section class="panel gem-panel">
        <p class="panel-label">Gems</p>
        <ul>
          <li>Knowledge: ${stats.gems.knowledge}</li>
          <li>Architect: ${stats.gems.architect}</li>
          <li>Battle: ${stats.gems.battle}</li>
          <li>Master: ${stats.gems.master}</li>
        </ul>
      </section>
      <section class="panel domain-panel">
        <p class="panel-label">Domain Mastery</p>
        ${Object.entries(DOMAIN_LABELS)
          .map(
            ([key, label]) => `
              <div class="domain-row">
                <span>${label}</span>
                <div class="domain-bar"><span style="width: ${stats.domainMastery[key]}%"></span></div>
                <strong>${stats.domainMastery[key]}%</strong>
              </div>
            `,
          )
          .join("")}
      </section>
    </div>
  `;

  const lessonsByWeek = Object.groupBy(LESSONS, ({ week }) => week);
  weeksRoot.innerHTML = Object.entries(lessonsByWeek)
    .map(([week, lessons]) => renderWeekSection(Number(week), lessons, progress))
    .join("");
}

function boot() {
  if (typeof document === "undefined") return;
  const warningNode = document.querySelector("#storage-warning");
  const loaded = loadProgress();
  let progress = loaded.progress;
  warningNode.hidden = !loaded.warning;
  warningNode.textContent = loaded.warning ?? "";
  renderApp(progress);

  document.addEventListener("click", (event) => {
    if (event.target.closest("#reset-progress")) {
      const confirmed = window.confirm("Reset all tracker progress?");
      if (!confirmed) return;
      clearProgress();
      progress = normalizeProgress();
      renderApp(progress);
      return;
    }

    const action = event.target.closest("[data-action]");
    if (!action) return;
    const card = action.closest("[data-lesson-id]");
    if (!card) return;

    const lessonId = card.dataset.lessonId;
    const nextState = action.dataset.action;
    const today = new Date().toISOString().slice(0, 10);
    progress = applyLessonState(progress, lessonId, nextState, today);
    saveProgress(progress);
    renderApp(progress);
  });
}

boot();
```

```css
:root {
  --bg: #f5f1e8;
  --panel: rgba(255, 251, 244, 0.9);
  --ink: #1d1f1c;
  --muted: #665f53;
  --accent: #0f766e;
  --context: #1d4ed8;
  --prompting: #b45309;
  --agentic: #047857;
  --mcp: #7c3aed;
  --claude-code: #b91c1c;
  --border: rgba(29, 31, 28, 0.12);
}

body {
  margin: 0;
  color: var(--ink);
  background:
    radial-gradient(circle at top left, rgba(15, 118, 110, 0.15), transparent 30%),
    linear-gradient(180deg, #faf7f2 0%, #efe7da 100%);
  font-family: "Source Sans 3", "Segoe UI", sans-serif;
}

.tracker-app {
  width: min(1180px, calc(100% - 2rem));
  margin: 0 auto;
  padding: 2rem 0 4rem;
}

.dashboard-grid,
.lesson-grid {
  display: grid;
  gap: 1rem;
}

.dashboard-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.lesson-grid {
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.panel,
.lesson-card,
.week-section {
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--panel);
  box-shadow: 0 18px 40px rgba(52, 42, 27, 0.08);
}

@media (max-width: 800px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .tracker-app {
    width: min(100% - 1rem, 100%);
  }
}
```

- [ ] **Step 4: Run tests and syntax checks**

Run: `node --test tests/tracker/tracker.test.js`  
Expected: PASS with `9 tests` and `0 failures`

Run: `node --check tracker/tracker.js`  
Expected: no output

- [ ] **Step 5: Commit**

```bash
git add tracker/tracker.css tracker/tracker.js tests/tracker/tracker.test.js
git commit -m "feat: add tracker persistence and styles"
```

### Task 4: Link Home Page and Run End-to-End Verification

**Files:**
- Modify: `index.md`
- Modify: `tracker/tracker.js`
- Modify: `tracker/tracker.css`

- [ ] **Step 1: Write failing home-page link check**

Run: `rg -n "\\[Study Tracker\\]\\(\\./tracker/\\)" index.md`  
Expected: no matches

- [ ] **Step 2: Add visible link block near top of home page**

```md
## Study Modes

- [Study Tracker](./tracker/) for XP, gems, streaks, and mastery tracking
- [Main Curriculum](./index.md) for week-by-week lesson tables
```

Place this section immediately after the intro paragraph and before `## How To Use This Study Material`.

- [ ] **Step 3: Tighten interaction edge cases**

```js
document.addEventListener("click", (event) => {
  const action = event.target.closest("[data-action]");
  if (!action) return;

  const card = action.closest("[data-lesson-id]");
  const lessonId = card?.dataset.lessonId;
  const lesson = LESSONS.find((entry) => entry.id === lessonId);
  if (!lesson) return;

  const requestedState = action.dataset.action;
  const currentState = progress.lessons[lessonId];
  if (requestedState === LESSON_STATES.MASTERED && currentState !== LESSON_STATES.COMPLETED) {
    return;
  }

  if (requestedState === LESSON_STATES.MASTERED) {
    const confirmed = window.confirm(
      lesson.isMockExam
        ? `Mark ${lesson.id} mastered only if you scored 80% or higher.`
        : `Mark ${lesson.id} mastered only if you can explain it without notes.`,
    );
    if (!confirmed) return;
  }

  const today = new Date().toISOString().slice(0, 10);
  progress = applyLessonState(progress, lessonId, requestedState, today);
  saveProgress(progress);
  renderApp(progress);
});
```

- [ ] **Step 4: Verify link, tests, and local preview**

Run: `rg -n "\\[Study Tracker\\]\\(\\./tracker/\\)" index.md`  
Expected: one match

Run: `node --test tests/tracker/tracker.test.js`  
Expected: PASS with `9 tests` and `0 failures`

Run: `ruby -run -e httpd . -p 4000`  
Expected: local server starts on `http://127.0.0.1:4000`

Manual checks in browser:
- open `http://127.0.0.1:4000/tracker/`
- confirm dashboard renders without blank sections
- click `Studied`, `Completed`, `Mastered` on one card and reload
- confirm state persists
- confirm `W12-D1` mastery prompt mentions 80 percent
- click `Reset Progress`, confirm, and verify dashboard returns to zero state
- open lesson link and confirm markdown file resolves
- verify mobile width at roughly 390px still fits cards and buttons

- [ ] **Step 5: Commit**

```bash
git add index.md tracker/tracker.css tracker/tracker.js
git commit -m "feat: link study hub to tracker"
```

## Self-Review

### Spec Coverage

- Separate tracker page: covered by Tasks 2 and 3
- Home-page entry point: covered by Task 4
- Canonical lesson catalog: covered by Task 1
- XP, levels, gems, streaks, mastery bars: covered by Tasks 1 and 3
- Local storage, warning recovery, reset-safe state model, derived stats: covered by Tasks 1 and 3
- Mock exam mastery confirmation and GitHub Pages-relative links: covered by Task 4
- Responsive layout and accessibility baseline: covered by Task 3 and manual checks in Task 4

### Placeholder Scan

- No `TODO`, `TBD`, or deferred implementation text in task steps
- Exact file paths included for every task
- Exact commands included for every verification step

### Consistency Check

- Shared exports use same names across tasks: `LESSONS`, `LESSON_STATES`, `normalizeProgress`, `deriveStats`, `applyLessonState`
- Relative lesson links consistently use `../` because tracker lives in `tracker/`
- Tests use Node built-in runner throughout, no extra dependencies
