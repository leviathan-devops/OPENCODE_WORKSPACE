# NEMOTRON COMMUNICATION LAYER - PROJECT ARCHITECTURE

**Created**: Mar 26 2026
**Version**: 1.0
**Purpose**: Dynamic communication layer for Kraken Brain orchestration system

---

## 🎯 SYSTEM OVERVIEW

Nemotron Communication Layer is a **background system** that auto-manages token/context bloat between agents and orchestrator. It prevents copying full chat logs back and forth on every message.

**Key Principle**: Simple, automatic, non-intrusive. **Messages use ONLY the tokens they need.**

---

## 🏗️ ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR (DeepSeek)                   │
│  • 128K context window                                       │
│  • Can request "more context" (24-72k tokens)                │
│  • Receives compressed 2-8k messages by default              │
└─────────────────────┬───────────────────────────────────────┘
                      │ 2-8k tokens (auto-sized)
                      │ Uses only needed tokens
                      │ Can request more
┌─────────────────────▼───────────────────────────────────────┐
│         NEMOTRON COMMUNICATION LAYER (1M tokens)             │
│                                                              │
│  SMART TOKEN SIZING:                                        │
│  ├─ 2K: Simple acks, status updates                         │
│  ├─ 4K: Progress reports, questions, dependencies            │
│  ├─ 6K: Build prompts, architecture, code reviews            │
│  └─ 8K: Debugging, integrations, escalations                 │
│                                                              │
│  MINIMAL TOKEN USAGE:                                        │
│  ├─ Only uses tokens needed (not forced to max)              │
│  ├─ 500 token message → 500 tokens (not 2k)                  │
│  └─ Compression only when exceeds target                     │
│                                                              │
│  MORE CONTEXT REQUEST:                                       │
│  ├─ Orchestrator requests "more context"                     │
│  ├─ Nemotron finds relevant context from full store          │
│  └─ Delivers up to 72k tokens of relevant context            │
│                                                              │
│  FULL CONTEXT STORAGE:                                       │
│  ├─ Stores all messages (up to 1M tokens)                    │
│  └─ Evicts oldest when full (FIFO)                           │
└─────────────────────┬───────────────────────────────────────┘
                      │ Bidirectional routing
        ┌─────────────┼─────────────┐
        │             │             │
   ┌────▼────┐   ┌────▼────┐   ┌────▼────┐
   │ Agent 1 │   │ Agent 2 │   │ Agent N │
   │ GLM 4.7 │   │ GLM 4.7 │   │ GLM 4.7 │
   └─────────┘   └─────────┘   └─────────┘
```

---

## 📊 TOKEN SIZING LOGIC

### Default Sizes (Auto-Detected)

| Size | Message Types | Examples |
|------|--------------|----------|
| 2K | Simple ack, status | "Understood", "75% complete" |
| 4K | Progress, questions, deps | "Need @engineer-2 by tomorrow" |
| 6K | Build prompts, architecture | Full task assignments |
| 8K | Debugging, escalations | Error traces, blocking issues |

### Minimal Token Principle

**Messages use only the tokens they need:**
- 500 token message → 500 tokens (NOT 2k)
- 3k token progress report → 3k tokens (NOT 4k)
- Compression only applied when content exceeds target

```typescript
// Example: Message with 500 tokens
const message = { content: "Understood. Working on it.", ... };
const result = bridge.processMessage(message);

// Result: actualTokens = ~4 (not forced to 2000)
// metadata.usedFullBudget = false
```

### Override Mechanisms

1. **Explicit Override**: Include `[TOKEN_OVERRIDE: 8k]` in message
2. **CRITICAL Priority**: Automatically doubles token limit
3. **More Context Request**: Orchestrator says "more context" → 24-72k

---

## 🔧 USAGE

### From Agent to Orchestrator

```typescript
import { NemotronBridge, Message, Priority } from './src/nemotron-bridge';

const bridge = new NemotronBridge();

const message: Message = {
  id: 'msg-001',
  from: 'engineer-1',
  to: 'orchestrator',
  content: `## Progress
Guardian module 75% complete

## Blockers
Need @engineer-2's API interface

## Next Steps
Continue permission wrapping`,
  timestamp: new Date(),
  priority: Priority.MEDIUM,
};

const compacted = bridge.processMessage(message);

// Result: ~2k tokens sent to orchestrator (message only needs 2k)
// actualTokens will be the actual count used, not forced to 4000
```

### Orchestrator Requesting More Context

```typescript
const request: Message = {
  id: 'req-001',
  from: 'orchestrator',
  to: 'nemotron',
  content: 'more context on Guardian module integration',
  timestamp: new Date(),
  priority: Priority.HIGH,
};

const fullContext = bridge.handleMoreContextRequest(request);
// Result: Up to 72k tokens of relevant context
```

### Registering Agents

```typescript
bridge.registerAgent('engineer-1', 'hephaestus');
bridge.registerAgent('engineer-2', 'hephaestus');
bridge.registerAgent('oracle-1', 'oracle');
```

### Getting Metrics

```typescript
const metrics = bridge.getMetrics();
console.log(`Compression ratio: ${metrics.compressionRatio}:1`);
console.log(`Messages by class:`, metrics.messagesByClass);
```

---

## 📁 FILE STRUCTURE

```
Nemotron Communication Layer/
├── src/
│   ├── nemotron-bridge.ts         Main orchestrator
│   ├── message-classifier.ts      Token sizing logic
│   ├── compression.ts             Context filtering
│   ├── routing.ts                 Agent routing
│   └── types.ts                   TypeScript interfaces
├── config/
│   └── nemotron-config.json       Configuration
├── PROJECT_ARCHITECTURE.md        This file
└── README.md                      Usage guide
```

---

## 🔍 COMPRESSION PIPELINE

### Step 1: Extract Critical Info
- Filter sections based on priority
- CRITICAL: blockers, errors, decisions only
- HIGH: + progress, dependencies, next steps
- MEDIUM: + details, context, background

### Step 2: Remove Redundancy
- Deduplicate identical lines
- Preserve short lines (<10 chars)

### Step 3: Aggregate Details
- File lists → count + first 3 files
- Multiple errors → summary count
- Repeated markers → single marker

### Step 4: Trim to Target
- Keep headers and critical info first
- Fill remaining space with other content
- Stop at target token count

---

## ✅ SUCCESS CRITERIA

1. **Automatic sizing**: 90%+ messages correctly classified
2. **Minimal tokens**: Messages use only needed tokens (not forced to max)
3. **Token efficiency**: Average <6k tokens per message
4. **More context**: Orchestrator can access 24-72k when needed
5. **Zero latency**: No noticeable delay in routing
6. **Full storage**: 1M token context preserved for queries

---

## 🚫 NOT IN SCOPE

- Complex NLP-based compression
- Real-time streaming
- Persistent storage (in-memory only)
- Multi-project support
- Machine learning compression

---

## 📈 METRICS TRACKING

```typescript
interface TokenMetrics {
  totalIngested: number;      // Raw tokens from all agents
  totalCompressed: number;    // Tokens after compression
  compressionRatio: number;   // Ingested / Compressed
  avgMessageSize: number;     // Average output size
  orchestratorTokens: number; // Tokens sent to orchestrator
  messagesByClass: {
    '2k': number;
    '4k': number;
    '6k': number;
    '8k': number;
  };
  overrideRequests: number;   // "More context" requests
}
```

---

**Simplicity over complexity. Minimal tokens over forced budgets. This is a background utility, not a featured product.**
