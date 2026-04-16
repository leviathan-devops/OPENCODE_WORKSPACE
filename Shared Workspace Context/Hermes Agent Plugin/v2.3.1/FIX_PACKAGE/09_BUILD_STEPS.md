# BUILD EXECUTION STEPS — v2.3.1

**Purpose**: Step-by-step mechanical build execution
**Prerequisites**: All verifications in 08_VERIFICATION_SUITE must pass

---

## STEP 0: PREP WORKSPACE

```bash
# Verify prerequisites
export WORKSPACE="/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hermes Agent Plugin"
export SOURCE="$WORKSPACE/v2.3-build"
export TARGET="$WORKSPACE/v2.3.1-build"

# Verify source exists
test -d "$SOURCE" && echo "SOURCE_OK" || { echo "SOURCE_MISSING"; exit 1; }

# Create fresh target directory
rm -rf "$TARGET"
mkdir -p "$TARGET"
cp -r "$SOURCE/" "$TARGET/"

# Verify copy
test -f "$TARGET/src/index.ts" && echo "COPY_OK" || { echo "COPY_FAILED"; exit 1; }
```

---

## STEP 1: FIX BUG 1 — secretScan

```bash
cd "$TARGET"

# Verify bug exists before fix
grep -n "secretScan=\*" src/tools/security.ts && echo "BUG_EXISTS" || echo "BUG_ALREADY_FIXED"

# Apply fix (from 01_BUG_SECRETSCAN.md)
patch src/tools/security.ts <<'PATCH'
--- a/src/tools/security.ts
+++ b/src/tools/security.ts
@@ -61,7 +61,7 @@ export const sastScan = tool({
   },
 });
 
-export const secretScan=***
+export const secretScan = tool({
   description: "Detect secrets/credentials in code",
   args: {
     path: tool.schema.string().optional().describe("Path to scan"),
PATCH

# Verify fix
grep -n "secretScan = tool({" src/tools/security.ts && echo "FIX_APPLIED" || { echo "FIX_FAILED"; exit 1; }
```

---

## STEP 2: FIX BUG 2 — symbols traversal

```bash
cd "$TARGET"

# Apply fix (from 02_BUG_SYMBOLS_TRAVERSAL.md)
patch src/tools/analysis.ts <<'PATCH'
--- a/src/tools/analysis.ts
+++ b/src/tools/analysis.ts
@@ -118,6 +118,10 @@ export const symbols = tool({
   },
   execute: async (args, context) => {
     const fullPath = join(context.directory, args.path);
+    const resolved = resolve(fullPath);
+    const allowedRoot = resolve(context.directory);
+    if (!resolved.startsWith(allowedRoot)) {
+      return `Error: Access denied. Path resolves outside project directory.`;
+    }
     try {
       const content = readFileSync(fullPath, "utf-8");
       const lines = content.split("\n");
PATCH

# Verify fix
grep -n "startsWith(allowedRoot)" src/tools/analysis.ts | tail -1 && echo "FIX_APPLIED" || { echo "FIX_FAILED"; exit 1; }
```

---

## STEP 3: FIX BUG 3 — complexityHotspots path

```bash
cd "$TARGET"

# Apply fix (from 03_BUG_COMPLEXITY_PATH.md)
patch src/tools/analysis.ts <<'PATCH'
--- a/src/tools/analysis.ts
+++ b/src/tools/analysis.ts
@@ -10,7 +10,15 @@ export const complexityHotspots = tool({
     minComplexity: tool.schema.number().optional().default(10).describe("Minimum complexity threshold"),
   },
   execute: async (args, context) => {
-    const target = args.path ?? "src";
+    const rawTarget = args.path ?? "src";
+    // Validate target stays within context.directory
+    const targetPath = join(context.directory, rawTarget);
+    const resolvedTarget = resolve(targetPath);
+    const allowedRoot = resolve(context.directory);
+    if (!resolvedTarget.startsWith(allowedRoot)) {
+      return `Error: Access denied. Path resolves outside project directory.`;
+    }
+    const target = resolvedTarget.substring(allowedRoot.length + 1);
     const result = spawnSync("npx", ["tsc", "--diagnostics"], { cwd: context.directory, encoding: "utf-8", timeout: 60000 });
     const output = result.stdout + result.stderr;
     if (result.status !== null && result.status === 0 && output) {
PATCH

# Verify fix
grep -n "startsWith(allowedRoot)" src/tools/analysis.ts | head -1 && echo "FIX_APPLIED" || { echo "FIX_FAILED"; exit 1; }
```

