/* Self-quiz mode. Reads the rendered Markdown of multiple-choice notes
   (scenarios and mock exams), turns options into buttons and reveals the
   rationale from the answer guide. Falls back to plain text on any mismatch. */
(function (root) {
  "use strict";
  var Q_RE = /^(?:Question\s+|Q)(\d+)\.$/;
  var A_RE = /^Q(\d+)\s*(?:Answer:\s*|[—-]\s*)([A-D])\.?$/;

  function firstStrong(el) {
    var c = el.firstElementChild;
    return c && c.tagName === "STRONG" && el.firstChild === c ? c : null;
  }
  function splitOptions(html) {
    var parts = html.split(/\n(?=[A-D]\) )/);
    var out = [];
    for (var i = 0; i < parts.length; i++) {
      var m = /^([A-D])\) ([\s\S]*)$/.exec(parts[i].trim());
      if (!m) return null;
      out.push({ k: m[1], html: m[2].trim() });
    }
    return out.length === 4 ? out : null;
  }

  /* Returns {questions, guideStart, hide} or null when the page is not a clean MCQ note. */
  function parse(prose) {
    var kids = Array.prototype.slice.call(prose.children);
    var questions = [], answers = {}, why = {};
    var guideStart = -1;
    kids.forEach(function (el, i) {
      if (guideStart < 0 && el.tagName === "H2" && /answer (guide|key)/i.test(el.textContent)) guideStart = i;
    });
    if (guideStart < 0) return null;

    kids.forEach(function (el, i) {
      if (el.tagName !== "P") return;
      var s = firstStrong(el);
      if (!s) return;
      var txt = s.textContent.trim();
      var qm = Q_RE.exec(txt), am = A_RE.exec(txt);
      if (qm && i < guideStart) {
        var n = Number(qm[1]);
        var opts = null, optsEl = null, stemHtml = "";
        // options either in a following paragraph or at the end of this one
        var next = kids[i + 1];
        if (next && next.tagName === "P" && /^A\) /.test(next.textContent.trim())) {
          opts = splitOptions(next.innerHTML); optsEl = next;
        }
        if (!opts) return;
        questions.push({ n: n, stemEl: el, optsEl: optsEl, options: opts });
      } else if (am && i >= guideStart) {
        var num = Number(am[1]);
        answers[num] = am[2];
        var nodes = [];
        if (/Answer:/.test(txt)) {          // scenario guide: rationale in following siblings until <hr>
          for (var j = i + 1; j < kids.length && kids[j].tagName !== "HR" && !(kids[j].tagName === "P" && firstStrong(kids[j]) && A_RE.test(firstStrong(kids[j]).textContent.trim())); j++) nodes.push(kids[j]);
        } else {                            // mock guide: rationale is the rest of this paragraph
          var rest = document.createElement("p");
          var clone = el.cloneNode(true);
          clone.removeChild(clone.firstChild);
          rest.innerHTML = clone.innerHTML.replace(/^\s+/, "");
          nodes.push(rest);
        }
        why[num] = nodes;
      }
    });
    if (questions.length < 3) return null;
    for (var q = 0; q < questions.length; q++) {
      if (!answers[questions[q].n]) return null;
      questions[q].answer = answers[questions[q].n];
      questions[q].why = why[questions[q].n] || [];
    }
    return { questions: questions, guideStart: guideStart, kids: kids };
  }

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function enhance(prose, ctx) {
    var parsed;
    try { parsed = parse(prose); } catch (e) { parsed = null; }
    if (!parsed) return false;
    var qs = parsed.questions, answered = {}, correct = 0;
    var saved = (ctx.saved && ctx.saved.answers) || {};

    var bar = el("div", "quiz-bar");
    var status = el("span", "mono");
    var toggle = el("button"); toggle.type = "button"; toggle.textContent = "Show answer guide";
    bar.appendChild(status); bar.appendChild(toggle);
    prose.insertBefore(bar, prose.firstChild);

    var guideEls = parsed.kids.slice(parsed.guideStart);
    function setGuide(show) {
      guideEls.forEach(function (g) { g.classList.toggle("quiz-hidden", !show); });
      toggle.textContent = show ? "Hide answer guide" : "Show answer guide";
      toggle.setAttribute("aria-pressed", String(show));
    }
    setGuide(false);
    toggle.addEventListener("click", function () { setGuide(guideEls[0].classList.contains("quiz-hidden")); });

    function refresh() {
      var done = Object.keys(answered).length;
      status.textContent = "Practice mode · " + done + " of " + qs.length + " answered" + (done ? " · " + correct + " correct" : "");
      if (ctx.onChange) ctx.onChange({ answers: answered, correct: correct, total: qs.length, done: done });
      if (done === qs.length) setGuide(true);
    }

    qs.forEach(function (q) {
      var hint = q.stemEl.nextElementSibling === q.optsEl ? null : null;
      // hide the "Your answer" scribble block that follows the options
      var after = q.optsEl.nextElementSibling;
      if (after && after.tagName === "BLOCKQUOTE" && /your answer/i.test(after.textContent)) after.classList.add("quiz-hidden");

      var list = el("div", "mcq-opts");
      list.setAttribute("role", "group");
      list.setAttribute("aria-label", "Question " + q.n + " options");
      var why = null;
      function reveal(pick) {
        answered[q.n] = pick;
        if (pick === q.answer) correct++;
        Array.prototype.forEach.call(list.children, function (b) {
          b.disabled = true;
          var k = b.getAttribute("data-k");
          if (k === q.answer) { b.classList.add("is-right"); b.querySelector(".tag").textContent = k === pick ? "Correct" : "Answer"; }
          else if (k === pick) { b.classList.add("is-wrong"); b.querySelector(".tag").textContent = "Your pick"; }
        });
        if (q.why.length && !why) {
          why = el("div", "mcq-why");
          q.why.forEach(function (n) { why.appendChild(n.cloneNode(true)); });
          list.parentNode.insertBefore(why, list.nextSibling);
        }
      }
      q.options.forEach(function (o) {
        var b = el("button", "mcq-opt");
        b.type = "button"; b.setAttribute("data-k", o.k);
        b.appendChild(el("span", "k", o.k)); b.appendChild(el("span", "txt", o.html)); b.appendChild(el("span", "tag", ""));
        b.addEventListener("click", function () { reveal(o.k); refresh(); });
        list.appendChild(b);
      });
      q.optsEl.parentNode.replaceChild(list, q.optsEl);
      if (saved[q.n]) reveal(saved[q.n]);
    });
    refresh();
    return true;
  }

  var api = { parse: parse, enhance: enhance, splitOptions: splitOptions };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.Quiz = api;
})(typeof window !== "undefined" ? window : globalThis);
