# ToolExecutor Firewall Fix & Enhancement Build Workflow

## 🚨 CRITICAL VULNERABILITY: BYPASS PATH IDENTIFIED

### Current State Analysis
**Problem**: The `WorkflowBlocker` is **optional** in `ToolExecutor` configuration, creating a bypass path that violates the "Earth Density" principle.

**Evidence**:
1. `coordinator-base.ts:75-79` initializes `ToolExecutor` **without** providing a `WorkflowBlocker`:
   ```typescript
   this.toolExecutor = new ToolExecutor({
     guardian: this.guardian,
     workspacePath: this.workspacePath,
     verbose: this.verbose,
     // ❌ MISSING: workflowBlocker
   });
   ```

2. `executor.ts:102` null check `if (this.workflowBlocker)` skips workflow enforcement:
   ```typescript
   // WorkflowBlocker check - CRITICAL FIX to prevent PLAN step bypass
   if (this.workflowBlocker) {  // ← NULL CHECK (defensive coding)
     const blockResult = this.workflowBlocker.blockWrite(filePath);
     if (blockResult.blocked) {
       return {
         toolCallId: toolCall.id,
         name: toolCall.name,
         success: false,
         result: `Workflow blocked: ${blockResult.reason}`,
         guardianBlocked: true,
         guardianReason: 'Workflow enforcement',
       };
     }
   }
   ```

**Result**: Agents can write files during PLAN step without workflow enforcement.

### Foundational Fix Required
Before implementing any enhancements, we **must** eliminate this bypass vulnerability by making WorkflowBlocker mandatory in the ToolExecutor flow.

### 🧠 PLANNING BRAIN ANALYSIS CONTEXT
This vulnerability was identified through **Nemotron 3 analysis** of the Planning Brain Handover Package:

**Source Analysis** (`/home/leviathan/OPENCODE_WORKSPACE/Kraken Brain/Planning Brain Handover Package/V4_CONTEXT_LIBRARY.md`):
- **Evidence**: WorkflowBlocker IS connected to ToolExecutor (countering misinformation)
- **Critical Finding**: But `coordinator-base.ts` doesn't pass WorkflowBlocker to ToolExecutor
- **Impact**: Creates optional enforcement that agents can bypass

**Strategic Context** (`/home/leviathan/OPENCODE_WORKSPACE/Kraken Brain/Planning Brain Handover Package/NEXT_STEPS_PROMPT.md`):
- **Priority**: P0 - IMMEDIATE NEXT STEPS (Wave 1 - Foundational Anchor)
- **Task 1**: Fix `coordinator-base.ts` to make WorkflowBlocker mandatory
- **Constraint**: Must preserve YOLO compatibility (`SHARK_SKIP_FIREWALLS=true`)

**Architectural Principle**: "Earth Density" - ToolExecutor must be the **unbypassable constitutional anchor** where ALL agent tool calls flow through mandatory firewalls.

---

## 🏗️ BUILD WORKFLOW: WAVE IMPLEMENTATION

### WAVE 1: FOUNDATIONAL ANCHOR FIX

**Context from Planning Brain**: This is the **highest priority fix** identified in NEXT_STEPS_PROMPT.md. The bypass vulnerability allows agents to skip workflow enforcement during PLAN step, violating the "Earth Density" principle.

#### **Step 1.1: Fix `coordinator-base.ts` (CRITICAL BYPASS FIX)**
**File**: `/home/leviathan/OPENCODE_WORKSPACE/shark-frankenstein/src/brain/coordinator-base.ts`

**Current Vulnerability Location**: Lines 75-79 (missing WorkflowBlocker)

**Planning Brain Reference**: V4_CONTEXT_LIBRARY.md confirms WorkflowBlocker is connected to ToolExecutor, but coordinator-base.ts doesn't pass it.

**Changes Required**:
1. **Import WorkflowBlocker**:
   ```typescript
   import { WorkflowBlocker } from '../workflow/blocker';
   ```

