# SHARK AGENT V4 — Architecture Reference

**Purpose:** T2 reference for Shark Agent component map and architecture
**Usage:** Loaded on-demand via read_file, zero prompt overhead

---

## Component Map

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SHARK AGENT V4 COMPONENT MAP                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  COORDINATION LAYER                                                       │
│  ├── Mechanical Switch (Micro)                                            │
│  │   └── Plan Brain ↔ Build Brain flipping                               │
│  │       → Enforced by coordinator, not by agent                        │
│  │                                                                          │
│  └── Peer Dispatch (Macro)                                                │
│      └── Three brains racing simultaneously                               │
│          → StateStore with domain ownership                               │
│          → BrainMessenger for priority signals                            │
│          → Gates as synchronization barriers                             │
│                                                                          │
│  DUAL-BRAIN ENGINE (MICRO)                                                │
│  ├── Plan Brain                                                           │
│  │   ├── Owns: plan-state, spec document                                  │
│  │   ├── Reads: Build Brain output (verification)                       │
│  │   ├── T1: Identity + thinking process                                │
│  │   └── T2: Architecture, patterns, verification                        │
│  │                                                                          │
│  ├── Build Brain                                                          │
│  │   ├── Owns: execution-state, artifact                                │
│  │   ├── Reads: Plan Brain spec (execute exactly)                         │
│  │   ├── T1: Identity + execution-only rules                            │
│  │   └── T2: None by default (clean context)                            │
│  │                                                                          │
│  └── Context Firewall                                                     │
│      └── T1 isolation by default                                          │
│          → Conscious overlap only when specified                          │
│          → No implicit context sharing                                    │
│                                                                          │
│  TRIPLE-BRAIN ENGINE (MACRO)                                              │
│  ├── Execution Brain (Primary Agent)                                      │
│  │   ├── Owns: execution-state, quality-state                           │
│  │   ├── Reads: plan-state, thinking-state (from Reasoning)              │
│  │   ├── Primary autonomous agent                                       │
│  │   └── Steamrolls the build forward                                   │
│  │                                                                          │
│  ├── Reasoning Brain (Floating 2nd / Context Bridge)                       │
│  │   ├── Owns: thinking-state, context-bridge                            │
│  │   ├── Reads: all states (read-only observation)                      │
│  │   ├── On-demand intelligence for Execution                           │
│  │   ├── Dynamic memory: T1/T2 context management                        │
│  │   │   ├── Notices Execution T1 gaps                                  │
│  │   │   ├── Gets missing T2 from knowledge base                        │
│  │   │   ├── Synthesizes relevant context                               │
│  │   │   └── Injects into Execution Brain                               │
│  │   └── Auto-debug: 60% of errors fixed automatically                  │
│  │                                                                          │
│  └── System Brain (Watchdog / Enforcer)                                   │
│      ├── Owns: workflow-state, security-state                             │
│      ├── Reads: all states (read-only observation)                       │
│      ├── Active derailment detection                                      │
│      ├── Real-time fix application                                       │
│      └── Gate enforcement                                                 │
│          ├── Guards gate criteria evaluation                              │
│          ├── Sends priority messages on failures                          │
│          └── Blocks phase transitions until criteria met                  │
│                                                                          │
│  MECHANICAL ENFORCEMENT LAYER                                             │
│  ├── Guardian: Zone classification + scope containment                   │
│  │   ├── WORKSPACE: Project directory (full access)                     │
│  │   ├── SANDBOX: Isolated test environment (full access)              │
│  │   ├── DEVELOPMENT: ~/Projects, ~/code (conditional)                 │
│  │   ├── PERSONAL: ~/.ssh, ~/.aws, Documents (BLOCKED)                  │
│  │   ├── CONFIG: /etc, config files (BLOCKED)                           │
│  │   └── SYSTEM: /bin, /usr, /System (NEVER)                           │
│  │                                                                          │
│  ├── Six Gates: Sequential quality barriers                              │
│  │   ├── Gate 1: Architect (requirements → spec)                       │
│  │   ├── Gate 2: Coding (spec → implementation)                       │
│  │   ├── Gate 3: Test (implementation → tests passing)                 │
│  │   ├── Gate 4: Build (tests → compiling)                             │
│  │   ├── Gate 5: Review (build → security clean)                       │
│  │   └── Gate 6: Delivery (review → evidence archived)                  │
│  │                                                                          │
│  └── Evidence System: Immutable proof of gate passage                    │
│      ├── .shark/evidence/{gate-id}/{timestamp}/                          │
│      ├── Checkpoints: Git-based snapshots at each gate                  │
│      └── Delegation Ledger: Task history for audit                      │
│                                                                          │
│  CONTEXT LIBRARY LAYER                                                     │
│  ├── T1: System prompt (~2KB) — identity + thinking process             │
│  └── T2: On-demand (~unlimited) — via read_file, zero overhead          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Source Synthesis

