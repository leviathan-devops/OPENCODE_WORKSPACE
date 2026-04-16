# 🦈 SHARK CLI - Key Insights

**Project**: Shark Frankenstein (Dual-Brain AI Coding Assistant)  
**Session Date**: 2026-03-28

---

## Strategic Insights

### 1. The Dual-Brain Pattern is a Competitive Advantage

**Insight**: Having two specialized modes (Micro/Macro) rather than one general-purpose AI provides significant benefits.

**Why It Matters**:
- Users can match mode to task complexity
- Micro mode is essentially free (vLLM + Gemma fallback)
- Macro mode handles complex multi-file tasks
- Different cost/quality trade-offs per mode

**Strategic Implication**: This pattern could be extended to more specialized modes (e.g., DevOps mode, Security Audit mode).

---

### 2. Safety Features Enable Trust

**Insight**: Guardian protection, FirewallMesh, and audit trails make users trust the system.

**Why It Matters**:
- Users are willing to let AI modify files because of Guardian
- Audit trails enable debugging and accountability
- Workflow enforcement prevents incomplete work

**Strategic Implication**: Safety features are not just nice-to-have; they're essential for production use.

---

### 3. Local Execution (vLLM) is a Differentiator

**Insight**: Running Qwen 2.5 Coder locally via vLLM eliminates API costs and improves privacy.

**Why It Matters**:
- No per-token costs for Micro mode
- Code doesn't leave the user's machine
- Lower latency than cloud APIs

**Strategic Implication**: Local model support should be expanded; consider more local model options.

---

### 4. The Advisory Brain Pattern Improves Quality

**Insight**: Having DeepSeek R1 as an advisory brain to GLM 5's primary execution catches errors.

**Why It Matters**:
- Two models can catch each other's mistakes
- Strategic consultation before execution
- Progress review between iterations

**Strategic Implication**: Consider adding more advisory patterns (e.g., security advisor, performance advisor).

---

## Technical Insights

### 5. Parallel Firewalls Scale Well

**Insight**: Running 4 firewalls in parallel via Promise.all adds negligible overhead.

**Measurement**: <50ms overhead for all 4 firewalls

**Why It Works**:
- Firewalls are CPU-bound checks (no I/O)
- Promise.all schedules efficiently
- No sequential blocking

**Implication**: Can add more firewalls without significant performance cost.

---

### 6. Stagnation Detection Prevents Infinite Loops

**Insight**: Detecting repeated tool failures and escalating prevents wasted iterations.

**Threshold**: 3 identical failures trigger escalation

**Why It Works**:
- Catches when AI is stuck in a loop
- Allows escalation to fresh agent with clean context
- Logs problematic patterns for analysis

**Implication**: Can tune threshold based on task type; complex tasks may need higher threshold.

---

### 7. Backward-Compatible Migration Reduces Risk

**Insight**: Creating V2 files alongside V1 allowed safe migration.

**Why It Works**:
- Original code still works if V2 has issues
- Gradual migration possible
- Easy rollback

**Implication**: Use this pattern for major changes; don't break existing functionality.

---

## Product Insights

### 8. Mode Selection Wizard Improves UX

**Insight**: Interactive mode selection with descriptions helps users choose correctly.

**Implementation**: Wizard shows mode descriptions, use cases, and cost implications

**Why It Matters**:
- Users understand trade-offs before starting
- Reduces incorrect mode selection
- Sets expectations for cost and time

**Implication**: Consider adding more guidance throughout the workflow.

---

### 9. YOLO Mode is Controversial but Necessary

**Insight**: `--yolo` flag (bypass all firewalls) is dangerous but users requested it.

**Why It Matters**:
- Power users want full control
- Emergency situations need quick action
- Trust model: user knows what they're doing

**Risk Mitigation**: Log all YOLO operations for audit trail

**Implication**: Consider graduated bypass levels instead of all-or-nothing.

---

### 10. Real-Time Statistics Build Confidence

**Insight**: `/firewall-stats` and `/stagnation-stats` commands provide transparency.

**Why It Matters**:
- Users see the system is working
- Understand what's being blocked and why
- Debug issues more easily

**Implication**: Add more visibility commands (e.g., `/brain-stats`, `/cost-estimate`).

---

## Cost Insights

### 11. Micro Mode is Nearly Free

**Insight**: vLLM (local) + Gemma (free tier) means Micro mode costs ~$0.

**Breakdown**:
- vLLM: $0 (local GPU inference)
- Gemma fallback: $0 (Google AI free tier, 14k RPD)

**Implication**: Encourage users to use Micro mode for simple tasks; reserve Macro for complex work.

---

### 12. Macro Mode is Expensive but Worth It

**Insight**: GLM 5 + DeepSeek R1 costs money but handles complex tasks.

**Cost Estimate**:
- GLM 5: ~$0.01-0.05 per task (varies by complexity)
- DeepSeek R1: ~$0.01-0.03 per consultation
- Total: ~$0.02-0.08 per task

**Implication**: Show cost estimate before starting Macro task.

---

## Architecture Insights

### 13. Coordinator Pattern is Extensible

