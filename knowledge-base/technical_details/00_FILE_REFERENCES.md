# File References - Detailed Source Code Locations

This document provides exact file references for all critical components mentioned in the knowledge base, enabling direct navigation to source code.

## Shark Frankenstein Source (`/home/leviathan/OPENCODE_WORKSPACE/shark-frankenstein/`)

### Core Architecture
- **Dual-Brain Coordinator**: `src/brain/coordinator.ts` (V1) / `src/brain/coordinator(V2).ts` (V2)
- **ToolExecutor (Constitutional Anchor)**: `src/tools/executor.ts` (V1) / `src/tools/executor(V2).ts` (V2)
- **Workflow Blocker**: `src/workflow/blocker.ts` (V1) / `src/workflow/blocker(V2).ts` (V2)
- **Guardian Firewall**: `src/guardian/index.ts` + supporting files in `src/guardian/`
- **Stagnation Detector**: `src/stagnation/stagnation-detector.ts`
- **Theatrical Detector**: `src/firewall/theatrical-detector.ts`
- **Secret Detector**: `src/firewall/secret-detector.ts`

### Micro Engineer Components
- **Local vLLM Qwen Integration**: `src/tools/local-vllm-provider.ts`
- **DeepSeek Chat Integration (Thinker)**: `src/brain/deepseek-thinker.ts`
- **Gemma 3 4B Fallback**: `src/brain/gemma-fallback.ts`

### Macro Engineer Components
- **GLM 5 Provider**: `src/tools/glm-provider.ts`
- **DeepSeek R1 Advisory**: `src/brain/deepseek-advisory.ts`

### Safety System Components
- **Firewall Mesh Coordinator**: `src/firewall/firewall-mesh.ts`
- **Verification Gates**: `src/workflow/verification-gates.ts`
- **Audit Logger**: `src/guardian/audit-logger.ts`
- **Sandbox Manager**: `src/guardian/sandbox-manager.ts`

### Utilities and Helpers
- **Context Manager**: `src/utils/context-manager.ts`
- **Token Counter**: `src/utils/token-counter.ts`
- **Performance Monitor**: `src/utils/performance-monitor.ts`
- **Error Handler**: `src/utils/error-handler.ts`

### Configuration Files
- **Main Configuration**: `shark-frankenstein.config.ts`
- **Model Configuration**: `src/config/models.config.ts`
- **Safety Configuration**: `src/config/safety.config.ts`
- **Workflow Configuration**: `src/config/workflow.config.ts`

## Kraken Brain Source (`/home/leviathan/OPENCODE_WORKSPACE/Kraken Brain/`)

### Kraken Ultra (Opencode-Ultra Powered)
- **Main Entry Point**: `Kraken Ultra/src/index.ts`
- **Orchestrator Context**: `Kraken Ultra/Orchestrator Context/`
- **Orchestrator Workspace**: `Kraken Ultra/Orchestrator Workspace/`
- **Agent Prompts**: 
  - `Kraken Ultra/VERSION 1 - GLM ENGINEER PROMPTS.md`
  - `Kraken Ultra/VERSION 2 - GLM ENGINEER PROMPTS.md`
  - `Kraken Ultra/TEST ENGINEER PROMPTS.md`
- **Architecture**: `Kraken Ultra/PROJECT_ARCHITECTURE.md`
- **Orchestration Plan**: `Kraken Ultra/KRAKEN_BRAIN_ORCHESTRATION_PLAN.md`
- **Anti-Hallucination**: `Kraken Ultra/ANTI_HALLUCINATION_VALIDATION.md`
- **Monitoring**: `Kraken Ultra/MONITORING_PROTOCOLS.md`

### Shared Macro Context
- **Project Architecture**: `Shared Macro Context/PROJECT_ARCHITECTURE.md`
- **Build Log**: `Shared Macro Context/KRAKEN_BUILD_LOG.md` (complete development chronicle)
- **ToolExecutor Constitutional Anchor**: `Shared Macro Context/ToolExecutor Firewall Anchor.md`
- **Build Agent Handovers**: `Shared Macro Context/Build Agent Handovers/ToolExecutor_Firewall_Fix_Build_Workflow.md`

### Shark CLI Context (Integration Blueprints)
- **Master Build Prompt**: `Shark CLI Context/SHARK_OPENCODE_MASTER_BUILD_PROMPT_KRAKEN.md`
- **Knowledge Base**: `Shark CLI Context/SHARK_KRAKEN_KNOWLEDGE_BASE.md`
- **Auto-Switch Demo**: `Shark CLI Context/SHARK_AUTO_SWITCH_DEMONSTRATION.md`
- **Integration Blueprint**: `Shark CLI Context/SHARK_OPENCODE_INTEGRATION_BLUEPRINT.md`
- **Master Prompt**: `Shark CLI Context/SHARK-MASTER-PROMPT.md`

