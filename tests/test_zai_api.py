#!/usr/bin/env python3
import os
import json
import requests

# Read API key from .env
env_path = os.path.expanduser("~/.hermes/.env")
api_key = None
with open(env_path, 'r') as f:
    for line in f:
        if line.startswith("GLM_API_KEY="):
            api_key = line.strip().split("=", 1)[1]
            break

if not api_key:
    print("No GLM_API_KEY found in .env")
    exit(1)

print(f"Testing API key: {api_key[:10]}...")

# Test coding endpoint
url = "https://api.z.ai/api/coding/paas/v4/chat/completions"
headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}
data = {
    "model": "glm-4.5-flash",
    "messages": [{"role": "user", "content": "test"}],
    "max_tokens": 10
}

print(f"\nTesting coding endpoint: {url}")
print(f"Model: glm-4.5-flash")

try:
    response = requests.post(url, headers=headers, json=data, timeout=10)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text[:200]}")
except Exception as e:
    print(f"Error: {e}")

# Also test regular endpoint for comparison
print(f"\n\nTesting regular endpoint: https://api.z.ai/api/paas/v4/chat/completions")
url2 = "https://api.z.ai/api/paas/v4/chat/completions"
try:
    response2 = requests.post(url2, headers=headers, json=data, timeout=10)
    print(f"Status: {response2.status_code}")
    print(f"Response: {response2.text[:200]}")
except Exception as e:
    print(f"Error: {e}")