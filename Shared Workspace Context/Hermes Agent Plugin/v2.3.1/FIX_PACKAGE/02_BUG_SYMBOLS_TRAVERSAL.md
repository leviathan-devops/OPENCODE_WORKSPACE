# BUG 2: symbols — PATH TRAVERSAL (HIGH)

**Severity**: HIGH — arbitrary file read outside project directory
**Status**: MUST FIX
**Source File**: `src/tools/analysis.ts`
**Source Line**: 121-123

---

## THE BUG

The `symbols` tool reads a file but does NOT validate that the resolved path stays within `context.directory`:

```typescript
const fullPath = join(context.directory, args.path);
const content = readFileSync(fullPath, "utf-8");  // NO validation
```

An attacker or compromised agent could pass `../../etc/passwd` as `args.path` and read arbitrary files.

**Compare to `imports` tool (FIXED in v2.3)** — it has proper containment:
```typescript
const resolved = resolve(fullPath);
const allowedRoot = resolve(context.directory);
if (!resolved.startsWith(allowedRoot)) {
  return `Error: Access denied. Path resolves outside project directory.`;
}
```

**Compare to `grill` tool (FIXED in v2.3)** — it also has proper containment.

`symbols` was missed. It has the same vulnerability class as the bugs this build was supposed to fix.

---

## EXACT FIX

**File**: `v2.3.1-build/src/tools/analysis.ts`

**Find (lines 120-123)**:
```typescript
  execute: async (args, context) => {
    const fullPath = join(context.directory, args.path);
    try {
      const content = readFileSync(fullPath, "utf-8");
```

**Replace with**:
```typescript
  execute: async (args, context) => {
    const fullPath = join(context.directory, args.path);
    const resolved = resolve(fullPath);
    const allowedRoot = resolve(context.directory);
    if (!resolved.startsWith(allowedRoot)) {
      return `Error: Access denied. Path resolves outside project directory.`;
    }
    try {
      const content = readFileSync(resolved, "utf-8");
```

**Changes**:
- Add `resolve()` call to canonicalize the path
- Add `allowedRoot` as the canonical `context.directory`
- Add containment check before any file read
- Change `readFileSync(fullPath, ...)` → `readFileSync(resolved, ...)`

---

## VERIFICATION

```bash
# 1. Verify containment check exists
grep -n "startsWith(allowedRoot)" v2.3.1-build/src/tools/analysis.ts
# Expected: line with "if (!resolved.startsWith(allowedRoot))"

# 2. Verify resolved is used in readFileSync
grep -n "readFileSync(resolved" v2.3.1-build/src/tools/analysis.ts
# Expected: line with "readFileSync(resolved"

# 3. Verify symbols rejects traversal
cd /tmp && node -e "
const { symbols } = require('/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hermes Agent Plugin/v2.3.1-build/dist/index.js');
// This test would require mocking context — see integration test
"
# Expected: Path traversal returns error message

# 4. Build must succeed
cd v2.3.1-build && bun build.ts && echo "BUILD_OK"
# Expected: BUILD_OK
```

---

## MECHANICAL ENFORCEMENT CHECKLIST

- [ ] `startsWith(allowedRoot)` check exists in symbols function
- [ ] `readFileSync(resolved, ...)` uses resolved path
- [ ] `readFileSync(fullPath, ...)` does NOT exist in symbols function
- [ ] `bun build.ts` exits 0
- [ ] Error message "Access denied" is returned for `../../etc/passwd`

