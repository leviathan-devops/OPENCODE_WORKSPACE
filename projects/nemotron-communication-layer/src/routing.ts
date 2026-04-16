import { Message, AgentRegistry, CompactedMessage, RouteResult } from './types';

export class AgentRouter {
  private registry: AgentRegistry = {};
  
  registerAgent(agentId: string, type: AgentRegistry[string]['type']): void {
    this.registry[agentId] = {
      type,
      status: 'idle',
      lastSeen: new Date(),
    };
  }
  
  updateAgentStatus(agentId: string, status: 'active' | 'idle' | 'blocked', task?: string): void {
    if (this.registry[agentId]) {
      this.registry[agentId].status = status;
      this.registry[agentId].lastSeen = new Date();
      if (task) this.registry[agentId].currentTask = task;
    }
  }
  
  route(message: Message, compacted: CompactedMessage): RouteResult {
    const recipients = Array.isArray(message.to) ? message.to : [message.to];
    
    // Validate recipients exist
    const validRecipients = recipients.filter(r => 
      r === 'orchestrator' || this.registry[r]
    );
    
    if (validRecipients.length === 0) {
      return {
        success: false,
        error: 'No valid recipients',
        delivered: [],
      };
    }
    
    // Deliver to each recipient
    const deliveries = validRecipients.map(recipient => ({
      recipient,
      content: compacted.content,
      tokens: compacted.actualTokens,
      delivered: true,
    }));
    
    return {
      success: true,
      delivered: deliveries,
    };
  }
  
  broadcast(message: Message, compacted: CompactedMessage): RouteResult {
    const activeAgents = Object.keys(this.registry).filter(
      id => this.registry[id].status === 'active'
    );
    
    return this.route(
      { ...message, to: activeAgents },
      compacted
    );
  }
  
  getAgentStatus(agentId: string): AgentRegistry[string] | null {
    return this.registry[agentId] || null;
  }
  
  getAllAgents(): AgentRegistry {
    return { ...this.registry };
  }
  
  getActiveAgents(): string[] {
    return Object.keys(this.registry).filter(
      id => this.registry[id].status === 'active'
    );
  }
}
