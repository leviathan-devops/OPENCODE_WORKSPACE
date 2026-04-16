# Build Team Implementation Plan

## Project Overview
Rewrite `opencode-ultra` plugin to support customizable agent names while maintaining 100% backward compatibility, and integrate it with Shark Frankenstein CLI featuring OpenCode Zen free models and a corrected micro/macro launch experience.

## Goals
1. **Customizable Agent Names**: Allow Shark agent naming (`kraken-brain`, `shark-agent`, etc.) in opencode-ultra
2. **Seamless Shark CLI**: `shark` command with micro/macro wizard launching enhanced OpenCode TUI
3. **OpenCode Zen Integration**: Access to free models (MiMo V2 Omni Free, Nemotron 3 Super Free, MiniMax M2.5 Free)
4. **Backward Compatibility**: Existing `opencode-ultra.json` configs continue working
5. **Performance Parity**: No degradation in agent spawning or task execution

## Team Structure & Roles

### Core Team (3-4 Engineers)
- **Lead Architect**: Overall architecture, critical path decisions
- **Plugin Specialist**: opencode-ultra codebase expertise
- **CLI/UX Engineer**: Shark CLI launch experience
- **Integration Engineer**: Zen provider & configuration management

### Support Roles
- **QA Engineer**: Testing automation & validation
- **Documentation Specialist**: User guides & migration docs
- **DevOps Engineer**: Build pipeline & deployment

## Phased Implementation Plan

### Phase 1: Foundation (Week 1-2)
**Goal**: Understand current architecture and set up development environment

#### Week 1: Discovery & Planning
- **Day 1**: Study opencode-ultra source code and architecture
  - Map all internal references to agent names
  - Identify configuration loading flow
  - Document hook and tool systems
- **Day 2**: Analyze Shark CLI current implementation
  - Review `shark-opencode-wrapper.sh`
  - Understand agent mapping logic
  - Identify integration points
- **Day 3**: OpenCode Zen provider research
  - Test API access to free models
  - Understand rate limits and capabilities
  - Document integration requirements
- **Day 4**: Development environment setup
  - Fork opencode-ultra repository
  - Set up build tools (`npm run build`, `npm test`)
  - Create test harness for existing functionality
- **Day 5**: Create detailed technical specifications
  - Agent schema design
  - Configuration migration plan
  - Integration test matrix

#### Week 2: Core Infrastructure
- **Day 1-2**: Abstract agent schema implementation
  - Define `AgentDefinition` interface
  - Create configuration validation with Zod
  - Implement schema migration utilities
- **Day 3-4**: Dynamic agent resolution system
  - Create `resolveAgentId()` function
  - Implement alias support
  - Add fallback mechanisms
- **Day 5**: Configuration loading refactor
  - Update `loadConfig()` to support new schema
  - Create backward compatibility layer
  - Test with existing configs

**Deliverables**:
- ✅ Architecture analysis document
- ✅ Development environment
- ✅ Abstract agent schema implementation
- ✅ Dynamic agent resolution prototype

### Phase 2: Plugin Rewrite (Week 3-4)
**Goal**: Rewrite opencode-ultra core components to support customizable agents

#### Week 3: Core Component Updates
- **Day 1-2**: Agent management system
  - Replace `BUILTIN_AGENTS` with configurable system
  - Update `buildAgents()` and `buildAgentTable()`
  - Implement agent display name support
- **Day 3-4**: Tool system refactor
  - Update `spawn_agent` tool to use resolved IDs
  - Modify safety checks for new agent definitions
  - Update `ralph_loop` and other agent-aware tools
- **Day 5**: Prompt generation updates
  - Modify `SISYPHUS_PROMPT_TEMPLATE` to use display names
  - Update agent table generation
  - Test prompt injection with custom names

#### Week 4: Hook System & Integration
- **Day 1-2**: Hook updates
  - Update `keyword-detector` to recognize new agent names
  - Modify `fragment-injector` for agent-specific fragments
  - Ensure all hooks work with resolved agent IDs
- **Day 3-4**: Evolve system compatibility
  - Update evolve tools to work with new agent schema
  - Ensure self-improvement workflow recognizes custom agents
  - Test evolve execution with Shark agent names
- **Day 5**: Comprehensive testing
  - Unit tests for all modified components
  - Integration tests with legacy configurations
  - Performance benchmarks

**Deliverables**:
- ✅ Rewritten opencode-ultra with customizable agents
- ✅ Backward compatibility layer
- ✅ Updated test suite
- ✅ Performance benchmarks

### Phase 3: Shark CLI Integration (Week 5)
**Goal**: Create seamless Shark CLI launch experience

