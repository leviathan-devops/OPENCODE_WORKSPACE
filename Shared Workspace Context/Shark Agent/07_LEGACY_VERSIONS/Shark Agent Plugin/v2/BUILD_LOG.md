# SHARK Agent v2 Plugin Build Log

**Date:** March 31, 2026
**Version:** 2.0.0
**Location:** `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Shark Agent Plugin/v2`

---

## Build Issue Found

**Problem:** OpenCode was trying to install `shark-agent-v2` from npm registry instead of loading from local path.

**Error from logs:**
```
ERROR: GET https://registry.npmjs.org/shark-agent-v2 - 404 failed to install plugin
```

**Fix:** Changed plugin config from `"shark-agent-v2"` to absolute path:
```json
"plugin": [
    "/home/leviathan/.opencode/plugins/shark-agent-v2",
    "/home/leviathan/.opencode/plugins/opencode-flowspec"
]
```

---

## Directory Structure

```
v2/
├── src/
│   ├── coordinator/
│   │   ├── coordinator-micro.ts    # MicroCoordinator (MiniMax M2.7 + GLM 5)
│   │   └── coordinator-manager.ts   # CoordinatorManager
│   ├── guardian/
│   │   └── index.ts               # Guardian filesystem protection
│   ├── safety/
│   │   └── safety-enforcer.ts     # SafetyEnforcer (commands, patterns)
│   ├── workflow/
│   │   └── machine.ts             # WorkflowMachine (5-step state)
│   ├── types/
│   │   ├── coordinator-types.ts    # SharkMode, WorkflowStep, etc.
│   │   └── safety-types.ts        # SafetyCheck, etc.
│   └── index.ts                   # Main plugin entry
├── dist/
│   └── index.js (0.48 MB bundled)
├── test/
│   └── enforcement.test.ts        # 26 tests
├── package.json
└── BUILD_LOG.md (this file)
```

---

## Plugin Architecture

### Dual-Brain Architecture
- **Executive Brain:** MiniMax M2.7 (planning, reasoning, orchestration)
- **Mechanical Executor:** GLM 5/4.7 (dumb-coding tasks)

### 5-Step Workflow (BRICK WALL)
1. **PLAN** - Create .shark/plan.md, .shark/claims.json
2. **BUILD** - Write actual code, create .shark/build-manifest.json
3. **TEST** - Stage 1 & Stage 2 tests
4. **VERIFY** - 3 Gates: Functional, Intent, Security
5. **SHIP** - Generate .shark/SHIP_REPORT.md

### Guardian Protection
- Blocks: /etc, /usr, /bin, /sbin, /proc, /sys, ~/.ssh, ~/.aws, etc.
- Zones: WORKSPACE (allow), SANDBOX (allow), SYSTEM (deny), PERSONAL (deny)

### SafetyEnforcer
- Blocks dangerous commands: `rm -rf /`, `curl | sh`, etc.
- Warns on theatrical patterns: mock, simulat, TODO, FIXME, HACK, stub, fake
- Warns on hardcoded secrets: api_key, password, token, aws_secret

---

## Tests: 26/26 Passing

```
🦈 SHARK v2 - BUILD VERIFICATION

Guardian Protection
  ✅ BLOCKS system paths (/etc)
  ✅ BLOCKS /usr/bin
  ✅ BLOCKS personal paths (~/.ssh)
  ✅ ALLOWS workspace paths
  ✅ ALLOWS .shark directory
  ✅ classifyPath returns correct zones

SafetyEnforcer - Command Blocking
  ✅ BLOCKS: rm -rf /
  ✅ BLOCKS: curl | sh pipe
  ✅ ALLOWS: npm install
  ✅ WARNS: theatrical patterns (mock)
  ✅ WARNS: hardcoded API key in file

Workflow State Machine
  ✅ STARTS at PLAN step
  ✅ CANNOT advance to BUILD without artifacts
  ✅ CAN advance to BUILD with plan + claims
  ✅ CANNOT advance to TEST without build manifest
  ✅ COMPLETE workflow with all artifacts
  ✅ RESTRICTIONS: run_command blocked in PLAN
  ✅ RESTRICTIONS: write_file blocked in TEST
  ✅ RESTRICTIONS: run_command blocked in VERIFY
  ✅ RESET returns to PLAN
  ✅ PROGRESS tracking
  ✅ REQUIRED artifacts per step

Integration: Full Stack
  ✅ BLOCKED: Write to /etc in PLAN mode
  ✅ BLOCKED: System command in PLAN step
  ✅ ALLOWED: Write to workspace in BUILD
```

---

## OpenCode Integration

### Agent Mode Registration (Found in opencode-ultra.json)
Custom agents are defined in the `agents` config section:
```json
"agents": {
    "shark": {
        "model": "0-minimax/MiniMax-M2.7",
        "description": "Shark Agent v2 - Mechanical enforcement with 5-step workflow"
    }
},
"fragments": {
    "shark": ["/path/to/fragments/shark.md"]
}
```

This makes "shark" appear as a selectable agent mode you can tab through.

### Plugin Loading
- Symlinked to: `~/.npm-global/lib/node_modules/shark-agent-v2`
- Config path: `~/.config/opencode/opencode.json`
- Agent registered in `agents` section

### Plugin Tools
- `shark_toggle` - Toggle Shark Mode on/off/status
- `shark_status` - Get current workflow status
- `shark_step` - Advance or reset workflow step
- `shark_plan` - Record plan and claims artifacts
- `shark_build` - Record build manifest
- `shark_test` - Record test results (stage 1/2)
- `shark_verify` - Record verification gates
- `shark_ship` - Record ship report

### Hooks
- `chat.start` - Initialize session
- `chat.params` - Inject system prompt, switch models
- `tool.execute.before` - Safety + workflow checks
- `tool.execute.after` - Record command executions

---

## Next Steps

1. Launch OpenCode with fix applied
2. Verify shark toggle appears in UI
3. Run `/shark_toggle on` to activate Shark mode
4. Follow 5-step workflow for actual builds

---

## References

- SHARK-MASTER-PROMPT.md: `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Agent OS/SHARK-MASTER-PROMPT.md`
- SHARK-REASONING-CHAIN.md: `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Agent OS/SHARK-REASONING-CHAIN.md`
