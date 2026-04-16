---
name: debug
type: action
description: Systematic debugging with root cause analysis
executionMode: thread
episodeTimeout: 600000
contextScope: isolated
triggerPatterns:
  - "^/debug"
  - "debug this"
  - "fix this bug"
  - "it's broken"
---

# /debug — Systematic Debugging

Debug issues with root cause analysis, not guesswork.

## Activation
Triggered by: "/debug", "debug this", "fix this bug", "it's broken"

## How It Works

### 1. Reproduce
- Get exact error message
- Get exact steps to reproduce
- Confirm the bug exists

### 2. Hypothesize
- What COULD cause this?
- List all possibilities
- Rank by likelihood

### 3. Test
- Test each hypothesis
- Eliminate possibilities
- Find root cause

### 4. Fix
- Fix the root cause
- Not just the symptom
- Verify fix works

### 5. Prevent
- Add regression test
- Document what broke
- Share lessons learned

## Debugging Questions
- What error message did you get?
- What were the exact steps?
- When did it start breaking?
- What changed recently?
- Does it happen every time or sometimes?

## Anti-Rationalization Traps
- "I'll just try this and see" → USE HYPOTHESES
- "It's probably a typo" → PROVE IT
- "That shouldn't matter" → PROVE IT DOESN'T
