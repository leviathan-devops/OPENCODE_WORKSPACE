# Trident Brain — Source Code

**Location:** `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Trident Brain/src/`

## Structure

```
src/
├── index.ts                    # Main plugin entry (TridentBrainPlugin)
├── modes/
│   ├── planning/index.ts       # Deep Planning Mode (3 layers)
│   ├── problem-solving/index.ts # Problem Solving Mode (6 layers)
│   ├── context-synthesis/index.ts # Context Synthesis Mode (4 layers)
│   └── code-review/            # Code Review Mode (5 layers) - PLANNED
└── shared/
    ├── mode-coordinator.ts      # Mode routing & validation
    ├── layer-templates.ts       # Markdown templates per layer
    ├── artifact-generator.ts    # Generates injectable outputs
    └── state-persistence.ts    # Iteration tracking
```

## Status

| Mode | Documentation | TypeScript |
|------|--------------|------------|
| Deep Planning Mode | ✅ Complete | ✅ Implemented |
| Problem Solving Mode | ✅ Complete | ✅ Implemented |
| Context Synthesis Mode | ✅ Complete | ✅ Implemented |
| Code Review Mode | ✅ Complete | ⏳ Pending |

## Code Review Mode Implementation

Code Review Mode TypeScript implementation is pending. The documentation in the parent `Code Review Mode/` folder provides the full specification for implementation.

### Implementation Tasks (Pending)

1. Create `src/modes/code-review/index.ts` - CodeReviewMode class
2. Create detector modules for each layer
3. Implement artifact generator for review reports
4. Add to ModeCoordinator registry

## Building

```bash
cd src
npm install
npm run build
```

## References

- **Master Spec:** `../MASTER_SPEC.md`
- **Documentation:** `../Code Review Mode/`