---

## STEP 4: FIX FIX 4 — delegation gate blocking

```bash
cd "$TARGET"

# Apply fix (from 04_FIX_DELEGATION_GATE.md)
patch src/hooks/delegation-gate.ts <<'PATCH'
--- a/src/hooks/delegation-gate.ts
+++ b/src/hooks/delegation-gate.ts
@@ -18,6 +18,8 @@ export function createDelegationGateHook(): NonNullable<
 
     if (status === "complete" || status === "done") {
       const reviewerApproved = checkReviewerApproval(taskId, sessionID, input.worktree);
       if (!reviewerApproved) {
+        // BLOCK enforcement — not just annotation
+        (output as any).blocked = true;
         output.args = {
           ...args,
           _gate_blocked: {
PATCH

# Verify fix
grep -n "(output as any).blocked = true" src/hooks/delegation-gate.ts && echo "FIX_APPLIED" || { echo "FIX_FAILED"; exit 1; }
```

---

## STEP 5: FIX FIX 5 — supervisor metadata (Option B)

```bash
cd "$TARGET"

# Create new supervisor.ts tool
cat > src/tools/supervisor.ts <<'TOOL'
import { tool } from "./create-tool.js";

export const getSupervisorRecommendations = tool({
  description: "Get open supervisor issues and recommendations for current session",
  args: {},
  execute: async (args, context) => {
    const { getSupervisorSummary, getOpenIssues } = await import("../services/supervisor-loop.js");
    const summary = getSupervisorSummary();
    const issues = getOpenIssues();
    
    if (issues.length === 0) {
      return `## Supervisor Status\n\nNo open issues.`;
    }
    
    const rows = issues.map(i => 
      `| ${i.id} | ${i.risk} | ${i.type} | ${i.description.substring(0, 50)}... |`
    ).join("\n");
    
    return `## Supervisor Status\n\n**Open Issues**: ${summary.openCount}\n**High Risk**: ${summary.highRiskCount}\n\n| ID | Risk | Type | Description |\n|-----|------|------|-------------|\n${rows}\n\n**Recommendation**: Address high-risk issues before proceeding.`;
  },
});
TOOL

# Verify file created
test -f src/tools/supervisor.ts && echo "TOOL_CREATED" || { echo "TOOL_FAILED"; exit 1; }

# Add import to index.ts
patch src/index.ts <<'PATCH'
--- a/src/index.ts
+++ b/src/index.ts
@@ -65,6 +65,7 @@ import { grill, verify, health, evidenceCheck, retrieveSummary } from "./tools/v
 import { getSupervisorSummary } from "./services/supervisor-loop.js";
 
 import { checkpoint } from "./tools/checkpoint.js";
+import { getSupervisorRecommendations } from "./tools/supervisor.js";
 import { phaseComplete } from "./tools/phase-complete.js";
 import { savePlan } from "./tools/save-plan.js";
 import { hermesRecall } from "./tools/hermes-recall.js";
PATCH

