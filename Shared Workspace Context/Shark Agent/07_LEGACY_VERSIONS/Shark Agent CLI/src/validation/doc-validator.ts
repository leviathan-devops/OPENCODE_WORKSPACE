const THEATRICAL_DOC_PATTERNS = [
  /this (would|should|could) work/i,
  /in (a )?real (environment|scenario)/i,
  /for (demonstration|example) purposes/i,
  /note: this (is|was) (not|never) (implemented|built)/i,
  /TODO: implement/i,
  /FIXME:/i,
  /not yet implemented/i,
  /placeholder/i
]

export function validateDocumentation(content: string): { isValid: boolean; issues: string[] } {
  const issues: string[] = []
  
  for (const pattern of THEATRICAL_DOC_PATTERNS) {
    if (pattern.test(content)) {
      issues.push(`Theatrical documentation pattern: ${pattern.source}`)
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues
  }
}

export function checkCodeReferences(doc: string, codeFiles: Map<string, string>): { isValid: boolean; issues: string[] } {
  const issues: string[] = []
  const codeRefPattern = /`([^`]+)`/g
  
  let match
  while ((match = codeRefPattern.exec(doc)) !== null) {
    const ref = match[1]
    let found = false
    
    for (const [, content] of codeFiles) {
      if (content.includes(ref)) {
        found = true
        break
      }
    }
    
    if (!found && ref.includes('(')) {
      issues.push(`Code reference not found: ${ref}`)
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues
  }
}
