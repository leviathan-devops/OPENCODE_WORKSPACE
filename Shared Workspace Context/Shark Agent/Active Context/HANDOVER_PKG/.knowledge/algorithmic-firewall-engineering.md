# Algorithmic Firewall Engineering

## Core Principle: Mechanical Enforcement > Text Matching

### The 90/10 Rule
- **90% of firewall triggers** should be mechanical (tool name, args, output state)
- **10% text-based triggers** only for anti-derailment (thinking patterns indicate slop/misalignment)

### Why Text Fails
Text-based matching causes:
- False positives: User saying "use hermes_remember" triggers block
- Evasion: Agent can rephrase to bypass pattern matching
- Brittleness: Minor text changes evade detection

### Mechanical Enforcement Patterns

#### 1. Direct Tool Name Check
```typescript
// BAD - text search
if (command.includes('hermes_remember'))

// GOOD - mechanical check
if (toolArgs.tool === 'hermes_remember')
```

#### 2. Args Structure Validation
```typescript
// Check the actual function being called, not text mentioning it
if (toolArgs.tool === 'terminal' && toolArgs.command.includes('dangerous'))
// vs
if (toolArgs.dangerousOperation === true)
```

#### 3. Evidence File Existence
```typescript
// BAD - text search for "evidence"
// GOOD - mechanically check file exists with correct schema
function hasEvidence(path: string): boolean {
  if (!fs.existsSync(path)) return false;
  const result = JSON.parse(fs.readFileSync(path, 'utf-8'));
  return result.overallPassed === true && result.passRate >= 0.96;
}
```

#### 4. Session State Verification
```typescript
// BAD - check text mentioning "brain"
// GOOD - check actual brain state
if (getCurrentAgent() !== 'shark') { throw error; }
```

### When Text-Based IS Appropriate
Anti-derailment layer only - when agent thinking patterns indicate:
- Host fallbacks ("host already proves")
- Success claims without evidence
- Simplification derailment ("too complex, skipping")
- Scope creep patterns

### Key Insight: buildTextToCheck()
Text checked should ONLY be what agent is EXECUTING, not user input:

```typescript
// WRONG - includes user message (false positive trigger)
function buildTextToCheck(context) {
  return context.agentMessage + context.toolArgs + context.output;
}

// CORRECT - only what agent is doing
function buildTextToCheck(context) {
  return JSON.stringify(context.toolArgs); // Only the action
}
```

### Mechanical Evidence Requirements
Firewalls should require:
1. **Container test evidence file** exists at known path
2. **Schema validation** - JSON must have required fields
3. **Pass rate threshold** - mechanical proof of runtime behavior
4. **Direct tool call verification** - not text mentioning

### Anti-Patterns
1. Checking if user said something → BLOCKS USER INPUT
2. Checking if agent output mentions something → EVADABLE
3. Pattern matching on text → BRITTLE
4. No evidence requirement → UNVERIFIABLE

### Correct Pattern for Cross-Agent Tool Blocking
```typescript
const CROSS_AGENT_TOOLS = ['hermes_remember', 'hive_context', ...];

// Mechanical: check what tool is being called, not text about it
if (CROSS_AGENT_TOOLS.includes(context.toolArgs?.tool)) {
  throw BLOCKED; // Agent tried to call external agent's tool
}

// Anti-derailment: text-based ok for thinking patterns
if (DERAILMENT_PATTERNS.some(p => p.test(agentThinking))) {
  throw BLOCKED; // Agent thinking indicates slop
}
```

## Tags
#firewall #mechanical-enforcement #anti-derailment #system-brain