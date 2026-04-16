const THEATRICAL_PATTERNS = [
  // Overly complex abstractions
  /class.*Abstract.*Factory/i,
  /class.*Manager.*Manager/i,
  /interface.*Interface/i,
  /function.*wrapper.*wrapper/i,
  
  // Unused code indicators
  /\/\/ TODO/i,
  /\/\/ FIXME/i,
  /\/\/ HACK/i,
  /\/\/ NOTE:/i,
  
  // Over-engineering
  /export interface.*Options.*Options/i,
  /class.*Builder.*Builder.*Builder/i,
  
  // Theatrical comments
  /\/\/ This is a/i,
  /\/\/ The purpose of/i,
  /\/\/ In order to/i,
  /\/\/ As part of/i
];

const MAX_FILE_SIZE = 50000; // 50KB - suspiciously large files
const MAX_FUNCTION_LENGTH = 100; // Lines - overly complex functions
const MAX_NESTING_DEPTH = 4; // Nesting levels - overly complex code

export async function detectTheatricalCode(params: {
  tool: string;
  args: any;
}): Promise<{ allowed: boolean; reason?: string }> {
  
  // Only check write/edit operations
  if (params.tool !== 'write' && params.tool !== 'edit') {
    return { allowed: true };
  }
  
  const content = params.args.content || params.args.newString || '';
  
  if (!content || content.length === 0) {
    return { allowed: true };
  }
  
  // Check for theatrical patterns
  for (const pattern of THEATRICAL_PATTERNS) {
    if (pattern.test(content)) {
      return {
        allowed: false,
        reason: `🦈 THEATRICAL CODE DETECTED: Pattern "${pattern.source}" found. Write actual working code, not theatrical abstractions.`
      };
    }
  }
  
  // Check file size
  if (content.length > MAX_FILE_SIZE) {
    return {
      allowed: false,
      reason: `🦈 THEATRICAL CODE DETECTED: File size ${content.length} bytes exceeds maximum ${MAX_FILE_SIZE}. Break into smaller, focused modules.`
    };
  }
  
  // Check function length
  const lines = content.split('\n');
  let functionStart = -1;
  let functionLines = 0;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/^\s*(export\s+)?(async\s+)?function\s+/)) {
      if (functionStart >= 0 && functionLines > MAX_FUNCTION_LENGTH) {
        return {
          allowed: false,
          reason: `🦈 THEATRICAL CODE DETECTED: Function at line ${functionStart + 1} has ${functionLines} lines (max ${MAX_FUNCTION_LENGTH}). Break into smaller functions.`
        };
      }
      functionStart = i;
      functionLines = 0;
    } else if (functionStart >= 0) {
      functionLines++;
    }
  }
  
  // Check last function
  if (functionStart >= 0 && functionLines > MAX_FUNCTION_LENGTH) {
    return {
      allowed: false,
      reason: `🦈 THEATRICAL CODE DETECTED: Function at line ${functionStart + 1} has ${functionLines} lines (max ${MAX_FUNCTION_LENGTH}). Break into smaller functions.`
    };
  }
  
  // Check nesting depth
  let maxNesting = 0;
  let currentNesting = 0;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.endsWith('{') || trimmed.endsWith('(')) {
      currentNesting++;
      maxNesting = Math.max(maxNesting, currentNesting);
    }
    if (trimmed.startsWith('}') || trimmed.startsWith(')')) {
      currentNesting = Math.max(0, currentNesting - 1);
    }
  }
  
  if (maxNesting > MAX_NESTING_DEPTH) {
    return {
      allowed: false,
      reason: `🦈 THEATRICAL CODE DETECTED: Nesting depth ${maxNesting} exceeds maximum ${MAX_NESTING_DEPTH}. Simplify the code structure.`
    };
  }
  
  return { allowed: true };
}
