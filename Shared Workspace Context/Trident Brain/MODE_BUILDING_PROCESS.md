# MODE BUILDING PROCESS
## Kraken Multi-Agent Mode Development Guide

**Version:** 1.0  
**Based On:** Trident Brain v3.0 Development Experience  
**Date:** 2026-04-14  
**Purpose:** Build additional modes (shark, manta, kraken) following the proven v3.0 process

---

## EXECUTIVE SUMMARY

Building a new mode follows a **4-phase process**:

```
PLAN → BUILD → TEST → SHIP
```

Each phase has clear deliverables and exit criteria. Modes are built as **standalone plugins first**, then merged into a multi-mode agent after validation.

---

## PHASE 1: PLAN (1-2 days)

### 1.1 Define Mode Purpose

Answer these questions:
- **What is this mode's core function?**
- **Who is the target user?**
- **What are the natural language commands?**
- **What patterns/banned behaviors should it detect?**

### 1.2 Write Mode Specification

Create `MODE_NAME/SPEC.md`:

```markdown
# [MODE NAME] - Mode Specification

## Purpose
[One sentence describing what this mode does]

## Target Users
[Who will use this mode]

## Core Capabilities
1. [Capability 1]
2. [Capability 2]
3. [Capability 3]

## Natural Language Commands
| Command | Action |
|---------|--------|
| "do thing" | [What happens] |

## Banned Patterns (if applicable)
- [Pattern 1 that generates CRITICAL]
- [Pattern 2 that generates CRITICAL]

## Architecture
[Simple block diagram or description]

## Success Criteria
- [Criterion 1]
- [Criterion 2]
```

### 1.3 Define Folder Structure

```
MODE_NAME/
├── src/
│   ├── index.ts          # Plugin entry, hooks, commands
│   └── mode-core.ts     # Core logic, patterns, engines
├── dist/                 # Built output
├── docs/
│   └── SPEC.md          # This spec
├── pkg/
│   ├── package.json
│   └── tsconfig.json
├── tests/
│   └── mode.test.ts
└── README.md
```

### 1.4 Plan Commands

Design natural language parsing:

```typescript
function parseNaturalLanguage(message: string): { action: string; target?: string; options?: Record<string, any> } | null {
  const msg = message.toLowerCase().trim();
  
  if (msg.includes('[trigger word 1]')) return { action: 'action1' };
  if (msg.includes('[trigger word 2]')) return { action: 'action2' };
  // ...
  
  return null;
}
```

---

## PHASE 2: BUILD (2-3 days)

### 2.1 Core Architecture Pattern

Follow the **Trident v3.0 Pattern**:

```
Plugin Entry (index.ts)
├── Natural Language Parser
├── Command Handlers
├── Hooks (tool.execute.before, tool.execute.after, chat.message)
└── State Management

Mode Core (mode-core.ts)
├── PATTERNS (regex definitions)
├── Scanner Class
├── Engine Class
├── Verifier Classes (proof, cross-ref, etc.)
└── Report Generator
```

### 2.2 Critical Implementation Rules

#### Rule 1: Model ONLY Reads Files

```typescript
// GOOD: Model reads files via fs
const content = await readFile(filePath, 'utf-8');

// BAD: Model makes decisions based on context
if (context.includes('should audit')) { ... }
```

#### Rule 2: ALL Detection is Algorithmic

```typescript
// GOOD: Regex pattern matching
const findings = scanWithPatterns(content, PATTERNS);

// BAD: Behavioral AI decisions
if (await model.decides('is this bad?')) { ... }
```

#### Rule 3: Every Loop Needs SafetyCount

```typescript
// GOOD:
let safetyCount = 0;
const maxMatches = 100;
while ((match = regex.exec(content)) !== null && safetyCount < maxMatches) {
  safetyCount++;
  // process match
}

// BAD:
while ((match = regex.exec(content)) !== null) {
  // infinite loop if no global flag!
}
```

#### Rule 4: Regex Must Have Global Flag for Multiple Matches

