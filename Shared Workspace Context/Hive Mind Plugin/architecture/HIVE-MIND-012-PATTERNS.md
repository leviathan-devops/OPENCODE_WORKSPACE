# Hive Mind Plugin — Detection Patterns

---

## Architecture Signal Patterns

Detects when agent creates substantial architectural work.

### Patterns (each scores 1 point)

| Pattern | Regex | Language | Example |
|---------|-------|----------|---------|
| Interface | `interface\s+\w+` | TypeScript | `interface UserConfig` |
| Export | `export\s+(class\|function\|const\|type\|interface)` | TypeScript/JS | `export class Foo` |
| Array Type | `:\s*\w+Array<` or `: Array<` | TypeScript | `: stringArray<` or `: Array<string>` |
| Import | `import\s+type\s+{\|import\s+{\|` | ES Modules | `import { type Foo }` or `import { Foo }` |
| Access Modifier | `^\s*(public\|private\|protected)\s+` | OOP | `public getUser()` |
| C Preprocessor | `^\s*#\s*(include\|define\|pragma)` | C/C++ | `#define MAX_SIZE` |
| Rust Item | `^\s*(pub\|fn\|struct\|enum\|impl\|mod)` | Rust | `pub fn calculate()` |
| Class Definition | `^\s*class\s+\w+.*\(.*\)\s*{` | OOP | `class Parser {` |

### Threshold
```
Score >= ARCHITECTURE_SIGNAL_THRESHOLD (3) → Architecture breakthrough
```

### Example Detection
```typescript
// Score: 3 (interface, export, Array type)
interface UserConfig {
  items: Array<string>;
}
export function parseConfig() { }
```

---

## Error → Fix Pattern

Detects when agent fixes an error within a time window.

### Flow
```
1. Error detected in command output
   └─> Record error + timestamp
   └─> Start 5-minute window

2. Within window, check for fix indicators:
   - "fixed" / "resolved" / "solved"
   - Error message mentioned as past tense
   - Solution described

3. If fix detected → commitBreakthrough('error_fix')
```

### Time Window
```
ERROR_FIX_WINDOW_MS = 300000 (5 minutes)
```

### Example
```
[14:02] Error: Cannot find module './utils'
[14:05] Fixed by adding index.ts to exports
→ Breakthrough triggered at 14:05
```

---

## Batch File Creation Pattern

Detects when agent creates multiple substantial files.

### Criteria
```
3+ files written within session
Each file > GOLD_STANDARD_MIN_CHARS (2000 bytes)
```

### Flow
```
1. Track files written with size
2. When 3rd substantial file written
3. → commitBreakthrough('file_creation')
```

---

## Hook Patterns

### Message Transform Hook
**Hook:** `experimental.chat.messages.transform`

**Fires on:** Every message in chat

**Analyzes:**
- Command output for file writes
- Command output for errors
- Message content for fix indicators

### Session Compacting Hook
**Hook:** `experimental.session.compacting`

**Fires on:** Session end/compaction

**Triggers:**
- commitSessionOverview()
- commitBreakthrough() for pending activity
- cleanupActivity()

---

## File Size Threshold

```
GOLD_STANDARD_MIN_CHARS = 2000
```

Files must be > 2000 characters to be considered "substantial" for breakthrough detection.

---

*Patterns v1.0 — Leviathan Agent — 2026-04-02*
