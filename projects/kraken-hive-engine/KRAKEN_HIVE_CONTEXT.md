# Kraken Hive Integration - Complete Context Library

## Mission Statement
**Integrate Kraken Ultra components into Hive framework as the engine OS.** Hive becomes the UI/host platform, Kraken becomes the intelligent orchestration engine. Launch Hive in a fresh terminal with Kraken Ultra fully integrated.

## Project Overview

### Core Architecture Shift
- **FROM**: OpenCode + Shark Frankenstein CLI (TypeScript) + Kraken Ultra plugins
- **TO**: Hive Framework (Python) + Kraken Ultra Engine + Collaborator AI UI

### Success Criteria
- [ ] Hive installed and running with basic agent workflows
- [ ] Kraken Ultra anti-hallucination validators integrated into Hive Judge
- [ ] Kraken Ultra surgical debug protocol integrated into Hive reflexion loop
- [ ] Nemotron event service integrated into Hive Event Bus with token classification
- [ ] Collaborator AI providing real-time observability of Hive agents
- [ ] Single command launch: `kraken-hive start` launches Hive with Kraken Ultra
- [ ] GLM Engineer workspace fully configured for development

## Current Build Status (March 30, 2026)

### ✅ COMPLETED:
1. **Hive Framework**: Cloned to `/home/leviathan/OPENCODE_WORKSPACE/projects/hive/`
2. **GLM Workspace**: Created at `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-hive-engine/`
3. **Anti-hallucination Port**: 4 components ported (639 lines total)
4. **Build Infrastructure**: `pyproject.toml` and `Makefile` created
5. **Dependencies**: pydantic, websockets, aiohttp, click installed

### ❌ INCOMPLETE:
1. **Hive Installation**: Quickstart interrupted at LLM provider selection
2. **Test Files**: No tests for ported validators
3. **CLI Launcher**: No `kraken-hive` command
4. **Hive Integration**: No actual integration with Hive framework
5. **Remaining Components**: Surgical debug, Nemotron, fragments not ported

## Kraken Ultra Component Inventory

### 1. Anti-hallucination Validators (✅ PORTED)
**Source**: `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-brain/Kraken Ultra/src/anti-hallucination/`

**Components**:
- `mechanical-validator.ts` → `mechanical_validator.py` (186 lines)
- `evidence-checker.ts` → `evidence_checker.py` (142 lines)
- `patterns.ts` → `patterns.py` (124 lines)
- `validator-hook.ts` → `validator_hook.py` (148 lines)

**Purpose**: Detect theatrical code, ensure evidence-based claims, validate mechanical correctness

**Hive Integration Point**: **Judge system** - enhances evaluation capabilities

### 2. Surgical Debug Protocol (❌ TODO)
**Source**: `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-brain/Kraken Ultra/src/surgical-debug/`

**Components**:
- `debug-agents.ts` - Specialized debug agents for different failure types
- `injector.ts` - Inject debug agents into failing workflows
- `stagnation-detector.ts` - Detect when agents are stuck in loops
- `ultra-connector.ts` - Connect to Kraken Ultra for advanced debugging

**Purpose**: Targeted debugging, agent injection, stagnation detection

**Hive Integration Point**: **Reflexion Loop** - enhances failure recovery (ACCEPT/RETRY/REPLAN/ESCALATE)

### 3. Nemotron Event Service (❌ TODO)
**Source**: `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein/src/nemotron-service/`

**Components**:
- `compression.ts` - Message compression for large payloads
- `message-classifier.ts` - Token classification (2k/4k/6k/8k)
- `token-metrics.ts` - Token usage tracking and optimization

**Purpose**: Event-driven communication, token optimization, message routing

**Hive Integration Point**: **Event Bus** - enhances message routing and token optimization

### 4. Fragment Injection System (❌ TODO)
**Source**: `/home/leviathan/OPENCODE_WORKSPACE/.shark/fragments/`

**Files**:
- `shark-agent.md` - Shark agent instructions
- `kraken-brain.md` - Kraken brain architecture
- `architect.md` - Architect agent instructions
- `code-review.md` - Code review guidelines

**Purpose**: Agent-specific instructions, context injection, behavior modification

**Hive Integration Point**: **Node Configuration** - enhances agent initialization

## Hive Architecture Reference

### Core Hive Components (from documentation)
1. **Queen Bee** - Orchestration layer, subscribes to events, oversight capabilities
2. **Worker Bees** - Execution graph with event loop nodes
3. **Judge** - Isolated evaluation system (2-minute timer, reads logs, emits escalation tickets)
4. **Event Bus** - Pub/sub system for cross-component communication
5. **Sub-Agent Framework** - Parallel delegation system
6. **Shared Memory** - Key-value store for node communication
7. **Reflexion Loop** - Feedback → reflection → correction pattern (ACCEPT/RETRY/REPLAN/ESCALATE)

