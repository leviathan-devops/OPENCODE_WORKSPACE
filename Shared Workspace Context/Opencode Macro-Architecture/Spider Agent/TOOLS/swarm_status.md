# swarm_status

**Type**: Swarm tool
**Plugin**: Spider Agent
**Purpose**: Display the current state of the swarm (agents, phase, tasks)

---

## Quick Reference

| Property | Value |
|----------|-------|
| Arguments | None |
| Returns | `{ agents, phase, plan, delegationLedger }` |
| Errors | None |

---

## Purpose

The `swarm_status` tool provides a high-level overview of the swarm's current state — which agents are active, what phase we're in, and what's been delegated.

---

## Returns

```typescript
{
  agents: {
    name: string,
    status: 'idle' | 'active' | 'blocked',
    currentTask?: string,
    lastActivity: string
  }[],
  phase: {
    current: number,
    completed: number[],
    status: 'planning' | 'executing' | 'reviewing' | 'complete'
  },
  plan: {
    totalTasks: number,
    completedTasks: number,
    currentTask?: string
  },
  delegationLedger: {
    delegator: string,
    delegate: string,
    taskId: string,
    timestamp: string,
    scope?: string[]
  }[]
}
```

---

## Integration Points

| Component | Relationship |
|-----------|--------------|
| **Architect** | Checks swarm state |
| **Any agent** | Orienting information |

---

## Usage Example

```
/swarm_status
```

---

## Related Tools

- `swarm_plan` — Show plan details
- `swarm_agents` — List agent capabilities
- `swarm_ev` — Show evidence
