# SHIP SOP COMPLIANCE CHECKLIST
## Kraken V2.0 Deployment Verification

**Ship Date:** 2026-04-12
**Ship Version:** 2.0.0
**Checklist Version:** 1.0

---

## 📋 PRE-SHIP CHECKLIST (Mandatory)

### Code Review
- [x] Plugin export is async function
- [x] config function registers agent
- [x] Hooks return object, not array
- [x] Valid hook event names only
- [x] Plugin has onLoad function
- [x] Plugin has name/version
- [x] No syntax errors
- [x] Bundle size reasonable (~52KB)

### Hook Format Verification
- [x] No array format: `[fn1, fn2]`
- [x] Internal chaining: `async (input) => { await fn1(input); await fn2(input); }`
- [x] Valid events: `session.created`, `session.compacting`, `chat.message`, `tool.execute.before`, `tool.execute.after`
- [x] No experimental events: `session.ended` removed

### Agent Registration
- [x] config function present
- [x] KRAKEN_AGENT_CONFIG defined
- [x] Agent name: "kraken"
- [x] Agent mode: "primary"
- [x] Agent color: "#8B5CF6"
- [x] Tools registered: kraken-status, kraken-gate-status

---

## ✅ SHIP GATE CRITERIA

### Build Gate
- [x] Source compiles without errors
- [x] TypeScript has no type errors
- [x] Bundle creates successfully
- [x] Bundle size: 52,429 bytes

### Test Gate
- [x] Plugin loads in fresh session
- [x] Agent appears in list
- [x] Debug agent shows correct config
- [x] Hooks registered (4 hooks)
- [x] Tools available (2 tools)

### Container Gate
- [x] TUI launches with kraken agent
- [x] No errors in container logs
- [x] Other agents still work
- [x] Config not corrupted

### Config Gate
- [x] All plugin paths valid
- [x] No dead plugin entries
- [x] Agent section not overwritten
- [x] Valid JSON format

### Agent Gate
- [x] Kraken appears in `opencode agent list`
- [x] `opencode debug agent kraken` returns config
- [x] Color is correct (#8B5CF6)
- [x] Mode is primary
- [x] Tools present

---

## 🔍 PLUGIN MASTER CONTEXT COMPLIANCE

### Export Format
- [x] Default export is async function
- [x] Function signature: `async function KrakenPlugin(input)`
- [x] Returns Plugin object

### Plugin Structure
```typescript
{
  name: 'kraken-agent-v2.0',
  version: '2.0.0',
  onLoad: () => { ... },
  config: async (opencodeConfig) => { ... },
  hooks: () => ({ ... }),
  tools: () => ({ ... })
}
```

### Hook Implementation
- [x] `event` hook for session lifecycle
- [x] `chat.message` hook for message enforcement
- [x] `tool.execute.before` hook for tool guardian
- [x] `tool.execute.after` hook for gate evaluation
- [x] No experimental hooks

### Cross-Plugin Safety
- [x] Does not overwrite other agent configs
- [x] Does not remove other plugins
- [x] Does not corrupt opencode.json
- [x] Hooks are self-contained

---

## 📊 DEPLOYMENT VERIFICATION

### Installation Check
```bash
ls ~/.config/opencode/plugins/kraken-agent-v2.0/dist/index.js
# Expected: File exists, 52KB
```

### Load Check
```bash
opencode debug config --print-logs 2>&1 | grep kraken
# Expected: [Kraken V2.0] Agent registered
```

### Agent Check
```bash
opencode debug agent kraken 2>&1 | grep name
# Expected: "name": "kraken"
```

### Cross-Agent Check
```bash
opencode debug agent shark 2>&1 | grep name
# Expected: "name": "shark"
```

### Tool Check
```bash
opencode debug agent kraken 2>&1 | grep kraken-status
# Expected: "kraken-status": true
```

---

## 📝 SHIP SIGN-OFF

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Ship Engineer | OpenCode Session | 2026-04-12 | ✅ |
| Reviewer | [NAME] | [DATE] | _________ |
| QA | [NAME] | [DATE] | _________ |

---

## 🔄 ROLLBACK PLAN

### If Issues Found
1. Stop using Kraken V2.0
2. Restore from backup: `/home/leviathan/OPENCODE_WORKSPACE/KRAKEN_BACKUPS/kraken-v2.0-20260412_232458/`
3. Re-run tests
4. If still broken, escalate to Plugin Engineering

### Backup Verification
```bash
# Verify backup exists
ls /home/leviathan/OPENCODE_WORKSPACE/KRAKEN_BACKUPS/kraken-v2.0-20260412_232458/

# Restore if needed
cp -r /home/leviathan/OPENCODE_WORKSPACE/KRAKEN_BACKUPS/kraken-v2.0-20260412_232458/* \
      ~/.config/opencode/plugins/kraken-agent-v2.0/
```

---

**END OF CHECKLIST**