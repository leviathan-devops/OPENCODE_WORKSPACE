# FIX 5: Supervisor Loop — METADATA NOT CONSUMED (MEDIUM)

**Severity**: MEDIUM — theatrical feature, appears to work but doesn't reach agent
**Status**: MUST FIX OR REMOVE
**Source File**: `src/hooks/supervisor-loop-hook.ts`
**Source Lines**: 21-27, 36-40, 49-53

---

## THE PROBLEM

The supervisor loop hook sets `output.metadata` with recommendations:

```typescript
output.metadata = {
  ...output.metadata,
  supervisor_recommendation: recommendation,
  supervisor_issue_id: issue.id,
};
```

But there is NO evidence that OpenCode's plugin API actually surfaces `output.metadata` back to the agent. If the SDK doesn't consume this field, the entire feature is theater — recommendations are generated but never delivered.

**This is verification theater** in its purest form: the feature exists, runs without errors, and produces output that goes nowhere.

---

## TWO ACCEPTABLE FIXES

Choose ONE. Document which fix is implemented.

### Option A: VERIFY AND WIRE (Preferred if SDK supports it)

If OpenCode SDK v2.x does surface `output.metadata` to agent context:
1. Find the canonical path for consuming `output.metadata`
2. Document it in comments in the source
3. If the path exists and works, the current code is correct

### Option B: WIRE THROUGH TOOL (Always works)

Replace the metadata approach with a tool that the agent MUST call explicitly:

**Add to `src/tools/supervisor.ts`** (new file):
```typescript
import { tool } from "./create-tool.js";

export const getSupervisorRecommendations = tool({
  description: "Get open supervisor issues and recommendations for current session",
  args: {},
  execute: async (args, context) => {
    // Import from supervisor-loop.ts
    const { getSupervisorSummary, getOpenIssues } = await import("../services/supervisor-loop.js");
    const summary = getSupervisorSummary();
    const issues = getOpenIssues();
    
    if (issues.length === 0) {
      return `## Supervisor Status\n\n✓ No open issues.`;
    }
    
    const rows = issues.map(i => 
      `| ${i.id} | ${i.risk} | ${i.type} | ${i.description.substring(0, 50)}... |`
    ).join("\n");
    
    return `## Supervisor Status\n\n**Open Issues**: ${summary.openCount}\n**High Risk**: ${summary.highRiskCount}\n\n| ID | Risk | Type | Description |\n|-----|------|------|-------------|\n${rows}\n\n**Recommendation**: Address high-risk issues before proceeding.`;
  },
});
```

Then register it in `src/index.ts` in the tool exports.

### Option B is RECOMMENDED because:
1. It is explicit — agent must call the tool to see recommendations
2. It works regardless of SDK metadata support
3. It is testable — can verify tool output directly
4. It doesn't depend on undocumented SDK behavior

---

## IMPLEMENTATION REQUIREMENTS

**If Option A is chosen**:
- Document exact SDK version that supports `output.metadata`
- Provide evidence that metadata reaches agent context
- Include a test that verifies metadata is consumed

**If Option B is chosen**:
- Create `src/tools/supervisor.ts` with `getSupervisorRecommendations` tool
- Register tool in `src/index.ts` as `get_supervisor_recommendations: getSupervisorRecommendations`
- Remove `output.metadata` assignments from `supervisor-loop-hook.ts`
- OR keep metadata for debugging but do not rely on it for delivery

---

## VERIFICATION

```bash
# For Option B:
# 1. Verify tool file exists
ls -la v2.3.1-build/src/tools/supervisor.ts
# Expected: file exists

# 2. Verify tool is registered in index.ts
grep -n "get_supervisor_recommendations" v2.3.1-build/src/index.ts
# Expected: registration line

# 3. Verify tool exports correctly
grep -n "getSupervisorRecommendations" v2.3.1-build/src/index.ts
# Expected: import + registration

# 4. Build succeeds
cd v2.3.1-build && bun build.ts && echo "BUILD_OK"
```

---

## MECHANICAL ENFORCEMENT CHECKLIST (Option B)

- [ ] `src/tools/supervisor.ts` exists with `getSupervisorRecommendations` tool
- [ ] Tool is imported in `src/index.ts`
- [ ] Tool is registered in the tool export object
- [ ] `output.metadata` in supervisor-loop-hook is either removed or documented as debug-only
- [ ] `bun build.ts` exits 0

