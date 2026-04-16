export interface ParseResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  rawText?: string;
}

export function parseJsonOutput<T = unknown>(output: string): ParseResult<T> {
  const trimmed = output.trim();

  if (!trimmed) {
    return { success: false, error: 'Empty output' };
  }

  try {
    const data = JSON.parse(trimmed);
    return { success: true, data };
  } catch {
    return { success: true, data: trimmed as T, rawText: trimmed };
  }
}

export function extractGeminiResponse(output: string): ParseResult {
  const parsed = parseJsonOutput(output);

  if (parsed.success && parsed.data && typeof parsed.data === 'object') {
    const obj = parsed.data as Record<string, unknown>;
    if (obj.response) {
      return { success: true, data: obj.response };
    }
    return { success: true, data: obj };
  }

  return parsed;
}

export function extractQwenResponse(output: string): ParseResult {
  const parsed = parseJsonOutput(output);

  if (parsed.success && parsed.data && typeof parsed.data === 'object') {
    const obj = parsed.data as Record<string, unknown>;
    if (obj.response) {
      return { success: true, data: obj.response };
    }
    return { success: true, data: obj };
  }

  return parsed;
}
