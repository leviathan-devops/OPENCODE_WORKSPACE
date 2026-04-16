/**
 * Planning Brain - V2.0
 * 
 * Owns: planning-state, context-bridge
 * 
 * Responsibilities:
 * - T2 Master context loading
 * - T1 dynamic generation from SPEC.md
 * - Task decomposition for cluster assignment
 * - Domain designation
 */

export class PlanningBrain {
  private initialized = false;
  private t2MasterLoaded = false;
  private t1Generated = false;
  private tasksDecomposed = false;
  private domainsDesignated = false;
  
  initialize(): void {
    this.initialized = true;
    console.log('[PlanningBrain] Initialized');
  }
  
  isInitialized(): boolean {
    return this.initialized;
  }
  
  // =========================================================================
  // T2 MASTER CONTEXT
  // =========================================================================
  
  async loadT2Master(): Promise<void> {
    // In real implementation, load T2 from kraken-context library
    console.log('[PlanningBrain] Loading T2 Master context...');
    
    // Simulate T2 loading
    await this.delay(100);
    
    this.t2MasterLoaded = true;
    console.log('[PlanningBrain] T2 Master loaded');
  }
  
  isT2MasterLoaded(): boolean {
    return this.t2MasterLoaded;
  }
  
  // =========================================================================
  // T1 DYNAMIC GENERATION
  // =========================================================================
  
  async generateT1(specPath: string = 'SPEC.md'): Promise<{
    tasks: TaskSpec[];
    context: Record<string, unknown>;
  }> {
    if (!this.t2MasterLoaded) {
      throw new Error('T2 Master must be loaded before T1 generation');
    }
    
    console.log('[PlanningBrain] Generating T1 from SPEC.md...');
    
    // In real implementation:
    // 1. Read SPEC.md
    // 2. Analyze requirements
    // 3. Generate task structure
    // 4. Create context bridge
    
    const t1 = {
      tasks: [] as TaskSpec[],
      context: {
        specPath,
        generatedAt: new Date().toISOString(),
        phases: ['PLAN', 'BUILD', 'TEST', 'VERIFY', 'AUDIT', 'DELIVERY'],
      },
    };
    
    this.t1Generated = true;
    console.log('[PlanningBrain] T1 generated');
    
    return t1;
  }
  
  isT1Generated(): boolean {
    return this.t1Generated;
  }
  
  // =========================================================================
  // TASK DECOMPOSITION
  // =========================================================================
  
  async decomposeTasks(t1: { tasks: TaskSpec[] }): Promise<TaskSpec[]> {
    console.log('[PlanningBrain] Decomposing tasks for cluster assignment...');
    
    const decomposed = t1.tasks.map(task => ({
      ...task,
      // V2.0: Output declarations are REQUIRED
      outputs: task.outputs || [],
      cluster: this.designateCluster(task.type),
    }));
    
    this.tasksDecomposed = true;
    console.log('[PlanningBrain] Tasks decomposed');
    
    return decomposed;
  }
  
  isTasksDecomposed(): boolean {
    return this.tasksDecomposed;
  }
  
  // =========================================================================
  // DOMAIN DESIGNATION
  // =========================================================================
  
  /**
   * Designate cluster based on task type
   * V2.0: Mechanical - no guesswork
   */
  designateCluster(taskType: string): 'alpha' | 'beta' | 'gamma' {
    const designations: Record<string, 'alpha' | 'beta' | 'gamma'> = {
      'build': 'alpha',
      'feature': 'alpha',
      'implement': 'alpha',
      'from-scratch': 'alpha',
      
      'debug': 'beta',
      'fix': 'beta',
      'refactor': 'beta',
      'patch': 'beta',
      'analyze': 'beta',
      
      'test': 'gamma',
      'verify': 'gamma',
      'audit': 'gamma',
      'integration': 'gamma',
    };
    
    const cluster = designations[taskType.toLowerCase()] || 'alpha';
    console.log(`[PlanningBrain] Task type "${taskType}" → Cluster ${cluster}`);
    
    return cluster;
  }
  
  isDomainsDesignated(): boolean {
    return this.domainsDesignated;
  }
  
  // =========================================================================
  // WORKFLOW
  // =========================================================================
  
  async doPlanning(): Promise<{
    t2Loaded: boolean;
    t1Generated: boolean;
    tasksDecomposed: boolean;
    domainsDesignated: boolean;
  }> {
    await this.loadT2Master();
    const t1 = await this.generateT1();
    await this.decomposeTasks(t1);
    
    this.domainsDesignated = true;
    
    return {
      t2Loaded: this.t2MasterLoaded,
      t1Generated: this.t1Generated,
      tasksDecomposed: this.tasksDecomposed,
      domainsDesignated: this.domainsDesignated,
    };
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// SINGLETON FACTORY
// ============================================================================

let planningBrainInstance: PlanningBrain | null = null;

export function createPlanningBrain(): PlanningBrain {
  if (!planningBrainInstance) {
    planningBrainInstance = new PlanningBrain();
  }
  return planningBrainInstance;
}

export function getPlanningBrain(): PlanningBrain {
  if (!planningBrainInstance) {
    planningBrainInstance = new PlanningBrain();
  }
  return planningBrainInstance;
}

// ============================================================================
// TASK SPEC (V2.0)
// ============================================================================

export interface TaskSpec {
  taskId: string;
  type: string;
  description: string;
  cluster: 'alpha' | 'beta' | 'gamma';
  outputs: OutputDeclaration[];
  dependencies?: string[];
}

interface OutputDeclaration {
  containerPath: string;
  hostPath: string;
  type: 'file' | 'directory';
  required: boolean;
}
