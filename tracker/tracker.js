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

const VALID_STATES = new Set(Object.values(LESSON_STATES));

export function normalizeProgress(raw = {}) {
  const normalizedLessons = {};
  const sourceLessons = raw.lessons && typeof raw.lessons === "object" ? raw.lessons : {};

  for (const lesson of LESSONS) {
    const state = sourceLessons[lesson.id];
    normalizedLessons[lesson.id] = VALID_STATES.has(state)
      ? state
      : LESSON_STATES.NOT_STARTED;
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    lastStudyDate: typeof raw.lastStudyDate === "string" ? raw.lastStudyDate : null,
    lessons: normalizedLessons,
  };
}

export function getLevelForXp(totalXp) {
  const current = [...LEVELS].reverse().find((level) => totalXp >= level.minXp) ?? LEVELS[0];
  const currentIndex = LEVELS.findIndex((level) => level.title === current.title);
  const next = LEVELS[currentIndex + 1] ?? null;
  return { current, next };
}

export function getLessonXp(state) {
  return XP_BY_STATE[state] ?? 0;
}

export function deriveStats(lessons, progress, todayIsoDate) {
  const domainPoints = Object.fromEntries(Object.keys(DOMAIN_LABELS).map((key) => [key, 0]));
  const domainMax = Object.fromEntries(Object.keys(DOMAIN_LABELS).map((key) => [key, 0]));
  const gems = { knowledge: 0, architect: 0, streak: 0, battle: 0, master: 0 };
  const weekCompletion = {};
  let totalXp = 0;

  for (const lesson of lessons) {
    const state = progress.lessons[lesson.id] ?? LESSON_STATES.NOT_STARTED;
    const xp = getLessonXp(state);
    totalXp += xp;
    domainPoints[lesson.domain] += xp;
    domainMax[lesson.domain] += XP_BY_STATE[LESSON_STATES.MASTERED];
    weekCompletion[lesson.week] ??= { total: 0, completed: 0, mastered: 0 };
    weekCompletion[lesson.week].total += 1;

    if (state === LESSON_STATES.COMPLETED || state === LESSON_STATES.MASTERED) {
      gems.knowledge += 1;
      weekCompletion[lesson.week].completed += 1;
    }

    if (state === LESSON_STATES.MASTERED) {
      gems.architect += 1;
      weekCompletion[lesson.week].mastered += 1;
      if (lesson.isMockExam) {
        gems.battle += 1;
      }
    }
  }

  for (const week of Object.values(weekCompletion)) {
    if (week.completed === week.total) {
      gems.master += 1;
    }
  }

  const currentStreak = progress.lastStudyDate === todayIsoDate ? 1 : 0;
  if (currentStreak >= 3) gems.streak += 1;

  return {
    totalXp,
    ...getLevelForXp(totalXp),
    currentStreak,
    gems,
    weekCompletion,
    domainMastery: Object.fromEntries(
      Object.keys(DOMAIN_LABELS).map((key) => [
        key,
        domainMax[key] ? Math.round((domainPoints[key] / domainMax[key]) * 100) : 0,
      ]),
    ),
  };
}

