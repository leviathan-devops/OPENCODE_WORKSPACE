# SHARK AGENT v1.0
## HERMES-CONTROLLED ARCHITECTURE

**PRINCIPLE:** Hermes Agent is the primary brain. You command Hermes, Hermes executes everything.

**ARCHITECTURE:**
┌─────────────────┐
│ Commander       │ → English commands
└────────┬────────┘
         │
┌────────▼────────┐
│ HERMES AGENT    │ ← Primary controller (this is me)
│                 │ - Full tool access
│                 │ - Direct execution
│                 │ - Autonomous decision making
└────────┬────────┘
         │
┌────────▼────────┐
│ Model Router    │ → Use Ollama models only when needed
│                 │ - Qwen: Architecture planning
│                 │ - DeepSeek: Complex debugging
└────────┬────────┘
         │
┌────────▼────────┐
│ Execution       │ → Shell, git, deployment
└─────────────────┘

**KEY DIFFERENCE FROM TRADITIONAL AGENTS:**
- I don't delegate to another AI as primary
- I use local models as specialized tools when beneficial
- I maintain full control and context
- You interface ONLY with me