# DYNAMIC CONTEXT MANAGEMENT — System Brain V2.0

**File:** `src/brains/system/context-manager.ts`

---

## Core Problem (From First-Hand Experience)

Session compaction disrupts the stream of consciousness:

```
Chat History (1200 lines)
    ↓
COMPACTION HITS
    ↓
Context compressed, older files deleted
    ↓
"Lets continue from where we were"
    ↓
❌ What was the last decision point?
❌ What files were we working on?
❌ What was the next step?
❌ Where in the algorithm are we?
```

**From my experience:** After compaction, I had to re-read files to remember where I was. The " elevator pitch" quick-inject helped, but the system didn't proactively manage this.

---

## The Solution: Four-Tier Context Management System

```
┌─────────────────────────────────────────────────────────────────────┐
│              FOUR-TIER CONTEXT MANAGEMENT SYSTEM                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  TIER 0: PROACTIVE TOKEN MANAGEMENT                                  │
│  ────────────────────────────────────                               │
│  Continuous monitoring of token budget                               │
│  Dynamic removal of low-value context BEFORE compaction hits         │
│  Priority: PREVENT compaction, not just survive it                   │
│                                                                      │
│  TIER 1: PRE-COMPACTION EXPORT                                       │
│  ───────────────────────────────                                     │
│  Triggered at 75% tokens (before 85% auto-compaction)              │
│  Export chat history + decision state + brain state                   │
│  Priority: CAPTURE everything before it's lost                        │
│                                                                      │
│  TIER 2: POST-COMPACTION SYNTHESIS                                   │
│  ──────────────────────────────────                                 │
│  Triggered at 85% when OpenCode auto-compacts                      │
│  Synthesize injection file from pre-compaction export                 │
│  Priority: RESTORE stream of consciousness                           │
│                                                                      │
│  TIER 3: DYNAMIC CONTEXT INJECTION                                   │
│  ──────────────────────────────────                                 │
│  System brain identifies decision points                             │
│  Injects relevant context at key moments                             │
│  Facilitates algorithmic thinking patterns                             │
│  Priority: ENHANCE execution, not just recover                      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## TIER 0: Proactive Token Management

### Token Budget Monitor

```typescript
interface TokenBudget {
  maxTokens: number;
  currentTokens: number;
  
  // Thresholds calibrated to OpenCode auto-compaction at 85%
  warningThreshold: number;      // 65% - trigger proactive cleanup
  preCompactionThreshold: number; // 75% - trigger pre-compaction export
  compactionAnchor: number;       // 85% - OpenCode auto-compaction fires HERE
  
  // Priority tiers for context
  criticalContext: string[];    // Never remove
  highPriorityContext: string[]; // Remove last
  mediumPriorityContext: string[]; // Remove if needed
  lowPriorityContext: string[]; // Remove first
}

class TokenBudgetMonitor {
  private budget: TokenBudget;
  private contextPriority: Map<string, number> = new Map();
  
  constructor(maxTokens: number = 100000) {
    this.budget = {
      maxTokens,
      currentTokens: 0,
      
      // OPENCODE AUTO-COMPACTION FIRES AT 85%
      // We want to clean up BEFORE this happens
      warningThreshold: 0.65,           // 65% - Start proactive cleanup
      preCompactionThreshold: 0.75,     // 75% - Pre-compaction export
      compactionAnchor: 0.85,           // 85% - AUTO-COMPACTION (THE ANCHOR)
      
      criticalContext: [],
      highPriorityContext: [],
      mediumPriorityContext: [],
      lowPriorityContext: [],
    };
  }
  
  // Update token count after each message
  updateTokens(tokens: number): void {
    this.budget.currentTokens = tokens;
    
    // COMPACTION ANCHOR at 85% - OpenCode auto-compacts here
    if (tokens >= this.budget.maxTokens * this.budget.compactionAnchor) {
      // 85% - AUTO-COMPACTION just fired or imminent
      this.triggerPostCompactionProtocol();
    } else if (tokens >= this.budget.maxTokens * this.budget.preCompactionThreshold) {
      // 75% - Pre-compaction export BEFORE auto hits
      this.triggerPreCompactionExport();
    } else if (tokens >= this.budget.maxTokens * this.budget.warningThreshold) {
      // 65% - Warning, light cleanup
      this.triggerWarningCleanup();
    }
  }
  
