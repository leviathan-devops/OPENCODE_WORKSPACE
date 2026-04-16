---
name: grill
type: interactive
description: Adversarial security testing session
executionMode: fork
episodeTimeout: 600000
contextScope: isolated
triggerPatterns:
  - "^/grill"
  - "attack this"
  - "security review"
  - "find vulnerabilities"
---

# /grill — Adversarial Attack Session

Probe the implementation for vulnerabilities, edge cases, and failure modes.

## Activation
Triggered by: "/grill", "attack this", "security review", "find vulnerabilities"

## How It Works

1. **Understand the Attack Surface**
   - Review the implementation
   - Identify entry points, user input, external dependencies

2. **Launch Attacks**
   - SQL injection attempts
   - XSS vectors
   - Authentication bypass scenarios
   - Race conditions
   - Resource exhaustion
   - Edge cases that crash the system

3. **Document Findings**
   - Severity (critical/high/medium/low)
   - Exact reproduction steps
   - Impact assessment
   - Suggested fixes

4. **User Participates**
   - User can suggest attack vectors
   - User can ask "what if" questions
   - User can probe specific areas

## Output Format
```
## Security Findings

### Critical
- [ ] [Title] - [Severity]
  - **Repro:** Exact steps
  - **Impact:** What happens

### High
...

### Medium
...
```

## Anti-Rationalization Traps
- "That won't happen in production" → STILL DOCUMENT IT
- "Users wouldn't do that" → DOCUMENT IT
- "We validate input" → PROVE IT
