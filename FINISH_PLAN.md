---
layout: default
title: Finish Plan
---

# Finish Plan: Getting CCAR-F Exam-Ready in 8 Weeks

**Written:** 2026-10-14 · **Budget:** ~6.5 hrs/week (4.5 study + 2 build) · **Start:** Monday 2026-10-19 · **Target:** exam-ready by 2026-12-14

You started this 4–5 months ago and stalled. The vault is now 61 core notes, 23 extras, 6 scenarios and 2 mocks. **Do not try to read all of it.** Finishing means *passing a timed mock under a bar*, not reaching the last file.

---

## Why It Stalled (and the Fix)

| Likely cause | Fix in this plan |
|---|---|
| Unit of work too big (a 700-line note plus Q&A plus hands-on) | One **core** note = 45 min read + 15 min self-quiz. Hands-on only where marked ★ |
| Linear order (W1 → W12) meant the hardest, highest-weight material came last | Domain-by-weight order: **start with Agentic (27%)** |
| No signal of progress or gaps | **Diagnostic mock first**, then a gate every 2 weeks |
| All-or-nothing weeks | Minimum day = **20 minutes** and still counts |
| No deadline | Fixed finish date + exam booking checkpoint |

## Rules

1. **Never restart from W1.** W1–W4 are skim-only unless the diagnostic says otherwise.
2. **Core notes only** (tracker main path). Extras and the Developer track wait until the CCAR-F gate is passed.
3. **Two fixed slots + one weekend block** on the calendar (example: Tue and Thu 45 min, Sat 3 h). Same times every week.
4. **Missed a session? Do not make it up.** Shrink the next week's list instead.
5. **Close each session in the tracker** (mark the lesson Studied or Completed). Streaks beat intentions.
6. Self-quiz **before** opening the answer guide. Wrong answers go on a one-line "mistakes" list (below).

---

## Week 0: Diagnostic (Mon 2026-10-19, 2 hours)

1. Take [Mock Exam 3](./study_materials/W13-D7_Mock_Exam_3_60_Questions.md) **cold**, timed, no notes.
2. Score it per domain from the answer key table.
3. Decide per domain:

| Domain score | Action |
|---|---|
| ≥ 80% | Skim the domain's notes (15 min each), skip hands-on |
| 60–79% | Follow the plan as written |
| < 60% | Add a second pass: re-read, then re-quiz after 48 hours |

Write the result here: Agentic ___ · Claude Code ___ · Prompt/Structured ___ · Tools/MCP ___ · Context ___

---

## The 8 Weeks

Order follows exam weight. Each week lists notes (IDs from the tracker core path). Sessions: ~6 notes max.

