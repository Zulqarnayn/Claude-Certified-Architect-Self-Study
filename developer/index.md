---
layout: default
title: CCDV-F Developer Track
---

# CCDV-F Developer Track
## Claude Certified Developer – Foundations

**Exam facts (July 2026, third-party mirrors of guide v1.0; confirm in the official guide):** 53 questions · 120 minutes · pass 720/1000 · $125 · Pearson VUE · valid 12 months · registration via Claude Partner Academy (partner-org account required).

**Strategy:** do CCAR-F first (see [README](../README.md)); this track reuses ~50% of that material and adds three net-new notes plus a mock. Target the CCDV-F within ~60 days of CCAR-F.

> Domain titles and weights below come from third-party summaries of the official guide. Subtopics are **my mapping from titles**, not the official blueprint. Read the official PDF first and adjust.

---

## Domain Map

| Domain | Weight | Existing notes to reuse | Net-new |
|---|---|---|---|
| **Applications & Integration** | 33.1% | [W1-D5 First API Call](../study_materials/W1-D5_Your_First_API_Call.md) · [W4-D1 Messages API](../study_materials/W4-D1_Messages_API_Anatomy.md) · [W4-D2 Multi-turn](../study_materials/W4-D2_Multi_Turn_Conversations.md) · [W4-D3 Streaming](../study_materials/W4-D3_Streaming_Responses.md) · [W4-D5 Rate limits and errors](../study_materials/W4-D5_Rate_Limits_and_Error_Handling.md) · [W6-D1 App architecture](../study_materials/W6-D1_Real_World_Application_Architecture.md) · [W13-D3 Structured outputs](../study_materials/W13-D3_Structured_Outputs_Strict_Tools_Tool_Runner.md) · [W13-D6 Files/Batch/Citations](../study_materials/W13-D6_Files_Batch_Citations_Server_Tools.md) | [DEV-D1](./DEV-D1_Applications_and_Integration.md) |
| **Model Selection & Optimization** | 16.8% | [W1-D2 Claude vs others](../study_materials/W1-D2_Claude_vs_Other_AI_Models.md) · [W4-D4 Tokens and cost](../study_materials/W4-D4_Token_Counting_and_Cost.md) · [W5-D5 Cost at scale](../study_materials/W5-D5_Cost_Optimization_at_Scale.md) · [W9-D5 Prompt caching](../study_materials/W9-D5_Prompt_Caching.md) · [W5-D4 Fine-tuning](../study_materials/W5-D4_Fine_Tuning_Considerations.md) · [W13-D5 Context management](../study_materials/W13-D5_Context_Management_Effort_Caching.md) | [DEV-D2](./DEV-D2_Model_Selection_and_Optimization.md) |
| **Agents & Workflows** | 14.7% | [W7-D1 Agentic loop](../study_materials/W7-D1_What_Is_an_Agentic_Loop.md) · [W7-D3 Stop conditions](../study_materials/W7-D3_Stop_Conditions.md) · [W7-D4 Error recovery](../study_materials/W7-D4_Error_Recovery_in_Loops.md) · [W7-D5 Build an agent](../study_materials/W7-D5_Build_a_Simple_Agent.md) · [W8-D1 Why multiple agents](../study_materials/W8-D1_Why_Multiple_Agents.md) · [W8-D2 Hub and spoke](../study_materials/W8-D2_Hub_and_Spoke_Architecture.md) · [W13-D1 Agent SDK](../study_materials/W13-D1_Agent_SDK_and_Four_Ways_to_Build_Agents.md) · [W13-D4 Managed Agents](../study_materials/W13-D4_Managed_Agents.md) | none |
| **Prompt & Context Engineering** | 11.0% | [W1-D3 Context window](../study_materials/W1-D3_The_Context_Window.md) · [W1-D4 System vs user](../study_materials/W1-D4_System_Prompts_vs_User_Messages.md) · [W2-D1 Good prompt](../study_materials/W2-D1_What_Makes_a_Good_Prompt.md) · [W2-D3 Chain of thought](../study_materials/W2-D3_Chain_of_Thought_Prompting.md) · [W3-D1 Few-shot](../study_materials/W3-D1_Few_Shot_Examples.md) · [W3-D4 Validation and retry](../study_materials/W3-D4_Validation_and_Retry_Loops.md) | none |
| **Tools & MCPs** | 10.6% | [W5-D1 Tool use](../study_materials/W5-D1_What_Is_Tool_Use.md) · [W5-D3 Descriptions](../study_materials/W5-D3_Tool_Description_Quality.md) · [W5-D4 Tool results](../study_materials/W5-D4_Handling_Tool_Results.md) · [W6-D1 MCP](../study_materials/W6-D1_What_Is_MCP_and_Why_It_Exists.md) · [W6-D3 Build an MCP server](../study_materials/W6-D3_Build_Your_First_MCP_Server.md) · [W6-D4 Tool boundaries](../study_materials/W6-D4_Tool_Boundary_Design.md) | none |
| **Security & Safety** | 8.1% | [W6-D2 Security and compliance](../study_materials/W6-D2_Security_and_Compliance.md) · [W8-D4 Hooks and guardrails](../study_materials/W8-D4_Lifecycle_Hooks_and_Guardrails.md) · [W13-D6 §6 Security basics](../study_materials/W13-D6_Files_Batch_Citations_Server_Tools.md) | covered in W13-D6 |
| **Claude Code** | 3.1% | [W9-D1](../study_materials/W9-D1_What_Is_Claude_Code.md) · [W9-D2](../study_materials/W9-D2_CLAUDE_md_The_Config_File.md) · [W9-D4](../study_materials/W9-D4_Claude_Code_in_CICD.md) · [W13-D2](../study_materials/W13-D2_Claude_Code_Skills_Subagents_Plugins_Hooks.md) | none |
| **Eval, Testing & Debugging** | 2.6% | [W7-D1 Evaluation frameworks (extra)](../study_materials/W7-D1_Evaluation_Frameworks.md) · [W5-D2 Reliability and testing (extra)](../study_materials/W5-D2_Agent_Reliability_and_Testing.md) | [DEV-D3](./DEV-D3_Evals_Testing_Debugging.md) |

---

## 3-Week Plan (5–8 hrs/week, after CCAR-F)

| Week | Do | Output |
|---|---|---|
| 1 | DEV-D1 lab (FastAPI streaming service + tests) · re-read W4-D3/D5 · W13-D3, W13-D6 | Service repo (portfolio P2 backend) |
| 2 | DEV-D2 benchmark lab · W4-D4, W9-D5, W13-D5 · DEV-D3 eval | `bench.py` + results table (portfolio P3) |
| 3 | Skim Agents/Tools/Security rows · [Mock Exam (53 Q)](./Mock_Exam_53_Questions.md) timed · fix weak domains · retake after 48h | ≥80% overall, ≥70% each domain |

## Net-New Notes

- [DEV-D1 Applications and Integration](./DEV-D1_Applications_and_Integration.md)
- [DEV-D2 Model Selection and Optimization](./DEV-D2_Model_Selection_and_Optimization.md)
- [DEV-D3 Evals, Testing, Debugging](./DEV-D3_Evals_Testing_Debugging.md)
- [Mock Exam (53 Q)](./Mock_Exam_53_Questions.md)

*Back to [main hub](../index.md).*
