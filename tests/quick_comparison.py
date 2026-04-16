#!/usr/bin/env python3
"""
Quick comparison of both brain bridge solutions
"""

import time
import requests
import subprocess
import sys

def test_sticky_browser():
    """Test the Sticky Browser solution."""
    print("\n🔵 TESTING STICKY BROWSER (Web Dashboard)")
    print("=" * 50)
    
    # Test 1: Health check
    try:
        response = requests.get("http://localhost:3002/health", timeout=5)
        print(f"✅ Health check: HTTP {response.status_code}")
        if response.status_code == 200:
            print(f"   Status: {response.json().get('status', 'unknown')}")
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False
    
    # Test 2: Basic chat
    try:
        start = time.time()
        response = requests.post(
            "http://localhost:3002/agent-gateway/ask",
            json={"prompt": "Hello DeepSeek! What is artificial intelligence?", "agent_name": "test"},
            timeout=30
        )
        latency = time.time() - start
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Chat test: {latency:.2f}s")
            print(f"   Provider: {data.get('provider', 'unknown')}")
            print(f"   Response length: {len(data.get('response', ''))} chars")
            print(f"   Preview: {data.get('response', '')[:80]}...")
            return True
        else:
            print(f"❌ Chat failed: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Chat test error: {e}")
        return False

def test_agent_brain_bridge():
    """Test the Agent Brain Bridge solution."""
    print("\n🟢 TESTING AGENT BRAIN BRIDGE (Terminal)")
    print("=" * 50)
    
    # Check if we can import it
    try:
        sys.path.insert(0, "/home/leviathan/OPENCODE_WORKSPACE/agent-brain-bridge")
        from deepseek_brain_bridge import DeepSeekBrainBridge
        
        print("✅ Module imported successfully")
        
        # Try to create instance
        try:
            bridge = DeepSeekBrainBridge()
            print("✅ Bridge instance created")
            
            # Try to think (this will likely fail without auth)
            print("⚠️  Attempting to think (may fail without authentication)...")
            start = time.time()
            response = bridge.think("Hello DeepSeek! What is artificial intelligence?")
            latency = time.time() - start
            
            print(f"✅ Think test: {latency:.2f}s")
            print(f"   Response length: {len(response)} chars")
            print(f"   Preview: {response[:80]}...")
            return True
        except Exception as e:
            print(f"❌ Bridge error: {e}")
            print("   This likely requires authentication")
            return False
    except ImportError as e:
        print(f"❌ Import failed: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def compare_architectures():
    """Compare the architectures of both solutions."""
    print("\n🏗️  ARCHITECTURE COMPARISON")
    print("=" * 50)
    
    print("\n🔵 STICKY BROWSER (Our Solution):")
    print("   Type: Web Dashboard + API Server")
    print("   Access: HTTP REST API")
    print("   Authentication: Server handles (browser cookies)")
    print("   Fallback: Three-tier (Browser → OpenRouter → Puter.js)")
    print("   Scalability: Multiple concurrent agents via API")
    print("   Setup: Already running on port 3002")
    
    print("\n🟢 AGENT BRAIN BRIDGE (Terminal Solution):")
    print("   Type: Python Module + Browser Automation")
    print("   Access: Direct Python import")
    print("   Authentication: Manual (credentials required)")
    print("   Fallback: Unknown (likely single method)")
    print("   Scalability: Limited by browser instances")
    print("   Setup: Requires authentication and dependencies")

def generate_recommendation(sticky_works, agent_works):
    """Generate recommendation based on test results."""
    print("\n🏆 RECOMMENDATION")
    print("=" * 50)
    
    if sticky_works and not agent_works:
        print("\n✅ RECOMMENDATION: Use STICKY BROWSER")
        print("   Reason: Already working, no authentication needed")
        print("   Best for: Teams, web workflows, API integration")
        print("   URL: http://localhost:3002")
        
    elif agent_works and not sticky_works:
        print("\n✅ RECOMMENDATION: Use AGENT BRAIN BRIDGE")
        print("   Reason: Terminal-based, direct Python integration")
        print("   Best for: Individual developers, CLI workflows")
        print("   Note: Requires authentication setup")
        
    elif sticky_works and agent_works:
        print("\n✅ RECOMMENDATION: HYBRID APPROACH")
        print("   Use Sticky Browser for: Web interface, team collaboration")
        print("   Use Agent Brain for: Terminal scripts, Python library")
        print("   Consider: Using Sticky Browser as backend for Agent Brain")
        
    else:
        print("\n⚠️  Both solutions need setup")
        print("   Sticky Browser: Check server is running")
        print("   Agent Brain: Requires authentication")
    
    print("\n📊 KEY DIFFERENCES:")
    print("   1. Authentication: Sticky = server handles, Agent = user manages")
    print("   2. Access: Sticky = HTTP API, Agent = Python module")
    print("   3. Scalability: Sticky = multiple agents, Agent = single instance")
    print("   4. Setup: Sticky = already running, Agent = requires auth")

if __name__ == "__main__":
    print("🧠 DEEPSEEK BRAIN BRIDGE QUICK COMPARISON")
    print("=" * 60)
    
    sticky_result = test_sticky_browser()
    agent_result = test_agent_brain_bridge()
    
    compare_architectures()
    generate_recommendation(sticky_result, agent_result)
    
    print("\n" + "=" * 60)
    print("🎯 FINAL VERDICT")
    print("=" * 60)
    
    if sticky_result:
        print("\n🔵 STICKY BROWSER WINS for:")
        print("   - No authentication required")
        print("   - Web interface + API access")
        print("   - Three-tier fallback system")
        print("   - Multiple agent support")
        print("   - Already running and tested")
    else:
        print("\n🔵 STICKY BROWSER needs:")
        print("   - Server restart")
        print("   - Port 3002 accessibility")
    
    if agent_result:
        print("\n🟢 AGENT BRAIN BRIDGE WINS for:")
        print("   - Direct Python integration")
        print("   - Terminal/CLI workflow")
        print("   - Individual developer use")
    else:
        print("\n🟢 AGENT BRAIN BRIDGE needs:")
        print("   - Authentication setup")
        print("   - Credentials management")
    
    print("\n💡 For AI agents needing DeepSeek access:")
    print("   - Use Sticky Browser for API-based agents")
    print("   - Use Agent Brain for Python-based agents")
    print("   - Consider hybrid: Agent Brain using Sticky Browser API")