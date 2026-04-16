#!/usr/bin/env python3
"""
Simple synchronous proxy that fixes max_tokens issue for vLLM.
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import requests
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Target vLLM server
VLLM_URL = "http://localhost:8000"
PROXY_PORT = 8001

class VLLMProxyHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Handle GET requests (e.g., /v1/models)."""
        if self.path == '/v1/models':
            try:
                # Forward to vLLM
                response = requests.get(f"{VLLM_URL}{self.path}")
                
                # Modify the response
                if response.status_code == 200:
                    data = response.json()
                    
                    # Modify max_model_len to 8192 so Qwen Code thinks it can handle 8192
                    if 'data' in data and len(data['data']) > 0:
                        for model in data['data']:
                            if model['id'] == 'qwen-coder-14b':
                                model['max_model_len'] = 8192
                                logger.info(f"Modified max_model_len to 8192 for qwen-coder-14b")
                    
                    # Send modified response
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps(data).encode())
                else:
                    # Forward error
                    self.send_response(response.status_code)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(response.content)
                    
            except Exception as e:
                logger.error(f"Error in GET request: {e}")
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode())
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_POST(self):
        """Handle POST requests (e.g., /v1/chat/completions)."""
        if self.path == '/v1/chat/completions':
            try:
                # Read request body
                content_length = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(content_length)
                data = json.loads(body)
                
                # Log the request
                logger.info(f"Received request for model: {data.get('model', 'unknown')}")
                
                # Check if max_tokens is 8192 and modify it to 3072
                if 'max_tokens' in data and data['max_tokens'] == 8192:
                    logger.info(f"Modifying max_tokens from 8192 to 3072")
                    data['max_tokens'] = 3072
                
                # Forward to vLLM
                headers = dict(self.headers)
                headers['Content-Type'] = 'application/json'
                headers['Content-Length'] = str(len(json.dumps(data)))
                
                response = requests.post(
                    f"{VLLM_URL}{self.path}",
                    headers=headers,
                    json=data
                )
                
                # Forward response
                self.send_response(response.status_code)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(response.content)
                
            except json.JSONDecodeError:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Invalid JSON"}).encode())
            except Exception as e:
                logger.error(f"Error in POST request: {e}")
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode())
        else:
            self.send_response(404)
            self.end_headers()
    
    def log_message(self, format, *args):
        """Override to use our logger."""
        logger.info(format % args)

def main():
    """Start the proxy server."""
    server = HTTPServer(('localhost', PROXY_PORT), VLLMProxyHandler)
    logger.info(f"Starting vLLM proxy on port {PROXY_PORT}")
    logger.info(f"Forwarding to vLLM at {VLLM_URL}")
    logger.info(f"Will modify max_tokens: 8192 -> 3072")
    logger.info(f"Will modify max_model_len: 4096 -> 8192 (in /v1/models response)")
    logger.info(f"Press Ctrl+C to stop")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info("Shutting down proxy server")
        server.server_close()

if __name__ == '__main__':
    main()