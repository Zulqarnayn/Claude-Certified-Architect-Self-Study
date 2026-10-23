/* Page wiring: theme, progress ticks, plan strip, quiz, progress page. */
(function () {
  "use strict";
  var P = window.Progress, base = document.body.getAttribute("data-base") || "";
  var store = null;
  try { store = window.localStorage; } catch (e) { store = null; }
  var state = store ? P.load(store) : P.empty();

  function persist() { if (store) P.save(store, state); }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  /* theme */
  var tbtn = $("#theme-toggle");
  if (tbtn) tbtn.addEventListener("click", function () {
    var root = document.documentElement, cur = root.getAttribute("data-theme");
    if (!cur) cur = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    var next = cur === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("cca-theme", next); } catch (e) { /* ignore */ }
  });

  /* rail notes */
  var notes = $$(".rail a[data-id]").map(function (a) {
    var d = a.closest(".rail-part");
    return { id: a.getAttribute("data-id"), part: d ? d.getAttribute("data-part") : "", domain: a.getAttribute("data-domain"),
             title: a.textContent, href: a.getAttribute("href"), el: a };
  });

  /* one-time import from the retired XP tracker */
  if (store && !state.imported && notes.length) {
    var legacy = null;
    try { legacy = JSON.parse(store.getItem(P.LEGACY_KEY)); } catch (e) { legacy = null; }
    state = P.importLegacy(state, legacy, notes.map(function (n) { return n.id; }));
    persist();
  }

  function paintRail() {
    notes.forEach(function (n) { n.el.classList.toggle("is-read", P.isRead(state, n.id)); });
    var t = P.totals(state, notes, "part");
    $$(".rail [data-count]").forEach(function (c) {
      var p = c.getAttribute("data-count"), x = t[p];
      if (x) c.textContent = x.read ? x.read + "/" + x.total : String(x.total);
    });
  }
  paintRail();

  /* read button */
  var btn = $("#read-btn");
  if (btn) {
    var id = btn.getAttribute("data-id"), note = $("#read-note");
    $("#read-row").hidden = !store;
    var paint = function () {
      var r = P.isRead(state, id);
      btn.setAttribute("aria-pressed", String(r));
      btn.textContent = r ? "Read" : "Mark as read";
      if (note) note.textContent = r ? "Saved in this browser" : "";
    };
    btn.addEventListener("click", function () { state = P.setRead(state, id, !P.isRead(state, id)); persist(); paint(); paintRail(); paintPlan(); });
    paint();
  }

  /* plan strip + home line */
  function paintPlan() {
    var dataEl = $("#plan-data");
    if (!dataEl) return;
    var plan; try { plan = JSON.parse(dataEl.textContent); } catch (e) { return; }
    var w = P.planWeek(plan, P.todayISO());
    var strip = $("#plan-strip"), home = $("#plan-home");
    var planUrl = base + "/FINISH_PLAN.html";
    var html = "";
    if (w.state === "active") {
      var pr = P.planProgress(state, w.week);
      html = 'Week ' + (w.index + 1) + ' of ' + plan.weeks.length + ' · <b>' + w.week.name + '</b> · ' + pr.done + ' of ' + pr.total + ' read · <a href="' + planUrl + '">finish plan</a>';
    } else if (w.state === "before") {
      html = 'Finish plan starts in ' + w.days + (w.days === 1 ? ' day' : ' days') + ' · <a href="' + planUrl + '">see the plan</a>';
    } else if (w.state === "after") {
      html = 'Finish plan complete · <a href="' + planUrl + '">review it</a>';
    }
    if (strip) { strip.innerHTML = html; strip.classList.toggle("on", !!html && !document.body.classList.contains("home")); }
    if (home) home.innerHTML = html;
    $$("[data-part-read]").forEach(function (s) {
      var t = P.totals(state, notes, "part")[s.getAttribute("data-part-read")];
      s.textContent = t && t.read ? " · " + t.read + " read" : "";
    });
  }
  paintPlan();

  /* quiz */
  var prose = $("#prose");
  var nid = document.body.getAttribute("data-note");
  if (prose && nid && window.Quiz) {
    var saved = state.notes[nid] && state.notes[nid].quiz;
    window.Quiz.enhance(prose, { saved: saved, onChange: function (r) {
      if (r.done === 0) return;
      state = P.setQuiz(state, nid, { answers: r.answers, correct: r.correct, total: r.total });
      persist();
    } });
  }

  /* progress page */
  var root = $("#progress-root");
  if (root) {
    var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
    var parts = $$(".rail-part").map(function (d) {
      var sum = d.querySelector("summary"), first = d.querySelector("a");
      return { slug: d.getAttribute("data-part"), title: sum.children[1].textContent, num: sum.children[0].textContent, href: first ? first.getAttribute("href") : "#" };
    });
    var row = function (href, title, meta, frac) {
      return '<li><a href="' + esc(href) + '">' + esc(title) + '</a><span class="meta">' + esc(meta) + '</span><div class="bar-track"><span class="bar-fill" style="width:' + Math.round(frac * 100) + '%"></span></div></li>';
    };
    var out = "";
    var totalsP = P.totals(state, notes, "part"), readAll = notes.filter(function (n) { return P.isRead(state, n.id); }).length;
    out += '<p class="label" style="color:var(--muted)">' + readAll + ' of ' + notes.length + ' notes read</p>';
    var plan; try { plan = JSON.parse($("#plan-data").textContent); } catch (e) { plan = null; }
    var w = plan ? P.planWeek(plan, P.todayISO()) : { state: "none" };
    out += '<h2>This week</h2>';
    if (w.state === "active") {
      out += '<ul class="plain-list">' + w.week.ids.map(function (i) {
        var n = notes.filter(function (x) { return x.id === i; })[0];
        return n ? '<li><a href="' + esc(n.href) + '">' + esc(n.title) + '</a><span class="meta">' + (P.isRead(state, i) ? "Read" : "To read") + '</span></li>' : "";
      }).join("") + '</ul>';
    } else { out += '<p>No plan week is active right now. See the <a href="' + base + '/FINISH_PLAN.html">finish plan</a>.</p>'; }
    out += '<h2>By part</h2><ul class="plain-list">' + parts.map(function (p) {
      var t = totalsP[p.slug] || { total: 0, read: 0 };
      return row(p.href, p.num + ". " + p.title, t.read + " of " + t.total + " read", t.total ? t.read / t.total : 0);
    }).join("") + '</ul>';
    var tD = P.totals(state, notes, "domain");
    var labels = { agentic: "Agentic", claude_code: "Claude Code", prompting: "Prompting", mcp: "Tools and MCP", context: "Context" };
    out += '<h2>By exam domain</h2><ul class="plain-list">' + Object.keys(labels).map(function (k) {
      var t = tD[k] || { total: 0, read: 0, correct: 0, asked: 0 };
      var meta = t.read + " of " + t.total + " read" + (t.asked ? " · quiz " + Math.round(100 * t.correct / t.asked) + "%" : "");
      return '<li><span style="font-family:var(--display);font-weight:300;font-size:1.25rem">' + labels[k] + '</span><span class="meta">' + meta + '</span><div class="bar-track"><span class="bar-fill" style="width:' + (t.total ? Math.round(100 * t.read / t.total) : 0) + '%"></span></div></li>';
    }).join("") + '</ul>';
    var quizzed = notes.filter(function (n) { return state.notes[n.id] && state.notes[n.id].quiz && state.notes[n.id].quiz.total; });
    out += '<h2>Practice scores</h2>';
    out += quizzed.length ? '<ul class="plain-list">' + quizzed.map(function (n) {
      var q = state.notes[n.id].quiz, done = Object.keys(q.answers).length;
      return '<li><a href="' + esc(n.href) + '">' + esc(n.title) + '</a><span class="meta">' + q.correct + ' of ' + done + ' correct' + (done < q.total ? ' · ' + done + '/' + q.total + ' answered' : '') + '</span></li>';
    }).join("") + '</ul>' : '<p>No practice questions answered yet. Open any scenario or mock exam.</p>';
    out += '<p style="margin-top:3rem"><button class="read-btn" id="reset" type="button">Clear saved progress</button></p>';
    if (!store) out = '<p>This browser is blocking local storage, so progress cannot be saved.</p>' + out;
    root.innerHTML = out;
    var reset = $("#reset");
    if (reset) reset.addEventListener("click", function () {
      if (window.confirm("Clear all saved progress in this browser?")) { state = P.empty(); state.imported = true; persist(); location.reload(); }
    });
  }

  /* "/" opens search */
  document.addEventListener("keydown", function (e) {
    if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
    var t = e.target, tag = t && t.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || (t && t.isContentEditable)) return;
    e.preventDefault();
    var q = $("#q");
    if (q) q.focus(); else location.href = base + "/search/";
  });
})();
