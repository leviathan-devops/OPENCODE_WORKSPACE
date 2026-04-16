# WorkflowMachine Reference Implementation

From `shark-frankenstein/src/orchestrator/WorkflowMachine.ts` + `shark-frankenstein/src/orchestrator/state.ts`.

## WorkflowState Types

```typescript
export type Phase = 'PLAN' | 'BUILD' | 'TEST' | 'VERIFY' | 'SHIP';

export interface Claim {
  id: string;
  description: string;
  testFile: string;
  testStatus: 'pending' | 'tested' | 'pass' | 'fail';
  failureReason?: string;
  createdAt: number;
  completedAt?: number;
}

export interface GateResults {
  functional: 'pending' | 'pass' | 'fail';
  intent: 'pending' | 'pass' | 'fail';
  security: 'pending' | 'pass' | 'fail';
}

export interface PhaseState {
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  enteredAt: number | null;
  exitedAt: number | null;
  gateResults?: Partial<GateResults>;
}

export interface WorkflowState {
  version: string;
  workflowId: string;
  projectDirectory: string;
  currentPhase: Phase;
  loopCount: number;
  maxLoops: number;
  createdAt: number;
  updatedAt: number;
  phases: {
    PLAN: PhaseState;
    BUILD: PhaseState;
    TEST: PhaseState;
    VERIFY: PhaseState;
    SHIP: PhaseState;
  };
  claims: Claim[];
  manifest: string[];         // Files written in BUILD
  stage1Results?: object;      // Docker sandbox test results
  stage2Results?: object;      // Local device test results
  failureContext?: object;     // Captured on hard reset
  gates: GateResults;
}

const WORKFLOW_FILE = '.shark/workflow.json';
const PHASE_ORDER: Phase[] = ['PLAN', 'BUILD', 'TEST', 'VERIFY', 'SHIP'];
```

## WorkflowMachine Implementation

