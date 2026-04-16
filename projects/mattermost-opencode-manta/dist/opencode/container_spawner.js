/**
 * Container Spawner
 *
 * Manages Docker containers for OpenCode agents.
 * Each channel gets its own container with specific plugins.
 */
import { spawn } from 'child_process';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import { EventEmitter } from 'events';
export class ContainerSpawner extends EventEmitter {
    workspaceRoot = '/workspace';
    constructor() {
        super();
    }
    async spawnContainer(config) {
        const containerName = config.name;
        const workspacePath = join(this.workspaceRoot, 'channels', config.workspace);
        const existing = await this.getContainerStatus(containerName);
        if (existing && existing.status === 'running') {
            return {
                containerId: existing.id,
                containerName,
                success: true,
            };
        }
        if (existing) {
            await this.removeContainer(containerName);
        }
        try {
            await mkdir(workspacePath, { recursive: true });
        }
        catch {
            // Directory may already exist
        }
        const envVars = [
            `OPENCODE_AGENT=${config.agent}`,
            `OPENCODE_MODEL=${config.model}`,
            `OPENCODE_PLUGINS=${config.plugins.join(',')}`,
            `OPENCODE_WORKSPACE=${workspacePath}`,
        ];
        for (const [key, value] of Object.entries(config.env)) {
            envVars.push(`${key}=${value}`);
        }
        const dockerArgs = [
            'run', '-d',
            '--name', containerName,
            '--hostname', `opencode-${config.agent}`,
            '-v', `${workspacePath}:/workspace`,
            '-v', '/var/run/docker.sock:/var/run/docker.sock',
            '-w', '/workspace',
            ...envVars.flatMap(e => ['--env', e]),
            config.image,
            'tail', '-f', '/dev/null',
        ];
        try {
            const result = await this.execDocker(dockerArgs);
            if (result.exitCode !== 0) {
                return {
                    containerId: '',
                    containerName,
                    success: false,
                    error: result.stderr || `Exit code ${result.exitCode}`,
                };
            }
            const containerId = result.stdout.trim();
            console.log(`[ContainerSpawner] Spawned ${containerName} (${containerId})`);
            await this.waitForContainer(containerName, 'running', 10000);
            return {
                containerId,
                containerName,
                success: true,
            };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return {
                containerId: '',
                containerName,
                success: false,
                error: message,
            };
        }
    }
    async stopContainer(containerName) {
        try {
            const result = await this.execDocker(['stop', containerName, '-t', '5']);
            return result.exitCode === 0;
        }
        catch {
            return false;
        }
    }
    async startContainer(containerName) {
        try {
            const result = await this.execDocker(['start', containerName]);
            return result.exitCode === 0;
        }
        catch {
            return false;
        }
    }
    async removeContainer(containerName) {
        try {
            const result = await this.execDocker(['rm', '-f', containerName]);
            return result.exitCode === 0;
        }
        catch {
            return false;
        }
    }
    async getContainerStatus(containerName) {
        try {
            const result = await this.execDocker([
                'inspect',
                '--format',
                '{{.Id}}|{{.State.Status}}|{{.State.Running}}|{{.Config.Image}}',
                containerName,
            ]);
            if (result.exitCode !== 0) {
                return null;
            }
            const parts = result.stdout.trim().split('|');
            if (parts.length < 4) {
                return null;
            }
            const statusStr = parts[1];
            let status = 'exited';
            if (statusStr === 'running')
                status = 'running';
            else if (statusStr === 'created')
                status = 'created';
            else if (statusStr === 'paused')
                status = 'paused';
            else if (statusStr === 'restarting')
                status = 'restarting';
            else if (statusStr === 'removing')
                status = 'removing';
            else if (statusStr === 'dead')
                status = 'dead';
            return {
                id: parts[0],
                name: containerName,
                status,
                running: parts[2] === 'true',
                image: parts[3],
            };
        }
        catch {
            return null;
        }
    }
    async execInContainer(containerName, command, onStdout, onStderr) {
        const args = ['exec', '-i', containerName, ...command];
        return new Promise((resolve) => {
            let stdout = '';
            let stderr = '';
            const proc = spawn('docker', args, {
                stdio: ['pipe', 'pipe', 'pipe'],
            });
            if (proc.stdout) {
                proc.stdout.on('data', (data) => {
                    const str = data.toString();
                    stdout += str;
                    if (onStdout)
                        onStdout(str);
                });
            }
            if (proc.stderr) {
                proc.stderr.on('data', (data) => {
                    const str = data.toString();
                    stderr += str;
                    if (onStderr)
                        onStderr(str);
                });
            }
            proc.on('close', (code) => {
                resolve({
                    exitCode: code || 0,
                    stdout,
                    stderr,
                });
            });
            proc.on('error', (error) => {
                resolve({
                    exitCode: 1,
                    stdout: '',
                    stderr: error.message,
                });
            });
        });
    }
    async sendToStdin(containerName, message) {
        return new Promise((resolve) => {
            const proc = spawn('docker', ['exec', '-i', containerName, 'cat'], {
                stdio: ['pipe', 'pipe', 'pipe'],
            });
            let stdout = '';
            if (proc.stdout) {
                proc.stdout.on('data', (data) => {
                    stdout += data.toString();
                });
            }
            proc.on('close', (code) => {
                resolve(code === 0);
            });
            proc.on('error', () => {
                resolve(false);
            });
            proc.stdin?.write(message + '\n');
            proc.stdin?.end();
        });
    }
    async getContainerLogs(containerName, tail = 100) {
        try {
            const result = await this.execDocker(['logs', '--tail', tail.toString(), containerName]);
            return result.stdout + result.stderr;
        }
        catch {
            return '';
        }
    }
    async listContainers(label) {
        const args = ['ps', '--format', '{{.Names}}|{{.Status}}|{{.Image}}'];
        if (label) {
            args.push('--filter', `label=${label}`);
        }
        try {
            const result = await this.execDocker(args);
            if (result.exitCode !== 0) {
                return [];
            }
            const lines = result.stdout.trim().split('\n').filter(Boolean);
            const containers = [];
            for (const line of lines) {
                const parts = line.split('|');
                if (parts.length >= 3) {
                    const containerStatus = {
                        id: '',
                        name: parts[0],
                        status: parts[1].includes('Up') ? 'running' : 'exited',
                        running: parts[1].includes('Up'),
                        image: parts[2],
                    };
                    containers.push(containerStatus);
                }
            }
            return containers;
        }
        catch {
            return [];
        }
    }
    async waitForContainer(containerName, targetStatus, timeoutMs) {
        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
            const status = await this.getContainerStatus(containerName);
            if (status && status.status === targetStatus) {
                return true;
            }
            await new Promise((r) => setTimeout(r, 500));
        }
        return false;
    }
    execDocker(args) {
        return new Promise((resolve) => {
            let stdout = '';
            let stderr = '';
            const proc = spawn('docker', args);
            if (proc.stdout) {
                proc.stdout.on('data', (data) => {
                    stdout += data.toString();
                });
            }
            if (proc.stderr) {
                proc.stderr.on('data', (data) => {
                    stderr += data.toString();
                });
            }
            proc.on('close', (code) => {
                resolve({
                    exitCode: code || 0,
                    stdout,
                    stderr,
                });
            });
            proc.on('error', (error) => {
                resolve({
                    exitCode: 1,
                    stdout: '',
                    stderr: error.message,
                });
            });
        });
    }
}
//# sourceMappingURL=container_spawner.js.map