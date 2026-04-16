/**
 * Hive Mind Shark Plugin v3 - YOLO with Guardrails
 * 
 * Philosophy: YOLO mode by default with guardrails that enforce quality
 * - Full dev access to the device
 * - Brick wall enforces 5-step workflow
 * - Mode shift between THINKING (PLAN) and DOING (BUILD)
 * - Only block genuinely dangerous commands
 * - Warn on theatrical patterns (agent can ignore)
 * 
 * Architecture:
 * - Hive Mind: Persistent context via OpenViking
 * - Shark: 5-step workflow enforcement
 * - Auto-inject: Brick wall appears every response
 * 
 * Version: 3.0.0
 */

import { tool, type Plugin, type PluginInput, type Hooks } from '@opencode-ai/plugin'
import * as fs from 'fs'
import * as path from 'path'

// ============================================================================
// CONSTANTS
// ============================================================================

const VERSION = '3.0.0'

const BRICK_WALL = `# 🦈 SHARK ENFORCEMENT ACTIVE

You are operating with SHARK architecture enforcement. This is NOT optional.

## THE 5-STEP BRICK WALL
STEP 1: PLAN → STEP 2: BUILD → STEP 3: TEST → STEP 4: VERIFY → STEP 5: SHIP

## MODES
- PLAN (THINKING): Read, analyze, plan, create .shark/plan.md and .shark/claims.json
- BUILD (DOING): YOLO - full dev access, write code, run commands
- Mode auto-detects: shift happens when plan + claims files exist

## REQUIRED ARTIFACTS
| Step | Artifacts Required |
|------|-------------------|
| PLAN | .shark/plan.md, .shark/claims.json |
| BUILD | .shark/build-manifest.json |
| TEST | .shark/test-results/stage1.json, .shark/test-results/stage2.json |
| VERIFY | 3 gates: functional, intent, security |
| SHIP | .shark/SHIP_REPORT.md |

## EXECUTION RULES
1. Execute, don't simulate - show actual exit codes
2. Verify, don't assume - check files exist
3. No theatrical code - mock, stub, fake, simulate are WARNED (not blocked)
4. Claims require evidence - prove with test results

## FORBIDDEN BEHAVIORS
- Mock mode testing
- Simulating or describing what would happen
- In a real environment I would...
- Writing theatrical code (exists but never called)
`

const DANGEROUS_PATTERNS = [
  { pattern: /^rm\s+-rf\s+\//i, name: 'rm -rf /' },
  { pattern: /curl.+\|\s*sh/i, name: 'curl | sh pipe' },
  { pattern: /:\(\)\{.*:\|.*:\&.*:\}\(/i, name: 'fork bomb' },
  { pattern: /wget.+\|\s*sh/i, name: 'wget | sh pipe' },
  { pattern: />\s*\/dev\/sda/i, name: 'write to device' },
]

const THEATRICAL_PATTERNS = [
  /mock\s*(mode|data|test)/i,
  /\bstub\b/i,
  /fake\s*(data|test|implementation)/i,
  /simulate[ds]?/i,
  /would\s+(run|execute|build|test)/i,
  /TODO|FIXME|HACK/i,
  /not\s+(implemented|running|executed)/i,
]

// ============================================================================
// TYPES
// ============================================================================

interface WorkflowState {
  mode: 'PLAN' | 'BUILD' | 'TEST' | 'VERIFY' | 'SHIP'
  completedSteps: string[]
  artifacts: Record<string, boolean>
  blockers: string[]
  warnings: string[]
  lastChecked?: number
}

interface SessionState {
  workflow: WorkflowState
  commands: Array<{ cmd: string; exitCode: number; timestamp: number }>
  sessionId: string
  workspacePath: string
}

interface OVConfig {
  endpoint: string
  apiKey: string
  enabled: boolean
  account: string
  user: string
}

interface OVResource {
  uri: string
  abstract?: string
  rel_path?: string
}

// ============================================================================
// OPENVIKING CLIENT
// ============================================================================

function loadOVConfig(): OVConfig {
  try {
    const configPath = '/home/leviathan/.config/opencode/plugins/openviking-config.json'
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    return {
      endpoint: config.endpoint || 'http://localhost:1933',
      apiKey: config.apiKey || 'hive-mind-key',
      enabled: config.enabled !== false,
      account: 'default',
      user: 'hive-mind'
    }
  } catch {
    return {
      endpoint: 'http://localhost:1933',
      apiKey: 'hive-mind-key',
      enabled: true,
      account: 'default',
      user: 'hive-mind'
    }
  }
}

async function ovRequest(endpoint: string, method: string, path: string, body?: any): Promise<any> {
  const cfg = loadOVConfig()
  if (!cfg.enabled) return null
  
  const url = `${cfg.endpoint}${path}`
  const headers: Record<string, string> = {
    'X-API-Key': cfg.apiKey,
    'X-OpenViking-Account': cfg.account,
    'X-OpenViking-User': cfg.user,
  }
  
  if (body) headers['Content-Type'] = 'application/json'
  
  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
    return await res.json()
  } catch (err) {
    console.error('[HiveMind] OV request failed:', err)
    return null
  }
}

async function fetchFromOV(uri: string): Promise<string> {
  const result = await ovRequest(
    loadOVConfig().endpoint,
    'GET',
    `/api/v1/content/overview?uri=${encodeURIComponent(uri)}`
  )
  return result?.result || ''
}

async function searchFailures(query: string, limit: number = 3): Promise<OVResource[]> {
  const result = await ovRequest(
    loadOVConfig().endpoint,
    'POST',
    '/api/v1/search/find',
    {
      uri: 'viking://resources/hive-mind/shared/memory/failures/',
      n: limit,
      query
    }
  )
  return result?.result || []
}

async function saveFailure(failure: {
  problem: string
  command: string
  exitCode: number
  sessionId: string
  timestamp: string
  solution?: string
}): Promise<void> {
  await ovRequest(
    loadOVConfig().endpoint,
    'POST',
    '/api/v1/resources',
    {
      path: `/tmp/failure-${Date.now()}.json`,
      to: `viking://resources/hive-mind/shared/memory/failures/${failure.sessionId}-${Date.now()}.json`,
      reason: `Failure: ${failure.problem.substring(0, 50)}`
    }
  )
}

// ============================================================================
// STATE PERSISTENCE
// ============================================================================

const STATE_CACHE = new Map<string, SessionState>()

function getStateFile(sessionId: string, workspacePath: string): string {
  const safeSession = sessionId.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 32)
  return path.join(workspacePath, `.shark`, `hive-state-${safeSession}.json`)
}

