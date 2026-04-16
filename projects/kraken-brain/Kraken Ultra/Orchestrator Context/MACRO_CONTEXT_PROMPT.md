# 🦑 MACRO CONTEXT - ORCHESTRATOR CONTINUATION PROMPT

**Purpose**: Provide orchestrator with full context to continue Kraken Ultra build
**Created**: Mar 26 2026
**Status**: Build Phase Complete, Ready for Testing

---

## 📋 READ THIS FIRST

**Orchestrator**: You are continuing the Kraken Ultra build. The build phase is COMPLETE. Your mission is to execute the TESTING phase.

**Start by reading these files in order**:

1. `/home/leviathan/OPENCODE_WORKSPACE/Kraken Brain/Kraken Ultra/PROJECT_ARCHITECTURE.md` (Master architecture)
2. `/home/leviathan/OPENCODE_WORKSPACE/Kraken Brain/Kraken Ultra/ACTIVE_CONTEXT.md` (Current status)
3. `/home/leviathan/OPENCODE_WORKSPACE/Kraken Brain/Kraken Ultra/Orchestrator Context/BUILD_SESSION_MAR_26_2026.md` (Build session summary)
4. `/home/leviathan/OPENCODE_WORKSPACE/OPENCODE WORKSPACE/Nemotron Communication Layer/PROJECT_ARCHITECTURE.md` (Nemotron specs)

---

## 🎯 WHERE WE ARE

### Build Phase: ✅ COMPLETE

**Completed**:
- TurboQuant context archived (forgotten)
- Nemotron Communication Layer implemented (610 lines TypeScript)
- Kraken Ultra documentation created (8 files)
- Shared context updated with Nemotron specs
- All prompt versions created (v1, v2, test)

**Files Created**: 20 files total
- TurboQuant Archive: 2 files
- Nemotron Communication Layer: 10 files
- Kraken Ultra: 8 files

**Key Achievement**: Nemotron bridge uses **minimal tokens** (not forced to max budget)

---

## 🔄 NEXT STEPS (Your Mission)

### Step 1: Validate Nemotron Bridge (30 min)

**Objective**: Test the bridge with mock messages before launching engineers

**Tasks**:
1. Load the Nemotron bridge TypeScript modules
2. Create test harness with mock agents
3. Send test messages through pipeline:
   - Simple ack (should use ~4 tokens, not 2000)
   - Progress report (should compress to ~3k if 5k original)
   - Build prompt (should use ~6k)
   - Debugging session (should use ~8k)
4. Verify "more context" request returns 24-72k tokens
5. Validate metrics tracking

**Success Criteria**:
- Message classifier accuracy >90%
- Token usage minimal (not forced to max)
- Compression ratio >2:1 for large messages
- "More context" returns relevant context

### Step 2: Launch Test Engineers (1-2 hours)

**Objective**: Test with real GLM engineers before full deployment

**Tasks**:
1. Read VERSION 2 prompts from `/home/leviathan/OPENCODE_WORKSPACE/Kraken Brain/Kraken Ultra/VERSION 2 - GLM ENGINEER PROMPTS.md`
2. Launch Test Engineer #1 (Guardian + Workflow integration test)
3. Launch Test Engineer #2 (AutoDebug + DualBrain integration test)
4. Monitor Nemotron ingestion of engineer outputs
5. Verify token metrics in real-time

**Success Criteria**:
- Engineers report through Nemotron
- Token sizes match expectations (2-8k)
- No token bloat detected
- Nemotron tracks metrics correctly

### Step 3: Full 5-Engineer Deployment (After Validation)

**Objective**: Deploy full integration team with Nemotron protocol

**Tasks**:
1. Launch all 5 engineers with VERSION 2 prompts
2. Monitor daily sync schedule (07:00, 18:00)
3. Track token flow and compression ratios
4. Adjust thresholds if needed
5. Validate anti-hallucination protocols

**Success Criteria**:
- All 4 Shark systems integrated
- Mechanical evidence for each workflow step
- No theatrical code detected
- User approval obtained

---

## 🔧 TOOLS AVAILABLE

### opencode-ultra Plugin
- `spawn_agent`: Launch GLM engineers
- `ralph_loop`: Autonomous iteration
- `ledger_save/load`: Context persistence
- `batch_read`: Parallel file reading

### Nemotron Bridge API
```typescript
const bridge = new NemotronBridge();
bridge.registerAgent('engineer-1', 'hephaestus');
const result = bridge.processMessage(message);
const metrics = bridge.getMetrics();
const context = bridge.handleMoreContextRequest(request);
```

---

## ⚠️ CRITICAL CONSTRAINTS

1. **Minimal tokens**: Messages use only needed tokens (not forced to max)
2. **No self-validation**: Mechanical evidence required for all workflow steps
3. **Simple over complex**: Nemotron is a background utility
4. **Orchestrator override**: Can request "more context" (24-72k)
5. **1M token storage**: Full context preserved (FIFO eviction)
6. **No TurboQuant**: Archived, not active development

---

## 📊 MONITORING TARGETS

| Metric | Target | Action if Exceeded |
|--------|--------|-------------------|
| Avg message size | <6k tokens | Tighten compression |
| Compression ratio | >2:1 | Improve filtering |
| Override rate | <10% | Increase defaults |
| Orchestrator tokens | <100k/hr | Emergency mode |

---

## 🎯 SUCCESS CRITERIA FOR THIS SESSION

1. ✅ Nemotron bridge validated with mock messages
2. ✅ Test engineers launched and reporting
3. ✅ Token metrics tracking confirmed
4. ✅ "More context" mechanism tested
5. ✅ Ready for full 5-engineer deployment

---

## 📁 KEY FILE LOCATIONS

**Active Development**:
- `/home/leviathan/OPENCODE_WORKSPACE/Kraken Brain/Kraken Ultra/` (project root)
- `/home/leviathan/OPENCODE_WORKSPACE/OPENCODE WORKSPACE/Nemotron Communication Layer/` (bridge implementation)

**Prompts**:
- `/home/leviathan/OPENCODE_WORKSPACE/Kraken Brain/Kraken Ultra/VERSION 2 - GLM ENGINEER PROMPTS.md`
- `/home/leviathan/OPENCODE_WORKSPACE/Kraken Brain/Kraken Ultra/TEST ENGINEER PROMPTS.md`

**Reference**:
- `/home/leviathan/OPENCODE_WORKSPACE/Kraken Brain/Shared Macro Context/PROJECT_ARCHITECTURE.md`
- `/home/leviathan/OPENCODE_WORKSPACE/shark-frankenstein/` (Shark Agent source)
- `/home/leviathan/OPENCODE_WORKSPACE/shark-opencode-integration/` (Opencode fork)

---

## 🚀 EXECUTION APPROACH

**Phase 1**: Validation (You are here)
- Test Nemotron bridge with mock messages
- Verify minimal token usage
- Validate "more context" mechanism

**Phase 2**: Test Engineers
- Launch 1-2 engineers with VERSION 2 prompts
- Monitor real-world token flow
- Adjust compression thresholds

**Phase 3**: Production
- Full 5-engineer deployment
- Continuous monitoring
- Iteration based on metrics

---

## 💡 KEY INSIGHT

**The most important feature**: Messages use ONLY the tokens they need.

A 500-token message will use 500 tokens, NOT 2000. This is critical for token efficiency.

---

**ORCHESTRATOR**: Begin with Step 1 (Validate Nemotron Bridge). Read the architecture files, then execute the validation tasks.
