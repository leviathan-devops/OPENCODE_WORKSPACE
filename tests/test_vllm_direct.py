#!/usr/bin/env python3
"""
Test vLLM directly without API server first
"""
import torch
from vllm import LLM, SamplingParams
import time

print("Testing vLLM directly with Qwen2.5-Coder-7B...")

# Try to load model with minimal memory
try:
    llm = LLM(
        model="Qwen/Qwen2.5-Coder-7B-Instruct",
        gpu_memory_utilization=0.6,
        max_model_len=1024,
        enforce_eager=True,
        tensor_parallel_size=1,
        trust_remote_code=True
    )
    
    print("Model loaded successfully!")
    
    # Test inference
    sampling_params = SamplingParams(
        temperature=0.1,
        max_tokens=50
    )
    
    prompts = [
        "Write a Python function to add two numbers:"
    ]
    
    outputs = llm.generate(prompts, sampling_params)
    
    for output in outputs:
        generated_text = output.outputs[0].text
        print(f"Generated: {generated_text[:100]}...")
        
    print("\n✅ vLLM is working correctly!")
    
except torch.cuda.OutOfMemoryError as e:
    print(f"❌ Out of memory: {e}")
    print("Trying with quantization...")
    
    # Try with AWQ model
    try:
        llm = LLM(
            model="Qwen/Qwen2.5-Coder-14B-Instruct-AWQ",
            quantization="awq",
            gpu_memory_utilization=0.7,
            max_model_len=1024,
            enforce_eager=True,
            tensor_parallel_size=1,
            trust_remote_code=True
        )
        
        print("AWQ model loaded successfully!")
        
        # Test inference
        sampling_params = SamplingParams(
            temperature=0.1,
            max_tokens=50
        )
        
        prompts = ["Write a Python function to add two numbers:"]
        outputs = llm.generate(prompts, sampling_params)
        
        for output in outputs:
            generated_text = output.outputs[0].text
            print(f"Generated: {generated_text[:100]}...")
            
        print("\n✅ AWQ model is working correctly!")
        
    except Exception as e:
        print(f"❌ Error with AWQ model: {e}")
        
except Exception as e:
    print(f"❌ Error: {e}")