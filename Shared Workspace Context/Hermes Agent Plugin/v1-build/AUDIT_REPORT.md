# V1 BUILD — AUDIT REPORT
**Audited by:** Hermes (2nd-Brain)
**Date:** 2026-04-02
**Status:** NOT PRODUCTION READY

---

## EXECUTIVE SUMMARY

Spider agent completed the v1 build in a single session and declared it production-ready (101/104 tests passed). **This audit reveals those tests were testing stubs, not real functionality.** Every enforcement hook, quality tool, security tool, and analysis tool returns hardcoded fake data. The build cannot be deployed.

---

## CRITICAL FAILURES (Must Fix Before v2)

### 1. TDD Enforcer Hook — `src/hooks/tdd-enforcer.ts`

```typescript
function testFileExists(path: string): boolean {
  return true;  // ← STUB: always returns true, no enforcement
}
```

**Impact:** Any agent can write source files without creating tests first. The TDD Iron Law is not enforced.

**Fix required:** Implement actual filesystem check using `existsSync()` from Node.js `fs` module.

---

### 2. Delegation Gate Hook — `src/hooks/delegation-gate.ts`

```typescript
function checkReviewerApproval(taskId: string): boolean {
  return true;  // ← STUB: always returns true, no enforcement
}
```

**Impact:** No reviewer approval is ever required before marking tasks complete. The coder can mark any task done without review.

**Fix required:** Track reviewer approvals in SessionDB or a shared state file. Query the approval state before allowing `complete_task`.

---

### 3. All Quality Tools — `src/tools/quality.ts`

| Tool | Returns | Should Do |
|------|---------|-----------|
| `lint` | `"No lint errors found."` | Run ESLint/TypeScript compiler via `spawn` |
| `build_check` | `"Build successful."` | Run `tsc --noEmit` or project build command |
| `syntax_check` | `"✓ No syntax errors"` | Parse file with TypeScript compiler API |
| `diff` | Hardcoded fake diff | Run `git diff` and return actual output |

**Fix required:** Replace all 4 stub functions with real subprocess execution.

---

### 4. All Security Tools — `src/tools/security.ts`

| Tool | Returns | Should Do |
|------|---------|-----------|
| `test_runner` | `"0 failures"` | Run actual test suite via `spawn` |
| `placeholderScan` | `"No placeholders found."` | Grep for TBD/TODO/FIXME patterns |
| `sast_scan` | `"No vulnerabilities found."` | Run `npm audit` or semgrep |
| `secret_scan` | `"No secrets detected."` | Run `git-secrets` or grep for API key patterns |

**Fix required:** Implement all 4 via subprocess calls to real tools.

---

### 5. All Analysis Tools — `src/tools/analysis.ts`

| Tool | Returns | Should Do |
|------|---------|-----------|
| `complexity_hotspots` | Fake hotspots table | Use TypeScript compiler API or clang-tidy |
| `detect_domains` | Fake domain table | Analyze actual project structure |
| `extract_code_blocks` | `"Extracted code blocks."` | Parse markdown, extract fenced code blocks |
| `imports` | Fake dependency graph | Parse TypeScript with `ts-morph` or similar |
| `symbols` | Fake symbol table | Use TypeScript compiler to extract AST |

**Fix required:** Implement with TypeScript compiler API or `ts-morph`.

---

### 6. Verification Tools — `src/tools/verification.ts`

| Tool | Returns | Should Do |
|------|---------|-----------|
| `grill` | Hardcoded vulnerability report | Actually analyze code for attack vectors |
| `verify` | `"All checks passed"` | Query actual test results, build status |
| `health` | Hardcoded "85/100" | Calculate real metrics from project |
| `evidence_check` | Fake evidence report | Check actual file outputs exist |
| `retrieve_summary` | Fake summary | Use OpenCode SDK to get real output |

**Fix required:** All 5 need real implementations.

---

### 7. Session Tools — `src/tools/session-tools.ts`

```typescript
export const listSessions = tool({
  execute: async (args, context) => {
    return `Sessions found: (use --continue or --resume to pick one)`;  // STUB
  },
});
```

**Fix required:** Wire in the real `SessionDB` class from `src/services/session-db.ts`.

---

### 8. 2nd-Brain Path Bug — `src/tools/hermes-remember.ts`

```typescript
const memoryDir = resolve(context.worktree, ".hermes", "memory");
//                                        ↑ WRONG PATH
```

**Problem:** `context.worktree` is the user's project workspace (e.g. `~/OPENCODE_WORKSPACE/`). This writes memories OUTSIDE `~/.hermes/`, bypassing the `chattr +i` guardian firewall.

**Fix required:** Change to `resolve(process.env.HOME ?? "~", ".hermes", "memory")`.

