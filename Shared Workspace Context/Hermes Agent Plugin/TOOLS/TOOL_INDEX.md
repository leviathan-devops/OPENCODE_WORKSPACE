# TOOL INDEX — All 65+ Tools

---

## Phase Enforcement Tools (6)

| Tool | File | Purpose |
|------|------|---------|
| `checkpoint` | `checkpoint.ts` | Git stash + session savepoint |
| `phase_complete` | `phase-complete.ts` | Mark phase done, advance state machine |
| `save_plan` | `save-plan.ts` | plan.json → auto-generate plan.md |
| `update_task_status` | `update-task-status.ts` | Mark tasks complete, advance state machine |
| `check_gate_status` | `check-gate-status.ts` | Query current phase + gate status |
| `declare_scope` | `declare-scope.ts` | Document what's in/out of current task |

---

## Knowledge Tools — 2nd-Brain (5)

| Tool | File | Purpose |
|------|------|---------|
| `hermes_recall` | `hermes-recall.ts` | Query 2nd-brain: "what do we know about X?" |
| `hermes_remember` | `hermes-remember.ts` | Store to 2nd-brain: decisions, patterns, learnings |
| `hermes_forget` | `hermes-forget.ts` | Remove from 2nd-brain |
| `hermes_context` | `hermes-context.ts` | Inject relevant 2nd-brain context into session |
| `knowledge_sync` | `knowledge-sync.ts` | Sync 2nd-brain across sessions |

---

## Analysis Tools (10)

| Tool | File | Purpose |
|------|------|---------|
| `complexity_hotspots` | `complexity-hotspots.ts` | Find complex code regions |
| `detect_domains` | `detect-domains.ts` | Identify project domains/boundaries |
| `extract_code_blocks` | `extract-code-blocks.ts` | Parse code from markdown/long outputs |
| `gitingest` | `gitingest.ts` | Ingest git history for context |
| `imports` | `imports.ts` | Map import dependencies |
| `symbols` | `symbols.ts` | Extract function/class symbols |
| `co_change_analyzer` | `co-change-analyzer.ts` | Detect coupled file changes (ripple) |
| `codebase_stats` | `codebase-stats.ts` | LOC, language distribution |
| `dependency_tree` | `dependency-tree.ts` | Build dependency graph |
| `call_graph` | `call-graph.ts` | Map function call relationships |

---

## Quality Tools (12)

| Tool | File | Purpose |
|------|------|---------|
| `lint` | `lint.ts` | Run linter, parse output |
| `diff` | `diff.ts` | Show uncommitted changes |
| `build_check` | `build-check.ts` | Verify build passes |
| `syntax_check` | `syntax-check.ts` | Verify syntax valid |
| `test_runner` | `test-runner.ts` | Execute test suite, parse results |
| `placeholder_scan` | `placeholder-scan.ts` | Find TBD/TODO/placeholder in code |
| `sast_scan` | `sast-scan.ts` | Static analysis security scan |
| `secret_scan` | `secret-scan.ts` | Detect secrets/credentials |
| `sbom_generate` | `sbom-generate.ts` | Software bill of materials |
| `doc_scan` | `doc-scan.ts` | Scan for missing/outdated docs |
| `doc_extract` | `doc-extract.ts` | Extract documentation from code |
| `quality_budget` | `quality-budget.ts` | Enforce code quality thresholds |

---

## Verification Tools (5)

| Tool | File | Purpose |
|------|------|---------|
| `grill` | `grill.ts` | Adversarial challenge: attack vectors |
| `verify` | `verify.ts` | Proof-based completion verification |
| `health` | `health.ts` | Project health score (0-100) |
| `evidence_check` | `evidence-check.ts` | Verify task evidence completeness |
| `retrieve_summary` | `retrieve-summary.ts` | Get compressed tool output summaries |

---

## Agent Dispatch Tools (5)

| Tool | File | Purpose |
|------|------|---------|
| `agent_dispatch` | `agent-dispatch.ts` | Spawn subagent (Full or Lite mode) |
| `agent_status` | `agent-status.ts` | Query subagent state |
| `agent_cancel` | `agent-cancel.ts` | Cancel running subagent |
| `agent_list` | `agent-list.ts` | List active subagents |
| `agent_wait` | `agent-wait.ts` | Wait for subagent completion |

---

## Spider Tools Adapted (40)

These are Spider Agent tools adapted for Hermes. See `SOURCE_DECODED/SPIDER_AGENT_STATE.md` for full list.

| Category | Count | Examples |
|----------|-------|---------|
| Knowledge | 6 | `knowledgeAdd`, `knowledgeRecall`, `knowledgeRemove` |
| State | 5 | `getCurrentState`, `updateState`, `snapshotState` |
| Task | 6 | `createTask`, `completeTask`, `failTask` |
| Evidence | 4 | `addEvidence`, `getEvidence`, `verifyEvidence` |
| Validation | 5 | `validateSpec`, `validateTest`, `validateBuild` |
| Session | 4 | `saveSession`, `loadSession`, `listSessions` |
| Misc | 10 | `suggestCommand`, `explainError`, `findSimilar` |

---

## Tool Definition Pattern

```typescript
import { tool } from "@opencode-ai/plugin/tool";
import { z } from "zod";

export const myTool = tool({
  description: "What this tool does",
  args: {
    param1: z.string().describe("Description"),
    param2: z.number().optional().describe("Optional param"),
  },
  execute: async (args, context: ToolContext) => {
    // Tool implementation
    // Return string is the tool's output
    return `Result: ${args.param1}`;
  },
});
```

---

## Tool Execution Model (from mal_shaik)

```
CONCURRENT: read-only operations (glob, grep, read, analyze)
  → All run in parallel, share subagent cache

SERIAL: mutating operations (write, edit, bash, patch)
  → One at a time, in order
```

---

## Tool Naming

Tools are registered in `src/index.ts` as:
```typescript
tool: {
  checkpoint: checkpointTool,
  phase_complete: phaseCompleteTool,
  hermes_recall: hermesRecallTool,
  // ...
}
```

They're called by the agent as `tool_name` (snake_case).
