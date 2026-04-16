# build_check

**Type**: QA tool
**Plugin**: Spider Agent
**Purpose**: Verify the project builds successfully

---

## Quick Reference

| Property | Value |
|----------|-------|
| Arguments | `command?`, `timeout?` |
| Returns | `{ success, command, exitCode, output, duration }` |
| Errors | Build failure |

---

## Purpose

The `build_check` tool runs the project's build command to verify the code compiles and packages correctly. This is a critical QA gate — if the build fails, no further testing is worthwhile.

---

## Arguments

### `command` (string[]) — Optional

Build command as array. Auto-detected if not provided.

### `timeout` (number) — Optional

Timeout in milliseconds. Default: 120000 (2 min).

---

## Returns

```typescript
{
  success: boolean,
  command: string[],
  exitCode: number,
  output: string,
  duration: number
}
```

---

## Auto-Detection

Checks `package.json` scripts in order:
1. `"build"` — Primary build
2. `"compile"` — Alternative
3. `"package"` — For libraries

Falls back to: `tsc`, `webpack`, `vite build`, `rollup`

---

## Integration Points

| Component | Relationship |
|-----------|--------------|
| **Reviewer** | Verifies build before review |
| **QA Gate** | Build must pass for any tier |

---

## Usage Example

```
/build_check
```

```
/build_check command=["npm", "run", "build"] timeout=180000
```

---

## Related Tools

- `syntax_check` — Fast syntax validation
- `lint` — Run linters
- `test_runner` — Run tests
