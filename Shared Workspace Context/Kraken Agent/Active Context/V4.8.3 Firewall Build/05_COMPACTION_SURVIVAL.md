# COMPACTION SURVIVAL GUIDE

## How to Survive Session Compaction

### What Happens During Compaction

1. Session context is compressed to fit token limits
2. Older files may be deleted or truncated
3. Working context may be reset
4. Agent loses full history

### Recovery Strategy

#### Step 1: Reload Active Memory
```
Read: /home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Shark Agent/Active Context/Kraken Engineer Active Context/ACTIVE_MEMORY/00_INDEX.md
```

#### Step 2: Reload Project Context
```
Read: 01_PROJECT_STATE.md
Read: 02_SOURCE_MAP.md
Read: 03_ARCHITECTURE_LESSON.md
```

#### Step 3: Restore Checkpoint if Needed
```
See: 07_CHECKPOINT_RELOAD.md
```

### Files to Restore if Deleted

| File | Why Critical |
|------|-------------|
| `00_INDEX.md` | Entry point, navigation |
| `01_PROJECT_STATE.md` | Current status |
| `03_ARCHITECTURE_LESSON.md` | The core lesson about tool vs message |
| `06_NEXT_PHASE_PLAN.md` | What to do next |

### Quick Inject Pattern

If fully compacted, read `QUICK_INJECT.txt` first for the elevator pitch.

### Session ID Tracking

Keep note of current session ID to restore lineage:
- Current Session: [CHECK with hive_context or list_sessions]
- Parent Session: [From previous context]

### Compaction-Resistant Storage

Files in these locations survive compaction:
- `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/`
- `/home/leviathan/OPENCODE_WORKSPACE/CHECKPOINTS/`
- `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/src/`

### What to Do Immediately After Compaction

1. Read `00_INDEX.md`
2. Check project state with `shark-status` if plugin loaded
3. Verify checkpoint integrity
4. Resume work from last known good state