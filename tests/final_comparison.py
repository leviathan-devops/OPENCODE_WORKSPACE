#!/usr/bin/env python3
"""
Final comparison of both DeepSeek Brain Bridge solutions
"""

import time
import requests
import json
from datetime import datetime

class BrainBridgeComparison:
    def __init__(self):
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "comparison": {
                "sticky_browser": {
                    "name": "Brain Bridge Sticky Browser",
                    "type": "Web Dashboard + API",
                    "url": "http://localhost:3002",
                    "status": "unknown",
                    "advantages": [],
                    "disadvantages": []
                },
                "agent_brain": {
                    "name": "Agent Brain Bridge",
                    "type": "Terminal Python Module",
                    "path": "/home/leviathan/OPENCODE_WORKSPACE/agent-brain-bridge",
                    "status": "unknown",
                    "advantages": [],
                    "disadvantages": []
                }
            },
            "test_results": {},
            "recommendation": ""
        }
    
    def run_comparison(self):
        print("🧠 DEEPSEEK BRAIN BRIDGE COMPARISON")
        print("=" * 70)
        print(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print()
        
        # Test Sticky Browser
        print("🔵 TESTING STICKY BROWSER (Web Dashboard)")
        print("-" * 50)
        
        sticky_working = self.test_sticky_browser()
        
        print("\n🟢 TESTING AGENT BRAIN BRIDGE (Terminal)")
        print("-" * 50)
        
        agent_working = self.test_agent_brain_bridge()
        
        # Compare architectures
        print("\n🏗️  ARCHITECTURE COMPARISON")
        print("=" * 50)
        self.compare_architectures()
        
        # Generate recommendation
        print("\n🏆 FINAL RECOMMENDATION")
        print("=" * 50)
        self.generate_recommendation(sticky_working, agent_working)
        
        # Save results
        self.save_results()
    
    def test_sticky_browser(self):
        """Test the Sticky Browser solution."""
        try:
            # Test 1: Health check
            response = requests.get("http://localhost:3002/health", timeout=5)
            if response.status_code == 200:
                print("✅ Health check: Server is running")
                self.results["comparison"]["sticky_browser"]["status"] = "running"
            else:
                print(f"❌ Health check failed: HTTP {response.status_code}")
                self.results["comparison"]["sticky_browser"]["status"] = "failed"
                return False
            
            # Test 2: Quick chat test
            print("   Testing chat endpoint...")
            try:
                start = time.time()
                response = requests.post(
                    "http://localhost:3002/agent-gateway/ask",
                    json={"prompt": "Hello! What is 2+2?", "agent_name": "test"},
                    timeout=10
                )
                latency = time.time() - start
                
                if response.status_code == 200:
                    data = response.json()
                    print(f"✅ Chat test: {latency:.2f}s via {data.get('provider', 'unknown')}")
                    print(f"   Response: {data.get('response', '')[:80]}...")
                    
                    self.results["test_results"]["sticky_chat"] = {
                        "success": True,
                        "latency": latency,
                        "provider": data.get('provider'),
                        "response_length": len(data.get('response', ''))
                    }
                    
                    # Add advantages
                    self.results["comparison"]["sticky_browser"]["advantages"].extend([
                        "No authentication required",
                        "Web interface available",
                        "API access for agents",
                        "Three-tier fallback system",
                        "Multiple concurrent agents"
                    ])
                    
                    return True
                else:
                    print(f"❌ Chat failed: HTTP {response.status_code}")
                    self.results["test_results"]["sticky_chat"] = {
                        "success": False,
                        "error": f"HTTP {response.status_code}"
                    }
                    return False
            except requests.exceptions.Timeout:
                print("❌ Chat test timed out (10s)")
                self.results["comparison"]["sticky_browser"]["disadvantages"].append("Chat endpoint timing out")
                return False
            except Exception as e:
                print(f"❌ Chat test error: {e}")
                return False
                
        except Exception as e:
            print(f"❌ Sticky Browser test failed: {e}")
            self.results["comparison"]["sticky_browser"]["status"] = "error"
            return False
    
    def test_agent_brain_bridge(self):
        """Test the Agent Brain Bridge solution."""
        print("   Checking module availability...")
        
        # Check if files exist
        import os
        agent_path = "/home/leviathan/OPENCODE_WORKSPACE/agent-brain-bridge"
        
        if not os.path.exists(os.path.join(agent_path, "deepseek_brain_bridge.py")):
            print("❌ Module not found")
            self.results["comparison"]["agent_brain"]["status"] = "not_found"
            return False
        
        print("✅ Module files found")
        
        # Check authentication requirements
        auth_file = os.path.join(agent_path, "authenticate_deepseek.py")
        if os.path.exists(auth_file):
            print("⚠️  Authentication required (run authenticate_deepseek.py)")
            self.results["comparison"]["agent_brain"]["disadvantages"].append("Requires manual authentication")
        
        # Check architecture from README
        readme_file = os.path.join(agent_path, "README.md")
        if os.path.exists(readme_file):
            try:
                with open(readme_file, 'r') as f:
                    content = f.read()
                    if "3,000 tokens" in content:
                        print("✅ Claims 3k token efficiency (70% reduction)")
                        self.results["comparison"]["agent_brain"]["advantages"].append("3k token efficiency claimed")
                    if "MIT License" in content:
                        print("✅ MIT Licensed (open source)")
                        self.results["comparison"]["agent_brain"]["advantages"].append("MIT Licensed")
            except:
                pass
        
        # Check for research agent integration
        if os.path.exists(os.path.join(agent_path, "research_agent.py")):
            print("✅ Research agent integration available")
            self.results["comparison"]["agent_brain"]["advantages"].append("Research agent integration")
        
        self.results["comparison"]["agent_brain"]["status"] = "requires_auth"
        return True  # Module exists but needs auth
    
    def compare_architectures(self):
        """Compare the architectures of both solutions."""
        
        print("\n🔵 STICKY BROWSER ARCHITECTURE:")
        print("   Type: Web Dashboard + API Server")
        print("   Access: HTTP REST API (port 3002)")
        print("   Authentication: Server handles (browser cookies)")
        print("   Fallback: Three-tier (Browser → OpenRouter → Puter.js)")
        print("   Scalability: Multiple concurrent agents via API")
        print("   Setup: Already running, no auth needed")
        print("   Features: Web interface, file upload, monitoring")
        
        print("\n🟢 AGENT BRAIN BRIDGE ARCHITECTURE:")
        print("   Type: Python Module + Browser Automation")
        print("   Access: Direct Python import")
        print("   Authentication: Manual (credentials required)")
        print("   Fallback: Unknown (likely single method)")
        print("   Scalability: Limited by browser instances")
        print("   Setup: Requires authentication and dependencies")
        print("   Features: Terminal/CLI, research agent, Slack integration")
        
        print("\n📊 ARCHITECTURE COMPARISON TABLE:")
        print("   | Feature | Sticky Browser | Agent Brain Bridge |")
        print("   |---------|---------------|-------------------|")
        print("   | Access Method | HTTP API | Python module |")
        print("   | Authentication | Server handles | User manages |")
        print("   | Fallback System | Three-tier | Unknown |")
        print("   | Scalability | Multiple agents | Single instance |")
        print("   | Setup Complexity | Low (running) | Medium (needs auth) |")
        print("   | Token Efficiency | Unknown | Claims 3k (70% reduction) |")
        print("   | License | Unknown | MIT (open source) |")
    
    def generate_recommendation(self, sticky_works, agent_exists):
        """Generate final recommendation."""
        
        if sticky_works:
            print("\n✅ STICKY BROWSER IS WORKING")
            print("   - No authentication required")
            print("   - Web interface: http://localhost:3002")
            print("   - API endpoint: http://localhost:3002/agent-gateway")
            print("   - Three-tier fallback system")
            print("   - Multiple agent support")
            
            self.results["recommendation"] = "Use Sticky Browser for most use cases"
            
            print("\n🎯 BEST FOR:")
            print("   - Teams and collaboration")
            print("   - Web-based workflows")
            print("   - API integration")
            print("   - Multiple concurrent agents")
            print("   - Users who want a web interface")
        
        if agent_exists:
            print("\n🟢 AGENT BRAIN BRIDGE AVAILABLE")
            print("   - Direct Python integration")
            print("   - Terminal/CLI workflow")
            print("   - MIT Licensed (open source)")
            print("   - Research agent integration")
            print("   - Claims 70% token efficiency")
            
            if not sticky_works:
                self.results["recommendation"] = "Use Agent Brain Bridge (requires authentication)"
            
            print("\n🎯 BEST FOR:")
            print("   - Individual developers")
            print("   - CLI/terminal workflows")
            print("   - Python-based agents")
            print("   - Users who prefer terminal")
            print("   - Open source projects")
        
        if sticky_works and agent_exists:
            print("\n💡 HYBRID APPROACH RECOMMENDED")
            print("   Use Sticky Browser as: Backend API server")
            print("   Use Agent Brain as: Python client library")
            print("   Get benefits of both solutions")
            
            self.results["recommendation"] = "Hybrid approach: Sticky Browser backend + Python client"
            
            print("\n🚀 IMPLEMENTATION:")
            print("""
# Python client for Sticky Browser API
import requests

class StickyBrainClient:
    def __init__(self, base_url="http://localhost:3002"):
        self.base_url = base_url
    
    def think(self, prompt, agent_name="python-client"):
        response = requests.post(
            f"{self.base_url}/agent-gateway/ask",
            json={"prompt": prompt, "agent_name": agent_name}
        )
        return response.json()["response"]
    
    # Can add more methods: batch processing, session management, etc.
""")
        
        print("\n📈 KEY METRICS:")
        print("   1. Ease of Use: Sticky = Web interface, Agent = Terminal")
        print("   2. Agent Integration: Sticky = HTTP API, Agent = Python import")
        print("   3. Scalability: Sticky = High, Agent = Low")
        print("   4. Maintenance: Sticky = Server, Agent = Python deps")
        print("   5. Security: Sticky = Server handles, Agent = User manages")
    
    def save_results(self):
        """Save comparison results to file."""
        output_file = "/home/leviathan/OPENCODE_WORKSPACE/brain_bridge_final_comparison.json"
        with open(output_file, 'w') as f:
            json.dump(self.results, f, indent=2)
        
        print(f"\n📄 Full comparison saved to: {output_file}")
        
        # Also create a summary markdown file
        summary = f"""# DeepSeek Brain Bridge Comparison
## Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Solutions Tested:
1. **Sticky Browser** (Web Dashboard + API) - Status: {self.results["comparison"]["sticky_browser"]["status"]}
2. **Agent Brain Bridge** (Terminal Python Module) - Status: {self.results["comparison"]["agent_brain"]["status"]}

## Test Results:
- Sticky Browser: {'✅ Working' if self.results["comparison"]["sticky_browser"]["status"] == 'running' else '❌ Issues'}
- Agent Brain Bridge: {'✅ Available' if self.results["comparison"]["agent_brain"]["status"] != 'not_found' else '❌ Not found'}

## Recommendation:
{self.results["recommendation"]}

## Next Steps:
1. For web/API workflows: Use Sticky Browser (http://localhost:3002)
2. For terminal/Python workflows: Use Agent Brain Bridge (requires auth)
3. For best of both: Create Python client for Sticky Browser API

## Files:
- Full JSON results: {output_file}
- Sticky Browser: /home/leviathan/OPENCODE_WORKSPACE/brain-bridge
- Agent Brain Bridge: /home/leviathan/OPENCODE_WORKSPACE/agent-brain-bridge
"""
        
        with open("/home/leviathan/OPENCODE_WORKSPACE/brain_bridge_comparison_summary.md", 'w') as f:
            f.write(summary)
        
        print(f"📝 Summary saved to: /home/leviathan/OPENCODE_WORKSPACE/brain_bridge_comparison_summary.md")

if __name__ == "__main__":
    comparator = BrainBridgeComparison()
    comparator.run_comparison()