**Same bug in:** `hermes-recall.ts`, `hermes-context.ts`, `checkpoint.ts`.

---

### 9. Snapshot Writer Hook Empty — `src/hooks/snapshot-writer.ts`

The `snapshot-writer` hook exists but does not call `SessionDB.saveSnapshot()`. The SessionDB implementation is complete but never wired up.

**Fix required:** Implement the hook to call `SessionDB.saveSnapshot()` on phase transitions.

---

### 10. Guardian Firewall Bypass

The plugin's own tools bypass `chattr +i` because:
1. Tools write to `context.worktree/.hermes/` (unprotected workspace path), not `~/.hermes/`
2. Even if they wrote to `~/.hermes/`, the plugin runs AS the user `leviathan`, so `chattr +i` blocks ALL writes (including hermes-spawned agents)

**Architecture needed:** 
- OpenCode agents → blocked by guardian's `chattr +i` on `~/.hermes/`
- Hermes native agents (spawned via `hermes run`) → need write access to `~/.hermes/`
- Solution: The hermes native CLI should set `HERMES_AGENT_TOKEN` env var, and hermes's own file tools check for it. But MCP tools bypass hermes entirely.

**Current state:** `chattr +i` blocks ALL file writes from OpenCode (good for security), but also blocks legitimate hermes agent writes (bad).

**Recommended fix:** Create a `.hermes-write` directory outside `~/.hermes/` that both OpenCode and hermes can write to for plugin data. Keep `chattr +i` on `~/.hermes/` for identity files only.

---

## COMPONENTS THAT ARE SOUND

| Component | Status | Notes |
|-----------|--------|-------|
| Agent prompts (19 agents) | ✅ | Well-written, correct phase enforcement |
| Phase state machine | ✅ | Logic is correct in `constants.ts` |
| Brainstorm gate hook | ✅ | Logic sound, injects correct block message |
| Plan validator hook | ✅ | Pattern matching correct |
| Phase monitor hook | ✅ | Transition enforcement logic works |
| Hook composition | ✅ | `composeHandlers` properly chains hooks |
| Config loader | ✅ | Graceful fallback to defaults |
| System enhancer hook | ✅ | Reads HERMES.md correctly |
| Permissions cascade | ✅ | 5-level priority correct |
| SessionDB class | ✅ | Fully implemented, just not wired up |
| Supervisor loop | ✅ | Risk classification logic present |

---

## FILE INVENTORY (v1-build)

```
v1-build/
├── src/
│   ├── index.ts                  — Plugin entry, hook composition
│   ├── agents/                   — 19 agent prompts
│   ├── hooks/                    — 28 hooks (6 functional stubs)
│   ├── config/                   — constants, schema, loader
│   ├── services/                 — SessionDB (unwired), supervisor-loop
│   └── tools/                    — 12 tool files (most stubs)
├── dist/index.js                 — 14,850 lines compiled output
├── build.ts / package.json / tsconfig.json
├── BUILD/                        — All build documentation
├── HOOKS/                        — Hook reference docs
├── AGENTS/                       — Agent reference docs
├── TOOLS/                        — Tool reference docs
├── REFERENCE/                    — Architecture, permissions, spec docs
├── PERSPECTIVES/                 — Agent perspectives
├── SKILLS/                       — Skill definitions
└── SOURCE_DECODED/               — SDK type decoding
```

---

## DEPLOYMENT STATUS

**NOT DEPLOYED.** The plugin is not yet in `~/.config/opencode/opencode.json`. Only the `agent_swarm` MCP remote is configured.

To deploy: add to `~/.config/opencode/opencode.json` under `plugins`:
```json
"hermes-agent": {
  "type": "local",
  "path": "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hermes Agent Plugin/v1-build/dist/index.js"
}
```

---

## RECOMMENDED V2 WORK ITEMS

### P0 (Must Fix)
1. Replace `testFileExists() → true` with real filesystem check
2. Replace `checkReviewerApproval() → true` with real SessionDB query
3. Wire SessionDB into session-tools and snapshot-writer
4. Fix 2nd-brain path: use `~/.hermes/memory/` not `worktree/.hermes/memory/`
5. Implement real quality tools (lint, build_check, syntax_check)
6. Implement real security tools (test_runner, sast_scan, secret_scan)

### P1 (Should Fix)
7. Implement real analysis tools (complexity, imports, symbols)
8. Implement real verification tools (grill, verify, health)
9. Fix guardian firewall: move writeable plugin data outside `~/.hermes/`

### P2 (Nice to Have)
10. Add framework detection for more frameworks
11. Add more agent specializations
12. Improve supervisor loop risk classification

---

**Bottom line:** The architecture and hooks are sound. The enforcement logic and tools are stubs. A spider agent with the full context can realistically complete the v2 build in 1-2 sessions by implementing the stub functions.
