# Shark Agent v4.8 Hardware Usage Audit

**Date:** 2026-04-08  
**Version:** Shark Agent v4.8  
**Status:** CRITICAL - Heavy Resource Consumer

---

## Executive Summary

Shark Agent v4.8 is approximately **3-4x heavier** than vanilla OpenCode agent sessions. Users report terminal crashes at 5 concurrent shark agents, whereas 15-20 vanilla sessions were previously stable.

**Root Cause:** Excessive hook firing, redundant file I/O, synchronous disk writes, and triple-brain state overhead per session.

---

## 1. Hook Architecture Analysis

### 1.1 Hook Count Per Agent

Vanilla agents typically use 0-1 hooks per tool call. Shark agents register **5 hooks** that ALL fire on every operation:

| Hook Name | Trigger | File Location |
|-----------|---------|---------------|
| `tool.execute.before` | Every tool execution | `src/hooks/v4.1/guardian-hook.ts:17-99` |
| `tool.execute.after` | Every tool execution | `src/hooks/v4.1/gate-hook.ts:17-120` |
| `experimental.chat.system.transform` | Every chat message | `src/hooks/v4.1/system-transform-hook.ts:11-56` |
| `event` | Session lifecycle | `src/hooks/v4.1/session-hook.ts:14-37` |
| `experimental.session.compacting` | Context compaction | `src/hooks/v4.1/compacting-hook.ts:15-48` |

### 1.2 Hook Fire Rate Comparison

| Scenario | Vanilla Agents | 5 Shark Agents |
|----------|----------------|----------------|
| Hooks firing per tool call | 0-1 | 10 |
| Hooks firing per file write | 0-1 | 10 |
| Hooks firing per chat message | 1-2 | 10-12 |

**Impact:** 5 shark agents generate ~10-12 hook invocations per operation, compared to 1-2 for vanilla.

---

## 2. Critical Hardware Drains

### 2.1 Theatrical Code Detector — O(n) Scan Per File Write

**Location:** `src/validation/theatrical-detector.ts:114-210`

**Problem:** On every `write_file`, `edit`, `patch`, or `mcp_patch` call, the detector performs:

- **16 theatrical patterns** — regex match against entire content
- **8 rationalization patterns** — regex match against entire content
- **Line-by-line function boundary detection** — iterates every line
- **Char-by-char nesting depth calculation** — iterates every character
- **File size validation**

**Code Reference:**
```typescript
// theatrical-detector.ts:159-186
for (let i = 0; i < lines.length; i++) {
  // ... function boundary detection
  for (const char of line) {
    if (char === '{' || char === '(') {
      currentNesting++;
      // ...
    }
  }
}
```

**Per-write cost:** ~25 regex operations + O(content_length) character scan.

### 2.2 Double File Read on Every Write

**Location:** `src/hooks/v4.1/gate-hook.ts:35-54`

**Problem:** After every file write, the gate hook reads the SAME file TWICE:

```typescript
// gate-hook.ts:35-42 — READ #1
const validation = gateManager.validateTestFile(filePath);

// gate-hook.ts:47-53 — READ #2  
const validation = gateManager.validateCodeFile(filePath);
```

Each validation reads the file and scans against 9-16 regex patterns.

### 2.3 Synchronous Evidence Writes to Disk

**Location:** `src/hooks/v4.1/gate-hook.ts:70`

**Problem:** Every tool execution triggers a synchronous JSON write:

```typescript
evidenceCollector.collectEvidence(gateEvidence);  // Sync I/O
```

**Evidence write chain:**
```typescript
// evidence.ts:39-51
fs.writeFileSync(metaPath, JSON.stringify(evidence, null, 2));
if (evidence.debugLog) {
  fs.writeFileSync(path.join(timestampDir, 'debug.log'), evidence.debugLog);
}
```

### 2.4 Guardian Pattern Compilation

**Location:** `src/shared/guardian.ts:26-88`

**Problem:** Guardian maintains 5 pattern arrays compiled on every instantiation:

```typescript
// guardian.ts:26-37
const RATIONALIZATION_PATTERNS = [
  /infrastructure.*separate.*from.*code/i,
  // ... 8 patterns
];

// guardian.ts:51-60
const DANGEROUS_PATTERNS = [
  /^rm\s+-rf\s+\//,
  // ... 8 patterns
];

// guardian.ts:62-67
const INPLACE_MODIFY_PATTERNS = [
  /^sed\s+-i/,
  // ... 4 patterns
];
```

### 2.5 Triple-Brain State Overhead

**Location:** `src/index.ts:30-43`

**Problem:** Each shark session creates isolated instances:

| Component | Instances Per Shark Session |
|-----------|----------------------------|
| StateStore | 1 (with 3 Maps: data, versions, watchers) |
| SharkMessenger | 1 (with priority queues per brain) |
| GateManager | 1 (with iteration tracking) |
| EvidenceCollector | 1 (with file system state) |
| Guardian | 1 (with 5 pattern arrays) |

**State store Maps:**
```typescript
// state-store.ts:54-56
const data = new Map<string, any>();
const versions = new Map<string, number>();
const watchers = new Map<string, Array<(value: any, version: number) => void>>();
```

### 2.6 Docker Polling in Container Tools

**Location:** `src/tools/container-test.ts:33-34, 83-88`

**Problem:** Container status tools spawn `docker ps` subprocesses:

```typescript
const result = execSync('docker ps --filter "name=hermes-oc-agent-" --format "{{.Names}}" 2>/dev/null | wc -l');
```

---

## 3. Session Initialization Drain

### 3.1 Directory Creation on Session Start

