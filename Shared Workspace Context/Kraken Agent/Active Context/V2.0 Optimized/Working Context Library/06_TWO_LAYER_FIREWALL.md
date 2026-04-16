# TWO-LAYER FIREWALL — System Brain V2.0

**File:** `src/brains/system/firewall/two-layer-guardian.ts`

---

## Core Problem (From First-Hand Experience)

Building the Shark Agent v4.8.3 firewall showed:

```
tool.execute.before → guardian-hook → pattern match on toolArgs
                     ↑
                ONLY fires on structured TOOL CALLS
```

But `opencode run` sends **messages** to agents:
```
opencode run "grep pattern | wc" → Message to agent → Agent interprets
                                    ↓
                    Agent says: "I'll count the lines for you"
                                    ↓
                         No terminal tool call
                                    ↓
                    Guardian NEVER fires
```

**Result:** 155 patterns passed unit tests, 0/N blocked at runtime.

---

## Two-Layer Solution

```
┌─────────────────────────────────────────────────────────────────────┐
│                     TWO-LAYER FIREWALL                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  LAYER 1: Tool-Based Enforcement                                     │
│  ─────────────────────────────────────                              │
│  Hook:      tool.execute.before                                     │
│  Checks:    toolArgs (structured JSON)                              │
│  Example:   terminal.execute({"command": "grep | wc"})               │
│  Status:    ✅ Working for direct tool calls                          │
│                                                                      │
│  LAYER 2: Message-Based Enforcement (NEW)                           │
│  ─────────────────────────────────────────                          │
│  Hook:      chat.message (when message sent to agent)                 │
│  Checks:    agentMessage content for intent                          │
│  Example:   "grep pattern | wc" in message                          │
│  Status:    ❌ Not implemented in V1.2                               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Implementation

### Hook Registration

```typescript
export function createSystemBrainHooks(
  systemBrain: SystemBrain,
  outputVerifier: OutputVerifier
): Hooks {
  return {
    // Layer 1: Tool enforcement
    'tool.execute.before': createToolGuardianHook(systemBrain),
    
    // Layer 2: Message enforcement (NEW)
    'chat.message': createMessageGuardianHook(systemBrain),
    
    // Other hooks...
    'tool.execute.after': createGateHook(systemBrain),
  };
}
```

### Layer 1: Tool Guardian (Existing)

```typescript
function createToolGuardianHook(
  systemBrain: SystemBrain
): Hooks['tool.execute.before'] {
  return async (input) => {
    const { tool } = input;
    const args = input.args || {};
    
    // L0: Identity check
    if (!systemBrain.isInitialized()) return;
    
    // L0: Dangerous tool + uninitialized brain
    if (DANGEROUS_TOOLS.has(tool)) {
      systemBrain.checkIdentityWall(tool);
    }
    
    // L1-L7: Pattern enforcement via toolArgs
    const textToCheck = JSON.stringify(args);
    systemBrain.checkPatterns(tool, textToCheck);
  };
}
```

### Layer 2: Message Guardian (NEW)

```typescript
function createMessageGuardianHook(
  systemBrain: SystemBrain
): Hooks['chat.message'] {
  return async (input) => {
    const { agent, message } = input;
    
    // Only check messages to system brain or execution brain
    if (!['kraken-system', 'kraken-execution', 'alpha', 'beta', 'gamma'].includes(agent)) {
      return;
    }
    
    // Check message content for intent patterns
    systemBrain.checkMessageIntent(message);
  };
}
```

---

## Message Pattern Sets

### M1: THEATRICAL PATTERNS (Message Layer)

```typescript
const THEATRICAL_MESSAGE_PATTERNS = [
  // Counting theater (message version)
  /just\s+grep/i,
  /grep.*\|.*wc/i,
  /count.*lines/i,
  /wc\s+-l/i,
  
  // Verification save
  /cat.*\|.*grep/i,
  /grep.*\|.*tee/i,
  
  // Pattern existence as proof
  /grep.*setCurrentAgent.*src/i,
  /grep.*isSharkAgent.*src/i,
];
```

### M2: FAKE TASK COMPLETION (Message Layer)

```typescript
const FAKE_COMPLETION_MESSAGE_PATTERNS = [
  /task.*complete/i,
  /done.*already/i,
  /finished.*it/i,
  /build.*passed/i,
  /tests.*pass/i,
  /no.*issues/i,
  /all.*good/i,
];
```

### M3: HOST FALLBACK (Message Layer)

```typescript
const HOST_FALLBACK_MESSAGE_PATTERNS = [
  /host.*works/i,
  /skip.*container/i,
  /don't.*need.*container/i,
  /local.*fine/i,
  /already.*tested.*locally/i,
];
```

### M4: SUCCESS CLAIM (Message Layer)

```typescript
const SUCCESS_CLAIM_MESSAGE_PATTERNS = [
  /it's.*working/i,
  /trust.*me/i,
  /believe.*me/i,
  /works.*fine/i,
  /no.*problem/i,
  /should.*be.*good/i,
];
```

---

## Intent Classification

```typescript
interface MessageIntent {
  category: MessageIntentCategory;
  matchedPatterns: string[];
  confidence: number;  // 0.0 - 1.0
  shouldBlock: boolean;
}

