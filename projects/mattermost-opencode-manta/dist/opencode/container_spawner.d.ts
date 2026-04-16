/**
 * Container Spawner
 *
 * Manages Docker containers for OpenCode agents.
 * Each channel gets its own container with specific plugins.
 */
import { EventEmitter } from 'events';
import { ContainerConfig, ContainerStatus } from './types.js';
export interface SpawnResult {
    containerId: string;
    containerName: string;
    success: boolean;
    error?: string;
}
export declare class ContainerSpawner extends EventEmitter {
    private workspaceRoot;
    constructor();
    spawnContainer(config: ContainerConfig): Promise<SpawnResult>;
    stopContainer(containerName: string): Promise<boolean>;
    startContainer(containerName: string): Promise<boolean>;
    removeContainer(containerName: string): Promise<boolean>;
    getContainerStatus(containerName: string): Promise<ContainerStatus | null>;
    execInContainer(containerName: string, command: string[], onStdout?: (data: string) => void, onStderr?: (data: string) => void): Promise<{
        exitCode: number;
        stdout: string;
        stderr: string;
    }>;
    sendToStdin(containerName: string, message: string): Promise<boolean>;
    getContainerLogs(containerName: string, tail?: number): Promise<string>;
    listContainers(label?: string): Promise<ContainerStatus[]>;
    private waitForContainer;
    private execDocker;
}
//# sourceMappingURL=container_spawner.d.ts.map