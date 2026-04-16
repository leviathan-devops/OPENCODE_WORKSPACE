const MOCK_PATTERNS = [
  /I would run/i,
  /should work/i,
  /in a real environment/i,
  /mock mode/i,
  /simulating/i,
  /pretend to/i,
  /hypothetically/i,
  /for demonstration/i
]

export function detectMockMode(content: string): { isMock: boolean; reason?: string } {
  for (const pattern of MOCK_PATTERNS) {
    if (pattern.test(content)) {
      return { isMock: true, reason: `Mock mode pattern detected: ${pattern.source}` }
    }
  }
  return { isMock: false }
}

export function extractContent(args: unknown): string {
  if (typeof args === 'string') return args
  if (typeof args === 'object' && args !== null) {
    const obj = args as Record<string, unknown>
    if (obj.content) return String(obj.content)
    if (obj.code) return String(obj.code)
    if (obj.script) return String(obj.script)
    if (obj.command) return String(obj.command)
    if (obj.source) return String(obj.source)
    if (obj.body) return String(obj.body)
    if (obj.text) return String(obj.text)
    if (obj.message) return String(obj.message)
  }
  return ''
}

export function validateToolArgs(tool: string, args: unknown): { isMock: boolean; reason?: string } {
  const content = extractContent(args)
  if (content) {
    return detectMockMode(content)
  }
  return { isMock: false }
}