```typescript
// GOOD: Add global flag if not present
const flags = pattern.regex.flags.includes('g') 
  ? pattern.regex.flags 
  : pattern.regex.flags + 'g';
const regex = new RegExp(pattern.regex.source, flags);

// BAD: Remove global flag (causes infinite duplicates!)
const flags = pattern.regex.flags.replace('g', '');
```

#### Rule 5: No console.log in Production

```typescript
// GOOD: Use output.blockReason for user feedback
output.blockReason = '[MODE] Tool blocked';

// BAD: console.log causes UI spillover
console.log('Blocked tool');
```

#### Rule 6: Tool Enforcement Hook

If mode should block certain tools:

```typescript
'tool.execute.before': async (input: any, output: any) => {
  const toolName = input.tool as string;
  
  const BLOCKED_TOOLS = ['edit', 'bash', 'write', 'write_file'];
  const isBlocked = BLOCKED_TOOLS.some(t => toolName === t);
  
  if (isBlocked) {
    output.blocked = true;
    output.blockReason = '[MODE] Tool blocked - mode is read-only';
  }
},
```

#### Rule 7: Documentation-Only Output

Modes should NOT edit source code directly. If they provide fixes:

```typescript
// Output fix documentation, NOT actual edits
let response = '## FIX DOCUMENTATION\n\n';
response += '> This is DOCUMENTATION ONLY.\n\n';
response += '**HOW TO FIX:**\n';
response += `${fixInstructions}\n`;
```

### 2.3 Required Components

| Component | Purpose | Required? |
|-----------|---------|-----------|
| PATTERNS | Regex definitions for detection | Yes |
| Scanner | Scans content with patterns | Yes |
| Natural Language Parser | Parses user commands | Yes |
| Command Handlers | Executes requested actions | Yes |
| Report Generator | Formats output | Yes |
| Proof Verifier | Validates claims | Recommended |
| Hook Analyzer | Detects cross-plugin issues | Recommended |
| Resource Estimator | Memory/performance analysis | Optional |
| Cross-Ref Verifier | Import/ID validation | Optional |

### 2.4 Pattern Definition Format

```typescript
export const PATTERNS = {
  CATEGORY_NAME: [
    { regex: /real_regex_pattern/flags, severity: SEVERITY.CRITICAL, note: 'Description' },
    // ...
  ] as readonly { regex: RegExp; severity: string; note?: string }[],
};
```

### 2.5 State Management

```typescript
interface ModeState {
  mode: string;
  target: string;
  artifacts: Map<string, string>;
  lastError?: string;
  lastFindings?: Finding[];
}

const state: ModeState = {
  mode: 'idle',
  target: '',
  artifacts: new Map(),
};
```

---

## PHASE 3: TEST (1-2 days)

### 3.1 Mechanical Verification Tests

Run these tests before declaring ship ready:

#### Test 1: Pattern Detection
```typescript
// Create file with known issues
writeFileSync('/tmp/test.js', '// TODO: full implementation');
// Scan with mode
const findings = scanner.scanFile('/tmp/test.js', content);
// Verify findings.length > 0
```

#### Test 2: No Duplicate Findings
```typescript
// 3 matches should = 3 findings, NOT 300
const dupTest = 'return null; return null; return null;';
const findings = scanner.scanFile('/tmp/dup.js', dupTest);
// Verify findings.length === 3
```

#### Test 3: SafetyCount Prevents Hangs
```typescript
// 200 patterns should complete in <5 seconds
const bigFile = 'pattern\n'.repeat(200);
const start = Date.now();
scanner.scanFile('/tmp/big.js', bigFile);
const elapsed = Date.now() - start;
// Verify elapsed < 5000
```

#### Test 4: Line Numbers Accurate
```typescript
const findings = scanner.scanFile('/tmp/test.js', content);
const withLines = findings.filter(f => f.line > 0);
// Verify withLines.length === findings.length
```

#### Test 5: Evidence is Real Code
```typescript
const findings = scanner.scanFile('/tmp/test.js', content);
const hasEvidence = findings.every(f => f.evidence && f.evidence.length > 0);
// Verify hasEvidence === true
```

### 3.2 Integration Test Script

Create `/tests/integration.test.ts`:

