# Plugin Ship Common Sense - MANDATORY ARCHITECTURE

**Date:** 2026-04-12
**Last Updated:** 2026-04-12
**Category:** plugin-engineering
**Tags:** plugin, shipping, deployment, opencode, container, testing
**Lessons:** Shark v4.8.1 FAIL, Shark v4.8.2 SUCCESS, Manta v1.3.5-hotfix, Kraken V2.0

---

## ⚠️ CRITICAL: CONTAINER TESTING RULE (TUI vs run)

**`opencode run` command has BROKEN hooks - NEVER use for testing.**

| Command | Hook Support |
|---------|--------------|
| `opencode run "message"` | ❌ BROKEN - hooks don't fire |
| `opencode serve` | ⚠️ Partial |
| `opencode /workspace` (TUI) | ✅ FULL support |

### Hook Fire Status by Command

```
opencode run (BROKEN):
  - chat.message: ❌ Does NOT fire
  - tool.execute.before: ❌ Does NOT fire  
  - messages.transform: ❌ Does NOT fire
  - command.execute.before: ⚠️ Unreliable

TUI mode (opencode /workspace):
  - chat.message: ✅ Fires
  - tool.execute.before: ✅ Fires
  - tool.execute.after: ✅ Fires
  - messages.transform: ✅ Fires
  - All hooks work correctly
```

### Correct Container Test Command

```bash
# TUI mode ONLY - interactive terminal
docker exec -it container-name \
  /usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64/bin/opencode \
  --agent my-agent --model opencode/big-pickle
```

### Version Mismatch Problem

| Environment | Version |
|-------------|---------|
| Local OpenCode | 1.4.3 |
| Container `ghcr.io/anomalyco/opencode:latest` | 1.3.17 |

**Solution:** Build custom Docker image from local OpenCode to match versions.

---

## THE 5 MANDATORY PLUGIN ARCHITECTURE RULES

Every OpenCode plugin MUST implement these 5 things or it WILL fail:

### Rule 1: AGENT IDENTITY WALL (CRITICAL)

```typescript
// A. Identity check
function isMyAgent(agent: string | undefined): boolean {
  return agent === 'my-agent' || (agent && agent.startsWith('my-agent'));
}

// B. State + setters
let currentAgentName: string | undefined = undefined;
export function setCurrentAgent(a: string | undefined): void { currentAgentName = a; }
export function getCurrentAgent(): string | undefined { return currentAgentName; }

// C. Init on chat.message (has agent field, session.created does NOT)
'chat.message': async (input) => {
  if (isMyAgent(input.agent)) setCurrentAgent(input.agent);
}

// D. Identity wall in ALL other hooks
'tool.execute.before': async (input) => {
  if (!isMyAgent(getCurrentAgent())) return;  // EXIT
}
```

### Rule 2: ONE VERSION PER PLUGIN

```json
"plugin": [
  "file:///path/to/plugin-v2.0/dist/index.js"  // NOT v1.1
]
```

### Rule 3: TOOL SUMMARIZATION

```typescript
'tool.execute.after': [createToolSummarizerHook(), createGateHook()]
// Summarizes 50KB grep → ~200 chars
```

### Rule 4: COMPACTION = FILE RECOVERY ONLY

```typescript
// session.compacting: Write to FILE only
fs.writeFileSync(path.join(dir, 'INJECTION.md'), contextStr);
// DO NOT: output.context.push(contextStr)
```

### Rule 5: SESSION CLEANUP

```typescript
if (event.type === 'session.ended') {
  setCurrentAgent(undefined);
  council = null;
}
```

---

## Critical Rule: ONE VERSION PER PLUGIN

**NEVER load two versions of the same plugin simultaneously.**

Plugins register hooks by name. If v1.1 and v2.0 both register `tool.execute.before`, only one executes (usually first-load-wins, but behavior is undefined). This causes:
- Unpredictable behavior
- State corruption between versions
- Silent failures
- Complete crashes

### Before Shipping V2.0:
1. **REMOVE v1.x references from opencode.json**
2. **Do NOT keep old versions in the plugin array**
3. **V2 must completely replace V1, not coexist**

---

## CRITICAL: Agent Identity Wall (FROM SHARK/MANTA FAILURES)

