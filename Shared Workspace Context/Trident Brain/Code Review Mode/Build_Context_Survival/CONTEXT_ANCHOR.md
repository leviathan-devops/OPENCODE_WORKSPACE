# TRIDENT BRAIN CODE REVIEW MODE — BUILD CONTEXT SURVIVAL
## External Context Anchor — Updated: 2026-04-16

---

## CURRENT STATE SUMMARY

| Item | Status |
|------|--------|
| **Version** | 3.0.1 |
| **Working Project** | `trident-brain-v3.0/` |
| **Reload Anchor** | `Reload Anchor/` (universal recovery point) |
| **Deployed** | `~/.config/opencode/plugins/trident-brain/` |
| **Status** | WORKING ✅ |

---

## ARCHITECTURE

### Core Principle
> **"Trident Code Review Mode is a DOCUMENTATION ENGINE, not a REPAIR ENGINE."**
> - Model is ONLY used to READ code (via fs operations)
> - ALL intelligence is ALGORITHMIC (regex classifiers)
> - NO behavioral prompts
> - BANNED patterns → CRITICAL findings

### Design Philosophy
1. **Algorithmic-First**: All detection via regex + state machines, not AI
2. **Documentation-Only**: Trident NEVER edits, only documents findings
3. **Safety by Design**: Timeouts, memory limits, crash protection built-in
4. **Proof-Based**: Claims verified against filesystem before reporting

---

## PROJECT STRUCTURE

```
/home/leviathan/OPENCODE_WORKSPACE/projects/
└── trident-brain-v3.0/                 # WORKING DEVELOPMENT PROJECT
    ├── src/
    │   ├── index.ts                    # Plugin entry, hooks, commands (768 lines)
    │   └── algorithmic-core.ts         # Patterns, scanners, engines (1699 lines)
    ├── dist/                           # Built plugin
    └── package.json                    # v3.0.1

/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Trident Brain/Code Review Mode/
└── Reload Anchor/                       # UNIVERSAL RELOAD POINT
    ├── src/                           # Current source (v3.0.1)
    ├── dist/                          # Built, ready to deploy
    ├── scripts/
    │   ├── recover.sh                # Full restoration
    │   ├── deploy.sh                 # Deploy to OpenCode
    │   └── build.sh                  # Build from source
    ├── INDEX.md                      # Quick reference
    ├── RECOVERY.md                   # Recovery guide
    └── VERSION_HISTORY.md             # Full changelog
```

---

## ROOT CAUSE: Why Agent Ran Forever (FIXED)

The path parsing regex `/[\/\.\~\w-]+\/?/` matched "audit" in "audit /path" because `\w` matches word characters (a-u-d-i-t). So when you said `"audit /path"`, it parsed `audit` as the path instead of `/path`.

With `audit` as the target:
1. `scanDirectory("audit")` couldn't find files
2. No files → no findings → silent "no files" message
3. But the async promise chain was broken
4. Error handling looped infinitely trying to retry

**Fix in v3.0.1**: Changed regex to only match paths starting with `/`, `.`, or `~`.

---

## PATTERNS DETECTED (v3.0)

### CRITICAL BANNED PATTERNS
| Category | Patterns | Description |
|----------|----------|-------------|
| SIMULATED_EXECUTION | 11 regex | Fake success returns (Promise.resolve({success:true}), setTimeout patterns) |
| THEATRICAL_CODE | 10 regex | TODO stubs, mock data, placeholder comments |
| STUB_CODE | 6 regex | Empty functions returning null/undefined |
| SQL_INJECTION | 4 regex | String concatenation in SQL queries |
| SECRET_EXPOSURE | 4 regex | Hardcoded credentials, API keys |
| XSS | 3 regex | innerHTML without sanitization |
| EMPTY_CATCH | 3 regex | Silent error swallowing |
| HOOK_SPILLOVER | 4 regex | Cross-plugin contamination |
| GLOBAL_STATE | 3 regex | Mutable global variables |
| COMPLEXITY | 2 regex | Function complexity >10 |
| RESOURCE_LEAK | 3 regex | Unclosed event listeners, intervals |

### Total: 50+ regex patterns across 11 categories

---

## CONTAINER TESTING (DOCKER)

All commands verified working:
| Test | Result |
|------|--------|
| status | ✅ |
| help | ✅ |
| audit /path | ✅ |
| verify | ✅ |
| tool hook blocks edit/bash | ✅ |
| tool hook allows test scripts | ✅ |

---

## RECOVERY INSTRUCTIONS

If Trident breaks:

```bash
cd "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Trident Brain/Code Review Mode/Reload Anchor/scripts"
./recover.sh
```

Or manually:
```bash
cp -r "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Trident Brain/Code Review Mode/Reload Anchor/dist/"* \
  ~/.config/opencode/plugins/trident-brain/
```

---

*Last Updated: 2026-04-16*