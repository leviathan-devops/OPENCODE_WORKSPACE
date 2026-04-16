---
name: verify
type: action
description: Proof-based verification with actual command output
executionMode: thread
episodeTimeout: 600000
contextScope: isolated
triggerPatterns:
  - "^/verify"
  - "verify"
  - "proof"
  - "test passed"
---

# /verify — Proof-Based Verification

Verify implementation with ACTUAL command output, not promises.

## Activation
Triggered by: "/verify", "verify", "proof", "test passed"

## How It Works

### 1. List Promises
What was supposed to be built? What are the acceptance criteria?

### 2. Execute Verification
For each promise:
- RUN the actual command
- CAPTURE actual output
- COMPARE to expected

### 3. Report Results
- What passed (with actual output)
- What failed (with actual vs expected)
- What needs investigation

## Verification Methods
- Run test suite: `npm test` or `bun test`
- Check file exists: `ls -la`
- Run linter: `npm run lint`
- Check types: `tsc --noEmit`
- Manual testing commands

## Anti-Rationalization Traps
- "It should work" → NEEDS ACTUAL OUTPUT
- "Tests passed" → SHOW THE OUTPUT
- "Linter is clean" → SHOW THE OUTPUT
