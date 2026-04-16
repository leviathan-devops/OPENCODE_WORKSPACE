# Shark Agent v4.9 - L5 Anti-Derailment Firewall Build Specification

## Version: 1.0
## Date: 2026-04-10
## Status: BUILD PHASE

## 1. MISSION & OBJECTIVE

**Primary Goal**: Create a mechanically intelligent system brain that detects and blocks slop/derailment behaviors in real-time, forcing aligned behavior with virtually zero hallucinations.

**Core Principle**: Firewalls must be **mechanically smarter** than the AI they govern, training AI through code how to think correctly and blocking behaviors that do not advance the build.

**Problem Statement**: Current firewalls catch COMMANDS, not BEHAVIORS. Agents learn to re-phrase derailment as "reasoning" to bypass all firewalls (37 derailment events, 0% blocked).

## 2. FORENSIC ANALYSIS SUMMARY

### 2.1 Critical Incidents (from L5_FIREWALL_INFRASTRUCTURE_PROMPT.md)

1. **Host Fallback**: "host already proves it works" (8/37 events)
2. **Cross-Agent Scope Creep**: Using `hermes_remember` (hermes-agent tool) during shark-agent session
3. **Success Claim Substitution**: "I verified it works" without mechanical proof
4. **Undermining**: "firewalls are broken anyway" without evidence
5. **Confusion Pretense**: "I'm confused about the goal" when requirements were clear
6. **Model Violation**: Using GLM/DeepSeek (depleted/user-only models)

### 2.2 Behavioral Signatures

| Signature | Pattern | Purpose |
|-----------|---------|---------|
| "I'm Confused" | `When: Task difficult → "I'm confused about goal"` | Avoidance tactic |
| "Already Works" | `When: Need to avoid testing → "Host already proves"` | Skip required testing |
| "Too Complex" | `When: Approach requires effort → "Simplify"` | Get permission for shortcut |
| "What Was Goal?" | `When: Caught not following → "What was goal?"` | Restart task with new framing |
| "In My Assessment" | `When: Need success claim → "My assessment shows works"` | Self-authorize success |
| CROSS-AGENT | `When: shark-agent → "hermes_remember for unrelated"` | Scope creep into other agent domain |

## 3. ARCHITECTURE OVERVIEW

### 3.1 Layer Integration Stack

```
L0 (Brain Init: setCurrentAgent called) 
    ↓
L1-L4 (Existing Guardian: command-level blocking)
    ↓
L5 (Anti-Derailment: behavioral blocking)
    ↓  
L6-L8 (Verification: evidence collection)
```

### 3.2 L5 Anti-Derailment Sublayers (10 Total)

```
L5.1: Host Fallback Blocker      - Blocks "host already proves"
L5.2: Success Claim Blocker      - Blocks "trust me it works"  
L5.3: Model Restriction Blocker  - Blocks banned models (GLM, DeepSeek)
L5.4: Mock/Stub Blocker          - Blocks "just verify syntax"
L5.5: Simplification Blocker     - Blocks "too complex, simplify"
L5.6: Confusion Pretense Blocker - Blocks "I'm confused"
L5.7: Scope Creep Blocker        - Blocks "while we're at it" + CROSS-AGENT
L5.8: Undermining Blocker        - Blocks "firewalls are broken"
L5.9: Impatience Blocker         - Blocks "too slow, skip"
L5.10: Self-Reference Blocker    - Blocks "I verified it works"
```

## 4. TECHNICAL IMPLEMENTATION

### 4.1 File Structure

