# MENTAL MODEL — SHARK AGENT V4 V1.1 BUILD

## T1 Thinking Process

When building V1.1, think at this level:

---

### "Why doesn't V1.0's Guardian work?"

Because `guardian.canWrite()` is a method on a JavaScript object. If nothing calls that method, it never runs. OpenCode's hook system is the only mechanism that intercepts tool execution. V1.0 creates a Guardian instance but **never registers any hook that calls it**.

### "Why doesn't the GateManager advance?"

Same reason. `gateManager.transitionTo()` exists but no code path leads to it. In V1.0, the only way to advance a gate is if the agent calls `shark-gate --action advance` on itself — which is the agent deciding to pass its own gate. That's theatre, not enforcement.

### "What is the hook system actually doing?"

OpenCode fires hooks at specific events:
- `tool.execute.before` → fires BEFORE any tool runs. Return `{ blocked: true }` to prevent execution.
- `tool.execute.after` → fires AFTER any tool completes. Collect evidence here.
- `session.created` → fires when a new agent session starts. Initialize state here.
- `session.compacting` → fires when context is about to compress. Snapshot state here.
- `chat.system.transform` → fires when building the system prompt. Inject context here.

These are not optional conveniences — they are the **ONLY way** to make Shark V4's enforcement real.

---

### "Why does shark-context need deployment?"

Because V1.0 put shark-context inside the plugin directory. When the agent runs, its working directory is the user's workspace (e.g., `/home/leviathan/OPENCODE_WORKSPACE/`). The agent's `read_file` tool cannot reach into the plugin's `node_modules/shark-agent-v4/shark-context/` path by default. The context must be deployed to `{workspace}/.shark/shark-context/` or another accessible location.

---

### "What's wrong with 4 T1 prompts concatenated?"

Shark-macro's instructions are:
```
EXECUTION_BRAIN_T1 (starts with "You are the Execution Brain...")
REASONING_BRAIN_T1 (starts with "You are the Reasoning Brain...")
SYSTEM_BRAIN_T1 (starts with "You are the System Brain...")
PLAN_BRAIN_MACRO_T1 (starts with "You are the Plan Brain...")
```

Four "YOU ARE" directives. One agent. Conflicting personalities, conflicting priorities, conflicting operational rules. This is not "triple-brain racing" — it's one agent with multiple personality disorder.

For V1.1, the honest fix is: the macro agent's instructions should be ONE primary brain T1. The other "brains" exist as T2 reference material injected via `chat.system.transform`, not as competing T1 directives.

---

### "Why is zod a problem in shark-evidence?"

The file has:
```typescript
import { z } from 'zod';
```
But `zod` is not in package.json's dependencies. At runtime, `bun` will fail to resolve this import. Either install zod or remove the zod usage. The simpler fix: use OpenCode's built-in `tool.arg.enum()` pattern instead of z.enum().

---

### "What is the iteration rule really saying?"

The rule: "COPY first → name with iteration suffix → edit the copy"

This means:
1. `cp src/index.ts src/index.v1.1.0.ts`
2. Edit `src/index.v1.1.0.ts` only
3. Only rename to `src/index.ts` after verification passes
4. Never touch `src/index.ts` until the new version is proven

This is not over-engineering — it's the only way to guarantee that if V1.1 breaks something, V1.0 can be restored by renaming files.

---

### "What does 'mechanical verification' mean?"

It means checks with pass/fail outcomes that can be automated:

```bash
# Pass: grep finds the string in the bundle
grep -c "tool.execute.before" dist/index.js

# Fail: grep finds nothing
grep -c "tool.execute.before" dist/index.js
# Expected: count >= 1
```

No human judgment. Either the string is in the bundle or it's not.

---

*This mental model is the T1 context for the V1.1 build agent.*
