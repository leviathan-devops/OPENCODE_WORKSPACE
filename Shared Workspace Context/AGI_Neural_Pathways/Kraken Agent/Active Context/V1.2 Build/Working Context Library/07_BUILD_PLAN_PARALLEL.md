# Build Plan — Parallel Execution

## Cluster Task Distribution

### Alpha Cluster (Steamroll)
| Task ID | Layer | Patterns | Files |
|---------|-------|----------|-------|
| 1 | L0 | Identity Wall | firewall/l0-identity.ts |
| 1 | L1 | Orchestration Theater (8) | firewall/l1-orchestration-theater.ts |
| 2 | L4 | Wrong Cluster (6) | firewall/l4-wrong-cluster.ts |

### Beta Cluster (Precision)
| Task ID | Layer | Patterns | Files |
|---------|-------|----------|-------|
| 3 | L2 | False Completion (12) | firewall/l2-false-completion.ts |
| 3 | L3 | Output Inspection (10) | firewall/l3-output-inspection.ts |
| 4 | L5.1 | Focus Collision (10) | firewall/l5-macro-derailment.ts |
| 4 | L5.2 | Planner-Executor Desync (15) | firewall/l5-macro-derailment.ts |

### Gamma Cluster (Testing)
| Task ID | Layer | Patterns | Files |
|---------|-------|----------|-------|
| 5 | L5.3 | Context Stale (10) | firewall/l5-macro-derailment.ts |
| 5 | L5.4 | Premature Completion (15) | firewall/l5-macro-derailment.ts |
| 6 | L6 | Kraken Protection (3 zones) | firewall/l6-kraken-protection.ts |
| 6 | L7 | Coordination Gates (3) | firewall/l7-coordination-gates.ts |

## Sequential Fallback Plan

If parallel execution unavailable:

### Phase 1: Shared Infrastructure
1. Implement `shared/state-store.ts`
2. Implement `shared/brain-messenger.ts`
3. Implement `shared/evidence-collector.ts`

### Phase 2: Core Brains
1. Implement Planning Brain (T2 Master + T1 Gen)
2. Implement Execution Brain (Supervisor + Override)
3. Implement System Brain (Firewall coordinator)

### Phase 3: Firewall Layers
1. L0 Identity Wall + L1 Orchestration Theater
2. L2 False Completion + L3 Output Inspection
3. L4 Wrong Cluster
4. L5 Macro Derailment (all sublayers)
5. L6 Kraken Protection
6. L7 Coordination Gates

### Phase 4: Council
1. Alpha Brain (steamroll focus)
2. Beta Brain (precision focus)
3. Gamma Brain (testing focus)

### Phase 5: Subagent Integration
1. Wire Subagent-Manager into Execution Brain
2. Implement override authority
3. Add output retrieval enforcement

### Phase 6: Integration
1. Wire all brains in index.ts
2. Test container workflow
3. Verify parallel execution

## Implementation Commands

### Build
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/kraken-agent-v1.2
bun install
bun build src/index.ts --outdir dist --target bun --format esm --bundle
```

### Deploy
```bash
cp dist/index.js ~/.config/opencode/plugins/kraken-agent-v1.2/dist/
```

### Host Test
```bash
opencode run "kraken-status" --agent kraken
```

### Container Test
```bash
docker run --rm \
  -v "$HOME/.config/opencode:/root/.config/opencode" \
  opencode-test:1.4.3 \
  --entrypoint /bin/bash \
  -c "cd /root && opencode run 'kraken-status' --agent kraken"
```

---
*Last Updated: 2026-04-12*