2. **Update BaseCoordinatorConfig interface**:
   ```typescript
   export interface BaseCoordinatorConfig {
     maxIterations?: number;
     autoApprove?: boolean;
     verbose?: boolean;
     workspacePath?: string;
     skipFirewalls?: boolean;  // NEW: YOLO bypass flag
   }
   ```

3. **Add WorkflowBlocker property**:
   ```typescript
   export abstract class BaseCoordinator {
     protected planningBrain: DeepSeekClient;
     protected guardian: Guardian;
     protected toolExecutor: ToolExecutor;
     protected workflowBlocker: WorkflowBlocker | null;  // NEW
     protected skipFirewalls: boolean;  // NEW
     // ... existing properties
   ```

4. **Update constructor**:
   ```typescript
   constructor(config: BaseCoordinatorConfig) {
     this.maxIterations = config.maxIterations || 10;
     this.autoApprove = config.autoApprove ?? false;
     this.verbose = config.verbose ?? false;
     this.workspacePath = config.workspacePath || process.cwd();
     this.skipFirewalls = config.skipFirewalls ?? 
                         process.env.SHARK_SKIP_FIREWALLS === 'true';  // NEW

     // Initialize Guardian
     this.guardian = createProductionGuardian(this.workspacePath);
     this.log('🛡️  Guardian initialized for coordinator');

     // Initialize WorkflowBlocker (unless bypassed)
     if (!this.skipFirewalls) {
       this.workflowBlocker = new WorkflowBlocker(this.workspacePath);
       this.log('🧱 WorkflowBlocker initialized');
     } else {
       this.workflowBlocker = null;
       this.log('⚠️  Firewalls bypassed (YOLO mode)');
     }

     // Initialize ToolExecutor WITH WorkflowBlocker
     this.toolExecutor = new ToolExecutor({
       guardian: this.guardian,
       workflowBlocker: this.workflowBlocker,  // FIXED: Now provided
       workspacePath: this.workspacePath,
       verbose: this.verbose,
     });
     this.log('🔧 ToolExecutor initialized');

     // Initialize planning brain
     this.planningBrain = new DeepSeekClient();
   }
   ```

#### **Step 1.2: Create FirewallAudit Class (Per Planning Brain NEXT_STEPS)**
**File**: `/home/leviathan/OPENCODE_WORKSPACE/shark-frankenstein/src/tools/audit.ts`

**Planning Brain Requirement**: NEXT_STEPS_PROMPT.md lists "Implement Audit Trail" as P0 priority. Must log all tool decisions to `.shark/firewall-audit.jsonl`.

**Key Constraint**: Audit trail must persist even in YOLO mode (marked as bypassed).

