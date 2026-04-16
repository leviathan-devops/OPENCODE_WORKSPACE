import type { Plugin, PluginInput, Hooks } from '@opencode-ai/plugin';
import { BaseTridentPlugin, PROBLEM_SOLVING_LAYERS } from '@opencode-ai/plugin';

const CORE_PRINCIPLE = 'Trident Debug. Humans Fix.';

interface ProblemSolvingState {
  currentLayer: number;
  iteration: string;
  layerAttempts: number;
  artifacts: Map<string, string>;
  layer1: { complete: boolean; assumption: string; reasoning: string; successCriteria: string; confirmationCriteria: string };
  layer2: { complete: boolean; command: string; expected: string; environmentState: string };
  layer3: { complete: boolean; rawEvidence: string; logsChecked: string[]; expectedVsActual: string };
  layer4: { complete: boolean; gapAnalysis: string; updatedHypothesis: string; nextAction: string };
  layer5: { complete: boolean; patternExtracted: string; systemicIssue: string };
  layer6: { complete: boolean; verificationResult: string; behaviorMatch: boolean };
}

class ProblemSolvingPlugin extends BaseTridentPlugin {
  private state: ProblemSolvingState;
  private initialized: boolean = false;

  constructor() {
    super({
      name: 'Trident Problem Solving',
      version: '1.0.0',
      mode: 'PROBLEM_SOLVING',
      layers: PROBLEM_SOLVING_LAYERS,
      corePrinciple: CORE_PRINCIPLE,
    });

    this.state = this.createInitialState();
  }

  private createInitialState(): ProblemSolvingState {
    return {
      currentLayer: 1,
      iteration: 'V1.0',
      layerAttempts: 0,
      artifacts: new Map(),
      layer1: { complete: false, assumption: '', reasoning: '', successCriteria: '', confirmationCriteria: '' },
      layer2: { complete: false, command: '', expected: '', environmentState: '' },
      layer3: { complete: false, rawEvidence: '', logsChecked: [], expectedVsActual: '' },
      layer4: { complete: false, gapAnalysis: '', updatedHypothesis: '', nextAction: '' },
      layer5: { complete: false, patternExtracted: '', systemicIssue: '' },
      layer6: { complete: false, verificationResult: '', behaviorMatch: false },
    };
  }

  getHooks(): Hooks {
    return {
      'chat.message': (input: PluginInput) => {
        const message = input.content || '';
        const lower = message.toLowerCase();

        if (lower === 'start') {
          return this.handleStart();
        }
        if (lower === 'status') {
          return this.handleStatus();
        }
        if (lower === 'help') {
          return this.handleHelp();
        }
        if (lower.startsWith('show artifact')) {
          return this.handleShowArtifact(lower);
        }
        if (lower === 'reset') {
          return this.handleReset();
        }

        return null;
      },
    };
  }

  private handleStart(): { content: string } {
    if (!this.initialized) {
      this.initialized = true;
      return {
        content: `## Trident Problem Solving Mode INITIALIZED

**Core Principle:** "${CORE_PRINCIPLE}"

**Iteration:** ${this.state.iteration}

---

### LAYER 1: ASSUMPTION STATEMENT

**Thinking:** What do I assume? What do I believe will happen?

**Evokes:**
- Explicit assumption stated in one sentence
- Reasoning chain (why you believe it)
- Success criteria defined upfront
- What would confirm/disprove the assumption

---

**Anti-Derailment Active:**
- THEATRICAL CODE IS BANNED - claims without proof are blocked
- No mocking/stubbing - real evidence required
- No model switching - solve with current model

**Document your assumption, then advance with "next".**`,
      };
    }

    return {
      content: `## Already initialized

**Current Layer:** ${this.state.currentLayer}
**Iteration:** ${this.state.iteration}

Layer ${this.state.currentLayer}: ${PROBLEM_SOLVING_LAYERS.find(l => l.number === this.state.currentLayer)?.name || 'Unknown'}

Use "status" to see details or "reset" to start over.`,
    };
  }

