# KRAKEN V2.0 — COMPACTION-PROOF BUILD WORKFLOW

**Version:** 1.0 | **Tokens:** ~8K | **Purpose:** Build v2.0 without catastrophic failure

---

## 🚨 POST-COMPACTION RECOVERY

**READ THIS FIRST IF COMPACTED:**

1. Read `00_COMPACTION_PROOF_KNOWLEDGE_BASE.md` (this dir)
2. Read `03_SESSION_STATE_TRACKER.md` 
3. Check `EXPORTS/` for pre-compaction saves
4. Resume from last decision point

---

## THE ONE RULE

**IF IT'S NOT REAL, IT'S NOT DONE.** Every function executes for real. No theatrical placeholders.

---

## OPENCODE COMPACTION MECHANICS

| Threshold | What Happens |
|-----------|--------------|
| ~170-175K tokens | **OpenCode auto-compacts** |
| Pre-compaction | `experimental.session.compacting` hook fires |
| Post-compaction | Context reduced to ~15% |

**The Hook:**
```typescript
// Pre-compaction hook - INJECT CONTEXT BEFORE COMPACTION
"experimental.session.compacting": async (input, output) => {
  // input: { sessionID: string }
  // output: { context: string[], prompt?: string }
  output.context.push("CRITICAL: Current phase is BUILD...");
  output.context.push("Active file: src/clusters/ClusterInstance.ts...");
}
```

**This is our TIER 1 system.**

---

## WHERE WE ARE

**Project:** `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent-v2.0/`  
**Phase:** BUILD (not complete)  
**Gate:** BUILD  
**Issue:** HTTP daemon wrapper execute endpoint returns success: false  

---

## V2.0 ARCHITECTURE

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  PLANNING   │────▶│  EXECUTION  │◀────│   SYSTEM    │
│   BRAIN     │     │   BRAIN    │     │   BRAIN     │
└─────────────┘     └─────────────┘     └─────────────┘
```

**5 Optimizations (from Shark v4.8.3):**
1. Two-Layer Firewall (Tool + Message enforcement)
2. Mechanical Output Verification (fs.existsSync() checkpoints)
3. Structured Override Commands (typed schema)
4. Explicit Gate Criteria (per-brain requirements)
5. **4-Tier Context Management** (compaction prevention + survival)

**v1.0 functionality PRESERVED (optimized, not replaced)**

---

## 4-TIER CONTEXT MANAGEMENT SYSTEM

| Threshold | Tier | Action | Implementation |
|-----------|------|--------|----------------|
| 65% (~110K) | 0 | Light pruning | DynamicContextPruner |
| 140-150K | 1 | **PRE-EXPORT** | `experimental.session.compacting` hook |
| ~170-175K | 2 | **AUTO-COMPACT** | OpenCode native |
| Post-compact | 3 | **REINJECT** | Hook output.context injection |

**Prevention > Survival.** Stay at 60% or below after cleanup.

---

## PLUGIN SHIP SOP (GOLDEN RULES)

### SKILL ≠ PLUGIN
```
Skill = .md in ~/.hermes/skills/ → agent knowledge
Plugin = .js bundle in opencode.json → OpenCode runtime
```

### Plugin Structure
```
plugins/kraken-agent-v2.0/
├── src/
│   └── index.ts          ← Entry point
├── dist/
│   └── index.js          ← MUST exist after build
├── package.json
└── tsconfig.json
```

### Build Command
```bash
cd plugins/kraken-agent-v2.0
bun build src/index.ts \
  --outdir dist \
  --target bun \
  --format esm \
  --bundle
