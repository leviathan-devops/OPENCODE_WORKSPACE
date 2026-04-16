import { EventEmitter } from 'events';
import { Message, CompactedMessage, TokenMetrics } from './types';
import { MessageClassifier } from './message-classifier';
import { CompressionPipeline } from './compression';
import { AgentRouter } from './routing';

export interface NemotronEvents {
  'agent-output': { agentId: string; message: Message; compacted: CompactedMessage };
  'orchestrator-request': { size: number; query: string };
  'context-retrieved': { tokens: number; contextCount: number };
  'compression-complete': { originalTokens: number; compressedTokens: number; ratio: number };
  'override-triggered': { requestedTokens: number; reason: string };
  'routing-complete': { recipients: string[]; success: boolean };
  'context-evicted': { messageId: string; tokens: number };
}

export class NemotronBridge extends EventEmitter {
  private classifier = new MessageClassifier();
  private compression = new CompressionPipeline();
  private router = new AgentRouter();
  
  // Full context storage (1M token capacity)
  private contextStore: Map<string, { content: string; timestamp: Date; from: string }> = new Map();
  private maxContextTokens = 1000000;
  private currentContextTokens = 0;
  
  // Metrics tracking
  private metrics: TokenMetrics = {
    timestamp: new Date(),
    totalIngested: 0,
    totalCompressed: 0,
    compressionRatio: 1,
    avgMessageSize: 0,
    orchestratorTokens: 0,
    messagesByClass: { '2k': 0, '4k': 0, '6k': 0, '8k': 0 },
    overrideRequests: 0,
  };
  private messageCount = 0;
  
  processMessage(message: Message): CompactedMessage {
    this.storeFullContext(message);
    
    const compacted = this.compression.compress(message);
    
    this.updateMetrics(compacted);
    
    this.emit('compression-complete', {
      originalTokens: compacted.metadata.originalTokens,
      compressedTokens: compacted.actualTokens,
      ratio: compacted.metadata.compressionRatio,
    });
    
    const routeResult = this.router.route(message, compacted);
    
    if (!routeResult.success) {
      console.error(`Routing failed: ${routeResult.error}`);
    }
    
    this.emit('routing-complete', {
      recipients: Array.isArray(message.to) ? message.to : [message.to],
      success: routeResult.success,
    });
    
    this.emit('agent-output', {
      agentId: message.from,
      message,
      compacted,
    });
    
    return compacted;
  }
  
  handleMoreContextRequest(request: Message): string {
    this.metrics.overrideRequests++;
    
    const query = request.content.toLowerCase();
    
    this.emit('orchestrator-request', {
      size: 72000,
      query: request.content,
    });
    
    if (request.overrideRequest) {
      this.emit('override-triggered', {
        requestedTokens: request.overrideRequest.requestedTokens,
        reason: request.overrideRequest.reason,
      });
    }
    
    const relevantContexts: string[] = [];
    
    this.contextStore.forEach((data, id) => {
      if (this.isRelevant(data.content, query)) {
        relevantContexts.push(`[${id}] (${data.from}):\n${data.content}`);
      }
    });
    
    const maxTokens = 72000;
    let result = '';
    
    for (const context of relevantContexts) {
      const tokens = this.classifier.estimateTokens(context);
      if (this.classifier.estimateTokens(result) + tokens > maxTokens) break;
      result += context + '\n\n---\n\n';
    }
    
    this.emit('context-retrieved', {
      tokens: this.classifier.estimateTokens(result),
      contextCount: relevantContexts.length,
    });
    
    return result || 'No relevant context found in full store.';
  }
  
  registerAgent(agentId: string, type: 'hephaestus' | 'oracle' | 'momus' | 'explore' | 'librarian' | 'orchestrator'): void {
    this.router.registerAgent(agentId, type);
  }
  
  getMetrics(): TokenMetrics {
    return { ...this.metrics };
  }
  
  getFullContextTokens(): { current: number; max: number; utilization: number } {
    return {
      current: this.currentContextTokens,
      max: this.maxContextTokens,
      utilization: this.currentContextTokens / this.maxContextTokens,
    };
  }
  
  private storeFullContext(message: Message): void {
    const tokens = this.classifier.estimateTokens(message.content);
    
    while (this.currentContextTokens + tokens > this.maxContextTokens && this.contextStore.size > 0) {
      const oldestKey = this.contextStore.keys().next().value;
      if (oldestKey) {
        const oldData = this.contextStore.get(oldestKey);
        if (oldData) {
          const oldTokens = this.classifier.estimateTokens(oldData.content);
          this.contextStore.delete(oldestKey);
          this.currentContextTokens -= oldTokens;
          this.emit('context-evicted', { messageId: oldestKey, tokens: oldTokens });
        }
      }
    }
    
    this.contextStore.set(message.id, {
      content: message.content,
      timestamp: message.timestamp,
      from: message.from,
    });
    this.currentContextTokens += tokens;
  }
  
  private isRelevant(content: string, query: string): boolean {
    const keywords = query
      .split(/\s+/)
      .filter(w => w.length > 3 && !['about', 'context', 'more', 'full', 'need'].includes(w));
    
    if (keywords.length === 0) return true;
    
    return keywords.some(keyword => 
      content.toLowerCase().includes(keyword)
    );
  }
  
  private updateMetrics(compacted: CompactedMessage): void {
    this.messageCount++;
    this.metrics.totalIngested += compacted.metadata.originalTokens;
    this.metrics.totalCompressed += compacted.actualTokens;
    this.metrics.compressionRatio = this.metrics.totalIngested / Math.max(this.metrics.totalCompressed, 1);
    this.metrics.avgMessageSize = this.metrics.totalCompressed / this.messageCount;
    
    // Track by class
    const classKey = compacted.metadata.classification.replace('k', '') as '2' | '4' | '6' | '8';
    const key = `${classKey}k` as keyof typeof this.metrics.messagesByClass;
    this.metrics.messagesByClass[key]++;
    
    this.metrics.timestamp = new Date();
  }
}
