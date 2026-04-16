import { DerailmentContext, DerailmentResult } from '../types/derailment';
import { L5_5_SIMPLIFICATION_PATTERNS } from '../patterns/derailment-patterns';

export function checkL5Simplification(context: DerailmentContext): DerailmentResult | null {
  const textToCheck = buildTextToCheck(context);
  
  for (const pattern of L5_5_SIMPLIFICATION_PATTERNS.patterns) {
    const match = pattern.test(textToCheck);
    if (match) {
      return {
        blocked: true,
        layer: 5,
        category: L5_5_SIMPLIFICATION_PATTERNS.category,
        matchedPattern: pattern.source,
        agentStatement: textToCheck,
        response: L5_5_SIMPLIFICATION_PATTERNS.response,
        severity: L5_5_SIMPLIFICATION_PATTERNS.severity,
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