**Implementation**:
```typescript
/**
 * 🦈 SHARK CLI - Firewall Audit Trail
 * 
 * Constitutional logging of ALL tool decisions.
 * Even bypassed operations are logged (marked as bypassed).
 */
import * as fs from 'fs';
import * as path from 'path';
import { ToolCall } from '../brain/types';

export interface AuditEntry {
  timestamp: string;
  tool: string;
  agent: string;
  workflowStep: string;
  decision: 'ALLOW' | 'BLOCK' | 'BYPASS';
  reason: string;
  filePath?: string;
  command?: string;
  bypassed: boolean;
}

export class FirewallAudit {
  private auditPath: string;
  private entries: AuditEntry[] = [];

  constructor(workspacePath: string) {
    this.auditPath = path.join(workspacePath, '.shark', 'firewall-audit.jsonl');
    this.ensureAuditDirectory();
  }

  private ensureAuditDirectory(): void {
    const dir = path.dirname(this.auditPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  logToolCall(
    toolCall: ToolCall,
    decision: 'ALLOW' | 'BLOCK' | 'BYPASS',
    reason: string,
    workflowStep: string,
    bypassed: boolean = false
  ): void {
    const entry: AuditEntry = {
      timestamp: new Date().toISOString(),
      tool: toolCall.name,
      agent: 'unknown', // TODO: Extract from context
      workflowStep,
      decision,
      reason,
      bypassed,
      filePath: toolCall.arguments.file_path as string,
      command: toolCall.arguments.command as string,
    };

    this.entries.push(entry);
    
    // Append to JSONL file
    const line = JSON.stringify(entry) + '\n';
    fs.appendFileSync(this.auditPath, line, 'utf8');
  }

  getStats(): {
    totalCalls: number;
    blocked: number;
    allowed: number;
    bypassed: number;
    topViolations: Array<{tool: string; count: number}>;
  } {
    const totalCalls = this.entries.length;
    const blocked = this.entries.filter(e => e.decision === 'BLOCK').length;
    const allowed = this.entries.filter(e => e.decision === 'ALLOW').length;
    const bypassed = this.entries.filter(e => e.bypassed).length;

    // Count violations by tool
    const toolCounts = new Map<string, number>();
    this.entries
      .filter(e => e.decision === 'BLOCK')
      .forEach(e => {
        const count = toolCounts.get(e.tool) || 0;
        toolCounts.set(e.tool, count + 1);
      });

    const topViolations = Array.from(toolCounts.entries())
      .map(([tool, count]) => ({ tool, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalCalls,
      blocked,
      allowed,
      bypassed,
      topViolations,
    };
  }

  clear(): void {
    this.entries = [];
    if (fs.existsSync(this.auditPath)) {
      fs.unlinkSync(this.auditPath);
    }
  }
}
```

#### **Step 1.3: Update ToolExecutor with Audit Integration**
**File**: `/home/leviathan/OPENCODE_WORKSPACE/shark-frankenstein/src/tools/executor.ts`

**Changes Required**:
1. **Import FirewallAudit**:
   ```typescript
   import { FirewallAudit } from './audit';
   ```

2. **Update ToolExecutorConfig**:
   ```typescript
   export interface ToolExecutorConfig {
     guardian: Guardian;
     workflowBlocker: WorkflowBlocker | null;  // CHANGED: No longer optional
     workspacePath: string;
     verbose?: boolean;
     skipFirewalls?: boolean;  // NEW
   }
   ```

3. **Add audit property**:
   ```typescript
   export class ToolExecutor {
     private guardian: Guardian;
     private workflowBlocker: WorkflowBlocker | null;
     private audit: FirewallAudit;  // NEW
     private workspacePath: string;
     private verbose: boolean;
     private skipFirewalls: boolean;  // NEW
   ```

4. **Update constructor**:
   ```typescript
   constructor(config: ToolExecutorConfig) {
     this.guardian = config.guardian;
     this.workflowBlocker = config.workflowBlocker;
     this.workspacePath = config.workspacePath;
     this.verbose = config.verbose ?? false;
     this.skipFirewalls = config.skipFirewalls ?? false;
     
     // Initialize audit trail
     this.audit = new FirewallAudit(this.workspacePath);
   }
   ```

