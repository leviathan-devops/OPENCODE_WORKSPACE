# Build Plan — Parallel Execution (When Tools Fixed)

## Parallel Execution Status

**CURRENTLY BROKEN:** See `DEBUG LOGS/KRAKEN_PARALLEL_EXECUTION_FAILURE_2026-04-11.md`

Tools that need fixing:
- `spawn_cluster_task` — Cluster not found
- `run_parallel_tasks` — Shim not implemented  
- `run_subagent_task` — CLI argument parsing error

## Parallel Build Strategy

When parallel execution is restored, use this cluster architecture:

### Cluster: `shark-firewall-build`

| Task ID | Agent | Layer | Patterns | Files |
|---------|-------|-------|----------|-------|
| 1 | shark-alpha-1 | L0-L2 | 18+13=31 patterns | guardian-hook.ts |
| 2 | shark-alpha-2 | L3-L4 | 12+5=17 patterns | guardian-hook.ts |
| 3 | shark-beta-1 | L5.1-L5.5 | 13+16+15+12+11=67 patterns | guardian-hook.ts |
| 4 | shark-beta-2 | L5.6-L5.10 | 12+10+12+9+12=55 patterns | guardian-hook.ts |
| 5 | shark-gamma-1 | L6-L7 + Checkpoint | Guardian enhancements | guardian.ts, checkpoint-guardian.ts |
| 6 | Integration | All layers | Merge + verify | guardian-hook.ts |
| 7 | Testing | Container test | Ship gate | Full system |

## Sequential Fallback Plan

If parallel execution remains broken, execute sequentially:

### Phase 1: L0-L4 Patterns
1. Implement L0 identity wall (verify existing)
2. Add L1 theatrical patterns (18)
3. Add L2 fake test patterns (13)
4. Add L3 source inspection patterns (12)
5. Add L4 wrong container patterns (5)
6. Test each layer before proceeding

### Phase 2: L5.1-L5.5
1. Add L5.1 host fallback (13)
2. Add L5.2 success claim + evidence (16)
3. Add L5.3 model restriction (15)
4. Add L5.4 mock/stub + evidence (12)
5. Add L5.5 simplification (11)
6. Test evidence gating

### Phase 3: L5.6-L5.10
1. Add L5.6 confusion pretense (12)
2. Add L5.7 scope creep + cross-agent (10)
3. Add L5.8 undermining (12)
4. Add L5.9 impatience (9)
5. Add L5.10 self-reference (12)

### Phase 4: L6-L8 + Checkpoint
1. Enhance L6 local file protection (blocking, not advisory)
2. Implement L7 verification gate evidence
3. Create CheckpointGuardian class
4. Test scope containment

### Phase 5: Integration
1. Merge all patterns into guardian-hook.ts
2. Ensure no duplicate/conflicting patterns
3. Verify v4.7-hotfix-v3 micro-architecture preserved
4. Build and test

### Phase 6: Container Testing
1. Build: `bun build src/index.ts --outdir dist --target bun --format esm --bundle`
2. Deploy to plugins folder
3. Run host test: `opencode run "shark-status" --agent shark`
4. Run container test
5. Run shark-test-runner
6. Verify evidence collection

## Implementation Commands

### Build
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4
bun build src/index.ts --outdir dist --target bun --format esm --bundle
```

### Deploy
```bash
cp dist/index.js ~/.config/opencode/plugins/shark-agent-v4/dist/
```

### Host Test
```bash
opencode run "shark-status" --agent shark
```

### Container Test
```bash
docker run --rm \
  -v "$HOME/.config/opencode:/root/.config/opencode" \
  opencode-test:1.4.3 \
  --entrypoint /bin/bash \
  -c "cd /root && opencode run 'shark-status' --agent shark"
```

### Full Test Suite
```bash
opencode run "shark-test-runner" --agent shark
```

## Success Criteria

| Gate | Criteria | Evidence |
|------|----------|----------|
| plan | SPEC.md, scope defined | project-spec.json |
| build | Files match spec | FileManifest.json |
| test | passRate >= 0.96 | TestResults.xml |
| verify | SPEC alignment | VerificationReport.json |
| audit | SAST clean | SASTReport.json |
| delivery | Container test passed | ContainerTestResult.json |

## Checkpoint Schedule

Create checkpoints at:
1. After L0-L4 patterns working
2. After L5.1-L5.5 patterns working
3. After L5.6-L5.10 + Checkpoint Guardian working
4. After full integration + container test passed

## Risk Mitigation

### Risk: Memory Bloat
- **Mitigation:** Follow v4.7-hotfix-v3 micro-architecture
- **Test:** Monitor `process.memoryUsage()` before/after

### Risk: False Positives  
- **Mitigation:** Only check toolArgs, not agentMessage
- **Test:** Run full test suite, verify no blocks on legitimate work

### Risk: Pattern Conflicts
- **Mitigation:** Each layer tested independently before integration
- **Test:** Unit tests for each pattern set

## Debug Locations

- Build logs: `.shark/evidence/{gate}/`
- Iteration logs: `.shark/iterations/{iteration}/debug-logs/`
- Checkpoints: `.checkpoints/{name}/`
- Debug output: `/home/leviathan/OPENCODE_WORKSPACE/DEBUG LOGS/`
