# codesearch

Search and get relevant code context using Exa Code API.

## Tool Definition

**Tool Name:** `codesearch`
**Source:** `vanilla-source/packages/opencode/src/tool/codesearch.ts`

## Arguments Schema (Zod)

```typescript
{
  query: string               // Search query for code context (required)
  tokensNum?: number          // Tokens to return, 1000-50000 (optional, default: 5000)
}
```

## What It Does

Code-specific search powered by Exa Code API:

- Returns code examples, documentation, API references
- Optimized for programming concepts, libraries, SDKs
- Adjustable context length (tokens)
- Finds relevant code patterns and solutions

## Permission Required

- `codesearch` permission with query pattern

## Truncation Handling

- Controlled by `tokensNum` parameter (1000-50000, default 5000)
- Higher values = more comprehensive results
- Lower values = more focused results

## Model-Specific Behavior

**OpenCode/Exa only:** This tool is only available when using OpenCode or Exa provider

## Example Usage

```json
{
  "tool": "codesearch",
  "parameters": {
    "query": "React useState hook examples"
  }
}
```

```json
{
  "tool": "codesearch",
  "parameters": {
    "query": "Python pandas dataframe filtering",
    "tokensNum": 10000
  }
}
```

## Use Cases

Best for:
- Learning library APIs
- Finding code examples
- Understanding SDK patterns
- Getting documentation context
- Researching programming concepts

## Key Behaviors

1. **Token-based results** - Adjust tokens based on needed context depth
2. **Framework awareness** - Understands library names and concepts
3. **SSE parsing** - Parses Server-Sent Events response
4. **30 second timeout** - Hard timeout for requests

## Output Format

Returns:
- `title`: "Code search: [query]"
- `output`: Code examples and documentation
- `metadata`: Empty object

## Error Handling

- "Code search request timed out" - If request exceeds 30 seconds
- "No code snippets found" - If query returns no results with suggestions
