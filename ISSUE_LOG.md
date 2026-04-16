# OpenCode Workspace Issue Log

## 2026-03-29: OpenCode v1.3.4 Config Migration Bug
**Issue**: Sisyphus mode disappeared from fresh sessions after OpenCode update  
**Root Cause**: Breaking change in config directory structure (v1.3.4)  
**Fix**: Config files moved from `~/.config/opencode/opencode/` to `~/.config/opencode/`  
**Documentation**: [OPENCODE_CONFIG_MIGRATION_BUG_20260329.md](./OPENCODE_CONFIG_MIGRATION_BUG_20260329.md)  
**Status**: ✅ RESOLVED

## 2026-03-26: Sisyphus UI Glitch
**Issue**: Terminal corruption when using `ralph_loop` tool  
**Root Cause**: Rapid session creation/deletion per iteration  
**Fix**: Changed to single session reuse for all iterations (Patch v4)  
**Documentation**: See `SISYPHUS_UI_GLITCH_INVESTIGATION.md` in Shared Workspace Context  
**Status**: ✅ FIXED (partially - parallel agents may still cause issues)

## 2026-03-26: Agent Timeout Issues
**Issue**: Multiple timeout hits during complex build tasks  
**Root Cause**: Default 5-minute timeout insufficient for 6-8 minute tasks  
**Documentation**: See `AGENT_TIMEOUT_ANALYSIS.md` in Kraken Ultra/Orchestrator Context  
**Status**: ⚠️ MONITORING (workaround: use longer timeouts for complex tasks)

---

## Issue Resolution Process
1. **Document** issue with timeline, symptoms, and evidence
2. **Investigate** root cause with debugging tools
3. **Implement** fix with backups and verification
4. **Test** in fresh sessions to confirm resolution
5. **Update** this log with findings and status

## Prevention Checklist
- [ ] Backup config before OpenCode updates
- [ ] Check `opencode debug config` after updates
- [ ] Verify `"plugin": ["opencode-ultra"]` is loaded
- [ ] Test fresh sessions after configuration changes
- [ ] Document breaking changes for future reference

---
*Last updated: 2026-03-29*  
*Maintained by: OpenCode Assistant*