# V4 Agent Factory Edition

**Meta-configurable agent architecture system** that enables fully configurable agent architectures (not just configurable agents).

## Overview

V4 Agent Factory Edition evolves beyond the current Spider Agent architecture to create a **meta-architecture system** where users can define custom architectures (Shark, Hydra, Dragon, Kraken, etc.) through configuration files, not code.

### Key Features

- **100% Configurable Architectures**: Define brains, clusters, agents, and workflows in JSON configuration
- **Factory Pattern**: Runtime architecture creation from configuration
- **Keyword Customizable**: Default keyword is `plugin` with migration script to rename to any custom keyword (e.g., `shark`, `kraken`)
- **Example Architectures**: Includes Spider, Hermes, and Shark architectures out of the box
- **Self-Contained**: Factory + templates + examples + migration system
- **V3 Compatible**: Built on cleaned V3 coordination layer (0 swarm references)

## Quick Start

```typescript
import { createArchitecture } from './src';

// Create Spider architecture from config file
const spider = await createArchitecture({
  config: './ARCHITECTURES/spider.json',
  context: { workspace: '/path/to/workspace' }
});

// Or use quick start functions
import { createSpiderArchitecture } from './src';
const spider = await createSpiderArchitecture();

// Access architecture components
console.log(spider.brains);     // Array of brain instances
console.log(spider.clusters);   // Array of cluster instances  
console.log(spider.agents);     // Array of agent instances
console.log(spider.workflows);  // Array of workflow instances
console.log(spider.coordination); // Coordination layer instance
```

## Architecture Components

### 1. Brains (Orchestrators)
- **Types**: `orchestrator`, `supervisor`, `monitor`, `coordinator`, custom
- **Role**: Decision-making, coordination, oversight
- **Example**: Spider has 1 orchestrator brain, Shark has 3 brains (hunter, tactician, sentinel)

### 2. Clusters (Agent Groups)
- **Types**: `execution`, `qa`, `research`, `planning`, `review`, custom
- **Role**: Group agents by function, manage communication
- **Example**: Spider has 3 clusters (execution, qa, research)

### 3. Agents (Workers)
- **Types**: `architect`, `coder`, `reviewer`, `test-engineer`, `sme`, `explorer`, `critic`, custom
- **Role**: Execute specific tasks with defined capabilities
- **Example**: Spider has 7 agents, Hermes has 7 specialized agents

### 4. Workflows (Processes)
- **Phases**: Sequential steps in the workflow
- **Gates**: Decision points between phases
- **Example**: Hermes has 6-phase workflow with strict gates

### 5. Coordination Layer
- **Styles**: `hub-spoke`, `mesh`, `hierarchical`, `federated`
- **Role**: Manage communication and state between components
- **Example**: Spider uses hub-spoke, Shark uses federated

## Example Architectures

### 1. Spider Architecture
- **Pattern**: Simple hub-spoke
- **Brains**: 1 orchestrator
- **Clusters**: 3 (execution, qa, research)
- **Agents**: 7 standard agents
- **Workflow**: 4-phase development
- **Coordination**: Hub-spoke

### 2. Hermes Architecture
- **Pattern**: 6-phase pipeline
- **Brains**: 2 (orchestrator, supervisor)
- **Clusters**: 6 specialized clusters
- **Agents**: 7 specialized agents (analyst, planner, TDD specialist, etc.)
- **Workflow**: Strict 6-phase with quality gates
- **Coordination**: Hierarchical

### 3. Shark Architecture (Two Variants)

**Shark V4 (shark-v4.json) — Triple-Brain Parallel Peer:**
- **Pattern**: Three peer brains racing concurrently
- **Brains**: 3 (Execution, Reasoning, System)
- **Clusters**: 3 (execution, reasoning, enforcement)
- **Agents**: 5 (executor, synthesizer, auto-debugger, gate-keeper, guardian-enforcer)
- **Workflow**: 6-phase with mechanical gate enforcement
- **Coordination**: Federated
- **Ground truth**: `/home/leviathan/OPENCODE_WORKSPACE/shark-agent-rebirth/shark-context/`

**Shark Hunter (shark-hunter.json) — Alternative aggressive hunting variant:**
- **Pattern**: Aggressive target acquisition
- **Brains**: 3 (hunter, tactician, sentinel)
- **Clusters**: 6 (hunting, tracking, strategy, planning, monitoring, defense)
- **Agents**: 9 (hunter, tracker, striker, strategist, planner, analyst, sentinel, defender, auditor)
- **Workflow**: Hunt workflow with target/strategy/execution/defense/monitoring phases
- **Coordination**: Federated

## Creating Custom Architectures

### 1. Define Configuration
Create a JSON file in `ARCHITECTURES/`:

```json
{
  "id": "my-architecture",
  "name": "My Custom Architecture",
  "description": "Custom architecture description",
  "version": "v4",
  "brains": [...],
  "clusters": [...],
  "agents": [...],
  "workflows": [...],
  "coordination": {...}
}
```

