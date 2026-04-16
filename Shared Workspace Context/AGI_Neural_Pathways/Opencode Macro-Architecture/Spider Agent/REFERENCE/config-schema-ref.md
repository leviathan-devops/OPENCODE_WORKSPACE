# Spider Agent Config Schema Reference

## Complete JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "spider": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "agents": {
          "type": "object",
          "additionalProperties": {
            "type": "object",
            "properties": {
              "model": { "type": "string" },
              "temperature": { "type": "number" },
              "disabled": { "type": "boolean" },
              "fallback_models": {
                "type": "array",
                "items": { "type": "string" }
              }
            }
          }
        }
      }
    },
    "hooks": {
      "type": "object",
      "properties": {
        "system_enhancer": { "type": "boolean", "default": true },
        "compaction": { "type": "boolean", "default": true },
        "agent_activity": { "type": "boolean", "default": true },
        "delegation_tracker": { "type": "boolean", "default": true },
        "agent_awareness_max_chars": { "type": "number", "default": 4000 },
        "delegation_gate": { "type": "boolean", "default": true },
        "delegation_max_chars": { "type": "number", "default": 6000 }
      }
    },
    "context_budget": {
      "type": "object",
      "properties": {
        "enabled": { "type": "boolean", "default": true },
        "warn_threshold": { "type": "number", "default": 0.8 },
        "critical_threshold": { "type": "number", "default": 0.95 },
        "model_limits": {
          "type": "object",
          "additionalProperties": { "type": "number" }
        },
        "max_injection_tokens": { "type": "number", "default": 32000 },
        "tracked_agents": {
          "type": "array",
          "items": { "type": "string" },
          "default": ["architect"]
        },
        "scoring": {
          "type": "object",
          "properties": {
            "enabled": { "type": "boolean", "default": true },
            "max_candidates": { "type": "number", "default": 10 },
            "weights": {
              "type": "object",
              "properties": {
                "phase": { "type": "number", "default": 2.0 },
                "current_task": { "type": "number", "default": 5.0 },
                "blocked_task": { "type": "number", "default": 4.0 },
                "recent_failure": { "type": "number", "default": 3.0 },
                "recent_success": { "type": "number", "default": 2.0 },
                "evidence_presence": { "type": "number", "default": 1.5 },
                "decision_recency": { "type": "number", "default": 1.0 },
                "dependency_proximity": { "type": "number", "default": 0.5 }
              }
            },
            "decision_decay": {
              "type": "object",
              "properties": {
                "mode": { "type": "string", "enum": ["linear", "exponential"], "default": "exponential" },
                "half_life_hours": { "type": "number", "default": 24 }
              }
            },
            "token_ratios": {
              "type": "object",
              "properties": {
                "prose": { "type": "number", "default": 0.4 },
                "code": { "type": "number", "default": 0.4 },
                "markdown": { "type": "number", "default": 0.15 },
                "json": { "type": "number", "default": 0.05 }
              }
            }
          }
        },
        "enforce": { "type": "boolean", "default": true },
        "prune_target": { "type": "number", "default": 0.7 },
        "preserve_last_n_turns": { "type": "number", "default": 5 },
        "recent_window": { "type": "number", "default": 20 },
        "enforce_on_agent_switch": { "type": "boolean", "default": true },
        "tool_output_mask_threshold": { "type": "number", "default": 10000 }
      }
    },
    "evidence": {
      "type": "object",
      "properties": {
        "enabled": { "type": "boolean", "default": true },
        "max_age_days": { "type": "number", "default": 30 },
        "max_bundles": { "type": "number", "default": 100 },
        "auto_archive": { "type": "boolean", "default": true }
      }
    },
    "gate": {
      "type": "object",
      "properties": {
        "syntax_check": { "type": "boolean", "default": true },
        "placeholder_scan": {
          "type": "object",
          "properties": {
            "enabled": { "type": "boolean", "default": true },
            "deny_patterns": {
              "type": "array",
              "items": { "type": "string" },
              "default": ["**/TODO*.{js,ts,jsx,tsx}", "**/FIXME*"]
            },
            "allow_globs": {
              "type": "array",
              "items": { "type": "string" },
              "default": ["**/*.generated.*", "**/node_modules/**"]
            },
            "max_allowed_findings": { "type": "number", "default": 0 }
          }
        },
        "sast_scan": { "type": "boolean", "default": true },
        "sbom_generate": { "type": "boolean", "default": true },
        "build_check": { "type": "boolean", "default": true },
        "quality_budget": {
          "type": "object",
          "properties": {
            "enabled": { "type": "boolean", "default": true },
            "max_complexity_delta": { "type": "number", "default": 0.1 },
            "max_public_api_delta": { "type": "number", "default": 0.15 },
            "max_duplication_ratio": { "type": "number", "default": 0.1 },
            "min_test_to_code_ratio": { "type": "number", "default": 0.3 },
            "enforce_on_globs": {
              "type": "array",
              "items": { "type": "string" },
              "default": ["**/*.{ts,tsx,js,jsx}"]
            },
            "exclude_globs": {
              "type": "array",
              "items": { "type": "string" },
              "default": ["**/node_modules/**", "**/dist/**", "**/*.generated.*"]
            }
          }
        }
      }
    },
    "pipeline": {
      "type": "object",
      "properties": {
        "parallel_precheck": { "type": "boolean", "default": false }
      }
    }
  }
}
```

## Agent Model Configuration

```json
{
  "spider": {
    "agents": {
      "spider": {
        "model": "1-minimax/MiniMax-M2.7",
        "fallback_models": ["1-deepseek/deepseek-chat"]
      },
      "coder": {
        "model": "0-glm-coding/glm-5",
        "fallback_models": ["1-minimax/MiniMax-M2.7"]
      },
      "reviewer": {
        "model": "0-opencode-zen/mimo-v2-omni-free",
        "fallback_models": ["1-minimax/MiniMax-M2.7"]
      },
      "test_engineer": {
        "model": "1-minimax/MiniMax-M2.7",
        "fallback_models": ["0-local-agent-models/omnicoder-9b-q4_k_m.gguf"]
      },
      "explorer": {
        "model": "0-opencode-zen/nemotron-3-super-free",
        "fallback_models": ["0-openrouter/google/gemini-2.5-flash"]
      },
      "sme": {
        "model": "0-openrouter/deepseek/deepseek-chat",
        "fallback_models": ["1-deepseek/deepseek-chat"]
      },
      "critic": {
        "model": "0-opencode-zen/mimo-v2-omni-free",
        "fallback_models": ["1-minimax/MiniMax-M2.7"]
      },
      "docs": {
        "model": "0-opencode-zen/nemotron-3-super-free",
        "fallback_models": ["1-minimax/MiniMax-M2.7"]
      },
      "designer": {
        "model": "0-opencode-zen/nemotron-3-super-free",
        "fallback_models": ["1-minimax/MiniMax-M2.7"]
      }
    }
  }
}
```

## Default Values

| Setting | Default |
|---------|---------|
| `hooks.system_enhancer` | true |
| `hooks.compaction` | true |
| `hooks.agent_activity` | true |
| `hooks.delegation_tracker` | true |
| `hooks.agent_awareness_max_chars` | 4000 |
| `hooks.delegation_gate` | true |
| `hooks.delegation_max_chars` | 6000 |
| `context_budget.warn_threshold` | 0.8 |
| `context_budget.critical_threshold` | 0.95 |
| `context_budget.tracked_agents` | ["architect"] |
| `evidence.max_age_days` | 30 |
| `evidence.max_bundles` | 100 |
| `evidence.auto_archive` | true |
| `gate.syntax_check.enabled` | true |
| `gate.sast_scan.enabled` | true |
| `gate.sbom_generate.enabled` | true |
| `gate.build_check.enabled` | true |