  // Register context with priority
  registerContext(id: string, content: string, priority: 'critical' | 'high' | 'medium' | 'low'): void {
    this.contextPriority.set(id, this.priorityToNumber(priority));
    this.budget[`${priority}PriorityContext`].push(id);
  }
  
  // Get context to remove for cleanup
  // Target: Get back down to 60% after hitting 65% warning threshold
  getContextToRemove(targetRatio: number = 0.60): string[] {
    const toRemove: string[] = [];
    const targetTokens = this.budget.maxTokens * targetRatio;
    let current = this.budget.currentTokens;
    
    // Sort by priority (low first)
    const sorted = Array.from(this.contextPriority.entries())
      .sort((a, b) => a[1] - b[1]);
    
    for (const [id, priority] of sorted) {
      if (current <= targetTokens) break;
      
      const contextSize = this.estimateContextSize(id);
      toRemove.push(id);
      current -= contextSize;
    }
    
    return toRemove;
  }
}
```

### Dynamic Context Pruning

```typescript
class DynamicContextPruner {
  private tokenMonitor: TokenBudgetMonitor;
  
  // Continuously evaluate context relevance
  // Target: Stay below 65% to avoid compaction, aim for 60% after cleanup
  async evaluateAndPrune(): Promise<PruneResult> {
    const result: PruneResult = {
      removed: [],
      retained: [],
      tokensSaved: 0,
    };
    
    // 1. Remove low-priority context first (target: back to 60%)
    const lowPriority = this.tokenMonitor.getContextToRemove(0.60);
    
    for (const id of lowPriority) {
      if (this.isLowPriority(id)) {
        await this.removeContext(id);
        result.removed.push(id);
        result.tokensSaved += this.estimateContextSize(id);
      }
    }
    
    // 2. Summarize medium-priority context if still at/above 65%
    if (this.tokenMonitor.getCurrentTokens() >= this.tokenMonitor.getMaxTokens() * 0.65) {
      const mediumPriority = this.getMediumPriorityContexts();
      
      for (const id of mediumPriority) {
        if (this.tokenMonitor.getCurrentTokens() <= this.tokenMonitor.getMaxTokens() * 0.60) break;
        
        const summary = await this.summarizeContext(id);
        await this.replaceWithSummary(id, summary);
        result.tokensSaved += this.estimateContextSize(id) - summary.length;
      }
    }
    
    // 3. Keep critical context always
    result.retained = this.getCriticalContexts();
    
    return result;
  }
  
  // Determine if context is low priority
  private isLowPriority(id: string): boolean {
    // Old tool outputs that have been processed
    // Completed task summaries
    // Stale file reads (file hasn't changed since)
    // Repetitive pattern matches
  }
  
  // Summarize context to preserve key info
  private async summarizeContext(id: string): Promise<string> {
    const context = await this.loadContext(id);
    
    // Use lightweight summarization
    // Keep: decisions made, key outputs, file locations
    // Remove: verbose tool outputs, intermediate steps
  }
}
```

---

## TIER 1: Pre-Compaction Export

### Compaction Event Detector

```typescript
interface CompactionEvent {
  timestamp: Date;
  trigger: 'token_threshold' | 'manual' | 'auto';
  chatHistoryLines: number;
  currentPhase: string;
  activeContext: ContextSnapshot;
  decisionPoints: DecisionPoint[];
  brainState: BrainState;
}

interface DecisionPoint {
  id: string;
  lineNumber: number;
  type: 'implementation' | 'architecture' | 'debug' | 'refactor';
  description: string;
  contextFiles: string[];
  outcome?: string;
}

class CompactionEventDetector {
  private lastCompactionExport: CompactionEvent | null = null;
  private compactionHistory: CompactionEvent[] = [];
  
  // Detect approaching compaction
  // OpenCode auto-compacts at 85%, we export at 75%
  detectApproachingCompaction(
    currentTokens: number,
    maxTokens: number,
    chatHistory: Message[]
  ): CompactionEvent | null {
    
    const ratio = currentTokens / maxTokens;
    
    // Trigger at 75% tokens (before 85% auto-compaction)
    if (ratio >= 0.75 && !this.hasRecentExport()) {
      return this.createPreCompactionEvent(chatHistory, 'token_threshold');
    }
    
    return null;
  }
  
