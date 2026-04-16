# websearch

Perform real-time web searches using the Exa AI API.

## Tool Definition

**Tool Name:** `websearch`
**Source:** `vanilla-source/packages/opencode/src/tool/websearch.ts`

## Arguments Schema (Zod)

```typescript
{
  query: string               // Websearch query (required)
  numResults?: number         // Number of results (optional, default: 8)
  livecrawl?: "fallback" | "preferred"  // Live crawl mode (optional, default: "fallback")
  type?: "auto" | "fast" | "deep"       // Search type (optional, default: "auto")
  contextMaxCharacters?: number          // Max context characters (optional, default: 10000)
}
```

## What It Does

Real-time web search powered by Exa AI:

- Returns content from most relevant websites
- Supports live crawling or cached content
- Configurable result counts
- Optimized for LLM consumption with context strings
- Handles current events and recent data

## Permission Required

- `websearch` permission with query pattern

## Truncation Handling

- Uses `contextMaxCharacters` parameter to limit context (default 10000)
- Results are summarized for optimal LLM context

## Model-Specific Behavior

**OpenCode/Exa only:** This tool is only available when using OpenCode or Exa provider

## Example Usage

```json
{
  "tool": "websearch",
  "parameters": {
    "query": "latest AI developments 2026"
  }
}
```

```json
{
  "tool": "websearch",
  "parameters": {
    "query": "TypeScript 5.0 new features",
    "numResults": 10,
    "type": "deep",
    "livecrawl": "preferred"
  }
}
```

## Search Types

| Type | Description |
|------|-------------|
| `auto` | Balanced search (default) |
| `fast` | Quick results |
| `deep` | Comprehensive search |

## Live Crawl Modes

| Mode | Description |
|------|-------------|
| `fallback` | Use live crawling as backup if cached unavailable (default) |
| `preferred` | Prioritize live crawling |

## Key Behaviors

1. **Current year awareness** - Uses current year for recent information
2. **SSE parsing** - Parses Server-Sent Events response format
3. **Timeout handling** - 25 second timeout with abort support
4. **Error messages** - Returns helpful message if no results found

## Output Format

Returns:
- `title`: "Web search: [query]"
- `output`: Search results with context
- `metadata`: Empty object

## Error Handling

- "Search request timed out" - If request exceeds 25 seconds
- "No search results found" - If query returns no results
