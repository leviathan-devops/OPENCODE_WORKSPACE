# lint

**Type**: QA tool
**Plugin**: Spider Agent
**Purpose**: Run linters with auto-detection for multiple languages

---

## Quick Reference

| Property | Value |
|----------|-------|
| Arguments | `mode?`, `files?` |
| Returns | `{ success, mode, linter, command, exitCode, output, message? }` |
| Errors | No linter found, linter not installed |

---

## Purpose

The `lint` tool runs linters in check or fix mode. It auto-detects which linter to use based on project files and supports 10+ languages.

In `check` mode, it reports issues without modifying files.
In `fix` mode, it auto-fixes issues and modifies files.

---

## Arguments

### `mode` (enum) — Optional

One of: `fix`, `check`. Default: `check`

### `files` (string[]) — Optional

Specific files to lint. If not provided, lints entire project.

---

## Returns

```typescript
{
  success: boolean,
  mode: 'fix' | 'check',
  linter: string,
  command: string[],
  exitCode: number,
  output: string,
  message?: string
}
```

---

## Supported Linters

| Language | Primary | Additional |
|----------|---------|------------|
| JavaScript/TypeScript | biome, eslint | — |
| Python | ruff | — |
| Rust | clippy | — |
| Go | golangci-lint | — |
| Java | checkstyle | — |
| Kotlin | ktlint | — |
| C# | dotnet-format | — |
| C/C++ | cppcheck | — |
| Swift | swiftlint | — |
| Dart | dart-analyze | — |
| Ruby | rubocop | — |

Auto-detection order:
1. Check for biome (fastest, JS/TS preferred)
2. Check for eslint
3. Check language-specific linters
4. Fail if none found

---

## Behavior

1. **Linter Detection**
   - Checks `node_modules/.bin/{linter}` for each supported linter
   - Uses first found
   - Falls back to language-specific

2. **Command Execution**
   - Runs linter with appropriate flags
   - Captures stdout/stderr
   - Returns combined output

3. **Fix Mode**
   - Adds `--fix` flag where supported
   - May modify files

---

## Integration Points

| Component | Relationship |
|-----------|--------------|
| **Reviewer** | Calls lint during code review |
| **Coder** | Self-checks before marking done |
| **QA Gate** | Lint must pass for TIER 0 check |

---

## Usage Example

```
/lint
```
Check entire project.

```
/lint mode=check files=["src/index.ts", "src/utils.ts"]
```
Check specific files.

```
/lint mode=fix
```
Auto-fix issues.

---

## Related Tools

- `test_runner` — Run tests
- `syntax_check` — Fast syntax check
- `build_check` — Verify build succeeds
