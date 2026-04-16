#!/usr/bin/env python3
"""
Simple HTTP proxy for vLLM that caps max_tokens to 3072.
This allows Qwen Code to send max_tokens=8192 while vLLM receives 3072.
"""

import json
import http.server
import socketserver
import urllib.request
import urllib.error

TARGET_HOST = "http://localhost:8000"
MAX_TOKENS_CAP = 3072  # Cap max_tokens to this value
PORT = 8001  # Proxy port (matches .qwen-switch-real.sh)

class VLLMProxyHandler(http.server.BaseHTTPRequestHandler):
    def do_POST(self):
        # Read request body
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)
        
        # Parse and modify JSON
        try:
            data = json.loads(body.decode('utf-8'))
            original_max_tokens = data.get('max_tokens')
            
            # Cap max_tokens if present
            if original_max_tokens is not None and original_max_tokens > MAX_TOKENS_CAP:
                data['max_tokens'] = MAX_TOKENS_CAP
                print(f"[Proxy] Capped max_tokens: {original_max_tokens} -> {MAX_TOKENS_CAP}")
            
            body = json.dumps(data).encode('utf-8')
        except json.JSONDecodeError:
            pass  # Pass through non-JSON requests
        
        # Forward to vLLM
        url = f"{TARGET_HOST}{self.path}"
        req = urllib.request.Request(url, data=body, method='POST')
        
        # Copy headers (except host)
        for key, value in self.headers.items():
            if key.lower() != 'host':
                req.add_header(key, value)
        
        try:
            with urllib.request.urlopen(req, timeout=120) as response:
                # Send response back to client
                self.send_response(response.status)
                for key, value in response.headers.items():
                    if key.lower() not in ['transfer-encoding', 'content-encoding']:
                        self.send_header(key, value)
                self.end_headers()
                self.wfile.write(response.read())
        except urllib.error.HTTPError as e:
            self.send_response(e.code)
            for key, value in e.headers.items():
                self.send_header(key, value)
            self.end_headers()
            self.wfile.write(e.read())
        except Exception as e:
            self.send_error(502, f"Proxy error: {str(e)}")
    
    def do_GET(self):
        # Forward GET requests (health checks, etc.)
        url = f"{TARGET_HOST}{self.path}"
        req = urllib.request.Request(url, method='GET')
        
        for key, value in self.headers.items():
            if key.lower() != 'host':
                req.add_header(key, value)
        
        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                self.send_response(response.status)
                for key, value in response.headers.items():
                    self.send_header(key, value)
                self.end_headers()
                self.wfile.write(response.read())
        except Exception as e:
            self.send_error(502, f"Proxy error: {str(e)}")
    
    def log_message(self, format, *args):
        print(f"[Proxy] {args[0]}")

class ReuseAddrServer(socketserver.TCPServer):
    allow_reuse_address = True

if __name__ == "__main__":
    with ReuseAddrServer(("", PORT), VLLMProxyHandler) as httpd:
        print(f"vLLM Proxy running on port {PORT}")
        print(f"Qwen Code should connect to http://localhost:{PORT}")
        print(f"max_tokens will be capped at {MAX_TOKENS_CAP}")
        print("Press Ctrl+C to stop")
        httpd.serve_forever()
