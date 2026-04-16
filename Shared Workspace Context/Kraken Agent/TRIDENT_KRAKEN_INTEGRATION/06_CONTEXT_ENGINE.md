# TRIDENT-KRAKEN INTEGRATION — CONTEXT ENGINE

**Version:** 1.0  
**Date:** 2026-04-13

---

## Current State (V2.0 - Disconnected Compaction)

**V2.0 Context Engine:**
```typescript
// Four-tier compaction exists but NOT integrated with problem-solving
class CompactionManager {
  tier0_Proactive(): void { /* monitors tokens */ }
  tier1_PreCompaction(): void { /* exports at 75% */ }
  tier2_PostCompaction(): void { /* synthesizes at 85% */ }
  tier3_DynamicInjection(): void { /* on-demand */ }
}
```

**Problem:** Compaction is a survival mechanism, not an active problem-solving tool. No integration with Execution Brain's Problem Solving Mode loop.

---

## Target State (Trident-Enhanced Context Engine)

**Context Synthesis Mode Integration:**
```
During active problem-solving:
  ↓
L1: COLLECTION (T1-T4 sources)
L2: SCORING (urgency × 0.6 + importance × 0.4)
L3: COMPRESSION (<2k tokens)
L4: INJECTION (T0-ready stream)
  ↓
Context injected directly into thought stream
  ↓
Problem Solving Mode continues with context
```

---

## 4-Layer Context Engine

### LAYER 1: COLLECTION

**Collect from 4 sources:**
```typescript
interface ContextSource {
  type: 'T1' | 'T2' | 'T3' | 'T4';
  content: string;
  timestamp: Date;
  available: boolean;
}

async collectSources(): Promise<ContextSource[]> {
  return [
    { type: 'T1', content: this.getSessionState(), timestamp: new Date(), available: true },
    { type: 'T2', content: await this.getKnowledgeContext(), timestamp: new Date(), available: true },
    { type: 'T3', content: this.getRecentFiles(), timestamp: new Date(), available: true },
    { type: 'T4', content: this.getToolHistory(), timestamp: new Date(), available: true }
  ];
}

private getSessionState(): string {
  const state = {
    gate: executionBrain.getCurrentGate(),
    task: executionBrain.getActiveTask(),
    brainState: {
      planning: planningBrain.getCurrentGate(),
      execution: executionBrain.getCurrentGate(),
      system: systemBrain.getPreValidationResult()
    },
    checkpoints: outputVerifier.getCheckpoints(),
    completedTasks: executionBrain.getCompletedTasks()
  };
  return JSON.stringify(state);
}

private async getKnowledgeContext(): Promise<string> {
  // Get from hermes_remember, hive_context, kraken_hive
  const memories = await hermes_remember({ query: 'current task', limit: 5 });
  const hive = await hive_context({ query: 'execution patterns', limit: 3 });
  return `MEMORIES: ${memories.map(m => m.content).join('\n')}\nHIVE: ${hive.map(h => h.content).join('\n')}`;
}

private getRecentFiles(): string {
  return recentFiles.map(f => `${f.path}: ${f.modified}`).join('\n');
}

private getToolHistory(): string {
  return last10Tools.map(t => `${t.tool}: ${JSON.stringify(t.args)}`).join('\n');
}
```

**Collection Rules:**
- T1 (Session): Always available
- T2 (Knowledge): Check hermes/hive, mark unavailable if empty
- T3 (Files): Check file existence, skip if deleted
- T4 (Tools): Get last 10 commands

---

### LAYER 2: SCORING

**Score by urgency × importance:**
```typescript
interface ScoredItem {
  source: ContextSource;
  urgency: number;      // 0-10
  importance: number;   // 0-10
  final: number;        // (urgency × 0.6) + (importance × 0.4)
  reason: string;       // Why this score
}

function scoreContext(sources: ContextSource[], trigger: Trigger): ScoredItem[] {
  return sources.map(source => {
    const urgency = calculateUrgency(source, trigger);
    const importance = calculateImportance(source);
    const final = (urgency * 0.6) + (importance * 0.4);
    
    return {
      source,
      urgency,
      importance,
      final,
      reason: `${source.type}: urgency=${urgency}, importance=${importance}`
    };
  }).sort((a, b) => b.final - a.final);
}

function calculateUrgency(source: ContextSource, trigger: Trigger): number {
  switch (trigger) {
    case 'task_blocker':
      return source.type === 'T1' ? 10 : 8;
    case 'gate_transition':
      return source.type === 'T1' ? 8 : 6;
    case 'token_budget':
      return source.type === 'T4' ? 7 : 5;
    default:
      return 5;
  }
}

function calculateImportance(source: ContextSource): number {
  switch (source.type) {
    case 'T1': return 10; // Session state is always critical
    case 'T2': return 8;  // Knowledge patterns are valuable
    case 'T3': return 7;  // Recent files are relevant
    case 'T4': return 4;  // Tool history is context
    default: return 5;
  }
}
```

**Scoring Matrix:**
| Source | Task Blocker | Gate Transition | Token Budget |
|--------|-------------|-----------------|--------------|
| T1 | 10 | 8 | 7 |
| T2 | 8 | 7 | 6 |
| T3 | 7 | 6 | 5 |
| T4 | 5 | 4 | 7 |

