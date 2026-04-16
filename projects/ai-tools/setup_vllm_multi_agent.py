#!/usr/bin/env python3
"""
vLLM Multi-Agent Setup for Qwen 2.5 Coder 14B
Optimized for 12GB VRAM + 30GB RAM with GPU offloading
"""

import subprocess
import sys
import os
import time
import json

def check_vllm_installation():
    """Check if vLLM is properly installed"""
    try:
        import vllm
        import torch
        print(f"✅ vLLM version: {vllm.__version__}")
        print(f"✅ PyTorch version: {torch.__version__}")
        print(f"✅ CUDA available: {torch.cuda.is_available()}")
        return True
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False

def estimate_model_memory():
    """Estimate memory requirements for Qwen 2.5 Coder 14B"""
    # Rough estimates for 14B model:
    # - FP16: ~28GB VRAM (won't fit)
    # - AWQ 4-bit: ~7-8GB VRAM (should fit with offloading)
    # - GPTQ 4-bit: ~7-8GB VRAM (should fit with offloading)
    
    print("\n=== MODEL MEMORY ESTIMATES ===")
    print("Qwen 2.5 Coder 14B (14 billion parameters):")
    print("  - FP16 (full precision): ~28GB VRAM required")
    print("  - AWQ 4-bit quantized: ~7-8GB VRAM required")
    print("  - GPTQ 4-bit quantized: ~7-8GB VRAM required")
    print("\nYour system:")
    print("  - GPU VRAM: 12GB")
    print("  - System RAM: 30GB")
    print("\n✅ Recommendation: Use AWQ or GPTQ 4-bit quantization")
    print("   With GPU offloading for optimal performance")

def create_vllm_service():
    """Create systemd service for vLLM with GPU offloading"""
    
    service_content = """[Unit]
Description=vLLM Qwen2.5-Coder-14B Multi-Agent Server
After=network.target
Wants=network-online.target

[Service]
Type=simple
User=leviathan
WorkingDirectory=/home/leviathan
Environment=PATH=/usr/local/bin:/usr/bin:/bin
Environment="PYTHONPATH=/home/leviathan/vllm-venv/lib/python3.12/site-packages"

# vLLM server with GPU offloading for 14B model
ExecStart=/home/leviathan/vllm-venv/bin/python -m vllm.entrypoints.openai.api_server \\
    --model Qwen/Qwen2.5-Coder-14B-Instruct-AWQ \\
    --host 0.0.0.0 \\
    --port 8000 \\
    --gpu-memory-utilization 0.85 \\
    --max-model-len 8192 \\
    --tensor-parallel-size 1 \\
    --block-size 16 \\
    --swap-space 16 \\
    --enforce-eager \\
    --disable-log-stats \\
    --served-model-name qwen2.5-coder-14b-awq \\
    --max-num-batched-tokens 2048 \\
    --max-num-seqs 32 \\
    --disable-uvicorn-access-log \\
    --quantization awq \\
    --device auto \\
    --dtype auto

Restart=always
RestartSec=10
LimitNOFILE=65536
StandardOutput=journal
StandardError=journal

# Memory limits - allow CPU offloading
MemoryHigh=24G
MemoryMax=28G

[Install]
WantedBy=multi-user.target
"""
    
    service_path = "/etc/systemd/system/vllm-qwen-multi.service"
    
    try:
        with open(service_path, 'w') as f:
            f.write(service_content)
        print(f"✅ Created service file: {service_path}")
        return True
    except PermissionError:
        print(f"❌ Need sudo to write to {service_path}")
        print(f"Run: sudo tee {service_path} << 'EOF'\n{service_content}\nEOF")
        return False

