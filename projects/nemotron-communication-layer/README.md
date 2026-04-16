# Nemotron Communication Layer

Dynamic communication layer for token-efficient agent orchestration.

## Quick Start

```typescript
import { NemotronBridge, Message, Priority } from './src/nemotron-bridge';

// Initialize bridge
const bridge = new NemotronBridge();

// Register agents
bridge.registerAgent('engineer-1', 'hephaestus');
bridge.registerAgent('orchestrator', 'orchestrator');

// Send message
const message: Message = {
  id: 'msg-001',
  from: 'engineer-1',
  to: 'orchestrator',
  content: '## Progress\nModule 75% complete',
  timestamp: new Date(),
  priority: Priority.MEDIUM,
};

const result = bridge.processMessage(message);
console.log(`Sent ${result.actualTokens} tokens (target: ${result.targetTokens})`);
```

## API Reference

### NemotronBridge

#### `processMessage(message: Message): CompactedMessage`
Process and route a message. Returns compacted version with metadata.

#### `handleMoreContextRequest(request: Message): string`
Handle "more context" request from orchestrator. Returns up to 72k tokens.

#### `registerAgent(agentId: string, type: AgentType): void`
Register an agent in the routing system.

#### `getMetrics(): TokenMetrics`
Get token usage and compression metrics.

### Message Interface

```typescript
interface Message {
  id: string;
  from: string;
  to: string | string[];
  content: string;
  timestamp: Date;
  priority: Priority;
  overrideRequest?: {
    requestedTokens: number;
    reason: string;
  };
}
```

### Priority Levels

- `CRITICAL`: Doubles token limit
- `HIGH`: 1.5x token limit
- `MEDIUM`: Standard limit
- `LOW`: 0.75x token limit

## Token Sizing

Messages are auto-sized to 2k/4k/6k/8k based on content:

- **2k**: Simple acks, status updates
- **4k**: Progress reports, questions
- **6k**: Build prompts, code reviews
- **8k**: Debugging, escalations

**Important**: Messages use only the tokens they need. A 500-token message will use 500 tokens, not forced to 2k.

## Configuration

See `config/nemotron-config.json` for:
- Token limits
- Compression settings
- Priority multipliers
- Context storage limits

## License

Part of Kraken Brain orchestration system.
