const MOCK_MODE_PATTERNS = [
  /I would run/i,
  /should work/i,
  /in a real environment/i,
  /mock mode/i,
  /simulating/i,
  /I would test/i,
  /should pass/i,
  /theoretically/i,
  /in production/i,
  /if this were real/i,
  /hypothetically/i,
  /assume that/i,
  /let's pretend/i,
  /for demonstration/i,
  /I would check/i,
  /should verify/i,
  /I'd expect/i,
  /probably/i,
  /might work/i,
  /could work/i
];

export async function detectMockMode(args: any): Promise<{ allowed: boolean; reason?: string }> {
  const content = extractContent(args);
  
  if (!content) {
    return { allowed: true };
  }
  
  for (const pattern of MOCK_MODE_PATTERNS) {
    if (pattern.test(content)) {
      return {
        allowed: false,
        reason: `🦈 MOCK MODE DETECTED: Pattern "${pattern.source}" found. Shark requires actual execution, not simulation or speculation.`
      };
    }
  }
  
  return { allowed: true };
}

function extractContent(args: any): string | null {
  // Extract content from various tool arguments
  if (args.content) return args.content;
  if (args.newString) return args.newString;
  if (args.message) return args.message;
  if (args.prompt) return args.prompt;
  if (args.command) return args.command;
  
  // Check nested objects
  if (typeof args === 'object') {
    return JSON.stringify(args);
  }
  
  return null;
}
