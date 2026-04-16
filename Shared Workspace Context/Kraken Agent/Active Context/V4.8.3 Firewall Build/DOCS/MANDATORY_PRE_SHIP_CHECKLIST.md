# MANDATORY PRE-SHIP CHECKLIST

**READ THIS BEFORE EVERY SHIP**

---

## ⚠️ THE GOLDEN RULE

> **If you did not test it in a TUI container, it is NOT tested.**

`opencode run` has broken hooks. Only TUI mode works.

---

## PHASE 1: CODE REVIEW

### Hook Format (CRITICAL)
```typescript
// ❌ WRONG - array not supported
'hook.name': [hook1, hook2]

// ✅ CORRECT - chain internally
'hook.name': async (input, output) => {
  await hook1(input, output);
  await hook2(input, output);
}
```

### Valid Hook Events Only
- `session.created` ✅
- `chat.message` ✅
- `tool.execute.before` ✅
- `tool.execute.after` ✅

**DO NOT USE:**
- `session.ended` ❌ (not a valid event)
- `experimental.*` ⚠️ (unless explicitly documented)

### Agent Registration (CRITICAL)
```typescript
config: async (opencodeConfig) => {
  if (!opencodeConfig.agent) {
    opencodeConfig.agent = {};
  }
  Object.assign(opencodeConfig.agent, agents);
}
```

---

## PHASE 2: BUNDLE VERIFICATION

```bash
# Check size
ls -la dist/index.js  # Should be 50-60KB

# Check exports
grep -c "createToolSummarizerHook" dist/index.js  # Should find definition

# Check no experimental hooks
grep "experimental.session" dist/index.js  # Should find nothing or be careful
```

---

## PHASE 3: TUI CONTAINER TEST (MANDATORY)

### Build Custom Docker Image
```bash
# Clone OpenCode
git clone https://github.com/anomalyco/opencode.git opencode-test
cd opencode-test

# Build Docker image (must match local version 1.4.3)
docker build -t opencode-test:local .
```

### Test Sequence
```bash
# 1. Create test config directory
TEST_DIR="/tmp/ship-test-$(date +%s)"
mkdir -p "$TEST_DIR/config/plugins"

# 2. Copy local config
cp -a ~/.config/opencode "$TEST_DIR/config"

# 3. Copy plugin under test
cp -r /path/to/plugin/dist "$TEST_DIR/config/plugins/my-plugin"

# 4. Update config to ONLY have test plugin
cat > "$TEST_DIR/config/opencode.json" << 'EOF'
{
  "plugin": [
    "file:///root/.config/opencode/plugins/my-plugin/dist/index.js"
  ]
}
EOF

# 5. Start container
docker run --rm -d --name ship-test \
  -v "$TEST_DIR/config":/root/.config/opencode \
  opencode-test:local \
  sleep infinity

# 6. Test in TUI
docker exec -it ship-test \
  /usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64/bin/opencode \
  --agent my-agent

# 7. Inside TUI:
#    - Check agent appears in tab toggle
#    - Run /my-status tool
#    - Run a basic command (ls, grep)
#    - Check memory: htop or free -h

# 8. Cleanup
docker kill ship-test
```

---

## PHASE 4: CROSS-PLUGIN TEST (MANDATORY)

### Test with Manta
```bash
# Update config
cat > "$TEST_DIR/config/opencode.json" << 'EOF'
{
  "plugin": [
    "file:///path/to/manta/dist/index.js",
    "file:///path/to/my-plugin/dist/index.js"
  ]
}
EOF

# Restart container and test:
# - Manta in tab toggle? YES/NO
# - My agent in tab toggle? YES/NO
# - Tools work for Manta? YES/NO
# - Tools work for my agent? YES/NO
```

### Test with Shark
```bash
# Add Shark to config
# Repeat tests
```

---

## PHASE 5: MEMORY CHECK

```bash
# Before plugin load
free -h

# After plugin load
free -h

# If used memory > 80%, DO NOT SHIP
```

---

## PHASE 6: PRODUCTION DEPLOY

### Pre-Deploy Backup
```bash
cp ~/.config/opencode/opencode.json ~/.config/opencode/opencode.json.backup-$(date +%s)
```

### Deploy
```bash
# Copy new plugin
cp -r /path/to/plugin/dist ~/.config/opencode/plugins/my-plugin/

# Update config (ADD, don't replace)
# Edit opencode.json to add new plugin
```

### Post-Deploy
- [ ] Restart OpenCode completely
- [ ] Check all agents in tab toggle
- [ ] Test basic tool use
- [ ] Monitor for 5 minutes

### Rollback if Issues
```bash
cp ~/.config/opencode/opencode.json.backup-* ~/.config/opencode/opencode.json
# Restart OpenCode
```

---

## SIGN-OFF REQUIREMENTS

Before any ship, you must have:
- [ ] TUI container test PASSED
- [ ] Cross-plugin test with Manta PASSED
- [ ] Cross-plugin test with Shark PASSED
- [ ] Memory check PASSED (< 80%)
- [ ] All agents visible in tab toggle
- [ ] Tools work for each agent

**If any item is unchecked: DO NOT SHIP**

---

**END OF CHECKLIST**
