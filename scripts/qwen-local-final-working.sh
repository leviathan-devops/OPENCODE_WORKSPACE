#!/usr/bin/env python3
"""
Qwen with Local Qwen Coder - ULTIMATE WORKING FIX
Completely bypasses qwen's config system to force local endpoint
"""

import os
import sys
import subprocess

def main():
    print("🤖 Qwen with Local Qwen Coder (ULTIMATE WORKING FIX)")
    print("===================================================")
    print("🧠 Architecture: Dual-Brain (DeepSeek R1 + Local Qwen)")
    print("💰 Cost: 100% free execution tokens")
    print("📍 Model: Qwen2.5-Coder-7B (Local GPU)")
    print("🔗 API: http://localhost:8001/v1")
    print("")

    # Check if local agents are running
    try:
        import requests
        response = requests.get("http://localhost:8001/v1/models", timeout=5)
        if response.status_code != 200:
            print("❌ Local agents not responding properly")
            sys.exit(1)
    except:
        print("❌ Local agents not running")
        print("   Run: sudo systemctl start qwen-coders.service")
        sys.exit(1)

    print("🔧 ULTIMATE CONFIG OVERRIDE:")

    # Force configuration regardless of any existing settings
    os.environ['OPENAI_API_BASE'] = 'http://localhost:8001/v1'
    os.environ['OPENAI_API_KEY'] = 'qwen-local-execution'
    os.environ['OPENAI_MODEL'] = 'qwen-coder-7b-local'

    # Clear any conflicting settings
    conflicting_keys = [key for key in os.environ.keys() if 'GLM_' in key or 'QWEN_' in key]
    for key in conflicting_keys:
        del os.environ[key]

    print(f"   ✅ OPENAI_API_BASE: {os.environ.get('OPENAI_API_BASE')}")
    print(f"   ✅ OPENAI_API_KEY: {os.environ.get('OPENAI_API_KEY')}")
    print(f"   ✅ OPENAI_MODEL: {os.environ.get('OPENAI_MODEL')}")
    print("")

    # Get qwen command path
    qwen_cmd = 'qwen'
    
    # Build qwen command with all arguments
    cmd = [qwen_cmd] + sys.argv[1:]

    print("🚀 Launching Qwen with ULTIMATE configuration override...")
    print(f"📡 Using endpoint: {os.environ.get('OPENAI_API_BASE')}")
    print(f"🔑 API Key: {os.environ.get('OPENAI_API_KEY')}")
    print("")

    # Execute with forced configuration
    try:
        result = subprocess.run(cmd, env=os.environ.copy())
        sys.exit(result.returncode)
    except KeyboardInterrupt:
        print("\n⏹️  Interrupted by user")
        sys.exit(130)
    except Exception as e:
        print(f"❌ Execution failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()