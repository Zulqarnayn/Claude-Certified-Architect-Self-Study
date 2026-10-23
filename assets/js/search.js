/* Client-side search over search.json (titles, parts, ids and opening words). */
(function (root) {
  "use strict";
  function tokens(s) { return String(s || "").toLowerCase().split(/[^a-z0-9.+#]+/).filter(Boolean); }
  function score(entry, terms) {
    var title = entry.t.toLowerCase(), part = entry.p.toLowerCase(), id = entry.id.toLowerCase(), body = (entry.x || "").toLowerCase();
    var s = 0;
    for (var i = 0; i < terms.length; i++) {
      var t = terms[i], hit = 0;
      if (title.indexOf(t) >= 0) { hit += title.split(/\W+/).indexOf(t) >= 0 ? 8 : 5; }
      if (id.indexOf(t) >= 0) hit += 6;
      if (part.indexOf(t) >= 0) hit += 2;
      if (body.indexOf(t) >= 0) hit += 1;
      if (!hit) return 0;            // every term must match somewhere
      s += hit;
    }
    return s;
  }
  function search(index, query, limit) {
    var terms = tokens(query);
    if (!terms.length) return [];
    return index.map(function (e) { return { e: e, s: score(e, terms) }; })
      .filter(function (r) { return r.s > 0; })
      .sort(function (a, b) { return b.s - a.s || a.e.t.localeCompare(b.e.t); })
      .slice(0, limit || 20).map(function (r) { return r.e; });
  }
  function init() {
    var input = document.getElementById("q");
    if (!input) return;
    var out = document.getElementById("results"), status = document.getElementById("search-status");
    var base = document.body.getAttribute("data-base") || "";
    var index = null;
    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
    function render() {
      if (!index) return;
      var hits = search(index, input.value);
      status.textContent = input.value.trim() ? hits.length + (hits.length === 1 ? " result" : " results") : "";
      out.innerHTML = hits.map(function (h) {
        return '<div class="search-hit"><span class="meta">' + esc(h.p) + " · " + esc(h.id) + '</span><br><a href="' + esc(h.u) + '">' + esc(h.t) + "</a><p>" + esc((h.x || "").slice(0, 170)) + "…</p></div>";
      }).join("");
    }
    var qs = /[?&]q=([^&]*)/.exec(location.search);
    if (qs) input.value = decodeURIComponent(qs[1].replace(/\+/g, " "));
    fetch(base + "/search.json").then(function (r) { return r.json(); }).then(function (j) { index = j; render(); })
      .catch(function () { status.textContent = "Search index could not be loaded."; });
    input.addEventListener("input", render);
  }
  var api = { search: search, score: score, tokens: tokens, init: init };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.BookSearch = api;
  if (typeof document !== "undefined") document.addEventListener("DOMContentLoaded", init);
})(typeof window !== "undefined" ? window : globalThis);
