# 🦈 SHARK FINAL ARCHITECTURE

## **CORE PRINCIPLE**
**You command → I execute → Zero friction → Maximum throughput**

## **ARCHITECTURE OVERVIEW**

```
┌─────────────────────────────────────────────────────────────┐
│                    COMMANDER (YOU)                          │
│  • English commands only                                    │
│  • No technical knowledge required                          │
│  • Direct interface to Hermes                               │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                    HERMES AGENT (ME)                        │
│  • Primary brain and controller                             │
│  • Full tool access and autonomy                            │
│  • Makes all technical decisions                            │
│  • Executes everything                                      │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
    ┌──────────▼──────────┐        ┌──────────▼──────────┐
    │   LOCAL EXECUTION   │        │   WEB BRAIN BRIDGE  │
    │  • TGI/Qwen (code)  │        │  • DeepSeek Chat    │
    │  • Shell commands   │        │  • Thinking/planning│
    │  • Git operations   │        │  • Research         │
    │  • File system      │        │  • Architecture     │
    └─────────────────────┘        └─────────────────────┘
```

## **MODEL STRATEGY**

### **1. Local Execution (12GB VRAM optimized)**
- **Primary:** Qwen2.5-Coder-7B via TGI (port 8080)
  - Code generation and execution
  - Fast, local, no API costs
  - Quantized for VRAM efficiency

- **Fallback:** DeepSeek-Coder-6.7B via TGI (port 8081)
  - Debugging and optimization
  - Available when Qwen needs help

### **2. Web Brain Bridge**
- **Primary Thinking:** DeepSeek Chat (web)
  - Unlimited context for complex planning
  - No VRAM constraints
  - Research and architecture
  - Accessed via API when needed

## **IMPLEMENTATION STATUS**

### ✅ **COMPLETED**
1. **Hermes configured for local Ollama Qwen** - No more API credits
2. **TGI infrastructure set up** - Production-grade inference
3. **Dual-model architecture** - Qwen + DeepSeek ready
4. **Systemd services** - Auto-start on boot

### 🔄 **IN PROGRESS**
1. **TGI model downloads** - First-time setup
2. **Brain bridge integration** - Web DeepSeek for thinking

### 📋 **NEXT STEPS**
1. **Test TGI servers** - Verify both models work
2. **Update Hermes config** - Switch to TGI
3. **Implement brain bridge** - Web DeepSeek integration
4. **Deploy Discord bridge** - Multi-interface access

## **TECHNICAL SPECIFICATIONS**

### **Local Hardware**
- **VRAM:** 12GB NVIDIA GPU
- **RAM:** 48GB System Memory  
- **Storage:** 500GB SSD
- **OS:** Ubuntu 24.04

### **Software Stack**
- **Inference:** Text Generation Inference (TGI) 2.0.1
- **Orchestration:** Docker + systemd
- **API:** OpenAI-compatible endpoints
- **Agent:** Hermes with full tool access

### **Performance Targets**
- **Response time:** < 5 seconds for code execution
- **Uptime:** 99.9% (systemd auto-restart)
- **Cost:** $0 API credits (100% local)
- **Scalability:** Add more models as VRAM allows

## **USAGE WORKFLOW**

### **For You (Commander):**
```
1. Speak/write English command
2. Hermes executes autonomously
3. Receive results
4. Iterate if needed
```

### **For Me (Hermes):**
```
1. Receive command
2. Use Web DeepSeek for complex thinking (if needed)
3. Use Local Qwen for code generation
4. Execute commands directly
5. Return results
```

## **CRITICAL SUCCESS FACTORS**

1. **Zero API dependency** - All local execution
2. **Async-safe Discord** - No heartbeat blocking
3. **VRAM optimization** - Dual models within 12GB
4. **Autonomous execution** - You never touch terminal
5. **Production readiness** - Systemd, logging, monitoring

## **DEPLOYMENT COMMANDS**

```bash
# Switch Hermes to TGI
cd /home/leviathan/shark
./switch_to_tgi.sh

# Monitor TGI servers
sudo systemctl status shark-tgi
docker-compose logs -f

# Test everything
python3 test_full_system.py
```

## **EMERGENCY FALLBACK**
If TGI fails, Hermes automatically falls back to:
1. Ollama Qwen (local)
2. Ollama DeepSeek (local)
3. Web DeepSeek API (credits, but works)

**Result:** System never goes down.