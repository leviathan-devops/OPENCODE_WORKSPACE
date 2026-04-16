export declare enum MessageClass {
    SIMPLE_ACK = "2k",// "Understood", "Working on it", "Done"
    STATUS_UPDATE = "2k",// "Module 75% complete, no blockers"
    PROGRESS_REPORT = "4k",// Detailed progress with metrics
    DEPENDENCY_UPDATE = "4k",// "Need @engineer-2's API by tomorrow"
    QUESTION = "4k",// Clarification requests
    BUILD_PROMPT = "6k",// Full task assignment with context
    ARCHITECTURE_DECISION = "6k",// Design choices, rationale
    CODE_REVIEW = "6k",// Review feedback with examples
    INTEGRATION_COMPLEX = "8k",// Multi-module integration details
    DEBUGGING_SESSION = "8k",// Error traces, fix attempts
    ESCALATION = "8k"
}
export declare enum Priority {
    CRITICAL = "CRITICAL",
    HIGH = "HIGH",
    MEDIUM = "MEDIUM",
    LOW = "LOW"
}
export interface Message {
    id: string;
    from: string;
    to: string | string[];
    content: string;
    timestamp: Date;
    priority: Priority;
    overrideRequest?: {
        requestedTokens: number;
        reason: string;
    };
}
export interface ComplexityScore {
    tokenCount: number;
    messagePriority: Priority;
    recipientCount: number;
    codeBlocks: number;
    dependencies: string[];
    urgency: number;
}
export interface CompactedMessage {
    originalId: string;
    targetTokens: number;
    actualTokens: number;
    content: string;
    metadata: {
        compressionRatio: number;
        originalTokens: number;
        priority: Priority;
        classification: MessageClass;
        usedFullBudget: boolean;
    };
}
export interface AgentRegistry {
    [agentId: string]: {
        type: "hephaestus" | "oracle" | "momus" | "explore" | "librarian" | "orchestrator";
        status: "active" | "idle" | "blocked";
        lastSeen: Date;
        currentTask?: string;
    };
}
export interface TokenMetrics {
    timestamp: Date;
    totalIngested: number;
    totalCompressed: number;
    compressionRatio: number;
    avgMessageSize: number;
    orchestratorTokens: number;
    messagesByClass: {
        '2k': number;
        '4k': number;
        '6k': number;
        '8k': number;
    };
    overrideRequests: number;
}
export interface RouteResult {
    success: boolean;
    error?: string;
    delivered: Array<{
        recipient: string;
        content: string;
        tokens: number;
        delivered: boolean;
    }>;
}