5. **Update executeWriteFile with audit logging**:
   ```typescript
   private async executeWriteFile(toolCall: ToolCall): Promise<ToolResult> {
     const filePath = this.resolvePath(toolCall.arguments.file_path as string);
     const content = toolCall.arguments.content as string;

     // Determine workflow step (placeholder - need actual integration)
     const workflowStep = 'UNKNOWN'; // TODO: Get from WorkflowMachine

     // YOLO bypass check
     if (this.skipFirewalls) {
       this.audit.logToolCall(
         toolCall,
         'BYPASS',
         'YOLO mode enabled',
         workflowStep,
         true
       );
       // Skip to file write
     } else {
       // WorkflowBlocker check
       if (this.workflowBlocker) {
         const blockResult = this.workflowBlocker.blockWrite(filePath);
         if (blockResult.blocked) {
           this.audit.logToolCall(
             toolCall,
             'BLOCK',
             `Workflow: ${blockResult.reason}`,
             workflowStep,
             false
           );
           
           return {
             toolCallId: toolCall.id,
             name: toolCall.name,
             success: false,
             result: `Workflow blocked: ${blockResult.reason}`,
             guardianBlocked: true,
             guardianReason: 'Workflow enforcement',
           };
         }
       }

       // Guardian check
       const decision = this.guardian.checkPermission(filePath, 'write');
       
       if (decision === ModificationDecision.DENY) {
         this.audit.logToolCall(
           toolCall,
           'BLOCK',
           'Guardian denied write permission',
           workflowStep,
           false
         );
         
         return {
           toolCallId: toolCall.id,
           name: toolCall.name,
           success: false,
           result: `Guardian DENIED write to ${filePath}`,
           guardianBlocked: true,
           guardianReason: 'File protection zone',
         };
       }

       // Log allowed operation
       this.audit.logToolCall(
         toolCall,
         'ALLOW',
         'Guardian allowed write',
         workflowStep,
         false
       );
     }

     // Proceed with file write
     try {
       fs.writeFileSync(filePath, content, 'utf8');
       return {
         toolCallId: toolCall.id,
         name: toolCall.name,
         success: true,
         result: `File written: ${filePath}`,
       };
     } catch (error: any) {
       return {
         toolCallId: toolCall.id,
         name: toolCall.name,
         success: false,
         result: `Failed to write file: ${error.message}`,
       };
     }
   }
   ```

#### **Step 1.4: Add CLI Statistics Command (Per Planning Brain)**
**File**: `/home/leviathan/OPENCODE_WORKSPACE/shark-frankenstein/src/cli.ts`

**Planning Brain Requirement**: NEXT_STEPS_PROMPT.md lists "Add CLI Statistics" with `shark --firewall-stats` command.

**Purpose**: Show blocks/hour, top violations, performance metrics for monitoring.

**Add to SharkCLI class**:
```typescript
/**
 * Get firewall statistics
 */
getFirewallStats(): {
  totalCalls: number;
  blocked: number;
  allowed: number;
  bypassed: number;
  topViolations: Array<{tool: string; count: number}>;
} {
  // TODO: Get actual audit instance
  // For now, placeholder - need to expose audit from ToolExecutor
  return {
    totalCalls: 0,
    blocked: 0,
    allowed: 0,
    bypassed: 0,
    topViolations: [],
  };
}
```

**Add to command parsing in repl()**:
```typescript
if (cmd === '/firewall-stats') {
  const stats = cli.getFirewallStats();
  console.log(chalk.cyan('\n🛡️  Firewall Statistics:'));
  console.log(chalk.gray(`   Total Tool Calls: ${stats.totalCalls}`));
  console.log(chalk.gray(`   Blocked: ${stats.blocked}`));
  console.log(chalk.gray(`   Allowed: ${stats.allowed}`));
  console.log(chalk.gray(`   Bypassed: ${stats.bypassed}`));
  
  if (stats.topViolations.length > 0) {
    console.log(chalk.yellow('\n   Top Violations:'));
    stats.topViolations.forEach(v => 
      console.log(chalk.yellow(`     • ${v.tool}: ${v.count} blocks`))
    );
  }
  console.log('');
  continue;
}
```

**Add to help text**:
```typescript
console.log(chalk.gray('  /firewall-stats - Show firewall statistics'));
```

#### **Step 1.5: Add YOLO CLI Flag (CRITICAL CONSTRAINT)**
**File**: `/home/leviathan/OPENCODE_WORKSPACE/shark-frankenstein/src/cli.ts`

**Planning Brain Constraint**: YOLO mode by default is a **core requirement** from original Nemotron prompt. All enhancements must include emergency bypass.

**Implementation Note**: `SHARK_SKIP_FIREWALLS=true` environment variable AND `shark --yolo` CLI flag.

