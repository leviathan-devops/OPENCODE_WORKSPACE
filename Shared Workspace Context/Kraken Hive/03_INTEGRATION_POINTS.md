# Kraken Hive Integration - Integration Points

## Hive Architecture Overview

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

## Kraken Ultra Component Mapping

### 1. Anti-hallucination Validators → Hive Judge

**Kraken Component**: `mechanical-validator.ts`, `evidence-checker.ts`, `patterns.ts`, `validator-hook.ts`

**Hive Integration Point**: **Judge system** - enhances evaluation capabilities

**Implementation Strategy**:
- Extend Hive Judge with mechanical validation capabilities
- Add theatrical code pattern detection to Judge criteria
- Integrate evidence checking into Judge's evaluation pipeline
- Use validator hooks to intercept agent outputs before acceptance

**Code Mapping**:
```python
# Python port structure
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

### 2. Surgical Debug Protocol → Hive Reflexion Loop

**Kraken Component**: `debug-agents.ts`, `injector.ts`, `stagnation-detector.ts`, `ultra-connector.ts`

**Hive Integration Point**: **Reflexion Loop** - enhances failure recovery

**Implementation Strategy**:
- Map surgical debug injection to Hive's REPLAN/ESCALATE paths
- Integrate stagnation detection with Hive's retry mechanisms
- Create debug agent factory for Hive sub-agents
- Connect ultra-connector to Hive's event system

**Code Mapping**:
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

### 3. Nemotron Event Service → Hive Event Bus

**Kraken Component**: `nemotron-service/` (7 files: compression.ts, message-classifier.ts, etc.)

**Hive Integration Point**: **Event Bus** - enhances message routing and token optimization

**Implementation Strategy**:
- Wrap Hive Event Bus with Nemotron message classification
- Add token counting and size-based routing (2k/4k/6k/8k)
- Implement compression for large messages
- Add metrics collection for token usage

**Code Mapping**:
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

### 4. Fragment Injection System → Hive Node Configuration

**Kraken Component**: `.shark/fragments/` (shark-agent.md, kraken-brain.md, architect.md, code-review.md)

**Hive Integration Point**: **Node Configuration** - enhances agent initialization

**Implementation Strategy**:
- Convert markdown fragments to Hive agent configuration
- Create fragment loader for Hive node initialization
- Map fragment types to Hive agent roles (Worker, Judge, Queen)
- Integrate with Hive's system prompt injection

**Code Mapping**:
```python
class FragmentInjector:
    def __init__(self, fragments_dir):
        self.fragments_dir = fragments_dir
        self.fragment_cache = {}
    
    def load_fragment(self, fragment_type, agent_role):
        # Load and parse fragment markdown
        fragment_path = os.path.join(self.fragments_dir, f"{fragment_type}.md")
        with open(fragment_path, 'r') as f:
            content = f.read()
        
        # Parse fragment into structured instructions
        instructions = self.parse_fragment(content, agent_role)
        return instructions
    
    def inject_into_node(self, node, fragment_type):
        # Get fragment based on node type
        if isinstance(node, QueenBeeNode):
            fragment = self.load_fragment(fragment_type, 'queen')
        elif isinstance(node, JudgeNode):
            fragment = self.load_fragment(fragment_type, 'judge')
        elif isinstance(node, WorkerNode):
            fragment = self.load_fragment(fragment_type, 'worker')
        
        # Inject into node configuration
        node.system_prompt = self.merge_prompts(node.system_prompt, fragment)
        return node
