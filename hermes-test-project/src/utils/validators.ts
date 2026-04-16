// TODO: Write unit tests for this module

export function validateInput(data: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (data === null || data === undefined) {
    errors.push('Input cannot be null');
  }
  return { valid: errors.length === 0, errors };
}

export function sanitizeQuery(query: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === 'string') {
      sanitized[key] = value.replace(/[;'"]/g, '');
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}
