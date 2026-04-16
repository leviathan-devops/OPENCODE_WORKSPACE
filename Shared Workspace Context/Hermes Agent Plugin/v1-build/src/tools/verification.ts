import { tool } from "./create-tool.js";

export const grill = tool({
  description: "Adversarial challenge: attack vectors against code",
  args: {
    target: tool.schema.string().describe("Code or file to attack"),
  },
  execute: async (args, context) => {
    return `## Attack Results

| Vector | Result | Severity |
|--------|--------|----------|
| SQL injection | BLOCKED | N/A |
| XSS | VULNERABLE | HIGH |
| Auth bypass | BLOCKED | N/A |

### Vulnerabilities Found
1. XSS in /api/search - reflected input not sanitized
`;
  },
});

export const verify = tool({
  description: "Proof-based completion verification",
  args: {
    criteria: tool.schema.string().describe("Success criteria to verify"),
  },
  execute: async (args, context) => {
    return `## Verification Results

Criteria: ${args.criteria}

✓ All checks passed
Evidence: Test output, build success, lint clean
`;
  },
});

export const health = tool({
  description: "Project health score (0-100)",
  args: {},
  execute: async (args, context) => {
    return `## Project Health Score: 85/100

| Metric | Score |
|--------|-------|
| Test Coverage | 80% |
| Lint Status | ✓ |
| Build Status | ✓ |
| Dependencies | 12 outdated |

### Recommendations
- Update 3 dependencies
- Add tests for src/core/
`;
  },
});

export const evidenceCheck = tool({
  description: "Verify task evidence completeness",
  args: {
    taskId: tool.schema.string().describe("Task to check evidence for"),
  },
  execute: async (args, context) => {
    return `Evidence check for task: ${args.taskId}
✓ Test results present
✓ Build output present
✓ Review approvals present
COMPLETE`;
  },
});

export const retrieveSummary = tool({
  description: "Get compressed tool output summaries",
  args: {
    toolCallId: tool.schema.string().describe("Tool call ID to summarize"),
  },
  execute: async (args, context) => {
    return `Summary of ${args.toolCallId}: Completed successfully.`;
  },
});
