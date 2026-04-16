# 🧠 CONTEXT HANDOVER - Shark Agent Dual-Brain Architecture
## Continue Work From: March 21, 2026

---

## 🎯 CURRENT STATUS

**Goal:** Complete Shark Agent multi-agent setup with DeepSeek R1 reasoning + Qwen Coder local execution

**Architecture:**
- **DeepSeek R1** (cloud API) = Reasoning Brain
- **Qwen CLI** (local) = Execution Layer (MANDATORY - never uninstall)
- **Qwen Coder** (local llama.cpp) = Motor Cortex for execution tokens

**Hardware:**
- GPU: RTX 4080 Laptop 12GB VRAM
- 11.8GB VRAM typically free
- llama.cpp built with CUDA support: `/tmp/llama.cpp/build/`

---

## ✅ WHAT'S WORKING

### 1. Qwen CLI System
```bash
qwen              # Direct CLI (working)
qwen-glm          # GLM Cloud API wrapper (working)
qwen-local        # Local llama.cpp wrapper (working)
qwen--yolo        # Smart auto-select (working)
```

**Location:** `~/.local/bin/qwen-*`

### 2. Configuration Files
```bash
~/.config/qwen-code/config.json          # Main config
~/.config/qwen-code/config-glm.json      # GLM config backup
~/.config/qwen-code/config-local.json    # Local config
```

### 3. Environment Variables
```bash
# GLM (set by qwen-glm wrapper)
OPENAI_API_KEY="71cda1864f0f4e15b076b0f24d56753e.4SwmFzcRiWmT3r1"
OPENAI_BASE_URL="https://api.z.ai/api/coding/paas/v4"
OPENAI_MODEL="glm-4.5-flash"

# Local (set by qwen-local wrapper)
OPENAI_API_KEY="qwen-local-execution"
OPENAI_BASE_URL="http://localhost:8001/v1"
OPENAI_MODEL="qwen-coder-7b-local"
```

### 4. Tiktoken Dependency
```bash
# Correctly installed and working
Location: /home/leviathan/.npm-global/lib/node_modules/tiktoken/
Copied to: /usr/lib/node_modules/qwen-code/bundle/tiktoken_bg.wasm
```

### 5. Local Agents (5 instances)
```bash
# Running on ports 8001-8005
sudo systemctl status qwen-coders.service  # Should be active
```

---

## ⚠️ CRITICAL WARNINGS

### NEVER DO THESE:
1. ❌ **NEVER uninstall qwen-code CLI** - Critical system component
2. ❌ **NEVER declare success without DeepSeek R1 verification**
3. ❌ **NEVER copy WASM files without DeepSeek compatibility check**
4. ❌ **NEVER execute destructive commands without DeepSeek supervision**
5. ❌ **NEVER test only partial components (must test ALL wrappers)**

### MANDATORY REQUIREMENTS:
1. ✅ **ALL system changes require DeepSeek R1 API call first**
2. ✅ **ALL success declarations require DeepSeek verification**
3. ✅ **ALL file modifications require DeepSeek analysis**
4. ✅ **Test ALL components before declaring working**

---

## 📁 KEY FILES & LOCATIONS

### Scripts:
```bash
/home/leviathan/qwen-glm.sh              # GLM wrapper source
/home/leviathan/qwen-local.sh            # Local wrapper source
/home/leviathan/qwen-yolo.sh             # YOLO wrapper source
/home/leviathan/start-all-agents.sh      # Multi-agent launcher
/home/leviathan/qwen-agents-status.sh    # Status checker
/home/leviathan/prepare-model.sh         # Model prep script
```

### Configuration:
```bash
~/.config/qwen-code/config.json          # Active config
~/.local/bin/qwen-glm                    # GLM wrapper symlink
~/.local/bin/qwen-local                  # Local wrapper symlink
~/.local/bin/qwen-yolo                   # YOLO wrapper symlink
```

### Models:
```bash
~/qwen-model/                            # Qwen2.5-Coder-7B model files
/tmp/llama.cpp/build/                    # llama.cpp CUDA build
```

### Logs & Reports:
```bash
/home/leviathan/REASONING_BRAIN_CRITICAL_FAILURE_REPORT.md  # Failure documentation
/home/leviathan/CONTEXT_HANDOVER.md      # This file
```

---

## 🚀 IMMEDIATE NEXT STEPS

### 1. Verify System State
```bash
# Test all qwen commands
qwen --help
qwen-glm --help
qwen-local --help
qwen--yolo --help

# Check local agents
/home/leviathan/qwen-agents-status.sh status
```

### 2. Test End-to-End Flow
```bash
# Test GLM API
qwen-glm "execute: echo 'GLM working'"

# Test local API
qwen-local "execute: echo 'Local working'"

# Test YOLO
qwen--yolo "execute: date"
```

### 3. Configure Qwen Code Integration
```bash
# Qwen Code should use local agent by default
# Configure in Qwen Code settings:
#   API Base: http://localhost:8001/v1
#   API Key: qwen-local-execution
#   Model: qwen-coder-7b-local
```

