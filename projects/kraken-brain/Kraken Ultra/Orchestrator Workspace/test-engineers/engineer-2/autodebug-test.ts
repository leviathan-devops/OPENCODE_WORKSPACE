interface KnownError {
  code: string;
  name: string;
  patterns: RegExp[];
  category: 'docker' | 'npm' | 'typescript';
  severity: 'critical' | 'high' | 'medium' | 'low';
  autoFixable: boolean;
  manualFix: string[];
}

interface ErrorContext {
  workspacePath: string;
  errorOutput: string;
  command?: string;
  filePath?: string;
}

interface DetectedError {
  error: KnownError;
  match: string;
  confidence: number;
}

const KNOWN_ERRORS: KnownError[] = [
  {
    code: 'DOCKER_VOLUME_PERM',
    name: 'Volume Mount Permission Denied',
    patterns: [/Permission denied.*\.guardian/i, /permission denied.*\/container\/path/i, /EACCES.*volume/i],
    category: 'docker',
    severity: 'high',
    autoFixable: true,
    manualFix: ['Create files inside container, not on host mount', 'Add to Dockerfile: RUN mkdir -p ~/.guardian/protected'],
  },
  {
    code: 'DOCKER_NPM_PERM',
    name: 'npm Install Permission Error',
    patterns: [/EACCES.*mkdir.*node_modules/i, /npm error code EACCES/i, /npm error errno -13/i],
    category: 'docker',
    severity: 'high',
    autoFixable: true,
    manualFix: ['Reorder Dockerfile: npm install before USER command'],
  },
  {
    code: 'DOCKER_COMPOSE_VERSION',
    name: 'Docker Compose Version Obsolete',
    patterns: [/attribute.*version.*is obsolete/i, /version.*obsolete.*ignored/i],
    category: 'docker',
    severity: 'low',
    autoFixable: true,
    manualFix: ['Remove the "version: \'3.8\'" line from docker-compose.yml'],
  },
  {
    code: 'NPM_MISSING_DEP',
    name: 'npm Missing Dependency',
    patterns: [/cannot find module/i, /module not found/i, /ERR_MODULE_NOT_FOUND/i],
    category: 'npm',
    severity: 'high',
    autoFixable: true,
    manualFix: ['Run: npm install <missing-package>'],
  },
  {
    code: 'NPM_INSTALL_FAILED',
    name: 'npm Install Failed',
    patterns: [/npm ERR! code ERESOLVE/i, /npm ERR! peer dep missing/i],
    category: 'npm',
    severity: 'medium',
    autoFixable: true,
    manualFix: ['Run: npm install --force or --legacy-peer-deps'],
  },
  {
    code: 'TS_NODE_MISSING',
    name: 'ts-node Not Found',
    patterns: [/ts-node: No such file or directory/i, /\.bin\/ts-node.*not found/i],
    category: 'typescript',
    severity: 'medium',
    autoFixable: true,
    manualFix: ['Use tsx instead: npx tsx src/cli.ts'],
  },
  {
    code: 'TSC_NOT_FOUND',
    name: 'TypeScript Compiler Not Found',
    patterns: [/tsc: not found/i, /tsc: command not found/i],
    category: 'typescript',
    severity: 'high',
    autoFixable: true,
    manualFix: ['Run: npm install (installs typescript from devDependencies)'],
  },
  {
    code: 'TS_COMPILE_ERROR',
    name: 'TypeScript Compilation Error',
    patterns: [/error TS\d+:/i, /Type.*is not assignable to type/i, /Cannot find name/i],
    category: 'typescript',
    severity: 'high',
    autoFixable: false,
    manualFix: ['Run: npx tsc --noEmit to see all errors', 'Fix type mismatches in reported files'],
  },
];

export class AutoDebugEngine {
  private patternIndex: Array<{ pattern: RegExp; error: KnownError }>;

  constructor() {
    this.patternIndex = [];
    for (const error of KNOWN_ERRORS) {
      for (const pattern of error.patterns) {
        this.patternIndex.push({ pattern, error });
      }
    }
  }

  analyze(output: string): DetectedError[] {
    const detected: DetectedError[] = [];
    const seen = new Set<string>();

    for (const { pattern, error } of this.patternIndex) {
      if (pattern.test(output) && !seen.has(error.code)) {
        seen.add(error.code);
        detected.push({
          error,
          match: output.match(pattern)?.[0] || '',
          confidence: this.calculateConfidence(output, error),
        });
      }
    }

    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return detected.sort((a, b) => {
      const sevDiff = severityOrder[a.error.severity] - severityOrder[b.error.severity];
      return sevDiff !== 0 ? sevDiff : b.confidence - a.confidence;
    });
  }

  generateQuickFixReport(detected: DetectedError[]): string {
    const lines: string[] = [];
    lines.push('╔═══════════════════════════════════════════════════════════════╗');
    lines.push('║  🦈 SHARK AUTO-DEBUG: DETECTED ISSUES                          ║');
    lines.push('╚═══════════════════════════════════════════════════════════════╝');
    lines.push('');

    for (const { error } of detected) {
      const status = error.autoFixable ? '🔧 AUTO-FIXABLE' : '⚠️  MANUAL FIX';
      lines.push(`[${error.code}] ${error.name}`);
      lines.push(`  Status: ${status} | Severity: ${error.severity.toUpperCase()}`);
      
      if (error.autoFixable) {
        lines.push('  ✅ Suggested Fix:');
        for (const step of error.manualFix) {
          lines.push(`     → ${step}`);
        }
      } else {
        lines.push('  📋 Manual Fix Required:');
        for (const step of error.manualFix.slice(0, 2)) {
          lines.push(`     → ${step}`);
        }
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  getPreventionTips(category: 'docker' | 'npm' | 'typescript'): string[] {
    return KNOWN_ERRORS
      .filter(e => e.category === category)
      .flatMap(e => e.manualFix.slice(0, 1));
  }

  private calculateConfidence(output: string, error: KnownError): number {
    const matches = error.patterns.filter(p => p.test(output)).length;
    return Math.min(matches * 0.4, 1);
  }
}

export const analyzeError = (output: string): DetectedError[] => {
  return new AutoDebugEngine().analyze(output);
};
