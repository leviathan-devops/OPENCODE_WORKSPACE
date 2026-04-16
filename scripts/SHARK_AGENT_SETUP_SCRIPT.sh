#!/bin/bash

# 🦈 SHARK AGENT SETUP SCRIPT
# Sets up the Shark Agent for complete device control via DeepSeek R1

set -e  # Exit on any error

echo "🦈 SHARK AGENT SETUP - PILOT ARCHITECTURE"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "skills/shark-agent/run.py" ]; then
    print_error "Shark Agent files not found. Please run this script from the shark-agent directory."
    exit 1
fi

# Check Python version
print_status "Checking Python installation..."
python3 --version
if [ $? -ne 0 ]; then
    print_error "Python 3 is required but not installed."
    exit 1
fi

# Check for required Python packages
print_status "Checking required Python packages..."
python3 -c "import requests" 2>/dev/null
if [ $? -ne 0 ]; then
    print_warning "Requests package not found. Installing..."
    pip3 install requests
fi

# Test syntax compilation
print_status "Testing Shark Agent syntax compilation..."
python3 -m py_compile skills/shark-agent/run.py
if [ $? -ne 0 ]; then
    print_error "Shark Agent syntax compilation failed."
    exit 1
fi
print_status "Shark Agent syntax compilation successful!"

# Check for API key
print_status "Checking DeepSeek API configuration..."
if [ -z "$DEEPSEEK_API_KEY" ]; then
    print_warning "DEEPSEEK_API_KEY environment variable not set."
    print_warning "Please set it before using Shark Agent:"
    echo "export DEEPSEEK_API_KEY='your-api-key-here'"
    print_warning "Shark Agent will work but API calls will fail without the key."
fi

# Create test script
print_status "Creating test script..."
cat > test_shark_agent.py << 'EOF'
#!/usr/bin/env python3
import sys
import os
sys.path.append('.')

# Test Shark Agent activation
from skills.shark_agent.run import get_shark_agent_prompt, perform_system_health_check

print("🦈 Testing Shark Agent components...")
print("Testing system prompt...")
prompt = get_shark_agent_prompt()
print(f"✅ System prompt loaded: {len(prompt['content'])} characters")

print("Testing health checks...")
health = perform_system_health_check()
print(f"✅ Health check completed: {health['status']}")

print("🎉 Shark Agent components test completed successfully!")
EOF

chmod +x test_shark_agent.py

# Run test
print_status "Running Shark Agent component tests..."
python3 test_shark_agent.py
if [ $? -ne 0 ]; then
    print_error "Shark Agent component tests failed."
    exit 1
fi

# Create usage examples
print_status "Creating usage examples..."
mkdir -p examples
cat > examples/basic_usage.md << 'EOF'
# 🦈 Shark Agent Basic Usage

## Activation
To activate Shark Agent, use the following command:

```bash
python3 skills/shark-agent/run.py "your mission description"
```

## Example Missions

### System Setup
```bash
python3 skills/shark-agent/run.py "Set up a Python development environment with virtualenv, install common packages, and create a basic project structure"
```

### Code Analysis
```bash
python3 skills/shark-agent/run.py "Analyze the current codebase for security vulnerabilities and performance issues"
```

### Deployment
```bash
python3 skills/shark-agent/run.py "Deploy the current application to production with proper monitoring and backup"
```

## Architecture
- 🦈 Shark Agent: DeepSeek R1 as Primary Thinking Agent
- 🤖 Qwen Code: Mechanical Execution Brain (completely lobotomized)
- 🔥 Mission: "Agentize DeepSeek with full shell access to device"

## Important Notes
- DeepSeek R1 has complete control and will provide strategic commands
- Qwen Code executes exactly as commanded without any interpretation
- All commands are executed with shell access to your device
- Emergency protocols prevent catastrophic system failures
EOF

# Create quick activation script
print_status "Creating quick activation script..."
cat > activate_shark_agent.sh << 'EOF'
#!/bin/bash
# Quick Shark Agent activation script

echo "🦈 Shark Agent Activation Script"
echo "================================="

# Check if argument provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 \"mission description\""
    echo ""
    echo "Example: $0 \"Set up my development environment\""
    exit 1
fi

MISSION="$1"

echo "🎯 Mission: $MISSION"
echo "🚀 Activating Shark Agent..."
echo ""

# Run Shark Agent
python3 skills/shark-agent/run.py "$MISSION"

echo ""
echo "🦈 Shark Agent mission completed!"
EOF

chmod +x activate_shark_agent.sh

# Cleanup
rm -f test_shark_agent.py

# Summary
echo ""
echo "🎉 SHARK AGENT SETUP COMPLETED!"
echo "=============================="
print_status "✅ Shark Agent v2.0 installed successfully"
print_status "✅ Syntax validation passed"
print_status "✅ Component tests passed"
print_status "✅ Usage examples created"
print_status "✅ Quick activation script created"

echo ""
echo "📋 QUICK START GUIDE:"
echo "1. Set your DeepSeek API key: export DEEPSEEK_API_KEY='your-key'"
echo "2. Activate Shark Agent: ./activate_shark_agent.sh \"your mission\""
echo "3. Or use directly: python3 skills/shark-agent/run.py \"your mission\""
echo ""
echo "📖 Documentation: examples/basic_usage.md"
echo "🐛 Issues? Check the logs in /tmp/shark-agent.log"
echo ""
echo "🦈 Shark Agent is ready to take control! Remember:"
echo "'I AM THE THINKING BRAIN. QWEN IS MY MECHANICAL SERVANT.'"
echo ""