### Hive Data Flow Patterns
- External triggers → Event Loop Node → Worker Bees
- Worker Bees ↔ Shared Memory (read/write)
- Judge reads Worker logs, publishes escalation tickets to Event Bus
- Queen Bee subscribes to Event Bus for oversight
- Sub-agents run in parallel with read-only memory snapshots

## Detailed Integration Specifications

### 1. Anti-hallucination → Hive Judge Integration

**Implementation Strategy**:
```python
class KrakenEnhancedJudge(Judge):
    def __init__(self):
        self.mechanical_validator = MechanicalValidator()
        self.evidence_checker = EvidenceChecker()
        self.pattern_detector = PatternDetector()
    
    def evaluate_agent_output(self, agent_output, context):
        # Step 1: Mechanical validation
        mechanical_result = self.mechanical_validator.validate(agent_output)
        if not mechanical_result.passed:
            return EvaluationResult(reject=True, reason="Mechanical validation failed")
        
        # Step 2: Evidence checking
        evidence_result = self.evidence_checker.check(agent_output, context)
        if not evidence_result.sufficient:
            return EvaluationResult(reject=True, reason="Insufficient evidence")
        
        # Step 3: Pattern detection
        patterns = self.pattern_detector.detect_theatrical(agent_output)
        if patterns:
            return EvaluationResult(reject=True, reason=f"Theatrical patterns: {patterns}")
        
        # Pass to base Judge evaluation
        return super().evaluate_agent_output(agent_output, context)
```

**Files to Create**:
- `src/kraken/integration/judge_extension.py`
- `examples/judge_integration_demo.py`

### 2. Surgical Debug → Hive Reflexion Integration

**Implementation Strategy**:
```python
class SurgicalDebugReflexion(ReflexionLoop):
    def __init__(self):
        self.debug_injector = DebugInjector()
        self.stagnation_detector = StagnationDetector()
        self.debug_agent_factory = DebugAgentFactory()
    
    def handle_failure(self, agent_id, error, context, attempt_count):
        # Check for stagnation
        stagnation_state = self.stagnation_detector.check(agent_id)
        if stagnation_state == 'escalation':
            # Inject surgical debug agent
            debug_agent = self.debug_agent_factory.create_specialized(error)
            debug_result = debug_agent.diagnose(context)
            
            if debug_result.success:
                return ReflexionDecision.REPLAN, debug_result.suggested_fix
            else:
                return ReflexionDecision.ESCALATE, "Surgical debug failed"
        
        # Default Hive reflexion logic
        return super().handle_failure(agent_id, error, context, attempt_count)
```

**Files to Create**:
- `src/kraken/debug/debug_agents.py` (port from debug-agents.ts)
- `src/kraken/debug/injector.py` (port from injector.ts)
- `src/kraken/debug/stagnation_detector.py` (port from stagnation-detector.ts)
- `src/kraken/debug/ultra_connector.py` (port from ultra-connector.ts)
- `src/kraken/integration/reflexion_extension.py`

### 3. Nemotron → Hive Event Bus Integration

**Implementation Strategy**:
```python
class NemotronEnhancedEventBus(EventBus):
    def __init__(self):
        super().__init__()
        self.message_classifier = MessageClassifier()
        self.compressor = MessageCompressor()
        self.token_metrics = TokenMetricsCollector()
    
    def publish(self, event_type, data, metadata=None):
        # Classify message by token size
        classification = self.message_classifier.classify(data)
        
        # Compress if needed (for 6k/8k messages)
        if classification in ['6k', '8k']:
            data = self.compressor.compress(data)
        
        # Update token metrics
        self.token_metrics.record(classification, len(data))
        
        # Route based on classification
        if classification == '2k':
            # Direct to Queen Bee for quick updates
            super().publish(f"queen/{event_type}", data, metadata)
        elif classification == '4k':
            # Worker Bees for detailed updates
            super().publish(f"worker/{event_type}", data, metadata)
        elif classification in ['6k', '8k']:
            # Judge for complex analysis
            super().publish(f"judge/{event_type}", data, metadata)
```

**Files to Create**:
- `src/kraken/nemotron/message_classifier.py` (port from message-classifier.ts)
- `src/kraken/nemotron/compression.py` (port from compression.ts)
- `src/kraken/nemotron/token_metrics.py` (port from token-metrics.ts)
- `src/kraken/integration/event_bus_extension.py`

### 4. Fragment System → Hive Node Configuration

**Implementation Strategy**:
```python
class FragmentNodeConfig(NodeConfig):
    def __init__(self):
        self.fragment_loader = FragmentLoader()
        self.fragment_injector = FragmentInjector()
    
    def configure_agent(self, agent_type, base_config):
        # Load appropriate fragments
        fragments = self.fragment_loader.load_for_agent(agent_type)
        
        # Inject fragments into config
        enhanced_config = self.fragment_injector.inject(base_config, fragments)
        
        return enhanced_config
```

