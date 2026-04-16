#!/bin/bash
echo "🔍 Testing DeepSeek Brain with advisory request..."
cd /home/leviathan/OPENCODE_WORKSPACE/shark-agent
python3 skills/deepseek-brain/run.py "Analyze this Python code for improvements: print('hello world')"
