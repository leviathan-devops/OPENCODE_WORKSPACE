#!/bin/bash
echo "🚀 Quick OpenViking Activation for Qwen Code"
echo "============================================"

# Create directories
mkdir -p ~/.qwen

# Set up environment
export OPENVIKING_ACTIVE=true
export TERMINAL_ID="terminal_$(date +%s)_$RANDOM"
export TERMINAL_CONTEXT_FILE="$HOME/.qwen/shared_context.json"

# Create simple context saver
cat > ~/.qwen/save-context.py << 'EOF'
#!/usr/bin/env python3
import os
import json
from datetime import datetime
from pathlib import Path

def save_context(data):
    context_file = Path.home() / '.qwen' / 'shared_context.json'
    terminal_id = os.getenv('TERMINAL_ID', f'terminal_{os.getpid()}')
    
    context = {
        'terminal_id': terminal_id,
        'timestamp': datetime.now().isoformat(),
        'data': data
    }
    
    if context_file.exists():
        with open(context_file, 'r') as f:
            existing = json.load(f)
    else:
        existing = {'sessions': []}
        
    existing['sessions'].append(context)
    
    # Keep last 100 sessions
    if len(existing['sessions']) > 100:
        existing['sessions'] = existing['sessions'][-100:]
    
    with open(context_file, 'w') as f:
        json.dump(existing, f, indent=2)
    
    return True

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        data = json.loads(sys.argv[1])
    else:
        data = {'auto_save': True, 'terminal': os.getenv('TERMINAL_ID')}
    
    save_context(data)
EOF

# Make executable
chmod +x ~/.qwen/save-context.py

echo "✅ OpenViking Integration Ready!"
echo "📍 Terminal ID: $TERMINAL_ID"
echo "📁 Context File: $TERMINAL_CONTEXT_FILE"
echo ""
echo "🔥 Quick Usage:"
echo "   # Save context manually"
echo "   python3 ~/.qwen/save-context.py '{\"project\": \"my-app\", \"work\": \"coding\"}'"
echo ""
echo "   # View context history"
echo "   cat ~/.qwen/shared_context.json | jq '.sessions'"
echo ""
echo "   # Manual context retrieval"
echo "   python3 -c \"import json; d=json.load(open('/home/leviathan/OPENCODE_WORKSPACE/.qwen/shared_context.json')); print([s['data'] for s in d['sessions'][-3:]])\""
echo ""
echo "🎉 Your terminals can now share context!"
echo "💡 Open new terminals and repeat activation to share context across sessions!"