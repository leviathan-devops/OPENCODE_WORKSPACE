const TECHNICAL_TERMS = new Set([
  'XMLHttpRequest',
  'HTMLElement',
  'SVGElement',
  'CSSStyleDeclaration',
  'HTMLCollection',
  'NodeList',
  'FileSystem',
  'FileReader',
  'EventTarget',
  'querySelector',
  'getElementById',
  'addEventListener'
])

const MAX_WORDS = 2

function countWords(identifier: string): number {
  const words = identifier
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(/(?=[A-Z])|[_\s]/)
    .filter(w => w.length > 0)
  return words.length
}

export function enforceStyleGuide(code: string): { isValid: boolean; issues: string[] } {
  const issues: string[] = []
  const identifierPattern = /\b(const|let|var|function|class|interface|type)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g
  
  let match
  while ((match = identifierPattern.exec(code)) !== null) {
    const identifier = match[2]
    
    if (TECHNICAL_TERMS.has(identifier)) {
      continue
    }
    
    const wordCount = countWords(identifier)
    
    if (wordCount > MAX_WORDS) {
      issues.push(`Multi-word identifier '${identifier}' has ${wordCount} words (max: ${MAX_WORDS})`)
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues
  }
}

export function validateCodeStyle(code: string): { isValid: boolean; reason?: string } {
  const result = enforceStyleGuide(code)
  
  if (!result.isValid) {
    return {
      isValid: false,
      reason: `Style guide violations:\n${result.issues.join('\n')}`
    }
  }
  
  return { isValid: true }
}
