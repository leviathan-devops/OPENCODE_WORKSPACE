# Agent CLI Tools - Usage Examples

## Basic Usage

### Single Tool Call

```
/tool gemini {"prompt": "What does this code do?", "outputFormat": "text"}
```

### With JSON Output

```
/tool qwen {"prompt": "List the top-level exports from this file", "outputFormat": "json"}
```

---

## Code Review

### Parallel Review (3 Agents)

```javascript
// Security review (Gemini Flash)
const security = await gemini({ 
  prompt: "Security review: $(git diff)", 
  model: "gemini-2.5-flash" 
});

// Best practices review (Qwen)
const practices = await qwen({ 
  prompt: "Best practices review: $(git diff)" 
});

// Performance review (Gemini Pro)
const performance = await gemini({ 
  prompt: "Performance review: $(git diff)", 
  model: "gemini-2.5-pro" 
});

// Aggregate results
const allIssues = [...security.issues, ...practices.issues, ...performance.issues];
```

### Security-Focused Review

```javascript
const result = await gemini({ 
  prompt: `Security audit for SQL injection, XSS, and auth issues:
  
${await Bun.file("src/auth.ts").text()}
${await Bun.file("src/api.ts").text()}
${await Bun.file("src/middleware.ts").text()}
`,
  model: "gemini-2.5-pro",
  timeout: 180
});
```

---

## Sequential Refinement

### Round 1: Analysis

```javascript
const analysis = await gemini({ 
  prompt: `Analyze this module. List all issues by severity (CRITICAL/HIGH/MEDIUM/LOW):
  
${await Bun.file("src/legacy.ts").text()}
`,
  outputFormat: "json"
});
```

### Round 2: Fix (Autonomous)

```javascript
const fixes = await qwen({ 
  prompt: `Fix the CRITICAL and HIGH issues from this analysis:
  
${JSON.stringify(analysis.response, null, 2)}
  
Original code:
${await Bun.file("src/legacy.ts").text()}
`,
  yolo: true,
  timeout: 300
});
```

### Round 3: Validation

```javascript
const validation = await gemini({ 
  prompt: `Validate that these fixes are correct and don't break anything:
  
Original with fixes applied:
${JSON.stringify(fixes.response, null, 2)}
`
});
```

---

## Research + Implementation

### Research Phase (Gemini with Search Grounding)

```javascript
const research = await gemini({ 
  prompt: `Research best practices for implementing rate limiting in Node.js.
Include:
- Token bucket algorithm
- Redis implementation
- Express middleware pattern
- Error handling
`,
  model: "gemini-2.5-pro",
  timeout: 120
});
```

### Implementation Phase (Qwen Autonomous)

```javascript
const implementation = await qwen({ 
  prompt: `Implement rate limiting following these best practices:
  
${JSON.stringify(research.response, null, 2)}
  
Requirements:
- Must work with existing Express app
- Use Redis for distributed deployment
- Include tests
`,
  yolo: true,
  timeout: 300
});
```

---

## Architecture Enforcement

### Project Context Files

Create `.gemini/GEMINI.md` in project root:

```markdown
# Architecture Rules

## Code Style
- TypeScript strict mode
- No \`any\` types
- Max function length: 50 lines

## Testing
- Vitest for unit tests
- 80% minimum coverage

## Error Handling
- Result<E, T> pattern
- Never swallow exceptions
```

Create `.qwen/QWEN.md` with same content.

### Using Architecture Rules

```javascript
// When running in project directory with .gemini/GEMINI.md
// Gemini auto-loads the rules

const result = await gemini({ 
  prompt: "Refactor auth module to follow our patterns",
  // Rules from .gemini/GEMINI.md are automatically applied
});
```

---

## Sandbox Mode

For untrusted code analysis:

```javascript
const result = await gemini({ 
  prompt: `Analyze this code for malware:
  
${untrustedCode}
`,
  sandbox: true,  // Runs in isolated container
  timeout: 60
});
```

---

## Timeout Handling

```javascript
const result = await gemini({ 
  prompt: "Analyze entire codebase...",
  timeout: 60  // 60 seconds, not 120
});

// Check if timed out
if (!result.success && result.error.code === 'TIMEOUT') {
  // Retry with smaller scope or longer timeout
}
```

---

## Error Handling

```javascript
const result = await gemini({ prompt: "..." });

if (!result.success) {
  switch (result.error.code) {
    case 'TIMEOUT':
      // Retry with longer timeout
      break;
    case 'CLI_ERROR':
      // Check if CLI is installed
      console.error("Gemini CLI error:", result.error.message);
      break;
    case 'PARSE_ERROR':
      // CLI returned non-JSON
      console.warn("Raw output:", result.response);
      break;
    case 'INVOCATION_ERROR':
      // CLI not found
      console.error("Gemini CLI not installed");
      break;
  }
}

// Log metadata for tracking
console.log(`Used ${result.metadata.reqCount} request. ~${result.metadata.remaining} remaining.`);
```

---

## Large Context Handling

### File by File

```javascript
const files = ["src/auth.ts", "src/api.ts", "src/db.ts", "src/utils.ts"];

const results = await Promise.all(
  files.map(file => gemini({ 
    prompt: `Analyze this file for issues: ${file}`,
    timeout: 60
  }))
);
```

### Project-wide with Limits

```javascript
// For large codebases, process by module
const modules = [
  "src/auth/*",
  "src/api/*", 
  "src/core/*"
];

for (const mod of modules) {
  const result = await gemini({ 
    prompt: `Full analysis of ${mod}:`,
    model: "gemini-2.5-pro",  // Best for complex analysis
    timeout: 180
  });
  // Store or aggregate results
}
```

---

## Quick Test Pattern

```javascript
// Fast iteration with Qwen YOLO
const result = await qwen({ 
  prompt: "Add TypeScript types to this function",
  yolo: true,
  timeout: 30
});
```

## Chaining Pattern

```javascript
// Gemini does research
const research = await gemini({ prompt: "..." });

// Qwen implements
const impl = await qwen({ prompt: `${research.response} ...` });

// Gemini reviews
const review = await gemini({ prompt: `Review this implementation: ${impl.response}` });

// Qwen fixes issues
const final = await qwen({ prompt: `Address review feedback: ${review.response}` });
```