```typescript
import * as fs from 'fs';
import * as path from 'path';

export class WorkflowMachine {
  private state: WorkflowState;
  private workflowFile: string;

  constructor(projectDirectory: string, maxLoops: number = 3) {
    this.workflowFile = path.join(projectDirectory, WORKFLOW_FILE);
    this.state = this.loadOrCreate(projectDirectory, maxLoops);
  }

  private loadOrCreate(projectDirectory: string, maxLoops: number): WorkflowState {
    try {
      if (fs.existsSync(this.workflowFile)) {
        const content = fs.readFileSync(this.workflowFile, 'utf-8');
        return JSON.parse(content) as WorkflowState;
      }
    } catch {
      // Corrupted or missing — create new
    }

    const now = Date.now();
    return {
      version: '1.0',
      workflowId: `wf_${now}_${Math.random().toString(36).substring(2, 8)}`,
      projectDirectory,
      currentPhase: 'PLAN',
      loopCount: 0,
      maxLoops,
      createdAt: now,
      updatedAt: now,
      phases: {
        PLAN: { status: 'pending', enteredAt: now, exitedAt: null },
        BUILD: { status: 'pending', enteredAt: null, exitedAt: null },
        TEST: { status: 'pending', enteredAt: null, exitedAt: null },
        VERIFY: { status: 'pending', enteredAt: null, exitedAt: null },
        SHIP: { status: 'pending', enteredAt: null, exitedAt: null },
      },
      claims: [],
      manifest: [],
      gates: { functional: 'pending', intent: 'pending', security: 'pending' },
    };
  }

  private save(): void {
    this.state.updatedAt = Date.now();
    const dir = path.dirname(this.workflowFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.workflowFile, JSON.stringify(this.state, null, 2));
  }

  // ── State Accessors ───────────────────────────────────────

  getState(): WorkflowState {
    return { ...this.state };
  }

  getPhase(): Phase {
    return this.state.currentPhase;
  }

  getClaims(): Claim[] {
    return [...this.state.claims];
  }

  getManifest(): string[] {
    return [...this.state.manifest];
  }

  getGateResults(): GateResults {
    return { ...this.state.gates };
  }

  getLoopCount(): number {
    return this.state.loopCount;
  }

  // ── Phase Transitions ────────────────────────────────────

  canAdvance(targetPhase: Phase): { allowed: boolean; reason?: string } {
    const currentIdx = PHASE_ORDER.indexOf(this.state.currentPhase);
    const targetIdx = PHASE_ORDER.indexOf(targetPhase);

    // Can always go back to PLAN (hard reset)
    if (targetPhase === 'PLAN') {
      return { allowed: true };
    }

    // Can only advance forward
    if (targetIdx <= currentIdx) {
      return {
        allowed: false,
        reason: `Cannot go backwards from ${this.state.currentPhase} to ${targetPhase}`,
      };
    }

    // Check entry requirements for target phase
    return this.checkPhaseEntryRequirements(targetPhase);
  }

  private checkPhaseEntryRequirements(targetPhase: Phase): { allowed: boolean; reason?: string } {
    switch (targetPhase) {
      case 'BUILD':
        if (this.state.claims.length === 0) {
          return { allowed: false, reason: 'claims.json must exist with at least one claim' };
        }
        for (const claim of this.state.claims) {
          if (!claim.testFile) {
            return { allowed: false, reason: `Claim ${claim.id} has no testFile` };
          }
        }
        return { allowed: true };

      case 'TEST':
        if (this.state.manifest.length === 0) {
          return { allowed: false, reason: 'build-manifest.json must have at least one file' };
        }
        return { allowed: true };

      case 'VERIFY':
        if (!this.state.stage1Results || !this.state.stage2Results) {
          return { allowed: false, reason: 'Both stage1 and stage2 test results required' };
        }
        return { allowed: true };

      case 'SHIP':
        const gates = this.state.gates;
        if (gates.functional !== 'pass' || gates.intent !== 'pass' || gates.security !== 'pass') {
          return { allowed: false, reason: 'All three gates must pass before SHIP' };
        }
        return { allowed: true };

      default:
        return { allowed: true };
    }
  }

  advance(targetPhase: Phase): { success: boolean; error?: string } {
    const check = this.canAdvance(targetPhase);
    if (!check.allowed) {
      return { success: false, error: check.reason };
    }

    // Exit current phase
    this.state.phases[this.state.currentPhase].exitedAt = Date.now();
    this.state.phases[this.state.currentPhase].status = 'completed';

    // Handle BUILD → TEST → VERIFY loops
    if (this.state.currentPhase === 'VERIFY' && targetPhase !== 'SHIP') {
      // This is a loop back — increment
      this.state.loopCount++;
      if (this.state.loopCount >= this.state.maxLoops) {
        return {
          success: false,
          error: `Max loops (${this.state.maxLoops}) reached. Capturing failure context and resetting to PLAN.`,
        };
      }
    }

    // Enter new phase
    this.state.currentPhase = targetPhase;
    this.state.phases[targetPhase].status = 'in_progress';
    this.state.phases[targetPhase].enteredAt = Date.now();

    this.save();
    return { success: true };
  }

  // ── Claims Management ──────────────────────────────────────

  setClaims(claims: Claim[]): void {
    this.state.claims = claims;
    this.save();
  }

  updateClaim(claimId: string, updates: Partial<Claim>): void {
    const idx = this.state.claims.findIndex((c) => c.id === claimId);
    if (idx === -1) return;
    this.state.claims[idx] = { ...this.state.claims[idx], ...updates };
    this.save();
  }

  // ── Manifest Management ───────────────────────────────────

  addToManifest(filePath: string): void {
    if (!this.state.manifest.includes(filePath)) {
      this.state.manifest.push(filePath);
      this.save();
    }
  }

  // ── Test Results ──────────────────────────────────────────

  setStage1Results(results: object): void {
    this.state.stage1Results = results;
    this.save();
  }

  setStage2Results(results: object): void {
    this.state.stage2Results = results;
    this.save();
  }

  // ── Gate Results ──────────────────────────────────────────

  setGateResult(gate: keyof GateResults, result: 'pass' | 'fail'): void {
    this.state.gates[gate] = result;
    if (this.state.phases.VERIFY.status === 'in_progress') {
      this.state.phases.VERIFY.gateResults = this.state.gates;
    }
    this.save();
  }

  // ── Reset ─────────────────────────────────────────────────

  reset(reason: string): object {
    // Capture failure context before reset
    const failureContext = {
      reason,
      workflowId: this.state.workflowId,
      phase: this.state.currentPhase,
      loopCount: this.state.loopCount,
      claims: this.state.claims,
      manifest: this.state.manifest,
      gates: this.state.gates,
      stage1Results: this.state.stage1Results,
      stage2Results: this.state.stage2Results,
      capturedAt: Date.now(),
    };

    // Save failure context to a separate file
    const failureFile = path.join(
      this.state.projectDirectory,
      `.shark/failure-context/${this.state.workflowId}.json`,
    );
    const failureDir = path.dirname(failureFile);
    if (!fs.existsSync(failureDir)) {
      fs.mkdirSync(failureDir, { recursive: true });
    }
    fs.writeFileSync(failureFile, JSON.stringify(failureContext, null, 2));

    // Reset state
    const now = Date.now();
    this.state = {
      ...this.loadOrCreate(this.state.projectDirectory, this.state.maxLoops),
      workflowId: `wf_${now}_${Math.random().toString(36).substring(2, 8)}`,
      createdAt: now,
      updatedAt: now,
      failureContext,
    };
    this.save();

    return failureContext;
  }
}
```

## Phase Status Formatting

```typescript
export function formatPhaseStatus(state: WorkflowState): string {
  const { currentPhase, loopCount, maxLoops, phases, claims, gates } = state;

  const blocked: string[] = [];
  const available: string[] = [];

  // Determine what's blocked and available based on current phase
  switch (currentPhase) {
    case 'PLAN':
      blocked.push('write_file:src/', 'advance_phase:BUILD');
      available.push('extract_claims', 'write_file:plan.md', 'shark_recall');
      break;
    case 'BUILD':
      blocked.push('advance_phase:TEST (if manifest empty)', 'advance_phase:VERIFY');
      available.push('write_file:src/', 'write_file:test/', 'update_manifest', 'shark_remember');
      break;
    case 'TEST':
      blocked.push('write_file:src/', 'advance_phase:VERIFY (if tests failing)');
      available.push('test_runner', 'run_stage1', 'run_stage2');
      break;
    case 'VERIFY':
      blocked.push('write_file:src/', 'advance_phase:SHIP (if gates fail)');
      available.push('run_verification', 'guardian_scan', 'capture_context');
      break;
    case 'SHIP':
      blocked.push('write_file:src/', 'advance_phase:... (workflow complete)');
      available.push('deliver');
      break;
  }

  const lines = [
    `Phase: ${currentPhase}`,
    `Loop: ${loopCount}/${maxLoops}`,
    `Claims: ${claims.filter(c => c.testStatus === 'pass').length}/${claims.length} passing`,
    `Gates: F=${gates.functional} I=${gates.intent} S=${gates.security}`,
    ``,
    `Blocked: ${blocked.join(', ')}`,
    `Available: ${available.join(', ')}`,
  ];

  return lines.join('\n');
}
```
