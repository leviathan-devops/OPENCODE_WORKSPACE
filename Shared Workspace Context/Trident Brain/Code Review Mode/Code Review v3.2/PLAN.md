# TRIDENT CODE REVIEW v3.2 - ARTIFACT GENERATION PLAN

**Version:** 3.2.0
**Date:** 2026-04-16
**Status:** PLANNING
**Parent:** v3.1 (unchanged, preserved)

---

## OBJECTIVE

Add automatic markdown artifact generation to v3.2. When Trident completes an audit, it should:
1. Output the current response (v3.1 behavior - UNCHANGED)
2. ALSO write a comprehensive `TRIDENT_CODE_REVIEW_{context}_{date}.md` file

---

## WHAT CHANGES (v3.1 → v3.2)

### Preserved from v3.1
- All pattern detection
- All hooks and tool blocks
- All existing responses/outputs
- All agent instructions

### Added in v3.2
- Automatic file artifact generation
- Deep Planning Mode-inspired WHY/HOW structure
- Structured fix documentation per issue
- Mechanical verification steps

---

## ARCHITECTURE CHANGES

### New Component: ArtifactWriter

```typescript
// src/artifact-writer.ts (NEW FILE)

interface ArtifactConfig {
  targetPath: string;
  outputDir: string;  // defaults to targetPath
  includeTimestamp: boolean;
  semanticContext: string;  // extracted from target or user input
}

export class ArtifactWriter {
  // Generates full TRIDENT_CODE_REVIEW_*.md with Deep Planning Mode structure
  generateArtifact(
    findings: Finding[],
    auditState: AuditState,
    config: ArtifactConfig
  ): string  // returns file path

  // Called automatically after runAudit() completes
}
```

### Modified: runAudit() in index.ts

```typescript
// After findings are collected, BEFORE returning response:
// 1. Generate artifact content via ArtifactWriter
// 2. Write to file via write_file hook (respects documentation-only mode)
// 3. Include file path in response: "Report saved to: ..."
```

### New: Enhanced Finding Interface

```typescript
interface EnhancedFinding extends Finding {
  why: string;        // WHY is this a problem (mechanistic explanation)
  how: string;         // HOW to fix (concrete steps)
  proof: string;       // How to VERIFY the fix worked
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
}
```

---

## ARTIFACT FORMAT (Deep Planning Mode Structure)

```
TRIDENT_CODE_REVIEW_{context}_{YYYY-MM-DD}.md

# TRIDENT CODE REVIEW - {TARGET_NAME}

**Version:** 3.2.0
**Date:** {ISO_TIMESTAMP}
**Target:** {FULL_PATH}
**Semantic Context:** {CONTEXT}
**Status:** {PASS/FAIL}

---

## LAYER 1: INITIAL ANALYSIS

### What Is This Project?
{Surface analysis of what the codebase does}

### What Are We Trying to Solve?
{What problems were identified in this audit}

### Success Criteria
- [ ] Zero CRITICAL findings
- [ ] Zero theatrical code patterns
- [ ] All findings documented

---

## LAYER 2: FINDINGS BY CATEGORY

### 🚫 CRITICAL (BANNED PATTERNS)

{Findings where severity === 'CRITICAL'}

**WHY this is critical:**
{Detailed mechanistic explanation of why this pattern is dangerous}

**HOW to fix:**
1. {Step-by-step fix instructions}
2. {Each step concrete and actionable}

**Mechanical verification:**
```
{Verification command or test to run}
```

---

### ⚠️ HIGH PRIORITY

{Findings where severity === 'HIGH'}

**WHY this matters:**
{Detailed explanation}

**HOW to fix:**
1. {Step-by-step}

**Mechanical verification:**
```
{Command}
```

---

### ⚡ MEDIUM PRIORITY
### 📝 LOW PRIORITY
### ℹ️ INFO/NOTES

---

## LAYER 3: CONSOLIDATED FIX WORKFLOW

### Critical Path
{Ordered list of fixes, critical first}

### Verification Commands
```bash
{Commands to verify each fix}
```

### Prevention
{How to prevent similar issues in the future}

---

## APPENDIX: RAW FINDINGS

{full machine-readable findings list}
```

---

## IMPLEMENTATION STEPS

### Step 1: Create artifact-writer.ts
- New class `ArtifactWriter`
- Method `generateArtifact(findings, state, config): string`
- Returns file path of generated artifact

### Step 2: Enhance getWhyProblem() in index.ts
- Rename to `getWhyExplanation()`
- Expand with mechanistic WHY explanations
- Add HOW explanations
- Add proof/verification steps

### Step 3: Modify runAudit() in index.ts
- After `reportGenerator.generate()` call
- Call `artifactWriter.generateArtifact()`
- Use write_file hook to save (respects documentation-only)
- Append file path to response

### Step 4: Update reportGenerator in algorithmic-core.ts
- Extend to support WHY/HOW structure
- Add verification command generation
- Add severity-based grouping

### Step 5: Add semantic context extraction
- Extract meaningful context from target path
- e.g., `/shark-frankenstein/` → `SHARK_FRANKENSTEIN`
- Allow user override via hint

### Step 6: Build and test
- Mechanical tests pass
- End-to-end audit generates artifact file
- Artifact readable and actionable

---

## FILES CHANGED

| File | Change |
|------|--------|
| `src/artifact-writer.ts` | NEW - artifact generation |
| `src/index.ts` | MODIFY - call artifact writer after audit |
| `src/algorithmic-core.ts` | MODIFY - enhance Finding with WHY/HOW |
| `src/types.ts` | NEW - EnhancedFinding interface |
| `dist/*` | REBUILD |
| `package.json` | version bump to 3.2.0 |

---

## VERIFICATION

1. Run audit on test codebase
2. Verify response includes current findings (v3.1 behavior intact)
3. Verify file `TRIDENT_CODE_REVIEW_*_{date}.md` exists
4. Verify file contains WHY/HOW for each finding
5. Verify file contains mechanical verification commands
6. Verify no functionality removed from v3.1

---

## EXAMPLE OUTPUT

```
Report saved to: TRIDENT_CODE_REVIEW_SHARK_FRANKENSTEIN_2026-04-16.md

## TRIDENT CODE REVIEW

### CRITICAL: Closure Bug in FirewallMesh
File: src/tools/firewall-mesh.ts:52-61

**WHY this is critical:**
The `guardian` variable is captured from the constructor parameter,
not the class field `this.guardian`. If the class field is modified
after construction, the closure will use stale data, causing
inconsistent firewall behavior.

**HOW to fix:**
1. Remove `guardian` from closure capture
2. Change `guardian.checkPermission(...)` to `this.guardian.checkPermission(...)`
3. Remove unused constructor parameter `guardian`

**Mechanical verification:**
```bash
grep -n "guardian" src/tools/firewall-mesh.ts | head -20
# Should show only this.guardian usage, no shadowing
```
```

---

## NOTES

- v3.1 behavior is PRESERVED - no removal
- Artifact generation is ADDITIVE - happens alongside current output
- "Humans Fix" principle maintained - Trident documents, human applies fixes
- Mechanical verification steps included for human to confirm fixes work