export function renderLessonCard(lesson, state) {
  const prettyHref = lesson.href.replace(/\.md$/, "");
  const isMastered = state === LESSON_STATES.MASTERED;
  const isCompleted = state === LESSON_STATES.COMPLETED;
  const isStudied = state === LESSON_STATES.STUDIED;
  
  let statusBadge = '';
  let icon = 'lock';
  let cardClass = 'glass-panel p-6 rounded-xl transition-all duration-300 cursor-pointer relative group hover:scale-[1.02]';
  let xpIndicator = '';

  if (isMastered) {
    cardClass += ' mastered-glow';
    statusBadge = '<span class="bg-tertiary-container/10 text-tertiary-container px-2 py-1 rounded text-[10px] font-label-caps">MASTERED</span>';
    icon = 'workspace_premium';
  } else if (isCompleted) {
    cardClass += ' border-secondary/40';
    statusBadge = '<span class="bg-secondary/10 text-secondary px-2 py-1 rounded text-[10px] font-label-caps">COMPLETED</span>';
    icon = 'check_circle';
    xpIndicator = '<span class="font-terminal-sm text-[10px] text-secondary">+75 XP</span>';
  } else if (isStudied) {
    cardClass += ' border-primary/40 shadow-[0_0_15px_rgba(45,212,191,0.1)]';
    statusBadge = '<span class="bg-primary/10 text-primary px-2 py-1 rounded text-[10px] font-label-caps">IN PROGRESS</span>';
    icon = 'pending';
    xpIndicator = '<div class="font-terminal-sm text-[10px] text-primary">20%</div>';
  } else {
    cardClass += ' opacity-60 hover:opacity-100 grayscale hover:grayscale-0';
    statusBadge = '<span class="bg-slate-800 text-slate-500 px-2 py-1 rounded text-[10px] font-label-caps">NOT STARTED</span>';
  }

  return `
    <div class="${cardClass}" data-lesson-id="${lesson.id}">
      <div class="absolute top-4 right-4 ${isMastered ? 'text-tertiary-container' : isStudied ? 'text-primary animate-pulse' : isCompleted ? 'text-secondary' : 'text-slate-600'} material-symbols-outlined" data-icon="${icon}">${icon}</div>
      <div class="font-terminal-sm text-xs text-slate-500 mb-1">${lesson.id}</div>
      <h4 class="font-headline-md text-lg mb-4 text-white leading-tight">${lesson.title}</h4>
      
      ${!isMastered && !isCompleted ? `
      <div class="flex gap-2 mb-4">
        <a href="${prettyHref}" class="flex-1 py-2 bg-slate-800 text-center text-primary-fixed text-[10px] font-label-caps border border-primary/20 hover:bg-primary/10 transition-colors">READ</a>
        <button data-action="${isStudied ? 'completed' : 'studied'}" class="flex-1 py-2 bg-primary text-slate-950 text-[10px] font-label-caps font-black transition-transform active:scale-95">
            ${isStudied ? 'FINISH' : 'START'}
        </button>
      </div>
      ` : ''}

      ${isCompleted ? `
      <div class="flex gap-2 mb-4">
        <button data-action="mastered" class="w-full py-2 bg-tertiary text-slate-950 text-[10px] font-label-caps font-black transition-transform active:scale-95">
            MASTER QUEST
        </button>
      </div>
      ` : ''}

      <div class="flex items-center justify-between mt-auto">
        ${statusBadge}
        ${xpIndicator}
      </div>
    </div>
  `;
}

export function renderWeekSection(weekNumber, lessons, progress) {
  const cards = lessons
    .map((lesson) => renderLessonCard(lesson, progress.lessons[lesson.id] ?? LESSON_STATES.NOT_STARTED))
    .join("");

  return `
    <section class="week-section" data-week="${weekNumber}">
      <div class="flex items-center gap-4 mb-6">
        <h2 class="font-headline-md text-xl text-on-surface uppercase tracking-[0.2em]">Week ${weekNumber}</h2>
        <div class="h-px flex-1 bg-gradient-to-r from-teal-500/30 to-transparent"></div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        ${cards}
      </div>
    </section>
  `;
}

export function renderDashboard(stats) {
  const nextMin = stats.next ? stats.next.minXp : stats.totalXp;
  
  if (typeof document !== "undefined") {
    const xpCount = document.querySelector("#xp-count");
    const xpNext = document.querySelector("#xp-next");
    const levelTitle = document.querySelector("#level-title");
    const currentRank = document.querySelector("#current-rank");
    const countKnowledge = document.querySelector("#count-knowledge");
    const countArchitect = document.querySelector("#count-architect");
    const countBattle = document.querySelector("#count-battle");
    const countStreak = document.querySelector("#count-streak");
    const xpFill = document.querySelector("#xp-fill");

    if (xpCount) xpCount.textContent = stats.totalXp.toLocaleString();
    if (xpNext) xpNext.textContent = ` / ${nextMin.toLocaleString()} XP`;
    if (levelTitle) levelTitle.textContent = `LEVEL ${stats.gems.architect + stats.gems.knowledge} MCP // AUTHENTICATED`;
    if (currentRank) currentRank.textContent = stats.current.title;
    if (countKnowledge) countKnowledge.textContent = stats.gems.knowledge;
    if (countArchitect) countArchitect.textContent = stats.gems.architect;
    if (countBattle) countBattle.textContent = stats.gems.battle;
    if (countStreak) countStreak.textContent = `${stats.currentStreak} DAYS`;
    
    if (xpFill) {
      const currentLevelMin = stats.current.minXp;
      const range = nextMin - currentLevelMin;
      const progressPercent = range > 0 ? ((stats.totalXp - currentLevelMin) / range) * 100 : 100;
      xpFill.style.width = `${progressPercent}%`;
    }
  }

  return `
    <div class="glass-panel p-6 rounded-xl flex-1 flex flex-col">
        <div class="flex items-center gap-2 mb-6">
            <span class="material-symbols-outlined text-primary" data-icon="monitoring">monitoring</span>
            <h3 class="font-headline-md text-sm uppercase tracking-widest text-on-surface">Skill Readout</h3>
        </div>
        <div class="space-y-8 flex-1">
            ${Object.entries(DOMAIN_LABELS)
              .map(([key, label]) => {
                const mastery = stats.domainMastery[key];
                let colorClass = 'bg-primary';
                if (key === 'context') colorClass = 'bg-blue-500';
                if (key === 'prompting') colorClass = 'bg-orange-500';
                if (key === 'agentic') colorClass = 'bg-emerald-500';
                if (key === 'mcp') colorClass = 'bg-purple-500';
                if (key === 'claude_code') colorClass = 'bg-red-500';

                return `
                <div>
                    <div class="flex justify-between font-label-caps text-[10px] mb-2">
                        <span class="text-slate-400">${label.toUpperCase()}</span>
                        <span class="text-primary-fixed">${mastery}%</span>
                    </div>
                    <div class="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                        <div class="h-full ${colorClass} shadow-[0_0_10px_rgba(45,212,191,0.5)]" style="width: ${mastery}%;"></div>
                    </div>
                </div>
                `;
              }).join('')}
        </div>
        <div class="mt-auto pt-6 border-t border-white/5 space-y-4">
            <div class="glass-panel p-4 rounded bg-white/5">
                <div class="font-terminal-sm text-[10px] text-slate-500 mb-1">TOTAL MASTERED</div>
                <div class="text-2xl font-display-lg text-tertiary-container">${stats.gems.architect} / ${LESSONS.length}</div>
            </div>
            <button class="w-full py-4 bg-transparent border border-primary/30 text-primary font-label-caps text-xs tracking-widest hover:bg-primary/10 transition-all flex items-center justify-center gap-2">
                <span class="material-symbols-outlined text-sm" data-icon="analytics">analytics</span>
                EXPAND ANALYTICS
            </button>
        </div>
    </div>
  `;
}

