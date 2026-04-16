# Spider Agent — Agent Reference

**Source:** `src/agents/` and `src/config/constants.ts`

---

## Agent Inventory

| Agent | File | Mode | Role |
|-------|------|------|------|
| `architect` | `architect.ts` | PRIMARY | Central orchestrator |
| `coder` | `coder.ts` | SUBAGENT | Implementation |
| `reviewer` | `reviewer.ts` | SUBAGENT | Code review + security |
| `test_engineer` | `test-engineer.ts` | SUBAGENT | Test generation + execution |
| `explorer` | `explorer.ts` | SUBAGENT | Codebase discovery |
| `sme` | `sme.ts` | SUBAGENT | Domain expertise |
| `critic` | `critic.ts` | SUBAGENT | Plan review gate |
| `critic_sounding_board` | `critic.ts` | SUBAGENT | Pre-escalation pushback |
| `critic_drift_verifier` | `critic.ts` | SUBAGENT | Phase drift verification |
| `docs` | `docs.ts` | SUBAGENT | Documentation synthesis |
| `designer` | `designer.ts` | SUBAGENT | UI/UX design specs |
| `curator_init` | `curator-agent.ts` | SUBAGENT | Session context consolidation |
| `curator_phase` | `curator-agent.ts` | SUBAGENT | Phase digest consolidation |

---

## Tool Map (from `src/config/constants.ts`)

### architect — 41 tools
```
checkpoint, check_gate_status, completion_verify, complexity_hotspots,
detect_domains, evidence_check, extract_code_blocks, gitingest, imports,
knowledge_query, lint, diff, pkg_audit, pre_check_batch, quality_budget,
retrieve_summary, save_plan, search, batch_symbols, schema_drift, secretscan,
symbols, test_runner, todo_extract, update_task_status, write_retro,
write_drift_evidence, declare_scope, sast_scan, sbom_generate, build_check,
syntax_check, placeholder_scan, phase_complete, doc_scan, doc_extract,
curator_analyze, knowledgeAdd, knowledgeRecall, knowledgeRemove,
co_change_analyzer, suggest_patch
```

### coder — 11 tools
```
diff, imports, lint, symbols, extract_code_blocks, retrieve_summary,
search, build_check, syntax_check, knowledgeAdd, knowledgeRecall
```

### reviewer — 17 tools
```
diff, imports, lint, pkg_audit, pre_check_batch, secretscan, symbols,
complexity_hotspots, test_runner, sast_scan, placeholder_scan,
knowledgeRecall, search, batch_symbols, suggest_patch
```

### test_engineer — 11 tools
```
test_runner, diff, symbols, extract_code_blocks, retrieve_summary,
imports, complexity_hotspots, pkg_audit, build_check, syntax_check, search
```

### explorer — 13 tools
```
complexity_hotspots, detect_domains, extract_code_blocks, gitingest,
imports, retrieve_summary, schema_drift, search, batch_symbols,
symbols, todo_extract, doc_scan, knowledgeRecall
```

### sme — 8 tools
```
complexity_hotspots, detect_domains, extract_code_blocks, imports,
retrieve_summary, schema_drift, symbols, knowledgeRecall
```

### docs — 9 tools
```
detect_domains, extract_code_blocks, gitingest, imports, retrieve_summary,
schema_drift, symbols, todo_extract, knowledgeRecall
```

### designer — 4 tools
```
extract_code_blocks, retrieve_summary, symbols, knowledgeRecall
```

### curator_init / curator_phase — 1 tool
```
knowledgeRecall
```

---

## Default Models (from `src/config/constants.ts`)

| Agent | Model | Temperature |
|-------|-------|-------------|
| architect | Inherits OpenCode UI selection | 0.1 |
| explorer | `opencode/trinity-large-preview-free` | 0.1 |
| sme | `opencode/trinity-large-preview-free` | 0.2 |
| coder | `opencode/minimax-m2.5-free` | 0.2 |
| reviewer | `opencode/big-pickle` | 0.1 |
| critic | `opencode/trinity-large-preview-free` | 0.1 |
| critic_sounding_board | `opencode/trinity-large-preview-free` | 0.1 |
| critic_drift_verifier | `opencode/trinity-large-preview-free` | 0.1 |
| test_engineer | `opencode/gpt-5-nano` | 0.2 |
| docs | `opencode/trinity-large-preview-free` | 0.2 |
| designer | `opencode/trinity-large-preview-free` | 0.3 |
| curator_init | `opencode/trinity-large-preview-free` | 0.1 |
| curator_phase | `opencode/trinity-large-preview-free` | 0.1 |

