// Single-word naming enforcement
const MULTI_WORD_PATTERNS = [
  // CamelCase variables with 3+ words
  /\b(const|let|var)\s+[a-z]+[A-Z][a-z]+[A-Z][a-z]+\b/gi,
  
  // Function names with 3+ words
  /\bfunction\s+[a-z]+[A-Z][a-z]+[A-Z][a-z]+/gi,
  
  // Method names with 3+ words
  /\.\s*[a-z]+[A-Z][a-z]+[A-Z][a-z]+\s*\(/gi,
  
  // Parameter names with 3+ words
  /\(\s*[a-z]+[A-Z][a-z]+[A-Z][a-z]+\s*[,)]/gi,
  
  // Property names with 3+ words
  /[a-z]+[A-Z][a-z]+[A-Z][a-z]+\s*:/gi
];

// Allowed multi-word patterns (technical terms)
const ALLOWED_MULTI_WORD = [
  'XMLHttpRequest',
  'HTMLElement',
  'HTMLDocument',
  'SVGElement',
  'URLSearchParams',
  'FormData',
  'FileReader',
  'WebSocket',
  'IntersectionObserver',
  'MutationObserver',
  'ResizeObserver',
  'AbortController',
  'ReadableStream',
  'WritableStream',
  'TransformStream'
];

export async function enforceStyleGuide(params: {
  tool: string;
  args: any;
}): Promise<{ allowed: boolean; reason?: string }> {
  
  // Only check write/edit operations with code
  if (params.tool !== 'write' && params.tool !== 'edit') {
    return { allowed: true };
  }
  
  const content = params.args.content || params.args.newString || '';
  
  if (!content || content.length === 0) {
    return { allowed: true };
  }
  
  // Skip non-code files
  if (params.args.filePath) {
    const ext = params.args.filePath.split('.').pop()?.toLowerCase();
    const nonCodeExts = ['md', 'txt', 'json', 'yaml', 'yml', 'toml', 'ini', 'env'];
    if (ext && nonCodeExts.includes(ext)) {
      return { allowed: true };
    }
  }
  
  // Find all multi-word identifiers
  const violations: string[] = [];
  
  for (const pattern of MULTI_WORD_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      for (const match of matches) {
        // Extract the identifier
        const identifier = match.replace(/\b(const|let|var|function|\.|\(|:)\s*/gi, '').trim();
        
        // Skip if it's an allowed technical term
        if (ALLOWED_MULTI_WORD.some(allowed => identifier.includes(allowed))) {
          continue;
        }
        
        // Check if it has 3+ words (3+ capital letters)
        const capitals = identifier.match(/[A-Z]/g) || [];
        if (capitals.length >= 3) {
          violations.push(identifier);
        }
      }
    }
  }
  
  if (violations.length > 0) {
    const uniqueViolations = [...new Set(violations)].slice(0, 5); // Show first 5
    return {
      allowed: false,
      reason: `🦈 STYLE GUIDE VIOLATION: Use single-word names. Found overly complex names: ${uniqueViolations.join(', ')}. Keep it simple.`
    };
  }
  
  return { allowed: true };
}
