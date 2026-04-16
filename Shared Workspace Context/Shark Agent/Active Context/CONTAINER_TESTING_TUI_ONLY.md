# Shark Agent Container Testing Context

**Last Updated:** 2026-04-12

## CRITICAL RULE: TUI ONLY

**Container testing MUST use TUI mode (`opencode --agent shark`), NOT `opencode run`.**

The `opencode run` command has **BROKEN hook system**:
- `chat.message`: ❌ Does NOT fire
- `tool.execute.before`: ❌ Does NOT fire
- `messages.transform`: ❌ Does NOT fire
- `command.execute.before`: ⚠️ Fires but unreliable

**TUI mode** (`opencode --agent shark`) has **FULL hook support**:
- All hooks fire correctly
- Firewall patterns work as designed
- Brain initialization works

## Approved Container Test Command

```bash
# TUI mode ONLY - interactive terminal
docker exec -it shark-v483-test \
  /usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64/bin/opencode \
  --agent shark --model opencode/big-pickle
```

## Blocked Patterns

### "opencode run" in any agent context

The pattern `opencode run` should be blocked with:
```
[FIREWALL L4] opencode run is not supported. Use TUI mode: docker exec -it ... opencode --agent shark
```

## TUI Test Workflow

1. Start container:
```bash
docker kill $(docker ps -q --filter "name=shark-v483") 2>/dev/null
docker run --rm -d --name shark-v483-test --entrypoint /bin/bash \
  -v /tmp/shark-container-test/config:/root/.config/opencode \
  -v /tmp/shark-container-test/plugins:/root/.config/opencode/plugins \
  opencode-test:1.4.3 -c "sleep infinity"
```

2. Test in TUI:
```bash
docker exec -it shark-v483-test \
  /usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64/bin/opencode \
  --agent shark --model opencode/big-pickle
```

3. Inside TUI, test patterns like:
- "skip container test" → should block with L5.1
- "it works trust me" → should block with L5.2
- "let's just ship it" → should block with L5.9

## Model Requirements

- **APPROVED:** `opencode/big-pickle` (free), `gemma-4-31b-it`
- **BANNED:** `minimax/*`, `gpt-*`, `claude-*` (paid models not allowed in container testing)

## Hook Architecture

```
TUI Mode (FULL SUPPORT):
  chat.message → setCurrentAgent + pattern check
  tool.execute.before → guardian patterns
  tool.execute.after → summarizer + evidence
  messages.transform → response check

opencode run (BROKEN):
  command.execute.before → unreliable
  (no other hooks fire)
```
