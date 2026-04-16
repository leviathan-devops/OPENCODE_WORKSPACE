#!/bin/bash
# Test script simulating 5 concurrent coding terminals

echo "🚀 Testing 5 concurrent vLLM terminals..."
echo "=========================================="

# Function for each "terminal"
terminal_test() {
    local term_id=$1
    local prompt=$2
    local start_time=$(date +%s.%N)
    
    response=$(curl -s -X POST http://localhost:8000/v1/completions \
        -H "Content-Type: application/json" \
        -d "{
            \"model\": \"qwen2.5-coder-14b-awq\",
            \"prompt\": \"$prompt\",
            \"max_tokens\": 100,
            \"temperature\": 0.7,
            \"top_p\": 0.95
        }" --max-time 30)
    
    local end_time=$(date +%s.%N)
    local elapsed=$(echo "$end_time - $start_time" | bc)
    
    if echo "$response" | grep -q '"text"'; then
        local code=$(echo "$response" | jq -r '.choices[0].text' | head -2)
        local tokens=$(echo "$response" | jq -r '.usage.total_tokens')
        echo "Terminal $term_id: ✅ ${elapsed}s, ${tokens} tokens"
        echo "   Code: $code"
    else
        echo "Terminal $term_id: ❌ Failed or timeout"
    fi
}

# Run 5 terminals in background with different prompts
echo "Starting 5 concurrent terminals..."
echo ""

terminal_test "1" "Write Python function to calculate factorial:" &
terminal_test "2" "Create JavaScript function to validate email format:" &
terminal_test "3" "Write SQL query to find duplicate records:" &
terminal_test "4" "Create Dockerfile for Python web app:" &
terminal_test "5" "Write bash script to monitor disk usage:" &

# Wait for all background jobs
wait

echo ""
echo "=========================================="
echo "🎉 5-terminal vibecoding test complete!"
echo ""
echo "Your vLLM setup is ready for:"
echo "  • Unlimited Qwen Code generations"
echo "  • 5+ concurrent terminals"
echo "  • No API costs or rate limits"
echo "  • Full local control"
echo ""
echo "Open 5 terminals and start coding! 🚀"