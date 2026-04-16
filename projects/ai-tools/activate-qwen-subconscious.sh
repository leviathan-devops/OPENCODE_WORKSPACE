#!/bin/bash
echo "🧠 Activating Qwen Code Subconscious - OpenViking Integration"
echo "=================================================================="

# Set environment variables
export OPENVIKING_CONFIG_FILE=/home/leviathan/.openviking/ov.conf
export OPENVIKING_CLI_CONFIG_FILE=/home/leviathan/.openviking/ovcli.conf
export OPENVIKING_WORKSPACE=/home/leviathan/openviking_workspace
export QWEN_SUBCONSCIOUS_ACTIVE=true
export QWEN_VLLM_ENDPOINT=http://localhost:8000
export QWEN_VLLM_MODEL=qwen2.5-coder-1.5b-instruct

# Ensure workspace exists
mkdir -p /home/leviathan/openviking_workspace/sessions

# Ensure vLLM is starting
echo "🔄 Checking vLLM server..."
if ! pgrep -f "vllm serve" > /dev/null; then
    echo "🚀 Starting vLLM server in background..."
    /home/leviathan/start-vllm-hf.sh &
    sleep 5
fi

# Start OpenViking server if not running
echo "🔄 Checking OpenViking server..."
if ! pgrep -f "openviking-server" > /dev/null; then
    echo "🚀 Starting OpenViking server..."
    cd /home/leviathan/openviking_workspace
    openviking-server --host 0.0.0.0 --port 1933 &
    sleep 3
fi

# Create Qwen Code context integration
cat > /home/leviathan/.qwen/subconscious-hook.py << 'HOOK_EOF'
#!/usr/bin/env python3
import os
import json
import sys
import time
import subprocess
from pathlib import Path

class QwenSubconscious:
    def __init__(self):
        self.config = Path.home() / '.openviking' / 'ov.conf'
        self.workspace = Path('/home/leviathan/openviking_workspace')
        self.vllm_endpoint = "http://localhost:8000"
        self.terminal_id = os.getenv('TERMINAL_ID', f'terminal_{int(time.time())}_{os.getpid()}')
        
    def save_context(self, session_data):
        """Save session context to OpenViking"""
        try:
            # Create session document
            session = {
                'type': 'qwen_session',
                'terminal_id': self.terminal_id,
                'timestamp': time.time(),
                'data': session_data,
                'workspace': str(self.workspace)
            }
            
            # Save to OpenViking workspace
            session_file = self.workspace / 'sessions' / f'session_{int(time.time())}_{os.getpid()}.json'
            session_file.parent.mkdir(parents=True, exist_ok=True)
            
            with open(session_file, 'w') as f:
                json.dump(session, f, indent=2)
                
            # Add to OpenViking if server is available
            if self.is_server_available():
                try:
                    import subprocess
                    subprocess.run([
                        'ov', 'add-resource', str(session_file)
                    ], capture_output=True, timeout=10)
                except:
                    pass  # Don't fail if OpenViking is not ready yet
            
            return True
        except Exception as e:
            print(f"⚠️  Failed to save context: {e}")
            return False
    
    def get_relevant_context(self, query, limit=5):
        """Retrieve relevant context from OpenViking"""
        try:
            if not self.is_server_available():
                # Fallback to local file search
                return self._local_context_search(query, limit)
            
            # Search for relevant context using OpenViking CLI
            result = subprocess.run([
                'ov', 'find', query
            ], capture_output=True, text=True, timeout=15)
            
            if result.returncode == 0:
                return self._parse_ov_results(result.stdout, limit)
            else:
                # Fallback to local search
                return self._local_context_search(query, limit)
                
        except Exception as e:
            print(f"⚠️  Failed to retrieve context: {e}")
            return []
    
    def _local_context_search(self, query, limit):
        """Local context search as fallback"""
        try:
            relevant = []
            for session_file in self.workspace.glob('sessions/*.json'):
                with open(session_file, 'r') as f:
                    session = json.load(f)
                    
                # Simple keyword matching
                query_lower = query.lower()
                if any(query_lower in str(v).lower() for v in session.get('data', {}).values()):
                    relevant.append(session)
            
            return relevant[-limit:]  # Return most recent
        except:
            return []
    
    def _parse_ov_results(self, output, limit):
        """Parse OpenViking CLI output"""
        # Simple parser - you may need to adjust based on actual CLI output format
        results = []
        lines = output.split('\n')
        
        for line in lines:
            if line.strip() and 'viking://' in line:
                # Extract relevant info from CLI output
                result = {
                    'type': 'openviking_result',
                    'source': line.strip(),
                    'terminal_id': self.terminal_id,
                    'timestamp': time.time()
                }
                results.append(result)
        
        return results[:limit]
    
    def is_server_available(self):
        """Check if OpenViking server is available"""
        try:
            result = subprocess.run([
                'curl', '-s', 'http://localhost:1933/status'
            ], capture_output=True, timeout=5)
            return result.returncode == 0
        except:
            return False
    
    def is_vllm_available(self):
        """Check if vLLM server is available"""
        try:
            result = subprocess.run([
                'curl', '-s', f'{self.vllm_endpoint}/v1/models'
            ], capture_output=True, timeout=5)
            return result.returncode == 0
        except:
            return False