| Week | Domain | Notes | Gate |
|---|---|---|---|
| 1 | **Agentic I (27%)** | [W7-D1](./study_materials/W7-D1_What_Is_an_Agentic_Loop.md) · [D2](./study_materials/W7-D2_Loop_Anatomy_Plan_Act_Observe.md) · [D3](./study_materials/W7-D3_Stop_Conditions.md) · [D4](./study_materials/W7-D4_Error_Recovery_in_Loops.md) · [D5 ★ build](./study_materials/W7-D5_Build_a_Simple_Agent.md) | Explain the loop and 5 stop conditions without notes |
| 2 | **Agentic II (27%)** | [W8-D1](./study_materials/W8-D1_Why_Multiple_Agents.md) · [D2](./study_materials/W8-D2_Hub_and_Spoke_Architecture.md) · [D3](./study_materials/W8-D3_Context_Isolation_Deep_Dive.md) · [D4](./study_materials/W8-D4_Lifecycle_Hooks_and_Guardrails.md) · [W13-D1](./study_materials/W13-D1_Agent_SDK_and_Four_Ways_to_Build_Agents.md) | Draw hub-and-spoke from memory; quiz yourself on the 4 build paths |
| 3 | **Claude Code (20%)** | [W9-D1](./study_materials/W9-D1_What_Is_Claude_Code.md) · [D2](./study_materials/W9-D2_CLAUDE_md_The_Config_File.md) · [D3](./study_materials/W9-D3_Slash_Commands_and_claude_commands.md) · [D4](./study_materials/W9-D4_Claude_Code_in_CICD.md) · [W13-D2 ★ build a hook](./study_materials/W13-D2_Claude_Code_Skills_Subagents_Plugins_Hooks.md) | **Mid-gate:** retake the weak-domain Mock 3 questions; ≥ 70% |
| 4 | **Tools (18%)** | [W5-D1](./study_materials/W5-D1_What_Is_Tool_Use.md) · [D2](./study_materials/W5-D2_Defining_Your_First_Tool.md) · [D3](./study_materials/W5-D3_Tool_Description_Quality.md) · [D4](./study_materials/W5-D4_Handling_Tool_Results.md) · [W13-D3 ★ extractor](./study_materials/W13-D3_Structured_Outputs_Strict_Tools_Tool_Runner.md) | Rewrite one bad tool description; run the extractor |
| 5 | **MCP + Managed Agents** | [W6-D1](./study_materials/W6-D1_What_Is_MCP_and_Why_It_Exists.md) · [D2](./study_materials/W6-D2_MCP_Server_Architecture.md) · [D3 ★ server](./study_materials/W6-D3_Build_Your_First_MCP_Server.md) · [D4](./study_materials/W6-D4_Tool_Boundary_Design.md) · [W13-D4](./study_materials/W13-D4_Managed_Agents.md) | Your MCP server running (this is portfolio P1) |
| 6 | **Context (15%) + Prompting (20%)** | [W13-D5](./study_materials/W13-D5_Context_Management_Effort_Caching.md) · [W13-D6](./study_materials/W13-D6_Files_Batch_Citations_Server_Tools.md) · [W9-D5](./study_materials/W9-D5_Prompt_Caching.md) · [W3-D3](./study_materials/W3-D3_JSON_Schema_Enforcement.md) · [W3-D4](./study_materials/W3-D4_Validation_and_Retry_Loops.md) · [W10-D1](./study_materials/W10-D1_Handoff_Patterns.md) | Cache hit/miss observed once; retry loop written |
| 7 | **Scenarios** | One per day, 25 min each: [S1](./study_materials/W11-D1_Exam_Scenario_1_Customer_Support.md) · [S2](./study_materials/W11-D2_Exam_Scenario_2_Code_Generation.md) · [S3](./study_materials/W11-D3_Exam_Scenario_3_Multi_Agent_Research.md) · [S4](./study_materials/W11-D4_Exam_Scenario_4_Developer_Productivity.md) · [S5](./study_materials/W11-D5_Exam_Scenario_5_Claude_Code_in_CI.md) · [S6](./study_materials/W11-D6_Exam_Scenario_6_Structured_Data_Extraction.md) | Each scenario ≥ 80% |
| 8 | **Exams** | Retake [Mock 3](./study_materials/W13-D7_Mock_Exam_3_60_Questions.md) timed (day 1); fix gaps (days 2–4); take [W12 mock](./study_materials/W12-D1_Full_Mock_Exam_60_Questions.md) timed (day 5) | **Done bar:** ≥ 80% overall and ≥ 70% in every domain on both |

Skim list (15 min each, any spare slot): W1-D3 context window, W1-D4 system vs user, W2-D1 good prompt, W3-D1 few-shot, W4-D1 messages API, W4-D5 errors, W10-D2 confidence calibration.

**Build track (2 h/week, parallel):** weeks 1–4 Python (FastAPI, async, pytest); weeks 5–8 portfolio [P1 MCP server](./fde/projects/P1_MCP_Server_for_iOS_Teams.md).

---

## If You Fall Behind

| Situation | Do |
|---|---|
| One week missed | Drop the skim list and ★ builds for the next week; keep core notes |
| Two weeks missed | Push the finish date by two weeks. Do **not** compress |
| Diagnostic ≥ 80% in a domain | Skip that week's reading; just do its scenario questions |
| Lost motivation | Do only the 20-minute minimum day; open one scenario and answer 3 questions |

## Mistakes List (fill as you go)

| Date | Question / topic | Why I missed it | Rule to remember |
|---|---|---|---|
|  |  |  |  |

---

## Exam Access Checkpoint

Finishing the study is **not** the same as being certified. Registration needs a Claude Partner Academy account tied to a partner organization (no personal email).

- **By end of Week 4:** ask your employer if they are in, or will join, the Claude Partner Network.
- **By end of Week 8:** if still no access, keep the mocks warm (one mock per month) and put "land a partner-firm role" at the top of the [FDE roadmap](./fde/roadmap.md).
- When access opens: book within 2 weeks, retake a mock 3 days before, and do not cram new material.

## After CCAR-F

Move to the [CCDV-F Developer track](./developer/index.md), about 3 weeks of work, then the [FDE roadmap](./fde/roadmap.md) phases.

*Back to [hub](./index.md).*
