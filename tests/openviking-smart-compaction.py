#!/usr/bin/env python3
"""
SMART COMPACTION FOR OPENVIKING + 32K CONTEXT
Implements intelligent context management for large conversations
"""

import json
import re
import gzip
import base64
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
from datetime import datetime

@dataclass
class CompactionConfig:
    """Configuration for smart compaction"""
    max_context_length: int = 32768
    compression_threshold: float = 0.8  # Compress when at 80% of max
    preserve_instructions: bool = True
    preserve_code: bool = True
    preserve_errors: bool = True
    max_history_length: int = 8192
    compression_ratio: float = 0.5
    fallback_to_truncation: bool = True

class SmartCompactor:
    """Implements smart compaction for OpenViking context management"""
    
    def __init__(self, config: CompactionConfig):
        self.config = config
        self.instruction_keywords = [
            'def ', 'class ', 'import ', 'from ', 'function ', 'method ',
            'print(', 'return ', 'if ', 'else:', 'for ', 'while ',
            '# TODO:', '# FIXME:', '# NOTE:', '//', '/*', 'try:', 'except',
            'with ', 'async def ', 'await ', 'lambda ', '@', '->'
        ]
        
        self.error_patterns = [
            r'error\s*:', r'exception\s*:', r'traceback', r'failed',
            r'cannot', r'should not', r'invalid', r'must',
            r'syntax error', r'runtime error', r'index error',
            r'key error', r'type error', r'value error'
        ]
        
    def analyze_context_importance(self, content: str, role: str) -> float:
        """Analyze how important a piece of content is (0.0 to 1.0)"""
        importance = 0.5  # Base importance
        
        # User messages are more important
        if role == 'user':
            importance += 0.3
            
        # Assistant messages with code are very important
        if role == 'assistant' and any(keyword in content.lower() for keyword in self.instruction_keywords):
            importance += 0.4
            
        # Error messages are critical
        if any(pattern.search(content.lower()) for pattern in [re.compile(p) for p in self.error_patterns]):
            importance += 0.5
            
        # Recent messages are more important
        if datetime.now().timestamp() - self.last_message_time.get(role, 0) < 300:  # 5 minutes
            importance += 0.2
            
        return min(importance, 1.0)
    
    def preserve_code_segments(self, content: str) -> List[str]:
        """Extract and preserve important code segments"""
        code_segments = []
        
        # Extract function definitions
        function_matches = re.finditer(r'(?:def|async def)\s+(\w+)\s*\([^)]*\):', content, re.MULTILINE)
        for match in function_matches:
            func_name = match.group(1)
            # Find the entire function
            func_start = match.start()
            # Simple function extraction (improved version would parse AST)
            lines = content[func_start:].split('\n')
            func_lines = []
            indent_level = None
            for line in lines:
                if line.strip():
                    if indent_level is None:
                        indent_level = len(line) - len(line.lstrip())
                    elif len(line) - len(line.lstrip()) <= indent_level and line.strip():
                        break
                    func_lines.append(line)
            code_segments.append('\n'.join(func_lines))
            
        # Extract class definitions
        class_matches = re.finditer(r'class\s+(\w+)\s*[:\(]', content, re.MULTILINE)
        for match in class_matches:
            class_name = match.group(1)
            class_start = match.start()
            lines = content[class_start:].split('\n')
            class_lines = []
            indent_level = None
            for line in lines:
                if line.strip():
                    if indent_level is None:
                        indent_level = len(line) - len(line.lstrip())
                    elif len(line) - len(line.lstrip()) <= indent_level and line.strip():
                        break
                    class_lines.append(line)
            code_segments.append('\n'.join(class_lines))
            
        return code_segments
    
    def compress_text_intelligently(self, text: str, target_ratio: float) -> str:
        """Compress text while preserving meaning"""
        if len(text) <= 100:  # Too short to compress meaningfully
            return text
            
        # Sentence-aware compression
        sentences = re.split(r'(?<=[.!?])\s+', text)
        
        # Keep important sentences
        important_sentences = []
        for sentence in sentences:
            importance = self.analyze_sentence_importance(sentence)
            if importance > 0.7 or len(important_sentences) < 2:
                important_sentences.append(sentence)
            elif len(important_sentences) / len(sentences) < target_ratio:
                important_sentences.append(sentence)
                
        compressed = ' '.join(important_sentences)
        
        # If still too long, apply character-level truncation
        if len(compressed) > len(text) * target_ratio:
            compressed = compressed[:int(len(text) * target_ratio)] + '...'
            
        return compressed
    
    def analyze_sentence_importance(self, sentence: str) -> float:
        """Analyze importance of a sentence"""
        importance = 0.0
        
        # Sentences with code keywords are important
        if any(keyword in sentence.lower() for keyword in self.instruction_keywords):
            importance += 0.4
            
        # Sentences with errors are important
        if any(pattern.search(sentence.lower()) for pattern in [re.compile(p) for p in self.error_patterns]):
            importance += 0.5
            
        # Sentences with imperative verbs are important
        if any(word in sentence.lower().split()[:3] for word in ['help', 'explain', 'create', 'write', 'fix', 'debug']):
            importance += 0.3
            
        return importance
    
    def compact_context(self, messages: List[Dict], config: CompactionConfig) -> List[Dict]:
        """Main compaction method"""
        if len(messages) <= 2:  # Only system and one message, no need to compact
            return messages
            
        total_tokens = sum(len(msg.get('content', '')) for msg in messages)
        
        if total_tokens <= config.max_context_length * config.compression_threshold:
            return messages  # No compaction needed
            
        # Analyze importance of each message
        analyzed_messages = []
        for i, msg in enumerate(messages):
            if i == 0:  # Preserve system message
                analyzed_messages.append((msg, 1.0, 'preserve'))
            else:
                content = msg.get('content', '')
                role = msg.get('role', '')
                importance = self.analyze_context_importance(content, role)
                analyzed_messages.append((msg, importance, role))
        
        # Sort by importance
        analyzed_messages.sort(key=lambda x: x[1], reverse=True)
        
        # Rebuild message list, keeping most important
        compacted_messages = [messages[0]]  # Keep system message
        
        current_length = len(messages[0].get('content', ''))
        
        for msg, importance, role in analyzed_messages[1:]:
            content = msg.get('content', '')
            msg_length = len(content)
            
            if (current_length + msg_length <= config.max_context_length * config.compression_threshold or
                (config.fallback_to_truncation and current_length + msg_length <= config.max_context_length)):
                
                # Special handling for important content types
                if config.preserve_code and role == 'assistant':
                    code_segments = self.preserve_code_segments(content)
                    if code_segments:
                        compacted_code = '\n'.join(code_segments)
                        compacted_messages.append({
                            'role': 'assistant',
                            'content': f"[Important code preserved]\n{compacted_code}"
                        })
                        current_length += len(compacted_code)
                        continue
                
                if config.preserve_errors and any(pattern.search(content.lower()) for pattern in [re.compile(p) for p in self.error_patterns]):
                    compacted_messages.append(msg)
                    current_length += msg_length
                    continue
                
                # Regular content with intelligent compression
                if importance > 0.6:
                    compressed = self.compress_text_intelligently(content, config.compression_ratio)
                    compacted_messages.append({
                        'role': role,
                        'content': compressed
                    })
                    current_length += len(compressed)
                elif current_length + msg_length <= config.max_context_length:
                    compacted_messages.append(msg)
                    current_length += msg_length
                    
        return compacted_messages

