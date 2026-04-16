import requests
import json

prompt = open("/home/leviathan/OPENCODE_WORKSPACE/test-prompt-qwen7b.md").read()

payload = {
    "model": "/home/leviathan/OPENCODE_WORKSPACE/models/Qwen2.5-Coder-7B-Instruct-AWQ",
    "messages": [
        {"role": "system", "content": "You are a code executor. Follow the instructions exactly. Output ONLY the complete Rust code in a single file. No explanations, no markdown fences. Just the raw Rust code starting with use statements."},
        {"role": "user", "content": prompt}
    ],
    "max_tokens": 8192,
    "temperature": 0.1
}

print("Sending request to vLLM...")
resp = requests.post("http://localhost:8000/v1/chat/completions", json=payload, timeout=120)
result = resp.json()

if "choices" in result:
    code = result["choices"][0]["message"]["content"]
    # Strip markdown fences if present
    if code.startswith("```"):
        lines = code.split("\n")
        # Remove first line (```rust or ```)
        lines = lines[1:]
        # Remove last line if it's ```
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        code = "\n".join(lines)
    
    with open("/home/leviathan/OPENCODE_WORKSPACE/mpsc_lockfree.rs", "w") as f:
        f.write(code)
    
    print(f"\n=== RESPONSE ({len(code)} chars) ===")
    print(code[:2000])
    if len(code) > 2000:
        print(f"\n... [{len(code)-2000} more chars]")
else:
    print(f"Error: {json.dumps(result, indent=2)}")