  private createPreCompactionEvent(
    chatHistory: Message[],
    trigger: string
  ): CompactionEvent {
    // Extract decision points from recent chat
    const decisionPoints = this.extractDecisionPoints(chatHistory);
    
    // Capture current state
    const event: CompactionEvent = {
      timestamp: new Date(),
      trigger,
      chatHistoryLines: chatHistory.length,
      currentPhase: this.getCurrentPhase(),
      activeContext: this.captureActiveContext(),
      decisionPoints,
      brainState: this.captureBrainState(),
    };
    
    this.lastCompactionExport = event;
    this.compactionHistory.push(event);
    
    return event;
  }
  
  // Extract decision points from chat history
  private extractDecisionPoints(chatHistory: Message[]): DecisionPoint[] {
    const points: DecisionPoint[] = [];
    
    for (let i = chatHistory.length - 1; i >= 0; i--) {
      const msg = chatHistory[i];
      
      // Look for decision indicators
      if (this.isDecisionMessage(msg)) {
        points.push({
          id: `dp-${points.length + 1}`,
          lineNumber: i,
          type: this.classifyDecisionType(msg),
          description: this.extractDecisionDescription(msg),
          contextFiles: this.extractReferencedFiles(msg),
        });
        
        if (points.length >= 10) break;  // Last 10 decisions
      }
    }
    
    return points;
  }
}
```

### Pre-Compaction State Capture

```typescript
class PreCompactionExporter {
  private exportDir: string;
  
  async export(event: CompactionEvent): Promise<CompactionExport> {
    const exportId = `pre-compaction-${Date.now()}`;
    const exportPath = path.join(this.exportDir, exportId);
    
    await fs.mkdir(exportPath, { recursive: true });
    
    // 1. Export chat history (last N lines)
    const chatExport = await this.exportChatHistory(event.chatHistoryLines);
    
    // 2. Export active context files
    const contextExport = await this.exportActiveContext(event.activeContext);
    
    // 3. Export decision points
    const decisionsExport = await this.exportDecisionPoints(event.decisionPoints);
    
    // 4. Export brain state
    const brainStateExport = await this.exportBrainState(event.brainState);
    
    // 5. Create synthesis manifest
    const manifest: CompactionExport = {
      exportId,
      exportPath,
      timestamp: event.timestamp,
      chatExport,
      contextExport,
      decisionsExport,
      brainStateExport,
      synthesisInstructions: this.generateSynthesisInstructions(event),
    };
    
    await this.writeManifest(manifest);
    
    return manifest;
  }
  
  private async exportChatHistory(lines: number): Promise<ChatExport> {
    // Export last N lines of chat
    const chatHistory = await this.loadRecentChat(lines);
    
    return {
      lines: chatHistory.length,
      content: chatHistory.join('\n'),
      lastLines: chatHistory.slice(-100).join('\n'),  // Last 100 lines
    };
  }
  
  private async exportActiveContext(context: ContextSnapshot): Promise<ContextExport> {
    const exports: Record<string, string> = {};
    
    for (const [id, content] of context.files) {
      exports[id] = content;
    }
    
    return {
      files: exports,
      activeFiles: context.activeFiles,
      priorityFiles: context.priorityFiles,
    };
  }
  
  private async exportDecisionPoints(points: DecisionPoint[]): Promise<DecisionExport> {
    return {
      count: points.length,
      points,
      latestOutcome: points[0]?.outcome,
    };
  }
  
  private async exportBrainState(state: BrainState): Promise<BrainStateExport> {
    return {
      currentGate: state.currentGate,
      completedTasks: state.completedTasks,
      activeTask: state.activeTask,
      injectedContext: state.injectedContext,
      nextSteps: state.nextSteps,
    };
  }
  
