# OpenCode Zen Integration Workflow

## Overview
Integrate OpenCode Zen free models (MiMo V2 Omni Free, Nemotron 3 Super Free, MiniMax M2.5 Free) into Shark Frankenstein CLI. These models are available through OpenCode Zen at no cost during their beta period and provide enhanced capabilities for specific agent roles.

## Current Provider Setup

### Existing Providers (5)
1. **`0-glm-coding`**: GLM models (GLM-5, GLM-4.7, GLM-4.5-flash)
2. **`0-deepseek`**: DeepSeek models (Chat, Reasoner)
3. **`0-local-vllm`**: Local Qwen 2.5 Coder 7B
4. **`0-mimo`**: MiMo V2 Omni (direct provider)
5. **`0-nemotron`**: Nemotron 3 Super (direct provider)

### Problem Statement
- MiMo and Nemotron are currently configured as direct providers requiring separate API keys
- MiniMax M2.5 Free is not configured at all
- No fallback chain for free models

## Zen Integration Strategy

### 1. Add OpenCode Zen Provider
Add a new provider `0-opencode-zen` that gives access to all Zen models, including free offerings.

### 2. Model Fallback Chain
Create a priority system:
1. **First**: Zen free models (MiMo V2 Omni Free, Nemotron 3 Super Free, MiniMax M2.5 Free)
2. **Second**: Zen paid models (GLM-5, etc. via Zen)
3. **Third**: Direct providers (current setup)
4. **Fourth**: Local vLLM as ultimate fallback

### 3. Agent Model Updates
Update agent configurations to prefer Zen free models where appropriate:
- **Visual Cortex**: MiMo V2 Omni Free → Zen free model
- **Middle Manager**: Nemotron 3 Super Free → Zen free model  
- **Quick Tasks**: MiniMax M2.5 Free → Zen free model
- **Primary Models**: GLM-5 via Zen (fallback to direct)

## Implementation Workflow

### Phase 1: Update OpenCode Configuration

