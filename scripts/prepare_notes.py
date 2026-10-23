#!/usr/bin/env python3
"""Normalize the study notes for the book layout.

One-time (idempotent) pass: moves each note's old header block into YAML front
matter, drops the redundant title lines, strips emoji from prose, and rewrites
internal links to the removed README. Bodies are otherwise untouched; the
original text stays in git history.

Usage:
    python3 scripts/prepare_notes.py              # dry run, prints a summary
    python3 scripts/prepare_notes.py --diff FILE  # show one file's change
    python3 scripts/prepare_notes.py --write      # apply

A snapshot of the old tracker catalog is kept in scripts/manifest.json so the
script still works after tracker/ is retired. Notes that already carry
`book: true` are skipped. New notes: add front matter by hand (see any note).
"""
import difflib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "scripts" / "manifest.json"

PARTS = ["foundations", "tools", "agents", "code", "update", "practice",
         "extras", "developer", "fde", "guides"]

# Emoji / pictographs. Keeps arrows, the check mark and the star (text glyphs).
EMOJI = re.compile("[\U0001F000-\U0001FAFF☀-☄☆-➿⬀-⯿⌀-⏿️‍]")


def build_manifest():
    """Snapshot lesson order/domains from the old tracker, once."""
    js = (ROOT / "tracker" / "tracker.js").read_text()
    dom = dict((int(k), v) for k, v in re.findall(r'^\s*(\d+): "(\w+)",?$', js[: js.index("export const TRACK_LABELS")], re.M))
    lessons = []
    for m in re.finditer(r'\{ id: "([^"]+)", week: (\d+), day: (\d+), title: "([^"]+)", href: "\.\./([^"]+)"(?:, isMockExam: (\w+))?(.*?)\},?\n', js):
        lid, week, day, title, href, mock, rest = m.groups()
        d = re.search(r'domain: "(\w+)"', rest)
        t = re.search(r'track: "([\w-]+)"', rest)
        lessons.append({"id": lid, "week": int(week), "day": int(day), "title": title, "path": href,
                        "mock": mock == "true", "track": (t.group(1) if t else "core"),
                        "domain": (d.group(1) if d else dom.get(int(week)))})
    MANIFEST.write_text(json.dumps(lessons, indent=1, ensure_ascii=False))
    return lessons


def load_manifest():
    if not MANIFEST.exists():
        return build_manifest()
    return json.loads(MANIFEST.read_text())


def part_for(l):
    if l["track"] == "extras":
        return "extras"
    if l["track"] == "ccdv-f":
        return "developer"
    if l["track"] == "fde":
        return "fde"
    w, i = l["week"], l["id"]
    if w <= 4: return "foundations"
    if w in (5, 6): return "tools"
    if w in (7, 8, 10): return "agents"
    if w == 9: return "code"
    if w == 11 or w == 12 or i == "W13-D7": return "practice"
    if w == 13: return "update"
    raise ValueError(i)


# Files that are not tracker lessons: path -> (part, title, kind, domain, sort key within part)
SPECIAL = {
    "developer/index.md": ("developer", "CCDV-F Developer Track", "intro", None, 0),
    "fde/index.md": ("fde", "The Forward Deployed Engineer Track", "intro", None, 0),
    "fde/roadmap.md": ("fde", "FDE Roadmap", "plan", None, 1),
    "fde/playbook.md": ("fde", "FDE Playbook", "guide", None, 2),
    "FINISH_PLAN.md": ("guides", "Finish Plan: Eight Weeks to Exam-Ready", "plan", None, 0),
    "How_to_Use_Pauls_Guide_After_12_Weeks.md": ("guides", "Using Paul's Guide After Week 12", "guide", None, 1),
    "Mock_Exam_2_60_Questions.md": ("practice", "Mock Exam 2: 60 Questions", "mock", None, 500),
}

KIND_BY_ID = {"W11-D1": "scenario", "W11-D2": "scenario", "W11-D3": "scenario", "W11-D4": "scenario",
              "W11-D5": "scenario", "W11-D6": "scenario", "W12-D1": "mock", "W13-D7": "mock", "DEV-MOCK": "mock"}

META = re.compile(r"^\*\*(Date completed|Study time|Curriculum phase|Exam domain|Last verified):\*\*\s*(.*)$")


