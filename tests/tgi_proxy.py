#!/usr/bin/env python3
"""
TGI-STYLE PROXY WITH ZERO LIMITS
Acts as OpenAI-compatible endpoint with no truncation
"""

import http.server
import socketserver
import json
import subprocess
import threading
from http import HTTPStatus
import time

PORT = 11434

class TGIProxyHandler(http.server.BaseHTTPRequestHandler):
    """HTTP handler that proxies to Ollama with no limits"""
    
    def do_POST(self):
        """Handle POST requests"""
        content_length = int(self.headers['Content-Length'])
        post_data = self.read_body(content_length)
        
        try:
            data = json.loads(post_data)
            
            if self.path == '/v1/completions':
                response = self.handle_completions(data)
            elif self.path == '/v1/chat/completions':
                response = self.handle_chat_completions(data)
            else:
                response = self.error_response(f"Unknown endpoint: {self.path}")
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode())
            
        except Exception as e:
            self.send_error(500, f"Internal error: {str(e)}")
    
    def read_body(self, length):
        """Read request body"""
        return self.rfile.read(length).decode('utf-8')
    
    def handle_completions(self, data):
        """Handle OpenAI completions endpoint"""
        model = data.get('model', 'qwen2.5-coder:7b')
        prompt = data.get('prompt', '')
        max_tokens = data.get('max_tokens', 4000)
        stream = data.get('stream', False)
        
        # Convert to Ollama format
        ollama_payload = {
            "model": model.replace('-', ':').replace('_', ':'),
            "prompt": prompt,
            "stream": stream,
            "options": {
                "num_predict": max_tokens,
                "num_ctx": 32768,
                "temperature": 0.7,
                "top_p": 0.95,
                "repeat_penalty": 1.1
            }
        }
        
        # Call Ollama
        result = self.call_ollama(ollama_payload)
        
        # Convert to OpenAI format
        return {
            "id": "tgi-proxy-" + str(int(time.time())),
            "object": "text_completion",
            "created": int(time.time()),
            "model": model,
            "choices": [{
                "text": result,
                "index": 0,
                "logprobs": None,
                "finish_reason": "length"
            }],
            "usage": {
                "prompt_tokens": len(prompt) // 4,
                "completion_tokens": len(result) // 4,
                "total_tokens": (len(prompt) + len(result)) // 4
            }
        }
    
    def handle_chat_completions(self, data):
        """Handle OpenAI chat completions endpoint"""
        model = data.get('model', 'qwen2.5-coder:7b')
        messages = data.get('messages', [])
        
        # Convert messages to prompt
        prompt = ""
        for msg in messages:
            role = msg.get('role', 'user')
            content = msg.get('content', '')
            prompt += f"{role}: {content}\n"
        
        # Call completions handler
        return self.handle_completions({
            "model": model,
            "prompt": prompt,
            "max_tokens": 4000
        })
    
    def call_ollama(self, payload):
        """Call Ollama API"""
        import requests
        
        try:
            url = "http://localhost:11435/api/generate"  # Different port to avoid conflict
            response = requests.post(url, json=payload, timeout=300)
            
            if response.status_code == 200:
                if payload.get('stream', False):
                    # Handle streaming
                    full_text = ""
                    for line in response.iter_lines():
                        if line:
                            try:
                                data = json.loads(line.decode('utf-8'))
                                if 'response' in data:
                                    full_text += data['response']
                                if data.get('done', False):
                                    break
                            except:
                                continue
                    return full_text
                else:
                    data = response.json()
                    return data.get('response', '')
            else:
                return f"Error: {response.status_code}"
                
        except Exception as e:
            return f"Proxy error: {str(e)}"
    
    def error_response(self, message):
        """Create error response"""
        return {
            "error": {
                "message": message,
                "type": "invalid_request_error",
                "code": 400
            }
        }
    
    def log_message(self, format, *args):
        """Override to reduce logging noise"""
        pass

def start_ollama_backend():
    """Start Ollama backend on different port"""
    print("Starting Ollama backend on port 11435...")
    
    # Try to start Ollama
    try:
        subprocess.Popen(["ollama", "serve", "--port", "11435"], 
                        stdout=subprocess.DEVNULL, 
                        stderr=subprocess.DEVNULL)
        time.sleep(5)
        print("Ollama backend started")
    except:
        print("Ollama not found, running in proxy-only mode")
    
    # Test connection
    try:
        import requests
        response = requests.get("http://localhost:11435/api/tags", timeout=5)
        if response.status_code == 200:
            print("Ollama backend connected")
        else:
            print("Ollama backend not responding")
    except:
        print("Cannot connect to Ollama backend")

def main():
    """Main function"""
    print("🚀 TGI-STYLE PROXY WITH ZERO LIMITS")
    print("=" * 50)
    print(f"Starting proxy on port {PORT}")
    print("OpenAI-compatible endpoint: http://localhost:11434/v1")
    print("No output limits, streaming enabled")
    print("=" * 50)
    
    # Start Ollama backend in separate thread
    backend_thread = threading.Thread(target=start_ollama_backend, daemon=True)
    backend_thread.start()
    
    # Start HTTP server
    with socketserver.TCPServer(("", PORT), TGIProxyHandler) as httpd:
        print(f"TGI Proxy ready at http://localhost:{PORT}")
        print("Press Ctrl+C to stop")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down TGI Proxy...")
            httpd.shutdown()

if __name__ == "__main__":
    main()