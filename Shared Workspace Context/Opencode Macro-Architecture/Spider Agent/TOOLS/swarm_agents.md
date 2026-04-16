# swarm_agents

**Type**: Swarm tool
**Plugin**: Spider Agent
**Purpose**: List all available agents and their capabilities

---

## Quick Reference

| Property | Value |
|----------|-------|
| Arguments | `filter?` |
| Returns | `{ agents: [] }` |
| Errors | None |

---

## Purpose

The `swarm_agents` tool lists the available agents in the swarm and their capabilities. This is useful for understanding who to delegate to.

---

## Arguments

### `filter` (string) — Optional

Filter by capability (e.g., "review", "test").

---

## Returns

```typescript
{
  agents: {
    name: string,
    role: string,
    capabilities: string[],
    tools: string[],
    description: string
  }[]
}
```

---

## Agent Roles

| Agent | Role | Capabilities |
|-------|------|--------------|
| architect | Planning | Plan creation, architecture design, delegation |
| coder | Implementation | Code writing, editing, refactoring |
| reviewer | Quality | Code review, security review |
| test_engineer | Testing | Test writing, test execution |
| explorer | Discovery | Codebase analysis, pattern detection |
| critic | Challenge | Challenge assumptions, find flaws |
| sme | Expertise | Domain-specific knowledge |

---

## Integration Points

| Component | Relationship |
|-----------|--------------|
| **Architect** | Decides which agent to delegate to |
| **Any agent** | Understands swarm structure |

---

## Usage Example

```
/swarm_agents
```

```
/swarm_agents filter=review
```

---

## Related Tools

- `swarm_status` — Current swarm state
- `swarm_plan` — Current plan
- `swarm_ev` — Evidence summary
