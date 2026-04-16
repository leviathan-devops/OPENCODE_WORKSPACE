# HERMES AGENT PLUGIN v2 — DEBUG LOG
## DevOps Manager Audit — 2026-04-04

**Auditor**: DevOps Manager (Guardian)
**Status**: CHANGES_REQUESTED — 2 bugs must fix before ship
**Build Directory**: `v2-build`

---

## BUG #1 — [HIGH] complexity_hotspots has unreachable fallback

### Location
`src/tools/analysis.ts`, lines 14-20

### Current Code
```typescript
execute: async (args, context) => {
  const target = args.path ?? "src";
  const result = spawnSync("npx", ["tsc", "--diagnostics"], { cwd: context.directory, encoding: "utf-8", timeout: 60000 });
  if (result.status === 0 || result.stdout) {          // <-- BUG: OR condition always true
    const output = result.stdout + result.stderr;
    return `Complexity analysis for ${target}:\n${output.substring(0, 1000)}`;  // <-- Always returns tsc output
  }
  const grepResult = spawnSync("grep", ["-r", "-n", "-c", ";", target, "--include=*.ts"], { cwd: context.directory, encoding: "utf-8", timeout: 60000 });
  return `Complexity analysis:\n${grepResult.stdout || "No complex hotspots found."}`;  // <-- NEVER REACHED
},
```

### Root Cause
The condition `result.status === 0 || result.stdout` uses OR (`||`). Since `tsc --diagnostics` always produces stdout output (even when there are errors), `result.stdout` is always truthy when the command runs. This means the grep fallback on line 19 is **never reached**.

When `tsc --diagnostics` succeeds (exit 0): `result.status === 0` is true, branch taken — fine.
When `tsc --diagnostics` fails (non-zero exit): `result.status === 0` is false BUT `result.stdout` is still truthy (tsc prints diagnostics to stdout regardless of exit code), so branch still taken.

The grep fallback was meant to be the fallback for when tsc is unavailable or fails without output. But it can never execute because tsc always produces stdout.

### Impact
- If tsc is installed, you always get tsc diagnostics output even if tsc exits with errors
- The grep-based fallback (line 19) is dead code — never executes
- If tsc is not installed, the function returns `undefined` implicitly (falls through to nothing)

### Fix
```typescript
execute: async (args, context) => {
  const target = args.path ?? "src";
  const result = spawnSync("npx", ["tsc", "--diagnostics"], { cwd: context.directory, encoding: "utf-8", timeout: 60000 });
  const output = result.stdout + result.stderr;
  if (result.status !== null && result.status === 0 && output) {
    return `Complexity analysis for ${target}:\n${output.substring(0, 1000)}`;
  }
  // Fallback: simple line count approach
  const grepResult = spawnSync("grep", ["-r", "-n", "-c", ";", target, "--include=*.ts"], { cwd: context.directory, encoding: "utf-8", timeout: 60000 });
  return `Complexity analysis:\n${grepResult.stdout || "No complex hotspots found."}`;
},
```

**Key changes:**
1. `result.status !== null && result.status === 0` — null-safe AND requires actual success exit code
2. `&& output` — require actual output content
3. Removed the `|| result.stdout` that was bypassing the fallback
4. Compute `output` once before the condition

### Verification
After fix, the grep fallback should be reachable when tsc exits non-zero or produces no output. Run:
```bash
cd "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hermes Agent Plugin/v2-build"
# Test with a project that has tsc errors
bun -e "const p = require('./dist/index.js').default; p.tool.complexity_hotspots.execute({path:'src'}).then(r => console.log(r.substring(0,200)))"
```

---

## BUG #2 — [MEDIUM] hermes-context has no OOM cap

### Location
`src/tools/hermes-context.ts`, lines 23-31

### Current Code
```typescript
execute: async (args, context) => {
  const memoryDir = resolve(process.env.HOME ?? "~", ".hermes", "memory");
  // ...dir exists check...
  const files = readdirSync(memoryDir).filter((f) => f.endsWith(".md"));
  // ...
  const relevantMemories = files
    .map((f) => {
      const path = join(memoryDir, f);
      const content = readFileSync(path, "utf-8");  // <-- Loads ALL files
      return { file: f, content };
    })
    .filter((m) =>
      m.content.toLowerCase().includes(args.topic.toLowerCase())  // <-- Filters AFTER load
    );
  // ...
},
```

### Root Cause
All .md files in `~/.hermes/memory/` are read into memory BEFORE filtering. This is the same pattern that `hermes-recall.ts` had (ROB-2), which WAS fixed with a cap and incremental reads. But `hermes-context.ts` was missed — it still loads everything.

The `hermes-recall` fix (lines 24-34 of hermes-recall.ts):
```typescript
const maxFiles = Math.min(files.length, 100);     // <-- Capped at 100
const resultLimit = args.limit ?? 5;
const memories: { file: string; content: string }[] = [];

for (let i = 0; i < maxFiles && memories.length < resultLimit * 3; i++) {  // <-- Incremental, early exit
  const path = join(memoryDir, files[i]);
  const content = readFileSync(path, "utf-8");
  if (content.toLowerCase().includes(args.query.toLowerCase())) {
    memories.push({ file: files[i], content });
  }
}
const trimmed = memories.slice(0, resultLimit);
```

