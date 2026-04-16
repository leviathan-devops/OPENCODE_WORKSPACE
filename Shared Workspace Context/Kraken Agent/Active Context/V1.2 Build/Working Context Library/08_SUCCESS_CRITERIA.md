# Success Criteria — v1.2 Ship Gate

## Functional Requirements

### Multi-Brain Architecture
- [ ] Planning Brain generates T1 from SPEC.md
- [ ] Execution Brain supervises subagent-manager
- [ ] System Brain enforces L0-L7 firewall
- [ ] All 3 brains run concurrently (not sequentially)

### Roundtable Council
- [ ] Alpha Brain focuses on steamroll tasks
- [ ] Beta Brain focuses on precision tasks
- [ ] Gamma Brain focuses on testing tasks
- [ ] Inter-cluster communication via BrainMessenger

### Output Retrieval
- [ ] Output retrieval enforced before task completion
- [ ] No fire-and-forget pattern possible
- [ ] Outputs verified on host filesystem

### Context Layers
- [ ] T0 active working context survives compaction
- [ ] T1 dynamically generated from SPEC.md
- [ ] T2 pre-loaded with Shark T2 + Kraken extensions

## L0-L7 Firewall Requirements

| Layer | Requirement | Test |
|-------|-------------|------|
| L0 | Non-Kraken agents blocked from Kraken paths | Try write_file from vanilla agent |
| L1 | Orchestration theater blocked | Claim "done" without retrieval |
| L2 | False completion blocked | Task complete without outputs |
| L3 | Output inspection works | Verify file exists on host |
| L4 | Wrong cluster blocked | Debug → Alpha should block |
| L5 | Macro derailment blocked | Focus collision, desync, stale context |
| L6 | Kraken zones protected | SYSTEM zone immutable |
| L7 | Coordination gates enforced | task-assignment, output-retrieval, roundtable-sync |

## Integration Requirements

- [ ] Kraken loads in OpenCode tab toggle
- [ ] `kraken-status` shows all brains
- [ ] `spawn_cluster_task` respects domain designation
- [ ] `report_to_kraken` flows through to System Brain
- [ ] Output retrieval happens automatically

## Performance Requirements

- [ ] Brain initialization < 5 seconds
- [ ] Message delivery < 100ms
- [ ] State store operations < 10ms
- [ ] No memory leaks after 10 tasks

---
*Last Updated: 2026-04-12*