#!/usr/bin/env node
/**
 * Lightweight Watchdog Daemon (~2MB memory)
 * Monitors and kills runaway subagents and containers
 */
const { execSync, spawn } = require('child_process');

const CHECK_INTERVAL = 15000; // 15 seconds
const MAX_CPU_PCT = 90;
const MAX_CPU_SEC = 300; // 5 minutes
const MAX_MEM_PCT = 8;

const LOG_FILE = process.env.HOME + '/.config/opencode/logs/mini-watchdog.log';

function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${msg}\n`;
  try { require('fs').appendFileSync(LOG_FILE, line); } catch {}
  process.stderr.write('[MINI-WD] ' + msg + '\n');
}

function getOpenCodeProcs() {
  try {
    // Simple ps that works on Linux
    const out = execSync('ps auxww | grep opencode | grep -v grep', { encoding: 'utf8', maxBuffer: 1024*1024 });
    return out.trim().split('\n').filter(l => l).map(l => {
      const parts = l.split(/\s+/);
      const cmd = l.substring(l.indexOf(parts[10])).trim();
      return {
        pid: parseInt(parts[1]) || 0,
        ppid: parseInt(parts[2]) || 0,
        cpu: parseFloat(parts[2]) || 0,
        mem: parseFloat(parts[3]) || 0,
        cmd: cmd,
        elapsed: parseElapsed(parts[9])
      };
    });
  } catch (e) { 
    log('getOpenCodeProcs error: ' + e.message);
    return []; 
  }
}

function parseElapsed(timeStr) {
  // Format: MM:SS or HH:MM:SS or Apr11 (date - for very old processes)
  if (!timeStr) return 0;
  if (timeStr.includes(':')) {
    const parts = timeStr.split(':');
    if (parts.length === 2) return parseInt(parts[0])*60*1000 + parseInt(parts[1])*1000;
    if (parts.length === 3) return parseInt(parts[0])*3600*1000 + parseInt(parts[1])*60*1000 + parseInt(parts[2])*1000;
  }
  // Date format like "Apr11" - assume 24h
  if (timeStr.includes('Apr') || timeStr.includes('Jan') || timeStr.includes('Feb')) {
    return 24 * 60 * 60 * 1000; // At least 24 hours
  }
  return 0;
}

function killSafe(pid) {
  try {
    process.kill(pid, 'SIGTERM');
    setTimeout(() => { try { process.kill(pid, 'SIGKILL'); } catch {} }, 2000);
    return true;
  } catch { return false; }
}

function checkOrphanSubagents() {
  const procs = getOpenCodeProcs();
  const pids = new Set(procs.map(p => p.pid));
  
  for (const p of procs) {
    const isOrphan = !pids.has(p.ppid) || p.ppid === 1;
    const isSubagent = /run_subagent|spawn_|cluster-task/.test(p.cmd);
    const isHeavy = p.mem > MAX_MEM_PCT;
    
    if (isOrphan && isSubagent && isHeavy) {
      log(`KILL ORPHAN subagent PID=${p.pid} PPID=${p.ppid} MEM=${p.mem}% CMD=${p.cmd.slice(0,50)}`);
      killSafe(p.pid);
    }
  }
}

function checkRunaway() {
  const procs = getOpenCodeProcs();
  
  for (const p of procs) {
    const isMain = /-s ses_/.test(p.cmd);
    const isHeavyCpu = p.cpu > MAX_CPU_PCT;
    const isLong = p.elapsed > MAX_CPU_SEC * 1000;
    
    if (!isMain && isHeavyCpu && isLong) {
      log(`KILL RUNAWAY PID=${p.pid} CPU=${p.cpu}% ELAPSED=${Math.round(p.elapsed/1000)}s CMD=${p.cmd.slice(0,50)}`);
      killSafe(p.pid);
    }
  }
}

function checkContainers() {
  try {
    const out = execSync('docker ps --format "{{.ID}} {{.Status}}"', { encoding: 'utf8' });
    for (const line of out.trim().split('\n')) {
      const [id, status] = line.split(' ');
      if (status && status.startsWith('Up') && parseInt(status.replace('Up ', '').replace('minutes', '')) > 30) {
        log(`WARN: Long-running container ${id} - ${status}`);
      }
    }
  } catch {}
}

function loop() {
  log('Running health check...');
  try {
    const procs = getOpenCodeProcs();
    log('Found ' + procs.length + ' opencode processes');
    checkOrphanSubagents();
    checkRunaway();
    checkContainers();
  } catch (e) {
    log('ERROR: ' + e.message);
  }
}

log('STARTING mini-watchdog');
setInterval(loop, CHECK_INTERVAL);
setTimeout(loop, 2000); // Immediate first check