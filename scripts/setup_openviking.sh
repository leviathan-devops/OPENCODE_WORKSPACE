#!/bin/bash
# OpenViking Setup Script for Leviathan Lite

echo "Setting up OpenViking Vector Memory..."

# Install OpenViking Python package
echo "Installing OpenViking Python package..."
pip install openviking --upgrade

# Create workspace directory
mkdir -p /home/leviathan/OPENCODE_WORKSPACE/openviking_workspace/{data,logs,indices}

# Check if Ollama is running (for local embeddings)
echo "Checking for Ollama..."
if ! command -v ollama &> /dev/null; then
    echo "Ollama not found. Installing..."
    curl -fsSL https://ollama.com/install.sh | sh
    echo "Starting Ollama..."
    ollama serve &
    sleep 5
    echo "Pulling embedding model..."
    ollama pull nomic-embed-text
    ollama pull llama3.2:3b
else
    echo "Ollama is already installed"
fi

# Create Python client for Leviathan integration
cat > /home/leviathan/OPENCODE_WORKSPACE/openviking_workspace/leviathan_client.py << 'EOF'
#!/usr/bin/env python3
"""
OpenViking Client for Leviathan Lite
"""
import json
import subprocess
import os
from datetime import datetime

class OpenVikingClient:
    def __init__(self, workspace="/home/leviathan/OPENCODE_WORKSPACE/openviking_workspace"):
        self.workspace = workspace
        self.config_file = "/home/leviathan/OPENCODE_WORKSPACE/.openviking/ov.conf"
        
    def add_memory(self, content, name=None, metadata=None):
        """Add a memory to OpenViking"""
        if name is None:
            name = f"memory_{int(datetime.now().timestamp())}"
        
        if metadata is None:
            metadata = {}
        
        metadata.update({
            "timestamp": datetime.now().isoformat(),
            "source": "leviathan_lite"
        })
        
        # Create temp file with content
        temp_file = f"/tmp/ov_{name}.txt"
        with open(temp_file, 'w') as f:
            f.write(content)
        
        # Build command
        cmd = ['ov', 'add-resource', '--content-file', temp_file, '--name', name]
        
        # Add metadata
        metadata_str = json.dumps(metadata)
        cmd.extend(['--metadata', metadata_str])
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            os.remove(temp_file)
            
            if result.returncode == 0:
                return {
                    "success": True,
                    "id": name,
                    "output": result.stdout.strip()
                }
            else:
                return {
                    "success": False,
                    "error": result.stderr.strip(),
                    "output": result.stdout.strip()
                }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def search_memories(self, query, limit=5):
        """Search memories in OpenViking"""
        cmd = ['ov', 'find', query, '--limit', str(limit)]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0:
                # Parse output (assuming JSON format)
                try:
                    results = json.loads(result.stdout)
                    return {
                        "success": True,
                        "results": results,
                        "count": len(results) if isinstance(results, list) else 0
                    }
                except json.JSONDecodeError:
                    return {
                        "success": True,
                        "raw_output": result.stdout.strip(),
                        "count": 0
                    }
            else:
                return {
                    "success": False,
                    "error": result.stderr.strip()
                }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_status(self):
        """Get OpenViking status"""
        cmd = ['ov', 'status']
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
            return {
                "success": result.returncode == 0,
                "output": result.stdout.strip() if result.returncode == 0 else result.stderr.strip()
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def add_conversation(self, role, content, context=None):
        """Add conversation to memory"""
        memory_content = f"Role: {role}\nContent: {content}"
        if context:
            memory_content += f"\nContext: {context}"
        
        name = f"conv_{role}_{int(datetime.now().timestamp())}"
        metadata = {
            "type": "conversation",
            "role": role,
            "timestamp": datetime.now().isoformat()
        }
        
        return self.add_memory(memory_content, name, metadata)

# Singleton instance
openviking = OpenVikingClient()

if __name__ == "__main__":
    # Test the client
    client = OpenVikingClient()
    print("Testing OpenViking client...")
    
    status = client.get_status()
    print(f"Status: {status}")
    
    # Test adding a memory
    test_result = client.add_memory(
        "Leviathan Lite is a single-agent enhancement system with DeepSeek Brain Bridge and OpenViking vector memory.",
        "leviathan_lite_description"
    )
    print(f"Add memory test: {test_result}")
    
    # Test searching
    search_result = client.search_memories("Leviathan", limit=3)
    print(f"Search test: {search_result}")
EOF

chmod +x /home/leviathan/OPENCODE_WORKSPACE/openviking_workspace/leviathan_client.py

echo ""
echo "✅ OpenViking setup complete!"
echo ""
echo "To test OpenViking:"
echo "  python3 /home/leviathan/OPENCODE_WORKSPACE/openviking_workspace/leviathan_client.py"
echo ""
echo "To check status:"
echo "  ov status"
echo ""
echo "To add a memory:"
echo "  ov add-resource --content 'Your memory here' --name test_memory"
echo ""
echo "To search memories:"
echo "  ov find 'search query'"
