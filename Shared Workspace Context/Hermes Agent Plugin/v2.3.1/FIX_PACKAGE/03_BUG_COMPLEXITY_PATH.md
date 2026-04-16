# BUG 3: complexityHotspots — UNVALIDATED PATH (MEDIUM)

**Severity**: MEDIUM — malformed path could cause unexpected behavior
**Status**: MUST FIX
**Source File**: `src/tools/analysis.ts`
**Source Lines**: 13, 19

---

## THE BUG

The `complexityHotspots` tool accepts a `path` argument and passes it to `tsc --diagnostics` and `grep` without path validation:

```typescript
const target = args.path ?? "src";
const result = spawnSync("npx", ["tsc", "--diagnostics"], { cwd: context.directory, encoding: "utf-8", timeout: 60000 });
// ...
const grepResult = spawnSync("grep", ["-r", "-n", "-c", ";", target, "--include=*.ts"], { cwd: context.directory, encoding: "utf-8", timeout: 60000 });
```

While these are read-only commands, an arbitrary path value could:
1. Cause `tsc` to misbehave if path doesn't exist
2. Be exploited in combination with other attack vectors
3. Leak information about paths outside the project

The `cwd: context.directory` provides some protection, but `target` is still passed as a positional argument and could contain path traversal characters if `args.path` is user-controlled.

---

## EXACT FIX

**File**: `v2.3.1-build/src/tools/analysis.ts`

**Find (lines 12-14)**:
```typescript
  execute: async (args, context) => {
    const target = args.path ?? "src";
    const result = spawnSync("npx", ["tsc", "--diagnostics"], { cwd: context.directory, encoding: "utf-8", timeout: 60000 });
```

**Replace with**:
```typescript
  execute: async (args, context) => {
    const rawTarget = args.path ?? "src";
    // Validate target stays within context.directory
    const targetPath = join(context.directory, rawTarget);
    const resolvedTarget = resolve(targetPath);
    const allowedRoot = resolve(context.directory);
    if (!resolvedTarget.startsWith(allowedRoot)) {
      return `Error: Access denied. Path resolves outside project directory.`;
    }
    const target = resolvedTarget.substring(allowedRoot.length + 1);
    const result = spawnSync("npx", ["tsc", "--diagnostics"], { cwd: context.directory, encoding: "utf-8", timeout: 60000 });
```

Then find the grep call (line 19):
```typescript
const grepResult = spawnSync("grep", ["-r", "-n", "-c", ";", target, "--include=*.ts"], { cwd: context.directory, encoding: "utf-8", timeout: 60000 });
```

No change needed for the grep call since we validated and normalized `target` to a safe relative path.

---

## VERIFICATION

```bash
# 1. Verify target is validated
grep -n "startsWith(allowedRoot)" v2.3.1-build/src/tools/analysis.ts
# Expected: at least 2 occurrences (imports + symbols + complexityHotspots)

# 2. Verify build succeeds
cd v2.3.1-build && bun build.ts && echo "BUILD_OK"
# Expected: BUILD_OK
```

---

## MECHANICAL ENFORCEMENT CHECKLIST

- [ ] `startsWith(allowedRoot)` check exists for complexityHotspots
- [ ] `target` is validated before use in spawnSync
- [ ] `bun build.ts` exits 0

