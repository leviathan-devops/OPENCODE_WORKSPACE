import { EventEmitter } from 'events';
import { Message, CompactedMessage, TokenMetrics } from './types';
export interface NemotronEvents {
    'agent-output': {
        agentId: string;
        message: Message;
        compacted: CompactedMessage;
    };
    'orchestrator-request': {
        size: number;
        query: string;
    };
    'context-retrieved': {
        tokens: number;
        contextCount: number;
    };
    'compression-complete': {
        originalTokens: number;
        compressedTokens: number;
        ratio: number;
    };
    'override-triggered': {
        requestedTokens: number;
        reason: string;
    };
    'routing-complete': {
        recipients: string[];
        success: boolean;
    };
    'context-evicted': {
        messageId: string;
        tokens: number;
    };
}
export declare class NemotronBridge extends EventEmitter {
    private classifier;
    private compression;
    private router;
    private contextStore;
    private maxContextTokens;
    private currentContextTokens;
    private metrics;
    private messageCount;
    processMessage(message: Message): CompactedMessage;
    handleMoreContextRequest(request: Message): string;
    registerAgent(agentId: string, type: 'hephaestus' | 'oracle' | 'momus' | 'explore' | 'librarian' | 'orchestrator'): void;
    getMetrics(): TokenMetrics;
    getFullContextTokens(): {
        current: number;
        max: number;
        utilization: number;
    };
    private storeFullContext;
    private isRelevant;
    private updateMetrics;
}
