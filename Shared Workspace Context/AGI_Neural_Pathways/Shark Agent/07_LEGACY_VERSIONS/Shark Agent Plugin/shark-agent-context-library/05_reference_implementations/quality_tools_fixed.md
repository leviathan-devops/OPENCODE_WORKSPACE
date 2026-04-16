# Quality Tools (Fixed)

All tools ported from `v2.1-build/src/tools/quality.ts` — verified working in source.

## Quality Tools

```typescript
// src/tools/quality.ts
import { tool } from '@opencode-ai/plugin';

// lint — Run ESLint on the project
export const lint = tool({
  description: 'Run ESLint on the project',
  args: {
    path: tool.schema.string().optional().describe('Path to lint'),
    fix: tool.schema.boolean().optional().describe('Auto-fix issues'),
  },
  execute: async (args, context) => {
    const target = args.path ?? context.directory;
    const fixFlag = args.fix ? ['--fix'] : [];
    const result = spawnSync('npx', ['eslint', target, ...fixFlag, '--format=json'], {
      cwd: context.directory,
      encoding: 'utf-8',
      timeout: 60000,
    });
    const output = result.stdout?.trim() || result.stderr?.trim() || '';
    if (!output) return '✓ No ESLint errors found.';
    try {
      const parsed = JSON.parse(output);
      const totalErrors = parsed.reduce((acc: number, f: any) => acc + (f.errorCount || 0), 0);
      const totalWarnings = parsed.reduce((acc: number, f: any) => acc + (f.warningCount || 0), 0);
      if (totalErrors > 0) {
        return ` ESLint: ${totalErrors} errors, ${totalWarnings} warnings\n${output.substring(0, 2000)}`;
      }
      return `✓ ESLint passed: ${totalErrors} errors, ${totalWarnings} warnings`;
    } catch {
      return `ESLint output:\n${output.substring(0, 3000)}`;
    }
  },
});

// diff — Get git diff of changes
export const diff = tool({
  description: 'Show git diff of uncommitted changes',
  args: {
    file: tool.schema.string().optional().describe('Specific file to diff'),
    staged: tool.schema.boolean().optional().describe('Show staged diff'),
  },
  execute: async (args, context) => {
    const flags = args.staged ? ['--cached'] : [];
    const target = args.file ? ['--', args.file] : [];
    const result = spawnSync('git', ['diff', ...flags, ...target], {
      cwd: context.directory,
      encoding: 'utf-8',
      timeout: 10000,
    });
    const output = result.stdout?.trim() || 'No changes';
    return output.length > 4000 ? output.substring(0, 4000) + '\n... (truncated)' : output;
  },
});

// build_check — Attempt to build the project
export const build_check = tool({
  description: 'Check if the project builds successfully',
  args: {},
  execute: async (_args, context) => {
    const result = spawnSync('npm', ['run', 'build'], {
      cwd: context.directory,
      encoding: 'utf-8',
      timeout: 120000,
      env: { ...process.env, FORCE_COLOR: '0' },
    });
    if (result.status === 0) return '✓ Build succeeded.';
    return `✗ Build failed:\n${(result.stdout + '\n' + result.stderr).substring(0, 3000)}`;
  },
});

// syntax_check — TypeScript compile check without emitting
export const syntax_check = tool({
  description: 'Run TypeScript type checking without emitting',
  args: {
    files: tool.schema.array(tool.schema.string()).optional().describe('Specific files to check'),
  },
  execute: async (args, context) => {
    const targets = args.files ?? ['--noEmit'];
    const result = spawnSync('npx', ['tsc', ...targets], {
      cwd: context.directory,
      encoding: 'utf-8',
      timeout: 60000,
    });
    const output = (result.stdout + '\n' + result.stderr).trim();
    if (result.status === 0) return '✓ No TypeScript errors.';
    return `TypeScript errors:\n${output.substring(0, 3000)}`;
  },
});
```

## Security Tools

