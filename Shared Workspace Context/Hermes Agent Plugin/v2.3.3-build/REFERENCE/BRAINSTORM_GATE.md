# BRAINSTORM_GATE — HARD-GATE: No Code Until Design Approved

## Purpose
Block ALL implementation attempts until Phase 0 is complete:
1. Requirements are concrete (no "just build it")
2. Design doc is written to `~/hermes-workspace/docs/plans/`
3. User has explicitly approved the design

## Hook: `experimental.chat.messages.transform`

**Event**: Every chat message before it reaches the LLM
**Condition**: Phase is IDLE or ANALYZE AND message contains code/file edits
**Action**: Inject blocking message, prevent LLM from acting on the message

---

## Implementation

```typescript
import type { Hooks } from "@opencode-ai/plugin";
import { PHASES } from "../config/constants.js";

const BRAINSTORM_VIOLATIONS = [
  /```[\s\S]*?```/,           // Code blocks
  /write_file|mcp_write_file/, // File write tools
  /patch|mcp_patch/,           // File patch tools
  /terminal|mcp_terminal/,     // Bash/terminal tools
];

export function createBrainstormGateHook(): NonNullable<Hooks["experimental.chat.messages.transform"]> {
  return async (input, output) => {
    const currentPhase = getCurrentPhase();
    
    // Only enforce in IDLE or ANALYZE phases
    if (currentPhase !== PHASES.IDLE && currentPhase !== PHASES.ANALYZE) {
      return;
    }

    const lastMessage = output.messages[output.messages.length - 1];
    if (!lastMessage) return;

    const content = JSON.stringify(lastMessage.parts);
    
    for (const pattern of BRAINSTORM_VIOLATIONS) {
      if (pattern.test(content)) {
        // Inject blocking message
        lastMessage.parts.push({
          type: "text",
          text: `
[HARD-GATE BLOCKED]

You are in the BRAINSTORM phase. No implementation is permitted until:

1. Requirements are concrete (no "just build it")
2. Design doc written to ~/hermes-workspace/docs/plans/
3. User has explicitly approved the design

Continue with the brainstorm. Ask clarifying questions or write the design doc.
`,
        });
        
        // Only block once
        return;
      }
    }
  };
}
```

---

## State Requirements

This hook reads `currentPhase` from shared state. The phase must be initialized to `idle` on session start.

---

## Testing

```typescript
describe("brainstormGateHook", () => {
  it("blocks code blocks in IDLE phase", async () => {
    setCurrentPhase("idle");
    const hook = createBrainstormGateHook();
    const output = {
      messages: [{
        parts: [{ type: "text", text: "```js\nconsole.log('hi')\n```" }]
      }]
    };
    
    await hook({}, output);
    
    expect(output.messages[0].parts.length).toBe(2);
    expect(output.messages[0].parts[1].text).toContain("HARD-GATE BLOCKED");
  });

  it("allows plain text in IDLE phase", async () => {
    setCurrentPhase("idle");
    const hook = createBrainstormGateHook();
    const output = {
      messages: [{
        parts: [{ type: "text", text: "Tell me about authentication" }]
      }]
    };
    
    await hook({}, output);
    
    expect(output.messages[0].parts.length).toBe(1); // no blocking message
  });

  it("allows code in BUILD phase", async () => {
    setCurrentPhase("build");
    const hook = createBrainstormGateHook();
    const output = {
      messages: [{
        parts: [{ type: "text", text: "```js\nconsole.log('hi')\n```" }]
      }]
    };
    
    await hook({}, output);
    
    expect(output.messages[0].parts.length).toBe(1); // no blocking message
  });
});
```

---

## Anti-Rationalization

- [ ] Hook fires on every chat message in IDLE/ANALYZE phases
- [ ] Hook blocks code blocks, not just file writes
- [ ] Hook allows planning discussion
- [ ] Hook only injects one blocking message per turn
- [ ] Phase check is correct (not BUILD, not REVIEW)