**Location:** `src/hooks/v4.1/session-hook.ts:65-73`

```typescript
await fs.promises.mkdir(sharkDir, { recursive: true });
await fs.promises.mkdir(path.join(sharkDir, 'evidence'), { recursive: true });
await fs.promises.mkdir(path.join(sharkDir, 'checkpoints'), { recursive: true });
```

### 3.2 Triple-Brain Initialization

**Location:** `src/shark/macro/peer-dispatch.ts:43-53`

```typescript
initialize(): void {
  const state: MacroBrainState = {
    activeBrains: ['execution', 'reasoning', 'system'],
    // ...
  };
  this.stateStore.set('shark-macro-state', state, 'shark-state');
}
```

---

## 4. Per-Tool-Call Cost Breakdown

### 4.1 File Write Operation (Most Expensive)

| Step | Operation | Cost |
|------|-----------|------|
| 1 | Guardian hook: `isSharkAgent()` check | Negligible |
| 2 | `detectRationalization()` — 8 regex | Medium |
| 3 | `detectTheatricalCode()` — 25 regex + O(n) scan | **HIGH** |
| 4 | Gate hook: `validateTestFile()` — read + 9 regex | **HIGH** |
| 5 | Gate hook: `validateCodeFile()` — read + 7 regex | **HIGH** |
| 6 | `evidenceCollector.collectEvidence()` — sync JSON write | **HIGH** |
| 7 | `gateManager.getCriteria()` — criteria lookup | Negligible |
| 8 | `system.transform` hook — string concat | Medium |

**Total file write:** ~3 file reads + 25+ regex operations + 1-2 sync disk writes

### 4.2 Terminal Command Operation

| Step | Operation | Cost |
|------|-----------|------|
| 1 | Guardian: `isDangerousCommand()` — 8 regex | Medium |
| 2 | Guardian: `canModifyFile()` — 4 regex | Low |
| 3 | Evidence write | **HIGH** |

---

## 5. Resource Comparison Matrix

| Metric | Vanilla Agent (1x) | 1 Shark Agent | 5 Shark Agents |
|--------|-------------------|---------------|----------------|
| Hooks/tool call | 0-1 | 2 mandatory | 10 |
| Regex/file write | 0 | ~25 | ~125 |
| File reads/file write | 0 | 2 | 10 |
| Sync disk writes/tool | 0 | 1+ | 5+ |
| State Maps | 1 | 9+ | 45+ |
| JSON.parse/stringify | Minimal | Moderate | Heavy |

---

## 6. Root Cause Summary

1. **Hook redundancy** — Both `tool.execute.before` AND `tool.execute.after` do heavy validation
2. **Redundant file reads** — Same file read twice for validation after every write
3. **Synchronous I/O blocking** — Evidence writes block the event loop
4. **Excessive pattern matching** — 25+ regex operations on every file write
5. **Triple-brain overhead** — Unnecessary complexity for single-agent tasks
6. **No caching** — Files re-validated on every write, no cache invalidation

---

## 7. Recommended Solutions

### 7.1 High Priority (Immediate Impact)

| Issue | Solution | Expected Gain |
|-------|----------|---------------|
| Double file read | Cache validation results with mtime invalidation | -50% file I/O |
| Sync evidence writes | Make evidence writes async/non-blocking | -80% I/O blocking |
| Hook redundancy | Consolidate before/after hook work | -40% CPU |
| Theatrical scan | Debounce/throttle scan, don't scan every write | -60% regex ops |

### 7.2 Medium Priority

| Issue | Solution | Expected Gain |
|-------|----------|---------------|
| Pattern compilation | Pre-compile and cache patterns | -20% CPU |
| Docker polling | Cache results, poll less frequently | -30% subprocess |
| Triple-brain overhead | Lazy initialization of inactive brains | -30% memory |

### 7.3 Low Priority (Architectural)

| Issue | Solution | Expected Gain |
|-------|----------|---------------|
| State Maps | Use shared state store across agents | -20% memory |
| Evidence writes | Batch writes, periodic flush | -40% I/O |
| Hook architecture | Event-driven instead of synchronous hooks | -50% overall |

---

## 8. Files Reference

| File | Purpose | Resource Impact |
|------|---------|----------------|
| `src/hooks/v4.1/guardian-hook.ts` | Pre-execution validation | HIGH |
| `src/hooks/v4.1/gate-hook.ts` | Post-execution validation | HIGH |
| `src/hooks/v4.1/system-transform-hook.ts` | Context injection | MEDIUM |
| `src/validation/theatrical-detector.ts` | Code quality scanning | HIGH |
| `src/shared/gates.ts` | Gate enforcement + file reads | HIGH |
| `src/shared/evidence.ts` | Evidence collection + writes | HIGH |
| `src/shared/guardian.ts` | Pattern matching | MEDIUM |
| `src/shared/state-store.ts` | State management | MEDIUM |
| `src/shark/macro/peer-dispatch.ts` | Brain coordination | MEDIUM |
| `src/tools/container-test.ts` | Docker subprocesses | LOW-MEDIUM |

---

## 9. Conclusion

Shark Agent v4.8 is architecturally heavy due to:

1. **5 hooks** firing per tool call instead of 0-1
2. **25+ regex operations** on every file write
3. **Double file reads** for validation
4. **Synchronous disk writes** for evidence
5. **Triple-brain state** (3 brains × 9 state maps)

This explains why 5 shark agents cause crashes while 15-20 vanilla sessions were previously stable. The per-agent overhead multiplies with concurrency, and synchronous I/O creates bottlenecks that block the event loop.

---

**Audit performed by:** OpenCode Analysis  
**Next review:** After optimization implementation