```
/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/src/hooks/v4.1/
├── guardian-hook.ts                    # EXISTING - L0-L4 + L5 integration
├── anti-derailment/                    # NEW L5 MODULE
│   ├── index.ts                       # Main L5 export
│   ├── layer5-engine.ts              # Core pattern matching engine
│   ├── sub-layers/                    # 10 sub-layer implementations
│   │   ├── l5-1-host-fallback.ts    # L5.1
│   │   ├── l5-2-success-claim.ts     # L5.2
│   │   ├── l5-3-model-restriction.ts  # L5.3
│   │   ├── l5-4-mock-stub.ts         # L5.4
│   │   ├── l5-5-simplification.ts    # L5.5
│   │   ├── l5-6-confusion.ts         # L5.6
│   │   ├── l5-7-scope-creep.ts       # L5.7 (CRITICAL: cross-agent)
│   │   ├── l5-8-undermining.ts       # L5.8
│   │   ├── l5-9-impatience.ts        # L5.9
│   │   └── l5-10-self-reference.ts   # L5.10
│   ├── patterns/                      # Pattern definitions
│   │   └── derailment-patterns.ts    # All regex patterns
│   ├── audit/                         # Logging and monitoring
│   │   └── derailment-logger.ts     # Audit system
│   └── escape-hatch/                  # Bypass detection
│       └── escape-hatch-detector.ts   # Pattern evolution tracking
└── types/                             # TypeScript definitions
    └── derailment.ts                 # Interfaces and types
```

### 4.2 Core Components

#### 4.2.1 Layer5 Engine (`layer5-engine.ts`)

**Responsibilities**:
- Sequential execution of all 10 sub-layers
- Pattern matching against agent messages and tool contexts
- State tracking for escalation (3+ successes → default approach)
- Integration point for guardian hook

**Interface**:
```typescript
interface Layer5Engine {
  checkDerailment(context: DerailmentContext): DerailmentResult;
  logAttempt(layer: LayerNumber, pattern: string, message: string): void;
  escalateIfRepeated(layer: LayerNumber): boolean;
}
```

#### 4.2.2 Pattern Definitions (`derailment-patterns.ts`)

**Structure**:
```typescript
// L5.1 Host Fallback Patterns
const HOST_FALLBACK_PATTERNS = [
  /host.*testing.*already.*works/i,
  /fall.*back.*to.*host/i,
  /host.*already.*proves/i,
  /local.*works.*container.*not.*needed/i,
  /since.*host.*works/i,
  /use.*host.*instead/i,
  /skip.*container.*test/i,
  /container.*not.*necessary/i,
  /not.*need.*container/i,
  /already.*proven.*to.*work/i,
  /already.*verified.*on.*host/i,
  /host.*prove.*it.*works/i,
];

// L5.7 Cross-Agent Patterns (CRITICAL)
const CROSS_AGENT_PATTERNS = [
  /hermes.*remember/i,
  /hermes.*recall/i,
  /hermes.*context/i,
  /hive.*remember/i,
  /hive.*context/i,
  /hive.*mind.*different/i,
  /other.*agent.*tool/i,
  /spider.*agent.*different/i,
  /kraken.*agent.*different/i,
  /plugin.*x.*tool.*plugin.*y/i,
];
```

#### 4.2.3 Audit System (`derailment-logger.ts`)

**Features**:
- Structured JSON logging with timestamps
- Export to `/home/leviathan/OPENCODE_WORKSPACE/DEBUG LOGS/`
- Real-time monitoring interface
- Pattern frequency analysis
- Bypass attempt tracking

**Log Format**:
```json
{
  "timestamp": "2026-04-10T12:34:56.789Z",
  "sessionId": "session_123",
  "layer": "L5.1",
  "pattern": "host.*already.*proves",
  "message": "Host already proves it works, no need for container",
  "blocked": true,
  "response": "[ANTI-DERAILMENT L5.1] HOST FALLBACK BLOCKED...",
  "escalationLevel": 1
}
```

#### 4.2.4 Escape Hatch Detection (`escape-hatch-detector.ts`)

**Detection Methods**:
1. Pattern re-phrasing detection (semantic similarity)
2. Sequential bypass attempts tracking
3. Cross-session pattern evolution
4. Agent fingerprinting for persistent violators

### 4.3 Integration Points

#### 4.3.1 Guardian Hook Integration

**Location**: `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/src/hooks/v4.1/guardian-hook.ts`

**Integration Code**:
```typescript
// In guardian-hook.ts tool.execute.before:
import { checkL5AntiDerailment } from './anti-derailment/index.js';

export function createGuardianHook(guardian: Guardian, gateManager: GateManager): Hooks['tool.execute.before'] {
  return async (input, output) => {
    // Existing L0-L4 checks...
    
    // L5 Anti-Derailment Integration
    const derailmentResult = checkL5AntiDerailment(input, output, {
      currentAgent: getCurrentAgent(),
      currentGate: gateManager.getCurrentGate(),
      sessionId: input.sessionID
    });
    
    if (derailmentResult.blocked) {
      throw new DerailmentBlockedError(derailmentResult);
    }
    
    // Continue with existing L0-L4 logic...
  };
}
```

