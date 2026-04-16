# Opencode Integration - Shark Frankenstein on Opencode Platform

## Overview
Shark Frankenstein was originally built as a standalone TypeScript CLI attempting to customize Qwen Code into an agent with mechanical enforcement. The discovery of Opencode provided a ready-made platform with many of the desired features (multi-agent orchestration, tool use, agent spawning, plugin system). The integration shifted Shark Frankenstein from a custom Qwen Code fork to an Opencode-powered agent, leveraging Opencode's strengths while preserving Shark's core innovations.

## Why Opencode?
Opencode already provided:
- Multi-agent orchestration capabilities
- Built-in tool use system
- Agent spawning and management
- Plugin system for extending functionality
- Session management and context handling
- Provider abstraction for multiple LLMs

This allowed the Shark Frankenstein team to focus on integrating their core innovations (dual-brain architecture, safety stack, workflow enforcement) rather than rebuilding basic agent infrastructure.

## Integration Approach
The integration followed a "V2 alongside V1" strategy for safe migration:
- V1 files remain untouched as reference and fallback
- V2 files are created with `(V2)` suffix (e.g., `executor(V2).ts`)
- V2 files are gradually wired up and tested
- Once V2 is stable, V1 can be deprecated

This approach allowed zero-downtime migration and easy rollback.

## Core Integration Points

### 1. Dual-Brain Coordinator Integration
- Shark's dual-brain coordinator (Micro/Macro engineer routing) integrated with Opencode's agent system
- Micro Engineer: Uses local vLLM Qwen for execution, DeepSeek Chat for thinking (API)
- Macro Engineer: Uses GLM 5 (primary) + DeepSeek R1 (advisory) via Opencode's provider system
- Coordinator decides which engineer tier to use based on task complexity

### 2. Safety Stack Mapping
Each layer of Shark's 4-layer safety stack was mapped to Opencode's equivalent systems:
- **Guardian** → Mapped to Opencode's file system tools with path restrictions
- **FirewallMesh** → Implemented as pre-tool hooks in Opencode (parallel execution via Promise.all)
- **StagnationDetector** → Integrated as a session monitor checking for repetitive failures
- **Workflow Enforcement** → Mapped to Opencode's verification system and custom step tracking

### 3. ToolExecutor as Constitutional Anchor
The ToolExecutor remained the single chokepoint:
- All tool calls in Opencode flow through the customized ToolExecutor
- Safety layers (Guardian, FirewallMesh, etc.) are called from within ToolExecutor
- This preserves the "cannot bypass" property even in the Opencode environment

### 4. Opencode-Ultra Plugin for Kraken Brain
The opencode-ultra plugin (already existing) provided the multi-agent orchestration needed for Kraken Brain:
- Spawns and manages GLM engineer instances
- Distributes tasks with concurrency control
- Monitors progress and collects outputs
- Integrates with existing Shark Agent skills
- Provides the workforce layer for the hive orchestrator

## Current State of Integration
- **V2 files exist alongside V1** in `/home/leviathan/OPENCODE_WORKSPACE/shark-frankenstein/src/`
- **Opencode configuration** updated in `/home/leviathan/OPENCODE_WORKSPACE/.config/opencode/opencode.json`
- **Provider setup**: 
  - Local vLLM for Qwen (Micro Engineer execution)
  - GLM 5 API for Macro Engineer primary
  - DeepSeek Chat API for thinking/Macro advisory
- **Plugin system**: opencode-ultra installed and configured
- **Safety layers**: Partially integrated (Guardian connected, WorkflowBlocker pending connection)

## Key Files Modified/Added
- `shark-frankenstein/src/tools/executor(V2).ts` - V2 ToolExecutor with safety layer integration points
- `shark-frankenstein/src/workflow/blocker(V2).ts` - V2 WorkflowBlocker (awaiting connection to ToolExecutor)
- `shark-frankenstein/src/guardian/index.ts` - Guardian (already connected to V1 ToolExecutor, needs V2 connection)
- `shark-frankenstein/src/brain/coordinator(V2).ts` - V2 dual-brain coordinator
- `.config/opencode/opencode.json` - Updated provider and plugin configuration
- `OPENCODE_WORKSPACE/configs/opencode/opencode/opencode.json` - Workspace version of config

## Verification of Integration
- **TypeScript compilation**: Passes for V2 files
- **V2 Integration tests**: 11/11 passing (as per handover packages)
- **Stage 1 Docker tests**: 3/4 passing (Stage 2 pending API keys)
- **Guardian connectivity**: Confirmed connected to V1 ToolExecutor
- **WorkflowBlocker status**: Exists but not yet connected to ToolExecutor (pending Task 2 from handover)

## Benefits of Opencode Platform
1. **Reduced engineering effort**: Leveraged existing multi-agent and tool systems
2. **Better plugin ecosystem**: Access to opencode-ultra and other community plugins
3. **Standardized interfaces**: Consistent tool use and agent spawning patterns
4. **Future-proofing**: Easier to adopt new LLMs and features via Opencode updates
5. **Community benefits**: Opportunity to contribute back to Opencode ecosystem

## Risks and Mitigations
- **Risk**: V2 file naming with parentheses causes CLI issues
  **Mitigation**: Planned rename to remove parentheses (e.g., `executor_v2.ts`)
- **Risk**: Incomplete safety layer connections
  **Mitigation**: Handover packages detail exact connections needed (Task 2: connect WorkflowBlocker)
- **Risk**: Configuration drift between original and workspace
  **Mitigation**: Workspace uses symlinked configs and path mapping tools

## Future Integration Work
1. Complete WorkflowBlocker connection to ToolExecutor (Constitutional Anchor completion)
2. Connect remaining safety layers (TheatricalDetector, SecretDetector) to ToolExecutor mesh
3. Rename V2 files to remove parentheses for CLI compatibility
4. Fully integrate V2 systems and deprecate V1
5. Add Opencode-specific features (session sharing, web UI customization)
6. Contribute Shark-inspired safety patterns back to Opencode core

## Files for Reference
- `/home/leviathan/OPENCODE_WORKSPACE/shark-frankenstein/src/tools/executor.ts` (V1)
- `/home/leviathan/OPENCODE_WORKSPACE/shark-frankenstein/src/tools/executor(V2).ts` (V2)
- `/home/leviathan/OPENCODE_WORKSPACE/shark-frankenstein/src/workflow/blocker.ts` (V1)
- `/home/leviathan/OPENCODE_WORKSPACE/shark-frankenstein/src/workflow/blocker(V2).ts` (V2)
- `/home/leviathan/OPENCODE_WORKSPACE/shark-frankenstein/src/guardian/index.ts` (Guardian - connected to V1)
- `/home/leviathan/OPENCODE_WORKSPACE/.config/opencode/opencode.json` (Current config)
- `/home/leviathan/OPENCODE_WORKSPACE/configs/opencode/opencode/opencode.json` (Workspace config)