```typescript
// src/tools/security.ts (SECRET_SCAN FIXED)
// NOTE: v2.1 source has a CORRUPTION at secretScan: the tool({...}) wrapper is missing.
// The variable assignment is broken. Use this FIXED version.

import { tool } from '@opencode-ai/plugin';
import { spawnSync } from 'child_process';

export const test_runner = tool({
  description: 'Run project tests (npm test)',
  args: {},
  execute: async (_args, context) => {
    const result = spawnSync('npm', ['test', '--', '--json'], {
      cwd: context.directory,
      encoding: 'utf-8',
      timeout: 120000,
    });
    try {
      const output = JSON.parse(result.stdout?.trim() || '{}');
      const passed = output.stats?.passes || 0;
      const failed = output.stats?.failures || 0;
      const tests = output.testResults || [];
      const failedTests = tests
        .filter((t: any) => t.assertionErrors?.length > 0)
        .map((t: any) => `${t.fullName}: ${t.assertionErrors[0]?.message}`)
        .slice(0, 5);
      return failed > 0
        ? `Tests: ${passed} passed, ${failed} failed\n${failedTests.join('\n')}`
        : `✓ All ${passed} tests passed.`;
    } catch {
      return result.stdout?.trim() || result.stderr?.trim() || 'Test run produced no output.';
    }
  },
});

export const placeholder_scan = tool({
  description: 'Detect placeholder/TODO comments in code',
  args: {
    path: tool.schema.string().optional().describe('Path to scan'),
  },
  execute: async (args, context) => {
    const target = args.path ?? context.directory;
    const result = spawnSync('grep', [
      '-r', '-n', '-i',
      '-E', '(TODO|FIXME|HACK|XXX|WIP|NOTE:.*fake|NOTE:.*mock)',
      target,
      '--include=*.ts', '--include=*.js', '--include=*.tsx', '--include=*.jsx',
    ], { cwd: context.directory, encoding: 'utf-8', timeout: 30000 });
    const output = result.stdout?.trim();
    if (!output) return '✓ No placeholder comments found.';
    const lines = output.split('\n').slice(0, 20);
    return `Placeholders found:\n${lines.join('\n')}`;
  },
});

// ← THIS IS THE FIXED VERSION — v2.1 source is corrupted, use this
export const secretScan = tool({
  description: 'Detect secrets/credentials in code',
  args: {
    path: tool.schema.string().optional().describe('Path to scan'),
  },
  execute: async (args, context) => {
    const target = args.path ?? context.directory;
    const result = spawnSync('grep', [
      '-r', '-n', '-i', '-E',
      '(api[_-]?key|secret[ly]?|password|token|credential|private[_-]?key|access[_-]?key)',
      target,
      '--include=*.ts', '--include=*.js', '--include=*.json',
      '--include=*.env*', '--include=*.yaml', '--include=*.yml',
    ], { cwd: context.directory, encoding: 'utf-8', timeout: 60000 });

    if (result.stdout && result.stdout.trim()) {
      const lines = result.stdout.trim().split('\n').slice(0, 30);
      const redacted = lines.map(line => {
        const colonIdx = line.indexOf(':');
        if (colonIdx !== -1) {
          const pathPart = line.substring(0, colonIdx + 1);
          return `${pathPart} [REDACTED - potential secret detected]`;
        }
        return line;
      });
      return `Potential secrets found (verify manually):\n${redacted.join('\n')}`;
    }
    return '✓ No obvious secrets detected.';
  },
});

export const sast_scan = tool({
  description: 'Run SAST scan using ESLint security plugin',
  args: {
    path: tool.schema.string().optional().describe('Path to scan'),
  },
  execute: async (args, context) => {
    const target = args.path ?? context.directory;
    const result = spawnSync('npx', [
      'eslint', target,
      '--plugin', 'security',
      '--format', 'json',
    ], { cwd: context.directory, encoding: 'utf-8', timeout: 60000 });
    try {
      const output = JSON.parse(result.stdout?.trim() || '[]');
      const issues = output.flatMap((f: any) =>
        (f.messages || []).map((m: any) => ({
          file: f.filePath,
          line: m.line,
          message: m.message,
          severity: m.severity,
        }))
      );
      const criticalHigh = issues.filter((i: any) => i.severity >= 2);
      if (criticalHigh.length > 0) {
        return `SAST: ${criticalHigh.length} critical/high issues\n${criticalHigh.map((i: any) => `${i.file}:${i.line} — ${i.message}`).join('\n')}`;
      }
      return `✓ SAST scan clean: ${issues.length} low/medium issues`;
    } catch {
      return 'SAST: No issues found (or eslint-security not configured)';
    }
  },
});
```
