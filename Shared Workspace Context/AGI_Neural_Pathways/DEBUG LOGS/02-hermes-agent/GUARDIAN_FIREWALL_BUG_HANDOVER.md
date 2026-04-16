# GUARDIAN FIREWALL BUG — HANDOFF DOCUMENT

**Date:** 2026-04-02  
**Status:** BUG REPORTED — Requires Investigation & Fix  
**Reported By:** Leviathan  
**Systems Involved:** Spider Agent, Hermes Agent Plugin, Guardian Firewall  

---

## 1. BUG DESCRIPTION

### The Incident
The Guardian Firewall is **blocking ALL edits** — Hermes agents and the user cannot make any changes to files. This is the inverse of the intended behavior.

### Root Cause (Suspected)
The Guardian Firewall enforcement layer is inverted — it's blocking allowed agents (Hermes, User) instead of blocking only the OpenCode agents. The firewall rules need to be flipped so that:
- **ALLOW** Hermes agents and User to edit
- **BLOCK** OpenCode agents (Spider, Coder, Reviewer, etc.)

### Expected Behavior
- **Hermes agents** (initialized from Hermes CLI) → FULL ACCESS to Hermes workspace (NO restrictions)
- **User** (direct CLI access) → FULL ACCESS to Hermes workspace (NO restrictions)
- **OpenCode agents** (Spider, Coder, Reviewer, etc.) → BLOCKED from writing to Hermes workspace root

### Actual Behavior (THE BUG)
The Guardian Firewall is blocking EVERYONE — Hermes agents AND the user are completely blocked from making edits. This is the opposite of the intended behavior.

The firewall is over-blocking:
1. Hermes agents cannot edit files in their own workspace
2. The user cannot edit files directly
3. Only OpenCode agents with explicit authority can write — but even those are blocked

---

## 2. SYSTEM CONTEXT

### Spider Agent (OpenCode Orchestrator)
| Property | Value |
|----------|-------|
| **Role** | Lead orchestrator for OpenCode multi-agent workflows |
| **Plugin** | `spider-agent` (formerly `shark-agent-v4`) |
| **Agent Prefix** | `spider` |
| **Plugin Entry** | `~/.config/opencode/node_modules/spider-agent/dist/index.js` |
| **Authority** | Full access except `.swarm/plan` files |

### Hermes Agent Plugin
| Property | Value |
|----------|-------|
| **Location** | `~/OPENCODE_WORKSPACE/Shared Workspace Context/Hermes Agent Plugin/` |
| **Plugin Source** | `src/` (68 TypeScript files) |
| **Compiled Output** | `dist/index.js` (14,850 lines, 515KB) |
| **Build Command** | `bun build.ts` |
| **Framework** | @opencode-ai/plugin v1.1.53 |

### Guardian Firewall Reference
- **Reference Repo:** https://github.com/leviathan-devops/guardian-firewall
- **Purpose:** On-device firewall blocking non-Hermes agents from writing to protected paths
- **Protected Paths (Expected):**
  - `~/.hermes/` — Hermes agent memory and context
  - `~/OPENCODE_WORKSPACE/Shared Workspace Context/Hermes Agent Plugin/` — Hermes workspace root

---

## 3. RELATED SYSTEMS & FILES

### Spider Agent Files
```
~/agent-swarm/spider-agent/              # Plugin source
~/.config/opencode/opencode-swarm.json   # Project swarm config
~/.config/opencode/opencode.json          # Main config
```

### Hermes Agent Plugin Files
```
~/OPENCODE_WORKSPACE/Shared Workspace Context/Hermes Agent Plugin/
├── src/                                 # 68 TypeScript source files
├── dist/index.js                        # Compiled plugin
├── BUILD/                               # Build documentation
├── HOOKS/                               # 28 hooks (composed to 6 points)
├── AGENTS/                              # 19 agent prompts
├── TOOLS/                               # 28 tools
└── v2-build/                            # Secondary build
```

### Guardian/Firewall Files
```
projects/shark-agent-plugin/src/enforcement/enforcer.ts
projects/shark-agent-plugin/src/safety/safety-stack.ts
projects/shark-agent-plugin/src/extracted/tools/firewall-mesh_v2.ts
projects/shark-frankenstein/src/tools/firewall-mesh_v2.ts
```

---

## 4. AUTHORITY RULES (Current Spider Agent)

From `CONTEXT_LIBRARY.md`:

| Agent | Write Access | Restrictions |
|-------|-------------|--------------|
| `spider` | Full | Cannot write `.swarm/plan.md`, `.swarm/plan.json`, generated zones |
| `build` | Full | No restrictions — native OpenCode agent |
| `plan` | Read-only | Cannot write any files |
| `coder` | Limited | Only `src/`, `tests/`, `docs/`, `scripts/`; blocked from `.swarm/` |
| `reviewer` | Limited | Only `.swarm/evidence/`, `.swarm/outputs/`; blocked from `src/` |
| Unknown | Blocked | Must be in AGENT_AUTHORITY_RULES to write |

**Note:** These authority rules apply to `.swarm/` directories but do NOT protect the Hermes workspace root.

---

## 5. KEY LESSONS (From Spider Agent Context Library)