  private handleStatus(): { content: string } {
    const currentLayerConfig = PROBLEM_SOLVING_LAYERS.find(l => l.number === this.state.currentLayer);

    return {
      content: `## Trident Problem Solving Status

**Iteration:** ${this.state.iteration}
**Current Layer:** ${this.state.currentLayer}/6 (${currentLayerConfig?.name || 'Unknown'})
**Layer Attempts:** ${this.state.layerAttempts}

---

### Core Principle
"${CORE_PRINCIPLE}"

**PROBLEM SOLVING NEVER EDITS CODE.** It only:
- Documents findings through structured reasoning
- Enforces evidence-based gate transitions
- Creates artifacts for human review

---

### Layer Progress
${this.formatLayerProgress()}

---

### Commands
- "start" - Begin or continue problem solving
- "help" - Show command reference
- "show artifact [layer]" - Display artifact for a layer
- "reset" - Reset to initial state`,
    };
  }

  private formatLayerProgress(): string {
    const layers = [
      { num: 1, name: 'ASSUMPTION', state: this.state.layer1 },
      { num: 2, name: 'ACTION', state: this.state.layer2 },
      { num: 3, name: 'OBSERVATION', state: this.state.layer3 },
      { num: 4, name: 'GAP ANALYSIS', state: this.state.layer4 },
      { num: 5, name: 'META REFLECTION', state: this.state.layer5 },
      { num: 6, name: 'VERIFICATION', state: this.state.layer6 },
    ];

    return layers.map(l => {
      const status = l.state.complete ? '✅' : '⬜';
      return `Layer ${l.num} (${l.name}): ${status}`;
    }).join('\n');
  }

  private handleHelp(): { content: string } {
    return {
      content: `## Trident Problem Solving - Help

**Core Principle:** "${CORE_PRINCIPLE}"

---

### Commands

| Command | Description |
|---------|-------------|
| start | Begin or resume problem solving |
| status | Show current state and progress |
| help | Show this help |
| show artifact [layer] | Display artifact for layer 1-6 |
| reset | Reset to initial state |

---

### The 6 Layers

**Layer 1: ASSUMPTION STATEMENT**
What do I assume? What do I believe will happen?
Evokes: Explicit assumption, reasoning chain, success criteria, confirmation criteria

**Layer 2: ACTION WITH PREDICTION**
What action will I take? What specific output do I expect?
Evokes: Exact command, expected output, environment state

**Layer 3: OBSERVATION & EVIDENCE**
What actually happened? Show me the proof.
Evokes: Raw evidence, logs checked, expected vs actual comparison

**Layer 4: GAP ANALYSIS & ADJUSTMENT**
The gap tells me what? Adjust hypothesis.
Evokes: Gap analysis, updated hypothesis, next action tied to insight

**Layer 5: META-COGNITIVE REFLECTION**
What should I have done differently?
Evokes: Pattern extraction, systemic issue identification

**Layer 6: VERIFICATION & CONFIRMATION**
How do I know the fix actually worked?
Evokes: Target environment execution, behavior match

---

### Anti-Derailment Rules

1. **No self-referencing proofs** - JSON/files created by agent = invalid evidence
2. **No "it works" without raw evidence** - Must show actual output
3. **No vague testing** - Must specify exact command + expected output
4. **No blind retry** - Gap analysis must inform next action
5. **No pattern repeat without extraction** - Layer 5 must extract pattern
6. **No syntax-only verification** - Must execute in target environment

---

**"Trident Debug. Humans Fix."**`,
    };
  }