### Shark Agent Context (Latest Architecture)
- **Complete Handoff Prompt**: `Shark Agent Context/COMPLETE-HANDOFF-PROMPT.md`
- **Coordinator Overhaul**: `Shark Agent Context/COORDINATOR_OVERHAUL.md`
- **V3 Planning Brain Context**: `Shark Agent Context/V3 Planning Brain Context.md`
- **V4 Context Library**: `Shark Agent Context/V4_CONTEXT_LIBRARY_UPDATED.md`
- **Agent OS**: `Shark Agent Context/Agent OS/` (includes SHARK-MASTER-PROMPT.md, SHARK-REASONING-CHAIN.md)

### Nemotron Communication Layer (`/home/leviathan/OPENCODE_WORKSPACE/OPENCODE WORKSPACE/Nemotron Communication Layer/`)
- **Main Bridge**: `src/nemotron-bridge.ts`
- **Message Classifier**: `src/message-classifier.ts` (2K/4K/6K/8K token sizing)
- **Compression Pipeline**: `src/compression.ts` (context filtering pipeline)
- **Routing System**: `src/routing.ts` (agent routing system)
- **Types**: `src/types.ts` (TypeScript interfaces)
- **Configuration**: `config/nemotron-config.json`

## Opencode Configuration Files

### User Configuration
- **Main Config**: `/home/leviathan/OPENCODE_WORKSPACE/.config/opencode/opencode/opencode.json`
- **Ultra Plugin Config**: `/home/leviathan/OPENCODE_WORKSPACE/.config/opencode/opencode-ultra.json`
- **Package.json**: `/home/leviathan/OPENCODE_WORKSPACE/.config/opencode/package.json`
- **Skills Directory**: `/home/leviathan/OPENCODE_WORKSPACE/.config/opencode/skills/` (including shark-agent skill)

### Workspace Configuration (Mirror)
- **Main Config**: `/home/leviathan/OPENCODE_WORKSPACE/configs/opencode/opencode/opencode.json`
- **Shark Agent Config**: `/home/leviathan/OPENCODE_WORKSPACE/configs/shark-agent/config.json`
- **Path Mapping**: `/home/leviathan/OPENCODE_WORKSPACE/configs/path-mapping.json`

## Environment Variables and API Keys

### Required for Full Functionality
- `GLM_API_KEY` - For GLM 5, GLM 4.7, GLM 4.5 APIs (Macro Engineer primary)
- `DEEPSEEK_API_KEY` - For DeepSeek Chat (Micro Engineer Thinker) and DeepSeek R1 (Macro Engineer advisory)
- `GOOGLE_API_KEY` - For Google Gemma models (fallback Thinker)
- `OPENAI_API_KEY` - Optional for testing/comparison
- `ANTHROPIC_API_KEY` - Optional for testing/comparison

### Optional Configuration
- `TOKENIZERS_PARALLELISM=false` - Recommended for better performance
- `VLLM_HOST=http://localhost:8000` - Local vLLM server for Qwen Model
- `VLLM_PORT=8000` - Local vLLM server port
- `MAX_CONTEXT_TOKENS=32768` - Context window for local models

## Test Files and Validation Scripts

### Shark Frankenstein Tests
- **Unit Tests**: `/home/leviathan/OPENCODE_WORKSPACE/shark-frankenstein/src/test/unit/`
- **Integration Tests**: `/home/leviathan/OPENCODE_WORKSPACE/shark-frankenstein/src/test/integration/`
- **End-to-End Tests**: `/home/leviathan/OPENCODE_WORKSPACE/shark-frankenstein/src/test/e2e/`
- **Performance Tests**: `/home/leviathan/OPENCODE_WORKSPACE/shark-frankenstein/src/test/performance/`
- **Security Tests**: `/home/leviathan/OPENCODE_WORKSPACE/shark-frankenstein/src/test/security/`

### Workspace Validation
- **Validator Script**: `/home/leviathan/OPENCODE_WORKSPACE/tools/validators/validate-workspace.sh`
- **Migration Assistant**: `/home/leviathan/OPENCODE_WORKSPACE/tools/migrators/agent-migration-assistant.sh`
- **Path Updater**: `/home/leviathan/OPENCODE_WORKSPACE/tools/updaters/update-paths.py`

### Kraken Ultra Tests
- **Unit Tests**: `/home/leviathan/OPENCODE_WORKSPACE/Kraken Brain/Kraken Ultra/Orchestrator Workspace/test-engineers/`
- **Integration Tests**: `/home/leviathan/OPENCODE_WORKSPACE/Kraken Brain/Kraken Ultra/Orchestrator Workspace/nemotron-reports/`
- **Stage Reports**: `/home/leviathan/OPENCODE_WORKSPACE/Kraken Brain/Kraken Ultra/Orchestrator Workspace/STAGE*_REPORT.md`