```

### 5. Stagnation Detection → Hive Monitoring System

**Kraken Component**: Distributed across tool stagnation and agent stagnation detectors

**Hive Integration Point**: **Monitoring System** - enhances health checking

**Implementation Strategy**:
- Unify Kraken stagnation detectors into Hive monitoring
- Connect to Hive's 2-minute Judge timer
- Integrate with Event Bus for escalation tickets
- Add metrics for agent health and performance

### 6. DualBrain Coordinator → Hive Queen Bee

**Kraken Component**: Conceptual orchestrator (needs implementation)

**Hive Integration Point**: **Queen Bee** - enhances orchestration capabilities

**Implementation Strategy**:
- Extend Queen Bee with DualBrain coordination logic
- Add agent routing based on capability and load
- Implement fallback and failover mechanisms
- Integrate with Collaborator AI for visualization

## Integration Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         KRAKEN HIVE INTEGRATION                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                          HIVE FRAMEWORK                           │   │
│  │  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐   │   │
│  │  │  QUEEN   │◄──►│  WORKER  │◄──►│  JUDGE   │◄──►│  EVENT   │   │   │
│  │  │   BEE    │    │   BEES   │    │          │    │   BUS    │   │   │
│  │  └────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘   │   │
│  │       │               │               │               │          │   │
│  └───────┼───────────────┼───────────────┼───────────────┼──────────┘   │
│          │               │               │               │              │
│  ┌───────▼──────┐ ┌─────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐      │
│  │ DualBrain    │ │ Fragment    │ │Anti-hallu-  │ │ Nemotron    │      │
│  │ Coordinator  │ │ Injection   │ │ cination    │ │ Enhanced    │      │
│  │ (Extension)  │ │ (Config)    │ │ Validators  │ │ Event Bus   │      │
│  └──────────────┘ └─────────────┘ └─────────────┘ └─────────────┘      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      COLLABORATOR AI OBSERVABILITY                       │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                 │
│  │   Terminal  │    │ Context     │    │ Infinite    │                 │
│  │    Tiles    │    │   Files     │    │  Canvas     │                 │
│  │ (per agent) │    │ (note/code) │    │ (graph vis) │                 │
│  └─────────────┘    └─────────────┘    └─────────────┘                 │
└─────────────────────────────────────────────────────────────────────────┘
```

## Detailed Integration Specifications

### Hive Judge Extension Points

**File Location**: `hive/judge/extensions.py`

**Extension Methods**:
1. `pre_evaluate_hook(output, context)` - Run before evaluation
2. `post_evaluate_hook(result, output, context)` - Run after evaluation
3. `escalation_decision_hook(state, metrics)` - Custom escalation logic
4. `validation_criteria_hook()` - Add custom validation criteria

**Kraken Integration**:
```python
from hive.judge import JudgeExtension
from kraken.validators import MechanicalValidator, EvidenceChecker

class KrakenJudgeExtension(JudgeExtension):
    def __init__(self):
        self.validator = MechanicalValidator()
        self.evidence_checker = EvidenceChecker()
    
    def pre_evaluate_hook(self, output, context):
        # Run anti-hallucination checks
        validation = self.validator.validate(output)
        if not validation.passed:
            return {"reject": True, "reason": "Failed mechanical validation"}
        
        evidence = self.evidence_checker.check(output, context)
        if not evidence.sufficient:
            return {"reject": True, "reason": "Insufficient evidence"}
        
        return {"reject": False}
```

### Hive Event Bus Extension Points

**File Location**: `hive/events/extensions.py`

**Extension Methods**:
1. `pre_publish_hook(event_type, data, metadata)` - Modify before publishing
2. `post_publish_hook(event_type, data, metadata)` - After publishing
3. `message_classification_hook(data)` - Custom classification
4. `routing_hook(event_type, classification)` - Custom routing

**Kraken Integration**:
```python
from hive.events import EventBusExtension
from kraken.nemotron import MessageClassifier, TokenOptimizer

class NemotronEventBusExtension(EventBusExtension):
    def __init__(self):
        self.classifier = MessageClassifier()
        self.optimizer = TokenOptimizer()
    
    def pre_publish_hook(self, event_type, data, metadata):
        # Classify and optimize
        classification = self.classifier.classify(data)
        optimized_data = self.optimizer.optimize(data, classification)
        
        return {
            "data": optimized_data,
            "metadata": {
                **metadata,
                "classification": classification,
                "original_size": len(str(data)),
                "optimized_size": len(str(optimized_data))
            }
        }
```

