#!/bin/bash

# 🚀 GitHub Repository Update Script
# Updates the repositories with new naming and structure

echo "🚀 Updating GitHub Repositories with New Engineer System"
echo "======================================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "README_ENGINEERS.md" ]; then
    echo -e "${RED}❌ Error: Run this script from the shark-agent directory${NC}"
    exit 1
fi

# Create Micro Engineer Repository
echo -e "${YELLOW}🦈 Creating Micro Engineer Repository...${NC}"
cd /tmp
if [ -d "micro-engineer-repo" ]; then
    rm -rf micro-engineer-repo
fi
mkdir micro-engineer-repo
cd micro-engineer-repo

# Copy Micro Engineer files
cp /home/leviathan/OPENCODE_WORKSPACE/shark-agent/skills/micro-engineer/run.py .
cp /home/leviathan/OPENCODE_WORKSPACE/shark-agent/MICRO_ENGINEER.md README.md
cp /home/leviathan/OPENCODE_WORKSPACE/shark-agent/SHARK_ENGINEER_COMMANDS.md ../docs/ || mkdir ../docs && cp /home/leviathan/OPENCODE_WORKSPACE/shark-agent/SHARK_ENGINEER_COMMANDS.md ../docs/

# Create simple activation script
cat > activate.sh << 'EOF'
#!/bin/bash
echo "🦈 Micro Engineer - Linear Coding Specialist"
export DEEPSEEK_API_KEY="${DEEPSEEK_API_KEY:-sk-e8e93e31b582423e9fdaa4ab8e9347e2}"
python3 run.py "$1"
EOF
chmod +x activate.sh

echo -e "${GREEN}✅ Micro Engineer repository ready${NC}"

# Create Macro Engineer Repository  
echo -e "${YELLOW}🧠 Creating Macro Engineer Repository...${NC}"
cd /tmp
if [ -d "macro-engineer-repo" ]; then
    rm -rf macro-engineer-repo
fi
mkdir macro-engineer-repo
cd macro-engineer-repo

# Copy Macro Engineer files
cp /home/leviathan/OPENCODE_WORKSPACE/shark-agent/skills/macro-engineer/run.py .
cp /home/leviathan/OPENCODE_WORKSPACE/shark-agent/MACRO_ENGINEER.md README.md
cp /home/leviathan/OPENCODE_WORKSPACE/shark-agent/SHARK_ENGINEER_COMMANDS.md ../docs/ || mkdir ../docs && cp /home/leviathan/OPENCODE_WORKSPACE/shark-agent/SHARK_ENGINEER_COMMANDS.md ../docs/

# Create simple activation script
cat > activate.sh << 'EOF'
#!/bin/bash
echo "🧠 Macro Engineer - Complex Systems Engineering"
export DEEPSEEK_API_KEY="${DEEPSEEK_API_KEY:-sk-e8e93e31b582423e9fdaa4ab8e9347e2}"
python3 run.py "$1"
EOF
chmod +x activate.sh

echo -e "${GREEN}✅ Macro Engineer repository ready${NC}"

# Create Main Repository Update
echo -e "${YELLOW}🔄 Creating Main Repository Update...${NC}"
cd /home/leviathan/OPENCODE_WORKSPACE/shark-agent

# Create GitHub repository scripts
cat > CREATE_MICRO_REPO.sh << 'EOF'
#!/bin/bash
# Script to create Micro Engineer GitHub repository

echo "🦈 Creating Micro Engineer GitHub Repository"
echo "==========================================="

# Create temp directory
TEMP_DIR=$(mktemp -d)
cd $TEMP_DIR

# Initialize git repo
git init
git add .
git commit -m "Initial commit: Micro Engineer v2.0 - Linear Coding Specialist

🦈 Features:
- Pilot architecture (DeepSeek controls, Qwen executes)
- Surgical precision for linear coding tasks
- Comprehensive error handling and recovery
- Robust failure prevention mechanisms
- Smart command extraction and execution

