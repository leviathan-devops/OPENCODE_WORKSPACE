# test_runner

**Type**: QA tool
**Plugin**: Spider Agent
**Purpose**: Run tests with auto-detection for multiple test frameworks

---

## Quick Reference

| Property | Value |
|----------|-------|
| Arguments | `mode?`, `test_pattern?`, `timeout?` |
| Returns | `{ success, mode, command, exitCode, output, testsPassed?, testsFailed?, testsTotal?, duration? }` |
| Errors | No test framework found, timeout |

---

## Purpose

The `test_runner` tool runs tests using the project's test framework. It auto-detects the framework from `package.json` or project files and supports multiple modes.

This is the primary TDD enforcement mechanism — tests must pass before a task can be marked complete.

---

## Arguments

### `mode` (enum) — Optional

One of: `run`, `watch`, `coverage`. Default: `run`

### `test_pattern` (string) — Optional

Glob pattern for test file selection.

### `timeout` (number) — Optional

Timeout in milliseconds. Default: 300000 (5 min).

---

## Returns

```typescript
{
  success: boolean,
  mode: string,
  command: string[],
  exitCode: number,
  output: string,
  testsPassed?: number,
  testsFailed?: number,
  testsTotal?: number,
  duration?: number
}
```

---

## Supported Frameworks

| Framework | Detection | Command |
|----------|-----------|---------|
| Bun | `bun test` in scripts | `bun test` |
| Jest | `jest` in scripts | `npm test` |
| Vitest | `vitest` in scripts | `npm test` |
| Mocha | `mocha` in scripts | `npm test` |
| Python pytest | `pytest` in PATH | `python -m pytest` |
| Cargo test | `Cargo.toml` exists | `cargo test` |
| Go test | `go.mod` exists | `go test ./...` |

---

## Behavior

1. **Framework Detection**
   - Checks `package.json` for test script
   - Falls back to file-based detection
   - Uses `npm test` by default if package.json has test script

2. **Coverage Mode**
   - Generates coverage report
   - Returns coverage percentage
   - Writes `coverage/` directory

3. **Watch Mode**
   - Runs tests in watch mode
   - Returns immediately (doesn't wait for changes)
   - For CI: use `run` mode

---

## Integration Points

| Component | Relationship |
|-----------|--------------|
| **test_engineer** | Primary caller — runs tests after implementation |
| **Reviewer** | Verifies tests pass during review |
| **QA Gate** | Tests must pass for tier 1+ QA |

---

## Usage Example

```
/test_runner
```
Run all tests.

```
/test_runner mode=coverage
```
Run with coverage report.

```
/test_runner test_pattern="**/auth*.test.ts" timeout=60000
```
Run specific tests with longer timeout.

---

## Related Tools

- `lint` — Run linters
- `build_check` — Verify build succeeds
- `evidence_check` — Verify test evidence exists
