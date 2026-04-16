# SHARK AGENT V4 — Pattern Catalog

**Purpose:** T2 reference for recurring patterns and anti-patterns
**Usage:** Loaded on-demand via read_file, zero prompt overhead

---

## Gate Patterns

### Pattern: Gate Ghosting (Anti-Pattern)

**What it is:** Agent claims a gate passed without evidence.

**How to detect:**
- No evidence files in `.shark/evidence/{gate}/`
- Gate claimed "passed" but no test output
- No checkpoint created

**How to apply:**
- System Brain blocks and demands evidence
- Reasoning Brain synthesizes what evidence is missing
- Execution Brain produces required evidence

**Anti-pattern examples:**
- "Tests passed" with no test output file
- "Build succeeded" but no artifact
- "No secrets found" but no scan report

---

### Pattern: Context Bleed (Anti-Pattern)

**What it is:** T2 context polluting T1 in execution brain, causing hallucinations.

**How to detect:**
- Execution Brain making recommendations instead of executing
- Execution Brain second-guessing the spec
- Execution Brain "reasoning" about approach

**How to prevent (Micro):**
- Build Brain T1 explicitly says "execute only, no reasoning"
- Coordinator enforces clean context switch

**How to prevent (Macro):**
- Reasoning Brain manages T2 synthesis, not Execution
- Context injection is explicit, not implicit

---

### Pattern: Scope Creep (Anti-Pattern)

**What it is:** Build Brain implementing features not in SPEC.md.

**How to detect:**
- File created that isn't in SPEC.md
- Guardian zone violation attempted
- Feature added "because it seemed useful"

**How to apply:**
- Guardian blocks the out-of-scope operation
- System Brain flags derailment
- Plan Brain reviews if spec needs update

---

### Pattern: Parallel Race (Correct Pattern)

**What it is:** All brains working simultaneously in their own domains.

**How to apply:**
1. Execution Brain owns execution-state → writes there
2. Reasoning Brain reads execution-state → synthesizes context
3. System Brain reads all states → enforces gates
4. No brain waits for another brain's permission

**Anti-pattern (sequential):**
```
Execution waits for Reasoning to finish thinking
Reasoning waits for System to finish watching
System waits for Execution to finish working
→ All idle, no progress
```

---

### Pattern: Context Injection (Correct Pattern)

**What it is:** Reasoning Brain proactively filling Execution Brain's T1 gaps.

**How it works:**
```
1. Reasoning Brain reads execution-state
2. Notices Execution struggling (error patterns, confusion)
3. Determines what context Execution needs
4. Gets T2 from knowledge base
5. Synthesizes relevant piece
6. Injects into thinking-state
7. Execution Brain reads thinking-state
8. Continues with new context
```

---

### Pattern: Gate Barrier (Correct Pattern)

**What it is:** Gates blocking phase transitions until criteria are met.

**How it works:**
```
Phase 1 races ──────►│GATE 1│──────► Phase 2 races ──────►│GATE 2│──────►
                      │open? │                              │open? │
                      │      │                              │      │
                   BLOCKED                         BLOCKED
                   (keep                          (keep
                    racing)                        racing)
```

**Anti-pattern (no gates):**
```
Phase 1 done → Phase 2 starts immediately (even if criteria not met)
→ Defects propagate to next phase
```

---

## Guardian Patterns

### Pattern: Zone Classification

**What it is:** Classifying all paths into zones for access control.

**Zone Map:**

| Zone | Paths | Access |
|------|-------|--------|
| WORKSPACE | Project root + subdirs | Full |
| SANDBOX | Isolated test env | Full (redirected) |
| DEVELOPMENT | ~/Projects, ~/code | Conditional |
| PERSONAL | ~/.ssh, ~/.aws, ~/Documents | BLOCKED |
| CONFIG | /etc, /opt/etc | BLOCKED |
| SYSTEM | /bin, /usr, /System | NEVER |

---

### Pattern: Protection Levels

**SHARK Agent protection levels:**

