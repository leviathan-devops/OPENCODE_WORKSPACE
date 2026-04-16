import * as path from 'path';

export async function preventRepoRootTests(params: {
  tool: string;
  args: any;
  sessionID: string;
}): Promise<{ allowed: boolean; reason?: string }> {
  
  // Only check bash/test commands
  if (params.tool !== 'bash') {
    return { allowed: true };
  }
  
  const command = params.args.command || params.args.cmd || '';
  
  // Check for test execution from repo root
  const testPatterns = [
    /npm\s+test/,
    /yarn\s+test/,
    /bun\s+test/,
    /jest/,
    /mocha/,
    /vitest/,
    /pytest/,
    /go\s+test/
  ];
  
  const isTestCommand = testPatterns.some(pattern => pattern.test(command));
  
  if (!isTestCommand) {
    return { allowed: true };
  }
  
  // Check if running from repo root (no workdir specified or workdir is root)
  const workdir = params.args.workdir || process.cwd();
  const projectRoot = findProjectRoot(workdir);
  
  if (workdir === projectRoot) {
    return {
      allowed: false,
      reason: `🦈 REPO ROOT TEST BLOCKED: Running tests from repository root is not allowed. Use 'workdir' parameter to specify package directory (e.g., packages/opencode). Tests should run from package directories, not repo root.`
    };
  }
  
  return { allowed: true };
}

function findProjectRoot(dir: string): string {
  // Look for common project root indicators
  const rootIndicators = ['package.json', 'Cargo.toml', 'go.mod', 'pom.xml', 'build.gradle'];
  
  let current = dir;
  while (current !== '/') {
    const hasRootIndicator = rootIndicators.some(indicator => {
      try {
        require('fs').existsSync(path.join(current, indicator));
        return true;
      } catch {
        return false;
      }
    });
    
    if (hasRootIndicator) {
      return current;
    }
    
    current = path.dirname(current);
  }
  
  return dir;
}
