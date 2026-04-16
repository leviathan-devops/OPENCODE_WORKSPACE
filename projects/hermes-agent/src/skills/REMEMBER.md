---
name: remember
type: action
description: Store important information to 2nd-brain
executionMode: thread
episodeTimeout: 60000
contextScope: shared
triggerPatterns:
  - "^/remember"
  - "save this"
  - "store this"
  - "don't forget"
---

# /remember — Memory Storage

Store important information for future retrieval.

## Activation
Triggered by: "/remember", "save this", "store this", "don't forget"

## How It Works

### 1. Categorize
- What type of memory is this?
  - Pattern (reusable solution)
  - Decision (why choices were made)
  - Failure (what didn't work)
  - Context (project info)
  - Learning (insights gained)

### 2. Store
- Write to ~/.hermes/memory/
- Include metadata (timestamp, source, tags)
- Make searchable

### 3. Confirm
- Confirm memory stored
- Provide retrieval key
- Suggest when to recall

## Memory Format
```
# Memory: [Title]
Type: [pattern|decision|failure|context|learning]
Created: [timestamp]
Tags: [searchable tags]

## Content
[What to remember]

## Retrieval
[When to use this memory]
```