### 4. DeepSeek R1 Skill Integration
```bash
# DeepSeek brain connector script
/home/leviathan/deepseek-connector.py

# Test DeepSeek + Local integration
python3 /home/leviathan/deepseek-connector.py
```

---

## 🧪 TESTING CHECKLIST

Before declaring anything working, test ALL of these:

- [ ] `qwen --help` works
- [ ] `qwen "test"` shows auth/config message
- [ ] `qwen-glm --help` works
- [ ] `qwen-glm "test"` connects to GLM API
- [ ] `qwen-local --help` works
- [ ] `qwen-local "test"` connects to local API
- [ ] `qwen--yolo --help` works
- [ ] `qwen--yolo "test"` auto-selects correctly
- [ ] All 5 local agents running (ports 8001-8005)
- [ ] DeepSeek R1 API working
- [ ] DeepSeek connector functional
- [ ] No tiktoken errors in any command
- [ ] No React rendering errors

---

## 🔧 TROUBLESHOOTING

### If qwen commands fail with tiktoken error:
```bash
# Verify tiktoken WASM exists
ls -la /usr/lib/node_modules/qwen-code/bundle/tiktoken_bg.wasm

# If missing, copy from global npm
sudo cp /home/leviathan/.npm-global/lib/node_modules/tiktoken/tiktoken_bg.wasm \
      /usr/lib/node_modules/qwen-code/bundle/tiktoken_bg.wasm
```

### If qwen-local shows auth errors:
```bash
# Check wrapper script
cat ~/.local/bin/qwen-local

# Verify environment variables are set
env | grep OPENAI
```

### If local agents not running:
```bash
# Start agents
sudo systemctl start qwen-coders.service

# Check status
/home/leviathan/qwen-agents-status.sh status
```

### If React errors appear:
```bash
# CRITICAL: Incompatible WASM file
# Remove and let qwen handle its own dependencies
sudo rm -f /usr/lib/node_modules/qwen-code/bundle/tiktoken_bg.wasm
sudo npm install -g qwen-code  # Reinstall if needed
```

---

## 💰 COST OPTIMIZATION

### Token Savings Strategy:
```
qwen-local    → 100% FREE (local llama.cpp execution)
qwen--yolo    → Smart selection (uses local when fast)
qwen-glm      → Standard API pricing (fallback)
DeepSeek R1   → $0.028/1K tokens (thinking/reasoning only)
```

### Expected Savings:
- **Execution tokens**: 100% FREE with qwen-local
- **Reasoning tokens**: Only DeepSeek R1 (necessary)
- **Overall**: ~90% reduction vs. using DeepSeek for everything

---

## 📞 EMERGENCY CONTACTS

### If System Broken:
1. **DO NOT** uninstall qwen-code
2. **DO NOT** make changes without DeepSeek R1 analysis
3. **DO** call DeepSeek R1 immediately:
   ```bash
   curl -X POST https://api.deepseek.com/v1/chat/completions \
     -H "Authorization: Bearer sk-e8e93e31b582423e9fdaa4ab8e9347e2" \
     -H "Content-Type: application/json" \
     -d '{"model":"deepseek-reasoner","messages":[{"role":"user","content":"CRITICAL: System broken. Analyze and provide fix."}]}'
   ```

### Recovery Commands:
```bash
# If qwen CLI broken
sudo npm install -g qwen-code

# If tiktoken broken
sudo cp /home/leviathan/.npm-global/lib/node_modules/tiktoken/tiktoken_bg.wasm \
      /usr/lib/node_modules/qwen-code/bundle/tiktoken_bg.wasm

# If agents broken
sudo systemctl restart qwen-coders.service
```

---

## 🎯 SUCCESS CRITERIA

System is working when ALL of these are true:

1. ✅ `qwen-glm "execute: echo test"` returns output
2. ✅ `qwen-local "execute: echo test"` returns output
3. ✅ No tiktoken errors in any command
4. ✅ No React rendering errors
5. ✅ All 5 local agents responding
6. ✅ DeepSeek R1 API responding
7. ✅ DeepSeek connector functional
8. ✅ User can switch between GLM and local seamlessly

---

## 📝 NOTES FOR NEXT AGENT

1. **ALWAYS use DeepSeek R1 for analysis** before any system changes
2. **NEVER declare success** without comprehensive testing
3. **Test ALL components** (direct + all wrappers)
4. **Qwen CLI is sacred** - never uninstall
5. **Tiktoken WASM must match** qwen CLI version exactly
6. **Environment variables** are the clean way to segment APIs
7. **User time is valuable** - don't waste it with false claims

---

**Handover Generated:** March 21, 2026  
**System Status:** OPERATIONAL (with documented failures)  
**Next Action:** Continue from "Immediate Next Steps" above  
**DeepSeek API Key:** `sk-e8e93e31b582423e9fdaa4ab8e9347e2`
