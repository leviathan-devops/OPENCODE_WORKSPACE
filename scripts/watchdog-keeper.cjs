#!/usr/bin/env node
/**
 * Auto-restart wrapper for mini-watchdog
 * Ensures watchdog is always running
 */
const { spawn, execSync } = require('child_process');
const path = require('path');

const WATCHDOG_SCRIPT = path.join(__dirname, 'mini-watchdog.cjs');
const MAX_RESTARTS = 10;
const RESTART_DELAY = 2000;

let restarts = 0;
let watchdog = null;

function log(msg) {
  const ts = new Date().toISOString();
  process.stderr.write(`[AUTO-WD] ${ts} ${msg}\n`);
}

function startWatchdog() {
  log('Starting mini-watchdog...');
  watchdog = spawn('node', [WATCHDOG_SCRIPT], {
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false
  });

  watchdog.on('exit', (code, signal) => {
    log(`Watchdog exited code=${code} signal=${signal}`);
    if (restarts < MAX_RESTARTS) {
      restarts++;
      log(`Auto-restarting (${restarts}/${MAX_RESTARTS})...`);
      setTimeout(startWatchdog, RESTART_DELAY);
    } else {
      log('MAX_RESTARTS exceeded, giving up');
      process.exit(1);
    }
  });

  watchdog.on('error', (err) => {
    log('Watchdog error: ' + err.message);
  });

  // Pipe output to our logs
  watchdog.stdout.on('data', (d) => process.stderr.write(d.toString()));
  watchdog.stderr.on('data', (d) => process.stderr.write(d.toString()));
}

function keepAlive() {
  // Double-fork: create new process group so we can detect if parent dies
  try {
    const pid = spawn('node', [__filename], {
      stdio: 'ignore',
      detached: true,
      uid: process.getuid()
    });
    pid.unref();
    log('Started background keeper (PID ' + pid.pid + ')');
  } catch (e) {
    log('Failed to start background keeper: ' + e.message);
  }
}

if (process.argv.includes('--daemon')) {
  // Background mode - just start watchdog and monitor
  startWatchdog();
  setInterval(() => {
    if (!watchdog || watchdog.killed) {
      log('Watchdog not running, restarting...');
      startWatchdog();
    }
  }, 10000);
} else {
  // Foreground mode - start watchdog directly
  startWatchdog();
}