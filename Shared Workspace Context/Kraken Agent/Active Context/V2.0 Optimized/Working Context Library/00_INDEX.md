# KRAKEN V2.0 — WORKING CONTEXT INDEX

**Version:** 2.0  
**Date:** 2026-04-12  
**Based on:** V1.2 + First-Hand Experience from Shark Agent v4.8.3 Build

---

## Context Files

| File | Purpose |
|------|---------|
| `01_ARCHITECTURE_OVERVIEW.md` | System structure + V2.0 optimizations |
| `02_CURRENT_STATE.md` | V1.2 vs V2.0 differences |
| `03_PATTERNS_REFERENCE.md` | L0-L8 orchestration patterns |
| `04_IMPLEMENTATION_GUIDE.md` | Step-by-step with V2.0 code examples |
| `05_TESTING_WORKFLOWS.md` | Testing + evidence collection |
| `06_TWO_LAYER_FIREWALL.md` | Tool + Message enforcement spec |
| `07_MECHANICAL_OUTPUT_VERIFICATION.md` | Output checkpoint system |
| `08_STRUCTURED_OVERRIDE_COMMANDS.md` | Override command schema |
| `09_EXPLICIT_GATE_CRITERIA.md` | Gate entry criteria spec |
| `10_GOLDEN_BEHAVIOR_V2.md` | Behavioral rules with V2.0 |
| `11_COMPACTION_MANAGEMENT.md` | Four-tier compaction system |
| `12_INCIDENT_ANALYSIS.md` | First-hand lessons + incidents |
| `13_SUCCESS_CRITERIA.md` | V2.0 ship gate requirements |
| `14_COMPLETE_BUILD_PLAN.md` | Phase-by-phase build |
| `CHANGELOG_V1.2_to_V2.0.md` | What changed and why |

---

## V2.0 Key Optimizations

1. **Two-Layer Firewall** — Tool + Message enforcement
2. **Mechanical Output Verification** — fs.existsSync() checkpoints
3. **Structured Override Commands** — Typed schema
4. **Explicit Gate Criteria** — Per-brain requirements
5. **Dynamic Context Management** — Four-tier compaction

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         KRAKEN V2.0 ORCHESTRATOR                             │
│                                                                              │
│  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐            │
│  │  PLANNING   │────────▶│  EXECUTION  │◀────────│   SYSTEM    │            │
│  │   BRAIN     │         │   BRAIN    │         │   BRAIN     │            │
│  └─────────────┘         └─────────────┘         └─────────────┘            │
│                                                                           │
│  ════════════════════════════════════════════════════════════════════════  │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │               SYSTEM BRAIN — DYNAMIC CONTEXT MANAGEMENT                │  │
│  │  Tier 0: Proactive (65%) → Tier 1: Pre-compaction (75%)               │  │
│  │  Tier 2: Post-compaction (85%) → Tier 3: Dynamic Injection             │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Compaction Thresholds (OpenCode Auto-Compacts at 85%)

| Threshold | Action |
|-----------|--------|
| 65% | Warning, light pruning |
| 75% | Pre-compaction export |
| 85% | **OPENCODE AUTO-COMPACTION** |

---

## Build Target

**Project:** `/home/leviathan/OPENCODE_WORKSPACE/kraken-agent-v2.0`  
**Timeline:** ~25 hours  
**Phase:** Planning complete, ready for implementation

---

## Quick Reference

### Output Verification (V2.0)
```typescript
// Register outputs BEFORE task
verifier.registerOutputs(taskId, [
  { containerPath: '/app/out.js', hostPath: '/host/out.js' }
]);

// Claim retrieved - MECHANICAL CHECK
await verifier.claimRetrieved(taskId, ['/host/out.js']); // fs.existsSync()

// Only complete when verified
if (verifier.canComplete(taskId)) markComplete();
```

### Override Command (V2.0)
```typescript
sendOverride({
  type: 'OVERRIDE',
  action: 'CLAIM_COMPLETE',
  target: { taskId },
  constraints: { requiresEvidence: ['ContainerTestResult.json'] }
});
```

### Gate Criteria (V2.0)
```typescript
const criteria = {
  systemBrain: { 
    completed: ['firewall_passed'],
    evidence: [{ path: 'ContainerTestResult.json', check: 'passRate >= 0.96' }]
  }
};
```

---

## Critical Principles

1. **MECHANICAL OVER TRUST** — fs.existsSync(), not "looks fine"
2. **STRUCTURED OVER NATURAL** — Typed schema, not interpretation
3. **EXPLICIT OVER IMPLICIT** — Criteria lists, not "seems ready"
4. **TWO-LAYER ENFORCEMENT** — Tool AND Message
5. **PREVENT OVER SURVIVE** — Compaction at 75%, not 85%

---

## Pre-Build Checklist

- [ ] Read 01-11 context files
- [ ] Understand Two-Layer Firewall
- [ ] Understand Output Checkpoint System
- [ ] Understand Compaction Thresholds
- [ ] Review Phase-by-Phase build plan

---

*End of Index*