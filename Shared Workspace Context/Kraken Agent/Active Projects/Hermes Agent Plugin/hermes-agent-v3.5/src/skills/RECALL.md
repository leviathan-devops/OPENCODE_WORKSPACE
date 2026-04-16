---
name: recall
type: action
description: Retrieve stored memories from 2nd-brain
executionMode: thread
episodeTimeout: 60000
contextScope: shared
triggerPatterns:
  - "^/recall"
  - "remember this"
  - "what do you know about"
---

# /recall — Memory Retrieval

Retrieve information from the 2nd-brain memory store.

## Activation
Triggered by: "/recall", "remember this", "what do you know about"

## How It Works

### 1. Parse Query
- Extract key topics from query
- Identify memory type needed

### 2. Search Memory
- Search ~/.hermes/memory/
- Find relevant entries
- Rank by relevance

### 3. Return Results
- Relevant memories found
- Source and timestamp
- Confidence level

## Memory Types
- Patterns (reusable solutions)
- Decisions (why choices were made)
- Failures (what didn't work and why)
- Context (project-specific info)

## Anti-Rationalization Traps
- "I don't remember" → CHECK THE MEMORY STORE
- "That was never documented" → CHECK AGAIN
