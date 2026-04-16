# CHANGELOG — KRAKEN AGENT v2.0

## v2.0 (2026-04-14)

### Major Changes

- **Complete Architecture Rewrite** from v1.1
- **3 Clusters** configured (alpha, beta, gamma)
- **11 Agents** registered
- **Full Hive Mind Integration** with read/write/search/inject
- **Real Docker Container Spawning** via Python wrappers

### Bug Fixes

| # | Bug | Fix |
|---|-----|-----|
| 1 | Zod schema error | Removed unused standalone schemas (`spawnClusterTaskSchema`, etc.) |
| 2 | Agent routing | Added agentType filter in `getAvailableAgents()` |
| 3 | Wrapper paths | Runtime-resolved using `process.env.HOME` |

### Milestone History

| Milestone | Status | Description |
|-----------|--------|-------------|
| 1 | ✅ | Container infrastructure working |
| 2 | ✅ | Wrapper spawning verified |
| 3 | ✅ | Cluster orchestration functional |
| 4 | ✅ | Real container spawning verified |
| 5 | ✅ | Kraken plugin loads (11 agents, 3 clusters) |
| 6 | ✅ | Real container spawning via docker ps |
| 7c | ✅ | Zod schema fix verified in container TUI |

### Components

| Component | Version | Size |
|-----------|---------|------|
| kraken-agent | 2.0 | 526KB |
| subagent-manager | 1.0 | 966KB |
| shark-agent | 4.8.3 | 569KB |
| manta-agent | 1.3.5 | 158KB |

---

## v1.1 (2026-04-13)

### Bug Fixes

- Agent routing fix (shark → shark, manta → manta)
- Plugin load path fix
- `run_parallel_tasks` crash fix (null bytes)
- Python 3.9 compatibility
- Bun `__dirname` hardcoding fix

---

## v1.0 (2026-04-12)

### Initial Release

- Basic cluster orchestration
- Shark and Manta agent spawning
- Docker container support