# SUCCESS CRITERIA — V2.0 Ship Gate

## Functional Requirements

### Multi-Brain Architecture
- [ ] Planning Brain generates T1 from SPEC.md
- [ ] Execution Brain supervises subagent-manager
- [ ] System Brain enforces **Two-Layer Firewall**
- [ ] All 3 brains run concurrently (not sequentially)

### Roundtable Council
- [ ] Alpha Brain focuses on steamroll tasks
- [ ] Beta Brain focuses on precision tasks
- [ ] Gamma Brain focuses on testing tasks
- [ ] Inter-cluster communication via BrainMessenger

### Output Retrieval (V2.0 Enhanced)
- [ ] Output Checkpoint System enforced
- [ ] No fire-and-forget pattern possible
- [ ] Every declared output has fs.existsSync() verification
- [ ] Subagent cannot claim complete without verified checkpoints

### Context Management (V2.0 NEW)
- [ ] Token monitor triggers cleanup at 65%
- [ ] Pre-compaction export at 75%
- [ ] Post-compaction injection restores stream
- [ ] Dynamic injection at decision points

### Override System (V2.0 Enhanced)
- [ ] Structured override commands (typed schema)
- [ ] Override actions: ABORT, CLAIM_COMPLETE, RETRIEVE_OUTPUTS, REASSIGN
- [ ] Constraints with evidence requirements
- [ ] Response schema with status codes

---

## L0-L8 Firewall Requirements

| Layer | Requirement | V2.0 Enhancement |
|-------|-------------|------------------|
| L0 | Non-Kraken agents blocked from Kraken paths | Unchanged |
| L1 | Orchestration theater blocked | Unchanged |
| L2 | False completion blocked | **Mechanical verification** |
| L3 | Output inspection works | **Checkpoint system** |
| L4 | Wrong cluster blocked | Unchanged |
| L5 | Macro derailment blocked | **Two-layer enforcement** |
| L6 | Kraken zones protected | Unchanged |
| L7 | Coordination gates enforced | **Explicit criteria** |
| L8 | Behavioral intelligence | **Message-layer enforcement** |

---

## Two-Layer Firewall Requirements

### Layer 1: Tool Enforcement
- [ ] `tool.execute.before` hook fires on all dangerous tools
- [ ] Pattern matching against toolArgs only
- [ ] Throw blocks execution

### Layer 2: Message Enforcement (NEW)
- [ ] `chat.message` hook fires on agent messages
- [ ] Message patterns match agent intent
- [ ] Same blocking mechanism as tool layer

---

## Mechanical Output Verification Requirements

### Output Checkpoint System
- [ ] Every task has declared outputs (containerPath + hostPath)
- [ ] `registerOutputs()` called before task starts
- [ ] `claimRetrieved()` requires fs.existsSync() for each output
- [ ] `canComplete()` returns false if any checkpoint unverified

### Evidence Collection
- [ ] `OutputEvidence` interface with checkpoint details
- [ ] `verified: boolean` on each checkpoint
- [ ] `verifiedAt` timestamp when verified

---

## Structured Override Requirements

### Override Command Schema
- [ ] `OverrideCommand` interface with typed `action` enum
- [ ] Actions: ABORT, CLAIM_COMPLETE, RETRIEVE_OUTPUTS, REASSIGN, SUSPEND, RESUME
- [ ] `constraints` with `requiresEvidence` array
- [ ] `priority: 'critical' | 'high'`

### Override Response Schema
- [ ] `OverrideResponse` with `status` enum
- [ ] Statuses: acknowledged, executing, completed, rejected, failed
- [ ] `error` with code and canRetry flag

---

## Explicit Gate Criteria Requirements

### Gate Definitions
- [ ] PLAN gate: Planning Brain completes T2 load, T1 generation
- [ ] BUILD gate: Execution Brain spawns tasks, System Brain patterns active
- [ ] TEST gate: Gamma verifies ContainerTestResult.json with passRate >= 0.96
- [ ] VERIFY gate: Integration tests complete
- [ ] AUDIT gate: Security scan and linter pass
- [ ] DELIVERY gate: Ship package verified

### Gate Evaluation
- [ ] `GateCriteria` interface with per-brain completed arrays
- [ ] `evaluateGateEntry()` checks all criteria
- [ ] Gate only advances when ALL criteria met
- [ ] Blockers listed when criteria not met

---

## Compaction Management Requirements

### Tier 0: Proactive Token Management
- [ ] TokenBudgetMonitor tracks current/max tokens
- [ ] Warning at 65% (light pruning)
- [ ] Pre-compaction at 75% (export ready)
- [ ] Compaction at 85% (OPENCODE AUTO-COMPACTION)

### Tier 1: Pre-Compaction Export
- [ ] CompactionEventDetector creates event at 75%
- [ ] Exports: chat history, decision points, brain state
- [ ] Synthesis instructions generated

### Tier 2: Post-Compaction Synthesis
- [ ] PostCompactionSynthesizer creates InjectionFile
- [ ] Contains: stream anchor, situation summary, critical files
- [ ] Last 100 lines chat preserved
- [ ] Decision chain synthesized

### Tier 3: Dynamic Injection
- [ ] DynamicContextInjector evaluates decision points
- [ ] Context library lookup by phase + task type
- [ ] Algorithmic frameworks injected (implementation/testing/debugging)

---

## Integration Requirements

- [ ] Kraken loads in OpenCode tab toggle
- [ ] `kraken-status` shows all brains
- [ ] `spawn_cluster_task` respects domain designation
- [ ] `report_to_kraken` flows through to System Brain
- [ ] Override commands routed correctly
- [ ] Compaction recovery on session.created

---

## Performance Requirements

| Metric | Target |
|--------|--------|
| Brain initialization | < 5 seconds |
| Token update latency | < 10ms |
| Message delivery | < 100ms |
| State store operations | < 10ms |
| Compaction export | < 5 seconds |
| Injection synthesis | < 10 seconds |
| Memory after 10 tasks | No leak |

---

## Ship Gate Checklist

### Pre-Ship
- [ ] All unit tests pass
- [ ] Container tests pass
- [ ] Two-layer firewall verified
- [ ] Output checkpoints verified
- [ ] Override commands tested
- [ ] Gate criteria tested
- [ ] Compaction recovery tested

### Evidence Required
- [ ] ContainerTestResult.json with passRate >= 0.96
- [ ] IntegrationTestResult.json
- [ ] AuditReport.json
- [ ] Compaction recovery log

---

*End of Success Criteria*