export function loadProgress(storage = globalThis.localStorage) {
  if (!storage?.getItem) {
    return {
      progress: normalizeProgress(),
      warning: "Progress persistence unavailable in this browser. Starting fresh.",
    };
  }

  try {
    const raw = storage.getItem(STORAGE_KEY);
    return {
      progress: raw ? normalizeProgress(JSON.parse(raw)) : normalizeProgress(),
      warning: null,
    };
  } catch {
    return {
      progress: normalizeProgress(),
      warning: "Saved progress could not be read. Starting fresh.",
    };
  }
}

export function saveProgress(progress, storage = globalThis.localStorage) {
  if (!storage?.setItem) return;
  storage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function clearProgress(storage = globalThis.localStorage) {
  if (!storage?.removeItem) return;
  storage.removeItem(STORAGE_KEY);
}

export function applyLessonState(progress, lessonId, nextState, todayIsoDate) {
  return {
    ...progress,
    lastStudyDate: todayIsoDate,
    lessons: {
      ...progress.lessons,
      [lessonId]: nextState,
    },
  };
}

function renderApp(progress) {
  const dashboard = document.querySelector("#dashboard");
  const weeksRoot = document.querySelector("#weeks");
  const stats = deriveStats(LESSONS, progress, new Date().toISOString().slice(0, 10));

  dashboard.innerHTML = renderDashboard(stats);

  const lessonsByWeek = Object.groupBy(LESSONS, ({ week }) => week);
  weeksRoot.innerHTML = Object.entries(lessonsByWeek)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([week, lessons]) => renderWeekSection(Number(week), lessons, progress))
    .join("");
}

function boot() {
  if (typeof document === "undefined") return;
  const warningNode = document.querySelector("#storage-warning");
  const loaded = loadProgress();
  let progress = loaded.progress;
  if (warningNode) {
    warningNode.hidden = !loaded.warning;
    warningNode.textContent = loaded.warning ?? "";
  }
  renderApp(progress);

  document.addEventListener("click", (event) => {
    if (event.target.closest("#reset-progress")) {
      const confirmed = window.confirm("Reset all tracker progress?");
      if (!confirmed) return;
      clearProgress();
      progress = normalizeProgress();
      renderApp(progress);
      return;
    }

    const actionBtn = event.target.closest("[data-action]");
    if (!actionBtn) return;

    const card = actionBtn.closest("[data-lesson-id]");
    const lessonId = card?.dataset.lessonId;
    const lesson = LESSONS.find((entry) => entry.id === lessonId);
    if (!lesson) return;

    const requestedState = actionBtn.dataset.action;
    
    if (requestedState === LESSON_STATES.MASTERED) {
      const confirmed = window.confirm(
        lesson.isMockExam
          ? `Mark ${lesson.id} mastered only if you scored 80% or higher.`
          : `Mark ${lesson.id} mastered only if you can explain it without notes.`,
      );
      if (!confirmed) return;
    }

    const today = new Date().toISOString().slice(0, 10);
    progress = applyLessonState(progress, lessonId, requestedState, today);
    saveProgress(progress);
    renderApp(progress);
  });
}

boot();
