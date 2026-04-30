export const STORAGE_KEY = "cca-game-mode.v1";
export const SCHEMA_VERSION = 1;

export const LESSON_STATES = {
  NOT_STARTED: "not_started",
  STUDIED: "studied",
  COMPLETED: "completed",
  MASTERED: "mastered",
};

export const XP_BY_STATE = {
  [LESSON_STATES.NOT_STARTED]: 0,
  [LESSON_STATES.STUDIED]: 25,
  [LESSON_STATES.COMPLETED]: 75,
  [LESSON_STATES.MASTERED]: 125,
};

export const LEVELS = [
  { title: "Prompt Sender", minXp: 0 },
  { title: "API Caller", minXp: 500 },
  { title: "Tool Builder", minXp: 1500 },
  { title: "Agent Crafter", minXp: 3500 },
  { title: "MCP Architect", minXp: 7000 },
  { title: "Multi-Agent Designer", minXp: 12000 },
  { title: "Claude Certified Architect", minXp: 20000 },
];

export const DOMAIN_BY_WEEK = {
  1: "context",
  2: "prompting",
  3: "prompting",
  4: "context",
  5: "agentic",
  6: "mcp",
  7: "agentic",
  8: "agentic",
  9: "claude_code",
  10: "agentic",
  11: "agentic",
  12: "agentic",
};

export const DOMAIN_LABELS = {
  agentic: "Agentic",
  mcp: "MCP",
  claude_code: "Claude Code",
  prompting: "Prompting",
  context: "Context",
};

const VALID_STATES = new Set(Object.values(LESSON_STATES));
const COMPLETED_OR_BETTER = new Set([
  LESSON_STATES.COMPLETED,
  LESSON_STATES.MASTERED,
]);

