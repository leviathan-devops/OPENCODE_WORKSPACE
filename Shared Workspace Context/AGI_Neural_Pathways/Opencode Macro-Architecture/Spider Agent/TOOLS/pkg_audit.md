# pkg_audit

**Type**: Security tool
**Plugin**: Spider Agent
**Purpose**: Audit dependencies for known vulnerabilities

---

## Quick Reference

| Property | Value |
|----------|-------|
| Arguments | `package_manager?` |
| Returns | `{ vulnerabilities: [], auditTime, packagesAudited }` |
| Errors | No package manager found |

---

## Purpose

The `pkg_audit` tool checks dependencies for known security vulnerabilities using the native package manager's audit functionality.

---

## Arguments

### `package_manager` (enum) — Optional

One of: `npm`, `yarn`, `pnpm`, `pip`, `cargo`. Auto-detected if not provided.

---

## Returns

```typescript
{
  vulnerabilities: {
    package: string,
    severity: 'critical' | 'high' | 'medium' | 'low',
    title: string,
    url: string,
    fixAvailable: boolean
  }[],
  auditTime: number,
  packagesAudited: number
}
```

---

## Integration Points

| Component | Relationship |
|-----------|--------------|
| **Reviewer** | Security review |
| **QA Gate** | Vulnerabilities must be remediated |

---

## Usage Example

```
/pkg_audit
```

---

## Related Tools

- `secretscan` — Find leaked credentials
- `sast_scan` — Code security analysis
- `lint` — General quality
