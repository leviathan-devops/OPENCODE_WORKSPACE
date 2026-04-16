#!/usr/bin/env python3
"""
Flask-based proxy that fixes max_tokens issue for vLLM.
"""

from flask import Flask, request, jsonify
import requests
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Target vLLM server
VLLM_URL = "http://localhost:8000"

@app.route('/v1/models', methods=['GET'])
def get_models():
    """Handle /v1/models request - return modified model info."""
    try:
        # Forward to vLLM
        headers = {'Authorization': request.headers.get('Authorization', '')}
        response = requests.get(f"{VLLM_URL}/v1/models", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            
            # Modify max_model_len to 8192 so Qwen Code thinks it can handle 8192
            if 'data' in data and len(data['data']) > 0:
                for model in data['data']:
                    if model['id'] == 'qwen-coder-14b':
                        model['max_model_len'] = 8192
                        logger.info(f"Modified max_model_len to 8192 for qwen-coder-14b")
            
            return jsonify(data), 200
        else:
            return jsonify(response.json()), response.status_code
            
    except Exception as e:
        logger.error(f"Error in /v1/models: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/v1/chat/completions', methods=['POST'])
def chat_completions():
    """Handle /v1/chat/completions request - modify max_tokens."""
    try:
        # Get request data
        data = request.json
        
        # Log the request
        logger.info(f"Received request for model: {data.get('model', 'unknown')}")
        
        # Check if max_tokens is 8192 and modify it to 3072
        if 'max_tokens' in data and data['max_tokens'] == 8192:
            logger.info(f"Modifying max_tokens from 8192 to 3072")
            data['max_tokens'] = 3072
        
        # Forward to vLLM
        headers = dict(request.headers)
        response = requests.post(
            f"{VLLM_URL}/v1/chat/completions",
            headers=headers,
            json=data
        )
        
        return jsonify(response.json()), response.status_code
        
    except Exception as e:
        logger.error(f"Error in /v1/chat/completions: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    logger.info(f"Starting vLLM proxy on port 8001")
    logger.info(f"Forwarding to vLLM at {VLLM_URL}")
    logger.info(f"Will modify max_tokens: 8192 -> 3072")
    logger.info(f"Will modify max_model_len: 4096 -> 8192 (in /v1/models response)")
    app.run(host='localhost', port=8001, debug=False)