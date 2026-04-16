# sbom_generate

**Type**: Security tool
**Plugin**: Spider Agent
**Purpose**: Generate Software Bill of Materials (SBOM)

---

## Quick Reference

| Property | Value |
|----------|-------|
| Arguments | `format?` |
| Returns | `{ sbom, format, packages: [] }` |
| Errors | No package manager found |

---

## Purpose

The `sbom_generate` tool generates an SBOM listing all dependencies and their versions. Useful for:
- Security auditing
- License compliance
- Vulnerability tracking

---

## Arguments

### `format` (enum) — Optional

One of: `spdx`, `cyclonedx`, `json`. Default: `spdx`.

---

## Returns

```typescript
{
  sbom: string,
  format: string,
  packages: {
    name: string,
    version: string,
    license: string,
    url?: string
  }[],
  generatedAt: string
}
```

---

## Integration Points

| Component | Relationship |
|-----------|--------------|
| **Reviewer** | Security/compliance review |
| **Release** | Required for release artifacts |

---

## Usage Example

```
/sbom_generate format=cyclonedx
```

---

## Related Tools

- `pkg_audit` — Vulnerability audit
- `secretscan` — Secret scanning