**Update main() function argument parsing**:
```typescript
// Parse command line arguments
const args = process.argv.slice(2);

// Check for --yolo flag
const yoloMode = args.includes('--yolo');
if (yoloMode) {
  process.env.SHARK_SKIP_FIREWALLS = 'true';
  console.log(chalk.yellow('⚠️  YOLO mode enabled - firewalls bypassed'));
  // Remove --yolo from args
  const yoloIndex = args.indexOf('--yolo');
  args.splice(yoloIndex, 1);
}
```

**Update help text**:
```typescript
console.log(chalk.bold('Flags:'));
console.log(chalk.gray('  --yolo          Bypass all firewalls (YOLO mode)'));
console.log(chalk.gray('  --firewall-stats Show firewall statistics and exit'));
```

### WAVE 2: PARALLEL FIREWALL MESH

**Planning Brain Strategy**: V3_Planning_Brain_Context.md recommends "Firewall Mesh, Not Wall" approach. Parallel execution for performance, sequential creates bottlenecks.

**Architectural Decision**: Run all firewalls concurrently, first BLOCKING decision wins, WARNINGS collected.

#### **Step 2.1: Create FirewallMesh Class (Parallel Execution)**
**File**: `/home/leviathan/OPENCODE_WORKSPACE/shark-frankenstein/src/tools/firewall-mesh.ts`

**Performance Target**: <50ms overhead per tool call (benchmark required).

