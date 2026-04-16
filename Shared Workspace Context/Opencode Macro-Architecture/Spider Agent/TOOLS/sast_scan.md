# sast_scan

**Type**: Security tool
**Plugin**: Spider Agent
**Purpose**: Static Application Security Testing — detect security vulnerabilities

---

## Quick Reference

| Property | Value |
|----------|-------|
| Arguments | `rules?`, `files?` |
| Returns | `{ findings: [], severity: string, filesScanned: number }` |
| Errors | Analysis failure |

---

## Purpose

The `sast_scan` tool performs static analysis security testing. Unlike `secretscan` which finds leaked credentials, SAST finds code patterns that are security vulnerabilities:
- SQL injection
- XSS vulnerabilities
- Command injection
- Path traversal
- Unsafe deserialization

---

## Arguments

### `rules` (string[]) — Optional

Specific rule sets to run. Default: all.

### `files` (string[]) — Optional

Files to scan. Default: entire project.

---

## Returns

```typescript
{
  findings: {
    rule: string,
    severity: 'critical' | 'high' | 'medium' | 'low',
    path: string,
    line: number,
    code: string,
    description: string,
    suggestion: string
  }[],
  filesScanned: number,
  severityCounts: { critical: number, high: number, medium: number, low: number }
}
```

---

## Common Rules

| Rule ID | Vulnerability | Severity |
|---------|--------------|----------|
| `sql-injection` | User input in SQL query | Critical |
| `command-injection` | User input in shell command | Critical |
| `xss` | Unescaped user input in HTML | High |
| `path-traversal` | User input in file path | High |
| `deserialization` | Unsafe deserialization | Critical |
| `weak-crypto` | Weak encryption/decryption | Medium |
| `hardcoded-secret` | Hardcoded password/key | High |

---

## Integration Points

| Component | Relationship |
|-----------|--------------|
| **Reviewer** | Calls during security review |
| **QA Gate** | SAST must pass for security tier |

---

## Usage Example

```
/sast_scan
```

```
/sast_scan rules=["sql-injection", "xss", "command-injection"]
```

---

## Related Tools

- `secretscan` — Find leaked credentials
- `pkg_audit` — Audit dependencies
- `lint` — Code quality
