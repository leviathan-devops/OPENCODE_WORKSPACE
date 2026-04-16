/**
 * Container Types
 */
export type AgentType = 'manta' | 'shark' | 'spider' | 'coder' | 'architect';
export interface ContainerConfig {
    name: string;
    image: string;
    agent: AgentType;
    model: string;
    plugins: string[];
    workspace: string;
    env: Record<string, string>;
    labels?: Record<string, string>;
}
export interface ContainerStatus {
    id: string;
    name: string;
    status: 'created' | 'running' | 'paused' | 'restarting' | 'removing' | 'exited' | 'dead';
    running: boolean;
    image: string;
}
export interface ContainerStats {
    cpuPercent: number;
    memoryUsage: number;
    memoryLimit: number;
    networkRx: number;
    networkTx: number;
}
export interface ContainerPoolConfig {
    maxContainers: number;
    defaultAgent: AgentType;
    defaultPlugins: string[];
    defaultModel: string;
    workspaceRoot: string;
    image: string;
}
//# sourceMappingURL=types.d.ts.map