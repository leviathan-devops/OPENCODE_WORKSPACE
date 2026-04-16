#!/bin/bash
# Test switching system PROPERLY

echo "=== Testing Qwen Switching System ==="
echo ""

echo "1. First, source your bashrc to load the functions:"
echo "   source ~/.bashrc"
echo ""

echo "2. Then check current status:"
echo "   qwen-api-status"
echo ""

echo "3. To switch to local vLLM:"
echo "   qwen-local"
echo "   # This sets environment variables AND updates config files"
echo ""

echo "4. To switch to DeepSeek:"
echo "   qwen-deepseek"
echo "   # This sets environment variables AND updates config files"
echo ""

echo "5. To run Qwen Code immediately:"
echo "   qwen-run-local --yolo"
echo "   # OR"
echo "   qwen-run-deepseek --yolo"
echo ""

echo "=== IMPORTANT ==="
echo "The switching ONLY affects the terminal where you run the command."
echo "Each terminal can have different settings!"
echo ""
echo "Example:"
echo "  Terminal 1: qwen-local → uses local vLLM"
echo "  Terminal 2: qwen-deepseek → uses DeepSeek"
echo "  Both work simultaneously!"