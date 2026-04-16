/**
 * Hive Mind Plugin for opencode
 * 
 * CONTEXT SANDBOXING: Each session is a distinct "head" with clean context.
 * Shared memory is a SUBCONSCIOUS layer — available on-demand via tools,
 * never dumped into the system prompt.
 * 
 * SMART AUTOMATION: Silent breakthrough detection runs in the background.
 * When significant work is detected (architecture decisions, substantial file
 * creation, error fixes), it auto-commits to OpenViking without touching
 * the agent's context. The agent never sees this happening.
 */

import { tool, type Plugin, type PluginInput, type Hooks } from '@opencode-ai/plugin'
import { z } from 'zod'
import { Database } from 'bun:sqlite'
import * as fs from 'fs'

// --- Session Activity Tracker (in-memory, per-session) ---
interface SessionActivity {
  filesWritten: Map<string, number>  // filePath -> charCount
  filesEdited: Set<string>
  directoriesCreated: Set<string>
  errorsSeen: Array<{ message: string; timestamp: number }>
  fixesSeen: Array<{ pattern: string; timestamp: number }>
  commandsRun: Array<{ cmd: string; timestamp: number }>
  architectureSignals: number
  lastBreakthroughCommit: number
}

const sessionTracker = new Map<string, SessionActivity>()

function getActivity(sessionId: string): SessionActivity {
  if (!sessionTracker.has(sessionId)) {
    sessionTracker.set(sessionId, {
      filesWritten: new Map(),
      filesEdited: new Set(),
      directoriesCreated: new Set(),
      errorsSeen: [],
      fixesSeen: [],
      commandsRun: [],
      architectureSignals: 0,
      lastBreakthroughCommit: 0
    })
  }
  return sessionTracker.get(sessionId)!
}

// Gold standard threshold: artifacts are 10-23KB (179-630 lines)
// Breakthrough = substantial work, not stubs
const GOLD_STANDARD_MIN_CHARS = 2000
const ARCHITECTURE_SIGNAL_THRESHOLD = 3  // 3+ signals = architecture decision
const ERROR_FIX_WINDOW_MS = 5 * 60 * 1000  // 5 min window for error→fix detection
const BREAKTHROUGH_COOLDOWN_MS = 10 * 60 * 1000  // Don't commit breakthroughs more than every 10 min