  private handleShowArtifact(lower: string): { content: string } {
    const layerMatch = lower.match(/show artifact\s*(\d)?/);
    const layerNum = layerMatch ? parseInt(layerMatch[1]) : this.state.currentLayer;

    const artifacts: Record<number, { name: string; content: () => string }> = {
      1: {
        name: '01_ASSUMPTION.md',
        content: () => `## Layer 1: Assumption Statement

**Iteration:** ${this.state.iteration}

### Explicit Assumption
${this.state.layer1.assumption || '[Not documented]'}

### Reasoning Chain
${this.state.layer1.reasoning || '[Not documented]'}

### Success Criteria
${this.state.layer1.successCriteria || '[Not documented]'}

### Confirmation/Disproof Criteria
${this.state.layer1.confirmationCriteria || '[Not documented]'}

---
*Trident Problem Solving - Layer 1 Artifact*`,
      },
      2: {
        name: '02_ACTION.md',
        content: () => `## Layer 2: Action with Prediction

**Iteration:** ${this.state.iteration}

### Exact Command
${this.state.layer2.command || '[Not documented]'}

### Expected Output
${this.state.layer2.expected || '[Not documented]'}

### Environment State
${this.state.layer2.environmentState || '[Not documented]'}

---
*Trident Problem Solving - Layer 2 Artifact*`,
      },
      3: {
        name: '03_OBSERVATION.md',
        content: () => `## Layer 3: Observation & Evidence

**Iteration:** ${this.state.iteration}

### Raw Evidence
${this.state.layer3.rawEvidence || '[Not documented]'}

### Logs Checked
${this.state.layer3.logsChecked.length > 0 ? this.state.layer3.logsChecked.join('\n') : '[None]'}

### Expected vs Actual Comparison
${this.state.layer3.expectedVsActual || '[Not documented]'}

---
*Trident Problem Solving - Layer 3 Artifact*`,
      },
      4: {
        name: '04_GAP_ANALYSIS.md',
        content: () => `## Layer 4: Gap Analysis & Adjustment

**Iteration:** ${this.state.iteration}

### Gap Analysis
${this.state.layer4.gapAnalysis || '[Not documented]'}

### Updated Hypothesis
${this.state.layer4.updatedHypothesis || '[Not documented]'}

### Next Action Tied to Insight
${this.state.layer4.nextAction || '[Not documented]'}

---
*Trident Problem Solving - Layer 4 Artifact*`,
      },
      5: {
        name: '05_META_REFLECTION.md',
        content: () => `## Layer 5: Meta-Cognitive Reflection

**Iteration:** ${this.state.iteration}

### Pattern Extracted
${this.state.layer5.patternExtracted || '[Not documented]'}

### Systemic Issue
${this.state.layer5.systemicIssue || '[Not documented]'}

### What I Should Have Done Differently
${'[Not documented]'}

---
*Trident Problem Solving - Layer 5 Artifact*`,
      },
      6: {
        name: '06_VERIFICATION.md',
        content: () => `## Layer 6: Verification & Confirmation

**Iteration:** ${this.state.iteration}

### Verification Result
${this.state.layer6.verificationResult || '[Not documented]'}

### Behavior Match
${this.state.layer6.behaviorMatch ? '✅ YES' : '⬜ NO'}

### No Regressions
${'[Not verified]'}

---
*Trident Problem Solving - Layer 6 Artifact*`,
      },
    };

    if (layerNum >= 1 && layerNum <= 6) {
      const artifact = artifacts[layerNum];
      return {
        content: `## Artifact: ${artifact.name}\n\n${artifact.content()}`,
      };
    }

    return {
      content: 'Invalid layer. Use show artifact [1-6].',
    };
  }

  private handleReset(): { content: string } {
    this.state = this.createInitialState();
    this.initialized = false;
    return {
      content: `## Trident Problem Solving RESET

All state cleared. Iteration reset to ${this.state.iteration}.

Ready to begin fresh problem solving session.

**Core Principle:** "${CORE_PRINCIPLE}"

Type "start" to begin.`,
    };
  }

  public setLayer1(assumption: string, reasoning: string, successCriteria: string, confirmationCriteria: string): void {
    this.state.layer1 = { complete: true, assumption, reasoning, successCriteria, confirmationCriteria };
    this.state.currentLayer = 2;
  }

  public setLayer2(command: string, expected: string, environmentState: string): void {
    this.state.layer2 = { complete: true, command, expected, environmentState };
    this.state.currentLayer = 3;
  }

  public setLayer3(rawEvidence: string, logsChecked: string[], expectedVsActual: string): void {
    this.state.layer3 = { complete: true, rawEvidence, logsChecked, expectedVsActual };
    this.state.currentLayer = 4;
  }

  public setLayer4(gapAnalysis: string, updatedHypothesis: string, nextAction: string): void {
    this.state.layer4 = { complete: true, gapAnalysis, updatedHypothesis, nextAction };
    this.state.currentLayer = 5;
  }

  public setLayer5(patternExtracted: string, systemicIssue: string): void {
    this.state.layer5 = { complete: true, patternExtracted, systemicIssue };
    this.state.currentLayer = 6;
  }

  public setLayer6(verificationResult: string, behaviorMatch: boolean): void {
    this.state.layer6 = { complete: true, verificationResult, behaviorMatch };
    this.state.currentLayer = 7;
  }

  public getState(): ProblemSolvingState {
    return this.state;
  }

  public getIteration(): string {
    return this.state.iteration;
  }

  public incrementIteration(): void {
    const [major, minor] = this.state.iteration.split('.');
    this.state.iteration = `${major}.${parseInt(minor) + 1}`;
  }
}

const plugin = new ProblemSolvingPlugin();
export default plugin;