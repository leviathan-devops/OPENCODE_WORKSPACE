import { EventEmitter } from 'events';
import { NemotronBridge, NemotronEvents } from './nemotron-bridge';
import { Message, CompactedMessage, TokenMetrics, AgentRegistry } from './types';

export interface ServiceStatus {
  running: boolean;
  agentsRegistered: number;
  contextUtilization: number;
  totalMessagesProcessed: number;
  uptime: number;
}

export interface AgentOutputHook {
  agentId: string;
  callback: (compacted: CompactedMessage) => void;
}

export class NemotronService extends EventEmitter {
  private static instance: NemotronService;
  private bridge: NemotronBridge;
  private running: boolean = false;
  private startTime: Date | null = null;
  private outputHooks: Map<string, AgentOutputHook[]> = new Map();
  private messageCount: number = 0;

  private constructor() {
    super();
    this.bridge = new NemotronBridge();
    this.setupBridgeListeners();
  }

  static getInstance(): NemotronService {
    if (!NemotronService.instance) {
      NemotronService.instance = new NemotronService();
    }
    return NemotronService.instance;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.startTime = new Date();
    this.emit('service-started', { timestamp: this.startTime });
  }

  stop(): void {
    this.running = false;
    this.startTime = null;
    this.emit('service-stopped', { timestamp: new Date() });
  }

  getStatus(): ServiceStatus {
    const ctx = this.bridge.getFullContextTokens();
    return {
      running: this.running,
      agentsRegistered: this.outputHooks.size,
      contextUtilization: ctx.utilization,
      totalMessagesProcessed: this.messageCount,
      uptime: this.running && this.startTime 
        ? Date.now() - this.startTime.getTime() 
        : 0,
    };
  }

  registerAgent(
    agentId: string, 
    type: 'hephaestus' | 'oracle' | 'momus' | 'explore' | 'librarian' | 'orchestrator',
    onOutput?: (compacted: CompactedMessage) => void
  ): void {
    this.bridge.registerAgent(agentId, type);
    
    if (onOutput) {
      if (!this.outputHooks.has(agentId)) {
        this.outputHooks.set(agentId, []);
      }
      this.outputHooks.get(agentId)!.push({ agentId, callback: onOutput });
    }
    
    this.emit('agent-registered', { agentId, type });
  }

  ingestAgentOutput(agentId: string, content: string, to: string | string[] = 'orchestrator'): CompactedMessage {
    const message: Message = {
      id: `${agentId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      from: agentId,
      to,
      content,
      timestamp: new Date(),
      priority: 'MEDIUM' as any,
    };
    
    return this.processMessage(message);
  }

  processMessage(message: Message): CompactedMessage {
    const compacted = this.bridge.processMessage(message);
    this.messageCount++;
    
    const hooks = this.outputHooks.get(message.from);
    if (hooks) {
      hooks.forEach(hook => hook.callback(compacted));
    }
    
    return compacted;
  }

  requestContext(query: string, size: number = 72000): string {
    const request: Message = {
      id: `context-request-${Date.now()}`,
      from: 'orchestrator',
      to: 'nemotron',
      content: query,
      timestamp: new Date(),
      priority: 'HIGH' as any,
      overrideRequest: { requestedTokens: size, reason: 'Manual context request' },
    };
    
    return this.bridge.handleMoreContextRequest(request);
  }

  getMetrics(): TokenMetrics {
    return this.bridge.getMetrics();
  }

  getContextStatus(): { current: number; max: number; utilization: number } {
    return this.bridge.getFullContextTokens();
  }

  private setupBridgeListeners(): void {
    this.bridge.on('agent-output', (data: any) => {
      this.emit('agent-output', data);
    });
    
    this.bridge.on('orchestrator-request', (data: any) => {
      this.emit('orchestrator-request', data);
    });
    
    this.bridge.on('context-retrieved', (data: any) => {
      this.emit('context-retrieved', data);
    });
    
    this.bridge.on('compression-complete', (data: any) => {
      this.emit('compression-complete', data);
    });
    
    this.bridge.on('override-triggered', (data: any) => {
      this.emit('override-triggered', data);
    });
    
    this.bridge.on('routing-complete', (data: any) => {
      this.emit('routing-complete', data);
    });
    
    this.bridge.on('context-evicted', (data: any) => {
      this.emit('context-evicted', data);
    });
  }
}

export function getNemotronService(): NemotronService {
  return NemotronService.getInstance();
}

export function startNemotronService(): NemotronService {
  const service = NemotronService.getInstance();
  service.start();
  return service;
}
