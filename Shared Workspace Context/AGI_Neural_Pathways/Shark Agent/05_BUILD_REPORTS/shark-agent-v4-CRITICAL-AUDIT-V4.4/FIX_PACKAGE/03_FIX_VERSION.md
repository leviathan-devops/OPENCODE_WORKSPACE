# FIX-C: Version Comment — Update index.ts to V4.4

**Severity:** MINOR
**File:** `src/index.ts`
**Audit ref:** NEW-3

---

## THE PROBLEM

`src/index.ts` line 2 says `* V4.2 changes from V4.1:` but this file has been modified by V4.4's CRITICAL-1 (agent T1 self-rejection). The version comment is stale.

---

## VERIFICATION COMMANDS

Before fix — verify version comment shows V4.2:

```bash
head -10 src/index.ts | grep "V4\."
# Expected: V4.2
```

After fix — verify version comment shows V4.4:

```bash
head -10 src/index.ts | grep "V4\."
# Expected: V4.4
```

---

## MECHANICAL CHECKLIST

- [ ] `src/index.ts` version comment updated to V4.4
- [ ] Changes from V4.3 are documented

---

## EXACT FIX

### File: `src/index.ts`

**FIND lines 1-8:**

```typescript
/**
 * Shark Agent V4 — OpenCode Plugin (V4.2)
 * 
 * V4.2 changes from V4.1:
 * - Guardian hook now uses console.error and documents advisory-only behavior
 * - Removed throwing coordinator stubs (honest placeholders)
 * - TypeScript verification integrated into build process
 */
```

**REPLACE WITH:**

```typescript
/**
 * Shark Agent V4 — OpenCode Plugin (V4.4)
 * 
 * V4.4 changes from V4.3:
 * - CRITICAL-1: Added MANDATORY SELF-REJECTION to all brain T1 prompts
 * - CRITICAL-2: Removed dead coordinator code (coordinator.ts, peer-dispatch.ts)
 * - CRITICAL-3: Wired handleVerifyFailure() into gate-hook for iteration loop
 * - V4.5 hotfix: Ghost file removal, structured state emission
 */
```

---

## BUILD VERIFICATION

```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4

# Version must show V4.4
VERSION=$(head -5 src/index.ts | grep -o "V4\.[0-9]" | head -1)
echo "Version in index.ts: $VERSION"

if [ "$VERSION" = "V4.4" ]; then
  echo "PASS: Version updated"
else
  echo "FAIL: Version still shows $VERSION"
  exit 1
fi
```

---

*Fix-C complete. Version comment updated.*