#!/usr/bin/env python3
"""WCAG contrast check for the colour tokens in assets/css/book.scss."""
import re, sys
from pathlib import Path

src = (Path(__file__).resolve().parent.parent / "assets/css/book.scss").read_text()

def tokens(mixin):
    body = re.search(r"@mixin %s \{(.*?)\n\}" % mixin, src, re.S).group(1)
    return dict(re.findall(r"--([\w-]+):\s*(#[0-9A-Fa-f]{6})", body))

def lum(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    c = [x / 12.92 if x <= 0.03928 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]

def ratio(a, b):
    la, lb = sorted((lum(a), lum(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)

TEXT_ON_PAPER = ["ink", "muted", "accent", "d-agentic", "d-claude_code", "d-prompting", "d-mcp", "d-context"]
fails = 0
for mode in ("light", "dark"):
    t = tokens(mode)
    pairs = [(f, "paper", 4.5) for f in TEXT_ON_PAPER]
    pairs += [(f, "code", 4.5) for f in ("ink", "muted", "t-c", "t-k", "t-s", "t-n", "t-f")]
    pairs += [("ink", "hl", 4.5), ("accent", "hl", 4.5), ("paper", "accent", 4.5), ("muted", "rule", 3.0)]
    for fg, bg, need in pairs:
        r = ratio(t[fg], t[bg])
        ok = r >= need
        fails += not ok
        print(f"{'ok  ' if ok else 'FAIL'} {mode:5} {fg:14} on {bg:6} {r:5.2f} (need {need})")
print("failures:", fails)
sys.exit(1 if fails else 0)