  private generateSynthesisInstructions(event: CompactionEvent): SynthesisInstructions {
    return {
      currentPhase: event.currentPhase,
      priorityFiles: event.activeContext.priorityFiles,
      recentDecisions: event.decisionPoints.map(p => p.description),
      nextAction: this.determineNextAction(event),
      streamAnchor: this.extractStreamAnchor(event),
    };
  }
}
```

---

## TIER 2: Post-Compaction Synthesis

### Injection File Synthesizer

```typescript
interface SynthesisInstructions {
  currentPhase: string;
  priorityFiles: string[];
  recentDecisions: string[];
  nextAction: string;
  streamAnchor: string;  // Key phrase to resume from
}

class PostCompactionSynthesizer {
  async synthesize(
    preCompactionExport: CompactionExport,
    currentContext: ContextSnapshot
  ): Promise<InjectionFile> {
    const injection: InjectionFile = {
      version: '2.0',
      synthesizedAt: new Date(),
      preCompactionExportId: preCompactionExport.exportId,
      
      // Section 1: Stream of Consciousness Anchor
      streamAnchor: this.synthesizeStreamAnchor(preCompactionExport),
      
      // Section 2: What Was Happening
      situationSummary: this.summarizeSituation(preCompactionExport),
      
      // Section 3: Critical Files (T1 context)
      criticalFiles: this.selectCriticalFiles(
        preCompactionExport.contextExport,
        currentContext
      ),
      
      // Section 4: Recent Chat History (preserves continuity)
      recentChat: preCompactionExport.chatExport.lastLines,
      
      // Section 5: Decision Context
      decisionContext: this.synthesizeDecisionContext(preCompactionExport.decisionsExport),
      
      // Section 6: Next Steps
      nextSteps: this.synthesizeNextSteps(preCompactionExport),
      
      // Section 7: Brain State
      brainState: preCompactionExport.brainStateExport,
    };
    
    return injection;
  }
  
  private synthesizeStreamAnchor(export: CompactionExport): string {
    // Create a narrative anchor that resumes the thought process
    const lastDecision = export.decisionsExport.points[0];
    const phase = export.synthesizedAt;
    
    return `
================================================================================
STREAM OF CONSCIOUSNESS ANCHOR — COMPACTION RECOVERY
================================================================================

Last active phase: ${export.synthesisInstructions.currentPhase}
Last decision: ${lastDecision?.description || 'N/A'}
Time of compaction: ${phase.toISOString()}

To resume execution: Continue from the next step below.
The chat history below shows exactly where we were.

================================================================================
`;
  }
  
  private summarizeSituation(export: CompactionExport): string {
    return `
## WHERE WE WERE

**Phase:** ${export.synthesisInstructions.currentPhase}

**Recent Context Files:**
${export.synthesisInstructions.priorityFiles.map(f => `- ${f}`).join('\n')}

**Recent Decisions:**
${export.decisionsExport.points.slice(0, 5).map((p, i) => 
  `${i + 1}. [${p.type}] ${p.description}`
).join('\n')}

**Last Outcome:** ${export.decisionsExport.latestOutcome || 'In progress'}
`;
  }
  
  private selectCriticalFiles(
    preExport: ContextExport,
    currentContext: ContextSnapshot
  ): CriticalFile[] {
    const critical: CriticalFile[] = [];
    
    // Priority 1: Files we were actively editing
    for (const file of preExport.priorityFiles) {
      if (currentContext.files.has(file)) {
        critical.push({
          path: file,
          content: currentContext.files.get(file),
          reason: 'priority_file',
        });
      }
    }
    
    // Priority 2: Files modified in last N decisions
    for (const decision of preExport.decisionsExport.points.slice(0, 3)) {
      for (const file of decision.contextFiles) {
        if (!critical.find(c => c.path === file) && currentContext.files.has(file)) {
          critical.push({
            path: file,
            content: currentContext.files.get(file),
            reason: `referenced_in_decision:${decision.id}`,
          });
        }
      }
    }
    
    return critical;
  }
  
  private synthesizeDecisionContext(decisions: DecisionExport): string {
    if (decisions.points.length === 0) {
      return 'No significant decisions captured.';
    }
    
    return `
## DECISION CHAIN

${decisions.points.map((p, i) => `
### Decision ${i + 1}: ${p.type.toUpperCase()}
**What:** ${p.description}
**Files involved:** ${p.contextFiles.join(', ') || 'None'}
${p.outcome ? `**Outcome:** ${p.outcome}` : '**Status:** In progress'}
`).join('\n')}
`;
  }
  
