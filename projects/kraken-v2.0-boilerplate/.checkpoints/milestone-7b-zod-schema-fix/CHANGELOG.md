# CHANGELOG - MILESTONE 7B

## Date: 2026-04-14
## Status: ZOD SCHEMA FIX APPLIED

## The Bug

The Zod schema compatibility error occurred during task processing:
```
TypeError: undefined is not an object (evaluating 'schema._zod.def')
    at process (/$bunfs/root/src/index.js:13485:28)
    at toJSONSchema (/$bunfs/root/src/index.js:14173:14)
```

## Root Cause

v2.0 used `.optional()` instead of `.default()` for certain schema fields:
- `acceptanceCriteria: z.array(z.string()).optional()` (BROKEN)
- `priority: z.enum([...]).optional()` (BROKEN)

v1.0 used:
- `acceptanceCriteria: z.array(z.string()).default([])` (WORKING)
- `priority: z.enum([...]).default('normal')` (WORKING)

The `.optional()` modifier doesn't provide a default value, causing the schema structure to differ when OpenCode's `toJSONSchema` processes it.

## The Fix

Changed in `src/tools/cluster-tools.ts`:

**spawn_cluster_task:**
```typescript
// BEFORE (broken):
acceptanceCriteria: z.array(z.string()).optional().describe(...),
priority: z.enum(['low', 'normal', 'high', 'critical']).optional().describe(...),

// AFTER (fixed):
acceptanceCriteria: z.array(z.string()).default([]).describe(...),
priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal').describe(...),
```

**spawn_shark_agent:**
```typescript
// BEFORE (broken):
priority: z.enum(['low', 'normal', 'high', 'critical']).optional().describe(...),

// AFTER (fixed):
priority: z.enum(['low', 'normal', 'high', 'critical']).default('high').describe(...),
```

## Verification

- Bundle rebuilt: 527954 bytes (was 527946)
- `.default([])` present in bundle
- `.default('normal')` and `.default('high')` present in bundle

## Next Steps

1. Test plugin in container to verify Zod error is fixed
2. If fixed, proceed to TEST gate
3. If not fixed, investigate further

## Files Modified

- `src/tools/cluster-tools.ts` (lines 96-97, 144)