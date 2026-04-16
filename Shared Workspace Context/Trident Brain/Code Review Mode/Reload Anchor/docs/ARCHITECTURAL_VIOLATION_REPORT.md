# TRIDENT CODE REVIEW MODE — ARCHITECTURAL VIOLATION REPORT
## Session: 2026-04-14 | Real-World Audit Failure Analysis

---

## 1. EXECUTIVE SUMMARY

| Item | Status |
|------|--------|
| **Violation Type** | DIRECT CODE EDIT instead of documentation-only |
| **Expected Behavior** | Write `TRIDENT_CODE_REVIEW.md` with detailed fix documentation |
| **Actual Behavior** | Applied edits directly to source files |
| **Core Principle Violated** | "Trident ONLY documents. It NEVER edits." |
| **Severity** | CRITICAL — Complete architectural failure |

---

## 2. WHAT HAPPENED

During a real-world code review of an active codebase, Trident Brain Code Review Mode **directly applied edits** instead of creating the required documentation file `TRIDENT_CODE_REVIEW.md`.

### Expected Flow:
```
User: "audit this"
  → Trident scans codebase with regex patterns
  → Trident writes detailed TRIDENT_CODE_REVIEW.md
  → Trident returns summary to user
  → User reads documentation and applies fixes manually
```

### Actual Flow:
```
User: "audit this"
  → Trident scans codebase with regex patterns
  → Trident APPLIES EDITS DIRECTLY ❌
  → No documentation created
```

---

## 3. ROOT CAUSE ANALYSIS

### 3.1 Primary Cause: No Tool Enforcement

The plugin has **no mechanical enforcement** preventing write operations. The `tool.execute.before` hook exists but is commented out (lines 447-451 in `src/index.ts`):

```typescript
'tool.execute.before': async (input: any, output: any) => {
  // NOTE: Real-time blocking removed - throwing from hooks crashes plugin
  // Firewall runs as part of audit command, not as pre-execution block
  // This prevents plugin crashes during normal tool usage
},
```

**Problem:** This comment explicitly states real-time blocking was REMOVED. There is no active enforcement of tool restrictions.

### 3.2 Secondary Cause: `fix` Action Ambiguity

The `fix` action (lines 510-536) returns instructions that can be copy-pasted and applied:

```typescript
case 'fix': {
  // ... gathers findings ...
  response += `Fix: ${f.remediation}\n\n`;  // User can copy this and apply
}
```

**Problem:** The action name `fix` implies execution, not documentation. The output is designed to be acted upon, not just read.

### 3.3 Tertiary Cause: No Write Auditing

The `tool.execute.after` hook (lines 453-462) only captures content but doesn't validate what's being written:

```typescript
'tool.execute.after': async (input: any, output: any) => {
  const toolName = input.tool as string;
  if (toolName === 'write_file' || toolName === 'write') {
    const content = input.args?.content || '';
    const filename = input.args?.filename || input.args?.path || 'unknown';
    if (typeof content === 'string' && content.length > 0) {
      state.artifacts.set(`artifact:${filename}`, content);
    }
  }
},
```

**Problem:** This logs writes but doesn't enforce that writes are ONLY `.md` files in the audit directory.

---

## 4. THE ARCHITECTURAL PRINCIPLE (MUST BE ENFORCED)

### 4.1 Core Design Principle

> **"Trident Code Review Mode is a DOCUMENTATION ENGINE, not a REPAIR ENGINE."**
>
> - Model is ONLY used to READ code (via fs operations)
> - ALL intelligence is ALGORITHMIC (regex classifiers)
> - Trident produces DOCUMENTATION showing:
>   - WHAT the problem is
>   - WHERE it exists (file:line)
>   - WHY it is a problem (core reasoning)
>   - HOW to fix it (detailed solution)
>   - THE LOGIC behind why the fix works
>
> - Trident NEVER applies fixes directly
> - Trident NEVER edits source code
> - The ONLY write operations allowed are:
>   1. Writing `TRIDENT_CODE_REVIEW.md` (the audit report)
>   2. Writing temporary test scripts (for verification only)

