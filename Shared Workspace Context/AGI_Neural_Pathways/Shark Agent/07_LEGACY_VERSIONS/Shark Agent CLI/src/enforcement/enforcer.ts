import { AuditLogger, type AuditEntry } from './audit-logger'
import { detectMockMode, validateToolArgs } from '@/validation/mock-detector'
import { detectTheatricalCode } from '@/validation/theatrical-detector'
import { validateCodeStyle } from '@/validation/style-enforcer'
import { detectRepoRootTests } from '@/validation/test-enforcer'
import { validateDocumentation } from '@/validation/doc-validator'
import { ZoneType, ModificationDecision, safeWrite, safeRead, safeDelete, type GuardianResult, classifyZone } from '@/guardian'

function getStringArg(args: unknown, key: string): string | undefined {
  if (typeof args === 'object' && args !== null && key in args) {
    const val = (args as Record<string, unknown>)[key]
    return typeof val === 'string' ? val : undefined
  }
  return undefined
}

export interface EnforcementParams {
  tool: string
  args: unknown
  sessionID: string
  workspacePath: string
}

export interface EnforcementResult {
  allowed: boolean
  reason?: string
  firewall?: string
}

export async function enforceSharkArchitecture(
  params: EnforcementParams,
  logger: AuditLogger
): Promise<EnforcementResult> {
  const { tool, args, workspacePath } = params

  // Firewall 1-2: Guardian Protection
  if (tool === 'write' || tool === 'edit' || tool === 'delete') {
    const filePath = getStringArg(args, 'filePath') || getStringArg(args, 'path')
    if (filePath) {
      const result = await safeWrite(filePath, '', workspacePath)
      
      if (!result.allowed) {
        return {
          allowed: false,
          reason: result.reason,
          firewall: 'guardian'
        }
      }
    }
  }

  // Firewall 4: Mock mode detection
  const mockCheck = validateToolArgs(tool, args)
  if (mockCheck.isMock) {
    return {
      allowed: false,
      reason: mockCheck.reason,
      firewall: 'mock-mode'
    }
  }

  // Firewall 5: theatrical code detection
  if (tool === 'write' || tool === 'edit') {
    const code = getStringArg(args, 'content') || getStringArg(args, 'code') || ''
    if (code.length > 100) {
      const theatricalCheck = detectTheatricalCode(code)
      if (theatricalCheck.isTheatrical) {
        return {
          allowed: false,
          reason: `Theatrical code: ${theatricalCheck.issues.map(i => i.description).join(', ')}`,
          firewall: 'theatrical-code'
        }
      }
    }
  }

  // Firewall 6: style guide enforcement
  if (tool === 'write' || tool === 'edit') {
    const code = getStringArg(args, 'content') || getStringArg(args, 'code') || ''
    const styleCheck = validateCodeStyle(code)
    if (!styleCheck.isValid) {
      return {
        allowed: false,
        reason: styleCheck.reason,
        firewall: 'style-guide'
      }
    }
  }

  // Firewall 7: repo root test prevention
  if (tool === 'bash') {
    const testCheck = detectRepoRootTests(args)
    if (testCheck.isRepoRoot) {
      return {
        allowed: false,
        reason: testCheck.reason,
        firewall: 'repo-root-test'
      }
    }
  }

  // Firewall 9: documentation validation
  const filePath = getStringArg(args, 'filePath')
  if (tool === 'write' && filePath?.endsWith('.md')) {
    const docCheck = validateDocumentation(getStringArg(args, 'content') || '')
    if (!docCheck.isValid) {
      return {
        allowed: false,
        reason: `Theatrical documentation: ${docCheck.issues.join(', ')}`,
        firewall: 'documentation'
      }
    }
  }

  // All firewalls passed
  await logger.log({
    timestamp: new Date(),
    tool,
    args: typeof args === 'object' ? { ...args } : { args: String(args) },
    allowed: true
  })
  
  return { allowed: true }
}