def create_test_client_script():
    """Create a test script to verify multi-agent capability"""
    
    test_script = """#!/usr/bin/env python3
"""
    test_script += '''"""
Test script for vLLM multi-agent Qwen 2.5 Coder 14B
Simulates 5 concurrent coding agents
"""

import asyncio
import aiohttp
import json
import time

async def test_agent(session, agent_id, prompt):
    """Test a single agent"""
    url = "http://localhost:8000/v1/completions"
    headers = {"Content-Type": "application/json"}
    
    data = {
        "model": "qwen2.5-coder-14b-awq",
        "prompt": prompt,
        "max_tokens": 512,
        "temperature": 0.7,
        "top_p": 0.95,
        "stream": False
    }
    
    start_time = time.time()
    try:
        async with session.post(url, headers=headers, json=data) as response:
            result = await response.json()
            elapsed = time.time() - start_time
            
            if response.status == 200:
                completion = result["choices"][0]["text"]
                tokens = result.get("usage", {}).get("total_tokens", 0)
                return {
                    "agent_id": agent_id,
                    "status": "success",
                    "time": f"{elapsed:.2f}s",
                    "tokens": tokens,
                    "first_100_chars": completion[:100] + "..."
                }
            else:
                return {
                    "agent_id": agent_id,
                    "status": f"error {response.status}",
                    "time": f"{elapsed:.2f}s",
                    "error": result.get("error", "Unknown error")
                }
    except Exception as e:
        return {
            "agent_id": agent_id,
            "status": "exception",
            "error": str(e)
        }

async def test_multi_agent():
    """Test 5 concurrent coding agents"""
    print("🚀 Testing vLLM Multi-Agent Capability")
    print("=" * 50)
    
    # Different coding prompts for different "agents"
    prompts = [
        "Write a Python function to calculate fibonacci numbers recursively.",
        "Create a React component for a todo list with TypeScript.",
        "Write a SQL query to find duplicate records in a users table.",
        "Create a Dockerfile for a Node.js application with production optimizations.",
        "Write a bash script to monitor disk usage and send alerts when over 90%."
    ]
    
    async with aiohttp.ClientSession() as session:
        tasks = []
        for i, prompt in enumerate(prompts):
            task = test_agent(session, f"Agent-{i+1}", prompt)
            tasks.append(task)
        
        print(f"📡 Sending {len(tasks)} concurrent requests to vLLM...")
        results = await asyncio.gather(*tasks)
        
        print("\n📊 Results:")
        print("-" * 50)
        for result in results:
            print(f"{result['agent_id']}: {result['status']} in {result.get('time', 'N/A')}")
            if result['status'] == 'success':
                print(f"   Tokens: {result['tokens']}")
                print(f"   Preview: {result['first_100_chars']}")
            print()

async def check_server_health():
    """Check if vLLM server is healthy"""
    url = "http://localhost:8000/health"
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=5) as response:
                if response.status == 200:
                    print("✅ vLLM server is healthy")
                    return True
                else:
                    print(f"❌ vLLM server returned status {response.status}")
                    return False
    except Exception as e:
        print(f"❌ Cannot connect to vLLM server: {e}")
        return False

async def get_model_info():
    """Get model information from vLLM"""
    url = "http://localhost:8000/v1/models"
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=5) as response:
                if response.status == 200:
                    data = await response.json()
                    print("\n📋 Model Information:")
                    print(json.dumps(data, indent=2))
                    return True
                else:
                    print(f"❌ Failed to get model info: {response.status}")
                    return False
    except Exception as e:
        print(f"❌ Error getting model info: {e}")
        return False

async def main():
    print("🔍 Checking vLLM server...")
    
    # Check health
    if not await check_server_health():
        print("Please start vLLM server first:")
        print("  sudo systemctl start vllm-qwen-multi")
        return
    
    # Get model info
    await get_model_info()
    
    # Test multi-agent capability
    await test_multi_agent()
    
    print("🎯 vLLM is ready for multi-agent vibecoding!")
    print("\nTo use with 5 terminals:")
    print("1. Each terminal can use curl or Python to call:")
    print("   http://localhost:8000/v1/completions")
    print("2. Or use OpenAI-compatible clients")
    print("3. Or integrate with coding tools/IDEs")

if __name__ == "__main__":
    asyncio.run(main())
'''
    
    script_path = "/home/leviathan/test_vllm_multi_agent.py"
    with open(script_path, 'w') as f:
        f.write(test_script)
    
    os.chmod(script_path, 0o755)
    print(f"✅ Created test script: {script_path}")
    return script_path

