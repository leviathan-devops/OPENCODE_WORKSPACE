# DevOps Manager — Library Index

> Navigation hub for Spider-Shark-Kraken stack project management

---

## Library Contents

| Document | Purpose | Lines |
|---------|---------|-------|
| [README.md](README.md) | System overview, component inventory, quick reference | ~350 |
| [COMPONENTS.md](COMPONENTS.md) | Deep dive into each component | ~400 |
| [PROJECT_STATUS.md](PROJECT_STATUS.md) | Deployment status, known issues, roadmap | ~200 |

---

## Quick Start

### For New Sessions

```bash
# 1. Check all services are running
ps aux | grep -E "openviking|telegram-bridge|hermes-synthesizer" | grep -v grep

# 2. Verify OpenViking
curl http://localhost:1933/health

# 3. List Hermes context libraries
ls ~/hermes-workspace/context/

# 4. Check Spider Agent
opencode --agent spider "status"
```

### Read Order by Role

| Role | Start With | Then |
|------|------------|------|
| Project Manager | README.md | COMPONENTS.md |
| Developer | README.md | See relevant component |
| DevOps | PROJECT_STATUS.md | README.md |
| New to Stack | README.md (System Overview) | COMPONENTS.md (Spider Agent) |

---

## System Architecture (Summary)

```
Leviathan (Human)
     │
     ├── Telegram ──► Hermes Gateway ──► 2nd-Brain Profile
     │                                    │
     │                                    └── hermes-synthesizer.py (daemon)
     │
     └── OpenCode CLI
              │
              ├── spider ──► spider-agent plugin ──► Hive Mind
              ├── shark ──► shark-agent plugin ──► Guardian Firewall
              └── kraken ──► kraken-hive-engine ──► Sisyphus/Hephaestus
```

---

## Key Metrics

| Component | Status | Health |
|-----------|--------|--------|
| OpenViking Server | Running | `curl localhost:1933/health` |
| Hermes Gateway | Running | `ps aux \| grep telegram-bridge` |
| Hermes Synthesizer | Running (PID 146793) | `pgrep -f hermes-synthesizer` |
| Spider Agent Plugin | Installed | `ls ~/.config/opencode/plugins/spider*` |

---

## Active Workstreams

1. **Context Library Consolidation** — DevOps Manager absorbing all contexts
2. **Hive Mind Integration** — Phase 1 infrastructure complete
3. **Algorithmic Systems** — Reference library for mechanical AI systems

---

## Related Libraries

| Library | Location | Purpose |
|---------|----------|---------|
| Algorithmic Systems | `algorithmic-systems/library/` | Mechanical AI reference |
| Spider Agent | `Spider Agent/CONTEXT_LIBRARY.md` | Spider full context |
| Hive Mind | `Hive Mind Integration/` | Hive Mind integration docs |
| Hermes | `hermes-workspace/context/telegram/` | Hermes context |

---

## DevOps Manager Profiles

This context library supports the `devops-manager` profile which handles:

- Project management across Spider-Shark-Kraken stack
- Service health monitoring
- Build orchestration
- Integration coordination
- Context library maintenance

---

*Last updated: 2026-04-02 20:15*
*Role: DevOps Manager (Project Orchestration)*
