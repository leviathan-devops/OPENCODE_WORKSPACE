export interface TheatricalCodeIssue {
  type: 'unused_function' | 'unreachable_code' | 'overly_complex' | 'excessive_abstraction'
  description: string
  line?: number
}

export function detectTheatricalCode(source: string): { isTheatrical: boolean; issues: TheatricalCodeIssue[] } {
  const issues: TheatricalCodeIssue[] = []
  const lines = source.split('\n')
  
  const functionDefPattern = /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s*)?\(|const\s+(\w+)\s*=\s*function)/g
  const functionNames = new Set<string>()
  const calledFunctions = new Set<string>()
  
  let match
  while ((match = functionDefPattern.exec(source)) !== null) {
    const funcName = match[1] || match[2] || match[3]
    if (funcName) {
      functionNames.add(funcName)
    }
  }
  
  const callPattern = /(?<![.\w])(\w+)\s*\((?!\s*\))/g
  const linesWithoutDefs = lines.filter(line => !line.trim().startsWith('function') && !line.trim().startsWith('const ')).join('\n')
  
  while ((match = callPattern.exec(linesWithoutDefs)) !== null) {
    calledFunctions.add(match[1])
  }
  
  for (const funcName of functionNames) {
    if (!calledFunctions.has(funcName)) {
      const hasExport = source.includes(`export ${funcName}`) || source.includes(`export { ${funcName}`) || source.includes(`export function ${funcName}`)
      if (!hasExport) {
        issues.push({
          type: 'unused_function',
          description: `Function '${funcName}' is defined but never called or exported`,
        })
      }
    }
  }
  
  let maxDepth = 0
  let currentDepth = 0
  for (const line of lines) {
    const openBraces = (line.match(/{/g) || []).length
    const closeBraces = (line.match(/}/g) || []).length
    currentDepth += openBraces - closeBraces
    maxDepth = Math.max(maxDepth, currentDepth)
  }
  
  if (maxDepth > 4) {
    issues.push({
      type: 'overly_complex',
      description: `Nesting depth ${maxDepth} exceeds maximum (4 levels)`,
    })
  }
  
  return {
    isTheatrical: issues.length > 0,
    issues
  }
}
