#!/bin/bash
# Fix Python environment and install vLLM

set -e

echo "=== FIXING PYTHON ENVIRONMENT ==="

# 1. Remove existing venv if broken
cd /home/leviathan
rm -rf shark-venv-fixed

# 2. Create new venv with system packages
echo "Creating virtual environment..."
python3 -m venv shark-venv-fixed --system-site-packages

# 3. Activate and upgrade pip
echo "Upgrading pip..."
source shark-venv-fixed/bin/activate
pip install --upgrade pip

# 4. Install vLLM with explicit flags
echo "Installing vLLM..."
pip install vllm torch --index-url https://download.pytorch.org/whl/cu121

# 5. Test installation
echo "Testing installation..."
python -c "import vllm; print('✅ vLLM installed successfully')"

# 6. Create simple test script
cat > test_vllm.py << 'EOF'
#!/usr/bin/env python3
import vllm
print("vLLM version:", vllm.__version__)

# Try to load a model
from vllm import LLM, SamplingParams

# Test with small model first
try:
    print("Testing model loading...")
    llm = LLM(model="Qwen/Qwen2.5-Coder-14B-Instruct-AWQ", 
              max_model_len=2048,
              gpu_memory_utilization=0.8)
    print("✅ Model loaded successfully")
except Exception as e:
    print(f"⚠ Model loading test failed: {e}")
    print("But vLLM is installed at least")
EOF

chmod +x test_vllm.py
./test_vllm.py

echo ""
echo "=== SETUP COMPLETE ==="
echo "Virtual environment: /home/leviathan/OPENCODE_WORKSPACE/shark-venv-fixed"
echo "Activate with: source /home/leviathan/OPENCODE_WORKSPACE/shark-venv-fixed/bin/activate"
echo "Then run: python test_vllm.py"