export const LESSONS = [
  { id: "W1-D1", week: 1, day: 1, title: "LLMs Explained From Scratch", href: "../W1-D1_LLMs_Explained_From_Scratch.md", isMockExam: false },
  { id: "W1-D2", week: 1, day: 2, title: "Claude vs Other AI Models", href: "../W1-D2_Claude_vs_Other_AI_Models.md", isMockExam: false },
  { id: "W1-D3", week: 1, day: 3, title: "The Context Window", href: "../W1-D3_The_Context_Window.md", isMockExam: false },
  { id: "W1-D4", week: 1, day: 4, title: "System Prompts vs User Messages", href: "../W1-D4_System_Prompts_vs_User_Messages.md", isMockExam: false },
  { id: "W1-D5", week: 1, day: 5, title: "Your First API Call", href: "../W1-D5_Your_First_API_Call.md", isMockExam: false },
  { id: "W2-D1", week: 2, day: 1, title: "What Makes a Good Prompt", href: "../W2-D1_What_Makes_a_Good_Prompt.md", isMockExam: false },
  { id: "W2-D2", week: 2, day: 2, title: "Role Prompting and Persona", href: "../W2-D2_Role_Prompting_and_Persona.md", isMockExam: false },
  { id: "W2-D3", week: 2, day: 3, title: "Chain of Thought Prompting", href: "../W2-D3_Chain_of_Thought_Prompting.md", isMockExam: false },
  { id: "W2-D4", week: 2, day: 4, title: "Negative Prompting", href: "../W2-D4_Negative_Prompting.md", isMockExam: false },
  { id: "W2-D5", week: 2, day: 5, title: "Prompt Iteration Practice", href: "../W2-D5_Prompt_Iteration_Practice.md", isMockExam: false },
  { id: "W3-D1", week: 3, day: 1, title: "Few Shot Examples", href: "../W3-D1_Few_Shot_Examples.md", isMockExam: false },
  { id: "W3-D2", week: 3, day: 2, title: "Structured Output JSON Basics", href: "../W3-D2_Structured_Output_JSON_Basics.md", isMockExam: false },
  { id: "W3-D3", week: 3, day: 3, title: "JSON Schema Enforcement", href: "../W3-D3_JSON_Schema_Enforcement.md", isMockExam: false },
  { id: "W3-D4", week: 3, day: 4, title: "Validation & Retry Loops", href: "../W3-D4_Validation_and_Retry_Loops.md", isMockExam: false },
  { id: "W3-D5", week: 3, day: 5, title: "When NOT to Use Structured Output", href: "../W3-D5_When_NOT_to_Use_Structured_Output.md", isMockExam: false },
  { id: "W4-D1", week: 4, day: 1, title: "Messages API Anatomy", href: "../W4-D1_Messages_API_Anatomy.md", isMockExam: false },
  { id: "W4-D2", week: 4, day: 2, title: "Multi-Turn Conversations", href: "../W4-D2_Multi_Turn_Conversations.md", isMockExam: false },
  { id: "W4-D3", week: 4, day: 3, title: "Streaming Responses", href: "../W4-D3_Streaming_Responses.md", isMockExam: false },
  { id: "W4-D4", week: 4, day: 4, title: "Token Counting & Cost", href: "../W4-D4_Token_Counting_and_Cost.md", isMockExam: false },
  { id: "W4-D5", week: 4, day: 5, title: "Rate Limits & Error Handling", href: "../W4-D5_Rate_Limits_and_Error_Handling.md", isMockExam: false },
  { id: "W5-D1", week: 5, day: 1, title: "Multi-Agent Systems", href: "../W5-D1_Multi_Agent_Systems.md", isMockExam: false },
  { id: "W5-D2", week: 5, day: 2, title: "Agent Reliability and Testing", href: "../W5-D2_Agent_Reliability_and_Testing.md", isMockExam: false },
  { id: "W5-D3", week: 5, day: 3, title: "Retrieval Augmented Generation", href: "../W5-D3_Retrieval_Augmented_Generation.md", isMockExam: false },
  { id: "W5-D4", week: 5, day: 4, title: "Fine-Tuning Considerations", href: "../W5-D4_Fine_Tuning_Considerations.md", isMockExam: false },
  { id: "W5-D5", week: 5, day: 5, title: "Cost Optimization at Scale", href: "../W5-D5_Cost_Optimization_at_Scale.md", isMockExam: false },
  { id: "W6-D1", week: 6, day: 1, title: "Real-World Application Architecture", href: "../W6-D1_Real_World_Application_Architecture.md", isMockExam: false },
  { id: "W6-D2", week: 6, day: 2, title: "Security and Compliance", href: "../W6-D2_Security_and_Compliance.md", isMockExam: false },
  { id: "W6-D3", week: 6, day: 3, title: "Analytics and Observability", href: "../W6-D3_Analytics_and_Observability.md", isMockExam: false },
  { id: "W6-D4", week: 6, day: 4, title: "A/B Testing and Experimentation", href: "../W6-D4_A_B_Testing_and_Experimentation.md", isMockExam: false },
  { id: "W6-D5", week: 6, day: 5, title: "Case Studies and Synthesis", href: "../W6-D5_Case_Studies_and_Synthesis.md", isMockExam: false },
  { id: "W7-D1", week: 7, day: 1, title: "Evaluation Frameworks", href: "../W7-D1_Evaluation_Frameworks.md", isMockExam: false },
  { id: "W7-D2", week: 7, day: 2, title: "Human-in-the-Loop Systems", href: "../W7-D2_Human_in_the_Loop_Systems.md", isMockExam: false },
  { id: "W7-D3", week: 7, day: 3, title: "Prompt Lifecycle Management", href: "../W7-D3_Prompt_Lifecycle_Management.md", isMockExam: false },
  { id: "W7-D4", week: 7, day: 4, title: "Cross-Model Validation", href: "../W7-D4_Cross_Model_Validation.md", isMockExam: false },
  { id: "W7-D5", week: 7, day: 5, title: "Deployment and Rollout Strategy", href: "../W7-D5_Deployment_and_Rollout_Strategy.md", isMockExam: false },
  { id: "W8-D1", week: 8, day: 1, title: "Why Multiple Agents", href: "../W8-D1_Why_Multiple_Agents.md", isMockExam: false },
  { id: "W8-D2", week: 8, day: 2, title: "Hub-and-Spoke Architecture", href: "../W8-D2_Hub_and_Spoke_Architecture.md", isMockExam: false },
  { id: "W8-D3", week: 8, day: 3, title: "Context Isolation Deep Dive", href: "../W8-D3_Context_Isolation_Deep_Dive.md", isMockExam: false },
  { id: "W8-D4", week: 8, day: 4, title: "Lifecycle Hooks and Guardrails", href: "../W8-D4_Lifecycle_Hooks_and_Guardrails.md", isMockExam: false },
  { id: "W8-D5", week: 8, day: 5, title: "Build Hub-and-Spoke System", href: "../W8-D5_Build_Hub_and_Spoke_System.md", isMockExam: false },
  { id: "W9-D1", week: 9, day: 1, title: "What Is Claude Code", href: "../W9-D1_What_Is_Claude_Code.md", isMockExam: false },
  { id: "W9-D2", week: 9, day: 2, title: "CLAUDE.md: The Config File", href: "../W9-D2_CLAUDE_md_The_Config_File.md", isMockExam: false },
  { id: "W9-D3", week: 9, day: 3, title: "Slash Commands and .claude/commands/", href: "../W9-D3_Slash_Commands_and_claude_commands.md", isMockExam: false },
  { id: "W9-D4", week: 9, day: 4, title: "Claude Code in CI/CD", href: "../W9-D4_Claude_Code_in_CICD.md", isMockExam: false },
  { id: "W9-D5", week: 9, day: 5, title: "Prompt Caching", href: "../W9-D5_Prompt_Caching.md", isMockExam: false },
  { id: "W10-D1", week: 10, day: 1, title: "Handoff Patterns", href: "../W10-D1_Handoff_Patterns.md", isMockExam: false },
  { id: "W10-D2", week: 10, day: 2, title: "Confidence Calibration", href: "../W10-D2_Confidence_Calibration.md", isMockExam: false },
  { id: "W11-D1", week: 11, day: 1, title: "Exam Scenario 1: Customer Support", href: "../W11-D1_Exam_Scenario_1_Customer_Support.md", isMockExam: false },
  { id: "W11-D2", week: 11, day: 2, title: "Exam Scenario 2: Code Generation", href: "../W11-D2_Exam_Scenario_2_Code_Generation.md", isMockExam: false },
  { id: "W12-D1", week: 12, day: 1, title: "Full Mock Exam: 60 Questions", href: "../W12-D1_Full_Mock_Exam_60_Questions.md", isMockExam: true },
].map((lesson) => ({
  ...lesson,
  domain: DOMAIN_BY_WEEK[lesson.week],
}));