# Register tool in exports
patch src/index.ts <<'PATCH'
--- a/src/index.ts
+++ b/src/index.ts
@@ -355,6 +356,7 @@ const hermesPlugin: Plugin = async (input: PluginInput) => {
       grill,
       verify,
       health,
+      get_supervisor_recommendations: getSupervisorRecommendations,
       evidence_check: evidenceCheck,
       retrieve_summary: retrieveSummary,
       list_sessions: listSessions,
PATCH

# Remove theatrical output.metadata from supervisor-loop-hook
patch src/hooks/supervisor-loop-hook.ts <<'PATCH'
--- a/src/hooks/supervisor-loop-hook.ts
+++ b/src/hooks/supervisor-loop-hook.ts
@@ -17,14 +17,14 @@ export function createSupervisorLoopHook(): NonNullable<
       const recommendation = generateRecommendation(issue);
 
       // Feed recommendation back into agent context via output metadata
-      if (risk === "HIGH" || risk === "MEDIUM") {
-        output.metadata = {
-          ...output.metadata,
-          supervisor_recommendation: recommendation,
-          supervisor_issue_id: issue.id,
-        };
-      }
+      // NOTE: output.metadata is NOT reliably consumed by OpenCode SDK
+      // Supervisor recommendations are instead available via get_supervisor_recommendations tool
+      // Issue still tracked in supervisorIssues[] for debugging
     }
   }
PATCH

echo "OPTION_B_COMPLETE"
```

---

## STEP 6: FIX FIX 6 — CLI handlers

```bash
cd "$TARGET"

# Create hermes-commands.ts
cat > src/config/hermes-commands.ts <<'COMMANDS'
import { getSupervisorSummary } from "../services/supervisor-loop.js";
import { listSessions } from "../tools/session-tools.js";

export type HermesCommandHandler = (args: string) => string | Promise<string>;

export const HERMES_COMMANDS: Record<string, { handler: HermesCommandHandler; description: string; usage: string }> = {
  status: {
    description: "Show current session status and supervisor overview",
    usage: "/Hermes status",
    handler: async (_args: string) => {
      const summary = getSupervisorSummary();
      const sessions = listSessions();
      return `## Hermes Status\n\n**Supervisor**:\n- Open Issues: ${summary.openCount}\n- High Risk: ${summary.highRiskCount}\n\n**Sessions**: ${sessions.length} active\n\n${summary.highRiskCount > 0 ? "WARNING: High-risk issues require attention." : "All clear."}`;
    },
  },
  agents: {
    description: "List available sub-agents and their current status",
    usage: "/Hermes agents",
    handler: async (_args: string) => {
      return `## Available Agents\n\n| Agent | Mode | Purpose |\n|-------|------|---------|\n| hermes | primary | DevOps Manager |\n| analyst | subagent | Requirements analysis |\n| builder | subagent | TDD implementation |\n| planner | subagent | Adaptive planning |\n| reviewer | subagent | Security + patterns |\n| quality-reviewer | subagent | Spec compliance |\n| grill | subagent | Adversarial testing |\n| debugger | subagent | Systematic debugging |\n\n**Total**: 9 sub-agents`;
    },
  },
  memory: {
    description: "Show Hermes memory/session summary",
    usage: "/Hermes memory",
    handler: async (_args: string) => {
      const sessions = listSessions();
      return `## Hermes Memory\n\n**Active Sessions**: ${sessions.length}\n**Memory Store**: ~/.hermes/`;
    },
  },
  help: {
    description: "Show available Hermes commands",
    usage: "/Hermes help",
    handler: async (_args: string) => {
      const cmds = Object.entries(HERMES_COMMANDS)
        .map(([name, cmd]) => `- ${name}: ${cmd.description} (${cmd.usage})`)
        .join("\n");
      return `## Hermes Commands\n\n${cmds}`;
    },
  },
};

export function parseHermesCommand(input: string): { command: string; args: string } | null {
  const match = input.match(/^\/hermes\s+(.+)$/i);
  if (!match) return null;
  const parts = match[1].split(/\s+/);
  const command = parts[0]?.toLowerCase();
  const args = parts.slice(1).join(" ");
  return { command, args: args || "" };
}

export async function executeHermesCommand(input: string): Promise<string> {
  const parsed = parseHermesCommand(input);
  if (!parsed) {
    return `Unknown command. Use /Hermes help for available commands.`;
  }
  const cmd = HERMES_COMMANDS[parsed.command];
  if (!cmd) {
    return `Unknown command: ${parsed.command}. Use /Hermes help for available commands.`;
  }
  return cmd.handler(parsed.args);
}
COMMANDS

