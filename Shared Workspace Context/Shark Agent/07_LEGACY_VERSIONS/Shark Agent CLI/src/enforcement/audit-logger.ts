import * as fs from 'fs/promises'
import * as path from 'path'

export interface AuditEntry {
  timestamp: Date
  tool: string
  args: unknown
  allowed: boolean
  reason?: string
  firewall?: string
}

export class AuditLogger {
  private logPath: string
  private entries: AuditEntry[] = []

  constructor(workspacePath: string) {
    this.logPath = path.join(workspacePath, '.shark', 'audit.log')
  }

  async log(entry: AuditEntry): Promise<void> {
    this.entries.push(entry)
    
    const logLine = JSON.stringify({
      ...entry,
      timestamp: entry.timestamp.toISOString()
    }) + "\n"
    
    try {
      await fs.mkdir(path.dirname(this.logPath), { recursive: true })
      await fs.appendFile(this.logPath, logLine)
    } catch (error) {
      console.error("Failed to write audit log:", error)
    }
  }

  getEntries(): AuditEntry[] {
    return [...this.entries]
  }

  async getEntriesFromFile(): Promise<AuditEntry[]> {
    try {
      const content = await fs.readFile(this.logPath, "utf-8")
      return content.trim().split("\n").map(line => JSON.parse(line))
    } catch {
      return []
    }
  }
}