export function normalizeProgress(progress = {}) {
  const rawLessons = progress && typeof progress === "object" ? progress.lessons : {};
  const lessons = {};

  if (rawLessons && typeof rawLessons === "object") {
    for (const [lessonId, state] of Object.entries(rawLessons)) {
      lessons[lessonId] = VALID_STATES.has(state)
        ? state
        : LESSON_STATES.NOT_STARTED;
    }
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    lastStudyDate:
      progress && typeof progress.lastStudyDate === "string"
        ? progress.lastStudyDate
        : null,
    lessons,
  };
}

export function getLessonXp(state) {
  return XP_BY_STATE[state] ?? 0;
}

export function getLevelForXp(xp) {
  let current = LEVELS[0];

  for (const level of LEVELS) {
    if (xp >= level.minXp) {
      current = level;
    }
  }

  const currentIndex = LEVELS.findIndex((level) => level.title === current.title);
  const next = LEVELS[currentIndex + 1] ?? null;

  return { current, next };
}

export function deriveStats(lessons, progress, todayIsoDate) {
  const normalized = normalizeProgress(progress);
  const domainTotals = Object.fromEntries(
    Object.keys(DOMAIN_LABELS).map((domain) => [domain, { earned: 0, max: 0 }]),
  );
  const weekStats = {};
  const gems = {
    knowledge: 0,
    architect: 0,
    battle: 0,
    master: 0,
  };
  let totalXp = 0;

  for (const lesson of lessons) {
    const state = normalized.lessons[lesson.id] ?? LESSON_STATES.NOT_STARTED;
    const xp = getLessonXp(state);
    const weekEntry = weekStats[lesson.week] ?? {
      totalLessons: 0,
      completedLessons: 0,
      masteredLessons: 0,
      isComplete: false,
    };

    totalXp += xp;
    domainTotals[lesson.domain].earned += xp;
    domainTotals[lesson.domain].max += XP_BY_STATE[LESSON_STATES.MASTERED];

    weekEntry.totalLessons += 1;

    if (COMPLETED_OR_BETTER.has(state)) {
      gems.knowledge += 1;
      weekEntry.completedLessons += 1;
    }

    if (state === LESSON_STATES.MASTERED) {
      gems.architect += 1;
      weekEntry.masteredLessons += 1;
      if (lesson.isMockExam) {
        gems.battle += 1;
      }
    }

    weekStats[lesson.week] = weekEntry;
  }

  for (const weekEntry of Object.values(weekStats)) {
    weekEntry.isComplete = weekEntry.completedLessons === weekEntry.totalLessons;
    if (weekEntry.isComplete) {
      gems.master += 1;
    }
  }

  const domainMastery = {};
  for (const [domain, totals] of Object.entries(domainTotals)) {
    domainMastery[domain] = totals.max === 0 ? 0 : Math.round((totals.earned / totals.max) * 100);
  }

  return {
    totalXp,
    level: getLevelForXp(totalXp),
    gems,
    weekStats,
    currentStreak: normalized.lastStudyDate === todayIsoDate ? 1 : 0,
    domainMastery,
  };
}