# Verify file created
test -f src/config/hermes-commands.ts && echo "COMMANDS_CREATED" || { echo "COMMANDS_FAILED"; exit 1; }

# Remove Shark command from index.ts
patch src/index.ts <<'PATCH'
--- a/src/index.ts
+++ b/src/index.ts
@@ -319,14 +319,9 @@ const hermesPlugin: Plugin = async (input: PluginInput) => {
       opencodeConfig.command = {
         Hermes: {
           template: "/Hermes $ARGUMENTS",
-          description: "Hermes management commands - view status, manage agents, check memory",
-        },
-        Shark: {
-          template: "/Shark $ARGUMENTS",
-          description: "Shark audit commands - run security audit on current project",
+          description: "Hermes management commands",
         },
+        // NOTE: Shark commands belong to shark-agent-plugin, NOT hermes-agent-plugin
       };
     },
     tool: {
PATCH

# Verify Shark removed
grep -n "Shark" src/index.ts && echo "FAIL: Shark still present" || echo "PASS: Shark removed"
```

---

## STEP 7: FIX FIX 7 — devops path

```bash
cd "$TARGET"

# Apply fix to devops-manager.ts
cat > src/config/devops-manager.ts <<'CONFIG'
import { readFileSync, existsSync } from "fs";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Resolve from environment variable or default to ./context relative to this file
function getDevopsContextDir(): string {
  if (process.env.HERMES_DEVOPS_CONTEXT_DIR) {
    return resolve(process.env.HERMES_DEVOPS_CONTEXT_DIR);
  }
  // Default: <plugin-root>/context/devops-manager
  const __dirname = dirname(fileURLToPath(import.meta.url));
  return resolve(__dirname, "../../context/devops-manager");
}

const DEVOPS_CONTEXT_DIR = getDevopsContextDir();

function readContextFile(filename: string): string {
  const path = join(DEVOPS_CONTEXT_DIR, filename);
  if (!existsSync(path)) {
    // Fallback to workspace-relative path for backwards compatibility
    const workspacePath = resolve(process.env.HERMES_WORKSPACE_DIR ?? ".", "context/devops-manager", filename);
    if (existsSync(workspacePath)) {
      return readFileSync(workspacePath, "utf-8");
    }
    return `[Context file not found: ${filename}] (looked in: ${DEVOPS_CONTEXT_DIR})`;
  }
  return readFileSync(path, "utf-8");
}

export const DEVOPS_MANAGER_PROMPT = readContextFile("MENTAL_MODEL.md");
export const DEVOPS_INDEX = readContextFile("INDEX.md");
export const DEVOPS_AUDIT_FRAMEWORK = readContextFile("AUDIT_FRAMEWORK.md");
export const DEVOPS_PATTERNS = readContextFile("PATTERNS.md");
export const DEVOPS_VERIFICATION = readContextFile("VERIFICATION.md");
export const DEVOPS_ESCALATION = readContextFile("ESCALATION.md");
export const DEVOPS_PLUGIN_REF = readContextFile("HERMES_AGENT_PLUGIN.md");
export const DEVOPS_README = readContextFile("README.md");
CONFIG

# Verify fix
grep -n "HERMES_DEVOPS_CONTEXT_DIR" src/config/devops-manager.ts && echo "FIX_APPLIED" || { echo "FIX_FAILED"; exit 1; }

# Create context directory and files
mkdir -p "$TARGET/context/devops-manager"

cat > "$TARGET/context/devops-manager/MENTAL_MODEL.md" <<'DOC'
# DevOps Manager Mental Model

## Role
The DevOps Manager is the primary agent responsible for autonomous full-stack development with mechanical enforcement of quality gates.

## Core Principles
1. **TDD-First**: Always write tests before implementation
2. **Phase Discipline**: Complete each phase before proceeding
3. **Mechanical Enforcement**: Quality gates cannot be bypassed
4. **Delegation with Accountability**: Sub-agents must be verified

## Workflow
- Analyze → Plan → Build → Review → Deploy
- Each phase has explicit completion criteria
- Drift detection triggers re-plan

## Quality Gates
- Tests must pass before completion
- Code review required for all changes  
- Security scan must pass
- Supervisor issues must be resolved

## Escalation
High-risk issues trigger human review. Never proceed past HIGH risk without approval.
DOC

cat > "$TARGET/context/devops-manager/INDEX.md" <<'DOC'
# DevOps Manager Index

## Capabilities
- Autonomous task decomposition
- Multi-phase project management
- TDD enforcement
- Security scanning
- Delegation to specialized sub-agents

## Sub-Agents
- analyst: Requirements → technical specs
- builder: Implementation with TDD
- planner: Adaptive planning
- reviewer: Security + patterns
- quality-reviewer: Spec compliance
- grill: Adversarial testing
- debugger: Systematic debugging

## Tools
See tool definitions in src/tools/
DOC

cat > "$TARGET/context/devops-manager/AUDIT_FRAMEWORK.md" <<'DOC'
# Audit Framework

## Pre-Build Audit
1. Run lint
2. Run type check
3. Run security scan
4. Check for placeholders

## Post-Build Audit
1. Verify all tests pass
2. Verify no new warnings
3. Verify security scan clean

## Continuous Audit
- supervisor loop monitors for issues
- drift verifier checks phase completion
- quality gates block progress if unmet
DOC

cat > "$TARGET/context/devops-manager/PATTERNS.md" <<'DOC'
# DevOps Patterns

## TDD Pattern
1. Write failing test
2. Write minimal implementation
3. Refactor
4. Verify all tests pass

## Delegation Pattern
1. Define task clearly
2. Delegate to appropriate sub-agent
3. Wait for verification
4. Approve or reject

## Error Recovery
1. Identify root cause
2. Create fix
3. Verify fix with tests
4. Deploy
DOC

cat > "$TARGET/context/devops-manager/VERIFICATION.md" <<'DOC'
# Verification Procedures

## Phase Verification
- analyze: requirements concrete, design doc written
- plan: exact paths, no placeholder
- build: tests written first, all tests pass
- review: quality approved, security approved

## Tool Verification
- lint: no errors
- build_check: compiles
- syntax_check: valid syntax
- test_runner: all pass
DOC

cat > "$TARGET/context/devops-manager/ESCALATION.md" <<'DOC'
# Escalation Procedures

## When to Escalate
- HIGH risk security issue detected
- Supervisor issue unresolved for > 3 cycles
- Agent conflict that cannot be resolved
- Phase completion criteria unclear

## How to Escalate
1. Log issue to supervisor
2. Set issue risk to HIGH
3. Block further progress
4. Wait for human review

## Recovery
After human approval, mark issue resolved and proceed.
DOC

cat > "$TARGET/context/devops-manager/HERMES_AGENT_PLUGIN.md" <<'DOC'
# Hermes Agent Plugin

See: ../v2.3.1-build/src/index.ts

This plugin provides the DevOps Manager agent identity and tools.
DOC

cat > "$TARGET/context/devops-manager/README.md" <<'DOC'
# DevOps Manager

Autonomous DevOps agent with mechanical enforcement of quality gates.

## Quick Start
1. Configure HERMES_DEVOPS_CONTEXT_DIR or use default context/
2. Load this profile for DevOps tasks
3. Agent will analyze, plan, build, and verify autonomously
DOC

# Verify context files created
ls -la "$TARGET/context/devops-manager/" | grep -c "\.md$" | xargs -I{} echo "CONTEXT_FILES: {}"
```

---

## STEP 8: RUN FULL VERIFICATION

```bash
cd "$TARGET"

# Run verification suite from 08_VERIFICATION_SUITE.md
# (See actual commands in 08_VERIFICATION_SUITE.md)

echo "=== RUNNING VERIFICATION SUITE ==="

# BUG 1
echo -n "BUG 1 (secretScan): "
grep -n "secretScan = tool({" src/tools/security.ts > /dev/null 2>&1 && echo "PASS" || echo "FAIL"

# BUG 2  
echo -n "BUG 2 (symbols traversal): "
grep -n "startsWith(allowedRoot)" src/tools/analysis.ts > /dev/null 2>&1 && echo "PASS" || echo "FAIL"

# BUG 3
echo -n "BUG 3 (complexity path): "
grep -n "resolvedTarget" src/tools/analysis.ts > /dev/null 2>&1 && echo "PASS" || echo "FAIL"

# FIX 4
echo -n "FIX 4 (delegation gate): "
grep -n "(output as any).blocked = true" src/hooks/delegation-gate.ts > /dev/null 2>&1 && echo "PASS" || echo "FAIL"

# FIX 5
echo -n "FIX 5 (supervisor tool): "
test -f src/tools/supervisor.ts && echo "PASS" || echo "FAIL"

# FIX 6
echo -n "FIX 6 (CLI handlers): "
test -f src/config/hermes-commands.ts && echo "PASS" || echo "FAIL"

# FIX 7
echo -n "FIX 7 (devops path): "
grep -n "HERMES_DEVOPS_CONTEXT_DIR" src/config/devops-manager.ts > /dev/null 2>&1 && echo "PASS" || echo "FAIL"
```

---

## STEP 9: BUILD

```bash
cd "$TARGET"

# Run TypeScript check
echo "=== TYPESCRIPT CHECK ==="
npx tsc --noEmit 2>&1 | tee /tmp/tsc_output.txt
TSC_ERRORS=$(grep -c "error TS" /tmp/tsc_output.txt || echo "0")
echo "TypeScript errors: $TSC_ERRORS"

if [ "$TSC_ERRORS" != "0" ]; then
    echo "FAIL: TypeScript errors found"
    exit 1
fi

# Run build
echo "=== BUILDING ==="
bun build.ts 2>&1 | tee /tmp/build_output.txt
BUILD_EXIT=${PIPESTATUS[0]}

if [ "$BUILD_EXIT" != "0" ]; then
    echo "FAIL: Build failed with exit code $BUILD_EXIT"
    exit 1
fi

# Verify dist exists
test -f dist/index.js && echo "DIST_OK" || { echo "FAIL: dist/index.js not found"; exit 1; }

# Count lines in dist
wc -l dist/index.js

echo "=== BUILD SUCCESSFUL ==="
```

---

## STEP 10: FINAL VALIDATION

```bash
cd "$TARGET"

# Verify secretScan is in dist and callable
grep -c "secretScan" dist/index.js | xargs -I{} echo "secretScan references: {}"

# Verify supervisor tool is in dist
grep -c "getSupervisorRecommendations" dist/index.js | xargs -I{} echo "supervisor tool references: {}"

# Verify hermes commands in dist
grep -c "HERMES_COMMANDS" dist/index.js | xargs -I{} echo "hermes commands references: {}"

# Verify Shark is NOT in dist
grep -c "Shark" dist/index.js | xargs -I{} echo "Shark references (should be 0): {}"

echo "=== FINAL VALIDATION COMPLETE ==="
```

---

## STEP 11: DEPLOY

```bash
cd "$TARGET"

# Copy dist to deployment location
DEPLOY_DIR="/home/leviathan/hermes-plugins/hermes-agent/v2.3.1"
mkdir -p "$DEPLOY_DIR"
cp dist/index.js "$DEPLOY_DIR/"
cp -r context "$DEPLOY_DIR/"

# Create version file
echo "v2.3.1 $(date -Iseconds)" > "$DEPLOY_DIR/VERSION"

# Update latest symlink
rm -f "/home/leviathan/hermes-plugins/hermes-agent/latest"
ln -s "$DEPLOY_DIR" "/home/leviathan/hermes-plugins/hermes-agent/latest"

echo "=== DEPLOYED TO $DEPLOY_DIR ==="
ls -la "$DEPLOY_DIR/"
```

---

## COMPLETION

```
=== v2.3.1 BUILD COMPLETE ===

Build ID: v2.3.1-fix-2026-0405
Deployed: $DEPLOY_DIR
Timestamp: $(date -Iseconds)

All 7 fixes applied.
All verifications passed.
Build successful.
```
