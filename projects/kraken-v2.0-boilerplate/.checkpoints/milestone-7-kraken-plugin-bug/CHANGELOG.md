# CHANGELOG - MILESTONE 7

## Date: 2026-04-14
## Status: KRAKEN PLUGIN HAS ZOD SCHEMA COMPATIBILITY BUG

## Discovery

**Container Infrastructure: WORKING ✅**

The Python wrapper and container spawning infrastructure is fully functional:
- Containers spawn correctly
- docker ps shows spawned containers
- Tasks execute in spawned containers
- Cleanup works properly

**Kraken Plugin: HAS BUG ❌**

When the kraken agent tries to process a task, there's a Zod schema error:

```
TypeError: undefined is not an object (evaluating 'schema._zod.def')
    at process (/$bunfs/root/src/index.js:13485:28)
    at toJSONSchema (/$bunfs/root/src/index.js:14173:14)
```

This happens during task processing, not during plugin initialization.

## Verification Results

### Container Infrastructure (WORKS)
| Test | Result |
|------|--------|
| spawn_cluster_task tool registered | ✅ Yes |
| Python wrapper called | ✅ Yes |
| Container spawned (docker ps) | ✅ Yes |
| Task executed | ✅ Yes |
| Container cleaned up | ✅ Yes |

### Kraken Agent (BUG)
| Test | Result |
|------|--------|
| Plugin initializes | ✅ 3 clusters, 11 agents |
| Tools registered | ✅ spawn_cluster_task, etc. |
| Task processing | ❌ Zod schema error |

## Root Cause

The error `schema._zod.def` at `toJSONSchema` suggests:
- Plugin is using an incompatible Zod schema definition
- Likely a version mismatch between plugin's schema format and OpenCode 1.4.3's expected format

## What This Means

1. **The container spawning foundation is SOLID** - Milestone 6 passed completely
2. **The kraken plugin itself needs a code fix** - The plugin-to-OpenCode interface has a compatibility issue
3. **This is a SEPARATE bug from the theatrical code issue** - Real execution works, but delegation doesn't

## Next Steps

1. **Fix kraken plugin Zod schema compatibility** - Update plugin to work with OpenCode 1.4.3
2. **Re-test kraken agent after fix** - Verify spawn_cluster_task works end-to-end
3. **Full integration test** - Multiple agents, parallel tasks, Hive integration

## Files Fixed During This Build

1. `ClusterInstance.ts` - Direct spawn instead of HTTP daemon
2. `opencode_agent.py` - Port fix, health host detection, wait time
3. `container_pool.py` - Port fix
4. `kraken-agent-wrapper.py` - Port fix

## Guardian Compliance

- [x] All edits in isolated workspace
- [x] No local active config modified
- [x] Container testing before any local deployment
- [x] Checkpoints saved at each milestone
- [x] Anti-theatrical verification passed
