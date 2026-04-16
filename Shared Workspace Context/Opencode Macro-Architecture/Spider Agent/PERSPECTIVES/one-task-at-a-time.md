# Why One-Task-At-A-Time Matters

## The Parallelism Trap

Agent systems often try to do too much in parallel:
- Multiple agents working on same files → merge conflicts
- Overlapping context windows → incoherent output
- Competing task priorities → resource exhaustion

## Spider's Approach

Spider Agent enforces **sequential task completion** within each phase:

```
Phase 3: coding
├── Task 3.1: Implement User model [IN_PROGRESS]
├── Task 3.2: Implement Auth service [PENDING]
└── Task 3.3: Create API routes [PENDING]
```

Only one task is "in_progress" at a time.

## Why This Works

### 1. No Merge Conflicts
When agents work on different files sequentially:
- Agent A finishes file1.ts → reports complete
- Spider assigns file2.ts to Agent A
- No concurrent editing of same file

### 2. Predictable Context
Context budget is spent on one task:
- Clear what's consuming tokens
- Compaction triggers at known points
- No context explosion from parallel work

### 3. Proper Dependencies
Tasks block properly:
```
Task 3.1: Implement User model [IN_PROGRESS]
Task 3.2: Implement Auth service [BLOCKED - waiting on 3.1]
```
Auth can't start until User model exists.

### 4. Cleaner Recovery
If Task 3.2 fails:
- We know exactly what was being worked on
- Can rollback just that task
- No half-completed parallel work to clean up

## What "One Task" Means

It's **one agent doing one thing**, not:
- One agent doing N things in parallel
- N agents doing N things in parallel
- Context switching between half-finished tasks

## The Pipeline Is Parallel

```
Phase 1: [explorer] ──────────────────────────────►
Phase 2: [architect] ─────────────────────────────►
Phase 3: [coder] ───► [test_engineer] ───► [reviewer] ──►
```

Each **phase** is sequential. But phases can overlap conceptually:
- Phase 3 (coder) working while Phase 4 (test_engineer) waiting

## But Wait, Doesn't This Waste Time?

In traditional computing, yes. But for LLM agents:

### LLM agents are I/O bound, not CPU bound
- Waiting for model responses = seconds to minutes
- Parallel requests don't make it faster
- Context management becomes the bottleneck

### Quality > Speed
- One well-crafted implementation > five hasty ones
- Fixing parallel work mess > doing it sequentially
- QA gates catch issues early

### The Real Bottleneck
It's not CPU cycles, it's:
1. Context window management
2. Coherent task completion
3. Maintaining plan alignment

Sequential work addresses all three.

## Context Budget Example

**Parallel approach (problematic):**
```
[Agent A: implementing auth  ] 40% context
[Agent B: writing tests    ] 35% context  
[Agent C: updating docs     ] 25% context
─────────────────────────────
Total: 100% → Context explosion!
```

**Sequential approach:**
```
[Task 3.1: Implement User   ] 30% → complete
[Compaction                  ] -10% → compact
[Task 3.2: Implement Auth    ] 25% → complete
─────────────────────────────
Total: 45% used, clean completion
```

## Task Dependency Graph

Spider enforces:
```
    ┌─────────────────────┐
    │   Task 3.1          │
    │   (User model)       │
    └──────────┬──────────┘
               │ completes
    ┌──────────▼──────────┐
    │   Task 3.2          │──┐
    │   (Auth service)    │  │ blocked
    └──────────┬──────────┘  │
               │ completes   │
    ┌──────────▼──────────┐  │
    │   Task 3.3          │◄─┘
    │   (API routes)      │
    └─────────────────────┘
```

No task starts until its dependencies are done.

## Result

One-task-at-a-time gives:
- **Clean context management** - always know what's consuming budget
- **Proper dependencies** - no broken interfaces
- **Atomic task completion** - each task is done or not done
- **Easier rollback** - can restore to exact state
- **Better quality** - focus on one thing at a time