| Level | Workspace | Dev Dirs | System | Sandbox |
|-------|-----------|----------|--------|---------|
| STRICT | Read-only | BLOCKED | BLOCKED | Full |
| BALANCED | Full | Conditional | BLOCKED | Full |
| PERMISSIVE | Full | Full | BLOCKED | Full |
| SANDBOX | Redirected | Redirected | BLOCKED | Full |

---

## Auto-Debug Patterns

### Pattern: Known Error Signature

**What it is:** Error matching against known patterns with pre-defined fixes.

**Error → Fix mapping:**

| Error Pattern | Auto-fix Rate | Common Causes |
|--------------|--------------|---------------|
| Docker permission | 80% | Directory not created before USER switch |
| npm EACCES | 50% | Install as root, then USER nonroot |
| TypeScript types | 30% | tsconfig.json misconfigured |
| stdin.isTTY undefined | 70% | Check === true explicitly |
| Request timeout | 70% | Increase timeout value |
| Module not found | 40% | Install missing dependency |

---

### Pattern: Recurring Problem Detection

**What it is:** Same error 2+ times triggers escalation.

**How it works:**
```
Error occurs → Hash error → Check .shark/error-tracker.json
         │
         ├─→ First occurrence: log + attempt fix
         │
         └─→ Second occurrence: flag as recurring
                   │
                   ▼
              DeepSeek R1 MUST handle
              ("same problem detected" → force R1)
```

---

## Evidence Patterns

### Pattern: Immutable Evidence Archive

**What it is:** Evidence stored with hash verification and timestamp.

**Structure:**
```
.shark/evidence/{gate-id}/{timestamp}/
├── evidence.json          # Gate criteria + results
├── {gate-specific-files}   # Test output, scan reports, etc.
└── checksum.sha256         # Immutable proof
```

---

### Pattern: Checkpoint Before Delivery

**What it is:** Git snapshot created before any delivery.

**How it works:**
```bash
git add -A
git commit -m "shark: checkpoint before delivery"
git tag "shark-delivery-{id}"
```

---

## Escalation Patterns

### Pattern: Structured Escalation Format

**What it is:** Uniform format for all human escalations.

```
⚠ ESCALATION — [SHARK/{variant}/{brain}]

ISSUE: {one-line summary}
SEVERITY: Critical | High | Medium
FOUND: {when/where in workflow}
EVIDENCE: {file refs, error outputs}
IMPACT: {what happens if not resolved}
ATTEMPTS: {auto-debug attempts made}
RECOMMENDED: {specific action to resolve}

STOP SHIP UNTIL RESOLVED.
```

---

### Pattern: Escalation Triggers

| Trigger | Severity | Action |
|---------|----------|--------|
| Secret detected | Critical | IMMEDIATE STOP |
| SAST critical | Critical | IMMEDIATE STOP |
| Guardian breach | Critical | STOP + REVIEW |
| Same error 3x | High | Escalate to human |
| Unknown error | High | Try auto-debug, then escalate |
| Coverage < 80% | High | Block ship |

---

## Context Management Patterns

### Pattern: T1/T2 Separation

**What it is:** T1 in cache, T2 on disk, never the twain shall meet (unless explicitly injected).

**T1 (always in context):**
- Identity: "You are Shark Agent, you do X"
- Thinking process: "You approach problems by Y"
- Current mode: "You are in PLAN/BUILD/MONITOR mode"
- Active goal: "You are building SPEC.md"

**T2 (loaded on demand):**
- Architecture reference
- Pattern catalog
- Verification techniques
- Build workflow steps

**Injection (Macro only):**
```
Reasoning Brain notices: Execution needs T2 about Docker
         │
         ▼
Gets docker-patterns.md from knowledge base
         │
         ▼
Synthesizes: "Docker error patterns + specific fix for this error"
         │
         ▼
Writes to thinking-state
         │
         ▼
Execution Brain reads thinking-state
         │
         ▼
Continues with context
```

---

*Pattern Catalog*
*Shark Agent V4 — T2 Reference*