**File**: `~/.config/opencode/opencode.json`

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-ultra"],
  "provider": {
    "0-opencode-zen": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "OpenCode Zen",
      "options": {
        "baseURL": "https://opencode.ai/zen/v1/chat/completions",
        "apiKey": "{env:OPENCODE_ZEN_API_KEY}"
      },
      "models": {
        "minimax-m2.5-free": {
          "name": "MiniMax M2.5 Free (128K)",
          "limit": {
            "context": 131072,
            "output": 8192
          }
        },
        "mimo-v2-omni-free": {
          "name": "MiMo V2 Omni Free (65K)",
          "limit": {
            "context": 65536,
            "output": 4096
          }
        },
        "nemotron-3-super-free": {
          "name": "Nemotron 3 Super Free (1M)",
          "limit": {
            "context": 1048576,
            "output": 16384
          }
        },
        "glm-5": {
          "name": "GLM-5 via Zen (128K)",
          "limit": {
            "context": 131072,
            "output": 8192
          }
        },
        "deepseek-chat": {
          "name": "DeepSeek Chat via Zen (128K)",
          "limit": {
            "context": 131072,
            "output": 8192
          }
        },
        "deepseek-reasoner": {
          "name": "DeepSeek Reasoner via Zen (128K)",
          "limit": {
            "context": 131072,
            "output": 8192
          }
        }
      }
    },
    "0-glm-coding": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "GLM Coding Plan",
      "options": {
        "baseURL": "https://api.z.ai/api/coding/paas/v4",
        "apiKey": "{env:GLM_API_KEY}"
      },
      "models": {
        "glm-5": {
          "name": "GLM-5 (128K)",
          "limit": {
            "context": 131072,
            "output": 8192
          }
        },
        "glm-4.7": {
          "name": "GLM-4.7 (128K)",
          "limit": {
            "context": 131072,
            "output": 8192
          }
        },
        "glm-4.5-flash": {
          "name": "GLM-4.5 Flash (32K)",
          "limit": {
            "context": 32768,
            "output": 4096
          }
        }
      }
    },
    "0-deepseek": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "DeepSeek",
      "options": {
        "baseURL": "https://api.deepseek.com",
        "apiKey": "{env:DEEPSEEK_API_KEY}"
      },
      "models": {
        "deepseek-chat": {
          "name": "DeepSeek Chat (128K)",
          "limit": {
            "context": 131072,
            "output": 8192
          }
        },
        "deepseek-reasoner": {
          "name": "DeepSeek Reasoner (128K)",
          "limit": {
            "context": 131072,
            "output": 8192
          }
        }
      }
    },
    "0-local-vllm": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "Local vLLM",
      "options": {
        "baseURL": "http://localhost:8000/v1"
      },
      "models": {
        "qwen-2.5-coder": {
          "name": "Qwen 2.5 Coder 7B AWQ (Local 32K)",
          "limit": {
            "context": 32768,
            "output": 8192
          }
        }
      }
    }
  },
  "model": "0-opencode-zen/glm-5",
  "small_model": "0-opencode-zen/minimax-m2.5-free",
  "disabled_providers": ["0-mimo", "0-nemotron"]
}
```

### Phase 2: Update OpenCode-Ultra Configuration

**File**: `~/.config/opencode/opencode-ultra.json` (agent model updates)

```json
{
  "agents": {
    "sisyphus": {
      "model": "0-opencode-zen/glm-5",
      "description": "Kraken Brain - Primary orchestrator",
      "fallback_models": ["0-glm-coding/glm-5", "0-deepseek/deepseek-reasoner"]
    },
    "oracle": {
      "model": "0-opencode-zen/deepseek-reasoner",
      "description": "Architect - Design architect & debugger",
      "fallback_models": ["0-deepseek/deepseek-reasoner", "0-glm-coding/glm-5"]
    },
    "hephaestus": {
      "model": "0-glm-coding/glm-4.7",
      "description": "Shark Agent - Deep autonomous worker",
      "fallback_models": ["0-opencode-zen/glm-5", "0-local-vllm/qwen-2.5-coder"]
    },
    "momus": {
      "model": "0-opencode-zen/deepseek-chat",
      "description": "Code Review - Code reviewer",
      "fallback_models": ["0-deepseek/deepseek-chat", "0-opencode-zen/minimax-m2.5-free"]
    },
    "metis": {
      "model": "0-opencode-zen/deepseek-reasoner",
      "description": "Planning Brain - Strategic planner",
      "fallback_models": ["0-deepseek/deepseek-reasoner", "0-glm-coding/glm-5"]
    },
    "explore": {
      "model": "0-glm-coding/glm-4.5-flash",
      "description": "Scout - Fast codebase explorer",
      "fallback_models": ["0-opencode-zen/minimax-m2.5-free", "0-local-vllm/qwen-2.5-coder"]
    },
    "librarian": {
      "model": "0-opencode-zen/deepseek-chat",
      "description": "Scribe - Documentation researcher",
      "fallback_models": ["0-deepseek/deepseek-chat", "0-opencode-zen/minimax-m2.5-free"]
    },
    "multimodal-looker": {
      "model": "0-opencode-zen/mimo-v2-omni-free",
      "description": "Visual Cortex - Visual analyzer",
      "fallback_models": ["0-mimo/mimo-v2-omni", "0-opencode-zen/glm-5"]
    },
    "atlas": {
      "model": "0-opencode-zen/nemotron-3-super-free",
      "description": "Middle Manager - Task orchestrator",
      "fallback_models": ["0-nemotron/nemotron-3-super", "0-opencode-zen/deepseek-reasoner"]
    }
  },
  "categories": {
    "quick": { "model": "0-opencode-zen/minimax-m2.5-free" },
    "deep": { "model": "0-opencode-zen/glm-5" },
    "coding": { "model": "0-glm-coding/glm-4.7" },
    "micro": { "model": "0-local-vllm/qwen-2.5-coder" },
    "macro": { "model": "0-opencode-zen/glm-5" },
    "thinking": { "model": "0-opencode-zen/deepseek-reasoner" },
    "visual": { "model": "0-opencode-zen/mimo-v2-omni-free" },
    "context": { "model": "0-opencode-zen/nemotron-3-super-free" }
  },
  "background_task": {
    "defaultConcurrency": 3,
    "providerConcurrency": {
      "0-opencode-zen": 5,
      "0-glm-coding": 5,
      "0-deepseek": 3,
      "0-local-vllm": 2
    },
    "modelConcurrency": {
      "0-opencode-zen/minimax-m2.5-free": 10,
      "0-opencode-zen/mimo-v2-omni-free": 3,
      "0-opencode-zen/nemotron-3-super-free": 2,
      "0-opencode-zen/glm-5": 2,
      "0-glm-coding/glm-5": 2,
      "0-glm-coding/glm-4.7": 3
    }
  }
}
```

### Phase 3: Create Model Fallback System

**Script**: `model-fallback.sh` (integrated into Shark launcher)

```bash
#!/bin/bash
# Model fallback resolution for Shark CLI

