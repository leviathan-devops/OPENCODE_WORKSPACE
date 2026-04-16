# BUG 1: secretScan — BROKEN TOOL SYNTAX (CRITICAL)

**Severity**: CRITICAL — runtime crash, build produces non-functional code
**Status**: MUST FIX BEFORE ANYTHING ELSE
**Source File**: `src/tools/security.ts`
**Source Line**: 64
**v2.3 Plan Claim**: "Already fixed in v2.2 source" — FALSE

---

## THE BUG

The `secretScan` tool has a placeholder that was never replaced:

```typescript
export const secretScan=***
  description: "Detect secrets/credentials in code",
  args: {
    path: tool.schema.string().optional().describe("Path to scan"),
  },
  execute: async (args, context) => {
```

The `=***` was a placeholder comment. The `args` object and `execute` function are syntactically orphaned outside any `tool({...})` call wrapper.

**What happens at runtime**: Calling `secretScan(...)` tries to invoke `***` (a comment) as a function → immediate crash.

**Why build passes**: `bun build.ts` compiles valid JavaScript. The JSDoc comment `/** ... **/` is syntactically legal. TypeScript is not enforced (`npx tsc --noEmit` shows 31 errors but the build ignores them).

---

## EXACT FIX

**File**: `v2.3.1-build/src/tools/security.ts`

**Find (lines 64-92)**:
```typescript
export const secretScan=***
  description: "Detect secrets/credentials in code",
  args: {
    path: tool.schema.string().optional().describe("Path to scan"),
  },
  execute: async (args, context) => {
    const target = args.path ?? ".";
    const result = spawnSync("grep", [
      "-r", "-n", "-i", "-E",
      "(api[_-]?key|secret[ly]?|password|token|credential|private[_-]?key|access[_-]?key)",
      target,
      "--include=*.ts", "--include=*.js", "--include=*.json",
      "--include=*.env*", "--include=*.yaml", "--include=*.yml"
    ], { cwd: context.directory, encoding: "utf-8", timeout: 60000 });
    if (result.stdout && result.stdout.trim()) {
      const lines = result.stdout.trim().split("\n").slice(0, 30);
      const redacted = lines.map(line => {
        const colonIdx = line.indexOf(":");
        if (colonIdx !== -1) {
          const pathPart = line.substring(0, colonIdx + 1);
          return `${pathPart} [REDACTED - potential secret detected]`;
        }
        return line;
      });
      return `Potential secrets found (verify manually):\n${redacted.join("\n")}`;
    }
    return `✓ No obvious secrets detected.`;
  },
});
```

**Replace with**:
```typescript
export const secretScan = tool({
  description: "Detect secrets/credentials in code",
  args: {
    path: tool.schema.string().optional().describe("Path to scan"),
  },
  execute: async (args, context) => {
    const target = args.path ?? ".";
    const result = spawnSync("grep", [
      "-r", "-n", "-i", "-E",
      "(api[_-]?key|secret[ly]?|password|token|credential|private[_-]?key|access[_-]?key)",
      target,
      "--include=*.ts", "--include=*.js", "--include=*.json",
      "--include=*.env*", "--include=*.yaml", "--include=*.yml"
    ], { cwd: context.directory, encoding: "utf-8", timeout: 60000 });
    if (result.stdout && result.stdout.trim()) {
      const lines = result.stdout.trim().split("\n").slice(0, 30);
      const redacted = lines.map(line => {
        const colonIdx = line.indexOf(":");
        if (colonIdx !== -1) {
          const pathPart = line.substring(0, colonIdx + 1);
          return `${pathPart} [REDACTED - potential secret detected]`;
        }
        return line;
      });
      return `Potential secrets found (verify manually):\n${redacted.join("\n")}`;
    }
    return `✓ No obvious secrets detected.`;
  },
});
```

**Change Summary**:
- `export const secretScan=***` → `export const secretScan = tool({`
- The trailing `});` at the end already closes the `tool({...})` — no change needed there

---

## VERIFICATION

After applying the fix, run these EXACTLY:

```bash
# 1. Verify the fix is in place
grep -n "export const secretScan = tool({" v2.3.1-build/src/tools/security.ts
# Expected: line with "export const secretScan = tool({"

# 2. Verify NO more =*** pattern
grep -n "secretScan=\*" v2.3.1-build/src/tools/security.ts
# Expected: NO OUTPUT (empty)

# 3. Attempt to build — must exit 0
cd v2.3.1-build && bun build.ts
# Expected: dist/index.js generated, no errors

# 4. Verify secretScan is in dist as a proper function call
grep -c "secretScan = tool({" v2.3.1-build/dist/index.js
# Expected: 1 or more
```

**If any verification fails: DO NOT PROCEED. Report failure.**

---

## MECHANICAL ENFORCEMENT CHECKLIST

- [ ] `secretScan = tool({` exists in source file
- [ ] No `=***` pattern in security.ts
- [ ] `bun build.ts` exits 0
- [ ] `dist/index.js` contains `secretScan = tool({`
- [ ] `grep -c "secretScan" dist/index.js` returns count > 0

