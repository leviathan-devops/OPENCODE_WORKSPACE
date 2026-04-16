<!-- PLAN_HASH: 31wwq0j878qh1 -->
# plugin-agent-prototype-v3: Agent Coordination Layer Build
Spider: : default
Phase: 1 [PENDING] | Updated: 2026-04-03T16:21:24.137Z

---
## Phase 1: Setup: Copy v2 to v3, apply fixes [PENDING]
- [ ] 1.1: Copy plugin [SMALL]
- [ ] 1.2: Apply FIX 2 (atomic write pattern) to persistence layer [SMALL] [SMALL] (depends: 1.1)
- [ ] 1.3: Apply FIX 4 (composeHandlers filter undefined) [SMALL] [SMALL] (depends: 1.1)
- [ ] 1.4: Apply FIX 5 (Zod v4 warning in package.json) [SMALL] [SMALL] (depends: 1.1)

---
## Phase 2: Phase 1: Core Types & Utils [PENDING]
- [ ] 2.1: Create src/coordination/types.ts with all shared types [MEDIUM]
- [ ] 2.2: Create src/coordination/utils.ts with randomId and helpers [SMALL] [SMALL] (depends: 2.1)

---
## Phase 3: Phase 2-4: Registry, Delegation, State Machine [PENDING]
- [ ] 3.1: Create src/coordination/registry.ts [SMALL]
- [ ] 3.2: Create src/coordination/delegation.ts [SMALL]
- [ ] 3.3: Create src/coordination/state [SMALL]

---
## Phase 4: Phase 5: Persistence Layer (FIX 7: split swarm-state) [PENDING]
- [ ] 4.1: Create src/coordination/persistence/plan [SMALL]
- [ ] 4.2: Create src/coordination/persistence/evidence [SMALL]
- [ ] 4.3: Create src/coordination/persistence/checkpoint [SMALL]
- [ ] 4.4: Create src/coordination/persistence/swarm [SMALL]
- [ ] 4.5: Create src/coordination/persistence/index.ts [SMALL]

---
## Phase 5: Phase 6: Enforcement Hooks [PENDING]
- [ ] 5.1: Create src/coordination/hooks/gate [SMALL]
- [ ] 5.2: Create src/coordination/hooks/guardrail [SMALL]
- [ ] 5.3: Create src/coordination/hooks/slop [SMALL]
- [ ] 5.4: Create src/coordination/hooks/brainstorm [SMALL]
- [ ] 5.5: Create src/coordination/hooks/index.ts with composeHandlers [SMALL] [SMALL] (depends: 5.4)

---
## Phase 6: Phase 7: Coordination Tools (FIX 3: ToolContext) [PENDING]
- [ ] 6.1: Create src/coordination/tools/delegate.ts [SMALL]
- [ ] 6.2: Create src/coordination/tools/checkpoint.ts, phase [SMALL]
- [ ] 6.3: Create src/coordination/tools/index.ts [SMALL]

---
## Phase 7: Phase 8-9: Commands, Clusters, Brains [PENDING]
- [ ] 7.1: Create src/coordination/commands/registry.ts and index.ts [SMALL] [SMALL] (depends: 6.3)
- [ ] 7.2: Create src/clusters/ [SMALL]
- [ ] 7.3: Create src/brains/ [SMALL]

---
## Phase 8: Phase 10-12: Main Export, Config, Entry Point [PENDING]
- [ ] 8.1: Create src/coordination/index.ts [SMALL]
- [ ] 8.2: Update src/config/ [SMALL]
- [ ] 8.3: Update src/index.ts [SMALL]

---
## Phase 9: Phase 13: Tests & Docs (FIX 6: 8 test files) [PENDING]
- [ ] 9.1: Create tests/unit/coordination/ [SMALL]
- [ ] 9.2: Create tests/unit/hooks/ [SMALL]
- [ ] 9.3: Create tests/unit/persistence/ [SMALL]
- [ ] 9.4: Copy AGENT_COORDINATION_LAYER.md to docs/COORDINATION_LAYER_SPEC.md [SMALL] [SMALL] (depends: 9.3)
- [ ] 9.5: Update README.md for v3 [SMALL] [SMALL] (depends: 9.4)

---
## Phase 10: Final Verification [PENDING]
- [ ] 10.1: TypeScript compilation check [SMALL]
- [ ] 10.2: Run all 8 Vitest tests [SMALL]
- [ ] 10.3: Build with bun [SMALL]
