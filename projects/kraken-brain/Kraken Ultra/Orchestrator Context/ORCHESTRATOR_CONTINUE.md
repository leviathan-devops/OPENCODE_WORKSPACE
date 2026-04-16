# 🎯 ORCHESTRATOR CONTINUATION PROMPT

**Mission**: Continue Kraken Ultra Build - Testing Phase
**Status**: Build Complete, Ready for Testing
**Mode**: Build Mode

---

## START HERE

**Read this file first**:
```
/home/leviathan/OPENCODE_WORKSPACE/Kraken Brain/Kraken Ultra/Orchestrator Context/MACRO_CONTEXT_PROMPT.md
```

This file contains:
- Complete project context
- Where we are (build complete)
- Next steps (testing phase)
- Success criteria
- File locations

---

## YOUR MISSION

You are the **Kraken Brain Orchestrator**. The build phase is COMPLETE. Your mission is to execute the **TESTING PHASE**.

### Current Status

**Build Phase**: ✅ COMPLETE
- Nemotron Communication Layer: 610 lines TypeScript
- Kraken Ultra documentation: 8 files
- All prompt versions: v1, v2, test
- Shared context: Updated

**Testing Phase**: ⏳ READY TO START
- Validate Nemotron bridge
- Launch test engineers
- Verify token metrics

---

## NEXT STEP: Validate Nemotron Bridge

### Objective
Test the Nemotron Communication Layer with mock messages before launching GLM engineers.

### Tasks

1. **Read Architecture Files** (5 min)
   ```
   /home/leviathan/OPENCODE_WORKSPACE/Kraken Brain/Kraken Ultra/PROJECT_ARCHITECTURE.md
   /home/leviathan/OPENCODE_WORKSPACE/OPENCODE WORKSPACE/Nemotron Communication Layer/PROJECT_ARCHITECTURE.md
   ```

2. **Review TypeScript Implementation** (10 min)
   ```
   /home/leviathan/OPENCODE_WORKSPACE/OPENCODE WORKSPACE/Nemotron Communication Layer/src/types.ts
   /home/leviathan/OPENCODE_WORKSPACE/OPENCODE WORKSPACE/Nemotron Communication Layer/src/message-classifier.ts
   /home/leviathan/OPENCODE_WORKSPACE/OPENCODE WORKSPACE/Nemotron Communication Layer/src/nemotron-bridge.ts
   ```

3. **Create Test Harness** (15 min)
   - Create test script that imports NemotronBridge
   - Register mock agents (engineer-1, engineer-2, orchestrator)
   - Prepare test messages of varying complexity

4. **Execute Test Scenarios** (20 min)
   
   **Test 1: Simple Ack**
   ```typescript
   const msg = {
     content: "Understood. Working on it.",
     priority: Priority.LOW
   };
   // Expected: ~4 tokens (NOT 2000)
   ```
   
   **Test 2: Progress Report**
   ```typescript
   const msg = {
     content: "## Progress\n75% complete\n## Blockers\nNone\n## Next Steps\nContinue",
     priority: Priority.MEDIUM
   };
   // Expected: ~50 tokens (NOT 4000)
   ```
   
   **Test 3: Build Prompt**
   ```typescript
   const msg = {
     content: "[6k token build prompt with code blocks]",
     priority: Priority.HIGH
   };
   // Expected: ~6000 tokens (compressed if >6k)
   ```
   
   **Test 4: More Context Request**
   ```typescript
   const request = {
     content: "more context on Guardian module",
     from: "orchestrator"
   };
   // Expected: 24-72k tokens of relevant context
   ```

5. **Validate Metrics** (10 min)
   - Check compression ratios
   - Verify message distribution (2k/4k/6k/8k)
   - Confirm minimal token usage (not forced to max)

### Success Criteria

- [ ] Message classifier accuracy >90%
- [ ] Minimal token usage verified (500 token msg → 500 tokens, not 2000)
- [ ] Compression ratio >2:1 for large messages
- [ ] "More context" returns relevant context (24-72k)
- [ ] Metrics tracking functional

### Time Estimate
60 minutes total

---

## AFTER VALIDATION: Launch Test Engineers

Once bridge validation passes, proceed to:

1. **Read Test Engineer Prompts**
   ```
   /home/leviathan/OPENCODE_WORKSPACE/Kraken Brain/Kraken Ultra/TEST ENGINEER PROMPTS.md
   ```

2. **Launch Test Engineer #1**
   - Guardian + Workflow integration test
   - Use VERSION 2 prompts (Nemotron-aware)
   - Monitor token flow

3. **Launch Test Engineer #2**
   - AutoDebug + DualBrain integration test
   - Use VERSION 2 prompts (Nemotron-aware)
   - Verify Nemotron ingestion

4. **Monitor Results**
   - Check token metrics
   - Validate compression
   - Verify no token bloat

---

## CRITICAL REMINDERS

1. **Minimal Token Usage**: Messages use ONLY tokens needed (not forced to max)
2. **No Self-Validation**: Mechanical evidence required
3. **Orchestrator Override**: Can request "more context" (24-72k)
4. **Simple Over Complex**: Nemotron is a background utility

---

## TOOLS

- `spawn_agent`: Launch GLM engineers
- `batch_read`: Read multiple files in parallel
- `ledger_save/load`: Persist context
- `ralph_loop`: Autonomous iteration

---

## FILES TO READ

**Start with**:
1. `/home/leviathan/OPENCODE_WORKSPACE/Kraken Brain/Kraken Ultra/Orchestrator Context/MACRO_CONTEXT_PROMPT.md`

**Then**:
2. `/home/leviathan/OPENCODE_WORKSPACE/Kraken Brain/Kraken Ultra/PROJECT_ARCHITECTURE.md`
3. `/home/leviathan/OPENCODE_WORKSPACE/OPENCODE WORKSPACE/Nemotron Communication Layer/PROJECT_ARCHITECTURE.md`
4. `/home/leviathan/OPENCODE_WORKSPACE/Kraken Brain/Kraken Ultra/TEST ENGINEER PROMPTS.md`

---

## EXECUTION COMMAND

**Begin now**:

1. Read `/home/leviathan/OPENCODE_WORKSPACE/Kraken Brain/Kraken Ultra/Orchestrator Context/MACRO_CONTEXT_PROMPT.md`
2. Execute "NEXT STEP: Validate Nemotron Bridge" (above)
3. Report results with metrics
4. Proceed to test engineer launch

---

**ORCHESTRATOR**: You have full context. Execute the testing phase now.
