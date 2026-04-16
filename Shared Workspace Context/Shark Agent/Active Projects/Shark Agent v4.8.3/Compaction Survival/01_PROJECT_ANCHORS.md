# SHARK AGENT V4.8.3 — PROJECT ANCHORS

## Project Structure

```
/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Shark Agent/Active Projects/Shark Agent v4.8.3/
├── ship-package-FINAL/                    # Self-contained ship package
│   ├── src/
│   │   ├── tools/
│   │   │   ├── shark-status.ts           # Status tool
│   │   │   ├── shark-gate.ts            # Gate control
│   │   │   ├── shark-evidence.ts         # Evidence collection
│   │   │   ├── checkpoint.ts             # Checkpoint management
│   │   │   ├── shark-test-runner-container.ts  # Container test runner
│   │   │   ├── shark-comprehensive-test.ts    # 34 mechanical tests
│   │   │   └── shark-comprehensive-runner.js  # Standalone runner
│   │   ├── hooks/v4.1/
│   │   │   ├── guardian-hook.ts          # L1/L2/L6 protection
│   │   │   ├── compacting-hook.ts       # Dynamic BUILD_CONTEXT
│   │   │   ├── gate-hook.ts             # Gate management
│   │   │   ├── session-hook.ts          # Session management
│   │   │   └── index.ts                 # Hook exports
│   │   ├── shared/
│   │   │   ├── state-store.ts           # State management
│   │   │   ├── agent-identity.ts        # Identity verification
│   │   │   ├── evidence.ts              # Evidence system
│   │   │   └── gates.ts                 # Gate definitions
│   │   └── shark/macro/
│   │       ├── peer-dispatch.ts         # Peer dispatch
│   │       └── brains.ts                # Brain management
│   └── dist/
│       └── index.js                     # Bundle (174 modules, 1.1MB)
├── src/                                 # Source (symlink to project)
├── dist/                                # Dist (symlink to project)
├── evidence/                            # Test evidence
├── debug-logs/                          # Debug reports
├── .checkpoints/                        # Build snapshots
└── Compaction Survival/                  # This folder
```

## Key Files

### Hooks (L0-L6 Protection)
| File | Purpose |
|------|---------|
| `src/hooks/v4.1/guardian-hook.ts` | L1/L2 check order FIXED, L6 file protection |
| `src/hooks/v4.1/compacting-hook.ts` | Dynamic BUILD_CONTEXT generation |
| `src/hooks/v4.1/gate-hook.ts` | Gate state management |
| `src/hooks/v4.1/session-hook.ts` | Session lifecycle |
| `src/hooks/v4.1/chat-message-hook.ts` | L1 message anti-slop |

### Tools
| File | Purpose |
|------|---------|
| `src/tools/shark-status.ts` | Agent status display |
| `src/tools/shark-gate.ts` | Gate control (status/criteria/advance/evaluate) |
| `src/tools/shark-evidence.ts` | Evidence collection |
| `src/tools/checkpoint.ts` | Checkpoint creation |

### Test Runners
| File | Purpose |
|------|---------|
| `src/tools/shark-test-runner-container.ts` | Container-aware basic tests (13 tests) |
| `src/tools/shark-comprehensive-runner.js` | Standalone 34 mechanical test runner |
| `src/tools/shark-comprehensive-test.ts` | OpenCode tool with 34 tests |

### Shared Infrastructure
| File | Purpose |
|------|---------|
| `src/shared/state-store.ts` | State management - duplicate FIXED |
| `src/shared/agent-identity.ts` | Identity verification |
| `src/shared/gates.ts` | Gate definitions |
| `src/shared/evidence.ts` | Evidence system |

## V4.8.3 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SHARK AGENT v4.8.3                       │
│                                                             │
│  L0 ──► Session Integrity                                   │
│  L1 ──► Theatrical Pattern Detection ──► Blocked by guardian│
│  L2 ──► Skip Container Detection    ──► Blocked by guardian│
│  L3 ──► Build Context Integrity    ──► Dynamic generation  │
│  L4 ──► Agent Identity Enforcement  ──► Identity verified   │
│  L5 ──► Anti-Derailment Gates       ──► Proof required     │
│  L6 ──► File Protection             ──► System files safe  │
│                                                             │
│  Tools: shark-status, shark-gate, shark-evidence, checkpoint │
└─────────────────────────────────────────────────────────────┘
```

## Alignment Bible

**Location:** `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Shark Agent/Master Context/`

**Key rules applied:**
- Container-first testing mandatory ✅
- Mechanical tests > theatrical tests ✅
- No local file edits outside project directory ✅
- Checkpoint at every major milestone ✅

---

## Build Status

- [x] Bundle built: 1.1 MB (174 modules)
- [x] Container tests: 13/13 PASSED
- [x] Comprehensive tests: 34/34 PASSED
- [x] Ship package: COMPLETE (2.8 MB, 72 files)
- [x] Checkpoints: 4 created

**Bundle MD5:** `3c33af32115c5a7421fefc768b44a0fb`

**Last Updated:** 2026-04-16T03:20 UTC