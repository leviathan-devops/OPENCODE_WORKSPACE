import * as path from 'path'
import * as os from 'os'
import * as fs from 'fs/promises'

export enum ZoneType {
  WORKSPACE = "workspace",
  SANDBOX = "sandbox",
  SYSTEM = "system",
  PERSONAL = "personal",
  DEVELOPMENT = "development",
  CONFIG = "config"
}

export enum ModificationDecision {
  ALLOW = "allow",
  DENY = "deny",
  SANDBOX_REDIRECT = "sandbox_redirect"
}

export interface GuardianResult {
  allowed: boolean
  reason?: string
  actualPath: string
  zone: ZoneType
}

const CRITICAL_SYSTEM_PATHS: Record<string, string[]> = {
  linux: [
    "/bin", "/sbin", "/usr/bin", "/usr/sbin",
    "/lib", "/lib64", "/usr/lib",
    "/etc", "/var", "/proc", "/sys", "/dev",
    "/boot", "/root", "/srv"
  ],
  darwin: [
    "/System", "/Library", "/Applications",
    "/usr", "/bin", "/sbin", "/etc"
  ],
  win32: [
    "C:\\Windows", "C:\\Program Files", "C:\\Program Files (x86)"
  ]
}

const PERSONAL_PATHS = [
  ".ssh", ".gnupg", ".password-store",
  ".config/gh", ".aws", ".azure", ".gcloud", ".kube",
  ".env", ".env.local", ".env.*.local",
  "credentials", "secrets", ".secrets"
]

export function classifyZone(filePath: string, workspacePath: string): { zone: ZoneType; reason: string } {
  const absolutePath = path.resolve(filePath)
  const normalizedPath = absolutePath.toLowerCase()
  const homeDir = os.homedir().toLowerCase()
  
  const workspaceNormalized = path.resolve(workspacePath).toLowerCase()
  if (normalizedPath.startsWith(workspaceNormalized)) {
    return { zone: ZoneType.WORKSPACE, reason: "Within designated workspace" }
  }
  
  const platform = process.platform as string
  const criticalPaths = CRITICAL_SYSTEM_PATHS[platform] || []
  for (const sysPath of criticalPaths) {
    if (normalizedPath.startsWith(sysPath.toLowerCase())) {
      return { zone: ZoneType.SYSTEM, reason: `Critical system path: ${sysPath}` }
    }
  }
  
  if (normalizedPath.startsWith(homeDir)) {
    const relativePath = normalizedPath.slice(homeDir.length)
    for (const personalPath of PERSONAL_PATHS) {
      if (relativePath.includes(personalPath.toLowerCase())) {
        return { zone: ZoneType.PERSONAL, reason: `Personal/sensitive path: ${personalPath}` }
      }
    }
  }
  
  return { zone: ZoneType.DEVELOPMENT, reason: "General development path" }
}

export async function checkPermission(
  filePath: string, 
  operation: "read" | "write" | "delete",
  workspacePath: string
): Promise<ModificationDecision> {
  const { zone } = classifyZone(filePath, workspacePath)
  
  if (zone === ZoneType.SYSTEM || zone === ZoneType.PERSONAL) {
    return ModificationDecision.DENY
  }
  
  return ModificationDecision.ALLOW
}

export async function safeWrite(
  filePath: string,
  content: string | Buffer,
  workspacePath: string
): Promise<GuardianResult> {
  const absolutePath = path.resolve(filePath)
  const { zone, reason } = classifyZone(filePath, workspacePath)
  
  if (zone === ZoneType.SYSTEM || zone === ZoneType.PERSONAL) {
    return {
      allowed: false,
      reason: `Guardian blocked write to ${zone} zone: ${reason}`,
      actualPath: absolutePath,
      zone
    }
  }
  
  await fs.mkdir(path.dirname(absolutePath), { recursive: true }).catch(() => {})
  await fs.writeFile(absolutePath, content)
  
  return {
    allowed: true,
    reason: "Write allowed",
    actualPath: absolutePath,
    zone
  }
}

export async function safeRead(
  filePath: string,
  workspacePath: string
): Promise<GuardianResult & { content?: string | Buffer }> {
  const absolutePath = path.resolve(filePath)
  const { zone, reason } = classifyZone(filePath, workspacePath)
  
  if (zone === ZoneType.SYSTEM) {
    return {
      allowed: false,
      reason: `Guardian blocked read from SYSTEM zone: ${reason}`,
      actualPath: absolutePath,
      zone
    }
  }
  
  const content = await fs.readFile(absolutePath)
  
  return {
    allowed: true,
    reason: "Read allowed",
    actualPath: absolutePath,
    zone,
    content
  }
}

export async function safeDelete(
  filePath: string,
  workspacePath: string
): Promise<GuardianResult> {
  const absolutePath = path.resolve(filePath)
  const { zone, reason } = classifyZone(filePath, workspacePath)
  
  if (zone === ZoneType.SYSTEM || zone === ZoneType.PERSONAL) {
    return {
      allowed: false,
      reason: `Guardian blocked delete in ${zone} zone: ${reason}`,
      actualPath: absolutePath,
      zone
    }
  }
  
  await fs.unlink(absolutePath).catch(() => {})
  
  return {
    allowed: true,
    reason: "Delete allowed",
    actualPath: absolutePath,
    zone
  }
}
