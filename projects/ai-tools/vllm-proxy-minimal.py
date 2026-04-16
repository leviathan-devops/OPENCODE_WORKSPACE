#!/usr/bin/env python3
"""
Minimal vLLM proxy that fixes max_tokens issue.
"""

import json
import logging
from http.server import HTTPServer, BaseHTTPRequestHandler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

VLLM_URL = "http://localhost:8000"
PORT = 8001

class ProxyHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/v1/models':
            self.handle_models()
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_POST(self):
        if self.path == '/v1/chat/completions':
            self.handle_chat_completions()
        else:
            self.send_response(404)
            self.end_headers()
    
    def handle_models(self):
        try:
            import urllib.request
            import urllib.error
            
            # Forward to vLLM
            req = urllib.request.Request(
                f"{VLLM_URL}/v1/models",
                headers={'Authorization': self.headers.get('Authorization', '')}
            )
            
            with urllib.request.urlopen(req) as response:
                data = json.loads(response.read().decode())
                
                # Modify max_model_len
                if 'data' in data:
                    for model in data['data']:
                        if model['id'] == 'qwen-coder-14b':
                            model['max_model_len'] = 8192
                            logger.info("Modified max_model_len to 8192")
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(data).encode())
                
        except Exception as e:
            logger.error(f"Error in handle_models: {e}")
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())
    
    def handle_chat_completions(self):
        try:
            import urllib.request
            import urllib.error
            
            # Read request
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body)
            
            # Modify max_tokens
            if 'max_tokens' in data and data['max_tokens'] == 8192:
                logger.info(f"Modifying max_tokens from 8192 to 3072")
                data['max_tokens'] = 3072
            
            # Forward to vLLM
            req = urllib.request.Request(
                f"{VLLM_URL}/v1/chat/completions",
                data=json.dumps(data).encode(),
                headers={
                    'Authorization': self.headers.get('Authorization', ''),
                    'Content-Type': 'application/json'
                },
                method='POST'
            )
            
            with urllib.request.urlopen(req) as response:
                response_data = response.read()
                
                self.send_response(response.code)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(response_data)
                
        except Exception as e:
            logger.error(f"Error in handle_chat_completions: {e}")
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())
    
    def log_message(self, format, *args):
        logger.info(format % args)

def main():
    server = HTTPServer(('localhost', PORT), ProxyHandler)
    logger.info(f"Starting vLLM proxy on port {PORT}")
    logger.info(f"Forwarding to vLLM at {VLLM_URL}")
    logger.info(f"Will modify max_tokens: 8192 -> 3072")
    logger.info(f"Will modify max_model_len: 4096 -> 8192")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info("Shutting down")
        server.server_close()

if __name__ == '__main__':
    main()