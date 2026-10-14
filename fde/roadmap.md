---
layout: default
title: FDE Roadmap
---

# Forward Deployed Engineer Roadmap
## iOS engineer (6 YOE) → Anthropic Applied AI FDE

**Started:** 2026-10 · **Budget:** 5–8 hrs/week · **Horizon:** ~15–18 months · **Last verified:** 2026-10

> What the role is (from Anthropic postings, Aug–Sep 2026; verify at anthropic.com/careers): work on-site with large customers, build production apps on Claude, ship artifacts like **MCP servers, subagents, and agent skills** into customer workflows; 4+ years technical **customer-facing** experience; strong Python; production LLM experience (prompting, agents, evals, deployment at scale); autonomy under ambiguity; frequent travel.

## Honest Gap Analysis

| Requirement | You today | Close the gap by |
|---|---|---|
| Strong Python | Beginner | Phase 0: FastAPI, async, pytest, typing; all portfolio code in Python |
| Production LLM experience | Study-level | Portfolio P1–P4 with evals and cost data; bridge job |
| Customer-facing technical years | None formal | **Bridge job** at a Claude partner/AI consultancy; also unlocks exam access |
| Agents/MCP/skills in production | Notes only | P1 (MCP server), P4 (plugin with skills + hooks) |
| Certs | None | CCAR-F → CCDV-F → CCAR-P (gated by partner access) |
| Differentiator | iOS + mobile UX | Mobile + agent backend projects (P2); few FDEs ship to phones |

**Reality check:** certifications filter and open doors; portfolio and customer track record win interviews.

## Timeline

| Phase | When | Focus | Exit criteria | Done |
|---|---|---|---|---|
| 0 | Oct–Nov 2026 | Repo hygiene (done); Python to production level; start P1 | `pytest` + typed FastAPI service shipped; P1 repo created | [ ] |
| 1 | Dec 2026–Feb 2027 | W13 notes; P1 finished; P2 built; CCAR-F mocks ≥80% | 2 projects public with READMEs + evals | [ ] |
| 2 | Mar–May 2027 | CCDV-F track; P3; **apply to partner firms / AI consultancies** (FDE, Solutions Eng, AI Eng) | Bridge offer | [ ] |
| 3 | Jun–Aug 2027 | Bridge job; sit CCAR-F (month 1) and CCDV-F (by month 3); first client deployment | 2 certs + 1 shipped customer deployment | [ ] |
| 4 | Sep 2027–early 2028 | Client case studies, P4, CCAR-P; apply to Anthropic Applied AI | Applications out; referral conversations | [ ] |

Adjust dates as life happens; keep the **order**.

## Weekly Rhythm (5–8 hrs)

| Block | Hours | What |
|---|---|---|
| Build | 3 | Portfolio code (Python/Go backend + Claude) |
| Notes | 1.5 | Repo notes / track lessons |
| Drill | 1 | Mock exams, flashcards |
| Public | 0.5–1 | Write up a lesson, post a repo update |
| Buffer | 0–1.5 | Catch-up |

## Portfolio

See the project table below (and the [FDE index](./index.md)). Each project ships with: README (problem, architecture diagram), eval results, cost table, "what I'd do differently".

| ID | Project | Hits | Phase |
|---|---|---|---|
| P1 | [MCP server for iOS teams](./projects/P1_MCP_Server_for_iOS_Teams.md) | Tools & MCP | 0–1 |
| P2 | [SwiftUI app + Python agent backend](./projects/P2_SwiftUI_App_with_Agent_Backend.md) | Applications, streaming, guardrails | 1 |
| P3 | [Extraction pipeline + eval harness](./projects/P3_Extraction_Pipeline_and_Eval_Harness.md) | Model selection, evals, structured outputs | 2 |
| P4 | [Claude Code plugin for iOS teams](./projects/P4_Claude_Code_Plugin_for_iOS_Teams.md) | Skills, hooks, subagents, CI | 4 |

## Bridge-Job Search Checklist

- [ ] List 20 Claude partner firms / AI consultancies / AI-native startups with FDE-style roles
- [ ] Portfolio README pinned; 2 public write-ups
- [ ] Tailored one-page "iOS + agents" pitch
- [ ] Ask current employer: would you join the Claude Partner Network, and can I lead it? (also solves exam access)
- [ ] Practice: 20-minute customer demo, scoping call, written postmortem (see [playbook](./playbook.md))

## Skills to Drill Throughout

Agent-directed development (spec → agent → review), evals as tests, context engineering, system design for agents, customer communication (demos, scoping, written reports).

*Back to [hub](../index.md).*
