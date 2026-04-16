# Design Doc: OpenCode Go Models Integration with Hermes Agent

## Problem

Hermes agent currently uses models configured via `--model`, `--base-url`, `--api-key` CLI flags or environment variables in `~/.hermes/.env`. The user has subscribed to OpenCode Go and wants to use those models (GLM-5, Kimi K2.5, MiMo-V2-Pro, MiMo-V2-Omni, MiniMax M2.5, MiniMax M2.7) inside Hermes.

## Architecture Understanding

Hermes is a **standalone Python agent** (`~/hermes-workspace/railway-hermes-agent/hermes-agent/`) that:
- Uses OpenAI-compatible API calls via `openai` Python package
- Accepts `--model`, `--provider`, `--api-key`, `--base-url` CLI args
- Reads env vars from `~/.hermes/.env`
- Supports multiple providers: OpenRouter, Nous, OpenAI-Codex, Z.AI, Kimi-Coding, MiniMax, MiniMax-CN, Anthropic, DeepSeek, OpenCode-Zen, OpenCode-Go, etc.
- Already has `opencode-go` in its `_PROVIDER_PREFIXES` list in `agent/model_metadata.py`

## Solution

Two approaches to configure OpenCode Go models in Hermes:

### Approach 1: CLI Flags (Per-Session)

Launch Hermes with explicit Go model configuration:

```bash
# GLM-5 (OpenAI-compatible)
python cli.py --model glm-5 --base-url https://opencode.ai/zen/go/v1 --api-key sk-hzzyXqigLO0PVsBlzmiA1bTPXUor6TrpwlhBLVoSbO95gshcqKbJs0RgpGMBFois

# Kimi K2.5 (OpenAI-compatible)
python cli.py --model kimi-k2.5 --base-url https://opencode.ai/zen/go/v1 --api-key sk-hzzyXqigLO0PVsBlzmiA1bTPXUor6TrpwlhBLVoSbO95gshcqKbJs0RgpGMBFois

# MiniMax M2.5 (Anthropic-compatible)
python cli.py --model minimax-m2.5 --base-url https://opencode.ai/zen/go/v1 --api-key sk-hzzyXqigLO0PVsBlzmiA1bTPXUor6TrpwlhBLVoSbO95gshcqKbJs0RgpGMBFois
```

### Approach 2: Environment Variables (Persistent)

Add to `~/.hermes/.env`:

```bash
# OpenCode Go - Shared API key (same as Zen)
OPENCODE_GO_API_KEY=sk-hzzyXqigLO0PVsBlzmiA1bTPXUor6TrpwlhBLVoSbO95gshcqKbJs0RgpGMBFois
OPENCODE_GO_BASE_URL=https://opencode.ai/zen/go/v1
```

Then launch with shorthand:
```bash
python cli.py --model glm-5 --provider opencode-go
```

### Approach 3: Default Model in Hermes Config (Recommended)

If Hermes has a config file (check `~/.hermes/config.yaml` or similar), set the default model there.

## OpenCode Go Model Endpoints

| Model | Model ID | Base URL | API Type |
|-------|----------|----------|----------|
| GLM-5 | `glm-5` | `https://opencode.ai/zen/go/v1` | OpenAI-compatible |
| Kimi K2.5 | `kimi-k2.5` | `https://opencode.ai/zen/go/v1` | OpenAI-compatible |
| MiMo-V2-Pro | `mimo-v2-pro` | `https://opencode.ai/zen/go/v1` | OpenAI-compatible |
| MiMo-V2-Omni | `mimo-v2-omni` | `https://opencode.ai/zen/go/v1` | OpenAI-compatible |
| MiniMax M2.5 | `minimax-m2.5` | `https://opencode.ai/zen/go/v1` | Anthropic-compatible |
| MiniMax M2.7 | `minimax-m2.7` | `https://opencode.ai/zen/go/v1` | Anthropic-compatible |

**API Key**: `sk-hzzyXqigLO0PVsBlzmiA1bTPXUor6TrpwlhBLVoSbO95gshcqKbJs0RgpGMBFois` (same as Zen)

## Implementation Steps

1. **Add env vars to `~/.hermes/.env`**:
   ```
   OPENCODE_GO_API_KEY=sk-hzzyXqigLO0PVsBlzmiA1bTPXUor6TrpwlhBLVoSbO95gshcqKbJs0RgpGMBFois
   OPENCODE_GO_BASE_URL=https://opencode.ai/zen/go/v1
   ```

2. **Verify Hermes recognizes `opencode-go` provider** - Already in `_PROVIDER_PREFIXES` in `agent/model_metadata.py`

3. **Test with a simple query**:
   ```bash
   python cli.py --model glm-5 --base-url https://opencode.ai/zen/go/v1 --api-key sk-hzzyXqigLO0PVsBlzmiA1bTPXUor6TrpwlhBLVoSbO95gshcqKbJs0RgpGMBFois -q "What is 2+2?"
   ```

4. **Optional: Add context lengths** to `DEFAULT_CONTEXT_LENGTHS` in `agent/model_metadata.py`:
   ```python
   "glm-5": 131072,
   "kimi-k2.5": 131072,
   "mimo-v2-pro": 131072,
   "mimo-v2-omni": 131072,
   "minimax-m2.5": 131072,
   "minimax-m2.7": 131072,
   ```

## Go Usage Limits

- **5 hour limit**: $12 of usage
- **Weekly limit**: $30 of usage
- **Monthly limit**: $60 of usage

Estimated requests per month:
- GLM-5: ~5,750 requests
- Kimi K2.5: ~9,250 requests
- MiniMax M2.5/M2.7: ~70,000-100,000 requests

## Notes

- The OpenCode Go API key is the **same** as the Zen API key
- OpenAI-compatible models use `/chat/completions` endpoint (auto-appended by SDK)
- Anthropic-compatible models (MiniMax) use `/messages` endpoint
- Hermes already supports both OpenAI and Anthropic API formats