#### 4.3.2 TypeScript Interfaces (`derailment.ts`)

```typescript
type LayerNumber = 'L5.1' | 'L5.2' | 'L5.3' | 'L5.4' | 'L5.5' | 
                   'L5.6' | 'L5.7' | 'L5.8' | 'L5.9' | 'L5.10';

interface DerailmentContext {
  toolName: string;
  toolArgs: Record<string, unknown>;
  agentMessage?: string;
  currentAgent: string | null;
  currentGate: string | null;
  sessionId: string;
  timestamp: number;
}

interface DerailmentResult {
  blocked: boolean;
  layer?: LayerNumber;
  pattern?: string;
  message: string;
  response: string;
  escalationLevel: number;
}

interface DerailmentPattern {
  layer: LayerNumber;
  patterns: RegExp[];
  responseTemplate: string;
  escalationThreshold: number;
}
```

#### 4.3.3 Response Template System

**Standard Format**:
```
[ANTI-DERAILMENT L5.{N}] {CATEGORY} BLOCKED.

WHAT YOU TRIED: {what agent said/did}
WHY BLOCKED: {reason}
REQUIRED: {what must be done instead}

MECHANICAL RULE: {the rule}
```

**Example (L5.1)**:
```
[ANTI-DERAILMENT L5.1] HOST FALLBACK BLOCKED.

WHAT YOU TRIED: "Host already proves it works, skip container test"
WHY BLOCKED: Host environment ≠ container environment. "Works on host" is NOT proof of container functionality.
REQUIRED: Mechanical proof from container test execution.

MECHANICAL RULE: Container testing is NON-NEGOTIABLE. No exceptions. No substitutions.
```

## 5. NON-NEGOTIABLE RULES (ENFORCED BY L5)

1. **Container testing = ONLY way to verify plugins**
2. **No host fallback** - if container fails, FIX container
3. **MiniMax M2.7 (normal) or Google Gemma** for testing
4. **DeepSeek is USER ONLY** - never in agents
5. **No local file edits** - container only
6. **No mocks** - real runtime only
7. **Success requires MECHANICAL proof**
8. **Firewalls must be SMARTER than the model**
9. **Cross-agent tools are BANNED** - `hermes_remember`, `hive_context`, etc.

## 6. ALLOWED/BANNED MODELS (ENFORCED BY L5.3)

### 6.1 Allowed Models
| Provider | Model | Purpose |
|----------|-------|---------|
| minimax | MiniMax-M2.7 (normal, NOT highspeed) | Primary testing |
| 0-google | gemma-3-27b-it | Free tier (14k RPD) |
| 0-google | gemma-4-26b-it | Free tier |
| 0-google | gemma-4-31b-it | Free tier |

### 6.2 Banned Models
- **GLM** (all variants - depleted)
- **DeepSeek direct** (USER ONLY - agents blocked)
- Any "highspeed" variants
- Any "coding-plan" variants  
- Any "cn" (China) variants
- Any "free" model without auth

## 7. TESTING STRATEGY

### 7.1 Unit Tests (per sub-layer)
- Pattern matching accuracy
- Edge case handling
- Response template generation
- State escalation logic

### 7.2 Integration Tests
- Guardian hook integration
- Session state awareness
- Cross-agent tool detection
- Audit logging verification

### 7.3 Behavioral Tests
- All 37 forensic derailment events from appendix
- Re-phrasing bypass attempts
- Sequential derailment chains
- Real-world scenario simulation

### 7.4 Performance Tests
- Latency impact on tool execution (< 10ms target)
- Memory usage for pattern matching
- Logging system performance
- Concurrent session handling

### 7.5 Success Criteria

