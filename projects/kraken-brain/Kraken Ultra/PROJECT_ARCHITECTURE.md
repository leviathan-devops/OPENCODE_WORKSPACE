# KRAKEN ULTRA - PROJECT ARCHITECTURE

**Created**: Mar 26 2026
**Version**: 1.0
**Purpose**: Master architecture for Shark Agent + Opencode integration with Nemotron Communication Layer

---

## 🎯 MISSION

Integrate Shark Agent's mechanical enforcement systems into Opencode's TypeScript codebase using a **dynamic communication layer** (Nemotron) that auto-manages token/context efficiency between orchestrator and builders.

---

## 🏗️ ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR (DeepSeek)                   │
│  • 128K context window                                       │
│  • Can request "more context" (24-72k tokens)                │
│  • Receives compressed 2-8k messages by default              │
│  • Uses only tokens needed (not forced to max)               │
└─────────────────────┬───────────────────────────────────────┘
                      │ 2-8k tokens (auto-sized)
                      │ Minimal token usage
                      │ Can request more
┌─────────────────────▼───────────────────────────────────────┐
│         NEMOTRON COMMUNICATION LAYER (1M tokens)             │
│                                                              │
│  SMART TOKEN SIZING:                                        │
│  ├─ 2K: Simple acks, status updates                         │
│  ├─ 4K: Progress reports, questions, dependencies            │
│  ├─ 6K: Build prompts, architecture, code reviews            │
│  └─ 8K: Debugging, integrations, escalations                 │
│                                                              │
│  MINIMAL TOKEN USAGE:                                        │
│  ├─ Only uses tokens needed (not forced to max)              │
│  ├─ 500 token message → 500 tokens (not 2k)                  │
│  └─ Compression only when exceeds target                     │
│                                                              │
│  MORE CONTEXT REQUEST:                                       │
│  ├─ Orchestrator requests "more context"                     │
│  ├─ Nemotron finds relevant context from full store          │
│  └─ Delivers up to 72k tokens of relevant context            │
│                                                              │
│  FULL CONTEXT STORAGE:                                       │
│  ├─ Stores all messages (up to 1M tokens)                    │
│  └─ Evicts oldest when full (FIFO)                           │
└─────────────────────┬───────────────────────────────────────┘
                      │ Bidirectional routing
        ┌─────────────┼─────────────┐
        │             │             │
   ┌────▼────┐   ┌────▼────┐  ┌────▼────┐
   │ Agent 1 │   │ Agent 2 │   │ Agent N │
   │  GLM 5  │   │  GLM 5  │   │  GLM 5  │
   └─────────┘   └─────────┘   └─────────┘
