# CHECKPOINT RELOAD — How to Restore from Checkpoint 1

## When to Use This

- Session corrupted
- Accidentally broke the build
- Need to revert to known good state
- Compaction destroyed working context

## Checkpoint Location

```
/home/leviathan/OPENCODE_WORKSPACE/CHECKPOINTS/checkpoint-1-shark-v4.8.3/
```

## Reload Procedure

### Step 1: Stop Current Work
```bash
# Verify checkpoint exists
ls -la /home/leviathan/OPENCODE_WORKSPACE/CHECKPOINTS/checkpoint-1-shark-v4.8.3/
```

### Step 2: Copy Source Back
```bash
# Remove current source (or rename as backup)
mv /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/src \
   /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/src.broken

# Copy checkpoint source
cp -r /home/leviathan/OPENCODE_WORKSPACE/CHECKPOINTS/checkpoint-1-shark-v4.8.3/src \
   /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/src
```

### Step 3: Rebuild
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4
bun build src/index.ts --outdir dist --target bun --format esm --bundle
```

### Step 4: Deploy
```bash
cp dist/index.js ~/.config/opencode/plugins/shark-agent-v4/dist/
```

### Step 5: Reload Plugin
```bash
# Restart OpenCode or reload plugins
# Check with:
opencode plugins list
```

### Step 6: Verify
```bash
# Run unit tests
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4
node direct-test.mjs

# Should show 17/17 passed
```

## What's in Checkpoint 1

```
checkpoint-1-shark-v4.8.3/
├── src/
│   └── hooks/v4.1/
│       └── guardian-hook.ts  (572 lines, 155 patterns)
├── dist/
│   └── index.js  (1MB bundle)
├── WORKING_CONTEXT/
│   └── [various knowledge files]
├── CHECKPOINT_MANIFEST.md
└── [various analysis docs]
```

## Checkpoint vs Current State

| Aspect | Checkpoint 1 | Current |
|--------|-------------|---------|
| guardian-hook.ts | 572 lines | Same |
| Patterns | 155 | Same |
| Unit tests | 17/17 pass | Same |
| Container blocking | NOT WORKING | Same |

**Note:** Checkpoint 1 represents the build state AFTER patterns were implemented but BEFORE runtime issues were understood.

## After Reload

1. Run unit tests to verify
2. Read `03_ARCHITECTURE_LESSON.md` to remember the core issue
3. Proceed with `06_NEXT_PHASE_PLAN.md` for architecture overhaul