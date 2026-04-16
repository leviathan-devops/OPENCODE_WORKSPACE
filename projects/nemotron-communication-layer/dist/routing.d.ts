import { Message, AgentRegistry, CompactedMessage, RouteResult } from './types';
export declare class AgentRouter {
    private registry;
    registerAgent(agentId: string, type: AgentRegistry[string]['type']): void;
    updateAgentStatus(agentId: string, status: 'active' | 'idle' | 'blocked', task?: string): void;
    route(message: Message, compacted: CompactedMessage): RouteResult;
    broadcast(message: Message, compacted: CompactedMessage): RouteResult;
    getAgentStatus(agentId: string): AgentRegistry[string] | null;
    getAllAgents(): AgentRegistry;
    getActiveAgents(): string[];
}
