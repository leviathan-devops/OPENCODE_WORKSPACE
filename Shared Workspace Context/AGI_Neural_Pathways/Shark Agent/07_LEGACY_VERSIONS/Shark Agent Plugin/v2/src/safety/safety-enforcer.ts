import { Guardian } from '../guardian';
import { SafetyCheck } from '../../types/safety-types';

export class SafetyEnforcer {
  private guardian: Guardian;

  constructor(guardian: Guardian) {
    this.guardian = guardian;
  }

  checkTool(toolName: string, args: any): SafetyCheck {
    const warnings: string[] = [];

    if (toolName === 'write_file' || toolName === 'edit_file') {
      const filePath = args?.file_path || args?.path;
      if (!filePath) {
        return { blocked: true, reason: 'No file path provided', warnings: [] };
      }
      const check = this.guardian.checkWrite(filePath);
      if (!check.allowed) {
        return { blocked: true, reason: check.reason, warnings: [] };
      }
    }

    if (toolName === 'read_file') {
      const filePath = args?.file_path || args?.path;
      if (filePath) {
        const check = this.guardian.checkRead(filePath);
        if (!check.allowed) {
          return { blocked: true, reason: check.reason, warnings: [] };
        }
      }
    }

    if (toolName === 'run_command' || toolName === 'bash') {
      const command = args?.command || args?.cmd || '';

      const forbiddenPatterns: Array<{ pattern: RegExp; name: string }> = [
        { pattern: /rm\s+-rf\s+\/(?!shark|tmp)/, name: 'System deletion' },
        { pattern: /chmod\s+-R?\s+777\s+\/(?!shark|tmp)/, name: 'Dangerous permission' },
        { pattern: /curl\s+.*\|.*sh/, name: 'Pipe to shell download' },
        { pattern: /wget.*\|.*sh/, name: 'Wget pipe to shell' },
        { pattern: /\.\/(\.\.)+/, name: 'Parent directory traversal' },
      ];

      for (const { pattern, name } of forbiddenPatterns) {
        if (pattern.test(command)) {
          return {
            blocked: true,
            reason: `Guardian: Forbidden command pattern detected - ${name}`,
            warnings: [],
          };
        }
      }

      const theatricalPatterns = [/mock/i, /simulat/i, /TODO/i, /FIXME/i, /HACK/i, /stub/i, /fake/i];
      for (const pattern of theatricalPatterns) {
        if (pattern.test(command)) {
          warnings.push(`Theatrical pattern detected: ${pattern.source}`);
        }
      }
    }

    if (toolName === 'write_file') {
      const content = args?.content || '';
      const secretPatterns = [
        /api[_-]?key\s*[=:]\s*['"][a-zA-Z0-9_\-]{20,}['"]/i,
        /secret\s*[=:]\s*['"][a-zA-Z0-9_\-]{20,}['"]/i,
        /password\s*[=:]\s*['"][^'"]{8,}['"]/i,
        /token\s*[=:]\s*['"][a-zA-Z0-9_\-]{20,}['"]/i,
        /aws[_-]?secret/i,
        /bearer\s+[a-zA-Z0-9]/i,
      ];

      for (const pattern of secretPatterns) {
        if (pattern.test(content)) {
          warnings.push('Potential hardcoded secret detected - consider using environment variables');
        }
      }
    }

    return { blocked: false, warnings };
  }

  getGuardian(): Guardian {
    return this.guardian;
  }
}

export default SafetyEnforcer;
