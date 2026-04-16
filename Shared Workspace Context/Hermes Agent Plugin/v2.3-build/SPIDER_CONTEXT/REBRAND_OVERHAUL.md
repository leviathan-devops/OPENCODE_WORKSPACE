# Spider Agent — Production Rebrand Overhaul

**Status:** Deferred — requires source-level rebuild
**Assigned to:** Future agent session

---

## Problem

The spider-agent plugin (formerly `shark-agent-v4` / `opencode-swarm`) still contains **1115+ references** to "swarm", "Swarm", "SWARM" throughout its compiled `dist/index.js`. The surface-level rename (directory, package.json, opencode.json, orchestrator name, architect→spider) is complete, but the internal codebase retains all original terminology.

### What Was Renamed (Surface)
- Directory: `shark-agent-v4` → `spider-agent`
- Package name: `shark-agent-v4` → `spider-agent`
- Subdirectory: `opencode-swarm` → removed (was duplicate)
- Orchestrator: `architect` → `spider` (in `AGENT_AUTHORITY_RULES`, `ORCHESTRATOR_NAME`, agent profiles)
- Config: `opencode.json` plugin list updated
- Docker files: `Dockerfile.shark-worker` → `Dockerfile.spider-worker`
- Docs: All markdown files updated

### What Still Needs Renaming (Deep)
- **1115+ references** in `dist/index.js`: `SwarmConfigSchema`, `KNOWN_SWARM_PREFIXES`, `SwarmError`, `swarmState`, `stripKnownSwarmPrefix`, etc.
- Variable names: `swarmState`, `swarmDir`, `swarm_max_entries`, `KNOWN_SWARM_PREFIXES`
- Schema names: `SwarmConfigSchema`, `SwarmConfigSchema`
- Error classes: `SwarmError`
- Config keys: `swarm_mode`, `swarm_max_entries`, `swarms`
- Log prefixes: `[SWARM HINT]`, `[SWARM CONTEXT]`, `[SWARM AGENT CONTEXT]`, `[SWARM CONFIG]`
- Function names: `stripKnownSwarmPrefix`, `ensureSwarmSession`, `initSwarmState`
- File paths: `.swarm/` directory references (these should stay as-is — it's the actual directory name on disk)
- CLI commands: `/swarm plan`, `/swarm status`, etc.

---

## Why This Can't Be Done With sed

1. **Compiled bundle** — The `dist/index.js` is a 68K-line bundled output. String replacement would break:
   - Schema validation keys (e.g., `SwarmConfigSchema` is referenced by name)
   - Export declarations (e.g., `SwarmConfigSchema: () => SwarmConfigSchema`)
   - String literals used as config keys (e.g., `"swarm_mode"`, `"swarm_max_entries"`)
   - Event names (e.g., `"swarm_state_change"`)

2. **Config file compatibility** — Existing `opencode-swarm.json` configs in projects use `swarm` keys. Renaming would break all existing deployments.

3. **`.swarm/` directory** — This is the actual on-disk directory name. Renaming it would orphan all existing session data.

---

## Required Approach

### Phase 1: Source-Level Rename
1. Locate the original TypeScript source (not in this repo — it's a compiled npm package)
2. Rename in source:
   - `SwarmConfigSchema` → `SpiderConfigSchema`
   - `SwarmError` → `SpiderError`
   - `swarmState` → `spiderState`
   - `KNOWN_SWARM_PREFIXES` → `KNOWN_SPIDER_PREFIXES`
   - All function names, variable names, log prefixes
3. Keep `.swarm/` directory path as-is (it's the on-disk convention)
4. Keep config key names as-is for backward compatibility (or add migration)
5. Rebuild: `bun run build`

### Phase 2: Config Migration
1. Add backward-compatible config key aliases in the loader
2. Migrate existing `opencode-swarm.json` → `spider-agent.json` (with alias support)
3. Update CLI commands: `/swarm plan` → `/spider plan`

### Phase 3: Testing
1. Verify all hooks work with renamed code
2. Test vanilla mode (no plan) — should be transparent
3. Test swarm mode — full workflow with renamed agent names
4. Verify `.swarm/` directory reads/writes still work
5. Test config loading with both old and new key names

### Phase 4: Deployment
1. Update `package.json` version (major bump)
2. Update all documentation
3. Update Docker files
4. Update CI/CD pipelines

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Broken schema validation | Critical | Test all config loading paths |
| Orphaned `.swarm/` data | High | Keep directory name, only rename code refs |
| Config incompatibility | High | Add backward-compatible key aliases |
| CLI command breakage | Medium | Add aliases for old commands |
| Hook pipeline breakage | Critical | Full integration test suite |

---

## Estimated Effort

- **Source rename:** 2-4 hours (TypeScript source, not dist)
- **Rebuild + test:** 2-3 hours
- **Config migration:** 1-2 hours
- **Total:** 5-9 hours

---

## Notes

- The source code is NOT in this repository. It's a separate npm package (`shark-agent-v4` / `opencode-swarm`) that was compiled and installed.
- The original source may be at `https://github.com/zaxbysauce/opencode-swarm.git` (now needs to be `spider-agent`).
- The `.swarm/` directory name should probably stay as-is — it's a well-established convention and changing it would break all existing session data.
- The `opencode-swarm.json` config file name should also be renamed to `spider-agent.json` eventually.

---

**Created:** 2026-04-01
**Priority:** Medium (functional now, cosmetic debt)
