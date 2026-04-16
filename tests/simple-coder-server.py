#!/usr/bin/env python3
"""
Simple DeepSeek Coder Agent Server
Dual-Brain Architecture Implementation
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import urllib.parse

class CoderAgentHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/v1/models':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            response = {
                "object": "list",
                "data": [
                    {
                        "id": "qwen-coder-7b",
                        "object": "model",
                        "created": 1640995200,
                        "owned_by": "deepseek",
                    }
                ]
            }
            self.wfile.write(json.dumps(response).encode())
        elif self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(b"""
            <html>
            <head><title>DeepSeek Coder Agent</title></head>
            <body>
                <h1>DeepSeek Dual-Brain Architecture</h1>
                <h2>Coder Agent Server</h2>
                <p>Status: 🟢 Active</p>
                <p>Model: Qwen2.5-Coder-7B</p>
                <p>Architecture: Dual-Brain</p>
                <p>Role: Execution Motor Cortex</p>
                <p><a href="/v1/models">Models API</a></p>
            </body>
            </html>
            """)
        else:
            self.send_response(404)
    
    def do_POST(self):
        if self.path == '/v1/chat/completions':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode())
                messages = data.get('messages', [])
                last_message = messages[-1]['content'] if messages else ''
                
                # Simulate coder agent response
                response = {
                    "id": "chatcmpl-123",
                    "object": "chat.completion",
                    "created": 1694267176,
                    "model": "qwen-coder-7b",
                    "choices": [
                        {
                            "index": 0,
                            "message": {
                                "role": "assistant",
                                "content": f"🤖 DEEPSEEK CODER AGENT ONLINE\n\nCommand received: {last_message[:50]}...\n\nStatus: ✅ Ready for execution\nArchitecture: Dual-Brain System\n- DeepSeek R1: Thinking (Remote)\n- Qwen Coder: Execution (Local)\n\nAwaiting instructions from DeepSeek R1 for exact execution tasks."
                            },
                            "finish_reason": "stop"
                        }
                    ],
                    "usage": {
                        "prompt_tokens": 50,
                        "completion_tokens": 100,
                        "total_tokens": 150
                    }
                }
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(response).encode())
                
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                error_response = {"error": str(e)}
                self.wfile.write(json.dumps(error_response).encode())
        else:
            self.send_response(404)

if __name__ == '__main__':
    server = HTTPServer(('0.0.0.0', 8000), CoderAgentHandler)
    print("🚀 Starting DeepSeek Coder Agent Server")
    print("📍 Address: http://0.0.0.0:8000")
    print("📡 Models API: http://localhost:8000/v1/models")
    print("💬 Chat API: http://localhost:8000/v1/chat/completions")
    print("🧠 Dual-Brain Architecture: DeepSeek R1 (Thinking) + Qwen Coder (Execution)")
    server.serve_forever()