---

### LAYER 3: COMPRESSION

**Synthesize into <2k tokens:**
```typescript
function compress(scored: ScoredItem[], maxTokens: number = 2000): string {
  // Sort by final score descending
  const sorted = scored.sort((a, b) => b.final - a.final);
  
  // Build injection string
  let result = '';
  for (const item of sorted) {
    const candidate = `\n## ${item.source.type}\n${item.source.content}`;
    if ((result + candidate).length > maxTokens * 4) { // ~4 chars per token
      break;
    }
    result += candidate;
  }
  
  return result;
}
```

**Compression Rules:**
1. Sort by final score descending
2. Add highest scoring first
3. Stop when approaching 2k tokens
4. Deduplicate identical content
5. Summarize rather than truncate

---

### LAYER 4: INJECTION

**Format as T0-ready stream:**
```typescript
interface InjectionOutput {
  injection: string;
  trigger: Trigger;
  tokenCount: number;
  sections: InjectionSection[];
}

interface InjectionSection {
  type: 'CURRENT_GATE' | 'ACTIVE_TASK' | 'CONTEXT_HINTS' | 'RELEVANT_MEMORY';
  content: string;
}

function formatForInjection(
  compressed: string,
  trigger: Trigger,
  currentGate: Gate,
  activeTask: string,
  decisionPoints: string[]
): InjectionOutput {
  const sections: InjectionSection[] = [
    { type: 'CURRENT_GATE', content: currentGate },
    { type: 'ACTIVE_TASK', content: activeTask },
    { type: 'CONTEXT_HINTS', content: decisionPoints.join(' | ') },
    { type: 'RELEVANT_MEMORY', content: compressed }
  ];
  
  const injection = sections
    .map(s => `### ${s.type}\n${s.content}`)
    .join('\n\n');
  
  return {
    injection,
    trigger,
    tokenCount: injection.length / 4,
    sections
  };
}
```

**T0-Ready Format:**
```
### CURRENT_GATE
VERIFY

### ACTIVE_TASK
Verify outputs for task task_123_abc

### CONTEXT_HINTS
Decision point: outputs not found at /host/output.js | Gap analysis in progress | Meta-reflection on process

### RELEVANT_MEMORY
## T1
{"gate":6,"task":"task_123_abc","checkpoints":[{"path":"/host/output.js","verified":false}]}

## T2
PATTERN: Fire-and-forget detected in similar tasks. Must call claimRetrieved().

## T3
src/clusters/ClusterInstance.ts:155 - ClusterInstance.executeTaskAsync()
src/shared/output-verifier.ts:65 - OutputVerifier.claimRetrieved()
```

---

## Trigger Integration

### Trigger Types
```typescript
type Trigger = 'token_budget' | 'decision_point' | 'gate_transition';

class ContextEngine {
  private thresholds = {
    tokenBudget: 0.65,    // 65% tokens
    preCompaction: 0.75, // 75% tokens
    autoCompaction: 0.85  // 85% tokens (OpenCode auto-compacts here)
  };
  
  shouldTrigger(trigger: Trigger, currentTokens: number, maxTokens: number): boolean {
    const ratio = currentTokens / maxTokens;
    
    switch (trigger) {
      case 'token_budget':
        return ratio >= this.thresholds.tokenBudget;
      case 'decision_point':
        return executionBrain.isAtDecisionPoint();
      case 'gate_transition':
        return planningBrain.isTransitioning() || executionBrain.isTransitioning();
      default:
        return false;
    }
  }
}
```

### Active Problem-Solving Integration
```typescript
// During Problem Solving Mode execution
class ExecutionBrain {
  async executeGate3(): Promise<void> {
    const evidence = this.collectEvidence();
    
    if (!this.evidenceValid(evidence)) {
      // Gap detected - decision point!
      const trigger: Trigger = 'decision_point';
      
      if (contextEngine.shouldTrigger(trigger, this.getTokenRatio(), 1.0)) {
        // Request context injection
        const injection = await contextEngine.synthesizeContext(trigger);
        this.inject(injection);
      }
      
      // Continue with gap analysis
      return this.performGapAnalysis(evidence);
    }
  }
}
```

---

## Context Engine vs Compaction

| Aspect | V2.0 Compaction | Trident Context Engine |
|--------|---------------|----------------------|
| Trigger | Token budget only | Budget + decision + gate |
| Integration | None | Problem Solving Mode |
| Output | Survival dump | Active injection |
| Format | Raw export | T0-ready stream |
| Timing | When about to die | When will help |

---

## State Management

```typescript
interface ContextEngineState {
  lastInjection: {
    timestamp: Date;
    trigger: Trigger;
    tokenCount: number;
    injection: string;
  };
  tokenBudget: {
    current: number;
    max: number;
    threshold: number;
  };
  sources: {
    T1: { available: boolean; lastUpdate: Date };
    T2: { available: boolean; lastUpdate: Date };
    T3: { available: boolean; lastUpdate: Date };
    T4: { available: boolean; lastUpdate: Date };
  };
  scoring: {
    lastScores: ScoredItem[];
    totalScore: number;
  };
}
```