export const AGENT_NAMES = {
  HERMES: "hermes",
  ANALYST: "analyst",
  PLANNER: "planner",
  TDD: "tdd",
  BUILDER: "builder",
  REVIEWER: "reviewer",
  QUALITY_REVIEWER: "quality-reviewer",
  GRILL: "grill",
  RIPPLE: "ripple",
  DRIFT_VERIFIER: "drift-verifier",
  EXPLORER: "explorer",
  ARCHITECT: "architect",
  DEBUGGER: "debugger",
  SUPERVISOR: "supervisor",
  SME: "sme",
  TEST_ENGINEER: "test-engineer",
  DOCS: "docs",
  CRITIC: "critic",
  MEMORY: "memory",
} as const;

export const QA_AGENTS = [
  AGENT_NAMES.REVIEWER,
  AGENT_NAMES.QUALITY_REVIEWER,
] as const;

export const PHASES = {
  IDLE: "idle",
  ANALYZE: "analyze",
  PLAN: "plan",
  BUILD: "build",
  REVIEW: "review",
  DEBUG: "debug",
  COMPLETE: "complete",
} as const;

export const PHASE_ORDER = [
  PHASES.IDLE,
  PHASES.ANALYZE,
  PHASES.PLAN,
  PHASES.BUILD,
  PHASES.REVIEW,
  PHASES.DEBUG,
  PHASES.COMPLETE,
] as const;

export const PHASE_TRANSITIONS: Record<string, string[]> = {
  idle: ["analyze"],
  analyze: ["plan", "idle"],
  plan: ["build", "idle"],
  build: ["review", "debug", "idle"],
  review: ["complete", "build", "debug", "idle"],
  debug: ["build", "review", "complete", "idle"],
  complete: [],
};

export const PLACEHOLDER_PATTERNS = [
  /\bTBD\b/i,
  /\bTODO\b/i,
  /\bFIXME\b/i,
  /\bplaceholder\b/i,
  /\bstub\b/i,
  /implement\s+X\b/i,
  /add\s+validation\b/i,
  /handle\s+error\b/i,
  /\.\.\.\s*$/m,
];
