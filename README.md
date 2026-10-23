# The CCA Study Book

Study notes for the Claude Certified Architect exam, plus a developer-exam track and a forward-deployed-engineer roadmap.

**Read it here: <https://zulqarnayn.github.io/Claude-Certified-Architect-Self-Study/>**

The site is built from the Markdown in this repository. It is a reading layout, not a docs template: one narrow column, a contents rail, serif body text, and a few small extras (self-quiz mode on the practice scenarios and mocks, a progress page kept in your browser, and a strip showing this week's step of the finish plan).

## What is inside

| Folder | Content |
|---|---|
| `study_materials/` | Over 80 notes: foundations, tools and MCP, agents, Claude Code, the 2026 update, six exam scenarios, three mock exams, extras |
| `developer/` | CCDV-F track: domain map, three notes, a 53-question mock |
| `fde/` | Roadmap, playbook, four portfolio projects |
| `FINISH_PLAN.md` | Eight weeks to exam-ready |

This is not an official guide. Domain weights and scenario names come from third-party summaries; check them against Anthropic's exam guide.

## Writing a note

Each note starts with front matter, then plain Markdown:

```yaml
---
layout: note
title: "Stop Conditions"
id: W7-D3-C          # stable id used by progress tracking and the finish plan
part: agents         # a slug from _data/parts.yml
domain: agentic      # agentic | claude_code | prompting | mcp | context (optional)
order: 3013          # global reading order
kind: note
book: true
minutes: "45–60"
verified: "2026-10"
---
```

Multiple-choice notes use `**Question N.**` blocks with `A) … D)` options and an answer guide (`**QN Answer: X**`); the self-quiz script picks those up automatically (see `tests/site/quiz.test.js` for the accepted shapes). Use blank lines before fenced code blocks, and the `<details markdown="1">` form for hide-and-reveal answers (`python3 scripts/prepare_notes.py --fix-details --write` normalizes older ones).

## Build and check locally

```bash
bundle install                      # github-pages gem, local preview only
bundle exec jekyll serve            # http://127.0.0.1:4000/Claude-Certified-Architect-Self-Study/
npm install && npm test             # progress, search and quiz tests (jsdom)
python3 scripts/check_contrast.py   # WCAG contrast for every token pair
python3 scripts/check_site.py       # links, anatomy, emoji, code/table parity, font weight (run after a build)
```

GitHub Pages builds the site from `main` (no CI). The theme is in `_layouts/`, `_includes/`, `assets/css/book.scss` and `assets/js/`; fonts (Fraunces, Source Serif 4, JetBrains Mono, all OFL) are self-hosted in `assets/fonts/`.