1. **MiniMax API**: Endpoint is `api.minimaxi.IO` (not `.com`), auth is `x-api-key` header
2. **Reviewer agent bug**: Task tool submissions stay idle forever — use SME as workaround
3. **VLLM auto-restart**: Was consuming GPU memory via systemd timer — disabled
4. **Context sandboxing**: Each session is a distinct "head", shared memory is subconscious
5. **Agent Swarm vs Plugin**: Agent Swarm (port 3013) and spider-agent plugin are completely separate systems
6. **Model format**: Must match OpenCode's internal provider format

---

## 6. REQUIRED INVESTIGATION

### Questions to Answer
1. Is the Guardian Firewall currently deployed/enabled?
2. What paths is the Guardian Firewall configured to protect?
3. How does the Spider Agent's authority rules interact with firewall rules?
4. Can Spider Agent (as orchestrator) bypass file permission checks?
5. Should the Hermes workspace root be added to the Guardian Firewall's protected paths?

### Investigation Steps
```bash
# 1. Check if Guardian Firewall is active
grep -r "guardian\|firewall" ~/.config/opencode/plugins/ 2>/dev/null

# 2. Check Spider Agent authority rules in compiled dist
grep -A 20 "AGENT_AUTHORITY_RULES" ~/.npm-global/lib/node_modules/spider-agent/dist/index.js

# 3. Check Hermes workspace permissions
ls -la "~/OPENCODE_WORKSPACE/Shared Workspace Context/Hermes Agent Plugin/"

# 4. Check for any recent unauthorized file writes
find ~/OPENCODE_WORKSPACE/Shared\ Workspace\ Context/Hermes\ Agent\ Plugin/ -mtime -1 -type f

# 5. Check Guardian Firewall source
cat projects/shark-agent-plugin/src/enforcement/enforcer.ts
```

---

## 7. SUGGESTED FIX APPROACH

### The Fix Required
**Flip the firewall logic** — Currently it blocks everyone, but it should:
- **ALLOW**: Hermes agents + User (whitelisted)
- **BLOCK**: OpenCode agents (blacklisted)

### Option A: Flip the Guardian Firewall Rules
Update the firewall to use a whitelist approach:
```
ALLOWED_AGENTS = ["hermes", "user"]  # Full access
BLOCKED_AGENTS = ["spider", "coder", "reviewer", "test_engineer", ...]  # Blocked
```

### Option B: Check Agent Origin Instead of Agent Name
The firewall should distinguish HOW the agent was initialized:
- **Hermes CLI** → `isHermesAgent = true` → ALLOW
- **OpenCode CLI** → `isHermesAgent = false` → BLOCK (unless explicitly allowed)
- **User** (direct terminal) → ALLOW

Implementation would check `process.env.HERMES_CLI` or similar flag vs `OPENCODE_SESSION`.

### Option C: Hook-Level Bypass for Hermes/User
Add a `pre-firewall` hook that runs before the blocking hook and bypasses the block for:
```typescript
if (isHermesAgent() || isDirectUser()) {
  return; // Skip firewall, allow immediately
}
```

---

## 8. KEY REQUIREMENTS (From Leviathan)

1. **Hermes agents** → FULL ACCESS with ZERO restrictions
2. **User** → FULL ACCESS with ZERO restrictions  
3. **OpenCode agents** → BLOCKED from Hermes workspace root

**The firewall should ONLY block OpenCode agents. Hermes and User must never be blocked.**

---

## 9. HANDOFF CHECKLIST

- [ ] Verify current firewall logic — confirm it IS blocking Hermes/User (bug confirmed)
- [ ] Identify WHERE in the code the blocking logic exists
- [ ] Determine how to distinguish Hermes agents from OpenCode agents
- [ ] Implement fix to flip logic — ALLOW Hermes/User, BLOCK OpenCode agents
- [ ] Test fix — verify Hermes can edit, verify OpenCode agents are blocked
- [ ] Verify User can still edit directly (not via agent)
- [ ] Document the fix and new expected behavior

---

## 9. RELEVANT DOCUMENTATION

| Document | Location |
|----------|----------|
| Spider Agent Context Library | `Shared Workspace Context/Spider Agent/CONTEXT_LIBRARY.md` |
| Hermes Agent Plugin Handover | `Shared Workspace Context/Hermes Agent Plugin/BUILD/HERMES_HANDOVER.md` |
| Spider Agent Forensic Report | `Shared Workspace Context/Hermes Agent Plugin/v2-build/REFERENCE/SPIDER_AGENT_FORENSIC_REPORT.md` |
| Guardian Firewall Repo | https://github.com/leviathan-devops/guardian-firewall |

---

## 10. CONTACT & CONTEXT

**Original Report:** Leviathan (via OpenCode session 2026-04-02)  
**Reference Session:** conversation/session_id `20260402_020807_932998`  
**Guardian Firewall Repo:** https://github.com/leviathan-devops/guardian-firewall

---

**Handover Complete**  
**Next Action:** Flip Guardian Firewall logic — make it block OpenCode agents while allowing Hermes agents and User unrestricted access  
**Priority:** CRITICAL — Hermes agents and User are currently completely blocked from making any edits