### From Original Shark Agent (Dual-Brain)

| Pattern | How It Maps to V4 |
|---------|-------------------|
| DeepSeek R1 = reasoning, Qwen = execution | No longer hardcoded models — model-agnostic brain config |
| Routing brain decides | Micro: Mechanical switch; Macro: StateStore domain ownership |
| 300s timeout hardcoded | Configurable per brain in BRAIN_MODELS.md |
| Auto-routing triggers | Guardian trigger phrases in System Brain |

### From Shark Frankenstein (Guardian + Auto-Debug)

| Pattern | How It Maps to V4 |
|---------|-------------------|
| Guardian zone classification | Guardian in Mechanical Enforcement Layer |
| Protection levels (STRICT/BALANCED/PERMISSIVE/SANDBOX) | Guardian config in BRAIN_MODELS.md |
| Auto-debug 60% error fix | Reasoning Brain responsibility in Macro |
| 2-Stage Testing Protocol | Test Gate implementation |

### From V4 Parallel Peer Brains

| Pattern | How It Maps to V4 |
|---------|-------------------|
| StateStore domain ownership | All three brains race, own domains, read others |
| BrainMessenger priority signals | System Brain → Execution Brain critical alerts |
| Gates as synchronization barriers | Phase transitions blocked until criteria met |
| maxConcurrentTasks | Cluster config in ARCHITECTURES/shark.json |
| allowParallel: true | Phases can run concurrently |

---

## State Management

```
shark-project/
├── .shark/                          ← Shark runtime state
│   ├── state.json                   ← Current workflow state
│   ├── plan.md                      ← Current/active plan
│   ├── delegation-ledger.json       ← Task history
│   ├── evidence/                   ← Gate evidence
│   │   ├── architect-gate/
│   │   ├── coding-gate/
│   │   ├── test-gate/
│   │   ├── build-gate/
│   │   ├── review-gate/
│   │   └── delivery-gate/
│   └── checkpoints/                ← Git-based snapshots
│       ├── checkpoint-{id}/
│       └── ...
├── shark-context/                  ← Shark context library
│   ├── INDEX.md                    ← Entry point
│   ├── MENTAL_MODEL.md             ← T1 thinking
│   ├── PURPOSE.md                  ← T1 identity
│   └── REFERENCE/                  ← T2 references
│       ├── ARCHITECTURE.md
│       ├── BRAIN_MODELS.md
│       ├── BUILD_WORKFLOW.md
│       ├── PATTERNS.md
│       ├── VERIFICATION.md
│       ├── ESCALATION.md
│       └── SHARK_VARIANTS.md
└── {project files...}
```

### Domain Ownership (Macro)

```
DOMAIN_OWNERSHIP = {
  'execution-state':  ['shark-execution', 'system-brain'],
  'thinking-state':    ['shark-reasoning', 'system-brain'],
  'context-bridge':    ['shark-reasoning'],
  'workflow-state':    ['shark-system', 'shark-reasoning'],
  'quality-state':     ['shark-execution', 'shark-system'],
  'security-state':    ['shark-system'],
  'plan-state':        ['shark-plan', 'shark-reasoning', 'shark-system'],
};
```

---

## Hook Points

| Hook | When | Purpose |
|------|------|---------|
| `shark.architect.start` | Before Gate 1 | Load spec template, initialize Guardian |
| `shark.coding.start` | Before Gate 2 | Verify spec, set up execution context |
| `shark.test.start` | Before Gate 3 | Generate tests, verify coverage |
| `shark.build.start` | Before Gate 4 | Compile, lint, type-check |
| `shark.review.start` | Before Gate 5 | SAST scan, secrets scan |
| `shark.delivery.start` | Before Gate 6 | Archive evidence, create checkpoint |
| `shark.gate.passed` | After any gate | Collect evidence, log to ledger |
| `shark.gate.failed` | After any gate | Auto-debug, escalate if needed |
| `shark.context.inject` | Reasoning→Execution | Inject synthesized T2 into Execution T1 |
| `shark.derailment.detected` | System Brain alert | Apply real-time fix |

---

## Architecture Config (shark.json)

See `ARCHITECTURES/shark.json` for the full V4 architecture definition including:
- Triple-brain peer configuration
- Cluster definitions
- Agent definitions
- Workflow phases and gates
- Coordination style (federated, broadcast)

---

*Architecture Reference*
*Shark Agent V4 — T2 Reference*
