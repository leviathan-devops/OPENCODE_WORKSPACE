/**
 * OpenCode Watchdog Plugin
 * 
 * Monitors for:
 * 1. Runaway loops - processes with >90% CPU for >5 minutes
 * 2. Orphaned subagents - child processes of dead parents consuming resources
 * 
 * Safe: Only kills processes matching criteria, leaves active sessions alone.
 */
import type { Plugin, PluginInput, Hooks } from '@opencode-ai/plugin';
import * as fs from 'node:fs';
import * as path from 'node:path';

const WATCHDOG_INTERVAL_MS = 30000; // Check every 30 seconds
const MAX_CPU_TIME_MS = 5 * 60 * 1000; // 5 minutes
const CPU_THRESHOLD = 90; // 90% CPU triggers monitoring

interface ProcessInfo {
  pid: number;
  ppid: number;
  cpu: number;
  mem: number;
  elapsedMs: number;
  cmd: string;
  stat: string;
}

let watchdogInterval: ReturnType<typeof setInterval> | null = null;
let checkCount = 0;

export default async function OpenCodeWatchdog(_input: PluginInput): Promise<Hooks> {
  log('Watchdog starting...');
  startWatchdog();
  setTimeout(() => runHealthCheck(), 5000); // Immediate first check after 5s
  
  return {
    event: createEventHook(),
  };
}

function createEventHook(): Hooks['event'] {
  return async (input) => {
    const event = input.event as { type?: string };
    
    if (event?.type === 'session.ended') {
      return;
    }
  };
}

function startWatchdog(): void {
  if (watchdogInterval) return;
  
  watchdogInterval = setInterval(() => {
    checkCount++;
    runHealthCheck();
  }, WATCHDOG_INTERVAL_MS);
  
  watchdogInterval.unref();
}

function runHealthCheck(): void {
  if (checkCount % 4 === 0) {
    log(`Watchdog check #${checkCount}`);
  }
  
  const runaway = findRunawayProcesses();
  const orphans = findOrphanedSubagents();
  
  for (const p of runaway) {
    log(`KILLING RUNAWAY: PID ${p.pid} (CPU ${p.cpu}%, ${Math.round(p.elapsedMs/1000)}s)`);
    killProcess(p.pid);
  }
  
  for (const p of orphans) {
    log(`KILLING ORPHAN: PID ${p.pid} (PPID ${p.ppid}, ${Math.round(p.elapsedMs/1000)}s)`);
    killProcess(p.pid);
  }
}

function findRunawayProcesses(): ProcessInfo[] {
  const runaways: ProcessInfo[] = [];
  
  const procs = parseProcs();
  for (const p of procs) {
    const isOpenCode = p.cmd.includes('opencode') || p.cmd.includes('.opencode');
    const isHighCpu = p.cpu > CPU_THRESHOLD;
    const isLongRunning = p.elapsedMs > MAX_CPU_TIME_MS;
    
    if (isOpenCode && isHighCpu && isLongRunning && !isMainSession(p)) {
      runaways.push(p);
    }
  }
  
  return runaways;
}

function findOrphanedSubagents(): ProcessInfo[] {
  const orphans: ProcessInfo[] = [];
  const procs = parseProcs();
  
  const validPpids = new Set(procs.map(p => p.pid));
  validPpids.add(1); // init
  validPpids.add(0); // kernel
  
  for (const p of procs) {
    const isOpenCode = p.cmd.includes('opencode') || p.cmd.includes('.opencode');
    const isSubagent = isSubagentProcess(p);
    const isOrphaned = !validPpids.has(p.ppid) || p.ppid === 1;
    const isHighMem = p.mem > 5;
    
    if (isOpenCode && isSubagent && isOrphaned && isHighMem) {
      orphans.push(p);
    }
  }
  
  return orphans;
}

function parseProcs(): ProcessInfo[] {
  const procs: ProcessInfo[] = [];
  const procDir = '/proc';
  
  try {
    const entries = fs.readdirSync(procDir);
    for (const entry of entries) {
      if (!/^\d+$/.test(entry)) continue;
      
      const pid = parseInt(entry, 10);
      const info = readProcessInfo(pid);
      if (info) procs.push(info);
    }
  } catch {
    // Permission denied or other error
  }
  
  return procs;
}

