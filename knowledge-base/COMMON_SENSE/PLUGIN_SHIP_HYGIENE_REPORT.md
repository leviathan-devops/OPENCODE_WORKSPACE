# SHIP HYGIENE REPORT: Kraken V2.0 Plugin Fix

**Date:** 2026-04-12
**Plugin:** kraken-agent-v2.0
**Issue:** Plugin loaded but agents missing from tab toggle
**Root Cause:** Wrong plugin export format + missing agent registration

---

## PROBLEM DIAGNOSIS

### What Was Wrong
1. **Wrong Plugin Export Format**
   ```typescript
   // WRONG (old)
   export default {
     name: 'kraken-agent-v2.0',
     onLoad: () => {...},
     hooks: () => {...},
     tools: () => {...},
   } satisfies Plugin;
   ```

2. **Missing Agent Registration**
   - No `config` callback to register agents
   - Agents not visible in OpenCode tab toggle

3. **Wrong Hook Structure**
   - Hooks should be directly in returned object, not nested

---

## FIX APPLIED

### 1. Correct Plugin Export Format
```typescript
// CORRECT (new)
export default async function KrakenV2Plugin(input: PluginInput): Promise<Hooks> {
  return {
    name: 'kraken-agent-v2.0',
    config: async (opencodeConfig) => {
      // Agent registration here
    },
    // Hooks directly in object
    'tool.execute.before': createToolGuardianHook(),
    'tool.execute.after': createGateHook(),
    // Tools
    tool: kraken.createTools(),
  };
}
```

### 2. Agent Registration via `config` Callback
```typescript
config: async (opencodeConfig: Record<string, unknown>) => {
  const agents = {
    'kraken-v2': {
      name: 'kraken-v2',
      description: 'Kraken V2.0 - Multi-brain orchestrator',
      instructions: '...',
      mode: 'primary',  // REQUIRED for tab toggle
      permission: { task: 'allow' },
      tools: kraken.createTools(),
    },
  };
  
  // Register using Object.assign (OBJECT, not array)
  if (!opencodeConfig.agent) {
    opencodeConfig.agent = { ...agents };
  } else {
    Object.assign(opencodeConfig.agent, agents);
  }
}
```

### 3. Critical Requirements for Tab Toggle
- **`mode: 'primary'`** - Makes agent visible in tab toggle
- **No `model` field for primary agents** - Let OpenCode resolve model
- **Use `Object.assign`** - Agents must be object, not array
- **`config` callback required** - SDK ignores plain `agent` array

---

## SHIP CHECKLIST (Pre-Flight)

### BEFORE Building
- [ ] Plugin exports **async function** returning `Hooks`
- [ ] `config` callback present for agent registration
- [ ] `mode: 'primary'` set for tab toggle agents
- [ ] No `model` field on primary agents
- [ ] `Object.assign` used for agent registration

### BEFORE Deploying
- [ ] Remove OLD version from `opencode.json`
- [ ] Build succeeds: `bun run build`
- [ ] Bundle size reasonable (~50KB, not 0 bytes)
- [ ] Path in `opencode.json` points to `dist/index.js`

### AFTER Deploying
- [ ] Restart OpenCode (full restart)
- [ ] Check agent appears in tab toggle
- [ ] Test at least one tool works
- [ ] Verify no console errors

---

## COMMON FAILURE PATTERNS

### Silent Failures (No Error, No Agent)
1. **Missing `config` callback** - SDK ignores plain `agent` array
2. **Wrong `mode` value** - Must be `'primary'` not `'subagent'`
3. **Array instead of object** - `agent: [{...}]` fails silently

### Plugin Loads But Crashes
1. **Wrong export format** - Must be async function, not object
2. **Missing imports** - `PluginInput`, `Hooks` types
3. **Hook key typos** - Exact: `'tool.execute.before'`

### Tab Toggle Empty
1. **Multiple versions loaded** - Remove old from `opencode.json`
2. **Path wrong** - Must be `dist/index.js`, not folder
3. **Not rebuilt** - Always rebuild after source changes

---

## REFERENCE: Correct Plugin Template

```typescript
import type { Plugin, Hooks, PluginInput } from '@opencode-ai/plugin';

export default async function MyPlugin(input: PluginInput): Promise<Hooks> {
  // Initialize
  
  return {
    name: 'my-plugin',
    version: '1.0.0',
    
    // REQUIRED for tab toggle
    config: async (opencodeConfig: Record<string, unknown>) => {
      const agents = {
        'my-agent': {
          name: 'my-agent',
          description: 'Description',
          instructions: 'System prompt',
          mode: 'primary',  // ← VISIBLE in tab toggle
          permission: { task: 'allow' },
          tools: {},
        },
      };
      
      if (!opencodeConfig.agent) {
        opencodeConfig.agent = { ...agents };
      } else {
        Object.assign(opencodeConfig.agent, agents);
      }
    },
    
    // Hooks
    'tool.execute.before': async (input, output) => {...},
    'chat.message': async (input, output) => {...},
    
    // Tools
    tool: {
      'my-tool': {
        description: 'Tool description',
        execute: async (args, ctx) => {...},
      },
    },
  };
}
```

---

## LESSONS LEARNED

1. **Always check Plugin Engineering Master Context** before shipping
2. **Tab toggle requires `config` callback + `mode: 'primary'`**
3. **Test in fresh OpenCode session** after changes
4. **One version only** - remove old from `opencode.json`
5. **Document ship hygiene** - this report prevents repeat mistakes

---

## VERIFICATION

**Plugin now:**
- ✅ Exports correct async function format
- ✅ Has `config` callback for agent registration  
- ✅ Uses `mode: 'primary'` for tab toggle
- ✅ No `model` field on primary agents
- ✅ Uses `Object.assign` for registration
- ✅ Single version in `opencode.json`

**Expected result:** "kraken-v2" appears in OpenCode tab toggle dropdown.
