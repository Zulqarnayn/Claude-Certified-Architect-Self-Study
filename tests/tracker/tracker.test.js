import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  LESSONS,
  LESSON_STATES,
  normalizeProgress,
  getLevelForXp,
  deriveStats,
} from "../../tracker/tracker.js";

test("catalog has 61 core lessons, 23 extras, unique ids", () => {
  const core = LESSONS.filter((lesson) => lesson.track === "core");
  const extras = LESSONS.filter((lesson) => lesson.track === "extras");
  assert.equal(core.length, 61);
  assert.equal(extras.length, 23);
  assert.equal(new Set(LESSONS.map((lesson) => lesson.id)).size, 84);
  assert.ok(LESSONS.every((lesson) => lesson.href.startsWith("../")));
  assert.equal(core.at(-1).id, "W13-D7");
});

test("every lesson href points at an existing note", () => {
  const here = dirname(fileURLToPath(import.meta.url));
  for (const lesson of LESSONS) {
    assert.ok(existsSync(resolve(here, "../../tracker", lesson.href)), `${lesson.id}: ${lesson.href}`);
  }
});

test("extras earn xp but no domain, week or gem credit", () => {
  const extra = LESSONS.find((lesson) => lesson.id === "W5-D1");
  const progress = normalizeProgress({ lessons: { [extra.id]: "mastered" } });
  const stats = deriveStats(LESSONS, progress, "2026-10-14");
  assert.equal(extra.track, "extras");
  assert.equal(stats.totalXp, 125);
  assert.equal(stats.gems.knowledge, 0);
  assert.equal(stats.gems.architect, 0);
  assert.ok(Object.values(stats.domainMastery).every((pct) => pct === 0));
  assert.equal(stats.weekCompletion[5].completed, 0);
});

test("core W5-W7 notes carry the official exam domain", () => {
  assert.equal(LESSONS.find((lesson) => lesson.id === "W5-D1-C").domain, "mcp");
  assert.equal(LESSONS.find((lesson) => lesson.id === "W7-D1-C").domain, "agentic");
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

import { renderLessonCard, renderWeekSection } from "../../tracker/tracker.js";

test("render helpers include lesson links and state controls", () => {
  const lesson = LESSONS[0];
  const card = renderLessonCard(lesson, LESSON_STATES.NOT_STARTED);
  assert.match(card, /href="\.\.\/study_materials\/W1-D1_LLMs_Explained_From_Scratch"/);
  assert.match(card, /data-action="studied"/);
  assert.match(renderLessonCard(lesson, LESSON_STATES.STUDIED), /data-action="completed"/);
  assert.match(renderLessonCard(lesson, LESSON_STATES.COMPLETED), /data-action="mastered"/);
});

test("week section groups lessons under heading", () => {
  const html = renderWeekSection(1, LESSONS.slice(0, 5), normalizeProgress());
  assert.match(html, /Week 1/);
  assert.match(html, /W1-D5/);
});

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