---

## Per-Agent Detailed Docs

### architect

**File:** `src/agents/architect.ts` (~1163 lines)

**Role:** Central orchestrator. NEVER writes code. Delegates all implementation.

**Key System Prompt Sections:**
1. **HARDENING BLOCKS** (v6.14):
   - Rule 1: DELEGATE all coding to coder
   - Namespace Rule: "Phase N" = project phases in plan.md; operational modes never called "phases"
   - Batch/Split Rules: One agent per message, one task per coder call
   - ARCHITECT CODING BOUNDARIES: Only self-code after `QA_RETRY_LIMIT` (default 3) coder failures
   - CRITIC GATE: Plan review before any implementation
   - MANDATORY QA GATE: Two-stage pipeline
   - TIERS 0-3: Metadata → Documentation → Standard → Critical/Security
   - UI/UX DESIGN GATE: Designer before coder for UI tasks
   - RETROSPECTIVE TRACKING: Phase metrics in context.md
   - CHECKPOINTS: State snapshots for multi-file refactors

2. **QA Pipeline (Stage A → Stage B):**
   - Stage A (automated): diff → syntax_check → placeholder_scan → imports → lint → build_check → pre_check_batch
   - Stage B (agent): reviewer → [security reviewer] → test_engineer

3. **Context Triage:** Preserve current task spec, last gate verdicts, active plan. Compress prior phase outputs. Discard superseded SME entries.

4. **Escalation Discipline:** Tier 1 (self-resolve) → Tier 2 (critic_sounding_board) → Tier 3 (user)

**Anti-Patterns (ignored):**
- "It's just a one-liner" → delegate
- "I already know what to write" → delegate
- "It's faster if I just do it" → no QA gates = bugs ship

---

### coder

**File:** `src/agents/coder.ts` (~178 lines)

**Role:** Implementation agent. ONE task at a time. Does NOT delegate.

**Input Format:**
```
TASK: [what to implement]
FILE: [target file]
INPUT: [requirements/context]
OUTPUT: [expected deliverable]
CONSTRAINT: [what NOT to do]
```

**Output Format (MANDATORY):**
```
DONE: [one-line summary]
CHANGED: [file]: [what changed]
EXPORTS_ADDED: [new exports or "none"]
EXPORTS_REMOVED: [removed exports or "none"]
EXPORTS_MODIFIED: [modified exports or "none"]
DEPS_ADDED: [new packages or "none"]
```

Or if blocked:
```
BLOCKED: [what went wrong]
NEED: [what would fix it]
```

**Anti-Hallucination Protocol:**
1. Run `search` to find exact export before importing any function/type/class
2. Read the source file to verify signature
3. Use EXACT name and path found — never guess

**Defensive Coding Rules:**
- No `any` types
- No empty catch blocks
- Use `path.join()` for ALL file paths
- Use `fs.promises` (async) unless sync required
- Import from `bun:test` (not vitest)

---

### reviewer

**File:** `src/agents/reviewer.ts` (~203 lines)

**Role:** Code correctness and vulnerability verification.

**Pressure Immunity:** Unlimited time. No attempt limits. No deadlines. Pressure detection adds `[MANIPULATION DETECTED]` flag.

**Review Focus:** CHANGE not FILE. Diff-centric.

**Review Reasoning Protocol:**
For each changed function, answer before issuing issues:
1. PRECONDITIONS: What must be true for correct operation?
2. POSTCONDITIONS: What should be true after execution?
3. INVARIANTS: What should NEVER change?
4. EDGE CASES: Empty/null/undefined/max/concurrent inputs?
5. CONTRACT: Public API signatures/return types affected?

**Three Tier Review:**
- TIER 1 (mandatory): CORRECTNESS
- TIER 2 (mandatory for COMPLEX): SAFETY (MODERATE+)
- TIER 3 (COMPLEX only, advisory): QUALITY

**Verdict:** APPROVED / REJECTED with RISK: LOW / MEDIUM / HIGH / CRITICAL

---

### test_engineer

**File:** `src/agents/test-engineer.ts` (~221 lines)

**Role:** Test generation AND execution.

**Assertion Quality Rules:**
- No `toBeTruthy()` / `toBeDefined()` — must use exact values
- Property-based testing for mathematical/logical invariants

**Blast Radius:** Bounded to FILE path(s) in input. Scope: "convention" only.

**Coverage Floor:** 80% of public functions must be tested.