### 2. Use the Factory
```typescript
import { createArchitecture } from './src';

const myArch = await createArchitecture({
  config: './ARCHITECTURES/my-architecture.json'
});
```

### 3. Extend Factories (Optional)
```typescript
import { AgentFactory } from './src/factory/AgentFactory';

const agentFactory = new AgentFactory();
agentFactory.registerAgent('my-agent-type', (config, context) => {
  // Custom agent implementation
  return {
    type: 'my-agent-type',
    // ... agent methods
  };
});
```

## Migration (Keyword Customization)

The default keyword is `plugin`. To rename to a custom keyword (e.g., `shark`, `kraken`):

```bash
# Make migration script executable
chmod +x MIGRATION/migrate.sh

# Dry run first (shows what would change)
./MIGRATION/migrate.sh shark -d

# Apply migration
./MIGRATION/migrate.sh shark

# Options:
#   -d, --dry-run      Show what would be changed without making changes
#   -v, --verbose      Show detailed output
#   -n, --no-backup    Don't create backup files
```

The migration script:
1. Updates all file contents (code, configs, docs)
2. Renames files and directories
3. Updates package.json
4. Creates migration summary

## Directory Structure

```
Agent-Factory-Edition/
├── src/
│   ├── factory/              # Factory components
│   │   ├── ArchitectureFactory.ts
│   │   ├── BrainFactory.ts
│   │   ├── ClusterFactory.ts
│   │   ├── AgentFactory.ts
│   │   ├── WorkflowFactory.ts
│   │   └── CoordinationFactory.ts
│   ├── types/               # TypeScript types
│   │   └── architecture.ts
│   ├── coordination/        # V3 coordination layer (unchanged)
│   └── index.ts            # Main entry point
├── ARCHITECTURES/          # Example architectures
│   ├── spider.json
│   ├── hermes.json
│   └── shark.json
├── FACTORY/               # Factory templates
├── MIGRATION/             # Migration tools
│   └── migrate.sh         # Keyword migration script
├── REFERENCE/             # Documentation
├── examples/              # Usage examples
├── templates/             # Template files
└── README.md              # This file
```

## Integration with V3

V4 is built on top of the cleaned V3 coordination layer:

1. **V3 Coordination Layer**: Unchanged, provides agent delegation, state management, persistence
2. **V4 Factory Layer**: Adds meta-configuration on top of V3
3. **Backward Compatibility**: V3 agent definitions work in V4 via configuration

## Development

### Prerequisites
- Node.js 18+
- TypeScript 5+

### Setup
```bash
# Clone the repository
git clone <repository-url>
cd Agent-Factory-Edition

# Install dependencies (if any)
npm install

# Build
npm run build

# Test
npm test
```

### Adding New Architecture Types

1. **Brain Types**: Register in `BrainFactory.registerDefaultBrains()`
2. **Cluster Types**: Register in `ClusterFactory.registerDefaultClusters()`
3. **Agent Types**: Register in `AgentFactory.registerDefaultAgents()`
4. **Workflow Types**: Register in `WorkflowFactory.registerDefaultWorkflows()`
5. **Coordination Styles**: Register in `CoordinationFactory.registerDefaultCoordinationStyles()`

## Use Cases

### 1. Rapid Prototyping
```typescript
// Quickly test different architectures
const architectures = ['spider', 'hermes', 'shark'];
for (const arch of architectures) {
  const instance = await createArchitecture({
    config: `./ARCHITECTURES/${arch}.json`
  });
  // Test and compare
}
```

### 2. Project-Specific Architectures
```typescript
// Define architecture per project
const projectArchitecture = {
  id: 'ecommerce-architecture',
  name: 'ECommerce Project Architecture',
  // Custom configuration for ecommerce project
  brains: [...],
  clusters: [...],
  agents: [...],
  workflows: [...]
};

const ecommerce = await createArchitecture({
  config: projectArchitecture
});
```

### 3. A/B Testing Architectures
```typescript
// Test different coordination styles
const styles = ['hub-spoke', 'mesh', 'hierarchical', 'federated'];
for (const style of styles) {
  const config = loadSpiderConfig(); // Base config
  config.coordination.style = style;
  
  const instance = await createArchitecture({ config });
  // Measure performance
}
```

## Reference Documentation

| Document | Description |
|----------|-------------|
| `PARALLEL_PEER_BRAINS.md` | **Critical** — Shark Macro (triple-brain parallel peer) architecture: Execution + Reasoning + System brains racing concurrently through domain ownership, dynamic context injection, and gate-based synchronization. Based on shark-context ground truth. |
| `ARCHITECTURES/shark-v4.json` | Shark V4 triple-brain architecture aligned with shark-context. Execution/Reasoning/System brains, 6-phase workflow, mechanical gate enforcement. |
| `ARCHITECTURES/shark-hunter.json` | Alternative Shark variant with hunter/tactician/sentinel brains, aggressive target acquisition workflow. |

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## Support

- Issues: [GitHub Issues](https://github.com/your-org/agent-factory-edition/issues)
- Documentation: `REFERENCE/` directory
- Examples: `examples/` directory