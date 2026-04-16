# Deep Planning Mode

**Version:** 1.0.0  
**Type:** Planning/Analysis Mode for OpenCode  
**Based On:** Trident Brain v3.0 Architecture

Comprehensive multi-phase planning for complex engineering tasks.

---

## Quick Start

```bash
# Install dependencies
npm install

# Build
npm run build

# Deploy
npm run deploy

# Test
npm test
```

---

## Commands

| Command | Action |
|---------|--------|
| `plan this` | Start deep planning analysis |
| `deep plan <task>` | Analyze specific task deeply |
| `analyze deps` | Map dependencies only |
| `what could go wrong` | Risk analysis mode |
| `checkpoint` | Create milestone checkpoint |
| `validate plan` | Verify plan completeness |
| `constraints` | Show constraint analysis |
| `dependencies` | Show full dependency graph |

---

## Architecture

```
src/
├── index.ts           # Plugin entry, hooks, commands
├── planning-core.ts   # Core logic (dependency graph, risk scoring)
├── types.ts          # TypeScript types
context-library/
├── patterns.ts       # Regex pattern definitions
├── lessons.ts        # Lessons learned (from Trident v3.0)
├── templates.ts      # Plan generation templates
└── types.ts          # Shared types
```

---

## Pattern Categories

- **REQUIREMENT_PATTERNS**: User needs, constraints, deliverables
- **DEPENDENCY_PATTERNS**: File, API, service, human dependencies
- **RISK_PATTERNS**: Failure modes, blockers, uncertainties
- **CHECKPOINT_PATTERNS**: Milestones, deliverables, timeline
- **CONSTRAINT_PATTERNS**: Time, scope, resource constraints

---

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- patterns.test.ts
```

---

## Pre-Ship Checklist

- [ ] `npm run build` completes clean (0 errors)
- [ ] `npm test` passes (7/7 mechanical tests)
- [ ] No console.log in production code
- [ ] Patterns tested with real code samples
- [ ] SafetyCount on all regex loops
- [ ] Global flag ensured for all regex
- [ ] Documentation complete

---

## Key Implementation Rules

1. **Model ONLY reads** - no behavioral AI decisions
2. **ALL detection is algorithmic** - regex patterns only
3. **Every loop needs safetyCount** - prevent hangs
4. **Regex MUST have global flag** - prevent duplicates
5. **No console.log** - use output.blockReason
6. **Tool enforcement** - block edit/write/bash during planning
7. **Plans are documentation** - never execution
8. **Plans must be actionable** - each step verifiable
9. **Dependency graphs must be acyclic** - detect circular
10. **Plans must have rollback** - each step

---

## Based On

Built following the [MODE_BUILDING_PROCESS.md](../../Trident%20Brain/Code%20Review%20Mode/Overview/MODE_BUILDING_PROCESS.md) template derived from Trident Brain v3.0 development experience.

## License

MIT