def strip_emoji(line, in_fence):
    if in_fence or not EMOJI.search(line):
        return line
    if "✅" in line and "❌" in line:                      # feature-comparison table
        line = line.replace("✅", "Yes ·").replace("❌", "No ·")
    out = EMOJI.sub("", line)
    out = re.sub(r"[ \t]{2,}", " ", out)
    out = re.sub(r"\*\*\s+", "**", out) if out.lstrip().startswith(("> **", "**")) else out
    return out.rstrip() if out.strip() else out


def process(path, info):
    text = path.read_text()
    if re.search(r"^book: true$", text.split("\n---", 2)[0] if text.startswith("---") else "", re.M):
        return None
    body = text
    if body.startswith("---\n"):
        end = body.index("\n---\n", 4)
        body = body[end + 5:]
    lines = body.lstrip("\n").split("\n")

    meta = {}
    h1 = None
    # leading H1
    while lines and not lines[0].strip():
        lines.pop(0)
    if lines and lines[0].startswith("# "):
        h1 = lines.pop(0)[2:].strip()
    while lines and not lines[0].strip():
        lines.pop(0)
    # optional H2 directly under the H1 (topic title or subtitle)
    sub = None
    if lines and lines[0].startswith("## ") and (info["standard"] or len(lines) > 1):
        nxt = next((x for x in lines[1:6] if x.strip()), "")
        if info["standard"] or META.match(nxt) or nxt.strip().startswith("---"):
            sub = lines.pop(0)[3:].strip()
    # metadata block
    i = 0
    while i < len(lines) and (not lines[i].strip() or META.match(lines[i])):
        m = META.match(lines[i])
        if m:
            meta[m.group(1)] = m.group(2).strip().strip("*")
        i += 1
    if i and any(META.match(x) for x in lines[:i]):
        lines = lines[i:]
        if lines and lines[0].strip() == "---":
            lines.pop(0)
    elif lines and lines[0].strip() == "---":
        lines.pop(0)
    while lines and not lines[0].strip():
        lines.pop(0)

    # emoji + links
    fence = False
    new = []
    for ln in lines:
        if ln.startswith("```"):
            fence = not fence
        ln = strip_emoji(ln, fence) if not fence else ln
        ln = ln.replace("](../README.md)", "](../index.md)").replace("](./README.md)", "](./index.md)")
        new.append(ln)
    body = "\n".join(new).rstrip("\n") + "\n"

    minutes = ""
    if "Study time" in meta:
        mm = re.search(r"(\d+)(?:\s*[–-]\s*(\d+))?", meta["Study time"])
        if mm:
            minutes = f"{mm.group(1)}–{mm.group(2)}" if mm.group(2) else mm.group(1)
    fm = ["---", "layout: note", f'title: "{info["title"]}"', f'id: {info["id"]}', f'part: {info["part"]}',
          f'order: {info["order"]}', f'kind: {info["kind"]}', "book: true"]
    if info["domain"]:
        fm.insert(5, f'domain: {info["domain"]}')
    if minutes:
        fm.append(f'minutes: "{minutes}"')
    if meta.get("Last verified"):
        fm.append(f'verified: "{meta["Last verified"]}"')
    ed = meta.get("Exam domain") or meta.get("Exam")
    if ed:
        fm.append('exam_domain: "' + ed.replace('"', "'") + '"')
    if sub and not info["standard"]:
        fm.append('standfirst: "' + sub.replace('"', "'") + '"')
    fm.append("---\n")
    return "\n".join(fm) + "\n" + body


