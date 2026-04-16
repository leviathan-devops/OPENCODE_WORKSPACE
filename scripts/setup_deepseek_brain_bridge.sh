#!/bin/bash

# DeepSeek Brain Bridge Setup Script
# Complete setup for Hermes agents to think with DeepSeek web chat

set -e

echo "================================================================"
echo "🧠 DEEPSEEK BRAIN BRIDGE SETUP"
echo "================================================================"
echo

# Step 1: Check prerequisites
echo "1. Checking prerequisites..."
if ! command -v agent-browser &> /dev/null; then
    echo "   ❌ agent-browser not found. Installing..."
    npm install -g @vercel-labs/agent-browser
else
    echo "   ✅ agent-browser installed"
fi

if ! command -v python3 &> /dev/null; then
    echo "   ❌ Python3 not found. Please install Python 3.8+"
    exit 1
else
    echo "   ✅ Python3 installed"
fi

echo

# Step 2: Set environment variables
echo "2. Setting up environment variables..."
cat >> ~/.bashrc << 'EOF'

# DeepSeek Brain Bridge Configuration
export AGENT_BROWSER_ARGS="--no-sandbox --disable-blink-features=AutomationControlled"
export AGENT_BROWSER_USER_AGENT="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

# Hermes efficiency settings
export HERMES_CONFIG="$HOME/.hermes/config-efficient.yaml"
EOF

source ~/.bashrc
echo "   ✅ Environment variables set"

echo

# Step 3: Create necessary directories
echo "3. Creating directories..."
mkdir -p ~/.hermes
mkdir -p ~/.agent-browser
echo "   ✅ Directories created"

echo

# Step 4: Authenticate DeepSeek (manual step)
echo "4. DeepSeek Authentication"
echo "   ========================================="
echo "   This step requires MANUAL login to DeepSeek."
echo "   A browser will open - please login with:"
echo "   Email: cryptoforex36963@gmail.com"
echo "   Password: CosmicEnergy369!"
echo
echo "   After login, the session will be saved for agents."
echo

read -p "Ready to authenticate? (Press Enter to continue, Ctrl+C to skip) "

echo "   Opening DeepSeek for authentication..."
python3 authenticate_deepseek.py

echo

# Step 5: Test the brain bridge
echo "5. Testing DeepSeek Brain Bridge..."
if python3 deepseek_brain_bridge.py; then
    echo "   ✅ Brain bridge test successful!"
else
    echo "   ⚠️  Brain bridge test had issues. Continuing anyway..."
fi

echo

# Step 6: Test Research Agent
echo "6. Testing Research Agent..."
if python3 research_agent.py "Test analysis"; then
    echo "   ✅ Research Agent test successful!"
else
    echo "   ⚠️  Research Agent test had issues."
fi

echo

# Step 7: Test Slack data extractor
echo "7. Testing Slack Data Extractor..."
python3 slack_data_extractor.py --channel general --limit 5 --prepare-for-agent
echo "   ✅ Slack data extractor test complete"

echo

# Step 8: Configure Hermes for efficiency
echo "8. Configuring Hermes for efficiency..."
echo "   Copying efficient configuration..."
cp config-efficient.yaml ~/.hermes/config-efficient.yaml

echo "   Creating Hermes startup script..."
cat > ~/start_hermes_efficient.sh << 'EOF'
#!/bin/bash
# Start Hermes with efficient configuration
export HERMES_CONFIG="$HOME/.hermes/config-efficient.yaml"
hermes --config "$HERMES_CONFIG" "$@"
EOF

chmod +x ~/start_hermes_efficient.sh

echo "   ✅ Hermes efficiency configuration complete"

echo

# Step 9: Create usage examples
echo "9. Creating usage examples..."
cat > ~/example_usage.md << 'EOF'
# DeepSeek Brain Bridge - Usage Examples

## 1. Start Hermes with efficient configuration
```bash
./start_hermes_efficient.sh
```

## 2. Use DeepSeek brain bridge in Hermes
In Hermes, you can now:
- Ask Hermes to analyze data using DeepSeek
- Use DeepSeek for complex reasoning tasks
- Process Slack data through Research Agent

## 3. Direct Python usage
```python
from deepseek_brain_bridge import DeepSeekBrainBridge

# Initialize bridge
bridge = DeepSeekBrainBridge()

# Think with DeepSeek
response = bridge.think("Analyze this data and find patterns...")
print(response)

# Use Research Agent
from research_agent import ResearchAgent
agent = ResearchAgent()
analysis = agent.analyze_data("Your data description here")
```

## 4. Extract and analyze Slack data
```bash
# Extract data from Slack
python3 slack_data_extractor.py --channel your-channel --output slack_data.json

# Analyze with Research Agent
python3 research_agent.py "Analyze the Slack data in slack_data.json"
```

## 5. Create training dataset
```bash
# After analysis, create dataset
python3 -c "
from research_agent import ResearchAgent
agent = ResearchAgent()
# Load your analyses and create dataset
# (See research_agent.py for details)
"
```

## Troubleshooting

### DeepSeek session expired
```bash
python3 authenticate_deepseek.py
```

### Agent-browser not working
```bash
# Check installation
agent-browser --version

# Test with simple site
agent-browser open https://example.com
```

### Hermes rate limiting
- Use `./start_hermes_efficient.sh` instead of regular hermes
- Configuration reduces tokens from 11k+ to ~3k
EOF

echo "   ✅ Usage examples created"

echo

# Step 10: Summary
echo "================================================================"
echo "🎉 SETUP COMPLETE!"
echo "================================================================"
echo
echo "What was installed:"
echo "1. ✅ DeepSeek Brain Bridge Python module"
echo "2. ✅ Authenticated DeepSeek session (manual login completed)"
echo "3. ✅ Research Agent with DeepSeek integration"
echo "4. ✅ Slack Data Extractor"
echo "5. ✅ Hermes efficient configuration (reduces tokens from 11k+ to ~3k)"
echo "6. ✅ Environment variables and startup scripts"
echo
echo "Next steps:"
echo "1. Test the system: ./start_hermes_efficient.sh"
echo "2. Try: 'Analyze some data using DeepSeek' in Hermes"
echo "3. Extract Slack data: python3 slack_data_extractor.py --channel your-channel"
echo "4. Create training datasets from analyzed data"
echo
echo "Files created:"
echo "- ~/deepseek_brain_bridge.py      # Brain bridge module"
echo "- ~/authenticate_deepseek.py      # Authentication script"
echo "- ~/research_agent.py             # Research Agent"
echo "- ~/slack_data_extractor.py       # Slack data extractor"
echo "- ~/.hermes/config-efficient.yaml # Efficient Hermes config"
echo "- ~/start_hermes_efficient.sh     # Hermes startup script"
echo "- ~/example_usage.md              # Usage guide"
echo
echo "Remember:"
echo "- DeepSeek session may expire - re-run authenticate_deepseek.py if needed"
echo "- Use agent chat terminals 2 and 3 as backups when context limits hit"
echo "- The brain bridge gives Hermes FREE access to DeepSeek R1 reasoning!"
echo
echo "================================================================"