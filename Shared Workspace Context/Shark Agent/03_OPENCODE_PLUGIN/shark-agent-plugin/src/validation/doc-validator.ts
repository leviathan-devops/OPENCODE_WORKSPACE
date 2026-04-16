import * as fs from 'fs';
import * as path from 'path';

const THEATRICAL_DOC_PATTERNS = [
  /This (file|module|component|function) implements a/i,
  /It should be noted that/i,
  /a future version could/i,
  /will be implemented in/i,
  /TODO:/i,
  /FIXME:/i,
  /HACK:/i,
  /architecture should be/i,
  /for now/i
];

export async function validateDocumentation(params: {
  tool: string;
  args: any;
}): Promise<{ allowed: boolean; reason?: string }> {
  if (params.tool !== 'write' && params.tool !== 'edit') {
    return { allowed: true };
  }
  
  const filePath = params.args.filePath;
  if (!filePath) {
    return { allowed: true };
  }
  
  if (filePath.endsWith('.md')) {
    return { allowed: true };
  }
  
  try {
    if (!fs.existsSync(filePath)) {
      return { allowed: true };
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    for (const pattern of THEATRICAL_DOC_PATTERNS) {
      if (pattern.test(content)) {
        return { 
          allowed: false, 
          reason: `🦈 Theatrical documentation detected: "${pattern.source}"`
        };
      }
    }
    
    return { allowed: true };
  } catch (error: any) {
    return { 
      allowed: false, 
      reason: `🦈 Failed to validate documentation: ${error.message}`
    };
  }
}