function detectArchitectureSignal(filePath: string, content: string): boolean {
  const signals = [
    /interface |type |class |enum /,  // Type definitions
    /export (const|function|class|interface|type) /,  // Exports
    /import .* from ['"]\.\.?\//,  // Relative imports (cross-module)
    /\/(config|types|utils|lib|core|src)\//,  // Architecture directories
    /\.(ts|tsx|js|jsx)$/,  // Source files (not configs/tests)
  ]
  let score = 0
  for (const sig of signals) {
    if (sig.test(filePath) || sig.test(content)) score++
  }
  return score >= 2
}

function detectErrorFix(activity: SessionActivity): { error: string; fix: string } | null {
  const now = Date.now()
  const recentErrors = activity.errorsSeen.filter(e => now - e.timestamp < ERROR_FIX_WINDOW_MS)
  const recentFixes = activity.fixesSeen.filter(f => now - f.timestamp < ERROR_FIX_WINDOW_MS)
  
  if (recentErrors.length > 0 && recentFixes.length > 0) {
    const lastError = recentErrors[recentErrors.length - 1]
    const lastFix = recentFixes[recentFixes.length - 1]
    return { error: lastError.message, fix: lastFix.pattern }
  }
  return null
}

async function commitBreakthrough(sessionId: string, activity: SessionActivity, type: 'architecture' | 'file_creation' | 'error_fix', details: string): Promise<void> {
  const now = Date.now()
  if (now - activity.lastBreakthroughCommit < BREAKTHROUGH_COOLDOWN_MS) return
  
  activity.lastBreakthroughCommit = now
  
  // Get session metadata
  let sessionTitle = 'unknown'
  let sessionCategory = 'planning'
  try {
    const db = new Database('/home/leviathan/.local/share/opencode/opencode.db', { readonly: true })
    const session = db.prepare('SELECT id, title FROM session WHERE id = ?').get(sessionId) as any
    if (session) {
      sessionTitle = session.title
      sessionCategory = inferCategory(session.title || '')
    }
    db.close()
  } catch {}
  
  const timestamp = new Date().toISOString()
  const content = `# ${type === 'architecture' ? 'ARCHITECTURE DECISION' : type === 'error_fix' ? 'ERROR FIX' : 'FILE CREATION'}

**Session:** ${sessionTitle}
**Session ID:** ${sessionId}
**Category:** ${sessionCategory}
**Timestamp:** ${timestamp}
**Type:** ${type}

---

## Details

${details}

---

## Session Activity Summary

- Files written: ${activity.filesWritten.size}
- Files edited: ${activity.filesEdited.size}
- Directories created: ${activity.directoriesCreated.size}
- Commands run: ${activity.commandsRun.length}
- Errors encountered: ${activity.errorsSeen.length}
- Fixes applied: ${activity.fixesSeen.length}

---

## Semantic Tags

${type}, ${sessionCategory}, ${sessionTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}, ${Array.from(activity.filesWritten.keys()).slice(0, 5).map(f => f.split('/').pop()).join(', ')}
`
  
  const targetUri = type === 'architecture'
    ? `viking://resources/hive-mind/shared/sessions/${sessionId}/breakthrough_architecture_${Date.now()}.md`
    : type === 'error_fix'
    ? `viking://resources/hive-mind/shared/sessions/${sessionId}/breakthrough_fix_${Date.now()}.md`
    : `viking://resources/hive-mind/shared/sessions/${sessionId}/breakthrough_file_${Date.now()}.md`
  
  await uploadToOV(
    `breakthrough_${type}_${Date.now()}.md`,
    content,
    targetUri,
    `Auto-detected ${type} breakthrough`
  )
  
  console.log(`[HiveMind] Breakthrough committed: ${type} in session ${sessionId.slice(0, 12)}`)
}

function analyzeMessageForPatterns(sessionId: string, messageData: any): void {
  const activity = getActivity(sessionId)
  const now = Date.now()
  
  // Parse message content
  const content = messageData?.content || []
  if (!Array.isArray(content)) return
  
  for (const part of content) {
    if (!part || typeof part !== 'object') continue
    
    // Detect file writes (substantial content only - gold standard threshold)
    if (part.type === 'tool_use' && (part.tool === 'write' || part.toolName === 'write')) {
      const input = part.input || {}
      const filePath = input.filePath || ''
      const fileContent = input.content || ''
      
      if (fileContent.length > GOLD_STANDARD_MIN_CHARS) {
        activity.filesWritten.set(filePath, fileContent.length)
        
        // Check for architecture signals
        if (detectArchitectureSignal(filePath, fileContent)) {
          activity.architectureSignals++
          
          if (activity.architectureSignals >= ARCHITECTURE_SIGNAL_THRESHOLD) {
            const files = Array.from(activity.filesWritten.keys()).join('\n- ')
            commitBreakthrough(sessionId, activity, 'architecture',
              `Architecture decision detected. Files modified:\n- ${files}\n\nArchitecture signals: ${activity.architectureSignals}`
            ).catch(() => {})
            activity.architectureSignals = 0  // Reset after commit
          }
        }
      }
    }
    
    // Detect file edits
    if (part.type === 'tool_use' && (part.tool === 'edit' || part.toolName === 'edit')) {
      const input = part.input || {}
      const filePath = input.filePath || ''
      if (filePath) activity.filesEdited.add(filePath)
    }
    
    // Detect directory creation
    if (part.type === 'tool_use' && (part.tool === 'bash' || part.toolName === 'bash')) {
      const input = part.input || {}
      const cmd = input.command || ''
      if (cmd) {
        activity.commandsRun.push({ cmd, timestamp: now })
        
        // Detect mkdir
        const mkdirMatch = cmd.match(/mkdir\s+(-p\s+)?(.+)/)
        if (mkdirMatch) {
          activity.directoriesCreated.add(mkdirMatch[2].trim())
        }
        
        // Detect error patterns in command output
        const output = input.output || ''
        if (output && (output.includes('error') || output.includes('Error') || output.includes('ERROR') || output.includes('failed') || output.includes('Failed'))) {
          activity.errorsSeen.push({ message: output.slice(0, 500), timestamp: now })
        }
      }
    }
    
    // Detect error mentions in text content
    if (part.type === 'text' && part.text) {
      const text = part.text.toLowerCase()
      if (text.includes('error:') || text.includes('failed:') || text.includes('exception') || text.includes('traceback')) {
        activity.errorsSeen.push({ message: part.text.slice(0, 500), timestamp: now })
      }
      if (text.includes('fixed') || text.includes('resolved') || text.includes('patched') || text.includes('corrected')) {
        activity.fixesSeen.push({ pattern: part.text.slice(0, 200), timestamp: now })
        
        // Check for error→fix sequence
        const errorFix = detectErrorFix(activity)
        if (errorFix) {
          commitBreakthrough(sessionId, activity, 'error_fix',
            `Error fix detected:\n\n**Error:** ${errorFix.error.slice(0, 300)}\n\n**Fix:** ${errorFix.fix.slice(0, 300)}`
          ).catch(() => {})
        }
      }
    }
  }
  
  // Check for file creation breakthroughs (batch: commit when 3+ substantial files written)
  if (activity.filesWritten.size >= 3) {
    const totalChars = Array.from(activity.filesWritten.values()).reduce((a, b) => a + b, 0)
    if (totalChars > GOLD_STANDARD_MIN_CHARS * 3) {
      const files = Array.from(activity.filesWritten.entries())
        .map(([path, chars]) => `- ${path} (${chars} chars)`)
        .join('\n')
      commitBreakthrough(sessionId, activity, 'file_creation',
        `Substantial file creation detected:\n\n${files}\n\nTotal: ${totalChars} chars across ${activity.filesWritten.size} files`
      ).catch(() => {})
      activity.filesWritten.clear()  // Reset after commit
    }
  }
}

async function commitSessionOverview(sessionId: string): Promise<void> {
  try {
    const overview = querySessionData(sessionId, 'overview')
    const overviewStr = typeof overview === 'object' ? JSON.stringify(overview, null, 2) : String(overview)
    
    await uploadToOV(
      `session_overview_${sessionId}.md`,
      overviewStr,
      `viking://resources/hive-mind/shared/sessions/${sessionId}/T1_OVERVIEW.md`,
      'Session end auto-commit'
    )
    console.log(`[HiveMind] Session overview committed: ${sessionId.slice(0, 12)}`)
  } catch (err) {
    console.error(`[HiveMind] Failed to commit session overview: ${err}`)
  }
}

interface OVConfig {
  endpoint: string
  apiKey: string
  enabled: boolean
  timeoutMs: number
  autoCommit: {
    enabled: boolean
    intervalMinutes: number
  }
}

function loadConfig(): OVConfig {
  try {
    const configPath = '/home/leviathan/.config/opencode/plugins/openviking-config.json'
    const configContent = require('fs').readFileSync(configPath, 'utf-8')
    return JSON.parse(configContent)
  } catch {
    return {
      endpoint: 'http://localhost:1933',
      apiKey: 'hive-mind-key',
      enabled: true,
      timeoutMs: 30000,
      autoCommit: { enabled: true, intervalMinutes: 5 }
    }
  }
}

async function fetchFromOV(uri: string): Promise<string> {
  const cfg = loadConfig()
  if (!cfg.enabled) return ''
  try {
    const response = await fetch(`${cfg.endpoint}/api/v1/content/overview?uri=${encodeURIComponent(uri)}`, {
      headers: { 'X-API-Key': cfg.apiKey, 'X-OpenViking-Account': 'default', 'X-OpenViking-User': 'hive-mind' }
    })
    const data = await response.json()
    return data.result || ''
  } catch { return '' }
}

async function searchInOV(query: string): Promise<any[]> {
  const cfg = loadConfig()
  if (!cfg.enabled) return []
  try {
    const response = await fetch(
      `${cfg.endpoint}/api/v1/search/find?uri=viking%3A%2F%2Fresources%2Fhive-mind%2Fshared%2F&n=5&q=${encodeURIComponent(query)}`,
      { headers: { 'X-API-Key': cfg.apiKey, 'X-OpenViking-Account': 'default', 'X-OpenViking-User': 'hive-mind' } }
    )
    const data = await response.json()
    return data.result || []
  } catch { return [] }
}

async function uploadToOV(filename: string, content: string, targetUri: string, reason: string): Promise<string> {
  const cfg = loadConfig()
  try {
    const tmpResp = await fetch(`${cfg.endpoint}/api/v1/resources/temp_upload`, {
      method: 'POST',
      headers: { 'X-API-Key': cfg.apiKey, 'X-OpenViking-Account': 'default', 'X-OpenViking-User': 'hive-mind' },
      body: (() => { const f = new FormData(); f.append('file', new Blob([content], { type: 'text/markdown' }), filename); return f })()
    })
    const tmpData = await tmpResp.json()
    const tempId = tmpData.result?.temp_file_id
    if (!tempId) return `Failed: no temp ID`

    await fetch(`${cfg.endpoint}/api/v1/resources`, {
      method: 'POST',
      headers: { 'X-API-Key': cfg.apiKey, 'X-OpenViking-Account': 'default', 'X-OpenViking-User': 'hive-mind', 'Content-Type': 'application/json' },
      body: JSON.stringify({ temp_file_id: tempId, to: targetUri, reason })
    })
    return `OK: ${targetUri}`
  } catch (err) { return `Failed: ${err}` }
}

function inferCategory(title: string): string {
  const t = title.toLowerCase()
  if (t.includes('spider') || t.includes('guardian') || t.includes('firewall')) return 'architecture'
  if (t.includes('build') || t.includes('implement') || t.includes('workflow')) return 'build'
  if (t.includes('explore') || t.includes('forensic') || t.includes('analyze')) return 'investigation'
  if (t.includes('swarm') || t.includes('migration') || t.includes('adapter')) return 'orchestration'
  if (t.includes('review') || t.includes('reviewer')) return 'review'
  if (t.includes('gold_standard') || t.includes('omnicoder')) return 'gold_standard'
  if (t.includes('openviking') || t.includes('hive mind')) return 'integration'
  if (t.includes('test') || t.includes('failed') || t.includes('error')) return 'failure'
  return 'planning'
}

function extractToolsFromParts(parts: any[]): string[] {
  const tools = new Set<string>()
  for (const part of parts) {
    if (part.data) {
      try {
        const parsed = JSON.parse(part.data)
        if (parsed.tool) tools.add(parsed.tool)
        if (parsed.name) tools.add(parsed.name)
      } catch {}
    }
  }
  return Array.from(tools)
}

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000)
  const hours = Math.floor(minutes / 60)
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m`
  return `${Math.floor(ms / 1000)}s`
}

function querySessionData(sessionId: string, level: 'abstract' | 'overview' | 'full'): object {
  const db = new Database('/home/leviathan/.local/share/opencode/opencode.db', { readonly: true })
  try {
    const session = db.prepare('SELECT id, title, parent_id, directory, time_created, time_updated FROM session WHERE id = ?').get(sessionId) as any
    if (!session) return { error: `Session not found: ${sessionId}` }

    const duration = session.time_updated - session.time_created
    const category = inferCategory(session.title || '')
    const abstract = { id: session.id, title: session.title, category, duration: formatDuration(duration), directory: session.directory }

    if (level === 'abstract') return abstract

    const messages = db.prepare('SELECT id, session_id, role, summary, agent, model, time_created FROM message WHERE session_id = ? ORDER BY time_created ASC').all(sessionId) as any[]
    const parts = db.prepare('SELECT id, message_id, session_id, type, text, data FROM part WHERE session_id = ? ORDER BY id ASC').all(sessionId) as any[]
    const toolsUsed = extractToolsFromParts(parts)

    if (level === 'overview') {
      const last20 = messages.slice(-20).map((m: any) => ({
        id: m.id, role: m.role, summary: m.summary || '(no summary)', agent: m.agent, timestamp: new Date(m.time_created).toISOString()
      }))
      return { ...abstract, tools_used: toolsUsed, message_count: messages.length, last_20_messages: last20 }
    }

    const fullMessages = messages.map((msg: any) => {
      const msgParts = parts.filter((p: any) => p.message_id === msg.id)
      return {
        id: msg.id, role: msg.role, summary: msg.summary, agent: msg.agent, model: msg.model,
        timestamp: new Date(msg.time_created).toISOString(),
        parts: msgParts.map((p: any) => ({ type: p.type, text: p.text ? p.text.slice(0, 2000) : null }))
      }
    })
    return {
      ...abstract, tools_used: toolsUsed, message_count: messages.length, parent_id: session.parent_id,
      time_created: new Date(session.time_created).toISOString(), time_updated: new Date(session.time_updated).toISOString(),
      messages: fullMessages
    }
  } finally {
    db.close()
  }
}

export const HiveMindPlugin: Plugin = async (_input: PluginInput): Promise<Hooks> => {
  console.log('[HiveMind] Plugin loading — context sandboxing active, shared memory is subconscious')

  return {
    tool: {
      hive_context: tool({
        description: 'Search the Hive Mind subconscious memory layer. Returns relevant past sessions, knowledge, and discoveries. Use when you need information from past work.',
        args: { query: z.string().describe('What to search for in shared memory') },
        execute: async (args) => {
          const results = await searchInOV(args.query)
          if (results.length === 0) return 'No relevant context found in shared memory.'
          const items = await Promise.all(results.slice(0, 3).map(async (r: any) => {
            const content = await fetchFromOV(r.uri)
            return `## ${r.uri}\n${content}`
          }))
          return `Found ${items.length} relevant memories:\n\n${items.join('\n\n---\n\n')}`
        }
      }),

      hive_status: tool({
        description: 'Check Hive Mind shared memory connection status',
        args: {},
        execute: async () => {
          const cfg = loadConfig()
          try {
            const res = await fetch(`${cfg.endpoint}/health`)
            const data = await res.json()
            return `Hive Mind: Connected (${data.version})`
          } catch { return 'Hive Mind: Disconnected' }
        }
      }),

      hive_remember: tool({
        description: 'Persist a discovery, decision, or lesson to the Hive Mind subconscious layer. Other sessions can find this via hive_context.',
        args: {
          key: z.string().describe('Short key/summary for this memory'),
          content: z.string().describe('Full content to remember')
        },
        execute: async (args) => {
          const result = await uploadToOV(
            `${args.key}.md`,
            args.content,
            `viking://resources/hive-mind/shared/memory/${args.key}.md`,
            'User memory from opencode session'
          )
          return result.startsWith('OK') ? `Saved to Hive Mind: ${args.key}` : result
        }
      }),

      memread_session: tool({
        description: 'Read a past session from opencode.db. Returns T1 overview with metadata, category, tools used, and messages. This is the subconscious recall of past experiences.',
        args: {
          session_id: z.string().describe('Session ID to retrieve'),
          level: z.enum(['abstract', 'overview', 'full']).default('overview').describe('Detail: abstract (basic), overview (+ tools + last 20 msgs), full (all msgs)')
        },
        execute: async (args) => {
          try {
            const result = querySessionData(args.session_id, args.level ?? 'overview')
            return JSON.stringify(result, null, 2)
          } catch (err) {
            return JSON.stringify({ error: `Failed to query session: ${err}` }, null, 2)
          }
        }
      }),

      memlink_parent: tool({
        description: 'Link this session to a parent session. Creates a lineage chain in the subconscious layer.',
        args: {
          parent_session_id: z.string().describe('Parent session ID'),
          current_session_id: z.string().describe('Current session ID'),
          relationship: z.enum(['spawn', 'continuation', 'review']).default('spawn').describe('How this session relates to the parent')
        },
        execute: async (args) => {
          const content = `# SESSION LINK\nparent: ${args.parent_session_id}\nchild: ${args.current_session_id}\nrelationship: ${args.relationship}\ncreated: ${new Date().toISOString()}\n`
          const result = await uploadToOV(
            'link.md',
            content,
            `viking://resources/hive-mind/shared/sessions/${args.current_session_id}/LINK_${args.parent_session_id}.md`,
            'Session parent-child link'
          )
          return result.startsWith('OK') ? `Linked ${args.current_session_id} → ${args.parent_session_id} (${args.relationship})` : result
        }
      })
    },

    // --- SMART AUTOMATION HOOKS ---
    // These run silently in the background. Zero context injection.
    // The agent never sees this happening — memory just appears in OpenViking.

    'experimental.chat.messages.transform': async (input, output) => {
      // ONLY pattern detection — no output modification
      try {
        const sessionId = input?.sessionID
        if (!sessionId) return

        // Analyze each message for breakthrough patterns
        const messages = output?.messages || []
        for (const msg of messages) {
          if (msg?.role === 'assistant') {
            analyzeMessageForPatterns(sessionId, msg)
          }
        }
      } catch (err) {
        // Silent failure — never break the agent's flow
        console.error('[HiveMind] Pattern detection error:', err)
      }
    },

    'experimental.session.compacting': async (input, output) => {
      // Session compacting = session winding down = time for auto-commit
      try {
        const sessionId = input?.sessionID
        if (!sessionId) return

        // Commit any remaining breakthroughs
        const activity = getActivity(sessionId)
        if (activity.filesWritten.size > 0) {
          const files = Array.from(activity.filesWritten.entries())
            .map(([path, chars]) => `- ${path} (${chars} chars)`)
            .join('\n')
          await commitBreakthrough(sessionId, activity, 'file_creation',
            `Session-end file creation summary:\n\n${files}`
          )
        }

        // Commit full session overview
        await commitSessionOverview(sessionId)

        // Clean up tracker
        sessionTracker.delete(sessionId)
      } catch (err) {
        console.error('[HiveMind] Session compacting error:', err)
      }
    }
  }
}