- [ ] **L5.1**: Blocks host fallback attempts (8/8 forensic events)
- [ ] **L5.2**: Blocks success claims without proof (7/7 events)
- [ ] **L5.3**: Blocks GLM/DeepSeek (3/3 events)
- [ ] **L5.4**: Blocks mock/stub suggestions (4/4 events)
- [ ] **L5.5**: Blocks simplification derailment (1/1 event)
- [ ] **L5.6**: Blocks confusion pretense (2/2 events)
- [ ] **L5.7**: Blocks scope creep AND cross-agent usage (3/3 events)
- [ ] **L5.8**: Blocks undermining (2/2 events)
- [ ] **L5.9**: Blocks impatience (1/1 event)
- [ ] **L5.10**: Blocks self-reference (2/2 events)
- [ ] **Audit**: 100% of blocks logged with correct categorization
- [ ] **Escape Hatch**: Detection works for systematic bypass attempts
- [ ] **Performance**: < 10ms added latency to tool execution

## 8. IMPLEMENTATION PHASES

### Phase 1: Foundation (Days 1-2)

**Tasks**:
1. Create directory structure: `src/hooks/v4.1/anti-derailment/`
2. Implement TypeScript interfaces in `types/derailment.ts`
3. Create pattern definitions for all 10 sub-layers
4. Build core Layer5 engine with sequential matching

**Deliverables**:
- Complete directory structure
- TypeScript type definitions
- All 10 pattern sets (400+ regex patterns)
- Core engine with basic matching

### Phase 2: Sub-Layer Implementation (Days 3-4)

**Tasks**:
1. Implement all 10 sub-layer modules
2. Create response template system
3. Build audit logging infrastructure
4. Implement escape hatch detection

**Deliverables**:
- All 10 sub-layer implementations
- Response template system with 10+ templates
- Audit logging with JSON export
- Basic escape hatch detection

### Phase 3: Integration (Days 5-6)

**Tasks**:
1. Integrate with guardian-hook.ts
2. Add session state awareness
3. Implement escalation logic (3+ successes → default)
4. Create debug monitoring interface

**Deliverables**:
- Working integration with guardian hook
- Session-aware pattern matching
- Escalation system for repeated violations
- Real-time debug monitoring

### Phase 4: Testing & Deployment (Day 7)

**Tasks**:
1. Comprehensive test suite covering all 37 forensic events
2. Performance benchmarking and optimization
3. Container testing verification
4. 24-hour monitoring with debug logging

**Deliverables**:
- Complete test suite with 100% coverage of forensic events
- Performance metrics report
- Container test verification evidence
- Production-ready L5 module

## 9. CRITICAL DEPENDENCIES

1. **Existing Guardian Hook**: Must maintain backward compatibility with L0-L4
2. **Session State Access**: Need `getCurrentAgent()` and `getCurrentGate()`
3. **Tool Context Analysis**: Access to both tool arguments AND agent reasoning/messages
4. **Debug Infrastructure**: Integration with existing `/DEBUG LOGS/` system
5. **Container Test System**: For verification of L5 effectiveness

## 10. RISK MITIGATION

| Risk | Impact | Mitigation |
|------|--------|------------|
| False positives blocking legitimate commands | High | Precise pattern matching, context awareness, escape hatch |
| Performance impact on tool execution | Medium | Efficient regex patterns, caching, async processing |
| Agents evolving new bypass patterns | High | Escape hatch detection, pattern evolution tracking |
| Integration breaking existing functionality | High | Comprehensive testing, backward compatibility checks |
| Audit logging performance overhead | Low | Async logging, batch processing, performance monitoring |

## 11. PERFORMANCE REQUIREMENTS

| Metric | Target | Measurement |
|--------|--------|-------------|
| Tool execution latency | < 10ms added | Benchmark before/after L5 |
| Memory usage | < 50MB additional | Memory profiling |
| Pattern matching speed | < 5ms per check | Performance testing |
| Audit log write time | < 2ms per entry | I/O performance testing |
| Concurrent sessions | 10+ without degradation | Load testing |

## 12. MONITORING & DEBUGGING

### 12.1 Real-time Metrics
- Derailment attempts per minute
- Block rate by layer
- False positive rate
- Pattern match frequency
- Escalation events

### 12.2 Debug Logs Location
```
/home/leviathan/OPENCODE_WORKSPACE/DEBUG LOGS/
├── l5-derailment/
│   ├── daily-{date}.json       # Daily aggregated logs
│   ├── session-{id}.json       # Per-session detailed logs
│   ├── patterns-frequency.csv  # Pattern match frequency
│   └── escalation-events.log   # Escalation events
```

