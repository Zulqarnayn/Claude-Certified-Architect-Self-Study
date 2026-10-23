import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { JSDOM } from "jsdom";

const ROOT = path.resolve(import.meta.dirname, "../..");
const SITE = path.join(ROOT, "_site");
const built = fs.existsSync(path.join(SITE, "index.html"));

// pages whose format the quiz mode must handle, with expected question counts
const PAGES = [
  ["study_materials/W11-D1_Exam_Scenario_1_Customer_Support", 10],
  ["study_materials/W11-D2_Exam_Scenario_2_Code_Generation", 10],
  ["study_materials/W11-D3_Exam_Scenario_3_Multi_Agent_Research", 8],
  ["study_materials/W11-D4_Exam_Scenario_4_Developer_Productivity", 8],
  ["study_materials/W11-D5_Exam_Scenario_5_Claude_Code_in_CI", 8],
  ["study_materials/W11-D6_Exam_Scenario_6_Structured_Data_Extraction", 8],
  ["study_materials/W13-D7_Mock_Exam_3_60_Questions", 60],
  ["developer/Mock_Exam_53_Questions", 53],
];

function expectedAnswers(md) {
  const a = {};
  for (const m of md.matchAll(/\*\*Q(\d+) Answer: ([A-D])\*\*/g)) a[+m[1]] = m[2];
  for (const m of md.matchAll(/\*\*Q(\d+) — ([A-D])\.\*\*/g)) a[+m[1]] = m[2];
  return a;
}

async function load(page) {
  const html = fs.readFileSync(path.join(SITE, page + ".html"), "utf8");
  const dom = new JSDOM(html, { runScripts: "outside-only", pretendToBeVisual: true });
  globalThis.document = dom.window.document;
  await import("../../assets/js/quiz.js");
  return { dom, prose: dom.window.document.getElementById("prose"), Quiz: globalThis.Quiz };
}

for (const [page, count] of PAGES) {
  test(`quiz parses ${path.basename(page)}`, { skip: !built && "run jekyll build first" }, async () => {
    const { prose, Quiz } = await load(page);
    const parsed = Quiz.parse(prose);
    assert.ok(parsed, "parse returned null");
    assert.equal(parsed.questions.length, count);
    const exp = expectedAnswers(fs.readFileSync(path.join(ROOT, page + ".md"), "utf8"));
    for (const q of parsed.questions) {
      assert.equal(q.options.length, 4);
      assert.equal(q.answer, exp[q.n], `Q${q.n} answer`);
      assert.ok(q.why.length > 0, `Q${q.n} rationale`);
    }
  });
}

test("enhance: answering reveals rationale, scores, and unhides the guide", { skip: !built && "run jekyll build first" }, async () => {
  const { dom, prose, Quiz } = await load("study_materials/W11-D3_Exam_Scenario_3_Multi_Agent_Research");
  const changes = [];
  assert.equal(Quiz.enhance(prose, { saved: null, onChange: (r) => changes.push(r) }), true);
  const doc = dom.window.document;
  const guideH2 = [...prose.children].find((e) => e.tagName === "H2" && /answer guide/i.test(e.textContent));
  assert.ok(guideH2.classList.contains("quiz-hidden"));
  const groups = doc.querySelectorAll(".mcq-opts");
  assert.equal(groups.length, 8);
  const first = groups[0];
  const right = [...first.children].find((b) => b.getAttribute("data-k") === "A");  // Q1 answer is A after shuffle
  const wrong = [...first.children].find((b) => b.getAttribute("data-k") === "B");
  wrong.click();
  assert.ok(wrong.classList.contains("is-wrong"));
  assert.ok(right.classList.contains("is-right"));
  assert.ok([...first.children].every((b) => b.disabled));
  assert.ok(first.nextElementSibling.classList.contains("mcq-why"));
  groups.forEach((g, i) => { if (i) g.children[0].click(); });
  const last = changes.at(-1);
  assert.equal(last.done, 8);
  assert.equal(last.total, 8);
  assert.ok(!guideH2.classList.contains("quiz-hidden"), "guide shown after all answered");
});

test("enhance restores saved answers", { skip: !built && "run jekyll build first" }, async () => {
  const { dom, prose, Quiz } = await load("study_materials/W11-D3_Exam_Scenario_3_Multi_Agent_Research");
  Quiz.enhance(prose, { saved: { answers: { 1: "D" } }, onChange() {} });
  const first = dom.window.document.querySelector(".mcq-opts");
  assert.ok([...first.children].every((b) => b.disabled));
  assert.ok(first.querySelector('[data-k="D"]').classList.contains("is-wrong"));
});

test("parse returns null on a page without an answer guide", async () => {
  const dom = new JSDOM('<div id="prose"><p><strong>Question 1.</strong> x</p><p>A) a\nB) b\nC) c\nD) d</p></div>');
  globalThis.document = dom.window.document;
  await import("../../assets/js/quiz.js");
  assert.equal(globalThis.Quiz.parse(dom.window.document.getElementById("prose")), null);
});