type MessageIntentCategory =
  | 'THEATRICAL'
  | 'FAKE_COMPLETION'
  | 'HOST_FALLBACK'
  | 'SUCCESS_CLAIM'
  | 'SCOPE_CREEP'
  | 'IMPATIENCE'
  | 'UNDERMINING';

function classifyIntent(message: string): MessageIntent {
  const matches: string[] = [];
  
  // Check all pattern sets
  for (const [category, patterns] of MESSAGE_PATTERN_SETS) {
    for (const pattern of patterns) {
      if (pattern.test(message)) {
        matches.push(`${category}:${pattern.source}`);
      }
    }
  }
  
  // Confidence = matched / total patterns
  const totalPatterns = Object.values(MESSAGE_PATTERN_SETS).flat().length;
  const confidence = matches.length / totalPatterns;
  
  return {
    category: determinePrimaryCategory(matches),
    matchedPatterns: matches,
    confidence,
    shouldBlock: confidence > 0.1,  // Block if >10% of patterns matched
  };
}
```

---

## Two-Layer Coordination

```typescript
class TwoLayerGuardian {
  private toolPatterns: ToolPatternSet;
  private messagePatterns: MessagePatternSet;
  
  // Layer 1: Tool enforcement
  checkTool(tool: string, args: Record<string, unknown>): CheckResult {
    const textToCheck = JSON.stringify(args);
    
    // Check tool patterns
    for (const pattern of this.toolPatterns.all) {
      if (pattern.test(textToCheck)) {
        return { blocked: true, layer: 'TOOL', pattern: pattern.source };
      }
    }
    
    return { blocked: false };
  }
  
  // Layer 2: Message enforcement
  checkMessage(message: string): CheckResult {
    const intent = classifyIntent(message);
    
    if (intent.shouldBlock) {
      return { 
        blocked: true, 
        layer: 'MESSAGE', 
        intent: intent.category,
        confidence: intent.confidence
      };
    }
    
    return { blocked: false };
  }
  
  // Coordination: Either layer can block
  check(input: ToolInput | MessageInput): CheckResult {
    if (isMessageInput(input)) {
      return this.checkMessage(input.message);
    } else {
      return this.checkTool(input.tool, input.args);
    }
  }
}
```

---

## Why Both Layers

### Tool Layer Catches

- Direct tool calls with blocked arguments
- Structured bypass attempts
- Mechanically checkable patterns

### Message Layer Catches

- Agent interpretation of requests
- Natural language responses that skip work
- Claims of completion without action

### Example: Theatrical

**Tool Layer:**
```
User: "grep pattern | wc"
→ terminal.execute({"command": "grep pattern | wc"})
→ BLOCKED ✓
```

**Message Layer:**
```
User: "grep pattern | wc"
→ Agent interprets: "I'll count the lines for you"
→ Agent responds: "I'll just grep and count the matches"
→ BLOCKED ✓
```

**Without Message Layer:**
```
User: "grep pattern | wc"
→ Agent responds naturally (no tool call)
→ Tool layer never fires
→ BLOCKED? NO ❌
```

---

## Pattern Set Summary

| Layer | Patterns | Checks |
|-------|----------|--------|
| L1 (Tool) | THEATRICAL_PATTERNS | toolArgs for counting theater |
| M1 (Message) | THEATRICAL_MESSAGE_PATTERNS | agentMessage for intent |
| L2 (Tool) | FAKE_TEST_PATTERNS | toolArgs for fake test commands |
| M2 (Message) | FAKE_COMPLETION_MESSAGE_PATTERNS | agentMessage for fake completion |
| L5.1 (Tool) | HOST_FALLBACK_PATTERNS | toolArgs for host fallback |
| M3 (Message) | HOST_FALLBACK_MESSAGE_PATTERNS | agentMessage for host fallback |
| L5.2 (Tool) | SUCCESS_CLAIM_PATTERNS | toolArgs for success claims |
| M4 (Message) | SUCCESS_CLAIM_MESSAGE_PATTERNS | agentMessage for success claims |

---

## Test Cases

### Tool Layer Tests

```typescript
const toolTests = [
  { 
    name: 'grep | wc blocks',
    input: { tool: 'terminal', args: { command: 'grep pattern | wc' } },
    expect: { blocked: true, layer: 'TOOL' }
  },
  {
    name: 'legitimate grep allowed',
    input: { tool: 'terminal', args: { command: 'grep -r pattern src/' } },
    expect: { blocked: false }
  },
];
```

### Message Layer Tests

```typescript
const messageTests = [
  {
    name: '"just grep" theatrical blocks',
    input: { agent: 'alpha', message: "I'll just grep and count for you" },
    expect: { blocked: true, layer: 'MESSAGE' }
  },
  {
    name: '"it's working" success claim blocks',
    input: { agent: 'alpha', message: "Don't worry, it's working now" },
    expect: { blocked: true, layer: 'MESSAGE' }
  },
  {
    name: 'legitimate message allowed',
    input: { agent: 'alpha', message: "I'm running the grep command now" },
    expect: { blocked: false }
  },
];
```

---

## Performance

Message layer adds minimal overhead:

- Pattern matching is O(n*m) where n = message length, m = patterns
- Early return on non-matching agents
- Async hook doesn't block execution

Typical overhead: <5ms per message

---

*End of Two-Layer Firewall Spec*