📋 Technical Details:
- Skill File: skills/micro-engineer/run.py
- Architecture: Complete pilot domination
- Mission: 'Agentize DeepSeek with surgical precision for linear coding tasks'
- History: Comprehensive tracking (50 messages)
- API Integration: DeepSeek strategic thinking + Qwen mechanical execution

🚀 Usage:
shark micro \"your linear coding task\"
./skills/micro-engineer/activate_micro.sh \"your coding mission\"

🎯 Best For:
- Code generation and refactoring
- Debugging and syntax fixing  
- File operations and project setup
- Testing and validation
- Linear programming tasks"

# Create GitHub repository
gh repo create leviathan-devops/micro-engineer --public --description "🦈 Micro Engineer: Linear Coding Specialist with surgical precision" --source . --push

echo "✅ Micro Engineer repository created successfully!"
echo "🔗 Repository: https://github.com/leviathan-devops/micro-engineer"
EOF

cat > CREATE_MACRO_REPO.sh << 'EOF'
#!/bin/bash
# Script to create Macro Engineer GitHub repository

echo "🧠 Creating Macro Engineer GitHub Repository"
echo "========================================="

# Create temp directory
TEMP_DIR=$(mktemp -d)
cd $TEMP_DIR

# Initialize git repo
git init
git add .
git commit -m "Initial commit: Macro Engineer v1.0 - Complex Systems Engineering

🧠 Features:
- Collaborative architecture (Qwen leads, DeepSeek advises)
- Smart auto-debug detection for repeated errors
- Complex systems engineering capabilities
- Root cause analysis and prevention strategies
- Intelligent error detection at 2+ occurrences

🔍 Smart Auto-Debug:
- Automatically detects when same error occurs 2+ times
- Activates smart debugging mode with systematic analysis
- Provides comprehensive solutions and prevention strategies
- Saves time by eliminating repetitive debugging cycles

📋 Technical Details:
- Skill File: skills/macro-engineer/run.py
- Architecture: Collaborative intelligence sharing
- Mission: 'Architect intelligent systems with collaborative DeepSeek intelligence'
- History: Lightweight advisory tracking (20 messages)
- API Integration: Qwen operations + DeepSeek intelligence augmentation

🚀 Usage:
shark macro \"your complex systems engineering task\"
./skills/macro-engineer/activate_macro.sh \"your engineering mission\"

🎯 Best For:
- System architecture and design
- DevOps and infrastructure automation
- Complex debugging and root cause analysis
- Performance optimization and scaling
- Multi-service integration"

# Create GitHub repository
gh repo create leviathan-devops/macro-engineer --public --description "🧠 Macro Engineer: Complex Systems Engineering with smart auto-debug" --source . --push

echo "✅ Macro Engineer repository created successfully!"
echo "🔗 Repository: https://github.com/leviathan-devops/macro-engineer"
EOF

chmod +x CREATE_MICRO_REPO.sh CREATE_MACRO_REPO.sh

echo ""
echo -e "${GREEN}🎉 GitHub Repository Setup Complete!${NC}"
echo ""
echo "📋 Next Steps:"
echo "1. Create GitHub repositories:"
echo "   ./CREATE_MICRO_REPO.sh"
echo "   ./CREATE_MACRO_REPO.sh"
echo ""
echo "2. Update existing repositories:"
echo "   - Push to shark-agent (main repository)"
echo "   - Push to separate micro-engineer and macro-engineer repos"
echo ""
echo "🦈 Micro Engineer: Linear coding tasks with surgical precision"
echo "🧠 Macro Engineer: Complex systems with smart auto-debug"
echo ""
echo "📁 Repository Structure:"
echo "├── skills/micro-engineer/    # Linear coding specialist"
echo "├── skills/macro-engineer/    # Complex systems engineer" 
echo "├── MICRO_ENGINEER.md        # Micro Engineer documentation"
echo "├── MACRO_ENGINEER.md        # Macro Engineer documentation"
echo "├── README_ENGINEERS.md      # Quick start guide"
echo "└── SHARK_ENGINEER_COMMANDS.md # Command reference"
echo ""
echo "🚀 Ready for production deployment!"