```

### Register in opencode.json
```json
{
  "plugin": [
    "file:///home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent-v2.0/dist/index.js"
  ]
}
```

### Verify
```bash
opencode --print-logs run "test" --agent default
# Look for: plugin loading success
```

---

## BUILD PHASES

### PHASE 1: FIX WRAPPER DAEMON [NOW]
- [ ] Debug execute endpoint (returns success: false)
- [ ] Test full end-to-end delegation
- [ ] Verify Docker container spawning works

### PHASE 2: BUILD CORE INFRASTRUCTURE
- [ ] ClusterInstance with HTTP execution ✅ (exists)
- [ ] kraken-agent-wrapper.py daemon ✅ (exists)
- [ ] shark v4.7-hotfix-v3 (569 KB) ✅ (exists)
- [ ] manta v1.3.5 (158 KB) ✅ (exists)

### PHASE 3: IMPLEMENT V2.0 OPTIMIZATIONS
- [ ] Two-Layer Firewall (tool + message hooks)
- [ ] Mechanical Output Verification (fs.existsSync)
- [ ] Structured Override Commands (typed schema)
- [ ] Explicit Gate Criteria (per-brain)

### PHASE 4: IMPLEMENT COMPACTION SYSTEM
- [ ] `experimental.session.compacting` hook (Tier 1)
- [ ] DynamicContextPruner (Tier 0)
- [ ] SessionStateTracker auto-update
- [ ] Pre-export to EXPORTS/

### PHASE 5: TEST IN TUI
- [ ] Build plugin: `bun build src/index.ts --outdir dist --target bun --format esm --bundle`
- [ ] Register in opencode.json
- [ ] Test `opencode --print-logs run "test" --agent default`
- [ ] Verify all systems fire

---

## COMPACTION SYSTEM IMPLEMENTATION

### Tier 0: Proactive Pruning (65%)
```typescript
// src/brains/system/context-manager.ts
class DynamicContextPruner {
  private tokenThreshold = 110000; // ~65% of 170K
  
  async prune(): Promise<void> {
    // Remove low-priority context
    // Summarize medium-priority
    // Keep critical always
  }
}
```

### Tier 1: Pre-Compaction Export (140-150K)
```typescript
// src/hooks/compaction-hook.ts
export const compactionHook = {
  "experimental.session.compacting": async (input, output) => {
    const state = loadSessionState();
    output.context.push(
      `## PRE-COMPACTION STATE\nPhase: ${state.phase}\nGate: ${state.gate}\nDecision: ${state.lastDecision}`
    );
  }
};
```

### Tier 3: Dynamic Reinjection
```typescript
// Inject via hook output.context at decision points
output.context.push(`[TIER3] Type: ${type}`);
output.context.push(`What: ${what}`);
output.context.push(`Next: ${next}`);
```

---

## SESSION STATE TRACKER UPDATE PROTOCOL

**UPDATE `03_SESSION_STATE_TRACKER.md` EVERY 15-20K TOKENS**

```markdown
## LAST UPDATED: [TIME]

## STREAM OF CONSCIOUSNESS
What: [1-2 sentences]
Next: [1-2 sentences]  
Gate: [CURRENT]
Tokens: [APPROX]

## ACTIVE ISSUE
Blocker: [what]
Tried: [approaches]
Next: [plan]
```

---

## DEBUG COMMANDS

```bash
# Build plugin
cd /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent-v2.0
bun build src/index.ts --outdir dist --target bun --format esm --bundle

# Start wrapper daemon
nohup python3 .../kraken-agent-v2.0/subagent-manager/wrappers/kraken-agent-wrapper.py > /tmp/kraken-wrapper.log 2>&1 &

# Check health
curl http://localhost:18086/health

# Test execute
curl -X POST http://localhost:18086/execute -H "Content-Type: application/json" -d '{"task": "echo hello", "model": "qwen", "timeout": 30}'

# View logs
tail -f /tmp/kraken-wrapper.log

# Test plugin
opencode --print-logs run "test" --agent default

