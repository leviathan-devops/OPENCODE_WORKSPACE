# 🦈 SHARK DUAL-BRAIN ROUTING LOGIC

## Overview
Intelligent task routing system that automatically selects between Micro Engineer (precision coding) and Macro Engineer (systems engineering) modes based on task analysis.

## Routing Decision Matrix

### MICRO ENGINEER MODE (Precision Coding)
**Agent**: hephaestus (GLM-4.7)  
**Use When**:
- Task contains: "fix", "debug", "syntax", "error", "bug"
- Single file operations
- Line-level changes
- Test writing/review
- Code review requests
- Word count < 15
- Contains: "test", "unit", "review", "lint", "format"

**Example Tasks**:
- "Fix the syntax error in line 42 of main.py"
- "Write unit tests for the calculateTotal function"
- "Review this pull request for code quality issues"
- "Debug the null pointer exception in UserService.java"

### MACRO ENGINEER MODE (Systems Engineering)  
**Agent**: sisyphus (GLM-5 Turbo) → Orchestrates specialist agents
**Use When**:
- Task contains: "architecture", "system", "refactor", "migrate", "design"
- Multi-file operations
- Database schema changes
- API design
- DevOps/CI/CD pipelines
- Word count ≥ 15
- Contains: "pipeline", "deploy", "infrastructure", "microservice", "monolith"

**Example Tasks**:
- "Refactor the authentication system to use JWT tokens"
- "Design a microservices architecture for the e-commerce platform"
- "Create CI/CD pipeline with GitHub Actions for automatic deployment"
- "Migrate the database from MySQL to PostgreSQL"

## Routing Algorithm

```python
def route_task(task_text):
    # Complexity analysis
    word_count = len(task_text.split())
    
    # Keyword analysis
    micro_keywords = ["fix", "debug", "syntax", "error", "bug", "test", 
                     "unit", "review", "single", "file", "line"]
    macro_keywords = ["architecture", "system", "refactor", "migrate",
                     "design", "pipeline", "deploy", "infrastructure",
                     "microservice", "database", "api", "devops"]
    
    micro_score = sum(1 for kw in micro_keywords if kw in task_text.lower())
    macro_score = sum(1 for kw in macro_keywords if kw in task_text.lower())
    
    # Decision logic
    if macro_score > 0 and word_count >= 10:
        return "macro"
    elif micro_score > 0 and word_count < 20:
        return "micro"
    elif word_count < 15:
        return "micro"
    else:
        return "macro"  # Default to macro for complex tasks
```

## Agent Orchestration Flow

### Macro Mode Orchestration:
```
User Task → Kraken Brain (sisyphus) → Task Decomposition → Specialist Agents
                                                         ├─ Architect (oracle) for design
                                                         ├─ Shark Agent (hephaestus) for coding
                                                         ├─ Code Review (momus) for QA
                                                         ├─ Planning Brain (metis) for strategy
                                                         └─ Middle Manager (atlas) for coordination
```

### Micro Mode Direct Routing:
```
User Task → Shark Agent (hephaestus) → Execute → Code Review (momus) if needed
```

## Context Management

### ThreadWeaver Integration (Nemotron Bridge)
- **Purpose**: Context filtering to prevent pollution
- **Implementation**: Uses `atlas` agent (Nemotron 3 Super) for context management
- **Function**: Filters irrelevant context between iterations
- **Benefit**: Maintains clean context window for GLM models

### Workflow State Preservation
- Tracks current workflow step (PLAN → BUILD → TEST → VERIFY → SHIP)
- Maintains context across agent handoffs
- Ensures workflow continuity in macro mode

## Performance Optimization

### Model Selection Strategy
1. **GLM-5 Turbo** (sisyphus): Complex orchestration, strategic planning
2. **GLM-4.7** (hephaestus): Core coding tasks, implementation
3. **GLM-4.5-flash** (explore): Fast exploration, research
4. **DeepSeek Reasoner** (oracle/metis): Architectural thinking
5. **DeepSeek Chat** (momus/librarian): Review & documentation
6. **MiMo V2 Omni** (multimodal-looker): Visual analysis
7. **Nemotron 3 Super** (atlas): Context management

### Cost Optimization
- Micro mode uses GLM-4.7 (efficient for coding)
- Macro mode uses GLM-5 only for orchestration, delegates to appropriate models
- Exploration uses GLM-4.5-flash (cheaper, faster)
- DeepSeek for reasoning tasks (cost-effective reasoning)

## Error Handling & Recovery

### Stagnation Detection
- Monitors tool failure patterns
- Detects when agents are stuck in loops
- Triggers agent rotation or mode switch

### Auto-Debug Integration
- 60% known error patterns auto-fixed
- Prevention tips before execution
- Mechanical fixes for common issues

## Configuration

### Environment Variables
```bash
# Mode forcing (optional)
export SHARK_DEFAULT_MODE="macro"  # or "micro"

# Agent preferences
export SHARK_PREFERRED_AGENT="shark"  # Default agent

# Routing sensitivity
export SHARK_ROUTING_SENSITIVITY="high"  # Aggressive macro routing
```

### Configuration File
```json
{
  "routing": {
    "defaultMode": "auto",
    "microThreshold": 15,
    "macroKeywords": ["architecture", "system", "refactor"],
    "microKeywords": ["fix", "debug", "test"],
    "forceMacroForFiles": 3  # Force macro if >3 files mentioned
  }
}
```

## Testing & Validation

### Test Cases
1. **Simple Fix**: "Fix typo in README.md" → Micro mode
2. **Complex Refactor**: "Refactor auth system to use OAuth2" → Macro mode
3. **Boundary Case**: "Debug performance issue in database queries" → Micro mode
4. **Multi-file**: "Update API endpoints across 5 files" → Macro mode

### Success Metrics
- Correct mode selection: >90% accuracy
- Task completion rate: >85%
- User satisfaction: Minimal mode switching requests
- Cost efficiency: Appropriate model usage

## Integration Points

### With Shark Safety Stack
1. **Guardian**: File protection applies to all agents
2. **Workflow**: 5-step enforcement maintained across agents
3. **AutoDebug**: Error recovery integrated into routing
4. **FirewallMesh**: Tool call monitoring and blocking

### With OpenCode-Ultra
1. **Agent Mapping**: Shark agents → opencode-ultra built-in agents
2. **Model Configuration**: Uses configured model providers
3. **Tool Access**: All opencode tools available to routed agents
4. **Session Management**: Clean context handoff between agents

## Future Enhancements

### Learning System
- Track routing decisions and outcomes
- Learn from user corrections
- Adaptive routing based on project type

### Multi-Agent Collaboration
- Simultaneous agent execution for parallel tasks
- Conflict resolution between agents
- Consolidated output formatting

### Performance Analytics
- Model usage tracking
- Cost per task analysis
- Success rate by agent/mode combination