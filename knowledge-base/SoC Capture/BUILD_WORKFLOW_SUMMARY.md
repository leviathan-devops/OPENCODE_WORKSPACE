# Build Workflow Summary

## Quick Reference Guide

### Project Goal
Rewrite `opencode-ultra` to support customizable agent names and integrate with Shark Frankenstein CLI featuring OpenCode Zen free models and a micro/macro launch wizard.

## File Reference

| File | Purpose | Key Deliverables |
|------|---------|------------------|
| `OPENCODE_ULTRA_REWRITE_STRATEGY.md` | Strategy for customizable agent names | Abstract agent schema, dynamic resolution, backward compatibility |
| `OPENCODE_ULTRA_ARCHITECTURE_MAP.md` | Plugin architecture documentation | Component maps, data flows, dependency graphs |
| `SHARK_CLI_LAUNCH_CORRECTION.md` | Micro/macro wizard implementation | Shark launcher script, fragment system, configuration generation |
| `OPENCODE_ZEN_INTEGRATION_WORKFLOW.md` | Zen free model integration | Provider configuration, fallback chains, model selection algorithm |
| `BUILD_TEAM_IMPLEMENTATION_PLAN.md` | Complete phased implementation plan | 8-week timeline, team roles, risk management, success metrics |

## Phase Overview

### Phase 1: Foundation (Week 1-2)
- **Objective**: Understand architecture, set up environment
- **Key Tasks**: 
  - Study opencode-ultra source code
  - Create abstract agent schema
  - Set up development environment
- **Deliverables**: Architecture doc, dev environment, schema prototype

### Phase 2: Plugin Rewrite (Week 3-4)
- **Objective**: Rewrite opencode-ultra for customizable agents
- **Key Tasks**:
  - Replace `BUILTIN_AGENTS` with configurable system
  - Update `spawn_agent` and other tools
  - Modify prompt generation
- **Deliverables**: Rewritten plugin, backward compatibility, test suite

### Phase 3: Shark CLI Integration (Week 5)
- **Objective**: Create seamless launch experience
- **Key Tasks**:
  - Create `shark` command with wizard
  - Implement temporary config generation
  - Add fragment injection
- **Deliverables**: Shark launcher, installation script, fragment system

### Phase 4: OpenCode Zen Integration (Week 6)
- **Objective**: Integrate free models with fallbacks
- **Key Tasks**:
  - Add Zen provider to config
  - Update agent models with fallback chains
  - Implement model selection algorithm
- **Deliverables**: Zen provider integration, free model access, monitoring

### Phase 5: Testing & Deployment (Week 7-8)
- **Objective**: Comprehensive testing and production release
- **Key Tasks**:
  - Functional, integration, performance testing
  - Production deployment
  - Documentation updates
- **Deliverables**: Test suite, production release, user docs

## Critical Path Items

### Must-Have Features
1. **Backward Compatibility**: Existing `opencode-ultra.json` configs must work
2. **Agent Renaming**: Support Shark agent names (`kraken-brain`, `shark-agent`)
3. **Micro/Macro Wizard**: Simple mode selection in Shark CLI
4. **Zen Free Models**: Access to MiMo/Nemotron/MiniMax free models
5. **Performance Parity**: No degradation in agent spawning

### Technical Dependencies
1. **OpenCode 1.2.x+**: Plugin compatibility
2. **Node.js 18+**: Build environment
3. **Zen API Key**: For free model access
4. **GLM/DeepSeek API Keys**: For fallback providers

## Quick Start Commands

### Development Setup
```bash
# 1. Fork and clone opencode-ultra
git clone https://github.com/your-org/opencode-ultra.git
cd opencode-ultra

# 2. Install dependencies
npm install

# 3. Build plugin
npm run build

# 4. Test with OpenCode
opencode --plugin ./dist/index.js
```

### Testing Shark CLI
```bash
# 1. Install Shark launcher
sudo cp shark-launcher.sh /usr/local/bin/shark
sudo chmod +x /usr/local/bin/shark

# 2. Test basic functionality
shark                          # Should show wizard
shark --micro "test task"      # Should launch OpenCode
shark --providers              # Should show provider status
```

### Zen Integration Test
```bash
# 1. Set API key
export OPENCODE_ZEN_API_KEY="your-key"

# 2. Test free models
opencode run --model "0-opencode-zen/minimax-m2.5-free" "Hello"
opencode run --model "0-opencode-zen/mimo-v2-omni-free" "Describe" @image.png
```

## Configuration Files

