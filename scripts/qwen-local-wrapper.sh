#!/bin/bash
# Wrapper script to ensure Qwen Code uses local vLLM

# First, switch to local vLLM
. ~/.bash_aliases
qwen-local

# Then run qwen with explicit model
echo "Running Qwen Code with local vLLM..."
echo "Model: qwen-coder-14b"
echo "API: http://localhost:8000/v1"
echo ""

# Run qwen with explicit model flag
exec qwen -m qwen-coder-14b "$@"