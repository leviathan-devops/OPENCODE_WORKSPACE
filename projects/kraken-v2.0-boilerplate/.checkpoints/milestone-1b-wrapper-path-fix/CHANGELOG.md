# CHANGELOG - MILESTONE 1b

## Date: 2026-04-14
## Change: Fixed wrapper path resolution

**Problem:** Using `process.cwd()` would resolve to workspace, not plugin directory.

**Solution:** Use `import.meta.url` + `fileURLToPath` to get `__dirname` relative to bundled file.

**Files Modified:**
- `src/clusters/ClusterInstance.ts` - Added ESM path utilities, updated wrapperPath

**Before:**
```typescript
const wrapperPath = path.join(process.cwd(), 'subagent-manager', 'wrappers', 'opencode_agent.py');
```

**After:**
```typescript
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const wrapperPath = path.resolve(__dirname, '..', '..', 'subagent-manager', 'wrappers', 'opencode_agent.py');
```

**Build:** PASSED (0.53 MB bundle)