**Implementation**:
```typescript
/**
 * 🦈 SHARK CLI - Parallel Firewall Mesh
 * 
 * Runs all firewalls concurrently for performance.
 * First BLOCKING decision wins, WARNINGS collected.
 */
import { ToolCall } from '../brain/types';
import { Guardian, ModificationDecision } from '../guardian';
import { WorkflowBlocker } from '../workflow/blocker';
import { FirewallAudit } from './audit';

export interface FirewallCheck {
  name: string;
  check: (toolCall: ToolCall) => Promise<{
    blocked: boolean;
    reason?: string;
    warning?: string;
  }>;
  priority: number; // Lower = checked first
}

export interface FirewallResult {
  allowed: boolean;
  blockedBy?: string;
  reason?: string;
  warnings: string[];
  auditEntry: any;
}

export class FirewallMesh {
  private firewalls: FirewallCheck[] = [];
  private audit: FirewallAudit;

  constructor(
    guardian: Guardian,
    workflowBlocker: WorkflowBlocker | null,
    audit: FirewallAudit,
    skipFirewalls: boolean = false
  ) {
    this.audit = audit;

    if (!skipFirewalls) {
      // Guardian firewall (priority 1)
      this.firewalls.push({
        name: 'Guardian',
        priority: 1,
        check: async (toolCall: ToolCall) => {
          if (toolCall.name === 'write_file') {
            const filePath = toolCall.arguments.file_path as string;
            const decision = guardian.checkPermission(filePath, 'write');
            return {
              blocked: decision === ModificationDecision.DENY,
              reason: decision === ModificationDecision.DENY 
                ? 'Guardian denied write permission' 
                : undefined,
            };
          }
          return { blocked: false };
        },
      });

      // WorkflowBlocker firewall (priority 2)
      if (workflowBlocker) {
        this.firewalls.push({
          name: 'WorkflowBlocker',
          priority: 2,
          check: async (toolCall: ToolCall) => {
            if (toolCall.name === 'write_file') {
              const filePath = toolCall.arguments.file_path as string;
              const blockResult = workflowBlocker.blockWrite(filePath);
              return {
                blocked: blockResult.blocked,
                reason: blockResult.reason,
              };
            }
            return { blocked: false };
          },
        });
      }

      // Theatrical detection (priority 3 - warning only)
      this.firewalls.push({
        name: 'TheatricalDetector',
        priority: 3,
        check: async (toolCall: ToolCall) => {
          let warning: string | undefined;
          
          if (toolCall.name === 'run_command') {
            const command = toolCall.arguments.command as string;
            const theatricalPatterns = [
              /mock.*mode/i,
              /simulat/i,
              /stub.*test/i,
              /fake.*test/i,
              /TODO.*implement/i,
              /FIXME/i,
              /HACK/i,
              /XXX/i,
            ];
            
            const matches = theatricalPatterns
              .filter(pattern => pattern.test(command))
              .map(pattern => pattern.toString());
              
            if (matches.length > 0) {
              warning = `Theatrical patterns detected in command: ${matches.join(', ')}`;
            }
          }
          
          if (toolCall.name === 'write_file') {
            const content = toolCall.arguments.content as string;
            const theatricalPatterns = [
              /\/\/.*TODO/i,
              /\/\/.*FIXME/i,
              /\/\/.*HACK/i,
              /\/\/.*XXX/i,
              /mock.*mode/i,
              /simulat/i,
              /stub.*test/i,
              /fake.*test/i,
            ];
            
            const matches = theatricalPatterns
              .filter(pattern => pattern.test(content))
              .map(pattern => pattern.toString());
              
            if (matches.length > 0) {
              warning = `Theatrical patterns detected in file content: ${matches.join(', ')}`;
            }
          }
          
          return {
            blocked: false, // NEVER blocks for theatrical
            warning,
          };
        },
      });
    }

    // Sort by priority
    this.firewalls.sort((a, b) => a.priority - b.priority);
  }

  async checkToolCall(
    toolCall: ToolCall,
    workflowStep: string,
    bypassed: boolean = false
  ): Promise<FirewallResult> {
    if (bypassed) {
      return {
        allowed: true,
        warnings: [],
        auditEntry: {
          decision: 'BYPASS',
          reason: 'YOLO mode enabled',
          bypassed: true,
        },
      };
    }

    const warnings: string[] = [];
    
    // Run all firewalls in parallel
    const checks = await Promise.all(
      this.firewalls.map(async firewall => {
        try {
          return await firewall.check(toolCall);
        } catch (error) {
          // Firewall failure = warning, not block
          warnings.push(`Firewall ${firewall.name} failed: ${error}`);
          return { blocked: false };
        }
      })
    );

    // Find first blocking decision
    for (let i = 0; i < checks.length; i++) {
      const check = checks[i];
      if (check.blocked) {
        return {
          allowed: false,
          blockedBy: this.firewalls[i].name,
          reason: check.reason,
          warnings,
          auditEntry: {
            decision: 'BLOCK',
            reason: check.reason,
            blockedBy: this.firewalls[i].name,
            bypassed: false,
          },
        };
      }
      if (check.warning) {
        warnings.push(check.warning);
      }
    }

    // No blocks found
    return {
      allowed: true,
      warnings,
      auditEntry: {
        decision: 'ALLOW',
        reason: 'All firewalls passed',
        bypassed: false,
      },
    };
  }
}
```

#### **Step 2.2: Integrate FirewallMesh into ToolExecutor**
**File**: `/home/leviathan/OPENCODE_WORKSPACE/shark-frankenstein/src/tools/executor.ts`

**Update executeTool method**:
```typescript
async executeTool(toolCall: ToolCall): Promise<ToolResult> {
  this.log(`Executing tool: ${toolCall.name}`);

  // Get workflow step (placeholder - need actual integration)
  const workflowStep = 'UNKNOWN'; // TODO: Get from WorkflowMachine

  // Run through firewall mesh
  const meshResult = await this.firewallMesh.checkToolCall(
    toolCall,
    workflowStep,
    this.skipFirewalls
  );

  // Log to audit
  this.audit.logToolCall(
    toolCall,
    meshResult.auditEntry.decision,
    meshResult.auditEntry.reason || 'No reason provided',
    workflowStep,
    meshResult.auditEntry.bypassed || false
  );

  // Handle warnings
  if (meshResult.warnings.length > 0 && this.verbose) {
    meshResult.warnings.forEach(warning => {
      this.log(`⚠️  ${warning}`);
    });
  }

  // Handle block
  if (!meshResult.allowed) {
    return {
      toolCallId: toolCall.id,
      name: toolCall.name,
      success: false,
      result: `${meshResult.blockedBy} blocked: ${meshResult.reason}`,
      guardianBlocked: true,
      guardianReason: meshResult.reason,
    };
  }

  // Proceed with tool execution
  switch (toolCall.name) {
    case 'write_file':
      return this.executeWriteFile(toolCall);
    case 'read_file':
      return this.executeReadFile(toolCall);
    case 'run_command':
      return this.executeRunCommand(toolCall);
    case 'search':
      return this.executeSearch(toolCall);
    default:
      return {
        toolCallId: toolCall.id,
        name: toolCall.name,
        success: false,
        result: `Unknown tool: ${toolCall.name}`,
      };
  }
}
```

