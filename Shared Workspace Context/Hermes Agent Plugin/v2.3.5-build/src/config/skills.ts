export const SKILLS = {
  brainstorm: {
    name: "brainstorm",
    description: "Socratic pre-planning. Convert vague requirements into concrete specifications.",
    trigger: "/brainstorm",
    steps: [
      "Ask: What problem does this solve?",
      "Ask: Who uses this?",
      "Ask: How do we know it worked?",
      "Ask: What happens when X goes wrong?",
      "Ask: Where does this fit in the existing system?",
    ],
    output: "Design doc at ~/hermes-workspace/docs/plans/YYYY-MM-DD-<topic>-design.md",
  },
  plan: {
    name: "plan",
    description: "Create a no-placeholder implementation plan.",
    trigger: "/plan",
    steps: [
      "Parse approved design doc",
      "Identify dependencies",
      "Create task list with exact file paths",
      "Verify no TBD/TODO/placeholder",
    ],
    output: "plan.json and plan.md",
  },
  tdd: {
    name: "tdd",
    description: "Execute RED-GREEN-REFACTOR cycle.",
    trigger: "/tdd",
    steps: [
      "RED: Write failing test",
      "GREEN: Minimal code to pass",
      "REFACTOR: Clean up",
      "Show actual command output",
    ],
    output: "Passing tests + refactored code",
  },
  debug: {
    name: "debug",
    description: "4-phase systematic debugging.",
    trigger: "/debug",
    steps: [
      "REPRODUCE: Exact steps, expected vs actual",
      "ISOLATE: Binary search through code",
      "HYPOTHESIZE: One cause at a time",
      "FIX: Smallest change, verify",
    ],
    output: "Root cause + verified fix",
  },
  grill: {
    name: "grill",
    description: "Adversarial attack testing.",
    trigger: "/grill",
    steps: [
      "Map attack surface",
      "Execute: SQL injection, XSS, Auth bypass, etc.",
      "Document ALL attempts (not just successes)",
    ],
    output: "Attack report with severity",
  },
  verify: {
    name: "verify",
    description: "Proof-based completion verification.",
    trigger: "/verify",
    steps: [
      "Show actual test results",
      "Show build output",
      "Show lint status",
      "Cite specific evidence",
    ],
    output: "VERIFIED or ISSUES FOUND",
  },
  health: {
    name: "health",
    description: "Project health score (0-100).",
    trigger: "/health",
    steps: [
      "Run test coverage",
      "Check lint status",
      "Check build status",
      "Check dependency freshness",
    ],
    output: "Health score + recommendations",
  },
  remember: {
    name: "remember",
    description: "Store decision to 2nd-brain.",
    trigger: "/remember",
    steps: [
      "Capture: key decision, rationale, alternatives considered",
      "Store with tags for retrieval",
    ],
    output: "Memory file in ~/.hermes/memory/",
  },
  recall: {
    name: "recall",
    description: "Query 2nd-brain for relevant context.",
    trigger: "/recall <topic>",
    steps: [
      "Search memories by topic",
      "Return relevant decisions/patterns",
    ],
    output: "Relevant memories",
  },
  checkpoint: {
    name: "checkpoint",
    description: "Create session savepoint.",
    trigger: "/checkpoint",
    steps: [
      "Git commit with label",
      "Save session state to .hermes/state/",
    ],
    output: "Checkpoint ID + confirmation",
  },
  compact: {
    name: "compact",
    description: "Session compaction to free context.",
    trigger: "/compact",
    steps: [
      "Summarize recent work",
      "Store learnings to 2nd-brain",
      "Prune old context",
    ],
    output: "Compact session",
  },
  finish: {
    name: "finish",
    description: "Wrap up and create completion snapshot.",
    trigger: "/finish",
    steps: [
      "Run verification",
      "Create completion snapshot",
      "Summarize completed work",
      "Update HERMES.md with learnings",
    ],
    output: "Completion report",
  },
};

export type SkillName = keyof typeof SKILLS;
