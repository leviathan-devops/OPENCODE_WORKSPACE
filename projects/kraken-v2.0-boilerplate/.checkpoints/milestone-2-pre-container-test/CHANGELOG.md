# CHANGELOG - MILESTONE 2

## Date: 2026-04-14
## Status: Pre-Container-TUI-Testing

## Verification Complete

**opencode-python3 image verified:**
- Python 3.12.13 installed ✅
- OpenCode 1.4.3 works ✅
- Python accessible via `--entrypoint /usr/bin/python3`

## Next: Container TUI Test

**Test Plan:**
1. Mount Docker socket into test container
2. Run OpenCode TUI with kraken plugin
3. Execute a test task
4. Verify `docker ps` shows spawned containers

**Critical Architecture:**
```
OpenCode TUI (container A) 
  → kraken plugin
    → spawn('python3', [wrapper.py])
      → docker run opencode-python3 (container B)
```

**Wrapper Path Resolution:**
- Uses `import.meta.url` → `__dirname` (ESM pattern)
- Resolves to `dist/` → `../../subagent-manager/wrappers/opencode_agent.py`