function readProcessInfo(pid: number): ProcessInfo | null {
  try {
    const statPath = `/proc/${pid}/stat`;
    const cmdPath = `/proc/${pid}/cmdline`;
    const stat = fs.readFileSync(statPath, 'utf8');
    const cmd = fs.readFileSync(cmdPath, 'utf8').replace(/\0/g, ' ').trim() || 'unknown';
    
    const parts = stat.split(' ');
    const ppid = parseInt(parts[3], 10);
    const statChar = parts[2];
    
    const [cpu, mem] = getCpuMem(pid);
    const elapsedMs = getElapsedMs(pid);
    
    return { pid, ppid, cpu, mem, elapsedMs, cmd, stat: statChar };
  } catch {
    return null;
  }
}

function getCpuMem(pid: number): [number, number] {
  try {
    const output = getProcps(pid);
    if (!output) return [0, 0];
    
    const match = output.match(/(\d+\.\d+)\s+(\d+\.\d+)/);
    if (match) {
      return [parseFloat(match[1]), parseFloat(match[2])];
    }
  } catch {
    // ignore
  }
  return [0, 0];
}

function getProcps(pid: number): string | null {
  try {
    const { execSync } = require('child_process');
    return execSync(`ps -p ${pid} -o %cpu=,%mem=`, { encoding: 'utf8', timeout: 1000 }).trim();
  } catch {
    return null;
  }
}

function getElapsedMs(pid: number): number {
  try {
    const statPath = `/proc/${pid}/stat`;
    const stat = fs.readFileSync(statPath, 'utf8');
    const parts = stat.split(' ');
    const startTime = parseInt(parts[21], 10);
    
    const clkTck = 100;
    const bootTime = getBootTime();
    const uptime = Date.now() / 1000 - bootTime;
    const elapsedSec = (startTime / clkTck) - (uptime - getUptime());
    
    return elapsedSec > 0 ? elapsedSec * 1000 : 0;
  } catch {
    return 0;
  }
}

let bootTimeCache: number | null = null;
function getBootTime(): number {
  if (bootTimeCache) return bootTimeCache;
  try {
    const stat = fs.readFileSync('/proc/stat', 'utf8');
    const btime = stat.match(/btime\s+(\d+)/);
    bootTimeCache = btime ? parseInt(btime[1], 10) * 1000 : Date.now();
  } catch {
    bootTimeCache = Date.now();
  }
  return bootTimeCache;
}

let uptimeCache: number | null = null;
function getUptime(): number {
  if (uptimeCache) return uptimeCache;
  try {
    const uptime = fs.readFileSync('/proc/uptime', 'utf8');
    uptimeCache = parseFloat(uptime.split(' ')[0]);
  } catch {
    uptimeCache = 0;
  }
  return uptimeCache;
}

function isMainSession(p: ProcessInfo): boolean {
  return p.cmd.includes('-s ses_');
}

function isSubagentProcess(p: ProcessInfo): boolean {
  const subagentIndicators = ['run_subagent_task', 'spawn_', 'cluster-task', 'subagent'];
  return subagentIndicators.some(ind => p.cmd.includes(ind));
}

function killProcess(pid: number): void {
  try {
    process.kill(pid, 'SIGTERM');
    setTimeout(() => {
      try {
        process.kill(pid, 'SIGKILL');
      } catch {
        // Already dead
      }
    }, 2000);
  } catch {
    // Process already dead
  }
}

function log(msg: string): void {
  const timestamp = new Date().toISOString();
  const logDir = process.env.HOME 
    ? path.join(process.env.HOME, '.config', 'opencode', 'logs') 
    : '/home/leviathan/.config/opencode/logs';
  const logFile = path.join(logDir, `watchdog-${new Date().toISOString().split('T')[0]}.log`);
  
  try {
    fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(logFile, `[${timestamp}] ${msg}\n`);
    console.error(`[WATCHDOG] ${msg}`); // Force output to stderr
  } catch (e) {
    // Logging failed - don't crash
  }
}

// Force immediate startup check
log('Watchdog plugin loaded');