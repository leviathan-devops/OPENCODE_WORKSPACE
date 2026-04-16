import { MessageClass, Priority } from './types';
export class MessageClassifier {
    classifyMessage(message) {
        const content = message.content.toLowerCase();
        if (this.isSimpleAck(content))
            return MessageClass.SIMPLE_ACK;
        if (this.isStatusUpdate(content))
            return MessageClass.STATUS_UPDATE;
        if (this.hasDependencyRequest(content))
            return MessageClass.DEPENDENCY_UPDATE;
        if (this.isQuestion(content))
            return MessageClass.QUESTION;
        if (this.isProgressReport(content))
            return MessageClass.PROGRESS_REPORT;
        if (this.isBuildPrompt(content))
            return MessageClass.BUILD_PROMPT;
        if (this.isArchitectureDecision(content))
            return MessageClass.ARCHITECTURE_DECISION;
        if (this.hasCodeBlocks(message.content))
            return MessageClass.CODE_REVIEW;
        if (this.isComplexIntegration(content))
            return MessageClass.INTEGRATION_COMPLEX;
        if (this.isDebuggingSession(content))
            return MessageClass.DEBUGGING_SESSION;
        if (this.isEscalation(content))
            return MessageClass.ESCALATION;
        return MessageClass.PROGRESS_REPORT;
    }
    calculateComplexity(message) {
        return {
            tokenCount: this.estimateTokens(message.content),
            messagePriority: message.priority,
            recipientCount: Array.isArray(message.to) ? message.to.length : 1,
            codeBlocks: this.countCodeBlocks(message.content),
            dependencies: this.extractDependencies(message.content),
            urgency: this.calculateUrgency(message),
        };
    }
    determineTokenTarget(message) {
        const baseClass = this.classifyMessage(message);
        const baseTokens = this.classToTokens(baseClass);
        // Override: Explicit request takes precedence
        if (message.overrideRequest) {
            return Math.min(message.overrideRequest.requestedTokens, 72000);
        }
        // Override: CRITICAL priority doubles token limit
        if (message.priority === Priority.CRITICAL) {
            return Math.min(baseTokens * 2, 8000);
        }
        // Override: Orchestrator requesting "more context"
        if (message.from === "orchestrator" && this.isMoreContextRequest(message.content)) {
            return 24000;
        }
        // Complexity adjustment
        const complexity = this.calculateComplexity(message);
        if (complexity.urgency > 8)
            return Math.min(baseTokens * 1.5, 8000);
        return baseTokens;
    }
    estimateTokens(content) {
        return Math.ceil(content.length / 4);
    }
    classToTokens(messageClass) {
        switch (messageClass) {
            case MessageClass.SIMPLE_ACK:
            case MessageClass.STATUS_UPDATE:
                return 2000;
            case MessageClass.PROGRESS_REPORT:
            case MessageClass.DEPENDENCY_UPDATE:
            case MessageClass.QUESTION:
                return 4000;
            case MessageClass.BUILD_PROMPT:
            case MessageClass.ARCHITECTURE_DECISION:
            case MessageClass.CODE_REVIEW:
                return 6000;
            case MessageClass.INTEGRATION_COMPLEX:
            case MessageClass.DEBUGGING_SESSION:
            case MessageClass.ESCALATION:
                return 8000;
            default:
                return 4000;
        }
    }
    isSimpleAck(content) {
        return /^(understood|done|working|ack|roger|got it|on it|ok|yes|no|completed)/i.test(content.trim());
    }
    isStatusUpdate(content) {
        return /^(status|progress):?\s+\d+%/i.test(content) || content.length < 100;
    }
    hasDependencyRequest(content) {
        return /need|blocked by|waiting for|depends on|requires @/i.test(content);
    }
    isQuestion(content) {
        return content.includes("?") && content.length < 500;
    }
    isProgressReport(content) {
        return /##\s*(progress|completed|blockers|next steps)/i.test(content);
    }
    isBuildPrompt(content) {
        return /build prompt|task:|mission:|objective:|requirements:/i.test(content);
    }
    isArchitectureDecision(content) {
        return /architecture|design|decision|rationale|approach:/i.test(content);
    }
    hasCodeBlocks(content) {
        return /```[\s\S]{100,}```/.test(content);
    }
    isComplexIntegration(content) {
        return /integration.*module|multi-module|cross-system|connecting/i.test(content);
    }
    isDebuggingSession(content) {
        return /error|trace|debug|fix attempt|stack trace|exception/i.test(content);
    }
    isEscalation(content) {
        return /\[escalation\]|\[blocking\]|critical issue|stuck|cannot proceed/i.test(content);
    }
    isMoreContextRequest(content) {
        return /more context|full context|deep dive|complete details|everything about/i.test(content);
    }
    countCodeBlocks(content) {
        const matches = content.match(/```/g);
        return matches ? matches.length / 2 : 0;
    }
    extractDependencies(content) {
        const mentions = content.match(/@[\w-]+/g) || [];
        return mentions.map(m => m.substring(1));
    }
    calculateUrgency(message) {
        let urgency = 5;
        if (message.priority === Priority.CRITICAL)
            urgency += 4;
        if (message.priority === Priority.HIGH)
            urgency += 2;
        if (this.isEscalation(message.content))
            urgency += 3;
        return Math.min(urgency, 10);
    }
}
