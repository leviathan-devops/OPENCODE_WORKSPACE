# secretscan

**Type**: Security tool
**Plugin**: Spider Agent
**Purpose**: Scan for exposed secrets and credentials in codebase

---

## Quick Reference

| Property | Value |
|----------|-------|
| Arguments | `directory?`, `exclude?` |
| Returns | `{ scan_dir, findings, count, files_scanned, skipped_files }` |
| Errors | Directory not found |

---

## Purpose

The `secretscan` tool scans the codebase for exposed secrets, API keys, passwords, and other credentials. It uses pattern matching and entropy analysis to detect secrets that may have been accidentally committed.

This is a critical security tool — secrets in code are a critical vulnerability. The reviewer calls this during security review.

---

## Arguments

### `directory` (string) — Optional

Directory to scan. Default: project root.

### `exclude` (string[]) — Optional

Array of patterns to exclude (e.g., `["node_modules", ".git"]`).

---

## Returns

```typescript
{
  scan_dir: string,
  findings: {
    path: string,
    line: number,
    type: string,
    confidence: 'high' | 'medium' | 'low',
    severity: 'critical' | 'high' | 'medium' | 'low',
    redacted: string,
    context: string
  }[],
  count: number,
  files_scanned: number,
  skipped_files: number
}
```

### Secret Types Detected

- `aws_access_key` — AWS access key
- `aws_secret_key` — AWS secret key
- `github_token` — GitHub personal access token
- `api_key` — Generic API key
- `password` — Password in code
- `jwt` — JSON Web Token
- `ssh_key` — SSH private key
- `slack_token` — Slack token
- `db_connection` — Database connection string
- `private_key` — RSA/PGP private key

---

## Behavior

1. **Pattern Matching**
   - Regex patterns for known secret formats
   - AWS keys: `AKIA[0-9A-Z]{16}`
   - GitHub tokens: `gh[pousr]_[A-Za-z0-9]{36,251}`
   - JWT: `eyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+`
   - Generic API keys: high entropy strings with common prefixes

2. **Entropy Analysis**
   - Shannon entropy calculation for random strings
   - High entropy (>4.5) flags as potential secrets
   - Reduces false negatives on non-standard secrets

3. **Redaction**
   - ALL secrets are redacted in output
   - Shows only first 4 chars + `***` + last 4 chars
   - Never exposes raw secrets

4. **Exclusions**
   - Respects `.secretscanignore` file
   - Skips `node_modules/`, `.git/`, binary files
   - Skips files matching exclude patterns

---

## Integration Points

| Component | Relationship |
|-----------|--------------|
| **Reviewer** | Calls during security review |
| **QA Gate** | secretscan must pass for security tier |
| **Commit Hook** | May be integrated as pre-commit check |

---

## Usage Example

```
/secretscan
```
Scan entire project.

```
/secretscan directory="src" exclude=["node_modules", "tests"]
```
Scan specific directory with exclusions.

---

## Related Tools

- `sast_scan` — Static application security testing
- `lint` — General code quality
- `pkg_audit` — Dependency vulnerability scan
