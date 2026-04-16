# MONITORING PROTOCOLS

**Purpose**: Token flow monitoring and iteration triggers
**Created**: Mar 26 2026

---

## Token Flow Monitoring

### Metrics Interface

```typescript
interface TokenMetrics {
  timestamp: Date;
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

### Accessing Metrics

```typescript
const bridge = new NemotronBridge();
const metrics = bridge.getMetrics();

console.log(`Compression ratio: ${metrics.compressionRatio}:1`);
console.log(`Average message size: ${metrics.avgMessageSize} tokens`);
console.log(`Override requests: ${metrics.overrideRequests}`);
```

---

## Daily Metrics Report

**Format**: 4k tokens to orchestrator

```markdown
## Daily Token Metrics - [DATE]

### Summary
- Total messages processed: X
- Average compression ratio: Y:1
- Orchestrator tokens used: Z / 128K

### Message Distribution
- 2k messages: X% (simple acks, status)
- 4k messages: X% (progress, questions)
- 6k messages: X% (build prompts, architecture)
- 8k messages: X% (debugging, escalations)

### Override Requests
- "More context" requests: X
- Average tokens delivered: Y

### Efficiency Score
- Target: <6k tokens per message average
- Actual: Y tokens per message average
- Status: [ON TARGET / NEEDS ADJUSTMENT]

### Recommendations
- [Adjust compression thresholds if needed]
- [Increase default token sizes if override requests frequent]
```

---

## Iteration Triggers

### Trigger 1: Token Bloat Detected
**Condition**: Average message >6k tokens
**Action**: Tighten compression thresholds
**Implementation**:
```typescript
if (metrics.avgMessageSize > 6000) {
  // Increase priority of critical sections
  // Reduce redundancy tolerance
  // Aggregate more aggressively
}
```

### Trigger 2: Frequent Override Requests
**Condition**: >10% of messages request override
**Action**: Increase default token sizes
**Implementation**:
```typescript
const overrideRate = metrics.overrideRequests / messageCount;
if (overrideRate > 0.1) {
  // Increase 2k → 3k
  // Increase 4k → 5k
  // Increase 6k → 7k
  // Keep 8k as max
}
```

### Trigger 3: Low Compression Ratio
**Condition**: <2:1 compression ratio
**Action**: Improve filtering algorithms
**Implementation**:
```typescript
if (metrics.compressionRatio < 2) {
  // Extract more critical info
  // Remove more redundancy
  // Aggregate details more aggressively
}
```

### Trigger 4: Context Overflow
**Condition**: Orchestrator >100k tokens/hour
**Action**: Emergency compression to 2k default
**Implementation**:
```typescript
if (orchestratorHourlyTokens > 100000) {
  // Force all messages to 2k max
  // Emergency compression mode
  // Alert orchestrator
}
```

---

## Context Storage Monitoring

### Storage Metrics

```typescript
const contextStats = bridge.getFullContextTokens();
console.log(`Context store: ${contextStats.current}/${contextStats.max}`);
console.log(`Utilization: ${(contextStats.utilization * 100).toFixed(1)}%`);
```

### Eviction Alerts

```typescript
// Alert when context store >80% full
if (contextStats.utilization > 0.8) {
  console.warn('Context store approaching capacity');
  console.warn('Oldest messages will be evicted soon');
}
```

---

## Performance Monitoring

### Latency Tracking

```typescript
const startTime = Date.now();
const result = bridge.processMessage(message);
const latency = Date.now() - startTime;

if (latency > 100) {
  console.warn(`High latency detected: ${latency}ms`);
}
```

### Target Latencies
- Message processing: <50ms
- Compression: <30ms
- Routing: <10ms
- "More context" request: <500ms

---

## Alert Thresholds

| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| Avg message size | >5k | >7k | Adjust compression |
| Compression ratio | <2:1 | <1.5:1 | Improve filtering |
| Override rate | >10% | >20% | Increase defaults |
| Orchestrator tokens | >80k/hr | >100k/hr | Emergency mode |
| Context store | >80% | >95% | Increase capacity |
| Latency | >50ms | >100ms | Optimize code |

---

## Monitoring Dashboard (Future)

**Metrics to Display**:
- Real-time token flow graph
- Message class distribution pie chart
- Compression ratio trend line
- Context store utilization bar
- Override request counter

**Alerts Panel**:
- Warning indicators for threshold breaches
- Critical alerts with suggested actions
- Historical alert log

---

## Reporting Schedule

**Hourly**: Internal metrics update
**Daily**: Summary report to orchestrator (4k tokens)
**Weekly**: Full analysis and threshold adjustment
**On-demand**: Detailed metrics dump for debugging

---

**NOTE**: Monitoring is passive by default. Alerts only trigger when thresholds are exceeded. Normal operation requires no manual intervention.