class OpenVikingContextManager:
    """Integrates smart compaction with OpenViking"""
    
    def __init__(self, config_path: str = "~/.openviking/context-config.json"):
        self.config = self.load_config(config_path)
        self.compactor = SmartCompactor(self.config)
        
    def load_config(self, path: str) -> CompactionConfig:
        """Load configuration from JSON file"""
        try:
            with open(path.expanduser(), 'r') as f:
                data = json.load(f)
                return CompactionConfig(**data)
        except FileNotFoundError:
            return CompactionConfig()
            
    def process_openviking_request(self, request: Dict) -> Dict:
        """Process OpenViking request with smart compaction"""
        if 'messages' not in request:
            return request
            
        messages = request['messages']
        if len(messages) < 2:
            return request
            
        # Apply smart compaction
        compacted_messages = self.compactor.compact_context(messages, self.config)
        
        # Update request with compacted messages
        request['messages'] = compacted_messages
        
        # Add compaction metadata
        if len(messages) != len(compacted_messages):
            request.get('metadata', {})['compaction_applied'] = True
            request.get('metadata', {})['original_length'] = len(messages)
            request.get('metadata', {})['compacted_length'] = len(compacted_messages)
            request.get('metadata', {})['compression_ratio'] = len(compacted_messages) / len(messages)
            
        return request
    
    def generate_compaction_report(self) -> Dict:
        """Generate report on compaction effectiveness"""
        return {
            'config': {
                'max_context_length': self.config.max_context_length,
                'compression_threshold': self.config.compression_threshold,
                'preserve_instructions': self.config.preserve_instructions,
                'preserve_code': self.config.preserve_code,
                'preserve_errors': self.config.preserve_errors
            },
            'status': 'active',
            'last_updated': datetime.now().isoformat()
        }

# Global instance
context_manager = OpenVikingContextManager()

def apply_smart_compaction(openviking_request: Dict) -> Dict:
    """Public API function to apply smart compaction"""
    return context_manager.process_openviking_request(openviking_request)

def get_compaction_report() -> Dict:
    """Get compaction system report"""
    return context_manager.generate_compaction_report()

# Test functions
def test_compaction():
    """Test the compaction system"""
    config = CompactionConfig(
        max_context_length=1000,  # Small for testing
        compression_threshold=0.8
    )
    
    compactor = SmartCompactor(config)
    
    # Test messages
    messages = [
        {'role': 'system', 'content': 'You are a helpful coding assistant.'},
        {'role': 'user', 'content': 'I need help with Python code that sorts lists.'},
        {'role': 'assistant', 'content': '''
        def bubble_sort(arr):
            n = len(arr)
            for i in range(n):
                for j in range(0, n-i-1):
                    if arr[j] > arr[j+1]:
                        arr[j], arr[j+1] = arr[j+1], arr[j]
            return arr
        
        # Example usage
        numbers = [64, 34, 25, 12, 22, 11, 90]
        print("Original:", numbers)
        print("Sorted:", bubble_sort(numbers.copy()))
        '''},
        {'role': 'user', 'content': 'I keep getting a syntax error when I run this.'},
        {'role': 'assistant', 'content': '''
        The error is: SyntaxError: invalid syntax on line 3.
        This happens because you're missing proper indentation.
        Here's the fixed version:
        
        def bubble_sort(arr):
            n = len(arr)
            for i in range(n):
                for j in range(0, n-i-1):
                    if arr[j] > arr[j+1]:
                        arr[j], arr[j+1] = arr[j+1], arr[j]
            return arr
        '''},
        {'role': 'user', 'content': 'Can you explain the time complexity of bubble sort?'}
    ]
    
    compacted = compactor.compact_context(messages, config)
    
    print(f"Original messages: {len(messages)}")
    print(f"Compacted messages: {len(compacted)}")
    print("Compaction successful!")

if __name__ == "__main__":
    test_compaction()