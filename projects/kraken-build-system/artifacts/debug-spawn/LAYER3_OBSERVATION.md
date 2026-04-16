# LAYER 3: OBSERVATION & EVIDENCE

**Problem Being Solved:** `opencode run 'hello'` failed with `TypeError: schema._zod.def`

---

## 3.1 Raw Evidence

**Error with full config (shark + manta agents):**
```
TypeError: undefined is not an object (evaluating 'schema._zod.def')
      at process (/$bunfs/root/src/index.js:13485:28)
      at toJSONSchema (/$bunfs/root/src/index.js:14173:14)
```

**Success after removing shark + manta from config:**
```
[Kraken Agent] initialized { clusterCount: 3, totalAgents: 11, krakenHiveReady: true }
> build · MiniMax-M2.7-highspeed
Error: Anthropic API key is missing...
```

---

## 3.2 Root Cause

The `opencode-config.json` referenced:
- `file:///root/.config/opencode/plugins/shark-agent/dist/index.js`
- `file:///root/.config/opencode/plugins/manta-agent/dist/index.js`

These directories exist but the `dist/index.js` files don't exist at those paths. OpenCode was trying to load non-existent plugin files and failing during schema processing.

---

## 3.3 Fix Applied

Removed shark-agent and manta-agent from config. Only kraken-agent and subagent-manager remain.

**Before:**
```json
"plugin": [
  "file:///root/.config/opencode/plugins/kraken-agent/dist/index.js",
  "file:///root/.config/opencode/plugins/subagent-manager/dist/index.js",
  "file:///root/.config/opencode/plugins/shark-agent/dist/index.js",
  "file:///root/.config/opencode/plugins/manta-agent/dist/index.js"
]
```

**After:**
```json
"plugin": [
  "file:///root/.config/opencode/plugins/kraken-agent/dist/index.js",
  "file:///root/.config/opencode/plugins/subagent-manager/dist/index.js"
]
```

---

## 3.4 Verification

```bash
docker run --rm kraken-v2.0-ship-test:latest bash -c "opencode run 'hello' 2>&1"
# Result: Error: Anthropic API key is missing... (expected, no API key configured)
# The Zod error is GONE.
```
