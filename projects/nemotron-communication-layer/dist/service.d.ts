import { EventEmitter } from 'events';
import { Message, CompactedMessage, TokenMetrics } from './types';
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
export declare class NemotronService extends EventEmitter {
    private static instance;
    private bridge;
    private running;
    private startTime;
    private outputHooks;
    private messageCount;
    private constructor();
    static getInstance(): NemotronService;
    start(): void;
    stop(): void;
    getStatus(): ServiceStatus;
    registerAgent(agentId: string, type: 'hephaestus' | 'oracle' | 'momus' | 'explore' | 'librarian' | 'orchestrator', onOutput?: (compacted: CompactedMessage) => void): void;
    ingestAgentOutput(agentId: string, content: string, to?: string | string[]): CompactedMessage;
    processMessage(message: Message): CompactedMessage;
    requestContext(query: string, size?: number): string;
    getMetrics(): TokenMetrics;
    getContextStatus(): {
        current: number;
        max: number;
        utilization: number;
    };
    private setupBridgeListeners;
}
export declare function getNemotronService(): NemotronService;
export declare function startNemotronService(): NemotronService;
