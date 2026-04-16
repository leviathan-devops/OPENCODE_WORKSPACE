# Pod 3: Conversational AI System

## Overview

Natural language orchestrator agent with multi-model NLP pipeline for specification extraction and refinement through dialogue.

## Core Components

### Orchestrator Agent
- Enhanced `sisyphus` agent with lab-specific dialogue capabilities
- Context-aware conversation management
- Intent recognition and response generation

### Multi-model NLP Pipeline
- GLM-5 for primary conversation
- DeepSeek for code generation and technical reasoning
- OpenCode Zen fallback for reliability
- Model routing based on query type

### Specification Builder
- Converts dialogue into structured agent blueprints
- Validation and refinement loops
- Integration with visual builder for preview

### Dialogue Management
- Conversation state tracking
- User preference learning
- Context window optimization

## Technology Stack

- **LLM Integration**: OpenAI-compatible API clients
- **NLP Processing**: Custom pipeline with model routing
- **Conversation State**: Redis-backed session storage
- **API Framework**: Express.js + WebSocket
- **Validation**: Zod schemas for agent specifications

## Development

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Build
bun run build

# Test
bun run test
```