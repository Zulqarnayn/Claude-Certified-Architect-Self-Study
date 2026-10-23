import test from "node:test";
import assert from "node:assert/strict";
await import("../../assets/js/search.js");
const S = globalThis.BookSearch;
const index = [
  { id: "W7-D3-C", t: "Stop Conditions", p: "Agents", x: "An agent that never stops is broken" },
  { id: "W13-D4", t: "Managed Agents", p: "The 2026 Update", x: "Anthropic runs the loop and hosts the sandbox" },
  { id: "W9-D5", t: "Prompt Caching", p: "Claude Code", x: "Cache reads cost less" },
];
test("title hits outrank body hits and all terms must match", () => {
  assert.equal(S.search(index, "stop")[0].id, "W7-D3-C");
  assert.equal(S.search(index, "sandbox")[0].id, "W13-D4");
  assert.deepEqual(S.search(index, "stop sandbox"), []);
  assert.deepEqual(S.search(index, "  "), []);
});
test("id and part are searchable", () => {
  assert.equal(S.search(index, "w9-d5")[0].t, "Prompt Caching");
  assert.equal(S.search(index, "2026")[0].id, "W13-D4");
});