resolve_model() {
    local preferred_model="$1"
    local agent_type="$2"
    
    # Check if model is available
    if check_model_available "$preferred_model"; then
        echo "$preferred_model"
        return
    fi
    
    # Agent-specific fallback chains
    case "$agent_type" in
        "visual"|"multimodal-looker")
            try_models "0-opencode-zen/mimo-v2-omni-free" "0-mimo/mimo-v2-omni" "0-opencode-zen/glm-5"
            ;;
        "context"|"atlas")
            try_models "0-opencode-zen/nemotron-3-super-free" "0-nemotron/nemotron-3-super" "0-opencode-zen/deepseek-reasoner"
            ;;
        "quick"|"explore"|"scout")
            try_models "0-opencode-zen/minimax-m2.5-free" "0-glm-coding/glm-4.5-flash" "0-local-vllm/qwen-2.5-coder"
            ;;
        "orchestrator"|"sisyphus"|"kraken-brain")
            try_models "0-opencode-zen/glm-5" "0-glm-coding/glm-5" "0-deepseek/deepseek-reasoner"
            ;;
        *)
            try_models "0-opencode-zen/glm-5" "0-glm-coding/glm-4.7" "0-local-vllm/qwen-2.5-coder"
            ;;
    esac
}

check_model_available() {
    local model="$1"
    
    # Check Zen models (need API key)
    if [[ "$model" == *"0-opencode-zen/"* ]]; then
        if [ -n "$OPENCODE_ZEN_API_KEY" ]; then
            # Simple ping to check availability
            curl -s -H "Authorization: Bearer $OPENCODE_ZEN_API_KEY" \
                 "https://opencode.ai/zen/v1/models" > /dev/null 2>&1
            return $?
        fi
        return 1
    fi
    
    # Check direct providers
    if [[ "$model" == *"0-glm-coding/"* ]]; then
        [ -n "$GLM_API_KEY" ] && return 0
    elif [[ "$model" == *"0-deepseek/"* ]]; then
        [ -n "$DEEPSEEK_API_KEY" ] && return 0
    elif [[ "$model" == *"0-local-vllm/"* ]]; then
        # Check if local server is running
        curl -s "http://localhost:8000/v1/models" > /dev/null 2>&1
        return $?
    fi
    
    return 1
}

try_models() {
    for model in "$@"; do
        if check_model_available "$model"; then
            echo "$model"
            return
        fi
    done
    
    # Ultimate fallback
    echo "0-local-vllm/qwen-2.5-coder"
}
```

### Phase 4: Update Shark Launcher with Zen Support

**Add to `shark-launcher.sh`**:

```bash
# Check Zen availability
check_zen_availability() {
    if [ -n "$OPENCODE_ZEN_API_KEY" ]; then
        echo "✅ OpenCode Zen: Available (Free models enabled)"
        return 0
    else
        echo "⚠️  OpenCode Zen: API key not set (free models disabled)"
        echo "   Set OPENCODE_ZEN_API_KEY to enable MiMo/Nemotron/MiniMax free models"
        return 1
    fi
}

# Update prepare_environment function
prepare_environment() {
    local mode="$1"
    
    # Check providers
    check_zen_availability
    check_glm_availability
    check_deepseek_availability
    check_local_vllm
    
    # Rest of function...
}
```

### Phase 5: Create Provider Status Command

**Add to Shark CLI**:
```bash
shark --providers
```

**Output**:
```
🦈 Provider Status
==================
OpenCode Zen:     ✅ Available (Free models: MiMo/Nemotron/MiniMax)
GLM Coding:       ✅ Available (GLM-5, GLM-4.7, GLM-4.5-flash)
DeepSeek:         ✅ Available (Chat, Reasoner)
Local vLLM:       ✅ Running (Qwen 2.5 Coder 7B)
MiMo Direct:      ⚠️  Disabled (using Zen free model)
Nemotron Direct:  ⚠️  Disabled (using Zen free model)

Recommended: Set OPENCODE_ZEN_API_KEY for free model access.
```

## Testing Workflow

### Test 1: Zen Provider Configuration
```bash
# Check if Zen provider is loaded
opencode run --model "0-opencode-zen/minimax-m2.5-free" "Hello"

# Expected: Successful response from MiniMax M2.5 Free
```

### Test 2: Free Model Access
```bash
# Test MiMo V2 Omni Free
opencode run --model "0-opencode-zen/mimo-v2-omni-free" "Describe this image" @image.png

# Test Nemotron 3 Super Free
opencode run --model "0-opencode-zen/nemotron-3-super-free" "Summarize this long document" @doc.txt

# Test MiniMax M2.5 Free
opencode run --model "0-opencode-zen/minimax-m2.5-free" "Write a quick function"
```

### Test 3: Agent Model Fallbacks
```bash
# Disable Zen API key to test fallback
unset OPENCODE_ZEN_API_KEY
shark --micro "test task"

# Should fall back to GLM-4.7 for Shark Agent
# Should fall back to direct providers for Visual Cortex/Middle Manager
```

### Test 4: Concurrency Limits
```bash
# Spawn multiple agents to test Zen concurrency
shark --macro "complex task requiring multiple agents"

