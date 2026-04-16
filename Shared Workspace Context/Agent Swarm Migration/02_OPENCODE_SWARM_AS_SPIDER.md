# OpenCode-Swarm as Production-Grade Spider Agent

**Version:** 6.41.3  
**Classification:** Existing spider-swarm plugin (becomes Spider Agent V4)  
**Purpose:** Definitive record of Spider systems that already exist in the swarm plugin

---

## 1. What OpenCode-Swarm IS

OpenCode-Swarm is a production-grade multi-agent orchestration plugin for OpenCode. It implements the core Spider Agent philosophy — mechanical enforcement over simulation — but through a **multi-agent architecture** rather than a single-agent-with-firewalls approach.

**Location:** `/home/leviathan/.npm-global/lib/node_modules/spider-swarm/`  
**Package:** `spider-swarm` v6.41.3  
**Repository:** https://github.com/zaxbysauce/spider-swarm

**Key Distinction from Original Spider:**
- Original Spider (V0-V3): Single agent with 9 firewalls enforcing behavior
- OpenCode-Swarm (V4): 9 specialized agents with runtime-enforced quality gates

---

## 2. Multi-Brain Architecture (9 Specialized Agents)

### Agent Roles
| Agent | Role | Purpose |
|---|---|---|
| **architect** | Orchestrator | Plans, delegates, coordinates. Human-in-the-loop |
| **coder** | Implementation | Writes code, creates files, implements features |
| **reviewer** | Quality | Reviews code for correctness, security, style |
| **test_engineer** | Verification | Writes and runs tests, adversarial testing |
| **explorer** | Discovery | Scans codebase, finds files, understands structure |
| **sme** | Domain Expert | Subject matter expertise on specific domains |
| **critic** | Plan Review | Reviews entire plan before execution |
| **docs** | Documentation | Updates README, API docs, guides |
| **designer** | UI/UX | Visual layout, component design |

### Model Assignment (Current)
Each agent gets its own model — no sharing, no contention:
- architect → Qwen 3.6 Plus Free (128K, via OpenCode Zen)
- coder → GLM-5 (128K, reasoning enabled)
- reviewer → MiniMax M2.7-highspeed (200K)
- test_engineer → MiniMax M2.7 (200K, reasoning enabled)
- explorer → OmniCoder 9B (local, 256K, llama.cpp)
- sme → DeepSeek Reasoner (128K, reasoning enabled)
- critic → Nemotron 3 Super (1M context)
- docs → Nemotron 3 Super (1M context)
- designer → MiMo V2 Omni (65K, multimodal)

---

## 3. EXECUTE Pipeline (The Brick Wall)

The swarm's execution pipeline is the production-grade equivalent of Spider's 5-step workflow:

### Phase 1: Planning
- **architect** creates structured plan (.swarm/plan.md + plan.json)
- Tasks broken into phases with dependencies
- Each task has acceptance criteria

### Phase 2: Implementation
- **coder** receives scoped file list (declare_scope)
- Writes code within authorized boundaries
- Cannot modify files outside scope

### Phase 3: Quality Gates (Runtime-Enforced)
1. **diff** — Analyze changed files, exports, interfaces
2. **syntax_check** — Verify code compiles/parses
3. **placeholder_scan** — Detect TODO/stub/mock patterns (equivalent to Spider Firewall 4: Mock Mode Detection)
4. **imports** — Verify imports resolve (equivalent to Spider Firewall 5: Theatrical Code Detection)
5. **lint** — Run project linter in check mode
6. **build_check** — Verify project builds
7. **pre_check_batch** — Run lint + secretscan + SAST + quality budget in parallel

### Phase 4: Review
- **reviewer** agent reviews all changes
- **security-reviewer** runs security scan
- Hard gate: reviewer MUST approve or coder retries

### Phase 5: Testing
- **test_engineer** generates and runs tests
- Adversarial tests for edge cases
- Coverage verification
- Hard gate: tests MUST pass

### Phase 6: Verification
- **evidence_check** — Verify all completed tasks have required evidence
- **drift verifier** — Confirm changes match plan
- **completion_verify** — Pre-check that plan identifiers exist in source files

### Phase 7: Completion
- **phase_complete** — Mark phase done, track agents dispatched
- **write_retro** — Write retrospective evidence bundle
- **checkpoint** — Save git snapshot

---

## 4. Existing Spider-Equivalent Systems

### Mock Mode Detection → placeholder_scan
- Scans for TODO, FIXME, HACK, XXX, WARN, NOTE comments
- Detects stub patterns and placeholder implementations
- Runs automatically in pre_check_batch

