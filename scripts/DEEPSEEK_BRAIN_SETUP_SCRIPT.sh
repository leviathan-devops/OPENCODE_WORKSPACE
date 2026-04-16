#!/bin/bash

# 🧠 DEEPSEEK BRAIN SETUP SCRIPT
# Sets up the DeepSeek Brain for surgical reasoning assistance

set -e  # Exit on any error

echo "🧠 DEEPSEEK BRAIN SETUP - ADVISORY ARCHITECTURE"
echo "=============================================="

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
if [ ! -f "skills/deepseek-brain/run.py" ]; then
    print_error "DeepSeek Brain files not found. Please run this script from the shark-agent directory."
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
print_status "Testing DeepSeek Brain syntax compilation..."
python3 -m py_compile skills/deepseek-brain/run.py
if [ $? -ne 0 ]; then
    print_error "DeepSeek Brain syntax compilation failed."
    exit 1
fi
print_status "DeepSeek Brain syntax compilation successful!"

# Check for API key
print_status "Checking DeepSeek API configuration..."
if [ -z "$DEEPSEEK_API_KEY" ]; then
    print_warning "DEEPSEEK_API_KEY environment variable not set."
    print_warning "Please set it before using DeepSeek Brain:"
    echo "export DEEPSEEK_API_KEY='your-api-key-here'"
    print_warning "DeepSeek Brain will work but API calls will fail without the key."
fi

# Create test script
print_status "Creating test script..."
cat > test_deepseek_brain.py << 'EOF'
#!/usr/bin/env python3
import sys
import os
sys.path.append('.')

# Test DeepSeek Brain activation
from skills.deepseek_brain.run import get_advisory_prompt

print("🧠 Testing DeepSeek Brain components...")
print("Testing system prompt...")
prompt = get_advisory_prompt()
print(f"✅ System prompt loaded: {len(prompt['content'])} characters")

print("🎉 DeepSeek Brain components test completed successfully!")
EOF

chmod +x test_deepseek_brain.py

# Run test
print_status "Running DeepSeek Brain component tests..."
python3 test_deepseek_brain.py
if [ $? -ne 0 ]; then
    print_error "DeepSeek Brain component tests failed."
    exit 1
fi

# Create usage examples
print_status "Creating usage examples..."
mkdir -p examples
cat > examples/advisory_usage.md << 'EOF'
# 🧠 DeepSeek Brain Usage Guide

## Activation
To activate DeepSeek Brain for advisory consultation, use:

```bash
python3 skills/deepseek-brain/run.py "context for analysis"
```

## Use Cases

### Code Review
```bash
python3 skills/deepseek-brain/run.py "Review this Python function for potential issues:
def calculate_total(items):
    total = 0
    for item in items:
        total += item.price
    return total"
```

### Architecture Analysis
```bash
python3 skills/deepseek-brain/run.py "Analyze this microservices architecture for scalability concerns:
- User Service: Handles user authentication and profiles
- Order Service: Manages order processing
- Payment Service: Handles payment processing"
```

### Debugging Assistance
```bash
python3 skills/deepseek-brain/run.py "Help debug this error - application crashes when processing large files:
ERROR: MemoryError: Unable to allocate 1GB for buffer"
```

## Architecture
- 🧠 DeepSeek Brain: Secondary Advisory Brain (analysis only)
- 🤖 Qwen Code: Primary Agent (active thinking and decision making)
- 🔍 Mission: "Surgical reasoning assistant for primary agent"

## Important Notes
- DeepSeek Brain provides analysis and suggestions only
- Qwen Code makes all final decisions and executes actions
- Perfect for when you need a second opinion or expert analysis
- Lightweight and focused on specific reasoning tasks
EOF

# Create quick consultation script
print_status "Creating quick consultation script..."
cat > consult_deepseek.sh << 'EOF'
#!/bin/bash
# Quick DeepSeek Brain consultation script

echo "🧠 DeepSeek Brain Consultation Script"
echo "===================================="

# Check if argument provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 \"context for analysis\""
    echo ""
    echo "Example: $0 \"Analyze this code for security issues\""
    exit 1
fi

CONTEXT="$1"

echo "🔍 Context: $CONTEXT"
echo "🧠 Requesting advisory analysis..."
echo ""

# Run DeepSeek Brain consultation
python3 skills/deepseek-brain/run.py "$CONTEXT"

echo ""
echo "🧠 Advisory consultation completed!"
EOF

chmod +x consult_deepseek.sh

# Create integration script for Qwen Code
print_status "Creating Qwen Code integration script..."
cat > ask_deepseek_for_help.sh << 'EOF'
#!/bin/bash
# Integration script for Qwen Code to request DeepSeek Brain help

echo "🤖 Qwen Code requesting DeepSeek Brain assistance..."
echo "=================================================="

# Example usage within Qwen Code:
# This script demonstrates how to call DeepSeek Brain from Qwen Code
# when the user says "ask deepseek for help"

if [ $# -eq 0 ]; then
    echo "Usage: $0 \"context for analysis\""
    echo ""
    echo "This should be called from Qwen Code when user requests:"
    echo "'ask deepseek for help [analysis request]'"
    exit 1
fi

echo "🧠 DeepSeek Brain will analyze: $1"
echo "📊 Analysis results will be returned to Qwen Code..."
echo ""

# Call DeepSeek Brain for advisory consultation
python3 skills/deepseek-brain/run.py "$1"

echo ""
echo "🧠 Analysis complete - Qwen Code can now make decisions based on this input"
EOF

chmod +x ask_deepseek_for_help.sh

# Cleanup
rm -f test_deepseek_brain.py

# Summary
echo ""
echo "🎉 DEEPSEEK BRAIN SETUP COMPLETED!"
echo "=================================="
print_status "✅ DeepSeek Brain v1.0 installed successfully"
print_status "✅ Syntax validation passed"
print_status "✅ Component tests passed"
print_status "✅ Usage examples created"
print_status "✅ Integration scripts created"

echo ""
echo "📋 QUICK START GUIDE:"
echo "1. Set your DeepSeek API key: export DEEPSEEK_API_KEY='your-key'"
echo "2. Run advisory consultation: ./consult_deepseek.sh \"your context\""
echo "3. Or use directly: python3 skills/deepseek-brain/run.py \"your context\""
echo "4. For Qwen Code integration: ./ask_deepseek_for_help.sh \"context\""
echo ""
echo "📖 Documentation: examples/advisory_usage.md"
echo "🐛 Issues? Check the logs in /tmp/deepseek-brain.log"
echo ""
echo "🧠 DeepSeek Brain is ready to provide surgical reasoning assistance!"
echo "Remember: 'I AM THE ADVISORY BRAIN. QWEN IS THE PRIMARY AGENT.'"
echo ""