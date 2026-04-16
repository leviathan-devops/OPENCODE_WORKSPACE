#!/bin/bash
# Simulate a new terminal session
echo "Simulating a NEW TERMINAL session..."
echo "===================================="
echo ""

# Start a new bash session with the current environment
bash --rcfile ~/.bashrc -i << 'EOF'
echo ""
echo "This is what you'll see in EVERY new terminal!"
echo ""
# Just show that we're in a new session
exit
EOF

echo ""
echo "===================================="
echo "In a real terminal, you'll see the Qwen Code welcome banner!"
echo "The vLLM server starts automatically on boot."
echo "All commands are ready to use immediately."