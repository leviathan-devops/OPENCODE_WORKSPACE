# Agent CLI Tools - Specification

**Document:** SPEC-AGENT-CLI-TOOLS-001
**Version:** 1.0.0

---

## Feature Description

Build a universal OpenCode plugin that exposes `gemini` and `qwen` CLI tools as native OpenCode tools, enabling any agent to invoke these external coding agents without agent-specific code.

---

## User Scenarios

### Scenario 1: Code Review via Gemini
**Given** an agent has source code to review
**When** the agent calls the `gemini` tool with a prompt containing the code
**Then** the tool returns structured JSON with the review findings

### Scenario 2: Autonomous Code Generation via Qwen
**Given** an agent needs code written or modified
**When** the agent calls the `qwen` tool with `--yolo` flag
**Then** Qwen executes autonomously without approval prompts

### Scenario 3: Parallel Multi-Agent Analysis
**Given** an agent needs multiple perspectives on code
**When** the agent calls both `gemini` and `qwen` tools
**Then** both tools return independent, structured results

---

## Functional Requirements

**FR-001:** Plugin MUST register two tools: `gemini` and `qwen`
**FR-002:** Each tool MUST accept a required `prompt` string argument
**FR-003:** Gemini tool MUST support model selection (`gemini-2.5-flash`, `gemini-2.5-pro`) with flash as default
**FR-004:** Qwen tool MUST support `--yolo` flag for autonomous mode
**FR-005:** Both tools MUST support configurable timeout (default 120s)
**FR-006:** Both tools MUST return structured JSON responses by default
**FR-007:** Both tools MUST return structured error responses with error codes: `TIMEOUT`, `CLI_ERROR`, `PARSE_ERROR`, `INVALID_ARGS`, `INVOCATION_ERROR`
**FR-008:** Both tools MUST include metadata in responses (model used, request count, remaining quota)
**FR-009:** Plugin MUST use `child_process.spawn` for CLI invocation
**FR-010:** Plugin MUST use Zod for argument validation

---

## Success Criteria

**SC-001:** `bun run build` completes without errors
**SC-002:** `dist/index.js` and `dist/index.d.ts` are generated
**SC-003:** TypeScript compilation is clean (no errors or warnings)
**SC-004:** Plugin loads and both tools appear in OpenCode tool registry

---

## Key Entities

- **GeminiArgs**: Input schema for Gemini tool invocations
- **QwenArgs**: Input schema for Qwen tool invocations
- **CliResult**: Shared response structure for both tools

---

## Edge Cases

- CLI not installed on system → `INVOCATION_ERROR`
- CLI hangs beyond timeout → `TIMEOUT`
- CLI returns non-JSON output → `PARSE_ERROR`
- Invalid arguments passed → `INVALID_ARGS`
- CLI exits with non-zero code → `CLI_ERROR`

---

## Known Failure Modes

- Gemini CLI may require authentication on first run
- Qwen `--yolo` mode may modify files unexpectedly (caller responsibility)
- Both CLIs have rate limits (1000 req/day each)