**Every plugin MUST have agent identity verification in ALL hooks.**

### The Failure (Shark v4.8.1)
```
Problem: setCurrentAgent() was DEFINED but NEVER CALLED.
Impact: getCurrentAgent() always returned undefined.
Result: Guardian identity wall ALWAYS exited early → ALL hooks bypassed.
```

### The Fix (Shark v4.8.2)
```typescript
// In session.created or chat.message hook:
if (isMyAgent(agentName)) {
  setCurrentAgent(agentName);  // MUST BE CALLED!
}

// In EVERY other hook:
if (!getCurrentAgent()) return;  // Identity wall - exit if not our agent
```

### Pattern for Every Plugin
```typescript
// 1. Define identity check
function isKrakenAgent(agent: string | undefined): boolean {
  return agent === 'kraken' || agent?.startsWith('kraken') ?? false;
}

// 2. Initialize on chat.message (has agent field, session.created does NOT)
'chat.message': async (input) => {
  const agentName = input.agent;
  if (isKrakenAgent(agentName)) {
    setCurrentAgent(agentName);
  }
}

// 3. Identity wall in ALL other hooks
'tool.execute.before': async (input) => {
  if (!isKrakenAgent(getCurrentAgent())) return;  // Exit if not our agent
  // ... rest of hook logic
}
```

### Why chat.message NOT session.created?
- `session.created` event does NOT have `agent` field
- `chat.message` event DOES have `agent` field
- Source: Shark v4.8.2 ship fail fix report

---

## Plugin Ship SOP Checklist

### Pre-Ship
- [ ] Build succeeds: `bun run build`
- [ ] Tests pass: `node tests/test-functional.mjs`
- [ ] Bundle size reasonable (no accidentally bundled node_modules)
- [ ] README includes install instructions
- [ ] **Identity wall in ALL hooks**
- [ ] **setCurrentAgent() called on chat.message**

### Deployment
- [ ] Remove OLD version references from opencode.json
- [ ] Place new bundle at intended install path
- [ ] Verify opencode.json points to correct (new) version ONLY
- [ ] Restart OpenCode to reload plugin

### Verification
- [ ] Check OpenCode starts without crash
- [ ] Verify new plugin loads in logs
- [ ] Test at least ONE hook/feature works
- [ ] **Verify agent appears in tab toggle**

---

## Common Mistakes

| Mistake | Why It's Bad |
|---------|--------------|
| Keeping v1 and v2 in plugin array | Hook conflicts, undefined behavior |
| Not rebuilding after changes | OpenCode loads stale bundle |
| Using dist/index.ts instead of .js | Wrong file format |
| Forgetting to update opencode.json | Old version still loaded |
| Not testing in container | Breaks user's production |
| **No identity wall** | **All hooks bypassed, agent disappears from UI** |
| **setCurrentAgent not called** | **getCurrentAgent() returns undefined → identity wall fails** |

---

## File: ~/.config/opencode/opencode.json

Plugin array format:
```json
"plugin": [
  "file:///path/to/plugin/dist/index.js",
  "list"
]
```

**Rules:**
- Each entry is ONE plugin
- Same plugin = one entry (latest version only)
- `list` at end shows loaded plugins

---

## Installation Path Conventions

| Plugin Type | Suggested Path |
|-------------|---------------|
| Third-party | `~/.config/opencode/plugins/{plugin-name}/dist/index.js` |
| Workspace dev | `~/OPENCODE_WORKSPACE/plugins/{plugin-name}/dist/index.js` |
| Bundled with project | Project repo's dist/ folder |

---

## Rollback Procedure

If new version breaks:
1. Remove new version from opencode.json
2. Restore previous bundle (backup before overwrite)
3. Add previous version back to opencode.json
4. Restart OpenCode

**Always keep backups of working plugin bundles.**

---

## Token Optimization (FROM SHARK HOTFIX)

| Tool | Before | After |
|------|--------|-------|
| grep (500 matches) | 50KB | ~200 chars |
| ls (100 entries) | 10KB | ~500 chars |
| read (500 lines) | 25KB | ~5KB |

