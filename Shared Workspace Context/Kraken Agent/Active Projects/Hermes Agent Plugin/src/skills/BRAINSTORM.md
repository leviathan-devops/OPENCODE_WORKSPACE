---
name: brainstorm
type: interactive
description: Socratic questioning for requirements
executionMode: fork
episodeTimeout: 600000
contextScope: isolated
triggerPatterns:
  - "^/brainstorm"
  - "brainstorm"
  - "think about"
---

# /brainstorm — Socratic Requirements

Explore requirements through Socratic questioning.

## Activation
Triggered by: "/brainstorm", "brainstorm", "think about"

## How It Works

### 1. Surface Assumptions
- What do you think you know?
- What have you assumed that might be wrong?
- What hasn't been questioned?

### 2. Probe Deeply
- Why do you want that?
- What problem does it solve?
- What if we did something different?

### 3. Explore Edge Cases
- What if requirements changed?
- What if scale increased?
- What if users behave unexpectedly?

### 4. Synthesize
- What are we really trying to solve?
- Is there a better approach?
- What constraints are real?

## Questions to Ask
- What problem does this solve?
- Who benefits?
- How do we measure success?
- What could go wrong?
- What's the simplest solution?

## Anti-Rationalization Traps
- "Just build it" → EXPLORE FIRST
- "Requirements are clear" → QUESTION THEM
- "We know what users want" → VERIFY IT
