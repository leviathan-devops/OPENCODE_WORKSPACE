# webfetch

Fetch content from URLs and convert to various formats.

## Tool Definition

**Tool Name:** `webfetch`
**Source:** `vanilla-source/packages/opencode/src/tool/webfetch.ts`

## Arguments Schema (Zod)

```typescript
{
  url: string                 // URL to fetch (required, must be http:// or https://)
  format?: "text" | "markdown" | "html"  // Output format (optional, default: "markdown")
  timeout?: number            // Timeout in seconds, max 120 (optional, default: 30)
}
```

## What It Does

Fetches web content with format conversion:

- **HTTP/HTTPS only** - Validates URL scheme
- **Format conversion:**
  - `markdown` - Converts HTML to Markdown (default)
  - `text` - Extracts plain text from HTML
  - `html` - Returns raw HTML
- **Image support** - Returns images as base64 attachments
- **Cloudflare handling** - Retries with different UA if blocked
- **Content-Type negotiation** - Sends Accept headers for preferred format

## Permission Required

- `webfetch` permission with URL pattern

## Truncation Handling

- **5MB response limit** - Throws error if content exceeds 5MB
- Content may be summarized if very large (implementation-dependent)

## Model-Specific Behavior

**All models:** Available to all models

## Example Usage

```json
{
  "tool": "webfetch",
  "parameters": {
    "url": "https://example.com/article",
    "format": "markdown"
  }
}
```

```json
{
  "tool": "webfetch",
  "parameters": {
    "url": "https://example.com/data.json",
    "format": "text",
    "timeout": 60
  }
}
```

## Key Behaviors

1. **URL validation** - Must start with `http://` or `https://`
2. **Cloudflare bypass** - Retries with `User-Agent: opencode` if blocked
3. **Image handling** - Images returned as data URI attachments
4. **Script/style stripping** - Removes script, style, noscript, iframe, object, embed tags
5. **Format negotiation** - Sends appropriate Accept headers

## Output Format

Returns:
- `title`: URL with content-type
- `output`: Fetched content in requested format
- `metadata`: Empty object
- `attachments`: Image data if URL is an image

## Error Handling

- Throws "Request failed with status code" for non-200 responses
- Throws "Response too large" for responses over 5MB
- Throws "URL must start with http:// or https://" for invalid schemes
