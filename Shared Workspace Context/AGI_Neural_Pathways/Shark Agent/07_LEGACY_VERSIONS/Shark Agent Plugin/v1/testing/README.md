# Shark Agent Plugin - Opencode Integration

## Overview

The **Shark Agent Plugin** brings the advanced dual-brain architecture of Shark Frankenstein into Opencode as a toggleable plugin. This enables "Shark Mode" - an autonomous AI coding assistant that automatically switches between planning and execution brains with mechanical safety enforcement.

## Key Features

### 🦈 Dual-Brain Architecture
- **Micro Engineer**: DeepSeek Chat (thinks) + local vLLM Qwen 2.5 Coder (executes) - **FREE**
- **Macro Engineer**: GLM 5 (primary) + DeepSeek R1 (advisory) - ~$0.02-0.08/task
- **Automatic Brain Switching**: Visible model changes in Opencode chat UI

### 🛡️ 4-Layer Safety Stack
1. **Guardian**: Filesystem protection (blocks `/etc`, `/usr`, `~/.ssh/`)
2. **FirewallMesh**: 4 parallel security screens (<50ms overhead)
3. **StagnationDetector**: Prevents repetitive failure loops
4. **Workflow Enforcement**: PLAN→BUILD→TEST→VERIFY→SHIP brick-wall

### 🧙 Mode Selector Wizard
- Launches automatically on new sessions
- Interactive mode selection (Micro/Macro)
- Configuration collection for API keys
- Same UX pattern as Opencode's plan mode

### 🔄 Seamless Integration
- Toggleable "Shark Mode" in agent harness UI
- Visible brain switching in chat
- Works alongside existing plan/build modes
- Full compatibility with Opencode tools

## 📚 Context Library (For Sisyphus Agent)

### **Project Overview & Goals**
- **[PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)** - Mission, constraints, and success criteria
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Technical architecture (100% vanilla OpenCode)
- **[CURRENT_STATE.md](CURRENT_STATE.md)** - Current status, blockers, and test results
- **[ROADMAP.md](ROADMAP.md)** - 7-week implementation roadmap
- **[NEXT_STEPS.md](NEXT_STEPS.md)** - Immediate tasks for sisyphus agent

### **Legacy Documentation (Reference)**
- **[SHARK_AGENT_PLUGIN_ARCHITECTURE.md](SHARK_AGENT_PLUGIN_ARCHITECTURE.md)** - Original architecture (needs opencode-ultra references removed)
- **[BUILD_TEAM_IMPLEMENTATION_PLAN.md](BUILD_TEAM_IMPLEMENTATION_PLAN.md)** - Original 7-week plan (updated for vanilla OpenCode)
- **[TECHNICAL_SPECIFICATION.md](TECHNICAL_SPECIFICATION.md)** - Technical specs (opencode-ultra dependency removed)

## Quick Start for Build Teams

### Prerequisites
- Opencode 1.2.0 or higher
- Node.js 18+ / Bun 1.0+
- TypeScript 5.8+
- Access to Shark Frankenstein codebase

### Getting Started
```bash
# 1. Clone or create plugin project
mkdir shark-agent-plugin
cd shark-agent-plugin

# 2. Initialize project
npm init -y
npm install @opencode-ai/plugin @opencode-ai/sdk zod

# 3. Copy architecture documentation
cp -r /path/to/Shared\ Workspace\ Context/Shark\ Agent\ Plugin/*.md .

# 4. Follow the 7-week implementation plan
# See BUILD_TEAM_IMPLEMENTATION_PLAN.md
```

## Core Components

### 1. Plugin Entry Point (`src/index.ts`)
Main plugin initialization and hook registration.

### 2. Mode Selector Wizard (`src/wizard/`)
Interactive wizard for mode selection and configuration.

### 3. Dual-Brain Coordinator (`src/coordinator/`)
Manages brain switching between planning and execution.

### 4. Safety Stack (`src/safety/`)
4-layer safety enforcement integrated with Opencode tools.

### 5. UI Integration (`src/ui/`)
Brain indicators and toggle interface for Opencode UI.

## Development Workflow

### Week 1-2: Foundation
- Project setup and architecture review
- Basic plugin structure with wizard

### Week 3-4: Integration
- Micro engineer implementation
- Macro engineer and UI integration

### Week 5-6: Safety & Optimization
- Complete safety stack integration
- Performance optimization

### Week 7: Deployment
- Testing and documentation
- Release preparation

## Configuration

### Basic Configuration
```json
{
  "plugin": ["shark-agent-plugin"],
  "shark": {
    "default_mode": "micro",
    "auto_launch_wizard": true,
    "safety": {
      "guardian_enabled": true,
      "firewall_mesh_enabled": true
    }
  }
}
```

### Advanced Configuration
See [TECHNICAL_SPECIFICATION.md](TECHNICAL_SPECIFICATION.md#configuration-schema) for complete configuration options.

## Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### Performance Tests
```bash
npm run test:performance
```

## Performance Targets

| Metric | Target | Status |
|--------|--------|--------|
| Wizard completion time | <30 seconds | 🟡 Planned |
| Safety stack overhead | <50ms per tool call | 🟡 Planned |
| Brain switch latency | <100ms | 🟡 Planned |
| Memory usage | <50MB per session | 🟡 Planned |

## Compatibility

### Opencode Versions
- ✅ 1.2.0+
- ⚠️ 1.1.x (partial compatibility)
- ❌ <1.1.0 (not supported)

### Required Plugins
- ✅ **NONE** - 100% standalone for vanilla OpenCode 1.2.0+
- ⚠️ Other plugins (tested for compatibility, no dependencies)

### Model Providers
- ✅ DeepSeek API
- ✅ GLM Coding API  
- ✅ Local vLLM (Qwen 2.5 Coder)
- ✅ Google Gemini/Gemma API

## Contributing

### Build Team Roles
1. **Plugin Architect**: Opencode plugin system expertise
2. **Shark Integration Lead**: Shark Frankenstein codebase expertise
3. **UI/UX Engineer**: Opencode UI integration
4. **QA Engineer**: Testing and validation
5. **Technical Writer**: Documentation

### Code Standards
- TypeScript with strict typing
- Opencode plugin API compliance
- Shark Frankenstein architectural patterns
- Comprehensive test coverage

## Support

### Issue Tracking
- GitHub Issues for bug reports
- Documentation updates in markdown files
- Regular architecture reviews

### Updates
- Monthly compatibility updates for Opencode
- Security patches as needed
- Feature enhancements based on user feedback

## License

Proprietary - See LICENSE file for details.

## Acknowledgments

- **Shark Frankenstein Team**: Original dual-brain architecture and safety stack
- **Opencode Team**: Plugin system and hook architecture
- **Build Teams**: Implementation and testing

---

**Next Steps**: Read [BUILD_TEAM_IMPLEMENTATION_PLAN.md](BUILD_TEAM_IMPLEMENTATION_PLAN.md) for the complete 7-week implementation roadmap.