# Spider Agent - Implementation Notes & Known Bugs

## Plugin Structure

The Spider Agent is an OpenCode plugin located at:
```
~/OPENCODE_WORKSPACE/plugins/spider-agent/
```

Key directories:
- `dist/` - Compiled JavaScript (the actual running code)
- `dist/commands/` - Command handlers for /swarm commands
- `dist/agents/` - Agent definitions and behaviors
- `dist/config/` - Configuration schemas and constants
- `dist/hooks/` - OpenCode hook implementations
- `dist/state/` - State management

The plugin is registered via `package.json` and exposes agents and hooks to OpenCode.

---

## Known Bugs

### BUG 1: Tab Toggle - ORCHESTRATOR_NAME Mismatch

**Severity:** High  
**Status:** UNFIXED in dist/index.js  
**File:** `dist/index.js` line ~135

**Description:**
The TypeScript declaration file (`dist/config/constants.d.ts`) declares:
```typescript
export declare const ORCHESTRATOR_NAME: "architect";
```

But the compiled JavaScript (`dist/index.js`) defines:
```javascript
var QA_AGENTS, PIPELINE_AGENTS, ORCHESTRATOR_NAME = "spider", ...
```

This mismatch causes the tab toggle agent feature to check against "architect" when it should check against "spider".

**Impact:**
- Tab toggle functionality fails to recognize the orchestrator
- Agent session state may become inconsistent

**Fix Procedure:**
In `dist/index.js` line 135, change:
```javascript
ORCHESTRATOR_NAME = "spider"
```
to:
```javascript
ORCHESTRATOR_NAME = "architect"
```
OR update `constants.d.ts` to say `"spider"` (requires rebuild from source).

---

### BUG 2: isSpiderSubAgent Over-Allowance

**Severity:** High  
**Status:** BY DESIGN (but problematic)  
**File:** `dist/index.js` lines 53764-53778

**Description:**
The `isSpiderSubAgent()` function returns `false` for vanilla OpenCode agents:
```javascript
function isSpiderSubAgent(agentName) {
  if (!agentName) return false;
  const stripped = stripKnownSpiderPrefix(agentName);
  const spiderAgents = [
    "spider", "coder", "reviewer", "test_engineer",
    "explorer", "sme", "critic", "docs", "designer"
  ];
  return spiderAgents.includes(stripped);
}

function checkFileAuthority(agentName, filePath, cwd) {
  // Skip authority check for vanilla OpenCode agents (build, plan)
  if (!isSpiderSubAgent(agentName)) {
    return { allowed: true }; // Vanilla agents have full access
  }
  // ... restricted logic for spider agents
}
```

The problem: "plan" and "build" agents (vanilla OpenCode agents) return `false` from `isSpiderSubAgent()`, which grants them FULL ACCESS via `checkFileAuthority()`. However, when OpenCode routes to `plan/build/general/architect` prefixed sessions, these should arguably still be somewhat restricted.

**Impact:**
- The `build` and `plan` vanilla agents get unrestricted file access
- This is BY DESIGN for vanilla agents, but creates confusion when Spider's own `architect` role gets confused with OpenCode's `architect` agent

**Current Behavior:**
| Agent | isSpiderSubAgent | File Access |
|-------|------------------|-------------|
| spider (orchestrator) | true | restricted |
| coder | true | restricted |
| reviewer | true | restricted |
| test_engineer | true | restricted |
| build (vanilla) | false | FULL ACCESS |
| plan (vanilla) | false | FULL ACCESS |
| architect (vanilla) | false | FULL ACCESS |

**Fix Procedure:**
This is a design decision. If vanilla agents should be restricted, add `build` and `plan` to the blocked list in `AGENT_AUTHORITY_RULES`. Currently they are empty objects meaning full access.

---

### BUG 3: Agent Authority Rules Incomplete

**Severity:** Medium  
**Status:** Known  
**File:** `dist/index.js` lines ~53740-53761

**Description:**
The `AGENT_AUTHORITY_RULES` defines restrictions for spider agents but is incomplete:

```javascript
const AGENT_AUTHORITY_RULES = {
  spider: {
    allowedPrefix: [".Spider/"],
    blockedZones: ["generated"]
  },
  coder: {
    allowedPrefix: ["src/", "lib/", "tests/", "generated/"],
    blockedZones: []
  },
  reviewer: {
    allowedPrefix: [],
    blockedExact: [".Spider/state.json"],
    blockedZones: ["generated"]
  },
  test_engineer: {
    allowedPrefix: ["tests/", "spec/", "generated/"],
    blockedZones: ["generated"]
  },
  explorer: {
    allowedPrefix: ["."],
    readOnly: true
  },
  sme: {
    allowedPrefix: ["."],
    readOnly: true
  },
  critic: {
    allowedPrefix: [".Spider/evidence/"],
    blockedZones: ["generated"]
  },
  build: {
    // Vanilla OpenCode build agent - full access
  },
  plan: {
    // Vanilla OpenCode plan agent - full access
  }
};
```

Issues:
- `docs` and `designer` agents are NOT in this list at all
- Missing `architect` entry (the Spider orchestrator role)
- `build` and `plan` have empty objects (full access - by design)

---

### BUG 4: Backup File Pollution

**Severity:** Low  
**Status:** Known  
**File:** `dist/` directory

The `dist/` directory contains multiple backup files:
- `index.js.backup`
- `index.js.backup.20260402`
- `index.js.backup.fallback-fix`
- `index.js.bak.1775093612`
- `index.js.bak2`

These should be removed after validation.

---

## Implementation Notes

### Plugin Registration
The plugin registers these components with OpenCode:
1. **Agents**: spider (orchestrator), coder, reviewer, test_engineer, explorer, sme, critic, docs, designer
2. **Hooks**: command hooks for /swarm commands, file authority hooks, session hooks
3. **Commands**: All /swarm commands (status, plan, agents, turbo, etc.)

### State Files
Spider Agent maintains state in `.Spider/` directory:
- `.Spider/state.json` - Current pipeline state
- `.Spider/plan.json` - Execution plan
- `.Spider/evidence/` - QA gate evidence bundles
- `.Spider/knowledge/` - Hive mind knowledge base

### Pipeline Flow
```
idle → explorer → coder → test_engineer → reviewer → complete
                    ↓
              critic (on drift detection)
```

### Turbo Mode
When enabled (`/swarm turbo on`), Spider Agent:
- Bypasses some QA gates for faster iteration
- Uses smaller models for sub-agents
- Still maintains safety constraints

---

## Build Information

**Last Built:** April 2, 2026  
**Source Location:** `~/OPENCODE_WORKSPACE/Shared Workspace Context/Opencode Macro-Architecture/spider-source/`  
**Dist Location:** `~/OPENCODE_WORKSPACE/plugins/spider-agent/dist/`

To rebuild from source:
```bash
cd ~/OPENCODE_WORKSPACE/Shared\ Workspace\ Context/Opencode\ Macro-Architecture/spider-source
npm run build
```
