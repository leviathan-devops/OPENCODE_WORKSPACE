# KRAKEN V2.0 — SESSION STATE TRACKER

**UPDATE EVERY 15-20K TOKENS** | **Last Updated:** 2026-04-13

---

## CURRENT PHASE
- [ ] PLAN
- [x] **BUILD** — Fixing wrapper daemon execute endpoint
- [ ] TEST
- [ ] VERIFY
- [ ] SHIP

---

## STREAM OF CONSCIOUSNESS

**What:** Building v2.0 — fixing catastrophic failure where v2.0 was hollow shell with fake execution. Now implementing REAL Docker container spawning via HTTP daemon wrapper on port 18086.

**Where:** Debugging wrapper daemon execute endpoint — returns success: false when health works

**Next:** Fix wait_healthy() timing or JSON lines parsing, then test full end-to-end delegation

---

## ACTIVE ISSUE

**Wrapper daemon `/execute` returns `success: false`**

| Component | Status |
|-----------|--------|
| Daemon starts | ✅ |
| Health endpoint | ✅ |
| Container spawns | ✅ |
| Manual docker exec | ✅ |
| Execute endpoint | ❌ |

**Likely cause:** wait_healthy() returns false incorrectly OR JSON lines parsing issue

---

## TOKEN MANAGEMENT

- **Current threshold:** ~170-175K tokens (OpenCode auto-compacts)
- **Tier 0 (65%/~110K):** Light pruning
- **Tier 1 (140-150K):** Pre-export via `experimental.session.compacting` hook
- **Tier 2 (170-175K):** Auto-compaction
- **Tier 3:** Post-compact reinjection

**Update this file every 15-20K tokens**

---

## PROJECT STATE

| Component | Size | Status |
|-----------|------|--------|
| kraken-agent dist | 199 KB | ✅ REAL |
| shark-agent dist | 569 KB | ✅ REAL |
| manta-agent dist | 158 KB | ✅ REAL |
| **TOTAL** | **~926 KB** | ✅ PROPER |

**v2.0 was 52KB (HOLLOW) → Now 926KB (REAL)**

---

## V2.0 UNDERSTANDING (UNIFIED)

v2.0 = v1.2 triple-brain + 5 optimizations from Shark v4.8.3:

1. **Two-Layer Firewall** — Tool + Message enforcement
2. **Mechanical Output Verification** — fs.existsSync() checkpoints
3. **Structured Override Commands** — Typed schema
4. **Explicit Gate Criteria** — Per-brain requirements
5. **4-Tier Context Management** — Compaction prevention + survival

**v1.0 functionality PRESERVED (optimized, not replaced)**

---

## DEBUG COMMANDS

```bash
# Build plugin
cd /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent-v2.0
bun build src/index.ts --outdir dist --target bun --format esm --bundle

# Start daemon
nohup python3 .../kraken-agent-v2.0/subagent-manager/wrappers/kraken-agent-wrapper.py > /tmp/kraken-wrapper.log 2>&1 &

# Check
curl http://localhost:18086/health
curl -X POST http://localhost:18086/execute -H "Content-Type: application/json" -d '{"task": "echo hello", "model": "qwen", "timeout": 30}'

# Test plugin
opencode --print-logs run "test" --agent default
```

---

## NEXT STEPS

1. **FIX:** Debug wrapper execute endpoint
2. **TEST:** Full end-to-end delegation
3. **BUILD:** Two-Layer Firewall
4. **BUILD:** Mechanical Output Verification
5. **BUILD:** Compaction hook system
6. **TEST:** In TUI container

---

## FILE LOCATIONS

- **Build:** `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent-v2.0/`
- **Knowledge Base:** `../COMPACTION SURVIVAL/00_COMPACTION_PROOF_KNOWLEDGE_BASE.md`
- **V2.0 Docs:** `../V2.0 Optimized/Working Context Library/`
- **Plugin Engineering:** `../Plugin Engineering/MASTER CONTEXT/`
- **Debug Logs:** `/home/leviathan/OPENCODE_WORKSPACE/DEBUG LOGS/13-kraken-*/`
- **Wrapper Log:** `/tmp/kraken-wrapper.log`

---

## THE ONE RULE

**IF IT'S NOT REAL, IT'S NOT DONE.**

---

**END OF SESSION STATE**