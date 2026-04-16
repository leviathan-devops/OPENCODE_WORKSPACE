# SHIP HYGIENE REPORT: Kraken V2.0 - MANDATORY PLUGIN ARCHITECTURE

**Date:** 2026-04-12
**Version:** 2.0 (Checkpoint 3 - FINAL)
**Status:** READY FOR SHIP

---

## MANDATORY PLUGIN ARCHITECTURE STEPS

Every OpenCode plugin MUST implement these 5 things or it will fail:

### 1. AGENT IDENTITY WALL (CRITICAL - FROM SHARK v4.8.1 FAILURE)

**Problem:** `setCurrentAgent()` defined but NEVER called. `getCurrentAgent()` always returned undefined. All hooks bypassed.

**The Fix:**
```typescript
// A. Define identity check
function isMyAgent(agent: string | undefined): boolean {
  return agent === 'my-agent' || (agent && agent.startsWith('my-agent'));
}

// B. Define state (module level)
let currentAgentName: string | undefined = undefined;
export function setCurrentAgent(agent: string | undefined): void { currentAgentName = agent; }
export function getCurrentAgent(): string | undefined { return currentAgentName; }

// C. Initialize on chat.message (has agent field, session.created does NOT)
'chat.message': async (input) => {
  const agent = input.agent;
  if (isMyAgent(agent)) {
    setCurrentAgent(agent);  // MUST CALL THIS
  }
}

// D. Identity wall in ALL other hooks
'tool.execute.before': async (input) => {
  if (!isMyAgent(getCurrentAgent())) return;  // EXIT IF NOT OUR AGENT
  // ... rest of hook
}
```

### 2. ONE VERSION PER PLUGIN

**Problem:** v1.1 and v2.0 both in plugin array = hook conflicts.

**The Fix:**
```json
// opencode.json - ONLY ONE VERSION
"plugin": [
  "file:///path/to/plugin-v2.0/dist/index.js"  // NOT v1.1
]
```

### 3. TOOL SUMMARIZATION (FROM SHARK HOTFIX)

**Problem:** Raw tool outputs caused 100K tokens/message.

**The Fix:**
```typescript
'tool.execute.after': [createToolSummarizerHook(), createGateHook()]

function summarizeGrep(output: string): string {
  // Convert 50KB grep to ~200 chars
  return `grep found ${matchCount} matches across ${fileSet.size} files`;
}
```

### 4. COMPACTION = FILE RECOVERY ONLY (FROM SHARK v4.7 FAILURE)

**Problem:** Hook pushed to `output.context` = context BLOAT.

**The Fix:**
```typescript
// session.compacting: Write to FILE only
fs.writeFileSync(path.join(contextDir, 'INJECTION.md'), contextStr);
// DO NOT: output.context.push(contextStr)

// session.created: Read recovery file
if (fs.existsSync(recoveryPath)) {
  const content = fs.readFileSync(recoveryPath, 'utf-8');
}
```

### 5. SESSION CLEANUP (PREVENT MEMORY LEAKS)

**Problem:** Brain state accumulated forever.

**The Fix:**
```typescript
if (event.type === 'session.ended') {
  setCurrentAgent(undefined);  // Clear identity
  council = null;  // Clear brain state
}
```

---

## HOOK EXECUTION ORDER (Correct)

```
1. command.execute.before
2. tool.execute.before       ← Identity wall + Tool enforcement
3. [Tool Execution]
4. tool.execute.after      ← ToolSummarizer → GateHook (ARRAY)
5. chat.message            ← Identity init + Message enforcement
6. experimental.chat.messages.transform
7. experimental.chat.system.transform
8. session.compacting      ← File recovery only (NO context push)
9. session.ended           ← Cleanup
```

---

## PRE-SHIP CHECKLIST

- [x] Build succeeds: `bun run build`
- [x] Bundle size reasonable (~50KB)
- [x] Agent identity check function defined
- [x] setCurrentAgent called on chat.message
- [x] Identity wall in ALL hooks
- [x] Tool summarization implemented
- [x] Compaction writes to FILE only (not context)
- [x] Session cleanup on ended
- [x] Only ONE version in opencode.json

---

## SHARK/MANTA FAILURE LESSONS

| Version | Issue | Result |
|---------|-------|--------|
| Shark v4.8.1 | setCurrentAgent() never called | All hooks bypassed |
| Shark v4.7 | Compaction pushed to context | 100K tokens/message |
| Manta 1.3.5 | Wrong hook format | Hooks not firing |

---

## VERIFICATION COMMANDS

```bash
# Build
cd /path/to/plugin && bun run build

# Check bundle
ls -la dist/index.js  # Should be ~50KB, not 0

# Test in container
docker build -t test-plugin -f container/Dockerfile container/
docker run -it test-plugin

# Verify identity wall
opencode run "my-status" --agent my-agent
# Should show brain: my-agent (not unknown)
```

---

## CONTEXT SYSTEMS STATUS (Kraken V2.0)

| Component | Status | Notes |
|-----------|--------|-------|
| Agent Identity Wall | ✅ WORKING | Identity initialized on chat.message |
| Two-Layer Guardian | ✅ WORKING | Tool + Message enforcement |
| Tool Summarization | ✅ WORKING | grep/ls/read truncated |
| Compaction Recovery | ✅ WORKING | Writes to file, reads on recovery |
| Session Cleanup | ✅ WORKING | session.ended cleanup |
| Gate Evaluation | ✅ WORKING | Per-brain criteria |

---

## ISSUES FIXED IN CHECKPOINT 3

1. **Added Agent Identity Wall** - isKrakenAgent, setCurrentAgent, getCurrentAgent
2. **Fixed chat.message** - Now initializes agent identity (has agent field)
3. **Fixed all hooks** - Identity wall added to tool.before, tool.after, compaction
4. **Fixed compaction** - Removed output.context push, writes to file only
5. **Fixed createCompactionHook** - Also writes to LATEST symlink for recovery

---

**END OF MANDATORY PLUGIN ARCHITECTURE**
