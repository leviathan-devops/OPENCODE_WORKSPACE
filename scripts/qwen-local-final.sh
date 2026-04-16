#!/bin/bash
# Qwen with Local Qwen Coder - FINAL FIXED VERSION
# Forces local execution by clearing existing config first

echo "🤖 Qwen with Local Qwen Coder (FINAL FIX)"
echo "========================================"
echo "🧠 Architecture: Dual-Brain (DeepSeek R1 + Local Qwen)"
echo "💰 Cost: 100% free execution tokens"
echo "📍 Model: Qwen2.5-Coder-7B (Local GPU)"
echo "🔗 API: http://localhost:8001/v1"
echo ""

# Check if local agents are running
if ! curl -s http://localhost:8001/v1/models > /dev/null; then
    echo "⚠️  Local agents not running!"
    echo "   Starting local agents..."
    sudo systemctl start qwen-coders.service
    sleep 3
    
    # Check again after starting
    if ! curl -s http://localhost:8001/v1/models > /dev/null; then
        echo "❌ Failed to start local agents"
        exit 1
    fi
fi

# Check if qwen command exists
if ! command -v qwen &> /dev/null; then
    echo "❌ Qwen command not found"
    exit 1
fi

# Create temporary Python script to force local configuration
PYTHON_SCRIPT=$(mktemp)

cat > "$PYTHON_SCRIPT" << 'EOF'
#!/usr/bin/env python3
"""
Force local Qwen Coder execution by overriding any existing configuration
"""

import os
import sys
import subprocess

# 1. CLEAR EXISTING ENVIRONMENT VARIABLES FIRST
env_vars_to_clear = [
    'OPENAI_API_KEY',
    'OPENAI_API_BASE', 
    'GLM_API_KEY',
    'GLM_API_BASE',
    'ANTHROPIC_API_KEY',
    'COHERE_API_KEY',
    'QWEN_API_KEY',
    'QWEN_API_BASE'
]

for var in env_vars_to_clear:
    if var in os.environ:
        del os.environ[var]
        print(f"Cleared {var}")

# 2. FORCE LOCAL CONFIGURATION
os.environ['OPENAI_API_BASE'] = 'http://localhost:8001/v1'
os.environ['OPENAI_API_KEY'] = 'qwen-local-execution'
os.environ['OPENAI_MODEL'] = 'qwen-coder-7b-local'

# Force unset any conflicting environment variables
if 'GLM_API_KEY' in os.environ:
    del os.environ['GLM_API_KEY']
if 'QWEN_API_KEY' in os.environ:
    del os.environ['QWEN_API_KEY']

print("🔧 Configuration: GLM config cleared, local forced")
print(f"📡 OPENAI_API_BASE: {os.environ.get('OPENAI_API_BASE', 'NOT SET')}")
print(f"📡 OPENAI_API_KEY: {os.environ.get('OPENAI_API_KEY', 'NOT SET')}")
print(f"📡 OPENAI_MODEL: {os.environ.get('OPENAI_MODEL', 'NOT SET')}")

# 3. PASS REMAINING ARGUMENTS TO QWEN
# Get all command line arguments after the script name
qwen_args = sys.argv[1:]

# Execute qwen command with forced local configuration
print(f"🚀 Executing: qwen {' '.join(qwen_args)}")
result = subprocess.run(['qwen'] + qwen_args, capture_output=False)
sys.exit(result.returncode)
EOF

chmod +x "$PYTHON_SCRIPT"

echo "🚀 Launching Qwen with FORCED Local Qwen Coder..."
echo "📡 Using endpoint: http://localhost:8001/v1"
echo ""

# Execute the Python script that forces local configuration
python3 "$PYTHON_SCRIPT" "$@"

# Clean up
rm -f "$PYTHON_SCRIPT"