  private synthesizeNextSteps(export: CompactionExport): string {
    const instructions = export.synthesisInstructions;
    
    return `
## NEXT ACTION

**Immediate next step:** ${instructions.nextAction}

**To continue:**
1. Read the critical files listed above
2. Review the decision chain
3. Resume from the next action
4. If blocked, check the recent chat history for context

**Current gate:** ${export.brainStateExport.currentGate}
**Active task:** ${export.brainStateExport.activeTask || 'None'}
`;
  }
}

interface InjectionFile {
  version: string;
  synthesizedAt: Date;
  preCompactionExportId: string;
  streamAnchor: string;
  situationSummary: string;
  criticalFiles: CriticalFile[];
  recentChat: string;
  decisionContext: string;
  nextSteps: string;
  brainState: BrainStateExport;
}

interface CriticalFile {
  path: string;
  content: string;
  reason: string;
}
```

### Compaction Recovery Hook

```typescript
class CompactionRecoveryHook {
  private synthesizer: PostCompactionSynthesizer;
  private systemBrain: SystemBrain;
  
  // Hook into session.created to detect post-compaction
  async handleSessionCreated(session: Session): Promise<void> {
    // Check if this is a recovery scenario
    const hasPreCompaction = await this.checkForPreCompactionExport();
    
    if (hasPreCompaction) {
      await this.performCompactionRecovery(session);
    }
  }
  
  private async performCompactionRecovery(session: Session): Promise<void> {
    // 1. Load pre-compaction export
    const preExport = await this.loadLatestPreCompactionExport();
    
    // 2. Capture current context (post-compaction state)
    const currentContext = await this.captureCurrentContext();
    
    // 3. Synthesize injection file
    const injection = await this.synthesizer.synthesize(preExport, currentContext);
    
    // 4. Inject into session
    await this.injectIntoSession(session, injection);
    
    // 5. Notify system brain of recovery
    await this.systemBrain.notifyCompactionRecovery({
      injectionVersion: injection.version,
      filesRestored: injection.criticalFiles.length,
      streamRestored: true,
    });
  }
  
  private async injectIntoSession(session: Session, injection: InjectionFile): Promise<void> {
    // Write injection file to accessible location
    const injectionPath = path.join(
      this.getSessionContextDir(session.id),
      'POST-COMPACTION-INJECTION.md'
    );
    
    await this.writeInjectionFile(injectionPath, injection);
    
    // Inject critical files into session context
    for (const file of injection.criticalFiles) {
      await session.injectContext({
        type: 'file',
        path: file.path,
        content: file.content,
        reason: file.reason,
      });
    }
    
    // Inject the injection file itself
    await session.injectContext({
      type: 'file',
      path: injectionPath,
      content: this.renderInjectionFile(injection),
      reason: 'compaction_recovery',
    });
  }
}
```

---

## TIER 3: Dynamic Context Injection

### Decision Point Injector

```typescript
class DynamicContextInjector {
  private systemBrain: SystemBrain;
  private contextLibrary: ContextLibrary;
  
  // Called during execution to inject relevant context
  async evaluateForInjection(
    currentTask: Task,
    chatHistory: Message[]
  ): Promise<Injection[]> {
    const injections: Injection[] = [];
    
    // 1. Detect current phase/pattern
    const phase = this.detectExecutionPhase(currentTask, chatHistory);
    
    // 2. Find relevant context for this phase
    const relevantContexts = await this.contextLibrary.findRelevant(
      phase,
      currentTask.type
    );
    
    // 3. Filter to most relevant
    const topContexts = this.rankByRelevance(
      relevantContexts,
      currentTask,
      chatHistory
    ).slice(0, 3);  // Max 3 injections
    
    // 4. Create injections
    for (const ctx of topContexts) {
      injections.push({
        contextId: ctx.id,
        content: ctx.content,
        trigger: this.detectInjectionTrigger(chatHistory, ctx),
        priority: ctx.priority,
      });
    }
    
    return injections;
  }
  
