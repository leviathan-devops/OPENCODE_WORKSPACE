/**
 * Shark Cloud Bot Bridge - Node.js version
 * Uses child_process instead of Bun.spawn for better compatibility
 */

import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';

const SERVER_PORT = parseInt(process.env.PORT || '8080');
const SHARK_WORKSPACE = process.env.SHARK_WORKSPACE || '/workspace';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

const LOG = {
  info: (...args) => LOG_LEVEL !== 'silent' && console.log('[INFO]', new Date().toISOString(), ...args),
  warn: (...args) => LOG_LEVEL !== 'silent' && console.warn('[WARN]', new Date().toISOString(), ...args),
  error: (...args) => console.error('[ERROR]', new Date().toISOString(), ...args),
  debug: (...args) => LOG_LEVEL === 'debug' && console.log('[DEBUG]', new Date().toISOString(), ...args),
};

function execShell(cmd, timeout = 300000) {
  return new Promise((resolve, reject) => {
    LOG.debug(`Executing: ${cmd}`);
    
    const proc = spawn('sh', ['-c', cmd], {
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: timeout,
    });
    
    let stdout = '';
    let stderr = '';
    let killed = false;
    
    const timeoutId = setTimeout(() => {
      killed = true;
      proc.kill('SIGKILL');
      reject(new Error(`Command timed out after ${timeout}ms`));
    }, timeout);
    
    proc.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    
    proc.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    
    proc.on('error', (err) => {
      clearTimeout(timeoutId);
      LOG.error(`Process error: ${err.message}`);
      reject(err);
    });
    
    proc.on('close', (code, signal) => {
      clearTimeout(timeoutId);
      
      if (killed) return;
      
      LOG.debug(`Process exited: code=${code}, signal=${signal}`);
      
      if (code === 0 || signal === 'SIGTERM') {
        resolve({ stdout, stderr, code: code || 0 });
      } else {
        reject(new Error(stderr || `Command exited with code ${code}, signal ${signal}`));
      }
    });
  });
}

async function runOpenCodeTask(taskId, prompt, userId = 'anonymous') {
  const taskDir = `${SHARK_WORKSPACE}/tasks/${userId}/${taskId}`;
  
  LOG.info(`Running task ${taskId}: ${prompt.slice(0, 100)}`);
  
  fs.mkdirSync(SHARK_WORKSPACE, { recursive: true });
  fs.mkdirSync(taskDir, { recursive: true });
  
  fs.appendFileSync('/tmp/task.log', `[${new Date().toISOString()}] TASK ${taskId}: ${prompt.slice(0, 100)}\n`);
  
  // Full opencode command with PTY (script) for proper terminal allocation
  const escapedPrompt = prompt.replace(/"/g, '\\"');
  const apiKey = process.env.MINIMAX_API_KEY || '';
  const googleKey = process.env.GOOGLE_API_KEY || '';
  
  LOG.info(`API keys available: MINIMAX=${apiKey.slice(0, 10)}..., GOOGLE=${googleKey.slice(0, 10)}...`);
  
  // Configure opencode providers with API key
  const setupCmd = `script -q -c 'echo "${apiKey}" | opencode providers add minimax' /dev/null`;
  
  LOG.info(`Setting up MiniMax provider`);
  
  const cmd = `script -q -c 'opencode run --format json -- "${escapedPrompt}"' /dev/null`;
  
  LOG.info(`Running opencode`);
  
  LOG.info(`Running opencode in: ${taskDir}`);
  
  try {
    LOG.debug(`Running: ${cmd}`);
    const result = await execShell(cmd, 180000); // 3 minute timeout for opencode
    LOG.info(`Result: stdout_len=${result.stdout.length}, stderr_len=${result.stderr.length}`);
    
    // Parse JSON output from opencode
    const lines = result.stdout.split('\n').filter(l => l.trim());
    let output = result.stdout;
    
    for (const line of lines.reverse()) {
      try {
        const parsed = JSON.parse(line);
        if (parsed.type === 'text' && parsed.part?.text) {
          output = parsed.part.text;
          break;
        }
        if (parsed.type === 'text' && parsed.text) {
          output = parsed.text;
          break;
        }
        if (parsed.text) {
          output = parsed.text;
          break;
        }
      } catch {}
    }
    
    fs.appendFileSync('/tmp/task.log', `[${new Date().toISOString()}] SUCCESS: ${output.slice(0, 200)}\n`);
    return { success: true, output: output.trim(), taskId };
  } catch (error) {
    LOG.error(`Task failed: ${error.message}`);
    fs.appendFileSync('/tmp/task.log', `[${new Date().toISOString()}] ERROR: ${error.message}\n`);
    return { success: false, error: error.message.slice(0, 500), taskId };
  }
}

const server = http.createServer(async (req, res) => {
  const pathname = req.url.split('?')[0];
  const url = new URL(pathname, 'http://localhost');
  
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (url.pathname === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'ok', service: 'shark-cloud', timestamp: Date.now() }));
    return;
  }
  
  if (url.pathname === '/delegate' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { task, userId = 'anonymous' } = JSON.parse(body);
        
        if (!task) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'task is required' }));
          return;
        }
        
        LOG.info(`New task from ${userId}: ${task.slice(0, 100)}`);
        
        const taskId = `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const result = await runOpenCodeTask(taskId, task, userId);
        
        res.writeHead(200);
        res.end(JSON.stringify({
          success: result.success,
          text: result.output || '',
          error: result.error || null,
          taskId,
        }));
      } catch (error) {
        LOG.error('Delegate error:', error);
        res.writeHead(500);
        res.end(JSON.stringify({ error: String(error) }));
      }
    });
    return;
  }
  
  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(SERVER_PORT, '0.0.0.0', () => {
  LOG.info(`Shark Cloud listening on port ${SERVER_PORT}`);
  LOG.info(`Workspace: ${SHARK_WORKSPACE}`);
  LOG.info(`PID: ${process.pid}`);
});

process.on('SIGTERM', () => {
  LOG.info('Shutting down...');
  server.close();
  process.exit(0);
});