# Check containers
docker ps | grep kraken
```

---

## FILE REFERENCE MAP

### This Directory
```
/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Active Context/COMPACTION SURVIVAL/
├── 00_COMPACTION_PROOF_KNOWLEDGE_BASE.md  ← YOU ARE HERE
├── 01_IMMEDIATE_RECOVERY.md
├── 02_EMERGENCY_CONTEXT_TEMPLATE.md
├── 03_SESSION_STATE_TRACKER.md            ← UPDATE EVERY 15-20K TOKENS
└── EXPORTS/                               ← Pre-compaction exports
```

### V2.0 Context Library (Full Docs)
```
/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Active Context/V2.0 Optimized/Working Context Library/
├── 01_ARCHITECTURE_OVERVIEW.md
├── 02_CURRENT_STATE.md
├── 06_TWO_LAYER_FIREWALL.md
├── 07_MECHANICAL_OUTPUT_VERIFICATION.md
├── 08_STRUCTURED_OVERRIDE_COMMANDS.md
├── 09_EXPLICIT_GATE_CRITERIA.md
├── 10_GOLDEN_BEHAVIOR_V2.md
└── COMPACTION_MANAGEMENT.md
```

### Plugin Engineering Master Context
```
/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Plugin Engineering/MASTER CONTEXT/
├── PLUGIN_SHIP_SOP.md              ← GOLDEN RULES
├── PLUGIN_CHEATSHEET.md
├── PROPER_PLUGIN_AGENT_BUILD_CONTEXT.md
├── OPENCODE_PLUGIN_HOOK_ARCHITECTURE.md
└── CROSS-PLUGIN-ARCHITECTURE-AUDIT.md
```

### Debug Logs
```
/home/leviathan/OPENCODE_WORKSPACE/DEBUG LOGS/13-kraken-catastrophic-failure-20260413_005709/
```

---

## PLUGIN ENGINEERING KEY HOOKS

| Hook | When | Use |
|------|------|-----|
| `tool.execute.before` | Pre-tool | Validate, block |
| `tool.execute.after` | Post-tool | Track, evidence |
| `chat.message` | On message | Route, delegate |
| `experimental.session.compacting` | **Pre-compact** | **Context injection** |

---

## PROJECT STATE

| Component | Size | Status |
|-----------|------|--------|
| kraken-agent dist | 199 KB | ✅ REAL |
| shark-agent dist | 569 KB | ✅ REAL |
| manta-agent dist | 158 KB | ✅ REAL |
| **TOTAL** | **~926 KB** | ✅ PROPER |

**v2.0 was 52KB (HOLLOW) → Now 926KB (REAL)**

---

## WHAT WE'RE FIXING

**The v2.0 Catastrophic Failure:**
- `simulateTaskExecution()` returned `{success: true}` after 100ms — FAKE
- Bundle went from 521KB → 52KB (90% loss)
- Python wrappers existed but never called

**Fix:** HTTP-based execution via `kraken-agent-wrapper.py` daemon on port 18086

---

## CURRENT BLOCKER

**Wrapper daemon execute endpoint returns success: false**

Likely causes:
1. `wait_healthy()` timing out incorrectly
2. JSON lines parsing issue
3. Port/networking issue

---

## PLUGIN COMMON FAILURE MODES

1. **Forgetting `config` hook** - Agents won't appear in UI
2. **Not using `safeHook`** - One error crashes all hooks
3. **No state persistence** - State lost on restart
4. **Blocking in hooks** - Can freeze OpenCode
5. **No debouncing** - Performance issues
6. **Memory leaks** - Cache/summary accumulation
7. **Missing error handling** - Plugin crashes on edge cases
8. **Confusing SKILL with PLUGIN** - Skill = markdown, Plugin = JS bundle

---

## STATE DIRECTORY PATTERN

Plugin state stored in `.{plugin-name}/`:
```
.kraken-agent/
├── state.json           # Current state
├── plan.md              # Current plan
├── evidence/            # Evidence collection
├── knowledge/           # Persistent knowledge
├── checkpoints/         # Session checkpoints
└── delegation-ledger.json
```

---

## MINIMAL PLUGIN EXAMPLE

```typescript
import { tool, type Plugin, type Hooks } from '@opencode-ai/plugin';
import { z } from 'zod';

export default async function KrakenPlugin(input): Promise<Hooks> {
  return {
    name: 'kraken-agent',
    tool: {
      spawn_cluster_task: tool({
        description: "Spawn task on cluster",
        args: { task: z.string(), clusterId: z.string().optional() },
        execute: async (args, ctx) => {
          return JSON.stringify({ success: true, taskId: ctx.sessionID });
        }
      })
    },
    "experimental.session.compacting": async (input, output) => {
      // Tier 1: Pre-compaction context injection
      const state = loadState();
      output.context.push(`PHASE: ${state.phase}`);
      output.context.push(`GATE: ${state.gate}`);
    }
  };
}
```

---

## NEVER FORGET

1. **IF IT'S NOT REAL, IT'S NOT DONE**
2. **SKILL ≠ PLUGIN** — Plugin = dist/index.js
3. **Build with:** `bun build src/index.ts --outdir dist --target bun --format esm --bundle`
4. **`experimental.session.compacting`** — Pre-compaction hook for Tier 1
5. **170-175K tokens** — OpenCode auto-compacts here
6. **Update session tracker every 15-20K tokens**
7. **Lightweight Tier 3 reinjection** — decision points only

---

**END OF BUILD WORKFLOW**