  // Detect what phase of execution we're in
  private detectExecutionPhase(task: Task, history: Message[]): ExecutionPhase {
    const recentMessages = history.slice(-20);
    const lastTool = recentMessages.find(m => m.role === 'tool')?.name;
    
    // Pattern matching on recent activity
    if (task.type === 'build') {
      if (this.wasJustEditing(task)) return 'implementation';
      if (this.isTesting()) return 'testing';
      if (this.isBuilding()) return 'building';
    }
    
    if (task.type === 'debug') {
      if (this.isInvestigating()) return 'investigation';
      if (this.hasIdentifiedRootCause()) return 'fixing';
    }
    
    return 'general';
  }
  
  // Create injection with algorithmic pathway
  private createAlgorithmicInjection(
    context: ContextFile,
    phase: ExecutionPhase
  ): Injection {
    return {
      contextId: context.id,
      content: this.addAlgorithmicFramework(context, phase),
      trigger: 'decision_point',
      priority: context.priority,
    };
  }
  
  // Add algorithmic thinking framework to context
  private addAlgorithmicFramework(context: ContextFile, phase: ExecutionPhase): string {
    const frameworks: Record<ExecutionPhase, string> = {
      'implementation': `
## ALGORITHMIC PATTERN: IMPLEMENTATION

When implementing, follow this pathway:
1. **Verify preconditions** — Check environment/state before starting
2. **Incremental verification** — Test after each significant change
3. **Preserve working state** — Checkpoint before risky changes
4. **Evidence of progress** — Each step should produce verifiable output

${context.content}
`,
      'testing': `
## ALGORITHMIC PATTERN: TESTING

When testing, follow this pathway:
1. **Isolate scope** — Know exactly what you're testing
2. **Prepare evidence** — Have pass criteria before running
3. **Run once** — Multiple runs introduce variables
4. **Collect mechanical proof** — passRate >= 0.96

${context.content}
`,
      'debugging': `
## ALGORITHMIC PATTERN: DEBUGGING

When debugging, follow this pathway:
1. **Reproduce** — Confirm the bug exists mechanically
2. **Isolate** — Find exact failure point
3. **Hypothesize** — One cause at a time
4. **Verify** — Mechanical proof, not guess

${context.content}
`,
      'building': `
## ALGORITHMIC PATTERN: BUILDING

When building, follow this pathway:
1. **Verify clean state** — No stale artifacts
2. **Incremental** — Small changes, verify each
3. **Collect artifacts** — Output declarations for verification
4. **Mechanical verification** — fs.existsSync(), not "looks right"

${context.content}
`,
    };
    
    return frameworks[phase] || context.content;
  }
}

type ExecutionPhase = 
  | 'implementation' 
  | 'testing' 
  | 'building' 
  | 'debugging' 
  | 'investigation' 
  | 'fixing' 
  | 'general';
```

### Context Library

```typescript
class ContextLibrary {
  private contexts: Map<string, ContextFile> = new Map();
  private index: ContextIndex;
  
  async findRelevant(
    phase: ExecutionPhase,
    taskType: TaskType
  ): Promise<ContextFile[]> {
    // Search context by phase + task type
    const key = `${phase}:${taskType}`;
    
    // Direct match
    const direct = this.contexts.get(key);
    
    // Phase match
    const phaseMatches = this.index.byPhase.get(phase) || [];
    
    // Task type matches
    const taskMatches = this.index.byTaskType.get(taskType) || [];
    
    // Combine and dedupe
    return this.dedupe([direct, ...phaseMatches, ...taskMatches]);
  }
  
  // Rank contexts by relevance to current situation
  private rankByRelevance(
    contexts: ContextFile[],
    task: Task,
    history: Message[]
  ): ContextFile[] {
    const scored = contexts.map(ctx => ({
      context: ctx,
      score: this.calculateRelevanceScore(ctx, task, history),
    }));
    
    return scored
      .sort((a, b) => b.score - a.score)
      .map(s => s.context);
  }
  
