/* Progress model for the book. Pure functions plus thin storage helpers.
   State lives in localStorage under cca-book.v1; every access is guarded. */
(function (root) {
  "use strict";
  var KEY = "cca-book.v1";
  var LEGACY_KEY = "cca-game-mode.v1";
  var LEGACY_READ = { studied: 1, completed: 1, mastered: 1 };

  function empty() { return { v: 1, notes: {}, imported: false }; }

  function normalize(raw) {
    var st = empty();
    if (!raw || typeof raw !== "object") return st;
    st.imported = raw.imported === true;
    var notes = raw.notes && typeof raw.notes === "object" ? raw.notes : {};
    Object.keys(notes).forEach(function (id) {
      var n = notes[id];
      if (!n || typeof n !== "object") return;
      var out = {};
      if (n.read === true) out.read = true;
      if (n.quiz && typeof n.quiz === "object") {
        var q = n.quiz, answers = {};
        if (q.answers && typeof q.answers === "object") {
          Object.keys(q.answers).forEach(function (k) { if (/^[A-D]$/.test(q.answers[k])) answers[k] = q.answers[k]; });
        }
        var total = Number(q.total) || 0, correct = Math.min(Number(q.correct) || 0, total);
        out.quiz = { answers: answers, correct: correct, total: total };
      }
      if (out.read || out.quiz) st.notes[id] = out;
    });
    return st;
  }

  function load(storage) {
    try { return normalize(JSON.parse(storage.getItem(KEY))); } catch (e) { return empty(); }
  }
  function save(storage, st) {
    try { storage.setItem(KEY, JSON.stringify(st)); return true; } catch (e) { return false; }
  }
  function clone(st) { return normalize(JSON.parse(JSON.stringify(st))); }

  function setRead(st, id, value) {
    var next = clone(st), n = next.notes[id] || {};
    if (value) n.read = true; else delete n.read;
    if (n.read || n.quiz) next.notes[id] = n; else delete next.notes[id];
    return next;
  }
  function setQuiz(st, id, quiz) {
    var next = clone(st), n = next.notes[id] || {};
    if (quiz) n.quiz = quiz; else delete n.quiz;
    if (n.read || n.quiz) next.notes[id] = n; else delete next.notes[id];
    return normalize(next);
  }
  function isRead(st, id) { return !!(st.notes[id] && st.notes[id].read); }

  /* One-time best effort import of the retired XP tracker. */
  function importLegacy(st, legacyRaw, knownIds) {
    var next = clone(st);
    next.imported = true;
    var lessons = legacyRaw && legacyRaw.lessons;
    if (!lessons || typeof lessons !== "object") return next;
    var known = {};
    (knownIds || []).forEach(function (id) { known[id] = 1; });
    Object.keys(lessons).forEach(function (id) {
      if (known[id] && LEGACY_READ[lessons[id]]) {
        var n = next.notes[id] || {};
        n.read = true;
        next.notes[id] = n;
      }
    });
    return next;
  }

  /* notes: [{id, part, domain}] */
  function totals(st, notes, key) {
    var out = {};
    notes.forEach(function (n) {
      var k = n[key];
      if (!k) return;
      var t = out[k] || (out[k] = { total: 0, read: 0, correct: 0, asked: 0 });
      t.total += 1;
      if (isRead(st, n.id)) t.read += 1;
      var q = st.notes[n.id] && st.notes[n.id].quiz;
      if (q && q.total) { t.correct += q.correct; t.asked += q.total; }
    });
    return out;
  }

  /* plan: {start: "YYYY-MM-DD", weeks: [{name, ids}]}; today: "YYYY-MM-DD" */
  function planWeek(plan, today) {
    if (!plan || !plan.start || !plan.weeks || !plan.weeks.length) return { state: "none" };
    var d0 = Date.parse(plan.start + "T00:00:00Z"), d1 = Date.parse(today + "T00:00:00Z");
    if (isNaN(d0) || isNaN(d1)) return { state: "none" };
    var idx = Math.floor((d1 - d0) / 86400000 / 7);
    if (idx < 0) return { state: "before", days: Math.ceil((d0 - d1) / 86400000) };
    if (idx >= plan.weeks.length) return { state: "after" };
    return { state: "active", index: idx, week: plan.weeks[idx] };
  }
  function planProgress(st, week) {
    var done = week.ids.filter(function (id) { return isRead(st, id); }).length;
    return { done: done, total: week.ids.length };
  }
  function todayISO(now) {
    var d = now || new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  var api = { KEY: KEY, LEGACY_KEY: LEGACY_KEY, empty: empty, normalize: normalize, load: load, save: save,
    setRead: setRead, setQuiz: setQuiz, isRead: isRead, importLegacy: importLegacy, totals: totals,
    planWeek: planWeek, planProgress: planProgress, todayISO: todayISO };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.Progress = api;
})(typeof window !== "undefined" ? window : globalThis);
