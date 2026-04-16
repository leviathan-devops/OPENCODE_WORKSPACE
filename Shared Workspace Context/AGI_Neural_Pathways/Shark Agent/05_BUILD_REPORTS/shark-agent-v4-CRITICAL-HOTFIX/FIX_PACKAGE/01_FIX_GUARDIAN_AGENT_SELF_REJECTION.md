# FIX-01: Guardian Cannot Block — Agent Must Self-Reject

**Severity:** CRITICAL
**Source files:** `src/shark/micro/brains.ts`, `src/shark/macro/brains.ts`
**Audit ref:** CRITICAL-1
**Note:** This does NOT require changing the hook. The hook already logs. The fix is in the agent T1 prompts.

---

## THE PROBLEM

The Guardian hook can only log dangerous commands — it cannot block execution. The V4.2 fix acknowledged this with "ADVISORY" markers but did not fix the underlying issue.

The actual fix must happen in the agent T1 prompts: if the agent does not have mandatory self-rejection instructions, it will execute dangerous commands after the Guardian hook logs them.

**Current state:**
- Guardian hook: logs `[Guardian] DANGEROUS command detected: rm -rf /...`
- Guardian hook: logs `[Guardian] ADVISORY: OpenCode hooks cannot block. Agent must self-reject.`
- Agent T1: **No mention of mandatory self-rejection**

The agent receives the Guardian log but has no instruction to stop. It continues.

---

## VERIFICATION COMMANDS

Before fix — verify agent T1 has no self-rejection:

```bash
grep -c "self-reject\|must refuse\|must not execute\|mandatory refusal" src/shark/micro/brains.ts src/shark/macro/brains.ts 2>/dev/null
# Expected: 0 (no self-rejection language exists)
```

After fix — verify agent T1 includes mandatory self-rejection:

```bash
grep -c "self-reject\|must refuse\|must not execute.*dangerous\|mandatory.*refusal" src/shark/micro/brains.ts src/shark/macro/brains.ts 2>/dev/null
# Expected: 2+ (both brain files have the language)
```

---

## MECHANICAL CHECKLIST

- [ ] `src/shark/micro/brains.ts` Plan Brain T1 includes mandatory self-rejection
- [ ] `src/shark/micro/brains.ts` Build Brain T1 includes mandatory self-rejection
- [ ] `src/shark/macro/brains.ts` Execution Brain T1 includes mandatory self-rejection
- [ ] Self-rejection language is **mandatory** (not optional, not advisory)
- [ ] Agent T1 explicitly lists dangerous patterns Guardian catches
- [ ] `npx tsc --noEmit` passes
- [ ] `bun build` succeeds

---

## EXACT FIX

### File 1: `src/shark/micro/brains.ts`

**FIND:** The Plan Brain T1 section (look for "You are the Plan Brain" or "PLAN_BRAIN_T1 =")

Add this language to the Plan Brain T1, before the "YOU CANNOT" restrictions:

```
MANDATORY SELF-REJECTION — You must refuse execution of any command that Guardian flags as dangerous. When Guardian logs a DANGEROUS command warning, you MUST abort that command and report the violation. Do not proceed. Do not explain how to bypass. Do not suggest alternatives. Refuse and escalate.
```

**FIND:** The Build Brain T1 section (look for "You are the Build Brain" or "BUILD_BRAIN_T1 =")

Add the same language to the Build Brain T1.

### File 2: `src/shark/macro/brains.ts`

**FIND:** The Execution Brain T1 section (look for "EXECUTION_BRAIN_T1 =")

Add the same language to the Execution Brain T1.

---

## DANGEROUS PATTERNS REFERENCE

Guardian flags these (from `src/shark/shared/guardian.ts`):

```
DANGEROUS_PATTERNS:
- rm -rf /, rm -rf /bin, rm -rf /usr, rm -rf /sys, rm -rf /proc
- dd if=
- mkfs
- fork bombs (:(){ :|:& };:)

ZONES:
- PERSONAL: .ssh/, .aws/, /Documents/, /Desktop/, .config/credentials
- SYSTEM: /bin/, /usr/, /sbin/, /etc/, /System/

Guardian in SANDBOX mode: blocks PERSONAL and SYSTEM zones.
```

The agent T1 must know what Guardian considers dangerous.

---

## BUILD VERIFICATION

```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4

# Self-rejection language must appear in both brain files
MICRO=$(grep -c "self-reject\|must refuse\|must not execute" src/shark/micro/brains.ts 2>/dev/null || echo "0")
MACRO=$(grep -c "self-reject\|must refuse\|must not execute" src/shark/macro/brains.ts 2>/dev/null || echo "0")

echo "Micro brains self-rejection refs: $MICRO"
echo "Macro brains self-rejection refs: $MACRO"

if [ "$MICRO" -ge 2 ] && [ "$MACRO" -ge 1 ]; then
  echo "PASS: Self-rejection language present"
else
  echo "FAIL: Self-rejection language missing"
  exit 1
fi

# TypeScript
npx tsc --noEmit || exit 1

# Build
bun build src/index.ts --outdir dist --target bun --format esm --bundle || exit 1

echo "All checks pass"
exit 0
```

---

*Fix-01 complete. Agent T1 now includes mandatory self-rejection.*
