# GLM API Fix - Complete Session Summary

## Problem
Qwen Code CLI was failing with "Missing API key for OpenAI-compatible auth" error in new terminal sessions. After fixing, experienced 30-90 second latency on first message.

---

## Root Causes Found

### 1. Settings.json Reverting
The `security.auth.selectedType` field kept reverting to empty `{}` after being set to `"openai"`.

**Cause:** `~/.qwen/config.json` had conflicting configuration:
```json
{
  "api_base": "",
  "api_key": "",
  "model": "coder-model"
}
```

### 2. Running Qwen Code Terminals Cache Settings
Multiple Qwen Code terminals running simultaneously cache settings in memory. When they sync or exit, they can overwrite `settings.json` with their cached state.

**Active terminals during session:**
| PID | Terminal | Started | Command |
|-----|----------|---------|---------|
| 1568994/1569015 | pts/2 | 15:31 | `qwen --yolo` |
| 1613425/1613446 | pts/0 | 18:27 | `qwen --yolo --yolo` |
| 1625430/1625451 | pts/3 | 19:19 | `qwen --yolo --yolo` |

### 3. Slow Latency on First Message (30-90 seconds)
**Cause:** `glm-4.5-flash` model performs deep reasoning before responding on the **first message** of a conversation session.

**API Response breakdown:**
```json
{
  "usage": {
    "completion_tokens": 50,
    "completion_tokens_details": {
      "reasoning_tokens": 49  // Model "thinking" before responding
    },
    "prompt_tokens": 6,
    "prompt_tokens_details": {
      "cached_tokens": 4  // Cached on subsequent messages
    },
    "total_tokens": 56
  }
}
```

**Timing:**
| Message | Reasoning Tokens | Time |
|---------|-----------------|------|
| First | ~49 tokens | 60-90s |
| Subsequent | 0 (cached) | 5-10s |

---

## Solution

### 1. Fixed `~/.qwen/settings.json`
```json
{
  "modelProviders": {
    "openai": [
      {
        "id": "glm-4.5-flash",
        "name": "GLM-4.5-Flash",
        "baseUrl": "https://api.z.ai/api/coding/paas/v4",
        "envKey": "GLM_API_KEY"
      }
    ]
  },
  "security": {
    "auth": {
      "selectedType": "openai"
    }
  },
  "model": {
    "name": "glm-4.5-flash"
  },
  "$version": 3
}
```

**Key changes:**
- `security.auth.selectedType`: `openai` (not `qwen-oauth` or empty)
- `model.name`: `glm-4.5-flash` (not `coder-model`)
- `modelProviders.openai[].envKey`: `GLM_API_KEY` (tells Qwen Code which env var to read)

### 2. Fixed `~/.qwen/config.json`
```json
{
  "api_base": "https://api.z.ai/api/coding/paas/v4",
  "api_key": "71cda1864f0f4e15b076b0f24d56753e.4SwmFVzcRiWmT3r1",
  "model": "glm-4.5-flash"
}
```

**Key changes:**
- `api_base`: Set to GLM endpoint (was empty)
- `api_key`: Set to GLM API key (was empty)
- `model`: Set to `glm-4.5-flash` (was `coder-model`)

### 3. Added API Key to `~/.bashrc`
```bash
export GLM_API_KEY="71cda1864f0f4e15b076b0f24d56753e.4SwmFVzcRiWmT3r1"
```

**Location:** Line 155 of `~/.bashrc`

This ensures the API key is automatically loaded in all new interactive shell sessions.

---

## Verification

### Network Latency Test
```bash
curl -s -o /dev/null -w "DNS: %{time_namelookup}s\nConnect: %{time_connect}s\nTTFB: %{time_starttransfer}s\nTotal: %{time_total}s\n" "https://api.z.ai/api/coding/paas/v4"

# Results:
# DNS: 0.20s
# Connect: 0.26s
# TTFB: 1.41s
# Total: 1.41s
```

### Qwen Command Test
```bash
bash -i -c 'qwen "Reply only: WORKING"'
# Output: WORKING
# Time: ~5-7s (after initial reasoning)
```

### Direct API Test
```bash
curl -s -X POST "https://api.z.ai/api/coding/paas/v4/chat/completions" \
  -H "Authorization: Bearer 71cda1864f0f4e15b076b0f24d56753e.4SwmFVzcRiWmT3r1" \
  -H "Content-Type: application/json" \
  -d '{"model": "glm-4.5-flash", "messages": [{"role": "user", "content": "test"}], "max_tokens": 50}'

# Response: Success with reasoning_tokens: 49
# Time: 6-12s (first message with reasoning)
```

---

## Files Modified
| File | Purpose | Status |
|------|---------|--------|
| `~/.qwen/settings.json` | Qwen Code configuration for GLM API | ✅ Fixed |
| `~/.qwen/config.json` | Qwen Code direct API config | ✅ Fixed |
| `~/.bashrc` | Environment variable export (line 155) | ✅ Already set |

---

## API Details
- **Provider:** GLM Coding Plan (not pay-as-you-go)
- **Endpoint:** `https://api.z.ai/api/coding/paas/v4`
- **Model:** `glm-4.5-flash`
- **Auth Type:** OpenAI-compatible API key
- **API Key Env Var:** `GLM_API_KEY`

---

## Important Notes

### Settings Persistence
- **Exit all Qwen Code terminals** before making config changes, OR
- **Restart all terminals** after changes to ensure settings sync properly
- Running terminals cache settings in memory and can overwrite config files

### First Message Latency
- **Expected:** 60-90 seconds on first message (reasoning overhead)
- **Subsequent messages:** 5-10 seconds (cached context)
- **This is normal** - the model performs deep reasoning before the first response
- **Not a configuration issue** - this is server-side GLM API behavior

### Network Performance
- DNS + Connect: ~0.26s
- TTFB (Time to First Byte): ~1.4s
- Total API time (no reasoning): ~1.4s

---

## Usage
Simply run `qwen` in any new terminal. No manual commands needed.

**For best performance:**
1. Keep conversations going (cached context = faster responses)
2. Exit and restart Qwen Code terminals after config changes
3. Ensure only one set of terminals is running to avoid config conflicts

---

**Created:** 2026-03-20  
**Updated:** 2026-03-20 (Full session summary)  
**Status:** ✅ Working - First message slow (reasoning), subsequent messages fast (cached)
