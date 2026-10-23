import test from "node:test";
import assert from "node:assert/strict";
await import("../../assets/js/progress.js");
const P = globalThis.Progress;

test("normalize drops junk and clamps quiz totals", () => {
  const st = P.normalize({ notes: { a: { read: true }, b: { quiz: { correct: 9, total: 4, answers: { 1: "A", 2: "Z" } } }, c: "x", d: {} } });
  assert.deepEqual(Object.keys(st.notes).sort(), ["a", "b"]);
  assert.equal(st.notes.b.quiz.correct, 4);
  assert.deepEqual(st.notes.b.quiz.answers, { 1: "A" });
  assert.deepEqual(P.normalize("nope"), P.empty());
});

test("setRead toggles without mutating and removes empty notes", () => {
  const a = P.empty(), b = P.setRead(a, "W1-D1", true);
  assert.equal(P.isRead(a, "W1-D1"), false);
  assert.equal(P.isRead(b, "W1-D1"), true);
  assert.deepEqual(P.setRead(b, "W1-D1", false).notes, {});
});

test("setQuiz keeps read flag and can clear", () => {
  let st = P.setRead(P.empty(), "x", true);
  st = P.setQuiz(st, "x", { answers: { 1: "B" }, correct: 1, total: 8 });
  assert.equal(st.notes.x.read, true);
  assert.equal(st.notes.x.quiz.total, 8);
  assert.equal(P.setQuiz(st, "x", null).notes.x.quiz, undefined);
});

test("importLegacy maps only studied/completed/mastered of known ids, once", () => {
  const legacy = { lessons: { "W1-D1": "studied", "W1-D2": "not_started", "W9-D9": "mastered", "W2-D1": "completed" } };
  const st = P.importLegacy(P.empty(), legacy, ["W1-D1", "W1-D2", "W2-D1"]);
  assert.equal(st.imported, true);
  assert.deepEqual(Object.keys(st.notes).sort(), ["W1-D1", "W2-D1"]);
  assert.equal(P.importLegacy(P.empty(), null, []).imported, true);
});

test("storage helpers survive a throwing storage", () => {
  const bad = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } };
  assert.deepEqual(P.load(bad), P.empty());
  assert.equal(P.save(bad, P.empty()), false);
  const mem = new Map();
  const ok = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) };
  P.save(ok, P.setRead(P.empty(), "z", true));
  assert.equal(P.isRead(P.load(ok), "z"), true);
});

test("totals aggregate by part with quiz accuracy", () => {
  const notes = [{ id: "a", part: "p", domain: "agentic" }, { id: "b", part: "p", domain: "agentic" }, { id: "c", part: "q", domain: "mcp" }];
  let st = P.setRead(P.empty(), "a", true);
  st = P.setQuiz(st, "b", { answers: { 1: "A" }, correct: 1, total: 2 });
  const t = P.totals(st, notes, "part");
  assert.deepEqual([t.p.total, t.p.read, t.p.correct, t.p.asked], [2, 1, 1, 2]);
  assert.equal(P.totals(st, notes, "domain").mcp.read, 0);
});

test("planWeek picks the week from the date", () => {
  const plan = { start: "2026-10-19", weeks: [{ name: "A", ids: ["x", "y"] }, { name: "B", ids: ["z"] }] };
  assert.equal(P.planWeek(plan, "2026-10-18").state, "before");
  assert.equal(P.planWeek(plan, "2026-10-18").days, 1);
  assert.equal(P.planWeek(plan, "2026-10-19").index, 0);
  assert.equal(P.planWeek(plan, "2026-10-25").index, 0);
  assert.equal(P.planWeek(plan, "2026-10-26").index, 1);
  assert.equal(P.planWeek(plan, "2026-11-02").state, "after");
  assert.equal(P.planWeek(null, "2026-10-19").state, "none");
  const st = P.setRead(P.empty(), "x", true);
  assert.deepEqual(P.planProgress(st, plan.weeks[0]), { done: 1, total: 2 });
  assert.equal(P.todayISO(new Date(2026, 9, 5)), "2026-10-05");
});
