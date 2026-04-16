# How to Use Turbo Mode

## Overview

Turbo Mode trades some quality assurance for faster execution. Use when:
- You need rapid prototyping
- You're confident in the implementation
- Exploring proof-of-concept

## Activation

```
/swarm turbo on
/swarm turbo off
```

Verify current state:
```
/swarm turbo
# or
/swarm status  # shows "Turbo: ON/OFF"
```

---

## What Turbo Mode Changes

### 1. QA Gates
| Gate | Normal | Turbo |
|------|--------|-------|
| syntax_check | Full parse | Skipped (coder handles) |
| placeholder_scan | Enforced | Skipped |
| sast_scan | Full run | Skipped |
| sbom_generate | Yes | Skipped |
| build_check | Full compile | Fast check only |
| quality_budget | Enforced | Relaxed thresholds |

### 2. Model Selection
| Agent | Normal Model | Turbo Model |
|-------|-------------|-------------|
| coder | glm-5 | minimax/M2.7 |
| test_engineer | minimax/M2.7 | omnicoder-9b |
| reviewer | mimo-v2-omni-free | nemotron-3-super |

Smaller, faster models are used.

### 3. Context Compaction
| Setting | Normal | Turbo |
|---------|--------|-------|
| prune_target | 70% | 85% |
| compaction | Normal | Aggressive |

Context is compacted more aggressively to keep sessions fast.

---

## When to Use Turbo

### Good for Turbo:
- Initial feature exploration
- Spike/prototype code
- File structure scaffolding
- When you want coder to try ideas quickly

### Avoid Turbo:
- Security-sensitive code
- Public API implementation
- Complex algorithmic work
- When you need full SAST coverage
- Production-ready code

---

## Turbo Workflow

### 1. Start Normal, Switch to Turbo Mid-Way

```
/swarm specify Build auth service
/swarm plan
# Review plan - looks good
/swarm turbo on
# Continue implementation...
```

### 2. Start Turbo from Beginning

```
/swarm turbo on
/swarm specify Build auth service
# Fast prototype...
```

### 3. Disable Turbo for Specific Gates

```
/swarm turbo off
# Run full QA
/swarm turbo on
# Continue...
```

---

## Turbo + Context Budget

Turbo mode consumes context faster due to:
- More aggressive agent delegation
- Less summarization between handoffs
- Larger model outputs

Monitor with:
```
/swarm status
```

If context hits 95%+, turbo automatically disengages and compaction triggers.

---

## Verification in Turbo

Even in Turbo, Spider still:
- Maintains agent authority restrictions
- Writes evidence (though less detailed)
- Tracks state transitions
- Enforces blocked zones

---

## Performance Expectations

| Metric | Normal | Turbo |
|--------|--------|-------|
| Phase 3 (coding) | 10-20m | 3-8m |
| Full pipeline | 45-90m | 15-30m |
| Gate failures | Rare | Occasional |

Times are estimates - actual varies by task complexity.

---

## Exiting Turbo

```
/swarm turbo off
```

State is preserved. Next phase runs full QA.

---

## CI/CD Consideration

For CI environments, use:
```
/swarm turbo off
/swarm benchmark --ci-gate
```

Full gates run and strict thresholds apply.
