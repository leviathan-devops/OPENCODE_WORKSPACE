#!/bin/bash

# Test DeepSeek Browser Access for Hermes
# This script tests if Hermes can access and interact with DeepSeek web chat

echo "========================================="
echo "Testing DeepSeek Browser Access for Hermes"
echo "========================================="

# Set environment variables for agent-browser
export AGENT_BROWSER_ARGS="--no-sandbox --disable-blink-features=AutomationControlled"
export AGENT_BROWSER_USER_AGENT="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

echo "Environment variables set:"
echo "AGENT_BROWSER_ARGS: $AGENT_BROWSER_ARGS"
echo "AGENT_BROWSER_USER_AGENT: $AGENT_BROWSER_USER_AGENT"
echo ""

# Test 1: Direct agent-browser access
echo "Test 1: Direct agent-browser access to DeepSeek..."
timeout 30 agent-browser open https://chat.deepseek.com --json 2>&1 | grep -E '"title"|"url"|"success"'

echo ""
echo "Test 2: Getting snapshot of DeepSeek page..."
timeout 30 agent-browser snapshot --json 2>&1 | grep -E '"refs"|"snapshot"' | head -5

echo ""
echo "Test 3: Testing Hermes with minimal config..."
# Copy minimal config
cp /home/leviathan/OPENCODE_WORKSPACE/.hermes/config-minimal.yaml /home/leviathan/OPENCODE_WORKSPACE/.hermes/config.yaml

echo "Testing Hermes browser command (timeout 45 seconds)..."
timeout 45 hermes chat -q "Use browser to visit https://chat.deepseek.com and tell me what you see. Be very concise." 2>&1 | tail -30

echo ""
echo "========================================="
echo "Test Complete!"
echo "========================================="
echo ""
echo "If tests pass, Hermes should be able to:"
echo "1. Access DeepSeek web chat"
echo "2. Get page snapshots"
echo "3. Potentially interact with the chat interface"
echo ""
echo "Next steps for DeepSeek interaction:"
echo "1. Login to DeepSeek (requires manual authentication)"
echo "2. Use browser_click to interact with chat elements"
echo "3. Use browser_type to enter prompts"
echo "4. Extract responses from the page"