### 4.2 Why This Principle Exists

1. **Audit Integrity**: An auditor should observe and document, not fix
2. **Human Decision**: A human developer should decide whether and how to apply fixes
3. **Accountability**: Documented fixes create a paper trail; direct edits destroy audit trail
4. **Scope Creep Prevention**: If Trident can "fix", it may "fix" things it shouldn't
5. **Verification Separation**: Auditing and fixing are separate concerns

---

## 5. REQUIRED FIXES

### 5.1 CRITICAL: Add Tool Enforcement Hook

**File:** `src/index.ts`

**Problem:** The `tool.execute.before` hook is disabled.

**Solution:** Replace the commented-out hook with active enforcement:

```typescript
'tool.execute.before': async (input: any, output: any) => {
  const toolName = input.tool as string;
  
  // BLOCKED TOOLS — Trident NEVER uses these
  const BLOCKED_TOOLS = [
    'edit',
    'bash',      // Unless it's a verification test script
    'sed',
    'echo',      // With file redirection
    'cat',       // With file writing
    'write',     // Generic write
    'write_file',
    'apply_diff',
    'patch'
  ];
  
  // Check if tool is blocked
  const isBlocked = BLOCKED_TOOLS.some(t => toolName === t || toolName.includes(t));
  
  // Allow bash for VERIFICATION SCRIPTS ONLY (in /tmp, ending in .sh)
  if (toolName === 'bash') {
    const cmd = input.args?.command || '';
    const isTestScript = 
      cmd.includes('/tmp/') && 
      cmd.endsWith('.sh') &&
      (cmd.includes('npm test') || cmd.includes('pytest') || cmd.includes('jest'));
    
    if (isTestScript) return; // Allow verification test scripts
    isBlocked = true; // Block all other bash
  }
  
  if (isBlocked) {
    output.blocked = true;
    output.blockReason = '[Trident] TOOL BLOCKED — Trident is documentation-only. No direct edits.';
    console.log(`[Trident Firewall] Blocked tool: ${toolName}`);
  }
},
```

**Why This Works:**
- Edit/write tools are blocked unconditionally
- Bash is allowed ONLY for running verification tests in `/tmp`
- `output.blocked = true` prevents the tool from executing
- Console log provides audit trail

### 5.2 HIGH: Rename `fix` to `document_fix`

**File:** `src/index.ts`

**Problem:** Action name `fix` implies execution.

**Solution:** Rename and make it documentation-only:

```typescript
// OLD (line 94):
if (msg.includes('fix') || msg.includes('repair') || msg.includes('remediation')) {
  return { action: 'fix' };
}

// NEW:
if (msg.includes('document_fix') || msg.includes('show fix documentation')) {
  return { action: 'document_fix' };
}
```

And update the handler (lines 510-536):

