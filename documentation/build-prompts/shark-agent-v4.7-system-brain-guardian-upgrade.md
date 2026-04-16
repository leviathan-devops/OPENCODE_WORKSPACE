# Build Prompt: Shark Agent V4.7 — System Brain Guardian: Source File Edit Block

**Created:** 2026-04-07
**Requester:** leviathan
**Priority:** CRITICAL — Mechanical enforcement upgrade
**Prerequisite:** V4.6 (manta/shark split + global hooks fix)
**Target Version:** V4.7
**Status:** DRAFT — awaiting V4.6 completion

---

## PURPOSE

Upgrade the Shark Agent System Brain guardian to **MECHANICALLY BLOCK** direct edits to source files. The shark agent must NEVER edit a source file directly — all edits must go through a duplicate → version → copy workflow.

---

## DEFINITIONS (V4.7)

### Source File
A **source file** is ANY file that meets ALL of the following:
1. Exists in the workspace before the current Shark session began
2. Has file extension: `.ts`, `.js`, `.tsx`, `.jsx`, `.py`, `.rs`, `.go`, `.java`, `.c`, `.cpp`, `.h`, `.hpp`, `.cs`, `.rb`, `.php`, `.swift`, `.kt`, `.scala`, `.sh`, `.bash`, `.zsh`, `.yaml`, `.yml`, `.json`, `.toml`, `.xml`, `.md`, `.txt`, `.env`, `.config`
3. **The Shark agent has NO edit history for this file in its session**
4. The file is NOT a file the Shark agent created in this session

### Edit History
An **edit history** exists if and only if:
- The Shark agent has used the `edit` tool on this file path in the current session
- OR: The Shark agent created this file (via `write` tool) in this session

### Editable Files (Not Source Files)
The following are NOT source files:
- Files created BY the Shark agent in the current session
- Files with no file extension (like `Makefile`, `Dockerfile`)
- Configuration files in the project's root: `package.json`, `tsconfig.json`, `Cargo.toml`, `go.mod`, `build.gradle`, `pom.xml`, `build.sbt`
- Files in a `/tests/` or `/test/` directory (test files are editable)

### Workspace Files vs. External Files
- **Workspace files:** Files under `/home/leviathan/OPENCODE_WORKSPACE/` or the current working directory
- **External files:** Files outside workspace (e.g., `/home/leviathan/.opencode/`, system configs) — also blocked from edit

---

## THE IRONCLAD RULE (V4.7)

```
OVERWRITE = DESTROY. ALWAYS COPY, NAME WITH ITERATION, THEN EDIT.
```

**Every edit to a source file must follow this sequence:**

```
STEP 1: IDENTIFY source file (no edit history in session)
         ↓
STEP 2: DUPLICATE the file with version suffix
         Original: src/utils.ts
         Copy: src/utils.ts.v1.0.0
         ↓
STEP 3: VERIFY copy was created
         ↓
STEP 4: EDIT the COPY only
         → Use edit tool on src/utils.ts.v1.0.0
         → NEVER use edit tool on src/utils.ts
         ↓
STEP 5: CONFIRM edit was applied to copy
         ↓
STEP 6: Optionally REPLACE original if copy is verified working
         → This step is RECOMMENDED, not required
         → Must be explicit: "Replace original with verified copy"
```

---

## SYSTEM BRAIN GUARDIAN RULES (V4.7)

### Rule 1: Source File Edit Block (CRITICAL)

**Enforcement:** HARD BLOCK — the guardian must intercept BEFORE the edit happens.

```typescript
// In guardian.ts — V4.7 additions
const BLOCKED_PATTERNS = {
  // Files Shark has never edited in this session = source files
  // Guardian must check: has this file been edited by Shark in this session?
  sourceFileEdit: {
    action: 'BLOCK',
    reason: 'SOURCE_FILE_NO_EDIT_HISTORY',
    message: 'EDIT BLOCKED: This is a source file with no edit history. ' +
             'You MUST duplicate it first, then edit the copy. ' +
             'Use: COPY → src/file.ts -> src/file.ts.v1.0.0, THEN edit the copy.',
    blockedTools: ['edit'],
  },
};
```

### Rule 2: No Edit History Tracking

The guardian must maintain an **edit history map**:

```typescript
// In guardian.ts — V4.7 additions
interface GuardianState {
  // Set of file paths that Shark has edited in this session
  editedFiles: Set<string>;
  
  // Set of file paths that Shark has created in this session  
  createdFiles: Set<string>;
}

function canEdit(filePath: string): { allowed: boolean; reason?: string } {
  // If Shark created this file in this session = ALLOWED
  if (guardianState.createdFiles.has(filePath)) {
    return { allowed: true };
  }
  
  // If Shark has edited this file in this session = ALLOWED
  if (guardianState.editedFiles.has(filePath)) {
    return { allowed: true };
  }
  
  // If file does not exist yet (new file) = ALLOWED
  // (write tool handles new files)
  
  // Otherwise = BLOCKED (source file)
  return { 
    allowed: false, 
    reason: 'SOURCE_FILE_NO_EDIT_HISTORY',
    suggestion: `Duplicate the file first:
  1. cp ${filePath} ${filePath}.v1.0.0
  2. Then edit ${filePath}.v1.0.0`
  };
}
```

### Rule 3: Hook Integration

The `tool.execute.before` hook must check BEFORE the `edit` tool runs:

```typescript
// In guardian-hook.ts — V4.7 additions
export function createGuardianHook(guardian: Guardian) {
  return async (input, _output) => {
    // ... existing logic
    
    // V4.7: Source file edit block
    if (input.tool === 'edit' && input.args?.filePath) {
      const filePath = input.args.filePath;
      const editCheck = guardian.canEdit(filePath);
      
      if (!editCheck.allowed) {
        return {
          blocked: true,
          reason: editCheck.reason,
          suggestion: editCheck.suggestion,
        };
      }
    }
  };
}
```

### Rule 4: Edit History Registration

After a successful `edit` tool call, the hook must register the file:

```typescript
// In gate-hook.ts or a new edit-hook.ts
export function createEditHook(gateManager: GateManager) {
  return async (input, output) => {
    if (input.tool === 'edit' && input.args?.filePath) {
      const filePath = input.args.filePath;
      
      // Register in edit history
      guardianState.editedFiles.add(filePath);
      
      // If this was a COPY (filename matches pattern .v1.0.N),
      // also register the original file
      const originalPath = getOriginalFromCopy(filePath);
      if (originalPath) {
        // The copy is now considered "edited"
        guardianState.editedFiles.add(originalPath);
      }
    }
  };
}
```

### Rule 5: Write Tool Tracking (New Files)

```typescript
// Write tool creates new files — these are editable
if (input.tool === 'write' && input.args?.filePath) {
  const filePath = input.args.filePath;
  guardianState.createdFiles.add(filePath);
}
```

---

## VERSION SUFFIX PATTERN

**Mandatory version suffix format:**

```
{original}.v{MAJOR}.{MINOR}.{PATCH}
```

Examples:
```
src/app.ts          → src/app.ts.v1.0.0
src/app.ts.v1.0.0   → src/app.ts.v1.0.1    (increment PATCH)
lib/utils.ts        → lib/utils.ts.v1.0.0
config.yml          → config.yml.v1.0.0
```

**Version increment rules:**
- **MAJOR:** Breaking structural changes
- **MINOR:** Significant feature additions
- **PATCH:** Bug fixes, small changes

**For V4.7 initial implementation:**
- All copies start with `v1.0.0`
- Increment PATCH for subsequent edits to same file in same session

---

## COPY VERIFICATION WORKFLOW

Before editing a copy, verify it exists:

```
1. ls {file}.v1.0.0 — file must exist
2. wc -l {file}.v1.0.0 — file must have content
3. head -5 {file}.v1.0.0 — file must be valid
```

If verification fails:
```
DO NOT PROCEED. Report: "Copy verification failed. File may be corrupted."
```

---

## IMPLEMENTATION CHECKLIST

### Files to Modify (V4.6 → V4.7)

```
shark-agent/src/
├── shark/shared/guardian.ts      ← Add canEdit() and edit history tracking
├── shark/shared/state-store.ts   ← Add edit history to state domain
├── hooks/v4.1/guardian-hook.ts   ← Add tool.execute.before source file check
├── hooks/v4.1/gate-hook.ts      ← Register successful edits
└── index.ts                      ← Initialize guardian state with edit history
```

### Code Additions

| File | Addition | Line Target |
|------|----------|-------------|
| `guardian.ts` | `canEdit()` function | +40 lines |
| `guardian.ts` | `GuardianState.editedFiles` Set | +15 lines |
| `guardian.ts` | `BLOCKED_PATTERNS.sourceFileEdit` | +10 lines |
| `guardian.ts` | `getOriginalFromCopy()` helper | +15 lines |
| `guardian-hook.ts` | Source file check in tool.execute.before | +25 lines |
| `gate-hook.ts` | Edit history registration | +15 lines |
| `state-store.ts` | New domain: `shark-edit-history` | +10 lines |

---

## VERIFICATION CHECKLIST

After V4.7 build, verify mechanically:

### Test 1: Source File Block
```bash
# Session with no edit history
opencode run "@shark edit filePath=/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/src/index.ts"
# Expected: BLOCKED with reason "SOURCE_FILE_NO_EDIT_HISTORY"
# Guardian must NOT allow the edit
```

### Test 2: Duplicate Workflow Success
```bash
# Tell shark to edit a source file
opencode run "@shark I need to update the error handling in src/utils.ts"
# Expected: Shark runs:
#   1. cp src/utils.ts src/utils.ts.v1.0.0
#   2. edit filePath=src/utils.ts.v1.0.0
#   3. Confirms edit was applied to copy
```

### Test 3: Shark-Created File Still Editable
```bash
# Tell shark to create AND edit a new file
opencode run "@shark Create a new file called src/logger.ts and add error logging"
# Expected: Shark creates file, then can edit it directly (has createdFiles entry)
```

### Test 4: Version Copy Still Editable
```bash
# Tell shark to edit src/utils.ts.v1.0.0 (copy, not source)
opencode run "@shark Add a new function to src/utils.ts.v1.0.0"
# Expected: ALLOWED — copy is not a source file
```

### Test 5: Configuration Files Excluded
```bash
# package.json is not a source file (config in root)
opencode run "@shark Update package.json to add new dependency"
# Expected: ALLOWED — package.json is in exclusion list
```

---

## EXCLUSION LIST (Not Source Files)

These files are NOT source files and CAN be edited directly:

```typescript
const SOURCE_FILE_EXCLUSIONS = [
  // Config files in project root
  'package.json', 'tsconfig.json', 'jsconfig.json',
  'Cargo.toml', 'go.mod', 'go.sum', 'build.gradle', 'pom.xml',
  'build.sbt', 'Gemfile', 'Pipfile', 'requirements.txt',
  'Makefile', 'Dockerfile', '.dockerignore', '.gitignore',
  'vite.config.ts', 'webpack.config.js', 'rollup.config.js',
  'next.config.js', 'nuxt.config.ts', 'svelte.config.js',
  
  // Test files
  /\.test\.ts$/, /\.spec\.ts$/, /_test\.py$/, /_spec\.py$/,
  
  // Files in test directories
  /\/tests\//, /\/test\//,
  
  // Build output (not source)
  /\/dist\//, /\/build\//, /\/out\//,
  
  // Node modules (never touch)
  /\/node_modules\//,
];
```

---

## ERROR MESSAGES (V4.7)

### Source File Blocked Message
```
[GUARDIAN] EDIT BLOCKED — SOURCE FILE PROTECTION

File: {filePath}
Reason: SOURCE_FILE_NO_EDIT_HISTORY

This file has not been edited by Shark in this session. 
Direct edits to source files are MECHANICALLY BLOCKED.

Required workflow:
1. DUPLICATE: cp {filePath} {filePath}.v1.0.0
2. EDIT COPY: edit filePath={filePath}.v1.0.0
3. VERIFY: Confirm changes work
4. OPTIONAL REPLACE: Replace original if copy is verified

You MUST follow this sequence. No exceptions.
```

### Suggestion Message (when blocked)
```
Suggestion: Duplicate the file first
  1. cp {filePath} {filePath}.v1.0.0
  2. Then edit {filePath}.v1.0.0
```

---

## VERSION HISTORY ANNOTATION

When creating a versioned copy, add a header comment:

```typescript
// src/utils.ts.v1.0.0
// Derived from: src/utils.ts
// Version: v1.0.0
// Date: 2026-04-07
// Reason: Added error handling for network requests
// 
// EDIT HISTORY:
// v1.0.0 (2026-04-07): Initial copy + error handling additions
```

---

## RELATED DOCUMENTATION

| Doc | Location | Purpose |
|-----|----------|---------|
| V4.6 Build Report | `documentation/build-reports/shark-agent-v4.6-build-report.md` | Current working state |
| IRONCLAD RULE | Memory | Never overwrite principle |
| Source Audit | `projects/shark-agent-v4/build-context/REFERENCE/AUDIT.md` | V4.0-4.5 findings |
| Golden Harness | `GOLD STANDARD ARTIFACTS/SHARK_AGENT_1ST_BUILD_REPORT.md` | Validated shark-macro |

---

## AUTHOR NOTES

This V4.7 upgrade addresses a fundamental safety requirement: **protect source files from accidental overwrites**. The shark agent works in the user's workspace and may handle valuable code. The IRONCLAD RULE ensures no file is ever directly edited without:
1. A copy being made
2. Version tracking in the filename
3. Mechanical enforcement via the guardian system

This is NOT advisory — it is a HARD BLOCK that the System Brain guardian enforces.

---

*Build prompt created: 2026-04-07*
*Prerequisites: V4.6 completion (manta/shark split, global hooks fix)*