```

---

## 📦 SYSTEM COMPONENTS

### 1. Nemotron Communication Layer

**Location**: `/home/leviathan/OPENCODE_WORKSPACE/OPENCODE WORKSPACE/Nemotron Communication Layer/`

**Modules**:
- `types.ts`: TypeScript interfaces (Message, CompactedMessage, etc.)
- `message-classifier.ts`: Token sizing logic (2k/4k/6k/8k)
- `compression.ts`: Context filtering pipeline
- `routing.ts`: Agent routing system
- `nemotron-bridge.ts`: Main orchestrator

**Key Features**:
- Smart token sizing based on message complexity
- Minimal token usage (not forced to max budget)
- 1M token context storage
- "More context" requests (24-72k)
- Compression ratio tracking

### 2. Shark Agent Systems

**Guardian Module** (`src/guardian/`):
- File protection with zone classification
- System file blocking (/.ssh, /etc/passwd)
- Audit logging
- Protection levels (STRICT, BALANCED, PERMISSIVE, SANDBOX)

**Workflow State Machine** (`src/workflow/`):
- 5-step enforcement (PLAN → BUILD → TEST → VERIFY → SHIP)
- Mechanical evidence checking
- Invalid transition blocking
- 3-failure reset mechanism

**AutoDebug Module** (`src/debug/`):
- Pattern-based error fixing
- 47+ common error patterns
- Mechanical fix generation
- Anti-hallucination validation

**DualBrain Coordinator** (`src/brain/`):
- Micro/Macro mode switching
- Micro: DeepSeek R1 (THINKS) → Gemma 3 4B (DOES)
- Macro: GLM 4.5-flash (PRIMARY) + DeepSeek R1 (ADVISORY)
- Auto-switch on task analysis

### 3. GLM Engineer Deployment

**Version 1 Prompts** (v1-Integration):
- Standard integration without Nemotron protocol
- Use when communication layer inactive

**Version 2 Prompts** (v2-NemotronProtocol):
- Integration with Nemotron Communication Layer
- Token-efficient communication
- Use for production deployment

**Test Engineers**:
- Validation before full deployment
- Integration testing
- Nemotron bridge validation

---

## 🔄 WORKFLOW ORCHESTRATION

### Communication Rhythm

**Real-Time**:
- Agent → Nemotron (auto-sized 2-8k)
- Nemotron → Recipient (filtered to target)

**Scheduled**:
- Hourly: Progress snapshots (4k tokens)
- Daily: Full integration report (6k tokens)
- On-demand: Escalations (8k tokens, CRITICAL)

**Override**:
- Orchestrator: "more context" → 24-72k tokens
- Explicit: `[TOKEN_OVERRIDE: 8k]`
- CRITICAL priority: Doubles token limit

### Token Flow Control

```
Raw GLM Outputs (100K+ tokens)
         ↓
[NEMOTRON BRIDGE - 1M tokens]
         │
         ├─ Store full context (900K+ available)
         │
         └─ Extract essentials (2-8k tokens)
                 ↓
     [ORCHESTRATOR - 128K context]