### Hive Node Configuration Extension Points

**File Location**: `hive/nodes/extensions.py`

**Extension Methods**:
1. `node_initialization_hook(node_config)` - Modify node config at init
2. `system_prompt_injection_hook(base_prompt, node_type)` - Inject fragments
3. `tool_registration_hook(node_tools, node_type)` - Custom tool setup
4. `capability_assessment_hook(node_capabilities)` - Enhance capabilities

**Kraken Integration**:
```python
from hive.nodes import NodeExtension
from kraken.fragments import FragmentLoader

class FragmentInjectionExtension(NodeExtension):
    def __init__(self, fragment_dir):
        self.fragment_loader = FragmentLoader(fragment_dir)
    
    def system_prompt_injection_hook(self, base_prompt, node_type):
        # Load appropriate fragment
        fragment = self.fragment_loader.load_for_node_type(node_type)
        
        # Merge with base prompt
        merged = f"""{base_prompt}

        ## Kraken Ultra Enhancements
        {fragment}
        """
        
        return merged
```

## Migration Sequence

### Phase 1: Foundation Integration
1. **Hive Judge + Anti-hallucination** (highest value, reduces errors)
2. **Hive Event Bus + Nemotron** (improves communication efficiency)
3. **Basic fragment injection** (improves agent quality)

### Phase 2: Advanced Integration
1. **Hive Reflexion + Surgical Debug** (improves failure recovery)
2. **Complete fragment system** (all agent types)
3. **Stagnation detection** (improves monitoring)

### Phase 3: UI Integration
1. **Collaborator AI + Hive events** (real-time observability)
2. **Terminal tile integration** (interactive debugging)
3. **Canvas visualization** (system understanding)

## Testing Integration Points

### Unit Test Locations
- `tests/integration/test_judge_anti_hallucination.py`
- `tests/integration/test_event_bus_nemotron.py`
- `tests/integration/test_reflexion_surgical_debug.py`
- `tests/integration/test_node_fragment_injection.py`

### Integration Test Scenarios
1. **Scenario A**: Agent produces theatrical code → Judge rejects with anti-hallucination
2. **Scenario B**: Agent stuck in loop → Surgical debug injects → Reflexion replans
3. **Scenario C**: Large message published → Nemotron classifies as 8k → Compression applied
4. **Scenario D**: Node initialized → Fragment injected → System prompt enhanced

## Configuration Requirements

### Hive Configuration Additions
```yaml
# hive-config.yaml
extensions:
  judge:
    - kraken.judge.KrakenJudgeExtension
  events:
    - kraken.events.NemotronEventBusExtension
  nodes:
    - kraken.nodes.FragmentInjectionExtension

kraken:
  fragments_dir: /path/to/fragments
  validation:
    mechanical: true
    evidence: true
    theatrical: true
  nemotron:
    enable_classification: true
    token_limits:
      '2k': 2048
      '4k': 4096
      '6k': 6144
      '8k': 8192
```

## Performance Considerations

### Expected Overhead
- **Anti-hallucination validation**: 100-500ms per agent output
- **Nemotron classification**: 50-100ms per message
- **Fragment injection**: < 50ms per node initialization
- **Surgical debug**: 1-5s when triggered (rare)

### Optimization Strategies
- **Caching**: Cache validation results for similar outputs
- **Batching**: Batch small events for Nemotron processing
- **Lazy loading**: Load fragments on demand, not at startup
- **Async processing**: Run validations in background when possible

---
**Integration Plan Version**: 1.0  
**Last Updated**: March 30, 2026  
**Next Steps**: Begin with Phase 1 integration points in 04_NEXT_STEPS.md