#!/usr/bin/env python3
import requests, subprocess, sys, json, re

OLLAMA = "http://localhost:11434/api/generate"
MODEL = "qwen3.5:9b"

def run_code(code):
    code = re.sub(r'```python\n?|```', '', code).strip()
    if not code: return "No code generated"
    try:
        r = subprocess.run(["python3", "-c", code], capture_output=True, text=True, timeout=120, cwd="/home/leviathan")
        return (r.stdout + r.stderr).strip() or "Executed (no output)"
    except Exception as e: return f"Execution error: {e}"

def ask(prompt):
    resp = requests.post(OLLAMA, json={
        "model": MODEL,
        "prompt": f"You are an autonomous coding agent. Task: {prompt}\n\nGenerate ONLY raw Python code. No markdown. No explanations. Just executable code.",
        "stream": False
    }, timeout=60)
    return resp.json().get("response", "").strip()

def main():
    if len(sys.argv) > 1:
        prompt = " ".join(sys.argv[1:])
        code = ask(prompt)
        print(f"→ Executing:\n{code}\n")
        print(f"← Output:\n{run_code(code)}")
        return
    print("🤖 AI Agent — Type 'exit' to quit")
    while True:
        try:
            prompt = input("\nYou: ")
            if prompt.lower() in ["exit", "quit"]: break
            code = ask(prompt)
            print(f"→ Executing:\n{code}\n")
            print(f"← Output:\n{run_code(code)}")
        except KeyboardInterrupt: break
        except Exception as e: print(f"Error: {e}")

if __name__ == "__main__": main()
