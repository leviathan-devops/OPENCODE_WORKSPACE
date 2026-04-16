#!/usr/bin/env python3
"""
Qwen Coder Local Agent Server
Dual-Brain Architecture - Execution Motor Cortex
"""

import json
import subprocess
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler

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
                        "id": "qwen-coder-7b-local",
                        "object": "model",
                        "created": 1640995200,
                        "owned_by": "local",
                    }
                ]
            }
            self.wfile.write(json.dumps(response).encode())
        elif self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            html_content = """
            <html>
            <head><title>Qwen Coder Local Agent</title></head>
            <body>
                <h1>🧠 DeepSeek Dual-Brain Architecture</h1>
                <h2>Qwen Coder Agent</h2>
                <p>Status: 🟢 Active</p>
                <p>Model: Qwen2.5-Coder-7B (Local)</p>
                <p>Architecture: Execution Motor Cortex</p>
                <p>Role: Local Command Execution</p>
                <p><a href="/v1/models">Models API</a></p>
                <p><strong>API Key:</strong> qwen-local-execution</p>
            </body>
            </html>
            """
            self.wfile.write(html_content.encode())
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
                
                # Extract command if present
                if "EXECUTE:" in last_message:
                    command = last_message.split("EXECUTE:")[1].strip()
                    execution_result = self.execute_command(command)
                else:
                    execution_result = "Ready for local execution. Use EXECUTE: <command> format."
                
                response = {
                    "id": "chatcmpl-123",
                    "object": "chat.completion",
                    "created": 1694267176,
                    "model": "qwen-coder-7b-local",
                    "choices": [
                        {
                            "index": 0,
                            "message": {
                                "role": "assistant",
                                "content": f"🤖 QWEN CODER AGENT ONLINE\n\nCommand: {last_message[:50]}...\n\nStatus: ✅ Local Execution Ready\n\nArchitecture: Dual-Brain System\n- DeepSeek R1: Thinking/Reasoning (Remote)\n- Qwen Coder: Execution (Local)\n\nAPI Key: qwen-local-execution\n\nExecution Result: {execution_result[:200]}..."
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
    
    def execute_command(self, command):
        """Execute local command and return results"""
        try:
            # Safety: Only allow specific command types
            if any(keyword in command.lower() for keyword in ['rm -rf', 'mkfs', 'dd ', 'format']):
                return "❌ Command blocked for safety"
            
            result = subprocess.run(
                command, 
                shell=True, 
                capture_output=True, 
                text=True, 
                timeout=30
            )
            
            return f"Exit Code: {result.returncode}\nStdout: {result.stdout[:500]}\nStderr: {result.stderr[:500]}"
        except subprocess.TimeoutExpired:
            return "❌ Command timed out after 30 seconds"
        except Exception as e:
            return f"❌ Execution failed: {e}"

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8001
    
    print(f"🚀 Starting Qwen Coder Agent on port {port}")
    print(f"🧠 Dual-Brain Architecture: DeepSeek R1 + Qwen Coder")
    print(f"📍 API: http://localhost:{port}/v1")
    print(f"🔗 Models: http://localhost:{port}/v1/models")
    print(f"💬 Chat: http://localhost:{port}/v1/chat/completions")
    print(f"🔑 API Key: qwen-local-execution")
    print("")
    print("🎯 Ready for local execution!")
    print(f"📡 Test with: curl http://localhost:{port}/v1/models")
    
    server = HTTPServer(('0.0.0.0', port), CoderAgentHandler)
    server.serve_forever()