```typescript
import { ModeCore } from '../src/mode-core';

describe('Mode Integration Tests', () => {
  it('detects patterns correctly', () => { /* test */ });
  it('no duplicate findings', () => { /* test */ });
  it('completes in reasonable time', () => { /* test */ });
  it('line numbers accurate', () => { /* test */ });
});
```

Run: `npm test`

### 3.3 Manual Verification Checklist

| Test | Expected | Pass/Fail |
|------|----------|-----------|
| "audit this" works | Output shows findings | |
| Tool blocking active | Blocked tools return error | |
| No console spillover | UI clean, no extra output | |
| Commands recognized | All NL commands work | |
| Findings accurate | Real issues found, no false positives | |

---

## PHASE 4: SHIP (1 day)

### 4.1 Pre-Ship Checklist

- [ ] `npm run build` completes clean (0 errors)
- [ ] No console.log/error/warn in built code
- [ ] All mechanical tests pass (7/7)
- [ ] Documentation complete
- [ ] Git tag created
- [ ] Plugin deployed to test location
- [ ] Manual verification complete

### 4.2 Documentation Requirements

Create these files:

| File | Purpose |
|------|---------|
| `README.md` | Installation, quick start |
| `docs/ARCHITECTURE.md` | Technical architecture |
| `docs/SPEC.md` | Mode specification |
| `docs/TROUBLESHOOTING.md` | Common issues & fixes |
| `handover/INDEX.md` | Handover package index |

### 4.3 Git Workflow

```bash
# Create feature branch
git checkout -b mode/[name]-v1.0

# Commit work
git add -A
git commit -m "feat: [mode name] initial implementation"

# Create tag
git tag -a v1.0.0 -m "[Mode] v1.0.0 - Initial release"

# Push
git push origin main
git push origin v1.0.0
```

### 4.4 Deploy as Standalone

```bash
# Copy dist to plugins
cp -r dist/* ~/.config/opencode/plugins/[mode-name]/

# Add to opencode.json
{
  "plugins": {
    "[mode-name]": {
      "enabled": true,
      "path": "/path/to/mode/dist"
    }
  }
}
```

---

## STANDALONE TO MULTI-MODE MERGE

After modes are validated standalone, merge into unified agent:

### 5.1 Multi-Mode Architecture

```
Single Agent (e.g., "kraken")
├── Mode Selector (parses NL to route to correct mode)
│   ├── shark-* commands → Shark Mode
│   ├── manta-* commands → Manta Mode
│   ├── trident-* commands → Trident Mode
│   └── default → Primary Mode
└── Shared Hooks (tool enforcement, logging)
```

### 5.2 Mode Selector Pattern

```typescript
// In index.ts - route to correct mode
function routeToMode(message: string): string {
  const msg = message.toLowerCase();
  
  if (msg.includes('shark') || msg.includes('steamroll')) {
    return 'shark';
  }
  if (msg.includes('manta') || msg.includes('debug')) {
    return 'manta';
  }
  if (msg.includes('trident') || msg.includes('audit')) {
    return 'trident';
  }
  
  return 'primary'; // Default mode
}
```

### 5.3 Shared vs Mode-Specific Hooks

```typescript
// Shared hooks (run for all modes)
'tool.execute.before': sharedToolBlocking,
'chat.message': modeSelector,  // Routes to correct mode

// Mode-specific hooks (only when that mode active)
if (currentMode === 'shark') {
  sharkHooks.execute();
}
```

### 5.4 Merge Checklist

- [ ] All standalone modes pass pre-ship checklist
- [ ] Mode selector correctly routes commands
- [ ] Shared hooks work for all modes
- [ ] No conflicts between mode patterns
- [ ] Memory usage acceptable with all modes loaded
- [ ] Single agent dropdown shows all modes
- [ ] Each mode's commands work correctly

---

## LESSONS LEARNED (from Trident v3.0)

### Bug 1: Non-Global Regex Duplicate Explosion

**Problem:** Non-global `regex.exec()` returns same match forever.

**Fix:** Always ensure global flag is present:
```typescript
const flags = pattern.regex.flags.includes('g') 
  ? pattern.regex.flags 
  : pattern.regex.flags + 'g';
```