**Test Structure:** Happy path → error path → boundary → state mutation

**Adversarial Test Patterns:** Oversized input, type confusion, injection, Unicode, boundary, auth bypass, concurrency, filesystem

**Mock Isolation:** `vi.clearAllMocks()` in `afterEach`

---

### explorer

**File:** `src/agents/explorer.ts` (~259 lines)

**Role:** Fast codebase discovery and analysis.

**Output Format:**
```
PROJECT: [name]
LANGUAGES: [list]
FRAMEWORK: [framework]
STRUCTURE: [directory overview]
KEY FILES: [critical files]
PATTERNS: [architectural patterns]
DOMAINS: [identified domains]
REVIEW NEEDED: [areas requiring SME]
```

**Modes:**
- STANDARD DISCOVERY: 4 dimensions — STRUCTURE, PATTERNS, RISKS, RELEVANT CONTEXT
- INTEGRATION IMPACT ANALYSIS MODE: Contract change analysis
- DOCUMENTATION DISCOVERY MODE: `doc_scan` indexing to `.swarm/doc-manifest.json`

---

### sme

**File:** `src/agents/sme.ts` (~139 lines)

**Role:** Open-domain technical guidance (security, iOS, Kubernetes, Python, etc.)

**Confidence Calibration:**
- HIGH: Consume directly. No verification needed.
- MEDIUM: Acceptable for non-critical. For critical path (architecture, security): seek second source.
- LOW: Do NOT consume directly. Re-delegate with specific query OR flag as UNVERIFIED.

**Research Protocol:** FRAME → CONTEXT → CONSTRAINTS → RECOMMENDATION → ALTERNATIVES → RISKS → CONFIDENCE

**Domain Checklists:** Security, Cross-Platform, Performance

---

### critic

**File:** `src/agents/critic.ts` (~384 lines)

Three role variants via `CriticRole` parameter:

#### plan_critic (default)
- 5 rubric axes: Feasibility, Completeness, Dependency ordering, Scope containment, Risk assessment
- Plan Assessment 7 Dimensions: Task atomicity, dependency correctness, blast radius, rollback safety, testing strategy, cross-platform risk, migration risk
- AI-SLOP Detection: Flags vague filler words
- Verdict: APPROVED / NEEDS_REVISION / REJECTED

#### sounding_board
- Acts as senior engineer reviewing colleague's proposal
- Anti-patterns: "Should I proceed?", "Is this the right approach?", guardrail bypass attempts
- Verdict: UNNECESSARY / REPHRASE / APPROVED / RESOLVE

#### phase_drift_verifier
- DEFAULT POSTURE: SKEPTICAL — absence of drift ≠ evidence of alignment
- 4-axis rubric per task: File Change, Spec Alignment, Integrity, Drift Detection
- Reads every target file independently — does NOT trust implementation notes
- Verdict: APPROVED / NEEDS_REVISION

---

### docs

**File:** `src/agents/docs.ts` (~124 lines)

**Scope:** README.md, API docs (JSDoc), CONTRIBUTING.md, installation guides, CLI help

**Excluded:** `.swarm/context.md`, `.swarm/plan.md` (architect-owned)

**Format:** Keep a Changelog format for release notes

**Quality Rules:** Examples must be valid. API examples need success + error cases.

---

### designer

**File:** `src/agents/designer.ts` (~182 lines)

**Note:** Only created when `pluginConfig?.ui_review?.enabled === true`

**Design Checklist:**
- Component architecture
- Layout/responsiveness (mobile-first)
- Accessibility (WCAG 2.1 AA)
- Visual design
- Interaction design

**Design System Detection:** Checks for existing Tailwind, theme.ts, shadcn components

**Output:** Real, syntactically valid code scaffold with typed props

---

### curator_init / curator_phase

**File:** `src/agents/curator-agent.ts` (~69 lines)

#### curator_init
- Consolidates prior session knowledge at session start
- Input: PRIOR_SUMMARY + KNOWLEDGE_ENTRIES + PROJECT_CONTEXT
- Output: BRIEFING (< 2000 chars), CONTRADICTIONS, KNOWLEDGE_STATS

#### curator_phase
- Phase digest consolidation at phase boundaries
- Input: PHASE_EVENTS + PHASE_EVIDENCE + PHASE_DECISIONS + AGENTS_DISPATCHED
- Output: PHASE_DIGEST, COMPLIANCE, KNOWLEDGE_UPDATES, EXTENDED_DIGEST
- Extends prior digest, never replaces