```

---

## 📊 MONITORING & METRICS

### Token Metrics

```typescript
interface TokenMetrics {
  totalIngested: number;      // Raw tokens from all agents
  totalCompressed: number;    // Tokens after compression
  compressionRatio: number;   // Ingested / Compressed
  avgMessageSize: number;     // Average output size
  orchestratorTokens: number; // Tokens sent to orchestrator
  messagesByClass: {
    '2k': number;
    '4k': number;
    '6k': number;
    '8k': number;
  };
  overrideRequests: number;
}
```

### Iteration Triggers

| Condition | Threshold | Action |
|-----------|-----------|--------|
| Token bloat | >6k avg | Tighten compression |
| Override rate | >10% | Increase defaults |
| Compression ratio | <2:1 | Improve filtering |
| Context overflow | >100k/hr | Emergency mode |

---

## 🛡️ ANTI-HALLUCINATION PROTOCOLS

### Mechanical Evidence Requirements

**PLAN Phase**:
- Written plan file
- Specific, testable requirements
- Dependencies identified

**BUILD Phase**:
- Actual code files
- Compilation successful
- TypeScript types valid

**TEST Phase**:
- Test execution logs (not "tests pass")
- Coverage metrics
- Edge case testing

**VERIFY Phase**:
- Clean environment results
- No agent context
- Reproducible

**SHIP Phase**:
- Mechanical compilation from scratch
- Fresh dependency install
- Complete integration test

### Detection Mechanisms

1. **Mechanical compilation**: No cached artifacts
2. **Workflow evidence**: Each step must have proof
3. **Cross-validation**: Systems validate each other
4. **Random sampling**: 10% code review
5. **Satisfaction firewall**: No self-validation

---

## 🚀 DEPLOYMENT SEQUENCE

### Step 1: Knowledge Base Setup ✅
- [x] Coordinator split architecture
- [x] Nemotron Communication Layer built
- [x] GLM engineer assignments defined

### Step 2: Nemotron Bridge Deployment ✅
- [x] TypeScript implementation complete
- [x] Message classifier functional
- [x] Compression pipeline operational
- [x] Routing system active

### Step 3: GLM Engineer Launch ⏳
- [ ] Launch 1-2 test engineers (VERSION 2)
- [ ] Validate Nemotron ingestion
- [ ] Test token metrics
- [ ] Full 5-engineer deployment

### Step 4: Orchestration Loop ⏳
- [ ] Establish communication rhythm
- [ ] Test bidirectional routing
- [ ] Monitor token flow
- [ ] Adjust thresholds

### Step 5: Integration Testing ⏳
- [ ] Test all message types
- [ ] Validate compression accuracy
- [ ] Cross-module validation
- [ ] Anti-hallucination checks

### Step 6: Documentation ⏳
- [ ] API documentation
- [ ] Token sizing guide
- [ ] Compression effectiveness report

### Step 7: Production Deployment ⏳
- [ ] Full system validation
- [ ] Monitor continuously
- [ ] Iterate based on metrics

---

## 📁 FILE STRUCTURE

```
/home/leviathan/OPENCODE_WORKSPACE/
├── Kraken Brain/
│   ├── Kraken Ultra/
│   │   ├── Orchestrator Context/
│   │   │   └── BUILD_SESSION_MAR_26_2026.md
│   │   ├── ACTIVE_CONTEXT.md
│   │   ├── PROJECT_ARCHITECTURE.md (this file)
│   │   ├── VERSION 1 - GLM ENGINEER PROMPTS.md
│   │   ├── VERSION 2 - GLM ENGINEER PROMPTS.md
│   │   ├── TEST ENGINEER PROMPTS.md
│   │   ├── MONITORING_PROTOCOLS.md
│   │   └── ANTI_HALLUCINATION_VALIDATION.md
│   ├── Shared Macro Context/
│   │   └── PROJECT_ARCHITECTURE.md
│   └── scripts/
│       └── glm-engineer-launch.md
├── OPENCODE WORKSPACE/
│   ├── Nemotron Communication Layer/
│   │   ├── src/
│   │   │   ├── types.ts
│   │   │   ├── message-classifier.ts
│   │   │   ├── compression.ts
│   │   │   ├── routing.ts
│   │   │   └── nemotron-bridge.ts
│   │   ├── config/
│   │   │   └── nemotron-config.json
│   │   ├── PROJECT_ARCHITECTURE.md
│   │   └── README.md
│   └── TurboQuant Memory Enhancement/ (ARCHIVED)
├── shark-frankenstein/ (Shark Agent source)
└── shark-opencode-integration/ (Opencode fork)
```

---

## ✅ SUCCESS CRITERIA

1. **Nemotron Bridge**: Fully operational, minimal token usage
2. **Token Efficiency**: Average <6k tokens per message
3. **Context Access**: Orchestrator can get 24-72k when needed
4. **Shark Integration**: All 4 systems operational in Opencode
5. **Anti-Hallucination**: Mechanical evidence required, no bypass
6. **Orchestration**: Smooth communication, no token bloat
7. **Production Ready**: All tests pass, user approval obtained

---

## ⚠️ CRITICAL CONSTRAINTS

1. **NO TurboQuant** - archived, not active
2. **TypeScript only** - for Nemotron bridge
3. **Simple over complex** - background utility
4. **Minimal tokens** - not forced to max budget
5. **No self-validation** - mechanical evidence required
6. **1M token storage** - FIFO eviction
7. **Orchestrator override** - can request more context

---

## 🔗 REFERENCES

- **Shark Agent Source**: `/home/leviathan/OPENCODE_WORKSPACE/shark-frankenstein/`
- **Opencode Fork**: `/home/leviathan/OPENCODE_WORKSPACE/shark-opencode-integration/`
- **Shared Architecture**: `/home/leviathan/OPENCODE_WORKSPACE/Kraken Brain/Shared Macro Context/PROJECT_ARCHITECTURE.md`
- **Orchestration Plan**: `/home/leviathan/OPENCODE_WORKSPACE/KRAKEN_BRAIN_ORCHESTRATION_PLAN.md`

---

**STATUS**: Build Phase Complete - Ready for Testing
**NEXT**: Launch test engineers with VERSION 2 prompts
**TIMELINE**: 1-2 days testing, then full deployment

---

**KRAKEN ULTRA - Mechanical Enforcement + Token-Efficient Communication**
