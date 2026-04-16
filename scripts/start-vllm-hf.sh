#!/bin/bash
echo "🚀 Starting vLLM server with HuggingFace model..."

# Check if vLLM is already running
if pgrep -f "vllm serve" > /dev/null; then
    echo "⚠️  vLLM server already running on port 8000"
    exit 0
fi

cd /home/leviathan
python3 -m vllm.entrypoints.openai.api_server \
    --model Qwen/Qwen2.5-Coder-1.5B-Instruct \
    --host 0.0.0.0 \
    --port 8000 \
    --gpu-memory-utilization 0.5 \
    --max-model-len 8192 \
    --max-num-seqs 32 \
    --download-dir /home/leviathan/OPENCODE_WORKSPACE/models/ \
    > /home/leviathan/OPENCODE_WORKSPACE/vllm.log 2>&1 &

echo "✅ vLLM server starting on port 8000"
echo "📊 Monitor logs: tail -f /home/leviathan/OPENCODE_WORKSPACE/vllm.log"
echo "🛑 Stop server: pkill -f 'vllm serve'"
echo ""
echo "⏳ Waiting for server to start..."
sleep 15

# Check if server is running
if curl -s http://localhost:8000/v1/models > /dev/null 2>&1; then
    echo "✅ vLLM server is healthy and ready"
else
    echo "⚠️  Server may still be starting, check logs:"
    echo "   tail -f /home/leviathan/OPENCODE_WORKSPACE/vllm.log"
fi