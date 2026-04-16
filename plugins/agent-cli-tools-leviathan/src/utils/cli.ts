import { spawn } from 'child_process';
import { logger } from './logger.js';

export interface CliResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  timedOut: boolean;
}

export async function invokeCli(
  command: string,
  args: string[],
  options: { timeout?: number; cwd?: string } = {}
): Promise<CliResult> {
  const timeout = options.timeout ?? 120;

  return new Promise((resolve) => {
    const proc = spawn(command, args, {
      cwd: options.cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      proc.kill('SIGTERM');
    }, timeout * 1000);

    proc.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      clearTimeout(timer);
      resolve({
        stdout,
        stderr,
        exitCode: code ?? 0,
        timedOut,
      });
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      stderr += err.message;
      resolve({
        stdout,
        stderr,
        exitCode: 1,
        timedOut,
      });
    });
  });
}

export function buildGeminiArgs(args: {
  prompt: string;
  model?: string;
  sandbox?: boolean;
  outputFormat?: string;
}): string[] {
  const cmdArgs: string[] = ['-p', args.prompt];

  if (args.model && args.model !== 'gemini-2.5-flash') {
    cmdArgs.push('-m', args.model);
  }

  if (args.sandbox) {
    cmdArgs.push('-s');
  }

  if (args.outputFormat === 'json') {
    cmdArgs.push('--output-format', 'json');
  }

  return cmdArgs;
}

export function buildQwenArgs(args: {
  prompt: string;
  yolo?: boolean;
  model?: string;
  outputFormat?: string;
}): string[] {
  const cmdArgs: string[] = ['-p', args.prompt];

  if (args.yolo) {
    cmdArgs.push('--yolo');
  }

  if (args.model && args.model !== 'qwen3-coder') {
    cmdArgs.push('-m', args.model);
  }

  if (args.outputFormat === 'json') {
    cmdArgs.push('--output-format', 'json');
  }

  return cmdArgs;
}
