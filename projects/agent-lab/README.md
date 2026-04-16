# Agent Lab

**Visual Operating System for AI Agent Development**

## Overview

Agent Lab transforms Shark/Kraken CLI into a visual operating system for designing, building, and testing custom AI agents through natural language conversation and video game-like interfaces.

## Architecture

The system is organized into 5 parallel engineering pods:

### **Pod 1: Kraken OS Integration Layer**
- Bridge between visual interface and existing Shark/Kraken infrastructure
- API Gateway, Agent Orchestration Service, Configuration Management

### **Pod 2: Visual Builder Frontend**
- React/Three.js-based visual agent design interface
- 2D/3D "character creation" for agents with real-time preview

### **Pod 3: Conversational AI System**
- Natural language orchestrator agent with multi-model NLP pipeline
- Specification extraction and refinement through dialogue

### **Pod 4: Swarm Coordination Engine**
- Shark agent swarm management and task decomposition
- Redis-based queue system for parallel execution

### **Pod 5: Testing & Deployment Infrastructure**
- Comprehensive CI/CD pipeline with OpenTelemetry monitoring
- Docker containerization and production deployment

## Development Setup

### Prerequisites
- Bun 1.3.11 or later
- Docker and Docker Compose (for local development)
- Redis (for Pod 4)

### Installation
```bash
# Install dependencies
bun install

# Start development servers for all pods
bun run dev:all

# Or start individual pods
bun run --filter=@agent-lab/pod1 dev
```

### Build Commands
```bash
# Build all packages
bun run build

# Run tests
bun run test

# Type check
bun run typecheck

# Lint
bun run lint
```

## Project Structure

```
agent-lab/
├── packages/
│   ├── pod1-kraken-os-integration/    # Pod 1: Kraken OS Integration
│   ├── pod2-visual-builder-frontend/  # Pod 2: Visual Builder Frontend
│   ├── pod3-conversational-ai-system/ # Pod 3: Conversational AI System
│   ├── pod4-swarm-coordination-engine/# Pod 4: Swarm Coordination Engine
│   ├── pod5-testing-deployment-infrastructure/ # Pod 5: Testing & Deployment
│   └── shared/                        # Shared utilities and types
├── build-workflows/                   # Build documentation
├── AGENT_LAB_ARCHITECTURE.md         # Complete architecture specification
└── README.md                         # This file
```

## Engineering Team Coordination

Each pod is developed by a dedicated team of 2-4 engineers with weekly architecture syncs. Cross-pod integration points are defined in the architecture documentation.

## License

Proprietary - Internal Agent Lab Development