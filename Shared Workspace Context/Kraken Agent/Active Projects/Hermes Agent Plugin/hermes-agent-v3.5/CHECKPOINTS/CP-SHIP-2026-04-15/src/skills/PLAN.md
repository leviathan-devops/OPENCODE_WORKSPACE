---
name: plan
type: interactive
description: Collaborative planning with no placeholders
executionMode: fork
episodeTimeout: 600000
contextScope: isolated
triggerPatterns:
  - "^/plan"
  - "plan this"
  - "make a plan"
---

# /plan — No-Placeholder Planning

Create a detailed, no-placeholder implementation plan.

## Activation
Triggered by: "/plan", "plan this", "make a plan"

## How It Works

1. **Understand the Goal**
   - Ask clarifying questions until you understand EXACTLY what to build
   - No placeholder paths, no TBD features, no "will be implemented later"

2. **Propose the Plan**
   - Exact file paths with real names
   - Real function signatures
   - Real test scenarios
   - No "will add later" or "TBD"

3. **Iterate with User**
   - User provides feedback
   - Revise plan until approved
   - Each revision must be complete, not partial

4. **Final Output**
   - Complete plan ready for implementation
   - Approved by user
   - No pending questions

## Anti-Rationalization Traps
- "This is fine for now" → REJECTED
- "We'll fix it later" → REJECTED
- "This is just a draft" → REJECTED

## Questions to Ask
- What files need to be created/modified?
- What are the exact function signatures?
- What error cases need handling?
- What tests should pass?
- What are the acceptance criteria?
