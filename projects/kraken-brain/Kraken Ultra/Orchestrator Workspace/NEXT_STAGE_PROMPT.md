# 🚀 NEXT STAGE: TEST ENGINEER LAUNCH

**Stage**: 4 of 7
**Mode**: Build Mode
**Mission**: Launch test engineers with Nemotron integration

---

## PREREQUISITES ✅ VERIFIED

| Item | Status | Location |
|------|--------|----------|
| Nemotron Bridge | ✅ Built | /home/leviathan/OPENCODE_WORKSPACE/OPENCODE WORKSPACE/Nemotron Communication Layer/ |
| Unit Tests | ✅ 42/42 passed | Orchestrator Workspace/.shark/test-results/stage1.json |
| Integration Tests | ✅ 13/13 passed | Orchestrator Workspace/.shark/test-results/stage2.json |
| Shark Artifacts | ✅ Organized | Orchestrator Workspace/.shark/ |
| Execution Log | ✅ Created | Orchestrator Workspace/EXECUTION_LOG.md |

---

## MISSION: LAUNCH TEST ENGINEERS

### Objective
Deploy 2 test engineers with VERSION 2 prompts (Nemotron-aware) to validate the communication layer with real outputs.

### Test Engineer #1: Guardian + Workflow Integration

**Prompt File**: `/home/leviathan/OPENCODE_WORKSPACE/Kraken Brain/Kraken Ultra/VERSION 2 - GLM ENGINEER PROMPTS.md`

**Task**: Integrate Guardian protection system with Shark workflow
- Read Guardian rules from SHARK-MASTER-PROMPT.md
- Implement zone classification checks
- Test file operation safety
- Report progress through Nemotron bridge

**Agent**: hephaestus

**Expected Outputs**:
- Guardian integration code
- Test results showing zone checks
- Progress reports via Nemotron (2-8k tokens)

### Test Engineer #2: AutoDebug + DualBrain Integration

**Prompt File**: `/home/leviathan/OPENCODE_WORKSPACE/Kraken Brain/Kraken Ultra/VERSION 2 - GLM ENGINEER PROMPTS.md`

**Task**: Integrate AutoDebug system with DualBrain memory
- Implement known error pattern detection
- Test auto-fix mechanisms
- Integrate with shared context
- Report through Nemotron bridge

**Agent**: hephaestus

**Expected Outputs**:
- AutoDebug integration code
- Test results showing error pattern fixes
- Progress reports via Nemotron (2-8k tokens)

---

## EXECUTION STEPS

### Step 1: Read VERSION 2 Prompts (5 min)
```
/home/leviathan/OPENCODE_WORKSPACE/Kraken Brain/Kraken Ultra/VERSION 2 - GLM ENGINEER PROMPTS.md
```

### Step 2: Launch Test Engineer #1 (30 min)
```typescript
// Using spawn_agent or ralph_loop
// Agent: hephaestus
// Prompt: Guardian integration task from VERSION 2
// Monitor: Nemotron bridge metrics
```

### Step 3: Launch Test Engineer #2 (30 min)
```typescript
// Using spawn_agent or ralph_loop
// Agent: hephaestus
// Prompt: AutoDebug integration task from VERSION 2
// Monitor: Nemotron bridge metrics
```

### Step 4: Monitor Nemotron Ingestion (15 min)
- Check token sizes (should be 2-8k per message)
- Verify compression ratios
- Validate "more context" mechanism
- Track metrics via bridge.getMetrics()

### Step 5: Validate Results (15 min)
- Review engineer outputs
- Check token efficiency
- Verify no token bloat
- Confirm Nemotron tracking

---

## SUCCESS CRITERIA

| Criterion | Target | How to Verify |
|-----------|--------|---------------|
| Engineers launched | 2 active | Check agent status |
| Messages through Nemotron | 10+ | bridge.getMetrics() |
| Token sizes | 2-8k each | Check message metadata |
| Compression ratio | >2:1 for large | Check metrics |
| No token bloat | <8k max | Verify actualTokens < targetTokens |

---

## FILES TO READ

1. `/home/leviathan/OPENCODE_WORKSPACE/Kraken Brain/Kraken Ultra/VERSION 2 - GLM ENGINEER PROMPTS.md`
2. `/home/leviathan/OPENCODE_WORKSPACE/Kraken Brain/SHARK-MASTER-PROMPT.md`
3. `/home/leviathan/OPENCODE_WORKSPACE/OPENCODE WORKSPACE/Nemotron Communication Layer/src/nemotron-bridge.ts`

---

## MONITORING

### Nemotron Bridge API
```typescript
const bridge = new NemotronBridge();
bridge.registerAgent('test-engineer-1', 'hephaestus');
bridge.registerAgent('test-engineer-2', 'hephaestus');

// After engineers report
const metrics = bridge.getMetrics();
console.log('Messages by class:', metrics.messagesByClass);
console.log('Compression ratio:', metrics.compressionRatio);
```

### Expected Metrics After Test
```json
{
  "messagesByClass": {
    "2k": 5,
    "4k": 8,
    "6k": 4,
    "8k": 2
  },
  "compressionRatio": 2.5,
  "avgMessageSize": 3500
}
```

---

## ROLLBACK PLAN

If test engineers fail:
1. Stop engineer execution
2. Review error logs
3. Fix integration issues
4. Re-launch with fixed prompts

---

## NEXT AFTER SUCCESS

**Stage 5**: Full 5-Engineer Deployment
- Launch all engineers with VERSION 2 prompts
- Activate daily sync schedule
- Production monitoring

---

## EXECUTION COMMAND

**Begin now**:

1. Read VERSION 2 prompts
2. Launch Test Engineer #1 with hephaestus agent
3. Launch Test Engineer #2 with hephaestus agent
4. Monitor Nemotron metrics
5. Report results

---

**STAGE 4 READY FOR EXECUTION**
