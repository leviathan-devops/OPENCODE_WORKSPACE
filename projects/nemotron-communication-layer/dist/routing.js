export class AgentRouter {
    registry = {};
    registerAgent(agentId, type) {
        this.registry[agentId] = {
            type,
            status: 'idle',
            lastSeen: new Date(),
        };
    }
    updateAgentStatus(agentId, status, task) {
        if (this.registry[agentId]) {
            this.registry[agentId].status = status;
            this.registry[agentId].lastSeen = new Date();
            if (task)
                this.registry[agentId].currentTask = task;
        }
    }
    route(message, compacted) {
        const recipients = Array.isArray(message.to) ? message.to : [message.to];
        // Validate recipients exist
        const validRecipients = recipients.filter(r => r === 'orchestrator' || this.registry[r]);
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
    broadcast(message, compacted) {
        const activeAgents = Object.keys(this.registry).filter(id => this.registry[id].status === 'active');
        return this.route({ ...message, to: activeAgents }, compacted);
    }
    getAgentStatus(agentId) {
        return this.registry[agentId] || null;
    }
    getAllAgents() {
        return { ...this.registry };
    }
    getActiveAgents() {
        return Object.keys(this.registry).filter(id => this.registry[id].status === 'active');
    }
}