## Log Files and Artifacts

### Active Logs
- **Shark Process Log**: `/home/leviathan/OPENCODE_WORKSPACE/shark-frankenstein/shark.log`
- **Error Log**: `/home/leviathan/OPENCODE_WORKSPACE/shark-frankenstein/error.log`
- **Performance Log**: `/home/leviathan/OPENCODE_WORKSPACE/shark-frankenstein/performance.log`
- **Audit Log**: `/home/leviathan/OPENCODE_WORKSPACE/shark-frankenstein/.shark/guardian/audit.log`
- **Conversation Log**: `/home/leviathan/OPENCODE_WORKSPACE/shark-frankenstein/.shark/conversation.log`

### Kraken Brain Logs
- **Execution Log**: `/home/leviathan/OPENCODE_WORKSPACE/Kraken Brain/Kraken Ultra/Orchestrator Workspace/EXECUTION_LOG.md`
- **Nemotron Reports**: `/home/leviathan/OPENCODE_WORKSPACE/Kraken Brain/Kraken Ultra/Orchestrator Workspace/nemotron-reports/`
- **Stage Reports**: `/home/leviathan/OPENCODE_WORKSPACE/Kraken Brain/Kraken Ultra/Orchestrator Workspace/STAGE*_REPORT.md`

### Artifact Storage
- **Gold Standard Artifacts**: `/home/leviathan/OPENCODE_WORKSPACE/Kraken Brain/Gold Standard Aritfacts/`
  - Space Invaders Build Log
  - Agent Build Logic Chain
- **Build Reports**: `/home/leviathan/OPENCODE_WORKSPACE/OPENCODE WORKSPACE/01_BUILD_REPORTS.md` through `06_KEY_INSIGHTS.md`
- **Context Libraries**: Various `*_CONTEXT.md` files throughout
- **Prompt Libraries**: Various `*_PROMPT.md` files

## Docker and Containerization Files

### Development Containers
- **Docker Compose**: `/home/leviathan/OPENCODE_WORKSPACE/shark-frankenstein/docker-compose.yml`
- **vLLM Server**: `/home/leviathan/OPENCODE_WORKSPACE/vllm-error-diagnosis.log`, `/home/leviathan/OPENCODE_WORKSPACE/vllm.log`
- **TGII Server**: `/home/leviathan/OPENCODE_WORKSPACE/tgi/`
- **Various Model Servers**: Containers in `/home/leviathan/OPENCODE_WORKSPACE/`

### Build Containers
- **Shark Build**: `/home/leviathan/OPENCODE_WORKSPACE/shark-frankenstein/` (TypeScript build)
- **Kraken Build**: `/home/leviathan/OPENCODE_WORKSPACE/Kraken Brain/Kraken Ultra/` (TypeScript build)
- **Nemotron Build**: `/home/leviathan/OPENCODE_WORKSPACE/OPENCODE WORKSPACE/Nemotron Communication Layer/` (TypeScript build)

## Monitoring and Metrics

### Token Usage Tracking
- **In-Memory Metrics**: Tracked by Nemotron bridge
- **Persistent Storage**: `.shark/telemetry/token-metrics.json`
- **Daily Reports**: Generated at midnight local time
- **Alert Thresholds**: Configurable warning/critical levels

### Performance Metrics
- **Operation Latency**: Tracked per tool type
- **Success Rates**: Overall and per-agent-type
- **Error Patterns**: Categorized by failure type
- **Context Utilization**: Average/peak token usage

### Safety Metrics
- **Blocked Operations**: By type and reason
- **Theatrical Detections**: Count and examples
- **Workflow Violations**: By step and agent
- **Stagnation Events**: Frequency and recovery time

## Backup and Recovery Systems

### Automatic Backups
- **Configuration Backups**: `.config/opencode.backup.*`
- **State Snapshots**: `.shark/snapshots/` (periodic)
- **Conversation History**: `.shark/conversation-history/` (timestamped)
- **Model Cache**: `.shark/model-cache/` (for faster reloads)

### Recovery Procedures
1. **From Configuration Backup**: Restore `.config/opencode` from latest backup
2. **From State Snapshot**: Restore `.shark/` directory from snapshot
3. **From Scratch**: Reinstall dependencies and reconnect to APIs
4. **Partial Recovery**: Restore specific components (e.g., just Guardian config)

## Verification of File References

All file references in this document have been verified against the actual filesystem as of the knowledge base compilation date (2026-03-29). To verify any reference:

```bash
# Check if file exists
ls -la /path/to/file.md

# If unsure about path, search
find /home/leviathan/OPENCODE_WORKSPACE -name "filename.ts" 2>/dev/null

# Check file contents (first few lines)
head -10 /path/to/file.ts
```

This file reference appendix enables immediate navigation to any component of the Shark Frankenstein ecosystem for deep dives, debugging, or extension work.