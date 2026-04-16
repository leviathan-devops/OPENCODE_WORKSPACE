export function detectRepoRootTests(args: unknown): { isRepoRoot: boolean; reason?: string } {
  const cmd = typeof args === 'object' && args !== null 
    ? ((args as Record<string, unknown>).command || (args as Record<string, unknown>).args)
    : null
    
  if (typeof cmd === 'string') {
    const testPatterns = [
      /\b(npm|yarn|pnpm|bun)\s+test\b/,
      /\b(npm|yarn|pnpm|bun)\s+run\s+test\b/,
      /\bjest\b/,
      /\bvitest\b/,
      /\bmocha\b/
    ]
    
    for (const pattern of testPatterns) {
      if (pattern.test(cmd)) {
        return { 
          isRepoRoot: true, 
          reason: 'Tests must be run from package directory using workdir parameter, not repo root' 
        }
      }
    }
  }
  
  return { isRepoRoot: false }
}
