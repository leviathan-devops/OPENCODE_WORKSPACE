# Shark Frankenstein Dual-Brain Architecture

## Overview
Shark Frankenstein implements a dual-brain architecture where different LLMs are specialized for different types of tasks within the same agent. This creates a hybrid system that optimizes for both capability and cost.

## Micro Engineer (Free/Local Tier)
### Architecture
- **Thinker/Planner (Reasoning Brain)**: DeepSeek Chat (API-based)
  - Used exclusively for planning, reasoning, and decision-making
  - Minimizes API usage by restricting to cognitive tasks only
  - Does NOT perform code execution or file operations
- **Doer/Executor (Lobotomized Execution Brain)**: vLLM Qwen 2.5 Coder 7B AWQ (local, zero-cost)
  - Lobotomized: Capable of executing plans but cannot engage in independent reasoning or planning
  - Zero-cost local execution (no API calls)
  - Handles: code generation, file edits, command execution, testing
  - Receives structured plans from Thinker/Planner and executes them mechanically

### Workflow Flow
1. User request → Micro Engineer Thinker (DeepSeek Chat)
2. Thinker generates: structured plan + executable commands (minimal API usage)
3. Plan passed to Micro Engineer Executor (vLLM Qwen local)
4. Executor performs: mechanical execution only (file edits, commands, tests)
5. Results returned to Thinker for validation (if needed)
6. Final output to user

### Key Properties
- API Cost Optimization: DeepSeek Chat used only for thinking (typically <10% of total tokens)
- Execution Locality: All code/file operations run via zero-cost local vLLM
- Fallback System: Gemma 3 4B available as backup Thinker if DeepSeek unavailable
- Safety Integration: Executor remains subject to all 4-layer safety stack

### Verification Points
- In `shark-frankenstein/src/brain/` directory: coordinator that routes planning to DeepSeek and execution to vLLM
- Micro Engineer prompts show: thinking phase (DeepSeek) → execution phase (local Qwen)
- API logs show DeepSeek calls only during planning phases, not during file edits/commands

## Macro Engineer (Paid/Cloud Tier)
### Architecture
- **Primary Brain**: GLM 5 (128K context window)
- **Advisory Brain**: DeepSeek R1 (for complex reasoning tasks)
- Cost: ~$0.02-0.08 per task

### Use Cases
- Multi-file architecture changes
- DevOps and system migrations
- Complex refactoring requiring large context
- Autonomous scaffolding of new features

### Integration
- Primary brain generates plans and code
- Advisory brain reviews for correctness and suggests improvements
- Both subject to the same 4-layer safety stack

## Dual-Brain Coordinator
Located in `src/brain/`:
- Responsible for task analysis and routing to appropriate engineer tier
- Implements auto-switch logic based on task complexity
- Maintains context between Micro and Macro operations
- Handles fallback scenarios when primary brains are unavailable

## Safety Integration with Dual-Brain
All brains (both tiers) are subject to the 4-layer safety stack:
1. Guardian - filesystem protection
2. FirewallMesh - parallel security checks
3. StagnationDetector - loop detection
4. Workflow Enforcement - PLAN→BUILD→TEST→VERIFY→SHIP

This ensures that regardless of which brain is operating, mechanical enforcement prevents hallucination and unsafe actions.