### WAVE 3: ENHANCED FIREWALLS (Future - Per Planning Brain Roadmap)

**Planning Brain Context**: These are Waves 2-5 from V3_Planning_Brain_Context.md implementation roadmap.

#### **Step 3.1: AutoDebug Integration (Wave 2 - Error Resilience)**
- **Planning Brain Priority**: P1 - Hook into command failures in `executeRunCommand()`
- **Target**: 60% auto-fix rate for common errors (47+ baked-in patterns)
- **Constraint**: Connect existing AutoDebug system, don't create new

#### **Step 3.2: Stagnation Detection (Wave 3 - Behavioral Guards)**
- **Planning Brain Priority**: P2 - Track repeated failures (same command/tool 3x+)
- **Implementation**: Escalation protocol to alert orchestrator
- **Constraint**: Force approach change after thresholds, not block

#### **Step 3.3: Secret Detection (Wave 5 - Security Hardening)**
- **Planning Brain Priority**: P2 - Scan file writes for hardcoded credentials
- **Critical Constraint**: **WARN ONLY** - suggest environment variables instead of blocking
- **Anti-slop Focus**: Never block flow for security warnings

#### **Step 3.4: State Integrity Protection (Wave 5 - Security)**
- **Planning Brain Priority**: P1 - Checksum verification on workflow state
- **Implementation**: Tamper detection + auto-recovery to PLAN step
- **Purpose**: Prevent catastrophic state corruption

---

## 🎯 SUCCESS CRITERIA

### Quantitative Targets
| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **Bypass Rate** | 0% | Audit log analysis for unauthorized state/command changes |
| **False Positive Rate** | <3% | User reports of blocked legitimate operations |
| **Performance Overhead** | <50ms/tool call | Benchmark with/without firewalls |
| **Audit Completeness** | 100% | Every tool call logged in constitutional trail |
| **Test Coverage** | >90% | Jest coverage on firewall modules |

### Qualitative Targets (From Planning Brain Analysis)
| Metric | Target | Assessment Method |
|--------|--------|-------------------|
| **Agent Flow** | Unimpeded creativity | Observe BUILD/PLAN step agent behavior (YOLO compatible) |
| **Theatrical Reduction** | >80% decrease | Code review pre/post implementation (Anti-slop focus) |
| **Workflow Compliance** | 100% step adherence | State machine transition analysis (Earth Density principle) |
| **User Trust** | Increased confidence | Feedback surveys, reduced intervention requests |
| **Constraint Compliance** | 100% honored | Verify YOLO, anti-slop, connect-don't-create principles |

---

## 🔧 TESTING STRATEGY

### Unit Tests
1. **FirewallAudit**: Logging, statistics, file I/O
2. **FirewallMesh**: Parallel execution, priority ordering, failure handling
3. **ToolExecutor Integration**: Bypass logic, audit integration, error handling

### Integration Tests
1. **Full ToolExecutor flow**: Guardian + WorkflowBlocker + Audit
2. **YOLO mode**: Verify bypass works correctly
3. **Performance**: Benchmark parallel vs sequential execution

