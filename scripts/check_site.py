#!/usr/bin/env python3
"""Checks over the built site (_site). Run after `bundle exec jekyll build`.

 - internal links and assets resolve
 - every book page has an eyebrow, a title and prev/next
 - no emoji left in headings
 - code blocks, tables and <details> in the output match the source
 - no raw Markdown or escaped tags leaked into the page text
 - font payload stays under 300 KB
"""
import re, sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "_site"
BASE = "/Claude-Certified-Architect-Self-Study"
EMOJI = re.compile("[\U0001F000-\U0001FAFF☀-☄☆-➿⬀-⯿⌀-⏿️]")
problems = []


def bad(msg):
    problems.append(msg)


class P(HTMLParser):
    def __init__(self):
        super().__init__(); self.links = []; self.ids = set(); self.stack = []; self.head = []; self.text = []; self.pre = 0
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        for k in ("href", "src"):
            if k in a: self.links.append(a[k])
        if "id" in a: self.ids.add(a["id"])
        self.stack.append(tag)
        if tag == "pre": self.pre += 1
    def handle_endtag(self, tag):
        while self.stack and self.stack[-1] != tag: self.stack.pop()
        if self.stack: self.stack.pop()
    def handle_data(self, d):
        if any(t in ("h1", "h2", "h3", "h4") for t in self.stack): self.head.append(d)
        if not any(t in ("pre", "code", "script", "style") for t in self.stack): self.text.append(d)


def src_counts(md):
    body = re.sub(r"\A---\n.*?\n---\n", "", md, count=1, flags=re.S)
    fences = 0; tables = 0; fence = None; prev = ""
    for ln in body.split("\n"):
        m = re.match(r"^\s*(`{3,})", ln)
        if fence is None and m:
            fences += 1; fence = len(m.group(1)); continue
        if fence is not None:
            if m and len(m.group(1)) >= fence and ln.strip() == m.group(1): fence = None
            continue
        if re.match(r"^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$", ln) and "|" in prev:
            tables += 1
        prev = ln
    return fences, tables, len(re.findall(r"<details", body))


pages = sorted(SITE.rglob("*.html"))
for f in pages:
    rel = f.relative_to(SITE)
    if rel.parts[0].startswith(("lt-", "m-")) or rel.name.startswith(("lt-", "m-")):
        continue
    html = f.read_text()
    if "http-equiv=\"refresh\"" in html:
        continue
    p = P(); p.feed(html)
    for l in p.links:
        u = urlparse(l)
        if u.scheme in ("http", "https", "mailto", "javascript", "data") or not l or l.startswith("#"):
            continue
        path = unquote(u.path)
        if path.startswith(BASE): path = path[len(BASE):]
        elif path.startswith("/"): bad(f"{rel}: link outside baseurl {l}"); continue
        else: path = str((f.parent / path).resolve().relative_to(SITE.resolve())) if (f.parent / path).exists() else path
        t = SITE / path.lstrip("/")
        if t.is_dir(): t = t / "index.html"
        if not t.exists(): bad(f"{rel}: broken link {l}")
    htext = "".join(p.head)
    if EMOJI.search(htext): bad(f"{rel}: emoji in heading: {EMOJI.findall(htext)}")
    text = "".join(p.text)
    for pat, name in (("```", "code fence"), ("&lt;/", "escaped tag"), ("<summary", "raw summary")):
        if pat in text or (pat == "&lt;/" and pat in html.split("</head>", 1)[-1].replace("<pre", "").replace("</pre>", "") and False):
            bad(f"{rel}: leaked {name}")
    if re.search(r"^\s*\*\*[^*\n]+\*\*", text, re.M) and 'class="prose"' in html:
        bad(f"{rel}: raw ** markers in text")
    if 'class="eyebrow"' in html and 'id="prose"' in html:
        if 'class="prevnext"' not in html: bad(f"{rel}: missing prev/next")
        if "<h1 class=\"title\">" not in html: bad(f"{rel}: missing title")
        # parity with source
        srcrel = rel.with_suffix(".md")
        src = ROOT / srcrel
        if src.exists():
            fences, tables, details = src_counts(src.read_text())
            prose = html.split('id="prose"', 1)[1].split('class="verified', 1)[0].split('id="read-row"', 1)[0]
            pres = len(re.findall(r"<pre[ >]", prose)); tabs = len(re.findall(r"<table", prose)); dets = len(re.findall(r"<details", prose))
            if pres != fences: bad(f"{rel}: code blocks {pres} != source {fences}")
            if tabs != tables: bad(f"{rel}: tables {tabs} != source {tables}")
            if dets != details: bad(f"{rel}: details {dets} != source {details}")

fonts = sum(f.stat().st_size for f in (SITE / "assets/fonts").glob("*.woff2"))
if fonts > 300_000: bad(f"fonts {fonts} bytes > 300000")
print(f"pages checked: {len(pages)}  fonts: {fonts/1024:.0f} KB  problems: {len(problems)}")
for m in problems[:60]: print(" -", m)
sys.exit(1 if problems else 0)