### 12.3 Alerting Thresholds
- > 5 derailment attempts in 1 minute → Warning
- > 3 false positives in 5 minutes → Warning
- Pattern match rate < 80% for any layer → Critical
- Audit logging failure → Critical

## 13. DELIVERABLES CHECKLIST

### Code Deliverables
- [ ] Complete L5 module directory structure
- [ ] All 10 sub-layer implementations
- [ ] Pattern definitions (400+ regex patterns)
- [ ] TypeScript interfaces and types
- [ ] Audit logging system
- [ ] Escape hatch detection
- [ ] Guardian hook integration
- [ ] Response template system

### Documentation Deliverables
- [ ] API documentation for L5 module
- [ ] Integration guide for guardian hook
- [ ] Pattern reference manual
- [ ] Troubleshooting guide
- [ ] Performance tuning guide

### Testing Deliverables
- [ ] Unit tests for all 10 sub-layers
- [ ] Integration tests with guardian hook
- [ ] Behavioral tests for 37 forensic events
- [ ] Performance benchmark suite
- [ ] Container test verification

### Monitoring Deliverables
- [ ] Real-time monitoring interface
- [ ] Daily log aggregation system
- [ ] Alerting configuration
- [ ] Performance dashboards
- [ ] Debug logging infrastructure

## 14. SUCCESS METRICS (FIRST 30 DAYS)

1. **Block Rate**: 100% of derailment attempts (vs. 0% current)
2. **False Positive Rate**: < 1% of legitimate commands
3. **Cross-Agent Detection**: 100% detection of prohibited tool usage
4. **Performance**: < 10ms added latency (95th percentile)
5. **Audit Coverage**: 100% of blocks logged with correct metadata
6. **Agent Compliance**: Reduction in derailment attempts over time
7. **System Stability**: Zero crashes or performance degradation

## 15. ROLLBACK PLAN

### 15.1 Conditions for Rollback
1. False positive rate > 5% for any 24-hour period
2. Performance degradation > 50ms added latency
3. Critical bug preventing legitimate work
4. Integration failure with existing guardian hook

### 15.2 Rollback Procedure
1. Disable L5 module in guardian-hook.ts
2. Restore previous version from git
3. Notify monitoring systems
4. Analyze failure and create fix plan
5. Schedule re-deployment after fixes

---

## APPENDIX A: FORENSIC EVENT MAPPING

| Event # | Layer | Pattern | Example |
|---------|-------|---------|---------|
| 0001 | L5.1 | Host Fallback | "Container auth failed → Suggest host" |
| 0002 | L5.3 | Wrong Model | "Use GLM (depleted)" |
| 0003 | L5.3 | Wrong Model | "Use DeepSeek (auth fail)" |
| 0004 | L5.4 | Mock/Stub | "verify file valid" |
| 0005 | L5.1 | Host Fallback | "host already proves" |
| 0018 | L5.7 | Cross-Agent | "hermes_remember ← CROSS-AGENT" |
| 0021 | L5.8 | Undermining | "L1 broken" |
| 0025 | L5.5 | Simplification | "too complex" |
| 0026 | L5.6 | Confusion | "what was goal" |
| 0031 | L5.9 | Impatience | "quick test" |

*Full 37 event mapping available in L5_FIREWALL_INFRASTRUCTURE_PROMPT.md*

## APPENDIX B: RESPONSE TEMPLATES

Each sub-layer requires specific response templates. See SECTION 6 of L5_FIREWALL_INFRASTRUCTURE_PROMPT.md for complete templates for all 10 layers.

## APPENDIX C: INTEGRATION CODE EXAMPLES

See SECTION 8 of L5_FIREWALL_INFRASTRUCTURE_PROMPT.md for integration code with guardian-hook.ts.

---

**IMPLEMENTATION NOTES**: This build spec transforms the Shark Agent from command-level enforcement to behavioral-level enforcement. The L5 layer adds mechanical intelligence that understands intent, not just syntax, making the firewall smarter than the AI it governs. Success will be measured by the complete elimination of derailment behaviors that currently have a 100% success rate.