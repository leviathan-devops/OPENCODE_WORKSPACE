#!/bin/bash
echo "🚀 Starting vLLM server with working environment"

# Activate the working vLLM environment
source /home/leviathan/OPENCODE_WORKSPACE/vllm-env/venv/bin/activate

# Check if vLLM is already running
if pgrep -f "vllm serve" > /dev/null; then
    echo "⚠️  vLLM server already running on port 8000"
    exit 0
fi

cd /home/leviathan
echo "🔄 Starting vLLM server with Qwen 7B model..."

# Start vLLM server with correct path
python -m vllm.entrypoints.openai.api_server \
    --model /home/leviathan/OPENCODE_WORKSPACE/models/gguf/qwen2.5-coder-1.5b-instruct-q4_k_m.gguf \
    --host 0.0.0.0 \
    --port 8000 \
    --gpu-memory-utilization 0.6 \
    --max-model-len 16384 \
    --max-num-seqs 64 \
    --trust-remote-code \
    --tokenizer Qwen/Qwen2.5-Coder-1.5B-Instruct \
    --enable-chunked-prefill \
    > /home/leviathan/OPENCODE_WORKSPACE/vllm-working.log 2>&1 &

echo "✅ vLLM server starting on port 8000"
echo "📊 Monitor logs: tail -f /home/leviathan/OPENCODE_WORKSPACE/vllm-working.log"
echo "🛑 Stop server: pkill -f 'vllm serve'"
echo ""
echo "⏳ Waiting for server to start..."
sleep 10

# Check if server is running
if curl -s http://localhost:8000/health > /dev/null 2>&1 || curl -s http://localhost:8000/v1/models > /dev/null 2>&1; then
    echo "✅ vLLM server is healthy and ready"
else
    echo "⚠️  Server may still be starting, check logs:"
    echo "   tail -f /home/leviathan/OPENCODE_WORKSPACE/vllm-working.log"
fi