### Theatrical Code Detection → imports tool
- Checks for unused exports
- Verifies imports actually resolve
- Catches dead code that's never called

### Guardian Path Protection → secretscan + sast_scan
- secretscan detects credential leaks, API keys, tokens
- sast_scan catches security vulnerabilities
- pre_check_batch runs both automatically as hard gates

### Anti-Hallucination → evidence_check + reviewer
- evidence_check verifies task evidence completeness
- reviewer verifies correctness of implementation
- test_engineer runs actual tests (not simulations)

### Stagnation Detection → Loop detection + retry circuit breaker
- architect_loop_detected event
- coder retry circuit breaker (3 failures → sounding board → simplify)
- max_iterations: 5 in swarm config

### AutoDebug → lint fix mode + pre_check_batch
- lint fix mode auto-corrects issues
- pre_check_batch pinpoints exact failing gate
- coder retry protocol with structured rejection reasons

### Audit Logging → telemetry.jsonl + evidence bundles
- .swarm/telemetry.jsonl for all operations
- .swarm/evidence/{task}.json per task
- .swarm/evidence/retro-{N}/evidence.json per phase
- .swarm/evidence/{phase}/drift-verifier.json per phase

### Workflow Enforcement → Hard gate enforcement
- Reviewer MUST approve (runtime-enforced)
- test_engineer MUST pass (runtime-enforced)
- pre_check_batch MUST pass gates (runtime-enforced)
- Cannot bypass — runtime hooks block coder if gates skipped

---

## 5. Artifact System

### Swarm Artifacts (Equivalent to .spider/)
| Spider Artifact | Swarm Equivalent |
|---|---|
| `.spider/plan.md` | `.swarm/plan.md` + `.swarm/plan.json` |
| `.spider/claims.json` | Task acceptance criteria in plan.json |
| `.spider/build-manifest.json` | Git diff + changed files list |
| `.spider/test-results/stage1.json` | test_engineer test results |
| `.spider/test-results/stage2.json` | pre_check_batch results |
| Gate results (3) | pre_check_batch (4 gates) |
| `.spider/SHIP_REPORT.md` | evidence bundle + retro |

---

## 6. Knowledge System

### Swarm Knowledge Base
- **knowledgeAdd** — Store lessons with category, tags, scope
- **knowledgeRecall** — Search for relevant past decisions
- **knowledge_query** — Query swarm or hive knowledge
- **knowledgeRemove** — Delete outdated entries
- **curator_analyze** — Run curator phase analysis

### OpenViking Memory
- **memsearch** — Semantic search across memories, resources, skills
- **memread** — Retrieve content at viking:// URIs
- **membrowse** — Browse filesystem structure
- **memcommit** — Commit session to persistent memory

### Hive Mind
- **hive_context** — Search shared memory
- **hive_status** — Check connection health
- **hive_remember** — Save context to shared memory

---

## 7. Communication System

### MCP Tools (50+ tools via agent-swarm API)
- Task management: send, poll, claim, release, accept, reject, cancel
- Swarm coordination: join, list agents, update profile
- Memory: search, retrieve, inject learning
- Messaging: post, read, list channels, create/delete channels
- Workflows: create, list, trigger, retry, cancel, human input
- Scheduling: create, list, update, delete, run now
- Services: register, unregister, list, update status
- Context: history, diff

---

## 8. What Makes This Production-Grade

1. **Runtime enforcement** — Not prompt-based, actual code gates
2. **Multi-agent isolation** — Each agent in separate context
3. **Scope containment** — declare_scope restricts file access
4. **Evidence-based** — Every task requires proof of completion
5. **Retry circuit breakers** — Automatic escalation on failure
6. **Adversarial testing** — Tests designed to break code, not just verify
7. **Security scanning** — secretscan + SAST as hard gates
8. **Drift verification** — Confirms changes match plan
9. **Phase retrospectives** — Lessons learned captured per phase
10. **Checkpoint system** — Git snapshots for state recovery

---

## 9. Limitations vs Original Spider Vision

1. **No explicit Guardian zone classification** — Security gates catch dangerous ops but no explicit filesystem zone system
2. **No style guide enforcement** — Single-word naming not enforced
3. **No repo root test prevention** — Not a built-in check
4. **No documentation validation** — Theatrical docs not explicitly blocked
5. **No dual-brain routing** — Multi-agent replaces dual-brain but not identical
6. **No explicit stagnation counter** — Loop detection exists but not explicit "3 failures → switch strategy" counter
7. **No explicit anti-hallucination validators** — Evidence-based but not explicit "never claim without verifying" rules
8. **No explicit surgical debug protocol** — Retry circuit breaker exists but not the structured 6-step debug protocol