### Impact
- If `~/.hermes/memory/` has 1000+ files (over time, it will), every call to `hermes_context` loads all 1000+ files into RAM
- This causes OOM on memory-constrained environments
- The filter runs AFTER the full map, wasting I/O on files that won't match

### Fix
```typescript
execute: async (args, context) => {
  const memoryDir = resolve(process.env.HOME ?? "~", ".hermes", "memory");
  if (!existsSync(memoryDir)) {
    return `No context available. Memory directory does not exist.`;
  }

  const files = readdirSync(memoryDir).filter((f) => f.endsWith(".md"));
  if (files.length === 0) {
    return `No context available.`;
  }

  const maxFiles = Math.min(files.length, 100);  // Same cap as hermes-recall
  const relevantMemories: { file: string; content: string }[] = [];

  for (let i = 0; i < maxFiles && relevantMemories.length < 15; i++) {
    const path = join(memoryDir, files[i]);
    const content = readFileSync(path, "utf-8");
    if (content.toLowerCase().includes(args.topic.toLowerCase())) {
      relevantMemories.push({ file: files[i], content });
    }
  }

  if (relevantMemories.length === 0) {
    return `No context found for: ${args.topic}`;
  }

  return `## Relevant Context for "${args.topic}"\n\n${relevantMemories
    .map((m) => m.content)
    .join("\n\n---\n\n")}`;
},
```

**Key changes:**
1. Added `maxFiles = Math.min(files.length, 100)` cap — same as hermes-recall
2. Changed from `.map().filter()` to `for` loop with early exit (`relevantMemories.length < 15`)
3. No limit argument needed — context injection should be small, hardcode 15 as max

### Verification
After fix, test with a memory directory containing 100+ files:
```bash
# Create test files
mkdir -p ~/.hermes/memory
for i in $(seq 1 150); do echo "# Memory $i" > ~/.hermes/memory/mem-$i.md; done
echo "test content for context" >> ~/.hermes/memory/mem-50.md

# Test the tool (requires OpenCode plugin context, or mock it)
# The tool should only read up to 100 files and return quickly
```

---

## VERIFICATION WORKFLOW

After applying both fixes:

```bash
cd "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hermes Agent Plugin/v2-build"

# 1. Rebuild
rm -rf dist && bun build.ts

# 2. Syntax check
node --check dist/index.js && echo "SYNTAX: PASS"

# 3. TypeScript check
npx tsc --noEmit && echo "TYPESCRIPT: PASS"

# 4. E2E tests
bun test-e2e.ts

# Expected: 146/147 pass (the detect_domains assertion failure is a test issue, not plugin)
```

---

## REPORTING DISCREPANCIES (for transparency)

These are NOT bugs — just discrepancies between what the audit docs say vs reality:

### Discrepancy 1: Timeout count
- **BUILD_REPORT claims**: "23 total spawnSync, 19 with timeout, 4 without"
- **Reality**: 18 total spawnSync, 18 with timeout, 0 without
- **Files**: quality.ts(5), security.ts(4), analysis.ts(2), verification.ts(7)
- **No action needed** — all calls are protected, count is just wrong in docs

### Discrepancy 2: Hook count
- **BUILD_REPORT says**: "27 lifecycle hooks (composed into 6 hook points)"
- **Reality**: 26 individual hook handlers composed into 6 hook points
- **No action needed** — "6 hook points" is the correct and meaningful number

### Discrepancy 3: hermes-context OOM
- **BUILD_REPORT says ROB-2 fixed** (hermes-recall cap applied)
- **Reality**: ROB-2 was applied to hermes-recall only, hermes-context was NOT updated
- **Action needed**: Bug #2 above

### Discrepancy 4: comprehensive audit vs final report
- **Comprehensive audit** lists 12 findings (3 MEDIUM + 2 LOW-MEDIUM + 4 LOW + 3 INFO)
- **Final report** has 10-item checklist, missing ROB-1/ROB-2 status tracking
- **No action needed** — actual fixes were applied correctly, tracking is just incomplete

---

## PRIORITY ORDER

1. **FIX FIRST** — Bug #1 (complexity_hotspots unreachable fallback) — HIGH severity
2. **FIX SECOND** — Bug #2 (hermes-context OOM) — MEDIUM severity
3. **REBUILD AND VERIFY** — run full test suite
4. **UPDATE DOCS** — correct timeout count and ROB-2 status in BUILD_REVIEW.md

---

## NO REGRESSIONS INTRODUCED BY THESE FIXES

Both fixes are strictly behavior-changing (making dead code reachable, adding OOM protection). Neither:
- Changes any API surface (args, return types unchanged)
- Affects other tools or hooks
- Introduces new dependencies
- Changes the build output format

---

*Debug log created by DevOps Manager — 2026-04-04*