def plan():
    lessons = load_manifest()
    items = {}
    part_seq = {p: 0 for p in PARTS}
    # lesson notes in reading order of parts
    by_part = {p: [] for p in PARTS}
    for l in lessons:
        by_part[part_for(l)].append(l)
    out = {}
    for pi, p in enumerate(PARTS):
        base = (pi + 1) * 1000
        seq = 0
        specials = sorted([(v[4], k, v) for k, v in SPECIAL.items() if v[0] == p], key=lambda x: x[0])
        for key, k, v in specials:
            if key < 100:
                out[k] = {"id": Path(k).stem if "/" in k else Path(k).stem, "title": v[1], "part": p, "kind": v[2],
                          "domain": v[3], "order": base + key, "standard": False}
        for l in by_part[p]:
            seq += 1
            kind = KIND_BY_ID.get(l["id"], "extra" if p == "extras" else "note")
            out[l["path"]] = {"id": l["id"], "title": l["title"], "part": p, "kind": kind,
                              "domain": l["domain"] if p not in ("developer", "fde") else (
                                  "context" if l["id"].startswith("DEV") else None),
                              "order": base + 10 + seq, "standard": True}
        for key, k, v in specials:
            if key >= 100:
                out[k] = {"id": Path(k).stem, "title": v[1], "part": p, "kind": v[2], "domain": v[3],
                          "order": base + key, "standard": False}
    # nicer ids for special notes
    for k, v in out.items():
        v["id"] = {"developer/index.md": "DEV", "fde/index.md": "FDE", "fde/roadmap.md": "FDE-ROADMAP",
                   "fde/playbook.md": "FDE-PLAYBOOK", "FINISH_PLAN.md": "PLAN",
                   "How_to_Use_Pauls_Guide_After_12_Weeks.md": "GUIDE",
                   "Mock_Exam_2_60_Questions.md": "MOCK2"}.get(k, v["id"])
    # fde projects
    for l in lessons:
        if l["id"].startswith("FDE-P"):
            out[l["path"]]["order"] = 9000 + 10 + int(l["id"][-1]) + 2
            out[l["path"]]["standard"] = False
    return out


def fix_details(text):
    """Make <details> bodies parse as Markdown under kramdown (GitHub ignores the attributes)."""
    text = re.sub(r"<details>\s*<summary>(.*?)</summary>[ \t]*\n?",
                  lambda m: '<details markdown="1">\n<summary markdown="span">' + m.group(1) + "</summary>\n\n", text)
    return text


def run_fix_details(write):
    n = 0
    for p in ROOT.glob("**/*.md"):
        if any(x in p.parts for x in ("node_modules", "vendor", "docs", "_site")):
            continue
        t = p.read_text()
        new = fix_details(t)
        if new != t:
            n += 1
            if write:
                p.write_text(new)
    print(f"{'fixed' if write else 'would fix'} <details> in {n} files")


def fix_fences(text):
    """kramdown needs a blank line before a fenced block; CommonMark does not."""
    out, fence = [], None
    for ln in text.split("\n"):
        m = re.match(r"^(\s*)(`{3,})", ln)
        if m and fence is None:
            if out and out[-1].strip() and not out[-1].lstrip().startswith("```"):
                out.append("")
            fence = m.group(2)
        elif m and fence is not None and ln.strip() == fence:
            fence = None
        out.append(ln)
    return "\n".join(out)


def run_fix_fences(write):
    n = 0
    for p in ROOT.glob("**/*.md"):
        if any(x in p.parts for x in ("node_modules", "vendor", "docs", "_site")):
            continue
        t = p.read_text()
        new = fix_fences(t)
        if new != t:
            n += 1
            if write:
                p.write_text(new)
    print(f"{'fixed' if write else 'would fix'} fences in {n} files")


def main():
    if "--fix-fences" in sys.argv:
        return run_fix_fences("--write" in sys.argv)
    if "--fix-details" in sys.argv:
        return run_fix_details("--write" in sys.argv)
    write = "--write" in sys.argv
    only = sys.argv[sys.argv.index("--diff") + 1] if "--diff" in sys.argv else None
    infos = plan()
    changed = skipped = 0
    for rel, info in sorted(infos.items(), key=lambda kv: kv[1]["order"]):
        p = ROOT / rel
        if not p.exists():
            print("MISSING", rel); continue
        new = process(p, info)
        if new is None:
            skipped += 1; continue
        if only and only in rel:
            print("".join(difflib.unified_diff(p.read_text().splitlines(True), new.splitlines(True), rel, rel + " (new)", n=1)))
        if write:
            p.write_text(new)
        changed += 1
    print(f"{'wrote' if write else 'would change'} {changed} files, skipped {skipped}")
    left = [str(x.relative_to(ROOT)) for x in ROOT.glob("**/*.md")
            if not any(s in x.parts for s in ("node_modules", "vendor", "docs", "_site"))
            and str(x.relative_to(ROOT)) not in infos and x.name not in ("README.md", "index.md")]
    if left:
        print("not in manifest:", left)


if __name__ == "__main__":
    main()
