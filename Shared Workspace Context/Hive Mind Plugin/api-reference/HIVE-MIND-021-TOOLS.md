# Hive Mind Plugin — Tool Reference

---

## hive_remember

Upload a memory to OpenViking with local fallback.

### Signature
```typescript
tool('hive_remember', {
  key: string,
  content: string
})
```

### Arguments
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `key` | string | Yes | Memory key/name |
| `content` | string | Yes | Memory content |

### Returns
```typescript
{
  success: boolean;
  targetUri?: string;        // OpenViking URI if uploaded
  localFallbackPath?: string; // Local path if fallback used
  error?: string;            // Error message if failed
}
```

### Example
```
/hive_remember test-key "This is my test memory"
```

### Flow
1. Write to local fallback FIRST
2. Attempt OpenViking upload
3. Return result

---

## hive_context

Search for relevant memories in OpenViking.

### Signature
```typescript
tool('hive_context', {
  query: string,
  limit?: number
})
```

### Arguments
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `query` | string | Yes | — | Search query |
| `limit` | number | No | 5 | Max results |

### Returns
```typescript
{
  results: Array<{
    uri: string;
    score: number;
    content?: string;
  }>;
}
```

### Example
```
/hive_context testing memory
```

### Flow
1. Generate embedding for query
2. Search OpenViking vector DB
3. Return matching resources

---

## hive_status

Get plugin health and status.

### Signature
```typescript
tool('hive_status')
```

### Returns
```typescript
{
  plugin: string;           // "hive-mind-plugin"
  version: string;          // Plugin version
  openViking: {
    connected: boolean;     // Is OpenViking healthy?
    lastCheck: number;       // Timestamp of last check
  };
  localFallback: {
    enabled: boolean;       // Always true
    path: string;           // Fallback directory
  };
  canary: {
    totalHookCalls: number; // Hook call counter
    lastCanary: number;    // Last canary log timestamp
  };
}
```

### Example
```
/hive_status
```

---

## memread_session

Read session data from opencode.db.

### Signature
```typescript
tool('memread_session', {
  sessionId: string
})
```

### Arguments
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `sessionId` | string | Yes | Session ID to query |

### Returns
```typescript
{
  sessionId: string;
  title: string;
  category: string;
  tools: string[];
  createdAt: string;
  messageCount: number;
  tokenUsage?: {
    input: number;
    output: number;
  };
}
```

### Example
```
/memread_session ses_2e46e5c0effe
```

---

## memlink_parent

Link current session to parent session in OpenViking.

### Signature
```typescript
tool('memlink_parent', {
  parentSessionId: string
})
```

### Arguments
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `parentSessionId` | string | Yes | Parent session ID |

### Returns
```typescript
{
  success: boolean;
  uri?: string;  // Link URI if successful
  error?: string;
}
```

### Example
```
/memlink_parent ses_2e46e5c0effe
```

---

## Tool Availability

These tools are available when the Hive Mind plugin is loaded in OpenCode.

### Check if Loaded
```bash
grep -i "HiveMind\|hive-mind" ~/.local/share/opencode/hive-mind/hive-mind-plugin.log
```

### If Not Loaded
Tools will return error: "Unknown command: hive_remember"

---

*Tool Reference v1.0 — Leviathan Agent — 2026-04-02*