**Hook pattern:**
```typescript
'tool.execute.after': [createToolSummarizerHook(), createGateHook()]
```

---

## Compaction Pattern (CORRECT)

**DO:** Write recovery file, read on session.created
```typescript
// session.compacting: Write to file only
fs.writeFileSync(path.join(contextDir, 'INJECTION.md'), contextStr);
// DO NOT push to output.context

// session.created: Read recovery file
const recoveryPath = path.join(COMPACTION_CONTEXT_DIR, 'LATEST', 'INJECTION.md');
if (fs.existsSync(recoveryPath)) {
  const content = fs.readFileSync(recoveryPath, 'utf-8');
  // ... restore context
}
```

**DON'T:** Add to output.context (causes bloat)
```typescript
// WRONG - was causing context bloat in v4.7
if (output.context) {
  output.context.push(contextStr);  // DON'T DO THIS
}
```

---

## Container Testing Workflow (MANDATORY)

### Step 1: Create Carbon Copy of Config

```bash
TEST_DIR="/tmp/plugin-test-$(date +%s)"
mkdir -p "$TEST_DIR/config"
cp -a ~/.config/opencode "$TEST_DIR/config"
```

### Step 2: Update Config for Test Plugin

```bash
# Only include the plugin under test
cat > "$TEST_DIR/config/opencode.json" << 'EOF'
{
  "plugin": [
    "file:///root/.config/opencode/plugins/my-plugin/dist/index.js"
  ]
}
EOF
```

### Step 3: Install Plugin

```bash
mkdir -p "$TEST_DIR/config/plugins/my-plugin"
cp -r /path/to/plugin/dist/* "$TEST_DIR/config/plugins/my-plugin/dist/"
```

### Step 4: Build Custom Docker Image (Version Match)

```bash
# Clone local OpenCode and build container image
git clone https://github.com/anomalyco/opencode.git opencode-test
cd opencode-test
docker build -t opencode-test:local .
```

### Step 5: Test in TUI Mode

```bash
# Start container with config mounted
docker run --rm -it \
  -v "$TEST_DIR/config":/root/.config/opencode \
  opencode-test:local \
  --agent my-agent
```

### Step 6: Verify Agent in Tab Toggle

Inside TUI:
1. Look for agent name in dropdown (top-right)
2. Select it
3. Run `/my-status` to verify plugin loads
4. Should show `brain: my-agent` NOT `unknown`

### Blocked Testing Patterns

```
❌ opencode run "test"          # Hooks don't fire!
❌ opencode run "my-status"     # Hooks don't fire!
✅ docker exec ... opencode     # TUI mode
✅ opencode /workspace          # TUI mode
```

---

## Build Verification (MANDATORY BEFORE SHIP)

**Check bundle size to detect missing imports:**
```bash
# Before shipping, verify bundle size
ls -la dist/index.js  # Should be ~50-60KB, not 0 or suspiciously small

# Verify function is in bundle (before minification check)
grep -c "createToolSummarizerHook" dist/index.js  # Should be 2 (def + call)
```

**Critical bug:** Missing import caused tree-shaking:
- `createToolSummarizerHook` NOT imported in index.ts
- Bundler removed it (undefined reference)
- Bundle size dropped 54KB → function missing

**Always verify all function imports exist, even in ESM bundling.**

---

## Custom Docker Image (For Proper Version Match)

### Why ghcr.io/anomalyco/opencode:latest is Wrong

- Container version: 1.3.17
- Local version: 1.4.3
- Mismatch causes TUI to not start properly

### Build Custom Image

```dockerfile
# Dockerfile for local OpenCode
FROM ubuntu:22.04

# Install dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    nodejs \
    npm

# Clone and install OpenCode
RUN git clone https://github.com/anomalyco/opencode.git /opt/opencode
WORKDIR /opt/opencode
RUN npm install && npm run build

ENTRYPOINT ["opencode"]
```

### Alternative: Use opencode serve

```bash
# Start headless server
docker run --rm -d \
  -v "$TEST_DIR/config":/root/.config/opencode \
  -p 8080:8080 \
  ghcr.io/anomalyco/opencode:latest \
  serve --port 8080 --hostname 0.0.0.0

# Then use web interface
# http://localhost:8080
```
