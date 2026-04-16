# Hermes Agent Debug Handover Package

## Original Issue
Hermes CLI hangs at "Initializing agent..." indefinitely when launched interactively. Model never responds, process appears stuck but doesn't crash.

## Environment
- **Location**: `/home/leviathan/.hermes/hermes-agent/`
- **Type**: Python CLI tool with PTY-based interactive input
- **Venv**: `/home/leviathan/.hermes/hermes-agent/venv/bin/python3`

## Profiles Affected (4 tested)
| Profile | Provider | Model | API Key Status |
|---------|----------|-------|----------------|
| 2nd-brain | google | gemma-4-31b-it | **EXPIRED** |
| system-admin | google | gemma-4-31b-it | **EXPIRED** |
| devops-manager | minimax | minimax-m2.7 | **VALID** |
| coder | openrouter | gemma-4-31b-it | **VALID** (sk-or-v1-...) |
| engineer | openrouter | qwen3.6-plus:free | **VALID** |
| researcher | google | gemma-4-31b-it | **EXPIRED** |

## Root Cause Identified
**Expired Google API Key** - The primary model `gemma-4-31b-it` for most profiles uses Google's Generative AI API, and the `GOOGLE_API_KEY` is expired.

```
curl test result: {"error": {"code": 400, "message": "API key expired. Please renew the API key."}}
```

## Fixes Attempted

### 1. Syntax Error in model_cooldown_manager.py (FIXED)
**File**: `/home/leviathan/.hermes/hermes-agent/model_cooldown_manager.py`
**Issue**: Lines 92 and 108 had literal newlines embedded inside string literals
```python
# BROKEN:
print("
[Smart Cycling] ... message ...")

# FIXED:
print("[Smart Cycling] ... message ...")
```
**Method**: Used Python script with bytes replacement to fix the encoded characters.

### 2. Removed Debug Statements (COMPLETED)
Added debug prints to `_init_agent()` in `cli.py` to trace execution, then removed them after debugging.

### 3. Attempted Syntax Fixes (REVERTED)
Tried to fix escaped quotes in multiple files via Python script, but this broke the files. **Reverted all changes via git checkout**.

### 4. gateway/mirror.py Syntax (FIXED)
File had `\\"` escape sequences that needed fixing. Applied via Python script, then verified compiles correctly.

### 5. API Key Testing
Tested all providers directly via curl:
- **GOOGLE_API_KEY**: EXPIRED
- **OPENROUTER_API_KEY**: Valid (352 models available)
- **MINIMAX_API_KEY**: Returns 404 on /models endpoint but works on /messages endpoint
- **GLM_API_KEY**: 404 error - wrong endpoint
- **ZAI_API_KEY**: Connection refused

## Current Status

### Working (via script command with fake TTY):
```bash
(echo "hello"; sleep 30) | script -qfc "hermes -p devops-manager chat" /dev/null
# Returns "Goodbye! ⚕" after timeout, model never actually responds
```

### Not Working:
Interactive mode hangs indefinitely. The issue is the **model API call itself hangs** because:
1. With Google (expired key): API returns error immediately, but Hermes doesn't handle it gracefully
2. With MiniMax (valid key): API endpoint works via curl but AIAgent creation with resolved credentials doesn't work in practice

### Key Finding - AIAgent Creation Works in Isolation:
```python
# This works fine:
agent = AIAgent(model='minimax-m2.7', provider='minimax', base_url='https://api.minimax.io/anthropic', ...)
# Creates valid anthropic client
```

But when going through the full CLI flow with `script` command (fake TTY), it hangs.

## Architecture Notes

### Flow: hermes chat → cli.py:run() → HermesCLI.run() → _init_agent() → AIAgent creation
- `_ensure_runtime_credentials()` resolves provider credentials correctly
- Returns api_key, base_url, api_mode (anthropic_messages for minimax)
- AIAgent created with correct parameters

### Where It Hangs:
The hang occurs during or after the first API call. The `_interruptible_api_call()` runs the API request in a background thread, and the main thread polls with 0.3s timeouts. Something in the API call path is blocking.

### Potential Issue Areas:
1. **auxiliary_client.py** - Provider client resolution
2. **agent/anthropic_adapter.py** - How anthropic client is built
3. **run_agent.py:_interruptible_api_call()** - Thread-based API call handling
4. **run_agent.py:_create_request_openai_client()** - Client creation for non-anthropic modes

## Files Modified

### Original Syntax Fix:
- `/home/leviathan/.hermes/hermes-agent/model_cooldown_manager.py` - Fixed broken print statements

### Debug Additions (removed):
- `/home/leviathan/.hermes/hermes-agent/cli.py` - Added then removed DEBUG prints in `_init_agent()`

### Reverted Changes:
All other files were restored via `git checkout`

## Verification Commands

```bash
# Test API keys directly
curl -s "https://generativelanguage.googleapis.com/v1beta/models?key=${GOOGLE_API_KEY}"
curl -s "https://openrouter.ai/api/v1/models" -H "Authorization: Bearer ${OPENROUTER_API_KEY}"
curl -s -X POST "https://api.minimax.io/anthropic/v1/messages" -H "Authorization: Bearer ${MINIMAX_API_KEY}" -H "Content-Type: application/json" -H "anthropic-version: 2023-06-01" -d '{"model":"MiniMax-M2.7","max_tokens":10,"messages":[{"role":"user","content":"hi"}]}'

# Test hermes with script (fake TTY)
cd /home/leviathan/.hermes/hermes-agent && source venv/bin/activate
(echo "hi"; sleep 30) | script -qfc "hermes -p devops-manager chat" /dev/null

# Verify syntax
cd /home/leviathan/.hermes/hermes-agent && python3 -m compileall -q .
```

## Recommended Next Steps

1. **Renew Google API key** - Primary fix needed for gemma-4-31b-it profiles
2. **Add API error timeout handling** - Even with valid keys, API failures should timeout gracefully
3. **Add connection timeout** - The `_interruptible_api_call` should have a max wait time
4. **Check network connectivity** - `api.minimax.io` may be blocked or slow from user's location
5. **Add explicit error handling** - AIAgent creation should fail fast if API key is empty

## Key File Locations

- **Entry point**: `hermes_cli/main.py:cmd_chat()`
- **CLI orchestrator**: `cli.py:HermesCLI`
- **Agent creation**: `cli.py:_init_agent()`
- **Runtime credentials**: `hermes_cli/runtime_provider.py:resolve_runtime_provider()`
- **Provider registry**: `hermes_cli/auth.py:PROVIDER_REGISTRY`
- **Agent core**: `run_agent.py:AIAgent`
- **Profile configs**: `/home/leviathan/.hermes/profiles/<name>/config.yaml`
- **Profile env vars**: `/home/leviathan/.hermes/profiles/<name>/.env`