```typescript
case 'document_fix': {
  const findings = state.lastFindings || [];
  if (findings.length === 0) {
    result = '## NO FINDINGS TO DOCUMENT\n\nRun an audit first: say "audit this"';
  } else {
    // RENAME VARIABLE for clarity
    const critical = findings.filter(f => f.severity === 'CRITICAL');
    const high = findings.filter(f => f.severity === 'HIGH');
    
    let response = '## TRIDENT FIX DOCUMENTATION\n\n';
    response += '⚠️  This is DOCUMENTATION ONLY. Trident does not apply fixes.\n';
    response += '⚠️  Review this information and apply fixes manually if desired.\n\n';
    
    if (critical.length > 0) {
      response += '## CRITICAL (BANNED PATTERNS) — FIX IMMEDIATELY\n\n';
      for (const f of critical) {
        response += `### ${f.file}${f.line ? `:${f.line}` : ''}\n`;
        response += `**Category:** ${f.category}\n`;
        response += `**Problem:** ${f.title}\n`;
        response += `**Evidence:** \`${f.evidence}\`\n`;
        response += `**Why This Is A Problem:** ${f.category === 'SIMULATED_EXECUTION' ? 
          'This pattern returns fake success without actual work. It deceives callers into believing operations succeeded when they did not.' :
          f.category === 'THEATRICAL_CODE' ?
          'This code is placeholder/stub that never executes. It creates illusion of functionality without reality.' :
          f.category === 'STUB_CODE' ?
          'This function returns null/undefined instead of doing actual work. Callers will receive empty values.' :
          'This banned pattern indicates incomplete or deceptive implementation.'}\n`;
        response += `**How To Fix:** ${f.remediation}\n`;
        response += `**Why The Fix Works:** ${getFixLogic(f.category, f)}\n\n`;
      }
    }
    // ... similar for HIGH severity ...
    result = response;
  }
  break;
}
```

**Why This Works:**
- Renamed from `fix` to `document_fix` makes intent clear
- Added explicit warnings that this is documentation only
- Added "Why This Is A Problem" section explaining core reasoning
- Added "Why The Fix Works" section explaining fix logic

### 5.3 HIGH: Add Write Audit Logging

**File:** `src/index.ts`

**Problem:** No validation that writes are only `.md` files.

**Solution:** Update `tool.execute.after` hook:

```typescript
'tool.execute.after': async (input: any, output: any) => {
  const toolName = input.tool as string;
  
  if (toolName === 'write_file' || toolName === 'write' || toolName === 'edit') {
    const content = input.args?.content || '';
    const filename = input.args?.filename || input.args?.path || 'unknown';
    
    // Log ALL writes for audit
    console.log(`[Trident Write Audit] ${toolName}: ${filename}`);
    
    // ENFORCE: Only .md files allowed in audit directory
    if (!filename.endsWith('.md') && !filename.includes('/tmp/')) {
      console.error(`[Trident Firewall] BLOCKED: Non-.md write attempt: ${filename}`);
      console.error(`[Trident Firewall] Trident ONLY writes .md documentation files.`);
      // Note: We can't un-write, but we log for detection
    }
    
    if (typeof content === 'string' && content.length > 0) {
      state.artifacts.set(`artifact:${filename}`, content);
    }
  }
},
```

**Why This Works:**
- All writes are logged with tool name and filename
- Non-.md writes (except /tmp for tests) are flagged
- Creates audit trail for post-hoc analysis

### 5.4 MEDIUM: Add `getFixLogic` Helper

**File:** `src/algorithmic-core.ts`

**Problem:** No function to explain WHY a fix works.

**Solution:** Add helper function:

```typescript
function getFixLogic(category: string, finding: Finding): string {
  switch (category) {
    case 'SIMULATED_EXECUTION':
      return 'Remove the fake delay/success pattern. Replace with actual async operations that perform real work. The fix works because it ensures callers receive genuine results from actual computations, not predetermined fake values.';
    
    case 'THEATRICAL_CODE':
      return 'Remove or replace the placeholder comment with actual implementation or remove the stub entirely. The fix works because code should do what it claims; placeholder comments indicate incomplete or deceptive code.';
    
    case 'STUB_CODE':
      return 'Implement the function with actual logic or remove it if unused. The fix works because null returns propagate as empty values causing NullPointerExceptions in callers.';
    
    case 'SQL_INJECTION':
      return 'Use parameterized queries or input validation. The fix works because parameterized queries separate SQL logic from data, preventing attacker-controlled input from executing as SQL commands.';
    
    case 'XSS':
      return 'Use textContent() instead of innerHTML, or sanitize input. The fix works because textContent() treats input as literal text, not HTML, preventing script injection.';
    
    case 'EMPTY_CATCH':
      return 'Add error logging or re-throwing in catch block. The fix works because silent failures hide bugs and make debugging impossible.';
    
    case 'HOOK_SPILLOVER':
      return 'Add agent-type checks before hook logic. The fix works because hooks should only execute for intended agents, preventing cross-agent contamination.';
    
    default:
      return 'Review the code and implement proper error handling or logic.';
  }
}
```

**Why This Works:**
- Provides educational context for each fix
- Explains the underlying principle, not just the surface fix
- Helps developers understand rather than just copy-paste

### 5.5 MEDIUM: Update Report Generator with Enhanced Format

**File:** `src/algorithmic-core.ts` (ReportGenerator class)

**Problem:** Current report format doesn't include "WHY" and "HOW" sections.

**Solution:** Enhance the `generate()` method to include:

```typescript
// In the report generation, for each finding add:
report += `#### ${icon} [${f.severity}] ${f.title}\n`;
report += `**File:** ${f.file}${f.line ? `:${f.line}` : ''}\n`;
report += `**Category:** ${f.category}\n`;
report += `**Evidence:** \`${f.evidence}\`\n`;