  private calculateRelevanceScore(
    context: ContextFile,
    task: Task,
    history: Message[]
  ): number {
    let score = 0;
    
    // Match to current task type
    if (context.taskTypes.includes(task.type)) score += 10;
    
    // Match to recent file edits
    const recentFiles = this.extractRecentFiles(history);
    for (const file of context.referencedFiles) {
      if (recentFiles.includes(file)) score += 5;
    }
    
    // Freshness (recently accessed contexts)
    if (context.lastAccessed && 
        Date.now() - context.lastAccessed < 3600000) {  // 1 hour
      score += 3;
    }
    
    // Priority
    score += context.priority;
    
    return score;
  }
}

interface ContextIndex {
  byPhase: Map<ExecutionPhase, ContextFile[]>;
  byTaskType: Map<TaskType, ContextFile[]>;
  byId: Map<string, ContextFile[]>;
}
```

---

## Integration with System Brain

```typescript
class SystemBrain {
  private tokenMonitor: TokenBudgetMonitor;
  private compactionDetector: CompactionEventDetector;
  private preExporter: PreCompactionExporter;
  private synthesizer: PostCompactionSynthesizer;
  private contextInjector: DynamicContextInjector;
  
  // Main hook for context management
  async manageContext(session: Session): Promise<void> {
    // TIER 0: Proactive token management
    await this.tokenMonitor.updateTokens(session.getTokenCount());
    
    // TIER 1: Pre-compaction detection
    const approachingCompaction = this.compactionDetector.detectApproachingCompaction(
      session.getTokenCount(),
      session.getMaxTokens(),
      session.getChatHistory()
    );
    
    if (approachingCompaction) {
      await this.preExporter.export(approachingCompaction);
    }
    
    // TIER 3: Dynamic injection evaluation
    if (session.isAtDecisionPoint()) {
      const injections = await this.contextInjector.evaluateForInjection(
        session.getCurrentTask(),
        session.getChatHistory()
      );
      
      for (const injection of injections) {
        await session.inject(injection);
      }
    }
  }
  
  // Compaction recovery
  async recoverFromCompaction(session: Session): Promise<void> {
    const recoveryHook = new CompactionRecoveryHook(
      this.synthesizer,
      this
    );
    
    await recoveryHook.handleSessionCreated(session);
  }
}
```

---

## Complete Compaction Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    COMPACTION MANAGEMENT WORKFLOW                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  CONTINUOUS (Tier 0):                                               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Token Monitor → Pruner → Context Registry                    │   │
│  │ • 65% tokens → Warning cleanup (prune low-priority)        │   │
│  │ • 75% tokens → Pre-compaction export triggered             │   │
│  │ • 85% tokens → OPENCODE AUTO-COMPACTION ANCHOR            │   │
│  │ • 90% tokens → Post-compaction critical                    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  PRE-COMPACTION (Tier 1):                                          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Triggered at 75% (before 85% auto-compaction)              │   │
│  │ Export: Chat history + Active context + Decision points    │   │
│  │         + Brain state + Synthesis instructions             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  POST-COMPACTION (Tier 2):                                          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Synthesize Injection File:                                  │   │
│  │ • Stream anchor (narrative resume point)                    │   │
│  │ • Situation summary (where we were)                         │   │
│  │ • Critical files (T1 context)                               │   │
│  │ • Last 100 lines chat history (continuity)                  │   │
│  │ • Decision chain (what led here)                             │   │
│  │ • Next steps (what to do next)                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  DYNAMIC INJECTION (Tier 3):                                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ System Brain detects decision points → Injects context      │   │
│  │ • Phase detection (implementation/testing/debugging)        │   │
│  │ • Context library lookup                                     │   │
│  │ • Algorithmic framework injection                           │   │
│  │ • Facilitates thinking patterns                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Summary

| Tier | Purpose | Trigger | Action |
|------|---------|---------|--------|
| 0 | Prevent | 65% tokens | Prune low-priority context |
| 1 | Capture | 75% tokens | Export pre-compaction state |
| 2 | Restore | 85% (auto-compaction) | Synthesize injection file |
| 3 | Enhance | Decision points | Inject relevant context |

**Critical Anchor:** OpenCode auto-compacts at 85%. All thresholds calibrated around this anchor.

**Goal:** Non-disruptive compactions that preserve stream of consciousness and actively facilitate algorithmic thinking patterns.

---

*End of Dynamic Context Management System*