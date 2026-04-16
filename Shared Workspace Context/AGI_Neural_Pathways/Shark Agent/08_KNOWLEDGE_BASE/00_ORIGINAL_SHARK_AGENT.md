# Original Shark Agent Architecture (Pre-Opencode Integration)

## Overview
This document describes the original Shark Agent architecture as it existed in the GitHub repository before integration with Opencode. This represents the foundational agent architecture that was later enhanced and integrated into the Opencode framework.

## Core Components

### 1. Dual-Brain Reasoning System
The original Shark Agent featured a sophisticated dual-brain architecture that separated reasoning from execution to optimize both capability and cost.

**Micro Engineer (Free/Local Operations):**
- **Thinker/Planner**: DeepSeek Chat (API-based reasoning)
  - Used exclusively for planning, analysis, and decision-making
  - Minimal API usage (reasoning only, no execution)
- **Doer/Executor**: vLLM Qwen 2.5 Coder 7B AWQ (local, zero-cost)
  - Lobotomized execution engine - executes plans mechanically
  - Zero-cost local operation (no API calls)
  - Handles: code generation, file edits, command execution, testing
- **Fallback**: Gemma 3 4B available as backup Thinker

**Macro Engineer (Paid/Cloud Operations):**
- **Primary Brain**: GLM 5 (128K context window)
- **Advisory Brain**: DeepSeek R1 (complex reasoning tasks)
- **Cost**: ~$0.02-0.08 per task
- **Use Cases**: Multi-file architecture, DevOps, system migrations

### 2. Guardian Firewall Integration
The original Shark Agent integrated the Guardian Firewall as its primary filesystem protection system:
- Zone-based file protection (STRICT, BALANCED, PERMISSIVE, SANDBOX levels)
- Blocked writes to system-critical paths: `/etc`, `/usr`, `~/.ssh/`, `/root/`, `/proc/`, `/sys/`
- Audit logging of all file operations
- Sandbox mode for safe testing and experimentation

### 3. Five-Step Workflow Enforcement (Brick Wall)
Mechanical enforcement preventing hallucination through required evidence at each step:
1. **PLAN**: Written plan file with specific, testable requirements
2. **BUILD**: Actual code files, successful compilation, valid TypeScript types
3. **TEST**: Test execution logs, coverage metrics, edge case testing
4. **VERIFY**: Clean environment results, reproducible builds, no agent context
5. **SHIP**: Mechanical compilation from scratch, fresh dependency install

Each step required concrete evidence - agents could not progress without proof.

### 4. AutoDebug System
Pattern-based error fixing engine:
- 47+ common error patterns for automatic fixing
- Mechanical fix generation without hallucination
- ~60% auto-fix rate for common development errors
- Anti-hallucination validation to prevent false fixes

### 5. ToolExecutor as Constitutional Anchor Point
The single chokepoint through which ALL agent actions flow:
- Every tool call (file operations, commands, etc.) passes through ToolExecutor
- Enables mechanical enforcement of all safety systems at one point
- Makes bypassing safety systems impossible without modifying this core component

## Key Design Philosophies

### Earth Density & River Flow
- **AI Autonomy** = Water (flowing, adaptive, potentially aimless)
- **Mechanical Enforcement** = Riverbanks (providing direction and purpose)
- **Result**: Constrained autonomy that flows with purpose rather than dissipating

### Anti-Slop Focus
- Targets theatrical code (mock, simulate, placeholder) with warnings only
- Does NOT block legitimate development workflows
- Preserves agent productivity while catching low-quality output

### Connect, Don't Create
- Leveraged existing systems rather than building redundant ones
- Example: Connected existing WorkflowBlocker to ToolExecutor rather than recreating it

### YOLO Mode by Default
- Minimal restrictions for maximum flow
- Safety systems GUIDE rather than CRIPPLE agent operations
- Only blocks truly dangerous operations (like `rm -rf /` exact match)

## Evolution Path to Opencode Integration
1. **Original State**: Standalone TypeScript CLI with dual-brain architecture
2. **Enhancement**: Added Opencode's multi-agent orchestration capabilities via opencode-ultra plugin
3. **Integration**: 
   - Shark's dual-brain coordinator integrated with Opencode's agent spawning
   - Guardian Firewall connected to Opencode's security systems
   - Workflow enforcement mapped to Opencode's verification systems
   - ToolExecutor maintained as Constitutional Anchor in new environment
4. **Current State**: Shark Frankenstein operates as a specialized agent within Opencode ecosystem, with access to Opencode's broader toolset while maintaining its core safety and architectural innovations

## Verification Against Original Repos
This architecture aligns with:
- https://github.com/leviathan-devops/shark-agent (dual-brain core)
- https://github.com/leviathan-devops/guardian-firewall (filesystem protection)

The integration preserved these core innovations while adding Opencode's capabilities for multi-agent coordination, extended tool use, and enhanced plugin system.