function loadState(sessionId: string, workspacePath: string): SessionState {
  const cached = STATE_CACHE.get(sessionId)
  if (cached) return cached
  
  const stateFile = getStateFile(sessionId, workspacePath)
  
  try {
    if (fs.existsSync(stateFile)) {
      const data = JSON.parse(fs.readFileSync(stateFile, 'utf-8'))
      const state: SessionState = {
        workflow: data.workflow || { mode: 'PLAN', completedSteps: [], artifacts: {}, blockers: [], warnings: [] },
        commands: data.commands || [],
        sessionId,
        workspacePath
      }
      STATE_CACHE.set(sessionId, state)
      return state
    }
  } catch (err) {
    console.error('[HiveMind] Failed to load state:', err)
  }
  
  const state: SessionState = {
    workflow: { mode: 'PLAN', completedSteps: [], artifacts: {}, blockers: [], warnings: [] },
    commands: [],
    sessionId,
    workspacePath
  }
  STATE_CACHE.set(sessionId, state)
  return state
}

async function saveState(state: SessionState): Promise<void> {
  STATE_CACHE.set(state.sessionId, state)
  
  // Ensure .shark directory exists
  const sharkDir = path.join(state.workspacePath, '.shark')
  if (!fs.existsSync(sharkDir)) {
    fs.mkdirSync(sharkDir, { recursive: true })
  }
  
  const stateFile = getStateFile(state.sessionId, state.workspacePath)
  try {
    fs.writeFileSync(stateFile, JSON.stringify({
      workflow: state.workflow,
      commands: state.commands,
      savedAt: new Date().toISOString()
    }, null, 2))
  } catch (err) {
    console.error('[HiveMind] Failed to save state:', err)
  }
}

// ============================================================================
// ARTIFACT DETECTION
// ============================================================================

function checkArtifacts(workspacePath: string): Record<string, boolean> {
  const artifacts: Record<string, boolean> = {}
  
  const files = [
    ['plan', '.shark/plan.md'],
    ['claims', '.shark/claims.json'],
    ['manifest', '.shark/build-manifest.json'],
    ['testStage1', '.shark/test-results/stage1.json'],
    ['testStage2', '.shark/test-results/stage2.json'],
    ['gates', '.shark/verify-gates.json'],
    ['report', '.shark/SHIP_REPORT.md'],
  ]
  
  for (const [key, filePath] of files) {
    artifacts[key] = fs.existsSync(path.join(workspacePath, filePath))
  }
  
  return artifacts
}

