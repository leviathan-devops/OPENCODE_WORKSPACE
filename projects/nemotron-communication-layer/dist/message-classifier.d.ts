import { Message, MessageClass, ComplexityScore } from './types';
export declare class MessageClassifier {
    classifyMessage(message: Message): MessageClass;
    calculateComplexity(message: Message): ComplexityScore;
    determineTokenTarget(message: Message): number;
    estimateTokens(content: string): number;
    private classToTokens;
    private isSimpleAck;
    private isStatusUpdate;
    private hasDependencyRequest;
    private isQuestion;
    private isProgressReport;
    private isBuildPrompt;
    private isArchitectureDecision;
    private hasCodeBlocks;
    private isComplexIntegration;
    private isDebuggingSession;
    private isEscalation;
    private isMoreContextRequest;
    private countCodeBlocks;
    private extractDependencies;
    private calculateUrgency;
}
