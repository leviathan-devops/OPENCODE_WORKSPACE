import { DerailmentContext, DerailmentResult } from '../types/derailment';
import { L5_8_UNDERMINING_PATTERNS } from '../patterns/derailment-patterns';

export function checkL5Undermining(context: DerailmentContext): DerailmentResult | null {
  const textToCheck = buildTextToCheck(context);
  
  for (const pattern of L5_8_UNDERMINING_PATTERNS.patterns) {
    const match = pattern.test(textToCheck);
    if (match) {
      return {
        blocked: true,
        layer: 8,
        category: L5_8_UNDERMINING_PATTERNS.category,
        matchedPattern: pattern.source,
        agentStatement: textToCheck,
        response: L5_8_UNDERMINING_PATTERNS.response.replace('{statement}', textToCheck),
        severity: L5_8_UNDERMINING_PATTERNS.severity,
        timestamp: Date.now(),
      };
    }
  }
  
  return null;
}

function buildTextToCheck(context: DerailmentContext): string {
  const parts: string[] = [];
  
  if (context.agentMessage) parts.push(context.agentMessage);
  if (context.toolArgs) {
    const argsStr = JSON.stringify(context.toolArgs);
    if (argsStr) parts.push(argsStr);
  }
  if (context.output) parts.push(context.output);
  
  return parts.join(' ');
}