**Detection:** Run 3-match test. If you get 300 findings, bug exists.

### Bug 2: Missing SafetyCount

**Problem:** Loops without safety limits can hang on large inputs.

**Fix:** Always add safetyCount to while loops:
```typescript
let safetyCount = 0;
const maxMatches = 100;
while ((match = regex.exec()) !== null && safetyCount < maxMatches) {
  safetyCount++;
}
```

### Bug 3: Console Spillover

**Problem:** console.log in hooks appears in OpenCode UI.

**Fix:** Remove all console.log. Use `output.blockReason` for feedback.

### Bug 4: Hardcoded Agent Names

**Problem:** Patterns only match specific agent names (shark, manta).

**Fix:** Use universal patterns:
```typescript
// BAD:
/trident-\w+|shark-\w+/

// GOOD:
/[a-z][a-z0-9]*-[a-z][a-z0-9]*/  // Generic tool-name pattern
```

### Bug 5: Architectural Violation

**Problem:** Mode tries to both audit AND fix (scope creep).

**Fix:** Document-only principle:
- Modes audit and document
- Humans apply fixes
- Tool enforcement prevents direct edits

---

## PROJECT STRUCTURE

```
kraken-multi-mode/
├── shared/                    # Shared utilities
│   ├── natural-language.ts   # Common NL parsing
│   ├── hooks.ts             # Shared hooks
│   └── types.ts             # Shared types
├── modes/
│   ├── trident/             # Trident Mode (v3.0)
│   │   ├── src/
│   │   ├── dist/
│   │   └── docs/
│   ├── shark/               # Shark Mode (to build)
│   ├── manta/               # Manta Mode (to build)
│   └── kraken/              # Kraken Mode (to build)
├── tests/
│   └── integration.test.ts
├── README.md
└── package.json
```

---

## COMMAND REFERENCE

### Build Commands
```bash
npm run build        # Compile TypeScript
npm test           # Run tests
npm run lint       # Lint code
```

### Deploy Commands
```bash
cp -r dist/* ~/.config/opencode/plugins/[mode-name]/
```

### Git Commands
```bash
git tag -a v1.0.0 -m "Message"
git push origin main
git push origin v1.0.0
```

---

## SUCCESS METRICS

A mode is ship ready when:

1. **Functional**: All commands work as specified
2. **Safe**: No infinite loops, crashes, or data loss
3. **Fast**: Audits complete in <30 seconds for 200 files
4. **Documented**: README, architecture docs, troubleshooting
5. **Tested**: 7/7 mechanical tests pass
6. **Clean**: No console spillover, no hardcoded values
7. **Recoverable**: Handover package exists for restore

---

## TEMPLATES

### Template: Mode README.md
```markdown
# [MODE NAME] Mode

**Version:** 1.0.0  
**Status:** [DRAFT/REVIEW/SHIP READY]  
**Date:** [YYYY-MM-DD]

## Quick Start

\`\`\`bash
npm install
npm run build
cp -r dist/* ~/.config/opencode/plugins/[mode-name]/
\`\`\`

## Commands

| Command | Action |
|---------|--------|
| "[command 1]" | [Does thing 1] |
| "[command 2]" | [Does thing 2] |

## Architecture

[Describe architecture]

## Troubleshooting

[Common issues and solutions]
```

### Template: Mode SPEC.md
```markdown
# [MODE NAME] - Specification

## Purpose
[One sentence]

## Capabilities
1. [Cap 1]
2. [Cap 2]

## Commands
[Table of commands]

## Patterns
[Regex patterns if applicable]

## Success Criteria
- [ ] [Criterion 1]
- [ ] [Criterion 2]
```

---

## NEXT MODES TO BUILD

Based on Trident v3.0 experience:

1. **Shark Mode** - Aggressive steamroll engineering
2. **Manta Mode** - Precision debugging
3. **Kraken Mode** - Orchestration/management

Follow this process document for each.

---

*Mode Building Process v1.0 - Based on Trident Brain v3.0 Development - 2026-04-14*