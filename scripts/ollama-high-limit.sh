#!/bin/bash
# Kill existing ollama processes
pkill -f "ollama serve"
pkill -f "ollama runner"

# Start ollama with high limits
export OLLAMA_NUM_PARALLEL=20
export OLLAMA_MAX_QUEUE=200
export OLLAMA_CONTEXT_LENGTH=131072
export OLLAMA_MAX_LOADED_MODELS=5

/usr/local/bin/ollama serve &
echo "Ollama started with high limits"
