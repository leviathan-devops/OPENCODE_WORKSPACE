#!/usr/bin/env python3
"""
BRAIN BRIDGE for SHARK
Web-based DeepSeek Chat for complex thinking.
Local device optimized for code execution.
"""

import os
import sys
import json
import asyncio
import aiohttp
from typing import Dict, Any, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BrainBridge:
    """
    Bridge between local execution and web-based thinking.
    
    Strategy:
    1. Simple tasks → Local Qwen (fast, free)
    2. Complex thinking → Web DeepSeek (unlimited context)
    3. Code execution → Always local
    """
    
    def __init__(self):
        # Local TGI endpoints
        self.local_endpoints = {
            "qwen": "http://localhost:8080",
            "deepseek": "http://localhost:8081"
        }
        
        # Web DeepSeek API (for complex thinking)
        self.web_deepseek_url = "https://api.deepseek.com/v1"
        self.web_deepseek_key = os.getenv("DEEPSEEK_API_KEY", "")
        
        # Fallback to Ollama if TGI not ready
        self.ollama_url = "http://localhost:11434"
        
        # Decision thresholds
        self.complexity_threshold = 500  # characters
        self.thinking_keywords = [
            "plan", "design", "architecture", "research",
            "analyze", "strategy", "think", "consider",
            "evaluate", "compare", "propose", "recommend"
        ]
    
    async def analyze_complexity(self, query: str) -> Dict[str, Any]:
        """Analyze if query needs web-based thinking."""
        analysis = {
            "needs_web_thinking": False,
            "reason": "",
            "complexity_score": 0
        }
        
        # Length-based complexity
        if len(query) > self.complexity_threshold:
            analysis["complexity_score"] += 1
            analysis["reason"] = "Long query"
        
        # Keyword-based complexity
        query_lower = query.lower()
        keyword_count = sum(1 for kw in self.thinking_keywords if kw in query_lower)
        if keyword_count >= 2:
            analysis["complexity_score"] += 1
            analysis["reason"] = f"Contains {keyword_count} thinking keywords"
        
        # Specific patterns
        if any(pattern in query_lower for pattern in ["how should", "what is the best", "compare and contrast"]):
            analysis["complexity_score"] += 1
            analysis["reason"] = "Comparative/analytical query"
        
        # Decision
        analysis["needs_web_thinking"] = analysis["complexity_score"] >= 2
        
        return analysis
    
    async def think_with_web(self, query: str, context: str = "") -> str:
        """Use web DeepSeek for complex thinking."""
        if not self.web_deepseek_key:
            logger.warning("No DeepSeek API key, using local fallback")
            return await self.think_local(query, context)
        
        messages = []
        if context:
            messages.append({
                "role": "system",
                "content": f"Context: {context}\n\nYou are an expert AI engineer. Think deeply about this problem and provide a comprehensive analysis."
            })
        
        messages.append({
            "role": "user",
            "content": query
        })
        
        payload = {
            "model": "deepseek-chat",
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 4000,
            "stream": False
        }
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.web_deepseek_key}"
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.web_deepseek_url}/chat/completions",
                    json=payload,
                    headers=headers,
                    timeout=60
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data["choices"][0]["message"]["content"]
                    else:
                        logger.error(f"Web DeepSeek error: {response.status}")
                        return await self.think_local(query, context)
        except Exception as e:
            logger.error(f"Web DeepSeek connection error: {e}")
            return await self.think_local(query, context)
    
    async def think_local(self, query: str, context: str = "", model: str = "qwen") -> str:
        """Use local model for thinking."""
        endpoint = self.local_endpoints.get(model, self.local_endpoints["qwen"])
        
        # Try TGI first
        try:
            payload = {
                "inputs": f"{context}\n\n{query}" if context else query,
                "parameters": {
                    "max_new_tokens": 2048,
                    "temperature": 0.7,
                    "top_p": 0.95,
                    "do_sample": True
                }
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{endpoint}/generate",
                    json=payload,
                    timeout=30
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data["generated_text"]
        except Exception as e:
            logger.warning(f"TGI failed: {e}, falling back to Ollama")
        
        # Fallback to Ollama
        ollama_payload = {
            "model": "qwen2.5-coder:7b" if model == "qwen" else "deepseek-coder:6.7b",
            "prompt": f"{context}\n\n{query}" if context else query,
            "stream": False,
            "options": {
                "temperature": 0.7,
                "num_predict": 2048
            }
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.ollama_url}/api/generate",
                    json=ollama_payload,
                    timeout=30
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get("response", "")
        except Exception as e:
            logger.error(f"All local thinking failed: {e}")
            return "Thinking systems unavailable. Please try a simpler query."
    
    async def execute_code(self, code: str, language: str = "python") -> Dict[str, Any]:
        """Execute code locally (always local for safety)."""
        # This would be handled by Hermes directly
        # Brain bridge only does thinking, not execution
        return {
            "action": "execute_locally",
            "code": code,
            "language": language,
            "note": "Code execution handled by Hermes directly for safety"
        }
    
    async def process_query(self, query: str, context: str = "") -> Dict[str, Any]:
        """Main entry point: decide thinking strategy and execute."""
        logger.info(f"Processing query: {query[:100]}...")
        
        # Analyze complexity
        analysis = await self.analyze_complexity(query)
        
        result = {
            "query": query,
            "analysis": analysis,
            "thinking_method": "",
            "response": "",
            "execution_plan": ""
        }
        
        if analysis["needs_web_thinking"]:
            logger.info("Using web DeepSeek for complex thinking")
            result["thinking_method"] = "web_deepseek"
            result["response"] = await self.think_with_web(query, context)
            
            # Extract execution plan from thinking
            if "```python" in result["response"].lower():
                result["execution_plan"] = "Contains code for local execution"
            else:
                result["execution_plan"] = "Architecture/planning only"
        else:
            logger.info("Using local Qwen for execution-focused thinking")
            result["thinking_method"] = "local_qwen"
            result["response"] = await self.think_local(query, context, model="qwen")
            result["execution_plan"] = "Ready for immediate execution"
        
        return result

# Global instance
BRAIN_BRIDGE = BrainBridge()

async def main():
    """Test the brain bridge."""
    print("🧠 Testing SHARK Brain Bridge...")
    print("=" * 50)
    
    # Test queries
    test_queries = [
        ("Write a Python function to calculate factorial", "simple"),
        ("Design a microservices architecture for an e-commerce platform with 100k daily users. Consider scalability, fault tolerance, and database design.", "complex"),
        ("Debug this Python error: 'IndexError: list index out of range'", "debug"),
        ("Research the latest advancements in transformer architectures and propose an optimized design for code generation.", "research")
    ]
    
    for query, category in test_queries:
        print(f"\n📝 Query ({category}): {query[:80]}...")
        result = await BRAIN_BRIDGE.process_query(query)
        
        print(f"   Analysis: {result['analysis']['reason']}")
        print(f"   Thinking: {result['thinking_method']}")
        print(f"   Response preview: {result['response'][:100]}...")
        print(f"   Execution: {result['execution_plan']}")
        print()

if __name__ == "__main__":
    asyncio.run(main())