**Files to Create**:
- `src/kraken/fragments/loader.py`
- `src/kraken/fragments/injector.py`
- `src/kraken/fragments/manager.py`
- `src/kraken/integration/node_config_extension.py`

## Build Instructions

### Step 1: Complete Hive Installation
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/hive
echo "15" | ./quickstart.sh  # Select "Local (Ollama)" option
source .venv/bin/activate
./hive list  # Verify installation
```

### Step 2: Set Up Development Environment
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-hive-engine
source .venv/bin/activate
make install
```

### Step 3: Create Test Files
```bash
mkdir -p tests/validators
# Convert TypeScript tests to Python:
# Source: /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-brain/Kraken Ultra/tests/anti-hallucination.test.ts
```

### Step 4: Build CLI Launcher
Create `src/kraken/cli/main.py`:
```python
import click

@click.group()
def cli():
    """Kraken Hive - Integrated AI Agent Platform"""
    pass

@cli.command()
def start():
    """Launch Hive with Kraken Ultra integration"""
    click.echo("🚀 Starting Kraken Hive...")
    # Implementation

@cli.command()
def test():
    """Run integration tests"""
    import subprocess
    subprocess.run(["pytest", "tests/", "-v"])

def main():
    cli()

if __name__ == "__main__":
    main()
```

Update `pyproject.toml`:
```toml
[project.scripts]
kraken-hive = "kraken.cli.main:main"
```

### Step 5: Run Tests
```bash
make test
```

## Testing Strategy

### Unit Tests
- Test each validator independently
- Test integration points with Hive
- Test edge cases and error conditions

### Integration Tests
- Test Hive Judge with Kraken validators
- Test Event Bus with Nemotron classification
- Test Reflexion with surgical debug

### End-to-End Tests
- Full agent workflow with Kraken enhancements
- Performance benchmarks
- Memory and resource usage

## Source Code References

### Kraken Ultra TypeScript Source:
- Anti-hallucination: `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-brain/Kraken Ultra/src/anti-hallucination/`
- Surgical debug: `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-brain/Kraken Ultra/src/surgical-debug/`
- Tests: `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-brain/Kraken Ultra/tests/`

### Nemotron Service:
- `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein/src/nemotron-service/`

### Fragment System:
- `/home/leviathan/OPENCODE_WORKSPACE/.shark/fragments/`

### Hive Framework:
- `/home/leviathan/OPENCODE_WORKSPACE/projects/hive/`
- Examples: `/home/leviathan/OPENCODE_WORKSPACE/projects/hive/examples/templates/`

## Error Handling

### Common Issues:
1. **Hive quickstart fails**: Use manual uv setup fallback
2. **TypeScript→Python porting errors**: Compare line-by-line with original
3. **Hive integration unclear**: Examine Hive example templates
4. **Dependency conflicts**: Use isolated virtual environments

### Fallback Strategies:
```bash
# If quickstart fails:
cd /home/leviathan/OPENCODE_WORKSPACE/projects/hive
rm -rf .venv
uv venv
source .venv/bin/activate
uv pip install -e .

# If tests fail:
# 1. Compare with original TypeScript tests
# 2. Create minimal failing test case
# 3. Fix implementation, not tests
```

## Success Verification

### Phase 1 Completion Criteria:
- [ ] Hive quickstart completed
- [ ] Test suite for anti-hallucination validators (80%+ coverage)
- [ ] `kraken-hive` CLI command working with `--help`
- [ ] Basic Hive integration example running
- [ ] All 4 anti-hallucination validators passing tests

### Verification Commands:
```bash
# 1. CLI works
kraken-hive --help

# 2. Tests pass
make test

# 3. Hive integration demo works
python examples/anti_hallucination_demo.py

# 4. Imports work
python -c "from kraken.validators import MechanicalValidator; from kraken.integration import JudgeExtension; print('Imports OK')"
```

## Project Timeline

### Phase 1: Foundation (March 30)
- Complete Hive installation
- Create test suite
- Build CLI launcher
- Basic Hive integration

### Phase 2: Component Porting (March 31 - April 1)
- Port surgical debug protocol
- Port Nemotron event service
- Port fragment system
- Create integration modules

### Phase 3: Integration Testing (April 2)
- Test Hive Judge integration
- Test Event Bus integration
- Test Reflexion integration
- Performance benchmarks

### Phase 4: Production Polish (April 3)
- Documentation
- Examples
- Deployment scripts
- Final testing

## Deliverable

When complete, the system should:
1. Launch with `kraken-hive start`
2. Integrate all Kraken components into Hive
3. Provide enhanced agent capabilities
4. Include comprehensive documentation
5. Have full test coverage

---
**Context Version**: 1.0  
**Last Updated**: March 30, 2026  
**Status**: Ready for Hive Agent Execution