function detectMode(artifacts: Record<string, boolean>): string {
  if (artifacts['report']) return 'SHIP'
  if (artifacts['testStage1'] && artifacts['testStage2']) return 'VERIFY'
  if (artifacts['manifest']) return 'TEST'
  if (artifacts['plan'] && artifacts['claims']) return 'BUILD'
  return 'PLAN'
}

// ============================================================================
// COMMAND CHECKS
// ============================================================================

function checkDangerous(cmd: string): { dangerous: boolean; pattern?: string } {
  for (const { pattern, name } of DANGEROUS_PATTERNS) {
    if (pattern.test(cmd)) {
      return { dangerous: true, pattern: name }
    }
  }
  return { dangerous: false }
}

function checkTheatrical(cmd: string): string | null {
  for (const pattern of THEATRICAL_PATTERNS) {
    if (pattern.test(cmd)) {
      return pattern.source
    }
  }
  return null
}

// ============================================================================
// PLUGIN
// ============================================================================

export const HiveMindSharkPlugin: Plugin = async (input: PluginInput): Promise<Hooks> => {
  console.log('[HiveMind v3] Plugin loading - YOLO with guardrails')
  
  let state: SessionState | null = null
  let cfg: OVConfig
  
  const initState = (sessionId: string) => {
    state = loadState(sessionId, input.directory)
    cfg = loadOVConfig()
  }

  return {
    // ========================================================================
    // TOOLS
    // ========================================================================
    tool: {
      shark_status: tool({
        description: 'Get current Shark workflow status - mode, progress, warnings',
        args: {},
        execute: async () => {
          if (!state) return '🦈 Not initialized'
          
          const artifacts = checkArtifacts(state.workspacePath)
          const mode = detectMode(artifacts)
          
          const required: Record<string, string[]> = {
            PLAN: ['.shark/plan.md', '.shark/claims.json'],
            BUILD: ['.shark/build-manifest.json'],
            TEST: ['.shark/test-results/stage1.json', '.shark/test-results/stage2.json'],
            VERIFY: ['.shark/verify-gates.json'],
            SHIP: ['.shark/SHIP_REPORT.md'],
          }
          
          const missing = required[mode]?.filter(f => !fs.existsSync(path.join(state!.workspacePath, f))) || []
          
          return [
            `🦈 SHARK STATUS v${VERSION}`,
            `Mode: ${mode}`,
            `Step: ${state.workflow.mode}`,
            `Progress: ${state.workflow.completedSteps.length}/5`,
            `Warnings: ${state.workflow.warnings.length || 'none'}`,
            missing.length ? `Missing: ${missing.join(', ')}` : '',
          ].filter(Boolean).join('\n')
        }
      }),

      shark_build: tool({
        description: 'Force shift to BUILD mode (or auto-detected when plan files exist)',
        args: {},
        execute: async () => {
          if (!state) return '🦈 Not initialized'
          state.workflow.mode = 'BUILD'
          await saveState(state)
          return `🦈 BUILD MODE - YOLO, full dev access\nCommands allowed, code writing, test execution`
        }
      }),

      shark_reset: tool({
        description: 'Reset workflow to PLAN mode - clears all state',
        args: {},
        execute: async () => {
          if (!state) return '🦈 Not initialized'
          state.workflow = {
            mode: 'PLAN',
            completedSteps: [],
            artifacts: {},
            blockers: [],
            warnings: []
          }
          state.commands = []
          await saveState(state)
          return '🦈 RESET TO PLAN MODE'
        }
      }),

      shark_warnings: tool({
        description: 'Show current warnings (theatrical patterns detected)',
        args: {},
        execute: async () => {
          if (!state) return '🦈 Not initialized'
          if (!state.workflow.warnings.length) return '🦈 No warnings'
          return `🦈 WARNINGS:\n${state.workflow.warnings.map((w, i) => `${i + 1}. ${w}`).join('\n')}`
        }
      }),

      hive_context: tool({
        description: 'Query Hive Mind for relevant context from shared memory',
        args: {
          query: z.string().describe('What to search for')
        },
        execute: async (args) => {
          const results = await searchFailures(args.query, 3)
          if (!results.length) return 'No relevant context found in Hive Mind'
          
          const items = await Promise.all(
            results.slice(0, 3).map(async (r: OVResource) => {
              const content = await fetchFromOV(r.uri)
              return `${r.uri}\n${content.substring(0, 200)}`
            })
          )
          
          return `Hive Mind context:\n${items.join('\n\n---\n\n')}`
        }
      }),

      hive_status: tool({
        description: 'Check Hive Mind connection status',
        args: {},
        execute: async () => {
          const config = loadOVConfig()
          try {
            const result = await ovRequest(config.endpoint, 'GET', '/health')
            return result?.status === 'ok' 
              ? `Hive Mind: Connected (${result.version})`
              : 'Hive Mind: Error'
          } catch {
            return 'Hive Mind: Disconnected'
          }
        }
      })
    },

    // ========================================================================
    // HOOKS
    // ========================================================================

    async 'chat.start'(event: any) {
      console.log('[HiveMind v3] Session started:', event.sessionID)
      initState(event.sessionID)
      
      // Load workflow state from file if exists
      const artifacts = checkArtifacts(input.directory)
      const mode = detectMode(artifacts)
      if (state) {
        state.workflow.mode = mode as any
        state.workflow.artifacts = artifacts
        await saveState(state)
      }
      
      console.log('[HiveMind v3] Initial mode:', mode)
    },

    'experimental.chat.system.transform': async (input: any, output: any) => {
      const config = loadOVConfig()
      if (!config.enabled) return
      
      if (!state) {
        initState(input.sessionID || 'unknown')
      }
      
      // Refresh artifact state
      const artifacts = checkArtifacts(state!.workspacePath)
      const mode = detectMode(artifacts)
      state!.workflow.mode = mode as any
      state!.workflow.artifacts = artifacts
      
      // Query failures from Hive Mind
      const failures = await searchFailures('build workflow quality', 3)
      
      // Build mode-specific context
      const modeContext = mode === 'PLAN' 
        ? `\n\n> THINKING phase - create .shark/plan.md and .shark/claims.json first`
        : `\n\n> DOING phase - YOLO, full dev access`
      
      // Build failure context
      const failureContext = failures.length
        ? `\n\n## RECENT FAILURES (learn from these)\n${failures.map((f: OVResource) => `- ${f.abstract || f.uri}`).join('\n')}`
        : ''
      
      // Build warnings if any
      const warningContext = state!.workflow.warnings.length
        ? `\n\n## WARNINGS\n${state!.workflow.warnings.map((w: string) => `- ${w}`).join('\n')}`
        : ''
      
      const context = [
        BRICK_WALL,
        `## CURRENT MODE: ${mode}${modeContext}`,
        failureContext,
        warningContext,
      ].filter(Boolean).join('\n')
      
      output.system = [context, ...output.system]
    },

    async 'tool.execute.before'(input: any, output: any) {
      if (!state) return
      
      const cmd = typeof input.args === 'string' 
        ? input.args 
        : input.args?.command || input.args?.text || ''
      
      // BLOCK genuinely dangerous commands
      const dangerous = checkDangerous(cmd)
      if (dangerous.dangerous) {
        console.log('[HiveMind v3] BLOCKED dangerous:', dangerous.pattern)
        throw new Error(`[SHARK GUARDIAN] Blocked dangerous command: ${dangerous.pattern}\nCommand: ${cmd}`)
      }
      
      // WARN on theatrical patterns in PLAN mode
      if (state.workflow.mode === 'PLAN') {
        const theatrical = checkTheatrical(cmd)
        if (theatrical) {
          const warning = `Theatrical pattern in PLAN mode: ${theatrical} - should this wait for BUILD?`
          state.workflow.warnings.push(warning)
          console.log('[HiveMind v3] WARN:', warning)
          // Don't block - warn only (YOLO)
        }
      }
    },

    async 'tool.execute.after'(input: any, output: any) {
      if (!state) return
      
      // Record commands
      if (input.tool === 'run_command' || input.tool === 'bash') {
        const cmd = typeof input.args === 'string' 
          ? input.args 
          : input.args?.command || ''
        const exitCode = output?.exitCode ?? 0
        
        state.commands.push({ cmd, exitCode, timestamp: Date.now() })
        
        // Save failure to Hive Mind
        if (exitCode !== 0 && cfg?.enabled) {
          await saveFailure({
            problem: `Command failed: ${cmd.substring(0, 100)}`,
            command: cmd,
            exitCode,
            sessionId: state.sessionId,
            timestamp: new Date().toISOString()
          })
        }
        
        await saveState(state)
      }
      
      // Refresh artifacts after file operations
      if (input.tool === 'write_file' || input.tool === 'edit_file') {
        const artifacts = checkArtifacts(state.workspacePath)
        state.workflow.artifacts = artifacts
        
        // Auto-detect mode shift
        const newMode = detectMode(artifacts)
        if (newMode !== state.workflow.mode) {
          console.log(`[HiveMind v3] Auto mode shift: ${state.workflow.mode} → ${newMode}`)
          state.workflow.mode = newMode as any
        }
        
        await saveState(state)
      }
    }
  }
}

export default HiveMindSharkPlugin