#### Week 5: CLI & Launch Experience
- **Day 1**: Shark launcher script
  - Create `/usr/local/bin/shark` with micro/macro wizard
  - Implement mode selection and auto-detection
  - Create temporary configuration generation
- **Day 2**: Environment management
  - Implement `prepare_environment()` function
  - Create configuration merging system
  - Set up fragment file injection
- **Day 3**: Provider integration
  - Add OpenCode Zen provider checks
  - Implement model fallback resolution
  - Create provider status command
- **Day 4**: Testing & refinement
  - Test launch experience end-to-end
  - Verify agent mappings work correctly
  - Test fragment injection
- **Day 5**: Installation & deployment
  - Create installation script
  - Document setup process
  - Prepare for user testing

**Deliverables**:
- ✅ `shark` command with micro/macro wizard
- ✅ Temporary configuration generation
- ✅ Fragment injection system
- ✅ Installation script

### Phase 4: OpenCode Zen Integration (Week 6)
**Goal**: Integrate Zen free models with fallback chains

#### Week 6: Zen Provider & Model Management
- **Day 1**: Zen provider configuration
  - Update `opencode.json` with Zen provider
  - Configure free models (MiMo, Nemotron, MiniMax)
  - Set up API key management
- **Day 2**: Agent model updates
  - Update `opencode-ultra.json` agent models
  - Implement fallback chains for each agent
  - Configure concurrency limits for Zen
- **Day 3**: Model selection algorithm
  - Implement `resolve_model()` with priority chains
  - Create provider health checking
  - Implement fast failover
- **Day 4**: Monitoring & logging
  - Add provider usage tracking
  - Create log files for debugging
  - Implement status reporting
- **Day 5**: Testing & optimization
  - Test free model access
  - Verify fallback scenarios
  - Performance optimization

**Deliverables**:
- ✅ OpenCode Zen provider integration
- ✅ Free model access for Shark agents
- ✅ Robust fallback chains
- ✅ Usage monitoring

### Phase 5: Testing & Deployment (Week 7-8)
**Goal**: Comprehensive testing and production deployment

#### Week 7: Testing & Validation
- **Day 1-2**: Functional testing
  - Test all 9 agents with legacy configs
  - Test custom agent definitions
  - Test agent aliases and mappings
- **Day 3-4**: Integration testing
  - Test Shark CLI launch scenarios
  - Test Zen model access and fallbacks
  - Test fragment injection
- **Day 5**: Performance testing
  - Benchmark agent spawning times
  - Measure configuration loading performance
  - Test under load (concurrent agents)

#### Week 8: Deployment & Documentation
- **Day 1-2**: Production deployment
  - Create release package
  - Update installation scripts
  - Deploy to early adopters
- **Day 3-4**: Documentation
  - Update Shark CLI user guide
  - Create migration guide for existing users
  - Document Zen integration
- **Day 5**: Monitoring & support
  - Set up usage monitoring
  - Create support documentation
  - Prepare for issue resolution

**Deliverables**:
- ✅ Comprehensive test suite
- ✅ Production-ready release
- ✅ Complete documentation
- ✅ Monitoring system

## Technical Specifications

### Agent Schema Definition
```typescript
interface AgentDefinition {
  id: string;                    // Internal identifier
  display_name: string;          // User-facing name
  model: string;                 // Provider/model reference
  description: string;           // Role description
  prompt: string;                // System prompt
  mode?: 'subagent' | 'primary';
  maxTokens?: number;
  reasoningEffort?: 'low' | 'medium' | 'high';
  tools: Record<string, boolean>; // Tool permissions
  aliases?: string[];            // Alternative names
  fallback_models?: string[];    // Fallback model chain
}
```

### Configuration Migration
```javascript
// Legacy config (continues to work)
{
  "agents": {
    "sisyphus": { "model": "0-glm-coding/glm-5" }
  }
}

// New config (full customization)
{
  "agent_definitions": {
    "kraken-brain": {
      "id": "sisyphus",
      "display_name": "Kraken Brain",
      "model": "0-opencode-zen/glm-5",
      "aliases": ["sisyphus", "orchestrator"]
    }
  },
  "agent_aliases": {
    "shark-agent": "hephaestus"
  }
}
```

### Shark CLI Launch Flow
```
User: `shark "fix bug in main.py"`
  ↓
Mode auto-detection → "micro"
  ↓
Generate temp config with micro settings
  ↓
Set SHARK_MODE=micro, SHARK_PRIMARY_AGENT=shark-agent
  ↓
exec opencode "fix bug in main.py"
  ↓
OpenCode TUI loads with Shark enhancements
```

