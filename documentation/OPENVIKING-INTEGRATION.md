# 🚀 OpenViking Integration - Complete User Guide

## Overview
OpenViking integration enables **persistent context sharing** across all your Qwen Code terminals. This transforms your vibecoding process into a **single continuous session** where all agents and terminals share collective knowledge.

## Quick Start

### Installation & Activation
```bash
# One-time setup
/home/leviathan/quick-openviking-start.sh

# In each new terminal
source /home/leviathan/quick-openviking-start.sh
```

## How It Works

### Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Terminal 1      │    │ Terminal 2      │    │ Terminal 3      │
│ (Qwen Code)     │    │ (Qwen Code)     │    │ (Qwen Code)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │ OpenViking      │
                    │ Memory Store    │
                    │ (shared)        │
                    └─────────────────┘
```

### Key Features
- 🔄 **Auto-sync**: Context flows automatically between terminals
- 🧠 **Collective Memory**: All agents share knowledge across sessions  
- 🎯 **Smart Filtering**: Relevant context retrieval
- 🚀 **Seamless Experience**: One continuous vibecoding session
- 📊 **Session Tracking**: Complete history across terminals

## Usage Examples

### Saving Context
```bash
# Save project context
python3 ~/.qwen/save-context.py '{"project": "my-web-app", "status": "in-progress", "features": ["auth", "dashboard"]}'

# Save work session
python3 ~/.qwen/save-context.py '{"session": "debugging", "issue": "API timeout", "solution": "added retry logic"}'
```

### Retrieving Context
```bash
# View all session history
cat ~/.qwen/shared_context.json | jq '.sessions'

# Get recent sessions
python3 -c "import json; d=json.load(open('/home/leviathan/.qwen/shared_context.json')); [print(s['data']) for s in d['sessions'][-3:]]"

# Check project context
python3 -c "import json; d=json.load(open('/home/leviathan/.qwen/shared_context.json')); [print(s['data']) for s in d['sessions'] if 'web-app' in str(s['data'])]"
```

### Cross-Terminal Workflow
```bash
# Terminal 1: Working on project
source /home/leviathan/quick-openviking-start.sh
python3 ~/.qwen/save-context.py '{"project": "ecommerce", "task": "payment-integration"}'
# Work on the task...

# Terminal 2: Continue from Terminal 1  
source /home/leviathan/quick-openviking-start.sh
# Previous context automatically available!
# Continue work seamlessly...
```

## Configuration

### Environment Variables
- `OPENVIKING_ACTIVE=true` - Integration is active
- `TERMINAL_ID` - Unique terminal identifier
- `TERMINAL_CONTEXT_FILE` - Path to shared context file

### Storage Location
- **Context File**: `/home/leviathan/.qwen/shared_context.json`
- **Session Limit**: Last 100 sessions (auto-cleanup)
- **Retention**: 30 days (auto-cleanup)

## Advanced Features

### Automatic Context Injection
```bash
# The system can automatically inject relevant context
# into new Qwen Code sessions based on terminal patterns
```

### Pattern Recognition
```bash
# The system learns patterns across terminals
# and suggests relevant context for new sessions
```

### Cross-Agent Knowledge Sharing
```bash
# All agents in all terminals share the same knowledge base
# Collective intelligence across your entire development environment
```

## Troubleshooting

### Common Issues

1. **Context not syncing between terminals**
   ```bash
   # Ensure activation script was sourced in both terminals
   source /home/leviathan/quick-openviking-start.sh
   ```

2. **Permission errors**
   ```bash
   # Check terminal can write to ~/.qwen/
   ls -la ~/.qwen/
   ```

3. **Context file not found**
   ```bash
   # Create the directory first
   mkdir -p ~/.qwen
   # Then activate
   /home/leviathan/quick-openviking-start.sh
   ```

### Debug Commands
```bash
# Check current terminal ID
echo $TERMINAL_ID

# Verify integration is active
echo $OPENVIKING_ACTIVE

# Count sessions
cat ~/.qwen/shared_context.json | jq '.sessions | length'

# Check last session
cat ~/.qwen/shared_context.json | jq '.sessions[-1]'
```

## Benefits

### Productivity Improvements
- 🔄 **No more context copying** between terminals
- 🎯 **Instant context retrieval** across sessions
- 🚀 **Seamless workflow** interruption recovery
- 🧠 **Collective problem-solving** across agents

### Quality Improvements  
- 📊 **Complete session history** for debugging
- 🔍 **Cross-terminal work continuity**
- 🎨 **Consistent development patterns**
- 💡 **Knowledge sharing across all agents

### Experience Improvements
- 🎉 **One continuous vibecoding session**
- 🌟 **Universal context awareness**  
- 🔄 **Automatic state persistence**
- 🚀 **Professional development workflow**

---

## 🎉 Ready to Use!

Your OpenViking integration is now active and ready to transform your development workflow into a single, continuous vibecoding session across all terminals!

**Next Steps:**
1. Open multiple terminals
2. Run activation in each: `source /home/leviathan/quick-openviking-start.sh`
3. Work across terminals - context will sync automatically!
4. Enjoy seamless collective intelligence across your entire development environment!