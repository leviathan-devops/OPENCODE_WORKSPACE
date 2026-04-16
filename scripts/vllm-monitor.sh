#!/bin/bash
# Monitor vLLM Qwen server

echo "=== vLLM Qwen Monitor ==="
echo "Timestamp: $(date)"
echo ""

# Check if vLLM is running
if pgrep -f "vllm serve" > /dev/null; then
    echo "✓ vLLM server is running"
    
    # Check API endpoint
    echo -n "API endpoint: "
    curl -s http://localhost:8000/v1/models 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',[{}])[0].get('id', 'Unknown'))" || echo "Not responding"
    
    # Check GPU memory
    echo ""
    echo "GPU Memory Usage:"
    nvidia-smi --query-gpu=memory.used,memory.total,utilization.gpu --format=csv,noheader
    
else
    echo "✗ vLLM server is NOT running"
fi

echo ""
echo "System Resources:"
free -h | grep -E "^Mem:|^Swap:"

echo ""
echo "Processes:"
ps aux | grep -E "(vllm|qwen)" | grep -v grep | grep -v "vllm-monitor" | head -5

echo ""
echo "To start vLLM: ~/start-vllm-qwen.sh"
echo "To switch to local API: qwen-local"
echo "To check logs: journalctl --user -u vllm-qwen.service -f"