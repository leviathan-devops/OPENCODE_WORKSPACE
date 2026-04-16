# Shark Frankenstein Safety Stack - 4-Layer Mechanical Enforcement

## Overview
The safety stack is Shark Frankenstein's core innovation preventing hallucination through mechanical enforcement that agents literally cannot bypass. Based on the "Earth Density & River Flow" philosophy: AI autonomy is the water, mechanical enforcement is the riverbanks that give water purpose and direction.

## Layer 1: Guardian Filesystem Protection
**Location**: `src/guardian/`
**Key Files**: `index.ts`, `zone-classifier.ts`, `audit-logger.ts`

### Functionality
- Zone-based file protection system
- Blocks writes to system-critical paths: `/etc`, `/usr`, `~/.ssh/`, `/root/`, `/proc/`, `/sys/`
- Protection levels: STRICT, BALANCED, PERMISSIVE, SANDBOX
- Audit logging of all file operations
- Sandbox mode for safe testing

### Verification Evidence
- Vanilla-vs-Shark divergence test showed 83% failure rate without Guardian
- Blocks dangerous operations like `rm -rf /` while allowing `rm -rf node_modules`
- Creates `.shark/` directory for audit trails and verification gates

## Layer 2: FirewallMesh - Parallel Security Screening
**Location**: `src/firewall/`
**Key Files**: `firewall-mesh.ts`, `guardian-firewall.ts`, `workflow-blocker.ts`, `theatrical-detector.ts`, `secret-detector.ts`

### Functionality
- Four firewalls running in parallel via `Promise.all`
- Total overhead: <50ms
- Each firewall specializes in a different threat domain

### Individual Firewalls
1. **GuardianFirewall** - Filesystem path protection (redundant with Guardian layer)
2. **WorkflowBlocker** - Enforces PLAN→BUILD→TEST→VERIFY→SHIP sequence
3. **TheatricalDetector** - Identifies mock/simulate/placeholder code (WARN only)
4. **SecretDetector** - Prevents accidental credential leaks

### Key Innovation
- Parallel execution (not sequential) ensures all checks always run
- No single point of failure in the screening process
- TheatricalDetector follows anti-slop principle: warn but don't block flow

## Layer 3: StagnationDetector - Loop Prevention
**Location**: `src/stagnation/`
**Key Files**: `stagnation-detector.ts`, `failure-tracker.ts`

### Functionality
- Detects when the AI is stuck in a repetitive failure loop
- Trigger: 3 identical consecutive failures
- Action: Escalation to higher reasoning capacity or workflow reset
- Context capture: Preserves failure context for analysis

### Verification Evidence
- Prevents infinite retry loops on persistent errors
- Allows recovery from transient issues while catching true stagnation
- Integrated with Workflow Enforcement for 3-failure reset mechanism

## Layer 4: Workflow Enforcement - The Brick Wall
**Location**: `src/workflow/`
**Key Files**: `state-machine.ts`, `blocker.ts`, `verification-gates.ts`

### Functionality
- Mechanical 5-step enforcement: PLAN → BUILD → TEST → VERIFY → SHIP
- Each step requires specific evidence to proceed
- Invalid transitions are blocked (not just warned)
- 3-failure reset: After 3 verification failures → reset to PLAN

### Step Requirements
1. **PLAN**: Written plan file with specific, testable requirements
2. **BUILD**: Actual code files, successful compilation, valid TypeScript types
3. **TEST**: Test execution logs (not just "tests pass"), coverage metrics, edge case testing
4. **VERIFY**: Clean environment results, no agent context, reproducible builds
5. **SHIP**: Mechanical compilation from scratch, fresh dependency install, complete integration test

### Key Innovation
- Brick-wall enforcement: Systems cannot bypass through persuasion or manipulation
- Mechanical evidence required at each step (logs, files, exit codes)
- Prevents the "hallucination of completion" where agents claim success without proof

## Integration Points
All safety layers connect through the **ToolExecutor Constitutional Anchor**:
- Every tool call flows through ToolExecutor
- Safety layers can intercept and block/tool calls before execution
- Provides single chokepoint for comprehensive security screening

## Validation Evidence
- Space Invaders Build Log: 21 bugs caught before user testing through mechanical enforcement
- Agent Build Logic Chain: Documents honest failure reporting without hallucination
- GLM-5 Audit Logs: Shows enforcement working in practice

This 4-layer safety stack creates what the documentation calls "Earth Density" - the mechanical constraints that give purpose and direction to the otherwise aimless flow of AI autonomy.