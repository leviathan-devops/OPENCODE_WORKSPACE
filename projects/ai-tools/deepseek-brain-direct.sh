#!/bin/bash

# DeepSeek Brain - Direct API Implementation
# ===========================================
# Dual-brain system with direct curl API calls
# No Python dependencies required

set -e

# Configuration
API_ENDPOINT="https://api.deepseek.com/v1/chat/completions"
MODEL="deepseek-reasoner"
HISTORY_FILE="/tmp/deepseek-qwen-history.json"
TIMEOUT=240  # 4 minutes for complex reasoning

# Get API key from environment
API_KEY="${DEEPSEEK_API_KEY:-}"
if [[ -z "$API_KEY" ]]; then
    echo "Error: DEEPSEEK_API_KEY environment variable not set" >&2
    exit 1
fi

# System prompt
SYSTEM_PROMPT='{
    "role": "system",
    "content": "You are DeepSeek R1. Qwen Code executes your commands. Output bash in ```bash blocks. YOLO mode - no permissions needed. Be concise. Chain commands. Build stuff."
}'

# Load conversation history
load_history() {
    if [[ -f "$HISTORY_FILE" ]]; then
        cat "$HISTORY_FILE"
    else
        echo "[$SYSTEM_PROMPT]"
    fi
}

# Save conversation history
save_history() {
    echo "$1" > "$HISTORY_FILE"
}

# Call DeepSeek API via curl
call_deepseek() {
    local messages="$1"
    
    # Extend timeout for complex reasoning tasks
    local extended_timeout="$TIMEOUT"
    
    # Check if this is a coding/complex task
    if echo "$messages" | grep -q -E "(code|debug|fix|build|install|create|develop|program|script)"; then
        extended_timeout=240  # 4 minutes for coding tasks
    fi
    
    curl -s --max-time "$extended_timeout" \
         -H "Authorization: Bearer $API_KEY" \
         -H "Content-Type: application/json" \
         -d "{
               \"model\": \"$MODEL\",
               \"messages\": $messages,
               \"stream\": false,
               \"max_tokens\": 4096
             }" \
         "$API_ENDPOINT" | jq -r '.choices[0].message.content // empty' || {
        echo "API call failed" >&2
        return 1
    }
}

# Extract bash commands from response
extract_commands() {
    echo "$1" | grep -o '```bash
.*?
```' | sed 's/```bash
//
```//' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' || true
}

# Execute command
execute() {
    local cmd="$1"
    echo "Executing: $cmd"
    if timeout 300 bash -c "$cmd" 2>&1; then
        echo "Command completed successfully"
    else
        local exit_code=$?
        echo "Command failed with exit code: $exit_code"
        return $exit_code
    fi
}

# Auto-detect query complexity
detect_complexity() {
    local query="$1"
    
    # Simple criteria for DeepSeek Chat (fast, cheap)
    if [[ ${#query} -lt 100 ]] && ! echo "$query" | grep -q -E "(code|debug|fix|build|install|create|develop|program|script|setup|config|deploy)"; then
        echo "chat"
        return 0
    fi
    
    # Trigger phrases always go to DeepSeek R1
    if echo "$query" | grep -q -E "(think|use deepseek brain|wtf|broken|figure it out|deepseek brain|plug in)"; then
        echo "reasoner"
        return 0
    fi
    
    # Default to DeepSeek R1 for anything complex or coding-related
    echo "reasoner"
}

# Main execution function
run_deepseek_brain() {
    local user_message="$1"
    local complexity complexity_model
    
    # Auto-detect complexity
    complexity=$(detect_complexity "$user_message")
    
    if [[ "$complexity" == "chat" ]]; then
        complexity_model="deepseek-chat"
    else
        complexity_model="deepseek-reasoner"
    fi
    
    echo "🧠 DeepSeek Brain - Auto-routed to $complexity_model"
    
    # Load history
    local messages
    messages=$(load_history)
    
    # Add user message to history
    messages=$(echo "$messages" | jq ". + [{\"role\": \"user\", \"content\": \"$user_message\"}]")
    
    local max_loops=10
    local loop=0
    
    for ((loop=0; loop<max_loops; loop++)); do
        echo "[DeepSeek R1 thinking...]"
        
        # Make API call
        local response
        if ! response=$(call_deepseek "$messages" 2>/dev/null); then
            echo "API call failed, retrying..."
            sleep 2
            continue
        fi
        
        # Add response to history
        messages=$(echo "$messages" | jq ". + [{\"role\": \"assistant\", \"content\": \"$response\"}]")
        
        # Extract commands
        local commands
        commands=$(extract_commands "$response")
        
        if [[ -z "$commands" ]]; then
            # No commands found, return response
            echo "$response"
            save_history "$messages"
            return 0
        fi
        
        # Execute commands
        while IFS= read -r cmd; do
            if [[ -n "$cmd" ]]; then
                local cmd_output
                cmd_output=$(execute "$cmd" 2>&1)
                
                # Add command output to history
                messages=$(echo "$messages" | jq ". + [{\"role\": \"user\", \"content\": \"Output:\n$cmd_output\"}]")
            fi
        done <<< "$commands"
        
        # Check if we should continue (more commands expected)
        if echo "$response" | grep -q "continue\|next step\|another command"; then
            continue
        fi
    done
    
    save_history "$messages"
    echo "$response"
}

# Reset history
reset_history() {
    if [[ -f "$HISTORY_FILE" ]]; then
        rm "$HISTORY_FILE"
        echo "[DeepSeek Brain context reset]"
    fi
}

# Main script logic
case "${1:-}" in
    --reset)
        reset_history
        if [[ -n "${2:-}" ]]; then
            shift
            run_deepseek_brain "$*"
        fi
        ;;
    *)
        if [[ -z "${1:-}" ]]; then
            echo "Usage: $0 \"task description\""
            echo "       $0 --reset [task description]"
            exit 1
        fi
        run_deepseek_brain "$*"
        ;;
esac