# slop-detector

**Type**: Tool After Hook
**Hook Key**: `toolAfter` (specific to write/edit tools)
**Plugin**: Spider Agent
**Purpose**: Detect low-quality code patterns (abstraction bloat, boilerplate, dead code)

---

## Hook Signature

```typescript
type SlopDetectorHook = (input: ToolInput, output: ToolOutput) => Promise<void>;
```

---

## Trigger Conditions

Only fires when tool name is one of:
- `write`
- `edit`
- `apply_patch`
- `create_file`

And only after the tool completes successfully.

---

## Heuristics

The hook runs 5 heuristics in sequence, each with a time budget:

### 1. Abstraction Bloat

**Detects**: 3+ new class/struct declarations in single operation

**Why it matters**: Over-abstraction is a sign of speculative design

**Detection**: Parse AST, count new type declarations

### 2. Comment Stripping

**Detects**: 5+ comments removed, 0 added

**Why it matters**: Removing comments degrades code quality

**Detection**: Diff comments before/after

### 3. Boilerplate Explosion

**Detects**: 200+ lines added for small/simple tasks

**Why it matters**: Boilerplate indicates missing abstraction or poor design

**Detection**: Line count vs task complexity

### 4. Dead Exports

**Detects**: New exports not found in any import across codebase

**Why it matters**: Dead exports = unused code = maintenance burden

**Detection**: Parse new exports, search imports across codebase
**Time budget**: 480ms max

### 5. Stale Imports

**Detects**: Import identifiers not used in the file body

**Why it matters**: Stale imports = dead code, import side effects

**Detection**: Parse imports, cross-reference with file body

---

## Time Budget

Total budget: ~500ms
Individual heuristic: ~100ms each
Dead exports (step 4): 480ms max

Hook stops if time exceeded — never blocks on timeout.

---

## Advisory Behavior

This hook NEVER throws. It only:
1. Logs warnings
2. Injects advisory messages into the message stream

The architect/reviewer decides whether to act on the advisory.

---

## Output Format

```typescript
interface SlopAdvisory {
  detected: boolean;
  heuristics: {
    name: string;
    passed: boolean;
    details?: string;
  }[];
  summary: string;
}
```

---

## State Mutations

None — reads only.

---

## Source Reference

```typescript
export function createSlopDetectorHook(config, projectDir, injectSystemMessage) {
  return {
    toolAfter: async (input, output) => {
      if (!isWriteTool(input.tool)) return;
      
      const results = [];
      for (const heuristic of HEURISTICS) {
        const result = await runWithTimeout(heuristic, 100);
        results.push(result);
      }
      
      if (results.some(r => !r.passed)) {
        injectAdvisoryMessage(results);
      }
    }
  };
}
```

---

## Related Hooks

- `guardrails` — Detects different quality issues
- `scope-guard` — Enforces scope, not quality
- `dark-matter-detector` — Detects unresolved gaps