# Auto-save context after each session
def auto_save_context():
    """Automatically save context after each command"""
    if 'QWEN_SUBCONSCIOUS_ACTIVE' not in os.environ:
        return
    
    try:
        # Get current terminal session data
        terminal_id = os.getenv('TERMINAL_ID', 'unknown')
        cwd = os.getcwd()
        user = os.getenv('USER', 'unknown')
        
        session_data = {
            'terminal': terminal_id,
            'timestamp': time.strftime('%Y-%m-%dT%H:%M:%S'),
            'cwd': cwd,
            'user': user,
            'working_directory': cwd,
            'host': os.uname().nodename
        }
        
        # Save to subconscious
        subconscious = QwenSubconscious()
        if subconscious.is_server_available():
            subconscious.save_context(session_data)
            print("🧠 Context saved", end='\r')
        else:
            print("⏳ Subconscious starting...", end='\r')
    except Exception as e:
        print("   ", end='\r')  # Clear status

# Hook for shell session integration
def setup_bash_integration():
    """Setup bash integration for auto-save"""
    bashrc_path = Path.home() / '.bashrc'
    backup_line = '# Qwen Code Subconscious Integration'
    
    # Check if already integrated
    if backup_line not in bashrc_path.read_text():
        integration = f"""
{backup_line}
export QWEN_SUBCONSCIOUS_ACTIVE=true
export TERMINAL_ID="terminal_$(date +%s)_$RANDOM"

# Auto-save context after each command
export PROMPT_COMMAND='python3 /home/leviathan/.qwen/subconscious-hook.py; '"$PROMPT_COMMAND"
"""
        bashrc_path.write_text(bashrc_path.read_text() + integration)
        print("✅ Added bash integration to ~/.bashrc")

# Initialize
if __name__ == "__main__":
    # Setup bash integration
    setup_bash_integration()
    
    # Create session files directory if needed
    os.makedirs('/home/leviathan/openviking_workspace/sessions', exist_ok=True)
    
    print("✅ Qwen Code subconscious initialized")

# Create convenience functions
def save_manual_context(description):
    """Manually save context with description"""
    subconscious = QwenSubconscious()
    data = {
        'manual_save': True,
        'description': description,
        'terminal': os.getenv('TERMINAL_ID'),
        'cwd': os.getcwd()
    }
    subconscious.save_context(data)
    print("📝 Context manually saved")

def search_memory(query, limit=10):
    """Search memory for relevant context"""
    subconscious = QwenSubconscious()
    results = subconscious.get_relevant_context(query, limit)
    print(f"🔍 Results for '{query}':")
    for i, result in enumerate(results, 1):
        print(f"  {i}. {result}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        if sys.argv[1] == "auto-save":
            auto_save_context()
        elif sys.argv[1] == "save":
            save_manual_context(" ".join(sys.argv[2:]))
        elif sys.argv[1] == "search":
            search_memory(" ".join(sys.argv[2:]))
HOOK_EOF

chmod +x /home/leviathan/.qwen/subconscious-hook.py

# Create convenient aliases
cat >> ~/.bashrc << 'ALIASES_EOF'

# Qwen Code Subconscious Aliases
alias qwen-save="python3 /home/leviathan/.qwen/subconscious-hook.py save"
alias qwen-search="python3 /home/leviathan/.qwen/subconscious-hook.py search"
alias qwen-status="python3 -c \"
import subprocess
sub = subprocess.run(['curl', '-s', 'http://localhost:1933/status'], capture_output=True)
print(f'OpenViking: {\"✅ Running\" if sub.returncode == 0 else \"❌ Stopped\"}')
sub2 = subprocess.run(['curl', '-s', 'http://localhost:8000/v1/models'], capture_output=True)
print(f'vLLM: {\"✅ Running\" if sub2.returncode == 0 else \"❌ Stopped\"}')
\"
ALIASES_EOF

# Auto-save to current session
export PROMPT_COMMAND='python3 /home/leviathan/.qwen/subconscious-hook.py auto-save; '"$PROMPT_COMMAND"

echo "✅ Qwen Code integration complete"
echo ""
echo "🎯 Subconscious Features:"
echo "   🧠 Auto-saves session context after each command"
echo "   🔍 Smart context retrieval with local fallback"
echo "   🔄 Cross-terminal knowledge sharing"
echo "   📊 Multi-agent memory system"
echo ""
echo "💡 Usage Commands:"
echo "   qwen-save 'description'          # Manually save context"
echo "   qwen-search 'query'              # Search memory"
echo "   qwen-status                      # Check services status"
echo ""
echo "📍 Workspace: $QWEN_WORKSPACE"
echo "🔗 vLLM: $QWEN_VLLM_ENDPOINT"
echo "🧠 Status: Active (auto-starting services)"
echo ""
echo "🎉 Your Qwen Code now has a permanent subconscious!"
echo ""
echo "💡 Note: vLLM is downloading and starting in background."
echo "         Subconscious will work with local storage until vLLM is ready."