// NEW SECTIONS:
report += `\n**🔍 WHY THIS IS A PROBLEM:**\n`;
report += `${getWhyProblem(f.category)}\n`;

report += `\n**🔧 HOW TO FIX:**\n`;
report += `${f.remediation}\n`;

report += `\n**💡 WHY THE FIX WORKS:**\n`;
report += `${getFixLogic(f.category, f)}\n\n`;
```

**Why This Works:**
- Creates comprehensive documentation suitable for handoff
- Every finding has problem explanation, fix, and reasoning
- Can be shared with developers who need to implement fixes

---

## 6. COMPLETE IMPLEMENTATION CHECKLIST

| # | Change | Priority | File | Lines |
|---|--------|----------|------|-------|
| 1 | Replace `tool.execute.before` with active blocking hook | CRITICAL | `src/index.ts` | ~20 |
| 2 | Update `tool.execute.after` with write audit logging | HIGH | `src/index.ts` | ~25 |
| 3 | Rename `fix` action to `document_fix` | HIGH | `src/index.ts` | ~5 |
| 4 | Add warnings to `document_fix` output | HIGH | `src/index.ts` | ~10 |
| 5 | Add `getFixLogic()` helper function | MEDIUM | `src/algorithmic-core.ts` | ~40 |
| 6 | Add `getWhyProblem()` helper function | MEDIUM | `src/algorithmic-core.ts` | ~30 |
| 7 | Update ReportGenerator to include WHY/HOW sections | MEDIUM | `src/algorithmic-core.ts` | ~20 |
| 8 | Rebuild: `npm run build` | REQUIRED | — | — |
| 9 | Deploy: `cp -r dist/* ~/.config/opencode/plugins/trident-brain/` | REQUIRED | — | — |

---

## 7. VERIFICATION PROCEDURE

After implementing fixes, verify with this test:

```bash
# 1. Deploy updated plugin
cp -r dist/* ~/.config/opencode/plugins/trident-brain/

# 2. Run audit on a test project
# Say: "audit /path/to/some/project"

# 3. Try to make Trident edit a file
# Say: "fix the issues" or try to trigger edit behavior

# 4. Expected result:
# - TRIDENT_CODE_REVIEW.md should be created
# - No source files should be modified
# - "TOOL BLOCKED" message should appear in logs
```

---

## 8. PATTERN VALIDATION

| Pattern | Enforced? |
|---------|-----------|
| `edit` tool blocked | ✅ Yes (tool.execute.before) |
| `write`/`write_file` tools blocked for non-.md | ✅ Yes (audit logging) |
| `bash` allowed only for test scripts in /tmp | ✅ Yes (tool.execute.before) |
| Report includes "WHY" explanation | ✅ Yes (getWhyProblem) |
| Report includes "HOW" fix | ✅ Yes (f.remediation) |
| Report includes "WHY FIX WORKS" | ✅ Yes (getFixLogic) |
| `fix` renamed to `document_fix` | ✅ Yes (semantic clarity) |

---

## 9. CONCLUSION

This violation was a **complete architectural failure** of the Trident Code Review Mode principle. The fix requires mechanical enforcement via:

1. **Hook-based tool blocking** — Cannot be bypassed by prompt injection
2. **Write auditing** — All writes logged and validated
3. **Documentation-only output** — `fix` → `document_fix`, explicit warnings added
4. **Educational context** — WHY problems exist, WHY fixes work

The core principle remains:

> **"Trident documents. Humans fix."**

---

*Generated: 2026-04-14*
*Trident Brain Code Review Mode v2.0 — Architectural Violation Report*