**Insight**: BaseCoordinator → MicroCoordinator/MacroCoordinator pattern allows easy addition of new modes.

**Example**: Could add:
- `DevOpsCoordinator` for infrastructure tasks
- `SecurityCoordinator` for security audits
- `DataCoordinator` for data processing

**Implication**: Design for extensibility from the start.

---

### 14. Tool Abstraction Enables Safety

**Insight**: All file operations go through ToolExecutor, enabling FirewallMesh protection.

**Why It Matters**:
- Centralized interception point
- Cannot bypass via direct fs calls (if properly implemented)
- Audit trail for all operations

**Implication**: Ensure ALL file operations go through ToolExecutor.

---

### 15. The 5-Step Workflow Matches Software Development

**Insight**: PLAN → BUILD → TEST → VERIFY → SHIP maps to real development process.

**Why It Matters**:
- Familiar mental model for developers
- Enforces good practices
- Prevents skipping critical steps

**Implication**: Could add workflow customization for different methodologies (e.g., TDD, GitFlow).

---

## Risk Insights

### 16. API Key Management is a Weakness

**Insight**: API keys are stored in environment variables with no rotation.

**Risks**:
- Keys could be leaked via logs
- No automatic rotation
- No key usage tracking

**Recommendation**: Implement proper key management (vault, rotation, tracking).

---

### 17. Single Point of Failure: ToolExecutor

**Insight**: ToolExecutor is a critical component; if it fails, all tool operations fail.

**Risks**:
- Bug in ToolExecutor breaks all tools
- No fallback if ToolExecutor crashes

**Recommendation**: Add circuit breaker pattern and fallback mechanisms.

---

### 18. No Rate Limiting on API Calls

**Insight**: Brain clients don't implement rate limiting.

**Risks**:
- Could hit API rate limits
- Could incur unexpected costs
- Could be blocked by API providers

**Recommendation**: Add rate limiting and cost tracking.

---

## Future Insights

### 19. Plugin System Would Enable Community Contributions

**Insight**: A plugin system would allow community members to add features.

**Potential Plugins**:
- Custom firewalls for specific frameworks
- Brain clients for new LLM providers
- Tools for specific use cases (e.g., Kubernetes)
- Verification gates for specific requirements

**Implication**: Design plugin API early; make it stable.

---

### 20. Web UI Would Expand User Base

**Insight**: Not all users are comfortable with CLI.

**Benefits of Web UI**:
- Visual mode selection
- Real-time output display
- Dashboard for statistics
- Easier onboarding

**Implication**: Consider web UI as next major feature after CLI is stable.

---

## Metrics Insights

### 21. Key Metrics to Track

**For Quality**:
- Task completion rate
- Average iterations per task
- Guardian block rate
- Stagnation rate

**For Performance**:
- Tool execution latency
- Brain response time
- Firewall overhead
- Memory usage

**For Cost**:
- Tokens used per task
- API calls per task
- Cost per task

**For UX**:
- Mode selection distribution
- Command usage frequency
- Error rate

---

### 22. Success Criteria

**For V2 Launch**:
- [ ] Stage 2 tests pass
- [ ] 11/11 integration tests pass
- [ ] Stage 1 Docker tests pass (3/4 minimum)
- [ ] No TypeScript errors
- [ ] Documentation complete

**For Production**:
- [ ] 95%+ task completion rate
- [ ] <5% Guardian false positive rate
- [ ] <10% stagnation rate
- [ ] <500ms average tool execution
- [ ] <$0.10 average cost per task

---

## Decision Log

### Decision 1: V2 Files Alongside V1

**Context**: Major integration changes needed  
**Options**:
1. Modify existing files in place
2. Create V2 files alongside

**Decision**: Option 2 - Create V2 files alongside  
**Reason**: Backward compatibility, easy rollback, safe migration

---

### Decision 2: Parallel Firewalls

**Context**: Multiple safety checks needed  
**Options**:
1. Sequential firewall execution
2. Parallel firewall execution

**Decision**: Option 2 - Parallel execution  
**Reason**: Lower latency, all firewalls run regardless of early blocks

---

### Decision 3: vLLM as Micro Primary

**Context**: Need free execution for simple tasks  
**Options**:
1. Gemma as primary (cloud API)
2. vLLM as primary (local) with Gemma fallback

**Decision**: Option 2 - vLLM primary with fallback  
**Reason**: Zero cost for local execution, Gemma as safety net

---

### Decision 4: GLM 5 for Macro

**Context**: Need powerful model for complex tasks  
**Options**:
1. GPT-4
2. Claude 3.5
3. GLM 5
4. DeepSeek V3

**Decision**: Option 3 - GLM 5  
**Reason**: Cost-effective, good tool use, Chinese market access

---

### Decision 5: Stagnation Threshold = 3

**Context**: Need threshold for failure detection  
**Options**:
1. Threshold = 2 (sensitive)
2. Threshold = 3 (balanced)
3. Threshold = 5 (tolerant)

**Decision**: Option 2 - Threshold = 3  
**Reason**: Catches loops without false positives

---

*Key Insights Document generated: 2026-03-28*
