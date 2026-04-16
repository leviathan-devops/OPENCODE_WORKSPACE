import * as fs from 'node:fs';
import * as path from 'node:path';
const WATCHDOG_INTERVAL_MS = 30000; // Check every 30 seconds
const MAX_CPU_TIME_MS = 5 * 60 * 1000; // 5 minutes
const CPU_THRESHOLD = 90; // 90% CPU triggers monitoring
let watchdogInterval = null;
let checkCount = 0;
export default async function OpenCodeWatchdog(_input) {
    log('Watchdog starting...');
    startWatchdog();
    setTimeout(() => runHealthCheck(), 5000); // Immediate first check after 5s
    return {
        event: createEventHook(),
    };
}
function createEventHook() {
    return async (input) => {
        const event = input.event;
        if (event?.type === 'session.ended') {
            return;
        }
    };
}
function startWatchdog() {
    if (watchdogInterval)
        return;
    watchdogInterval = setInterval(() => {
        checkCount++;
        runHealthCheck();
    }, WATCHDOG_INTERVAL_MS);
    watchdogInterval.unref();
}
function runHealthCheck() {
    if (checkCount % 4 === 0) {
        log(`Watchdog check #${checkCount}`);
    }
    const runaway = findRunawayProcesses();
    const orphans = findOrphanedSubagents();
    for (const p of runaway) {
        log(`KILLING RUNAWAY: PID ${p.pid} (CPU ${p.cpu}%, ${Math.round(p.elapsedMs / 1000)}s)`);
        killProcess(p.pid);
    }
    for (const p of orphans) {
        log(`KILLING ORPHAN: PID ${p.pid} (PPID ${p.ppid}, ${Math.round(p.elapsedMs / 1000)}s)`);
        killProcess(p.pid);
    }
}
function findRunawayProcesses() {
    const runaways = [];
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
function findOrphanedSubagents() {
    const orphans = [];
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
function parseProcs() {
    const procs = [];
    const procDir = '/proc';
    try {
        const entries = fs.readdirSync(procDir);
        for (const entry of entries) {
            if (!/^\d+$/.test(entry))
                continue;
            const pid = parseInt(entry, 10);
            const info = readProcessInfo(pid);
            if (info)
                procs.push(info);
        }
    }
    catch {
        // Permission denied or other error
    }
    return procs;
}
function readProcessInfo(pid) {
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
    }
    catch {
        return null;
    }
}
function getCpuMem(pid) {
    try {
        const output = getProcps(pid);
        if (!output)
            return [0, 0];
        const match = output.match(/(\d+\.\d+)\s+(\d+\.\d+)/);
        if (match) {
            return [parseFloat(match[1]), parseFloat(match[2])];
        }
    }
    catch {
        // ignore
    }
    return [0, 0];
}
function getProcps(pid) {
    try {
        const { execSync } = require('child_process');
        return execSync(`ps -p ${pid} -o %cpu=,%mem=`, { encoding: 'utf8', timeout: 1000 }).trim();
    }
    catch {
        return null;
    }
}
function getElapsedMs(pid) {
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
    }
    catch {
        return 0;
    }
}
let bootTimeCache = null;
function getBootTime() {
    if (bootTimeCache)
        return bootTimeCache;
    try {
        const stat = fs.readFileSync('/proc/stat', 'utf8');
        const btime = stat.match(/btime\s+(\d+)/);
        bootTimeCache = btime ? parseInt(btime[1], 10) * 1000 : Date.now();
    }
    catch {
        bootTimeCache = Date.now();
    }
    return bootTimeCache;
}
let uptimeCache = null;
function getUptime() {
    if (uptimeCache)
        return uptimeCache;
    try {
        const uptime = fs.readFileSync('/proc/uptime', 'utf8');
        uptimeCache = parseFloat(uptime.split(' ')[0]);
    }
    catch {
        uptimeCache = 0;
    }
    return uptimeCache;
}
function isMainSession(p) {
    return p.cmd.includes('-s ses_');
}
function isSubagentProcess(p) {
    const subagentIndicators = ['run_subagent_task', 'spawn_', 'cluster-task', 'subagent'];
    return subagentIndicators.some(ind => p.cmd.includes(ind));
}
function killProcess(pid) {
    try {
        process.kill(pid, 'SIGTERM');
        setTimeout(() => {
            try {
                process.kill(pid, 'SIGKILL');
            }
            catch {
                // Already dead
            }
        }, 2000);
    }
    catch {
        // Process already dead
    }
}
function log(msg) {
    const timestamp = new Date().toISOString();
    const logDir = process.env.HOME
        ? path.join(process.env.HOME, '.config', 'opencode', 'logs')
        : '/home/leviathan/.config/opencode/logs';
    const logFile = path.join(logDir, `watchdog-${new Date().toISOString().split('T')[0]}.log`);
    try {
        fs.mkdirSync(logDir, { recursive: true });
        fs.appendFileSync(logFile, `[${timestamp}] ${msg}\n`);
        console.error(`[WATCHDOG] ${msg}`); // Force output to stderr
    }
    catch (e) {
        // Logging failed - don't crash
    }
}
// Force immediate startup check
log('Watchdog plugin loaded');
//# sourceMappingURL=index.js.map