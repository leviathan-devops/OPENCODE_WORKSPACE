import { EventEmitter } from 'events';
import { NemotronBridge } from './nemotron-bridge';
export class NemotronService extends EventEmitter {
    static instance;
    bridge;
    running = false;
    startTime = null;
    outputHooks = new Map();
    messageCount = 0;
    constructor() {
        super();
        this.bridge = new NemotronBridge();
        this.setupBridgeListeners();
    }
    static getInstance() {
        if (!NemotronService.instance) {
            NemotronService.instance = new NemotronService();
        }
        return NemotronService.instance;
    }
    start() {
        if (this.running)
            return;
        this.running = true;
        this.startTime = new Date();
        this.emit('service-started', { timestamp: this.startTime });
    }
    stop() {
        this.running = false;
        this.startTime = null;
        this.emit('service-stopped', { timestamp: new Date() });
    }
    getStatus() {
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
    registerAgent(agentId, type, onOutput) {
        this.bridge.registerAgent(agentId, type);
        if (onOutput) {
            if (!this.outputHooks.has(agentId)) {
                this.outputHooks.set(agentId, []);
            }
            this.outputHooks.get(agentId).push({ agentId, callback: onOutput });
        }
        this.emit('agent-registered', { agentId, type });
    }
    ingestAgentOutput(agentId, content, to = 'orchestrator') {
        const message = {
            id: `${agentId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            from: agentId,
            to,
            content,
            timestamp: new Date(),
            priority: 'MEDIUM',
        };
        return this.processMessage(message);
    }
    processMessage(message) {
        const compacted = this.bridge.processMessage(message);
        this.messageCount++;
        const hooks = this.outputHooks.get(message.from);
        if (hooks) {
            hooks.forEach(hook => hook.callback(compacted));
        }
        return compacted;
    }
    requestContext(query, size = 72000) {
        const request = {
            id: `context-request-${Date.now()}`,
            from: 'orchestrator',
            to: 'nemotron',
            content: query,
            timestamp: new Date(),
            priority: 'HIGH',
            overrideRequest: { requestedTokens: size, reason: 'Manual context request' },
        };
        return this.bridge.handleMoreContextRequest(request);
    }
    getMetrics() {
        return this.bridge.getMetrics();
    }
    getContextStatus() {
        return this.bridge.getFullContextTokens();
    }
    setupBridgeListeners() {
        this.bridge.on('agent-output', (data) => {
            this.emit('agent-output', data);
        });
        this.bridge.on('orchestrator-request', (data) => {
            this.emit('orchestrator-request', data);
        });
        this.bridge.on('context-retrieved', (data) => {
            this.emit('context-retrieved', data);
        });
        this.bridge.on('compression-complete', (data) => {
            this.emit('compression-complete', data);
        });
        this.bridge.on('override-triggered', (data) => {
            this.emit('override-triggered', data);
        });
        this.bridge.on('routing-complete', (data) => {
            this.emit('routing-complete', data);
        });
        this.bridge.on('context-evicted', (data) => {
            this.emit('context-evicted', data);
        });
    }
}
export function getNemotronService() {
    return NemotronService.getInstance();
}
export function startNemotronService() {
    const service = NemotronService.getInstance();
    service.start();
    return service;
}