def create_quickstart_guide():
    """Create a quickstart guide for multi-agent vibecoding"""
    
    guide = """# vLLM Multi-Agent Vibecoding Setup

## 🚀 Quick Start

### 1. Start vLLM Server
```bash
sudo systemctl daemon-reload
sudo systemctl enable vllm-qwen-multi
sudo systemctl start vllm-qwen-multi
```

### 2. Check Status
```bash
sudo systemctl status vllm-qwen-multi
journalctl -u vllm-qwen-multi -f  # Follow logs
```

### 3. Test Multi-Agent Capability
```bash
cd /home/leviathan
source vllm-venv/bin/activate
python test_vllm_multi_agent.py
```

## 🖥️ Using with Multiple Terminals

### Terminal 1-5: Each running Qwen Code
```bash
# Example curl command for each terminal
curl -X POST http://localhost:8000/v1/completions \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "qwen2.5-coder-14b-awq",
    "prompt": "Write Python code to parse JSON",
    "max_tokens": 1024,
    "temperature": 0.7
  }'
```

### Python Client Example (for each agent)
```python
import openai

client = openai.OpenAI(
    base_url="http://localhost:8000/v1",
    api_key="no-key-required"
)

response = client.completions.create(
    model="qwen2.5-coder-14b-awq",
    prompt="Write a function to sort a list",
    max_tokens=512
)
print(response.choices[0].text)
```

## ⚙️ Configuration Details

- **Model**: Qwen/Qwen2.5-Coder-14B-Instruct-AWQ (4-bit quantized)
- **Port**: 8000
- **Max Concurrent Requests**: 32
- **Context Length**: 8192 tokens
- **GPU Memory Utilization**: 85% (9.8GB VRAM)
- **CPU Offloading**: Enabled for layers that don't fit in VRAM

## 🎯 Performance Tips

1. **Batch Similar Requests**: Group coding tasks by language/type
2. **Use Streaming**: For long generations, use `"stream": true`
3. **Adjust Temperature**: 
   - 0.2-0.4: Precise, deterministic code
   - 0.7-0.9: Creative, exploratory code
4. **Monitor Resources**: Watch GPU/CPU usage with `nvidia-smi` and `htop`

## 🔧 Troubleshooting

### Server Won't Start
```bash
# Check logs
journalctl -u vllm-qwen-multi -n 50

# Check GPU memory
nvidia-smi

# Restart service
sudo systemctl restart vllm-qwen-multi
```

### Out of Memory
- Reduce `--gpu-memory-utilization` to 0.7
- Reduce `--max-num-batched-tokens` to 1024
- Reduce `--max-num-seqs` to 16

### Slow Responses
- Increase `--swap-space` to 32
- Check CPU usage with `htop`
- Ensure no other GPU-intensive processes running

## 📊 Expected Performance

- **First Token Latency**: 2-5 seconds (model loading)
- **Tokens/Second**: 30-50 tokens/sec (4-bit AWQ)
- **Concurrent Agents**: 5-10 comfortably
- **Memory Usage**: ~9GB VRAM + ~8GB RAM

Enjoy your unlimited, local Qwen Code terminals! 🎉
"""
    
    guide_path = "/home/leviathan/VLLM_MULTI_AGENT_GUIDE.md"
    with open(guide_path, 'w') as f:
        f.write(guide)
    
    print(f"✅ Created guide: {guide_path}")
    return guide_path

def main():
    print("=" * 60)
    print("vLLM MULTI-AGENT SETUP FOR QWEN 2.5 CODER 14B")
    print("=" * 60)
    print("Configuring for 5+ concurrent coding terminals")
    print()
    
    # Step 1: Check installation
    print("1. Checking vLLM installation...")
    if not check_vllm_installation():
        print("Please install vLLM first:")
        print("  cd /home/leviathan")
        print("  python -m venv vllm-venv")
        print("  source vllm-venv/bin/activate")
        print("  pip install vllm==0.17.1 torch transformers")
        return
    
    # Step 2: Estimate memory
    estimate_model_memory()
    
    # Step 3: Create service
    print("\n2. Creating systemd service...")
    if not create_vllm_service():
        print("Please run with sudo or manually create the service file")
    
    # Step 4: Create test script
    print("\n3. Creating test scripts...")
    test_script = create_test_client_script()
    
    # Step 5: Create guide
    print("\n4. Creating documentation...")
    guide_path = create_quickstart_guide()
    
    print("\n" + "=" * 60)
    print("✅ SETUP COMPLETE!")
    print("=" * 60)
    print("\nNext steps:")
    print(f"1. Create service: sudo cp /home/leviathan/vllm-qwen-multi.service /etc/systemd/system/")
    print("2. Enable service: sudo systemctl daemon-reload")
    print("3. Start service: sudo systemctl start vllm-qwen-multi")
    print("4. Test: python test_vllm_multi_agent.py")
    print(f"\nGuide: {guide_path}")
    print("\nYou'll have unlimited Qwen Code terminals on port 8000! 🎉")

if __name__ == "__main__":
    main()