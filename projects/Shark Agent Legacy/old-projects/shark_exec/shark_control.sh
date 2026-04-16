#!/bin/bash
# SHARK Control Script

case "$1" in
    status)
        echo "🦈 SHARK System Status"
        echo "====================="
        
        # Ollama
        if systemctl is-active --quiet ollama; then
            echo "✅ Ollama: Running"
            echo "   Models:"
            ollama list | awk '{print "     - " $1}'
        else
            echo "❌ Ollama: Stopped"
        fi
        
        # TGI
        echo ""
        echo "🔧 TGI Servers:"
        if docker ps | grep -q "tgi-"; then
            docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep tgi-
        else
            echo "   Not running"
        fi
        
        # Hermes config
        echo ""
        echo "🤖 Hermes Configuration:"
        current_model=$(grep -A1 "model:" /home/leviathan/.hermes/config.yaml | grep "default:" | awk '{print $2}')
        current_provider=$(grep -A1 "model:" /home/leviathan/.hermes/config.yaml | grep "provider:" | awk '{print $2}')
        echo "   Model: $current_model"
        echo "   Provider: $current_provider"
        
        # VRAM usage
        echo ""
        echo "💾 VRAM Usage:"
        nvidia-smi --query-gpu=memory.used,memory.total --format=csv,noheader,nounits | awk -F',' '{printf "   Used: %d MB / %d MB (%.1f%%)\n", $1, $2, ($1/$2)*100}'
        ;;
    
    switch)
        case "$2" in
            ollama)
                echo "🔄 Switching to Ollama (single brain)..."
                cp /home/leviathan/.hermes/config.yaml.backup /home/leviathan/.hermes/config.yaml
                echo "✅ Now using Ollama Qwen only"
                ;;
            tgi)
                echo "🔄 Switching to TGI (dual brain)..."
                cp /home/leviathan/.hermes/config_shark_final.yaml /home/leviathan/.hermes/config.yaml
                echo "✅ Now using TGI with smart routing"
                ;;
            *)
                echo "Usage: $0 switch {ollama|tgi}"
                ;;
        esac
        ;;
    
    start-tgi)
        echo "🚀 Starting TGI servers..."
        cd /home/leviathan/shark/tgi
        docker-compose up -d
        echo "✅ TGI servers starting..."
        echo "   Qwen: http://localhost:8080"
        echo "   DeepSeek: http://localhost:8081"
        ;;
    
    stop-tgi)
        echo "🛑 Stopping TGI servers..."
        cd /home/leviathan/shark/tgi
        docker-compose down
        echo "✅ TGI servers stopped"
        ;;
    
    test)
        echo "🧪 Testing SHARK system..."
        
        # Test Ollama
        echo "1. Testing Ollama..."
        curl -s http://localhost:11434/api/tags > /dev/null && echo "   ✅ Ollama responding" || echo "   ❌ Ollama not responding"
        
        # Test TGI if running
        if docker ps | grep -q "tgi-"; then
            echo "2. Testing TGI servers..."
            curl -s http://localhost:8080/health > /dev/null && echo "   ✅ Qwen TGI responding" || echo "   ❌ Qwen TGI not responding"
            curl -s http://localhost:8081/health > /dev/null && echo "   ✅ DeepSeek TGI responding" || echo "   ❌ DeepSeek TGI not responding"
        fi
        
        # Test brain bridge
        echo "3. Testing brain bridge..."
        python3 -c "import sys; sys.path.append('/home/leviathan/shark'); from brain_bridge import BRAIN_BRIDGE; import asyncio; print('   ✅ Brain bridge import successful')" 2>/dev/null || echo "   ❌ Brain bridge import failed"
        
        echo ""
        echo "📊 System ready for commands!"
        ;;
    
    brain-bridge)
        echo "🧠 Starting brain bridge test..."
        cd /home/leviathan/shark
        python3 -c "
import asyncio
import sys
sys.path.append('.')
from brain_bridge import BRAIN_BRIDGE

async def test():
    result = await BRAIN_BRIDGE.process_query('Write a Python function that sorts a list and removes duplicates')
    print(f'Thinking method: {result[\"thinking_method\"]}')
    print(f'Response preview: {result[\"response\"][:200]}...')

asyncio.run(test())
"
        ;;
    
    help|*)
        echo "🦈 SHARK Control Script"
        echo "======================"
        echo "Commands:"
        echo "  status        - Show system status"
        echo "  switch MODE   - Switch between ollama/tgi"
        echo "  start-tgi     - Start TGI servers"
        echo "  stop-tgi      - Stop TGI servers"
        echo "  test          - Test all components"
        echo "  brain-bridge  - Test brain bridge"
        echo "  help          - Show this help"
        ;;
esac
