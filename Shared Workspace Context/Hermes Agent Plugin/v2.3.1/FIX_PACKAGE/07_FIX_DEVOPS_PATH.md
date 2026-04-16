# FIX 7: DevOps Manager — HARDCODE PATH (MEDIUM)

**Severity**: MEDIUM — works for Leviathan, fails silently for everyone else
**Status**: MUST FIX
**Source File**: `src/config/devops-manager.ts`
**Source Line**: 4

---

## THE PROBLEM

```typescript
const DEVOPS_CONTEXT_DIR = resolve("/home/leviathan/hermes-workspace/context/devops-manager");
```

This is a hardcoded absolute path. If this directory doesn't exist, every agent using the DevOps Manager profile gets:
```
"[Context file not found: MENTAL_MODEL.md]"
```

The plugin builds successfully but the agent identity is silently degraded — the DevOps Manager prompt becomes "[Context file not found: ...]" for anyone who isn't Leviathan.

---

## EXACT FIX

**File**: `v2.3.1-build/src/config/devops-manager.ts`

**Find (lines 1-12)**:
```typescript
import { readFileSync, existsSync } from "fs";
import { join, resolve } from "path";

const DEVOPS_CONTEXT_DIR = resolve("/home/leviathan/hermes-workspace/context/devops-manager");

function readContextFile(filename: string): string {
  const path = join(DEVOPS_CONTEXT_DIR, filename);
  if (!existsSync(path)) return `[Context file not found: ${filename}]`;
  return readFileSync(path, "utf-8");
}
```

**Replace with**:
```typescript
import { readFileSync, existsSync } from "fs";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Resolve from environment variable or default to ./context relative to this file
function getDevopsContextDir(): string {
  if (process.env.HERMES_DEVOPS_CONTEXT_DIR) {
    return resolve(process.env.HERMES_DEVOPS_CONTEXT_DIR);
  }
  // Default: <plugin-root>/context/devops-manager
  const __dirname = dirname(fileURLToPath(import.meta.url));
  return resolve(__dirname, "../../context/devops-manager");
}

const DEVOPS_CONTEXT_DIR = getDevopsContextDir();

function readContextFile(filename: string): string {
  const path = join(DEVOPS_CONTEXT_DIR, filename);
  if (!existsSync(path)) {
    // Fallback to workspace-relative path for backwards compatibility
    const workspacePath = resolve(process.env.HERMES_WORKSPACE_DIR ?? ".", "context/devops-manager", filename);
    if (existsSync(workspacePath)) {
      return readFileSync(workspacePath, "utf-8");
    }
    return `[Context file not found: ${filename}] (looked in: ${DEVOPS_CONTEXT_DIR})`;
  }
  return readFileSync(path, "utf-8");
}
```

**Changes**:
1. Made path configurable via `HERMES_DEVOPS_CONTEXT_DIR` environment variable
2. Default is `context/devops-manager` relative to the plugin source (so it's portable)
3. Added fallback to `HERMES_WORKSPACE_DIR` for backwards compatibility
4. Error message now shows which paths were checked

---

## ADD CONTEXT FILES TO PACKAGE

Create the context directory and add placeholder files so the plugin works out of the box:

**Directory**: `v2.3.1-build/context/devops-manager/`

Create these files:
- `MENTAL_MODEL.md` — DevOps mental model for the agent
- `INDEX.md` — Agent capabilities index
- `AUDIT_FRAMEWORK.md` — Audit methodology
- `PATTERNS.md` — DevOps patterns
- `VERIFICATION.md` — Verification procedures
- `ESCALATION.md` — Escalation procedures
- `HERMES_AGENT_PLUGIN.md` — Plugin reference
- `README.md` — Overview

If real content isn't available yet, use placeholders that explain what should be there:
```markdown
# MENTAL_MODEL.md

## DevOps Manager Mental Model

[PLACEHOLDER — Replace with actual DevOps Manager mental model content]

The DevOps Manager is the primary agent responsible for:
- Autonomous full-stack development with mechanical enforcement
- TDD-first implementation
- Quality gates and phase verification
- Delegation to specialized sub-agents

...
```

---

## VERIFICATION

```bash
# 1. Verify HERMES_DEVOPS_CONTEXT_DIR is referenced
grep -n "HERMES_DEVOPS_CONTEXT_DIR" v2.3.1-build/src/config/devops-manager.ts
# Expected: at least 2 occurrences (get + use)

# 2. Verify fallback exists
grep -n "HERMES_WORKSPACE_DIR" v2.3.1-build/src/config/devops-manager.ts
# Expected: at least 1 occurrence

# 3. Verify context directory exists
ls -la v2.3.1-build/context/devops-manager/
# Expected: directory with MENTAL_MODEL.md, INDEX.md, etc.

# 4. Build succeeds
cd v2.3.1-build && bun build.ts && echo "BUILD_OK"
# Expected: BUILD_OK
```

---

## MECHANICAL ENFORCEMENT CHECKLIST

- [ ] `HERMES_DEVOPS_CONTEXT_DIR` env var is checked in devops-manager.ts
- [ ] Default path is relative to plugin source (not hardcoded Leviathan path)
- [ ] Error message shows which paths were checked
- [ ] `context/devops-manager/` directory exists with all required files
- [ ] `bun build.ts` exits 0

