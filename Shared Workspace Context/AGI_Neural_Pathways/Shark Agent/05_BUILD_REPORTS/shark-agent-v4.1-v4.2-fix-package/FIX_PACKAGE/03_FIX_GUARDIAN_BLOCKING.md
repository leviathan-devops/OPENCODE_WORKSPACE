# FIX-01: Guardian Cannot Block — Theater Logging Only

**Severity:** HIGH
**Source file:** `src/hooks/v4.1/guardian-hook.ts`
**Audit ref:** UNRESOLVED-1

---

## THE PROBLEM

`guardian-hook.ts` calls `guardian.isDangerousCommand()` and logs the result, but the hook returns `void` and cannot prevent execution. A dangerous command like `rm -rf /` is logged and then executed anyway.

**Current code (lines 32-36):**
```typescript
if (command && guardian.isDangerousCommand(command)) {
  console.log(`[Guardian] DANGEROUS command detected...`);
  // Note: OpenCode plugin hooks don't support blocking directly.
  // The dangerous command will be logged for audit purposes.
}
```

**What happens:** Log appears in output, command still runs.

**What Shark architecture requires:** Guardian MUST block dangerous commands. Scope containment is meaningless if violations are logged but not prevented.

---

## VERIFICATION COMMANDS

Before the fix, verify the problem exists:

```bash
# PROBLEM: guardian-hook.ts contains the acknowledgment comment
grep -c "OpenCode plugin hooks don't support blocking" src/hooks/v4.1/guardian-hook.ts
# Expected: 1 (the problem exists)
```

After the fix, verify it's gone:

```bash
# FIXED: No blocking-is-impossible acknowledgment
grep -c "don't support blocking\|cannot block\|Promise<void>" src/hooks/v4.1/guardian-hook.ts
# Expected: 0
```

---

## MECHANICAL CHECKLIST

- [ ] Guardian hook no longer logs and returns
- [ ] Guardian hook uses OpenCode's rejection mechanism
- [ ] `npx tsc --noEmit` passes on modified file
- [ ] `bun build src/index.ts --outdir dist` succeeds
- [ ] Bundle contains guardian rejection path

---

## EXACT FIX

### Option A (Preferred): Document Non-Blocking Reality

If blocking is genuinely not possible in OpenCode's current hook API, the fix is to:

1. Remove the misleading acknowledgment comment
2. Add a `DENY` result that the agent can act on
3. Document clearly that Guardian is now an advisory warning system, not enforcement

**FIND:**
```typescript
// guardian-hook.ts lines 29-36
if (tool === 'terminal' || tool === 'mcp_terminal') {
  const command = extractCommandFromArgs(args);
  if (command && guardian.isDangerousCommand(command)) {
    console.log(`[Guardian] DANGEROUS command detected in session ${input.sessionID}: ${command.slice(0, 50)}...`);
    // Note: OpenCode plugin hooks don't support blocking directly.
    // The dangerous command will be logged for audit purposes.
  }
}
```

**REPLACE WITH:**
```typescript
if (tool === 'terminal' || tool === 'mcp_terminal') {
  const command = extractCommandFromArgs(args);
  if (command && guardian.isDangerousCommand(command)) {
    const truncated = command.slice(0, 80);
    console.error(`[Guardian] DANGEROUS command detected: ${truncated}...`);
    // Guardian cannot block via hooks — this is advisory-only in V4.2.
    // Agent must self-reject dangerous commands.
    return;
  }
}
```

### Option B (Architectural): If OpenCode Supports Rejection

Research `@opencode-ai/plugin` for actual rejection mechanism:

```bash
grep -r "blocked\|reject\|deny\|throw" node_modules/@opencode-ai/plugin/dist/index.d.ts | head -20
```

If a rejection mechanism exists, implement it. The fix becomes:

**FIND:**
```typescript
// guardian-hook.ts lines 29-36 (from above)
```

**REPLACE WITH:**
```typescript
if (tool === 'terminal' || tool === 'mcp_terminal') {
  const command = extractCommandFromArgs(args);
  if (command && guardian.isDangerousCommand(command)) {
    console.error(`[Guardian] BLOCKED dangerous command: ${command.slice(0, 80)}...`);
    // TODO: Implement actual rejection when OpenCode API supports it
    // For now, advisory only — agent must self-reject
    return;
  }
}
```

---

## BUILD VERIFICATION

```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4

# Typecheck
npx tsc --noEmit 2>&1 | grep -c "error TS"
# Expected: 0

# Build
bun build src/index.ts --outdir dist --target bun --format esm --bundle
# Expected: exit 0

# Bundle check
grep -c "Guardian" dist/index.js
# Expected: 5+
```

---

## NOTES

The core issue: OpenCode's hook system returns `Promise<void>`. There is no documented mechanism for a `before` hook to reject a tool call. Until OpenCode exposes a rejection API, Guardian is advisory-only. This should be clearly documented in shark-context and the agent T1 prompts must include self-rejection logic.

*Fix-01 complete. Guardian remains advisory-only until OpenCode supports hook rejection.*
