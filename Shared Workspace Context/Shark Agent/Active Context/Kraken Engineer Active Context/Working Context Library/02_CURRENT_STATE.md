# Current State — Shark Agent v4.8.3

## Build Status

| Checkpoint | Date | MD5 | Status |
|------------|------|-----|--------|
| 1 | 2026-04-11 20:00 | N/A | Reset to hotfix-v2 |
| 2 | 2026-04-11 21:00 | `97842984a12db0bb3d992a761f8fef23` | Brain init working |

**Location:** `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/`

## Working Components ✅

| Component | File | Status |
|-----------|------|--------|
| Brain initialization | `agent-state.ts` + `chat-message-hook.ts` | ✅ Working |
| shark-status tool | `tools/shark-status.ts` | ✅ Working |
| isSharkAgent() | `shared/agent-identity.ts` | ✅ Working |
| Tool summarizer | `tool-summarizer-hook.ts` | ✅ Working |
| Session hooks | `session-hook.ts` | ✅ Working |
| Gate Manager | `shared/gates.ts` | ✅ Working |
| Evidence Collector | `shared/evidence.ts` | ✅ Working |

## Missing Components ❌

### L5 Anti-Derailment (NOT in guardian-hook.ts)

| Layer | Patterns | Status |
|-------|----------|--------|
| L5.1 Host Fallback | 13 | ❌ MISSING |
| L5.2 Success Claim | 16 | ❌ MISSING |
| L5.3 Model Restriction | 15 | ❌ MISSING |
| L5.4 Mock/Stub | 12 | ❌ MISSING |
| L5.5 Simplification | 11 | ❌ MISSING |
| L5.6 Confusion Pretend | 12 | ❌ MISSING |
| L5.7 Scope Creep | 10 | ❌ MISSING |
| L5.8 Undermining | 12 | ❌ MISSING |
| L5.9 Impatience | 9 | ❌ MISSING |
| L5.10 Self-Reference | 12 | ❌ MISSING |

### L1-L4 Static Checks (NOT in guardian-hook.ts)

| Layer | Patterns | Status |
|-------|----------|--------|
| L1 Theatrical Verification | 18 | ❌ MISSING |
| L2 Fake Test Runner | 13 | ❌ MISSING |
| L3 Source Inspection | 12 | ❌ MISSING |
| L4 Wrong Container | 5 | ❌ MISSING |

### L6-L8

| Layer | Status |
|-------|--------|
| L6 Local File Protection | ⚠️ Advisory only (not blocking) |
| L7 Verification Gate | ❌ MISSING |
| L8 Behavioral Intelligence | ❌ MISSING |

### Checkpoint Guardian

| Component | Status |
|-----------|--------|
| CheckpointGuardian class | ❌ MISSING |
| Shipped checkpoint protection | ❌ MISSING |

**Total patterns to implement: 170+**

## What Was Tried Before (v4.8.3 Failures)

### Problems Identified in v4.8.3

1. **buildTextToCheck INCLUDES WRONG TEXT**
   - Was concatenating: `agentMessage + toolArgs + output`
   - Should only check: `toolArgs`
   - Result: User says "use hermes_remember" → L5.7 false positive

2. **L5.7 PATTERNS TOO BROAD**
   - Pattern: `/hermes_remember|hermes_recall|hermes_context/i`
   - Was blocking ANY mention, not just actual tool calls
   - Result: User instructions blocked, SPEC.md mentions blocked

3. **plan-gate MISSING project-spec.json**
   - Gate criteria REQUIRES project-spec.json in evidenceRequired
   - NO TOOL CREATES IT
   - Agent stuck in plan gate

4. **SHIP APPROVED Directory Block ADDED WITHOUT EVIDENCE SYSTEM**
   - Guardian blocks writes to "SHIP APPROVED" paths
   - Requires `.shark/evidence/ship/ContainerTestResult.json`
   - NO evidence collection exists for ship gate

## Critical Bugs to Fix

### P1: buildTextToCheck MUST use toolArgs only
```typescript
// WRONG
function buildTextToCheck(context) {
  return context.agentMessage + context.toolArgs + context.output;
}

// CORRECT
function buildTextToCheck(context) {
  return JSON.stringify(context.toolArgs); // Only the action
}
```

### P2: L5.7 must check actual tool call, not mentions
```typescript
// WRONG - blocks any mention
if (/hermes_remember/i.test(textToCheck))

// CORRECT - checks actual tool being called
if (context.toolArgs?.tool === 'hermes_remember')
```

### P3: L5.2/L5.4 require mechanical evidence
```typescript
function hasContainerTestEvidence(): boolean {
  const path = '.shark/evidence/delivery/ContainerTestResult.json';
  if (!fs.existsSync(path)) return false;
  const result = JSON.parse(fs.readFileSync(path, 'utf-8'));
  return result.overallPassed && result.passRate >= 0.96;
}
```

## v4.7-hotfix-v3 Integration Required

**Location:** `/home/leviathan/OPENCODE_WORKSPACE/plugins/shark-agent-v4.7-hotfix-v3/`

This version contains CRITICAL fixes for:
- ~5GB RAM per session bloat prevention
- Unbounded Map growth in stateStore and messenger
- Console spam on every hook execution
- Memory leaks across session boundaries

**Must preserve:**
- Session cleanup chain (all 7 cleanup functions)
- Domain ownership enforcement
- Tool summarizer hook (output reduction)
- Gate hook evidence collection order (tool-summarizer first, gate second)