# Verify pool limits are respected (5 concurrent for Zen)
```

## Configuration Management

### Environment Variables Required
```bash
# Required for Zen
export OPENCODE_ZEN_API_KEY="your-zen-api-key"

# Existing providers
export GLM_API_KEY="71cda1864f0f4e15b076b0f24d56753e.4SwmFVzcRiWmT3r1"
export DEEPSEEK_API_KEY="sk-e8e93e31b582423e9fdaa4ab8e9347e2"

# Optional (for direct provider fallback)
export MIMO_API_KEY=""
export NEMOTRON_API_KEY=""
```

### Configuration File Locations
1. **Primary**: `~/.config/opencode/opencode.json` (with Zen provider)
2. **Shark-specific**: `~/OPENCODE_WORKSPACE/.shark/config/zen-models.json`
3. **Fallback chains**: `~/OPENCODE_WORKSPACE/.shark/config/fallback.json`
4. **Provider status cache**: `~/.cache/shark/providers.json`

## Performance Optimization

### 1. Provider Health Checking
- **Cache provider status** for 5 minutes
- **Background health checks** every minute
- **Fast failover** to next provider in chain

### 2. Model Selection Algorithm
```javascript
function selectBestModel(agentType, taskComplexity) {
  // Priority 1: Free models for appropriate tasks
  if (agentType === 'visual' && zenAvailable) {
    return '0-opencode-zen/mimo-v2-omni-free';
  }
  
  // Priority 2: Zen paid models (better routing)
  if (zenAvailable && taskComplexity === 'high') {
    return '0-opencode-zen/glm-5';
  }
  
  // Priority 3: Direct providers
  if (glmAvailable) {
    return '0-glm-coding/glm-5';
  }
  
  // Priority 4: Local fallback
  return '0-local-vllm/qwen-2.5-coder';
}
```

### 3. Connection Pooling
- **Reuse connections** to Zen API
- **Keep-alive** for frequent requests
- **Batch requests** where possible

## Security Considerations

### 1. API Key Management
- **Never log keys** in plaintext
- **Environment variables** only
- **Key rotation** support

### 2. Free Model Limitations
- **Data usage**: Free models may use data for improvement
- **Rate limiting**: Zen free models have quotas
- **Availability**: Beta period may end

### 3. Fallback Security
- **Validate responses** from all providers
- **Sanitize inputs** before sending to models
- **Audit trails** for compliance

## Monitoring & Logging

### Metrics to Track
```bash
# Provider usage statistics
shark --stats

# Output:
# Zen Free Models: 45 requests (MiMo: 20, Nemotron: 15, MiniMax: 10)
# Zen Paid Models: 120 requests
# Direct Providers: 85 requests
# Local vLLM: 5 requests (fallback)
```

### Log Files
- `~/.shark/logs/zen-usage.log` - Zen model usage
- `~/.shark/logs/fallback-events.log` - Fallback triggers
- `~/.shark/logs/provider-health.log` - Health check results

## Rollback Plan

### If Zen Integration Fails
1. **Disable Zen provider** in config
2. **Revert to direct providers**
3. **Update agent models** to use originals
4. **Notify users** of temporary degradation

### Steps to Rollback
```bash
# 1. Edit opencode.json
# Remove "0-opencode-zen" provider
# Re-enable "0-mimo" and "0-nemotron"

# 2. Edit opencode-ultra.json  
# Update agent models to use direct providers
# Remove Zen-specific categories

# 3. Update Shark launcher
# Remove Zen availability checks
```

## Success Criteria

### Technical
- [ ] Zen provider loads without errors
- [ ] Free models are accessible
- [ ] Fallback chains work correctly
- [ ] No performance degradation
- [ ] All original functionality preserved

### User Experience
- [ ] Users can access free models transparently
- [ ] Automatic fallback when Zen unavailable
- [ ] Clear provider status information
- [ ] No additional configuration required

### Operational
- [ ] Monitoring in place for Zen availability
- [ ] Logging tracks model usage
- [ ] Easy rollback procedure
- [ ] Documentation updated

## Implementation Timeline

### Day 1: Foundation
- Update OpenCode configuration with Zen provider
- Test basic Zen model access
- Create provider health checking

### Day 2: Integration
- Update opencode-ultra.json agent models
- Implement fallback resolution
- Test agent spawning with Zen models

### Day 3: Shark CLI Updates
- Integrate Zen checks into Shark launcher
- Add provider status command
- Test full workflow

### Day 4: Testing & Optimization
- Performance testing with free models
- Fallback scenario testing
- Documentation updates

### Day 5: Deployment
- Roll out to users
- Monitor initial usage
- Address any issues

---

*This workflow provides complete integration of OpenCode Zen free models into Shark Frankenstein CLI with robust fallback mechanisms and transparent user experience.*