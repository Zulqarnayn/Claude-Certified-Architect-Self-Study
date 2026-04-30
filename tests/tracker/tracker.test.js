import test from "node:test";
import assert from "node:assert/strict";

import {
  LESSONS,
  LESSON_STATES,
  normalizeProgress,
  getLevelForXp,
  getLessonXp,
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

  assert.equal(getLessonXp(LESSON_STATES.NOT_STARTED), 0);
  assert.equal(getLessonXp(LESSON_STATES.STUDIED), 25);
  assert.equal(getLessonXp(LESSON_STATES.COMPLETED), 75);
  assert.equal(getLessonXp(LESSON_STATES.MASTERED), 125);
  assert.equal(getLessonXp("broken"), 0);
  assert.equal(stats.totalXp, 25 + 75 + 125 + 125);
  assert.equal(stats.gems.knowledge, 3);
  assert.equal(stats.gems.architect, 2);
  assert.equal(stats.gems.battle, 1);
  assert.equal(stats.gems.master, 1);
  assert.equal(stats.currentStreak, 1);
  assert.equal(stats.weekStats[1].totalLessons, 5);
  assert.equal(stats.weekStats[1].completedLessons, 2);
  assert.equal(stats.weekStats[1].masteredLessons, 1);
  assert.equal(stats.weekStats[1].isComplete, false);
  assert.equal(stats.weekStats[12].totalLessons, 1);
  assert.equal(stats.weekStats[12].completedLessons, 1);
  assert.equal(stats.weekStats[12].masteredLessons, 1);
  assert.equal(stats.weekStats[12].isComplete, true);
  assert.ok(stats.domainMastery.context > 0);
  assert.ok(stats.domainMastery.agentic > 0);
});