### Core Configuration Locations
1. **OpenCode Config**: `~/.config/opencode/opencode.json`
2. **OpenCode-Ultra Config**: `~/.config/opencode/opencode-ultra.json`
3. **Shark Fragments**: `~/OPENCODE_WORKSPACE/.shark/fragments/`
4. **Temporary Configs**: `/tmp/shark-XXXXX/` (generated at runtime)

### Key Configuration Changes

#### Current → New
```json
// CURRENT (override only)
{
  "agents": {
    "sisyphus": { "model": "0-glm-coding/glm-5" }
  }
}

// NEW (full customization)
{
  "agent_definitions": {
    "kraken-brain": {
      "id": "sisyphus",
      "display_name": "Kraken Brain",
      "model": "0-opencode-zen/glm-5",
      "aliases": ["sisyphus", "orchestrator"]
    }
  }
}
```

## Testing Checklist

### Phase 2: Plugin Rewrite
- [ ] All 9 built-in agents work with legacy config
- [ ] Custom agent definitions can be added
- [ ] Agent aliases resolve correctly
- [ ] `spawn_agent` works with new names
- [ ] Prompt generation uses display names
- [ ] Evolve system recognizes custom agents

### Phase 3: Shark CLI
- [ ] `shark` command shows wizard
- [ ] Mode auto-detection works
- [ ] Temporary config generation works
- [ ] Fragment injection works
- [ ] Agent mappings correct in OpenCode TUI

### Phase 4: Zen Integration
- [ ] Zen provider loads without errors
- [ ] Free models accessible
- [ ] Fallback chains work
- [ ] Model selection algorithm works
- [ ] Concurrency limits respected

## Common Issues & Solutions

### Issue: Plugin not loading
```bash
# Check OpenCode version
opencode --version

# Check plugin compatibility
opencode --plugin ./dist/index.js --help
```

### Issue: Agent spawning fails
```bash
# Check agent resolution
export DEBUG=opencode-ultra:*
shark --micro "test"

# Check configuration
cat /tmp/shark-*/opencode-ultra.json
```

### Issue: Zen models unavailable
```bash
# Check API key
echo $OPENCODE_ZEN_API_KEY

# Test directly
curl -H "Authorization: Bearer $OPENCODE_ZEN_API_KEY" \
  https://opencode.ai/zen/v1/models
```

## Performance Targets

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Agent spawning | < 500ms | Time from `spawn_agent` to execution start |
| Config loading | < 100ms | Time to load and merge configurations |
| Zen API latency | < 1000ms | Response time for free models |
| Memory per agent | < 10MB | Resident memory for spawned agent |
| Concurrent agents | 10+ | Maximum supported concurrent spawns |

## Team Communication

### Daily Standup Format
1. **Yesterday**: What was accomplished
2. **Today**: What will be worked on
3. **Blockers**: Any impediments
4. **Help needed**: Specific assistance required

### Weekly Demo Agenda
1. **Progress review**: Completed milestones
2. **Demo**: Working features
3. **Metrics**: Performance data
4. **Next week**: Planned work
5. **Risks**: Updated risk assessment

## Success Criteria

### Minimum Viable Product (MVP)
- [ ] Custom agent names work (`kraken-brain`, `shark-agent`)
- [ ] Shark CLI with micro/macro wizard
- [ ] Backward compatibility preserved
- [ ] Zen free models accessible

### Complete Success
- [ ] All 5 phases completed on schedule
- [ ] Performance targets met
- [ ] Zero breaking changes for existing users
- [ ] Positive user feedback

## Contact Points

### Technical Lead
- **Role**: Architecture decisions, critical path
- **Availability**: Daily standup, weekly demo

### Plugin Specialist
- **Role**: opencode-ultra codebase expertise
- **Availability**: Code reviews, implementation guidance

### Integration Engineer
- **Role**: Shark CLI and Zen integration
- **Availability**: Configuration management, testing

### QA Engineer
- **Role**: Testing automation, validation
- **Availability**: Test planning, bug verification

## Timeline Summary

| Week | Phase | Key Milestone |
|------|-------|---------------|
| 1-2 | Foundation | Architecture understanding, dev environment |
| 3-4 | Plugin Rewrite | Customizable agent names, backward compatibility |
| 5 | Shark CLI Integration | Micro/macro wizard, fragment system |
| 6 | Zen Integration | Free models, fallback chains |
| 7-8 | Testing & Deployment | Production release, documentation |

---

*This summary provides quick reference for the build team. Refer to individual workflow documents for detailed implementation steps.*