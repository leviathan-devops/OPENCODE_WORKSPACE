# AutoDebug Engine Reference

From `shark-frankenstein/src/debug/AutoDebug.ts`.

## AutoDebugEngine

```typescript
import { spawnSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

interface DebugSession {
  error: string;
  stack?: string;
  file?: string;
  line?: number;
  fixed: boolean;
  attempts: FixAttempt[];
}

interface FixAttempt {
  index: number;
  fixType: 'syntax' | 'import' | 'type' | 'null-check' | 'undefined-check' | 'logic';
  file?: string;
  originalCode?: string;
  fixedCode?: string;
  command?: string;
  applied: boolean;
  result?: string;
}

interface DebugConfig {
  maxAttempts?: number;
  autoApply?: boolean;
  backupDir?: string;
}

const DEFAULT_CONFIG: Required<DebugConfig> = {
  maxAttempts: 3,
  autoApply: false,
  backupDir: '.shark/backups',
};

export class AutoDebugEngine {
  private config: Required<DebugConfig>;

  constructor(config: DebugConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ── Entry Point ──────────────────────────────────────────

  async debug(errorMessage: string, contextDirectory: string): Promise<DebugSession> {
    const session: DebugSession = {
      error: errorMessage,
      fixed: false,
      attempts: [],
    };

    // Parse the error to extract file, line, and error type
    const parsed = this.parseError(errorMessage);
    Object.assign(session, parsed);

    // Try fixes in order of specificity
    const fixOrder: Array<'syntax' | 'import' | 'type' | 'null-check' | 'undefined-check'> = [
      'syntax',
      'import',
      'type',
      'undefined-check',
      'null-check',
    ];

    for (const fixType of fixOrder) {
      if (session.fixed) break;
      if (this.config.maxAttempts && session.attempts.length >= this.config.maxAttempts) break;

      const attempt = await this.applyFix(fixType, session, contextDirectory);
      session.attempts.push(attempt);

      if (attempt.applied && attempt.result === 'pass') {
        session.fixed = true;
      }
    }

    return session;
  }

  // ── Error Parsing ─────────────────────────────────────────

  private parseError(errorMessage: string): Partial<DebugSession> {
    const result: Partial<DebugSession> = {};

    // TypeScript/ESLint style: path/to/file.ts:line:col — error message
    const tsMatch = errorMessage.match(/([^\s:\\(]+):(\d+):\d+\s*[-—]\s*(.+)/);
    if (tsMatch) {
      result.file = tsMatch[1];
      result.line = parseInt(tsMatch[2], 10);
      result.stack = errorMessage;
      return result;
    }

    // JavaScript runtime: path/to/file.js:line
    const jsMatch = errorMessage.match(/(.+):(\d+):\d+$/m);
    if (jsMatch) {
      result.file = jsMatch[1];
      result.line = parseInt(jsMatch[2], 10);
      result.stack = errorMessage;
      return result;
    }

    // Generic: "Cannot read property 'x' of undefined"
    const nullMatch = errorMessage.match(/Cannot read property ['"](.+?)['"] of (undefined|null)/);
    if (nullMatch) {
      result.stack = errorMessage;
      return result;
    }

    return { stack: errorMessage };
  }

  // ── Fix Strategies ───────────────────────────────────────

  private async applyFix(
    fixType: 'syntax' | 'import' | 'type' | 'null-check' | 'undefined-check',
    session: DebugSession,
    contextDirectory: string,
  ): Promise<FixAttempt> {
    const attempt: FixAttempt = { index: session.attempts.length, fixType };

    if (!session.file) {
      attempt.result = 'skip';
      return attempt;
    }

    try {
      const filePath = path.join(contextDirectory, session.file);
      if (!fs.existsSync(filePath)) {
        attempt.result = 'skip';
        return attempt;
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      switch (fixType) {
        case 'syntax': {
          // Try running tsc --noEmit to get precise error location
          const tscResult = spawnSync('npx', ['tsc', '--noEmit'], {
            cwd: contextDirectory,
            encoding: 'utf-8',
            timeout: 30000,
          });
          if (tscResult.status === 0) {
            attempt.result = 'pass';
          } else {
            attempt.result = 'fail';
            attempt.command = 'tsc --noEmit';
          }
          break;
        }

        case 'import': {
          // Check for missing imports by comparing tsc errors to actual imports
          const missingImports = this.findMissingImports(tscResult.stderr || '', content);
          if (missingImports.length > 0) {
            attempt.file = session.file;
            attempt.originalCode = content;
            // Add missing imports to the file
            const fixed = this.addImports(content, missingImports);
            if (this.config.autoApply) {
              fs.writeFileSync(filePath, fixed);
              attempt.applied = true;
            }
            attempt.fixedCode = fixed;
            attempt.result = 'applied';
          } else {
            attempt.result = 'skip';
          }
          break;
        }

        case 'undefined-check': {
          // Add null/undefined checks at known problem lines
          if (session.line && lines[session.line - 1]) {
            const problemLine = lines[session.line - 1];
            attempt.file = session.file;
            attempt.originalCode = problemLine;
            const guardedLine = this.addUndefinedGuard(problemLine);
            lines[session.line - 1] = guardedLine;
            const fixed = lines.join('\n');
            if (this.config.autoApply) {
              fs.writeFileSync(filePath, fixed);
              attempt.applied = true;
            }
            attempt.fixedCode = fixed;
            attempt.result = 'applied';
          } else {
            attempt.result = 'skip';
          }
          break;
        }

        default:
          attempt.result = 'skip';
      }
    } catch (err) {
      attempt.result = 'error';
    }

    return attempt;
  }

  private findMissingImports(errorOutput: string, fileContent: string): string[] {
    const missing: string[] = [];
    // Match "Cannot find name 'X'. Did you forget to import it?"
    const matches = errorOutput.matchAll(/Cannot find name ['"](.+?)['"].*Did you forget to import it\?/g);
    for (const match of matches) {
      const name = match[1];
      if (!fileContent.includes(`import`) || !fileContent.includes(name)) {
        missing.push(name);
      }
    }
    return [...new Set(missing)];
  }

  private addImports(content: string, imports: string[]): string {
    const importLines = imports.map((name) => `import { ${name} } from './module';`);
    // Try to add after the last import
    const lastImportMatch = content.match(/^import .+;$/m);
    if (lastImportMatch) {
      const idx = content.lastIndexOf(lastImportMatch[0]);
      return content.slice(0, idx + lastImportMatch[0].length) + '\n' + importLines.join('\n') + content.slice(idx + lastImportMatch[0].length);
    }
    // Otherwise prepend at the top
    return importLines.join('\n') + '\n' + content;
  }

  private addUndefinedGuard(line: string): string {
    // Simple heuristic: add optional chaining if accessing property
    const match = line.match(/^(\s*)(.+)\.(\w+)\s*=/);
    if (match) {
      return `${match[1]}const safe_${match[3]} = ${match[2]}?.${match[3]};\n${line.replace(`${match[2]}.${match[3]}`, `safe_${match[3]}`)}`;
    }
    return line;
  }

  // ── Report ────────────────────────────────────────────────

  formatSession(session: DebugSession): string {
    if (session.fixed) {
      return `✓ AutoDebug: Fixed after ${session.attempts.filter(a => a.applied).length} attempt(s)`;
    }
    return `✗ AutoDebug: Could not fix. Tried ${session.attempts.length} strategies. Last: ${session.attempts[session.attempts.length - 1]?.fixType}`;
  }
}
```

## Usage as Tool

```typescript
export const auto_debug = tool({
  description: 'Auto-fix common build/runtime errors using mechanical pattern matching',
  args: {
    error: tool.schema.string().describe('Error message or stack trace to fix'),
    auto_apply: tool.schema.boolean().optional().default(false).describe('Apply fixes automatically'),
  },
  execute: async (args, context) => {
    const engine = new AutoDebugEngine({
      autoApply: args.auto_apply,
      maxAttempts: 3,
      backupDir: join(context.directory, '.shark/backups'),
    });
    const session = await engine.debug(args.error, context.directory);
    return engine.formatSession(session);
  },
});
```
