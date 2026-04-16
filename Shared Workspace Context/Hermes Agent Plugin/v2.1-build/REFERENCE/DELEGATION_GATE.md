# DELEGATION_GATE — Coder Blocked Without Reviewer Approval

## Purpose
The coder agent cannot mark a task complete until the reviewer agent has verified it. Prevents self-approval.

## Hook: `tool.execute.before`

**Event**: Before tool execution
**Tools**: `update_task_status`, `hermes_complete_task`, task completion tools
**Condition**: Status = "complete"/"done" AND no reviewer approval on record
**Action**: Block with message requiring reviewer approval first

---

## State Machine

```
idle → coder_delegated → pre_check_passed → reviewer_run → tests_run → complete
```

The coder agent is in `coder_delegated` state. It can only advance to `complete` after `reviewer_run` passes.

---

## Implementation

```typescript
import type { Hooks } from "@opencode-ai/plugin";
import { QA_AGENTS } from "../config/constants.js";

export function createDelegationGateHook(): NonNullable<Hooks["tool.execute.before"]> {
  return async (input, output) => {
    const { tool, args } = input;

    // Only check task completion tools
    const COMPLETION_TOOLS = [
      "update_task_status",
      "hermes_complete_task",
      "complete_task",
    ];

    if (!COMPLETION_TOOLS.includes(tool)) return;

    const status: string = args?.status ?? "";
    const taskId: string = args?.taskId ?? "";

    // If marking complete, require reviewer approval
    if (status === "complete" || status === "done") {
      const reviewerApproved = getReviewerApproval(taskId);
      
      if (!reviewerApproved) {
        output.args._gate_blocked = {
          gate: "reviewer_approval",
          taskId,
          message: `[DELEGATION GATE] Cannot mark task ${taskId} as complete.
          
Required: @${QA_AGENTS.join(" or @")} must verify the work first.

Current state: Awaiting reviewer verification.
Suggestion: Use /review or ask @reviewer to verify.`,
        };
      }
    }

    // Block re-delegation (coder cannot delegate to another coder)
    if (tool === "agent_dispatch" || tool === "dispatch_subagent") {
      const callerAgent = getCurrentAgent();
      if (callerAgent === "coder" && args?.target === "coder") {
        output.args._gate_blocked = {
          gate: "delegation_chain",
          message: `[DELEGATION GATE] Coder cannot delegate to another coder.`,
        };
      }
    }
  };
}
```

---

## Reviewer Approval Tracking

The reviewer sets approval via `update_task_status` with a special flag:

```typescript
// When reviewer approves:
update_task_status({
  taskId: "task-123",
  status: "reviewer_approved",
  reviewer: "reviewer",
  verdict: "APPROVED",
  evidence: "Security scan passed, tests passing, code matches spec"
});
```

The gate checks for `reviewer_approved` status before allowing completion.

---

## Testing

```typescript
describe("delegationGateHook", () => {
  it("blocks completion without reviewer approval", async () => {
    clearReviewerApprovals();
    const hook = createDelegationGateHook();
    const output = { args: { taskId: "task-123", status: "complete" } };
    
    await hook({ tool: "update_task_status", args: output.args }, output);
    
    expect(output.args._gate_blocked).toBeDefined();
    expect(output.args._gate_blocked.gate).toBe("reviewer_approval");
  });

  it("allows completion with reviewer approval", async () => {
    setReviewerApproval("task-123", { approved: true, reviewer: "reviewer" });
    const hook = createDelegationGateHook();
    const output = { args: { taskId: "task-123", status: "complete" } };
    
    await hook({ tool: "update_task_status", args: output.args }, output);
    
    expect(output.args._gate_blocked).toBeUndefined();
  });

  it("blocks coder delegating to coder", async () => {
    setCurrentAgent("coder");
    const hook = createDelegationGateHook();
    const output = { args: { target: "coder" } };
    
    await hook({ tool: "agent_dispatch", args: output.args }, output);
    
    expect(output.args._gate_blocked).toBeDefined();
  });
});
```

---

## Self-Approval Prevention

Additionally, `selfReviewHook` prevents ANY agent from approving its own work:

```typescript
export function createSelfReviewHook(): NonNullable<Hooks["tool.execute.after"]> {
  return async (input, output) => {
    const { tool, callID } = input;
    
    if (tool === "update_task_status") {
      const agent = getCurrentAgent();
      const approver = parseApproverFromOutput(output.output);
      
      if (agent === approver) {
        output.title = "BLOCKED: Self-approval";
        output.output = `[SELF-REVIEW BLOCKED] Agent ${agent} cannot approve its own work.
        
Please request review from a different agent.`;
      }
    }
  };
}
```

---

## Anti-Rationalization

- [ ] Coder cannot complete without reviewer verdict
- [ ] Reviewer cannot be the same as coder
- [ ] Re-delegation to same role is blocked
- [ ] Approval state persists in task record
- [ ] Test coverage for all gate conditions