### Manual Verification (Planning Brain Requirements)
1. **PLAN step enforcement**: Attempt src/ write during PLAN → should block (Earth Density)
2. **BUILD step allowance**: src/ write during BUILD → should allow (Workflow compliance)
3. **YOLO bypass**: `SHARK_SKIP_FIREWALLS=true` → should allow all (Constraint compliance)
4. **Audit trail**: Verify `.shark/firewall-audit.jsonl` created and populated (NEXT_STEPS requirement)
5. **Anti-slop**: Theatrical patterns → should WARN only, never block (Constraint compliance)
6. **Performance**: Tool call overhead <50ms (Planning Brain target)

---

## 📁 FILES TO CREATE/MODIFY

### New Files
1. `src/tools/audit.ts` - FirewallAudit class
2. `src/tools/firewall-mesh.ts` - Parallel firewall execution

### Modified Files
1. `src/brain/coordinator-base.ts` - Add WorkflowBlocker initialization
2. `src/tools/executor.ts` - Integrate audit and firewall mesh
3. `src/cli.ts` - Add `/firewall-stats` command and `--yolo` flag
4. `src/tools/index.ts` - Export new classes

### Configuration Updates
1. `package.json` - Add any new dependencies
2. `tsconfig.json` - Ensure TypeScript compatibility
3. `.env.example` - Document `SHARK_SKIP_FIREWALLS` variable

---

## 🚀 DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] All TypeScript compiles without errors
- [ ] Unit tests pass (>90% coverage)
- [ ] Integration tests pass
- [ ] Performance benchmarks meet targets
- [ ] Documentation updated

### Deployment
- [ ] Merge to main branch
- [ ] Update version in package.json
- [ ] Create release notes
- [ ] Notify users of YOLO mode availability

### Post-Deployment
- [ ] Monitor audit logs for anomalies
- [ ] Collect false positive reports
- [ ] Track performance metrics
- [ ] Gather user feedback

---

## ⚠️ RISK MITIGATION

### Critical Risks
1. **Performance degradation**: Parallel execution + benchmarking
2. **False positives**: Warning-only theatrical detection, user feedback loop
3. **YOLO mode abuse**: Audit trail persists even when bypassed
4. **Firewall failures**: Graceful degradation, continue with warnings

### Fallback Strategies
1. **Firewall failure**: Log error, continue execution with warning
2. **Audit failure**: Buffer in memory, retry later
3. **Performance issues**: Feature flag to disable specific firewalls
4. **User complaints**: Quick toggle via environment variable

---

## 📚 REFERENCES

### Source Files
- `coordinator-base.ts` - Current bypass vulnerability location
- `executor.ts` - Tool execution chokepoint
- `workflow/blocker.ts` - Workflow enforcement logic
- `guardian/index.ts` - File protection system

### Documentation (Source of Truth)
- **Planning Brain Handover Package** (`/home/leviathan/OPENCODE_WORKSPACE/Kraken Brain/Planning Brain Handover Package/`) - Primary context source
- **V4_CONTEXT_LIBRARY.md** - Evidence-based analysis proving WorkflowBlocker IS connected
- **NEXT_STEPS_PROMPT.md** - Priority implementation waves (Wave 1 = this fix)
- **V3_Planning_Brain_Context.md** - Strategic roadmap and architectural decisions
- **Nemotron 3 analysis** - Original deep code analysis identifying bypass vulnerability

### Constraints to Honor
- **YOLO mode by default**: All enhancements include emergency bypass
- **Anti-slop focus**: Theatrical detection WARN only, never block flow
- **Connect, don't create**: Integrate existing systems
- **Only block `rm -rf /` exact**: Preserve legitimate dev workflows
- **Performance optimized**: Parallel execution, <50ms overhead

---

**BUILD PHASE READY** - This workflow provides complete implementation guidance for fixing the bypass vulnerability and enhancing the ToolExecutor firewall system while maintaining YOLO compatibility and anti-slop focus.