## Testing Strategy

### Unit Tests
- Agent resolution and configuration
- Tool execution with custom agents
- Hook injection and prompt modification
- Configuration migration utilities

### Integration Tests
- Full plugin lifecycle with legacy configs
- Shark CLI launch scenarios
- Zen provider integration
- Fallback chain execution

### Performance Tests
- Agent spawning times (target: < 500ms)
- Configuration loading (target: < 100ms)
- Concurrent agent execution
- Memory usage under load

### Compatibility Tests
- OpenCode versions 1.2.x, 1.3.x
- Operating systems: Linux, macOS, WSL
- Shell environments: bash, zsh

## Risk Management

### High Risks
1. **Breaking existing configurations**
   - *Mitigation*: Dual-configuration support, automatic migration
   - *Fallback*: Easy rollback to original plugin version

2. **Performance degradation**
   - *Mitigation*: Benchmark before/after each change
   - *Optimization*: Caching, lazy loading, connection pooling

3. **Zen API availability**
   - *Mitigation*: Robust fallback chains
   - *Monitoring*: Real-time provider health checks

### Medium Risks
1. **Complex configuration management**
   - *Mitigation*: Clear documentation, configuration templates
   - *Tooling*: Validation scripts, migration utilities

2. **User experience confusion**
   - *Mitigation*: Intuitive wizard, clear status messages
   - *Testing*: User testing with target audience

### Low Risks
1. **Minor compatibility issues**
   - *Mitigation*: Comprehensive test matrix
   - *Support*: Quick fix releases

## Success Metrics

### Technical Metrics
- **Backward Compatibility**: 100% of existing configs work
- **Performance**: < 10% degradation in any metric
- **Reliability**: 99.9% successful agent spawns
- **Availability**: Zen fallback works 100% of time

### User Experience Metrics
- **Adoption**: > 80% of Shark users adopt new CLI
- **Satisfaction**: > 4.5/5 user rating
- **Support tickets**: < 5% increase post-deployment

### Business Metrics
- **Cost reduction**: Free model usage > 30% of requests
- **Efficiency**: Task completion time unchanged or improved
- **Scalability**: Supports 10+ concurrent agents

## Communication Plan

### Internal Communication
- **Daily standups**: 15-minute sync for core team
- **Weekly demos**: Show progress to stakeholders
- **Issue tracking**: GitHub Issues with priority labels
- **Documentation**: Living architecture document

### External Communication
- **Early adopters**: Weekly update emails
- **User documentation**: Updated with each phase
- **Release notes**: Detailed changelogs
- **Support channels**: Dedicated Discord channel

## Resource Requirements

### Development Environment
- **Hardware**: 4+ core CPU, 16GB+ RAM, SSD
- **Software**: Node.js 18+, npm/bun, git
- **Testing**: Multiple OpenCode versions, various OSes

### Infrastructure
- **CI/CD**: GitHub Actions for testing
- **Package registry**: npm for plugin distribution
- **Documentation**: GitHub Pages or similar

### Access Requirements
- **OpenCode Zen API keys**: For testing free models
- **GLM/DeepSeek API keys**: For fallback testing
- **Local vLLM server**: For ultimate fallback testing

## Contingency Plans

### If Phase 1 Delays
- **Option A**: Extend timeline by 1 week
- **Option B**: Reduce scope (focus on core agent rename only)
- **Option C**: Parallelize Phase 2 & 3 with additional resources

### If Zen Integration Fails
- **Fallback**: Use direct providers only
- **Communication**: Transparent status to users
- **Timeline**: Continue with other phases, revisit Zen later

### If Performance Targets Not Met
- **Investigation**: Profiling to identify bottlenecks
- **Optimization**: Focused performance sprints
- **Acceptance**: Document trade-offs for user approval

## Post-Implementation Activities

### Month 1: Monitoring & Support
- Daily monitoring of error rates
- Weekly performance reviews
- User feedback collection

### Month 2: Optimization
- Address performance bottlenecks
- Refine configuration defaults
- Improve error messages

### Month 3: Enhancement Planning
- Gather feature requests
- Plan next version improvements
- Evaluate adoption metrics

## Conclusion

This implementation plan provides a structured, phased approach to rewriting opencode-ultra for customizable agent names and integrating it with Shark Frankenstein CLI. Each phase includes specific deliverables, testing requirements, and risk mitigation strategies.

The success of this project will enable Shark users to work with their preferred agent naming conventions while gaining access to OpenCode Zen free models through a seamless, wizard-driven launch experience.

---

*This plan is designed for execution by a build team with clear milestones, deliverables, and success criteria. Each task is specific and actionable.*